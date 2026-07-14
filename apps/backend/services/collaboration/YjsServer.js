/**
 * YjsServer — WebSocket server for Yjs CRDT document synchronization.
 *
 * Handles real-time collaborative editing by relaying Yjs sync messages
 * between connected clients. Each "room" maps to a flow ID.
 *
 * Architecture:
 *   - Runs on the same HTTP server as Express/Socket.IO via `upgrade` event
 *   - Uses `/collab/:flowId` path to avoid conflicts with Socket.IO
 *   - Persists documents to LevelDB for server-side durability
 *   - Relays Awareness protocol for cursor/presence data
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { LeveldbPersistence } from 'y-leveldb';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../supabaseClient.js';
import { User, Project, Flow, CollaboratorRole } from '../../database/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Message type constants (must match y-websocket protocol)
const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

/**
 * @typedef {Object} Room
 * @property {Y.Doc} doc - The Yjs document
 * @property {awarenessProtocol.Awareness} awareness - Awareness instance
 * @property {Set<WebSocket>} conns - Connected WebSocket clients
 */

class YjsCollaborationServer {
    constructor() {
        /** @type {Map<string, Room>} */
        this.rooms = new Map();

        /** @type {WebSocketServer | null} */
        this.wss = null;

        /** @type {LeveldbPersistence | null} */
        this.persistence = null;

        /** @type {boolean} */
        this.isInitialized = false;
    }

    /**
     * Initialize the collaboration server on an existing HTTP server.
     * @param {import('http').Server} httpServer
     * @param {Object} [options]
     * @param {string} [options.storagePath] - Path for LevelDB persistence
     */
    init(httpServer, options = {}) {
        if (this.isInitialized) {
            console.warn('[YjsServer] Already initialized, skipping.');
            return;
        }

        const storagePath = options.storagePath || path.join(__dirname, '../../storage/yjs-docs');

        // Initialize LevelDB persistence
        try {
            this.persistence = new LeveldbPersistence(storagePath);
            console.log(`[YjsServer] 💾 LevelDB persistence initialized at: ${storagePath}`);
        } catch (err) {
            console.error('[YjsServer] ❌ Failed to initialize LevelDB persistence:', err.message);
            console.warn('[YjsServer] ⚠️ Running without persistence (in-memory only).');
            this.persistence = null;
        }

        // Create WebSocket server in "noServer" mode (we handle upgrades manually)
        this.wss = new WebSocketServer({ noServer: true });

        // Handle HTTP upgrade requests for the /collab/ path
        httpServer.on('upgrade', (request, socket, head) => {
            const url = request.url || '';

            // Only handle /collab/ paths — let Socket.IO handle everything else
            if (url.startsWith('/collab/')) {
                const roomName = url.replace('/collab/', '').split('?')[0];

                if (!roomName) {
                    socket.destroy();
                    return;
                }

                // Parse token and userId from URL query parameters
                let token = '';
                let userId = '';
                try {
                    const parsedUrl = new URL(
                        request.url,
                        `http://${request.headers.host || 'localhost'}`,
                    );
                    token = parsedUrl.searchParams.get('token') || '';
                    userId = parsedUrl.searchParams.get('userId') || '';
                } catch (e) {
                    console.warn(
                        '[YjsServer] Failed to parse upgrade URL query parameters:',
                        e.message,
                    );
                }

                this.authenticateUpgrade(token, userId, roomName)
                    .then((authResult) => {
                        if (!authResult.success) {
                            console.warn(`[YjsServer] 🚫 Upgrade denied: ${authResult.message}`);
                            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                            socket.destroy();
                            return;
                        }

                        this.wss.handleUpgrade(request, socket, head, (ws) => {
                            ws.userRole = authResult.role;
                            ws.userId = authResult.userId;
                            this._onConnection(ws, roomName);
                        });
                    })
                    .catch((err) => {
                        console.error('[YjsServer] Auth error during connection upgrade:', err);
                        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
                        socket.destroy();
                    });
            }
            // Note: Socket.IO handles its own upgrade via its attach() method,
            // so we don't need an else clause here
        });

        this.isInitialized = true;
        console.log('🤝 [YjsServer] Collaboration WebSocket server ready on /collab/:flowId');
    }

    /**
     * Authenticate connection upgrade and resolve user project role.
     * @param {string} token
     * @param {string} userId
     * @param {string} roomName
     * @returns {Promise<{ success: boolean, role?: string, userId?: string, message?: string }>}
     */
    async authenticateUpgrade(token, userId, roomName) {
        if (process.env.COLLAB_ENABLED === 'false') {
            return { success: false, message: 'Collaboration server is disabled' };
        }

        const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        const isAuthDisabled =
            process.env.AUTH_ENABLED === 'false' || process.env.VITE_AUTH_ENABLED === 'false';
        const isLocalMode =
            process.env.HALTEST_MODE === 'local' || process.env.HAL_CLI_MODE === 'true';

        let resolvedUser = null;

        if (
            (isDev && isAuthDisabled) ||
            isLocalMode ||
            token === 'local-dev-token' ||
            token === 'local-guest-token'
        ) {
            resolvedUser = {
                id: userId || 'guest-user',
                email: 'guest@haltest.dev',
                role: 'guest',
            };
        } else {
            if (!token) {
                return { success: false, message: 'Missing token' };
            }
            try {
                const {
                    data: { user },
                    error,
                } = await supabase.auth.getUser(token);

                if (error || !user) {
                    return { success: false, message: 'Invalid token' };
                }

                // Ensure user exists in SQLite User table
                await User.findOrCreate({
                    where: { id: user.id },
                    defaults: {
                        email: user.email,
                        name: user.user_metadata?.full_name || user.email.split('@')[0],
                        role: 'user',
                    },
                });

                resolvedUser = user;
            } catch (err) {
                console.error('[YjsServer] Auth resolution error:', err);
                return { success: false, message: 'Authentication service error' };
            }
        }

        // Determine Role based on Project and CollaboratorRole
        try {
            const flowId = roomName.replace('flow-', '');
            const flow = await Flow.findByPk(flowId);
            if (!flow) {
                return { success: false, message: 'Flow not found' };
            }

            const projectId = flow.projectId || flow.project_id;
            const project = await Project.findByPk(projectId);
            if (!project) {
                return { success: false, message: 'Project not found' };
            }

            // If local bypass or if the user is project owner, they are 'owner'
            if ((isDev && isAuthDisabled) || isLocalMode || project.userId === resolvedUser.id) {
                return { success: true, role: 'owner', userId: resolvedUser.id };
            }

            // Lookup CollaboratorRole table
            const collab = await CollaboratorRole.findOne({
                where: { projectId, userId: resolvedUser.id },
            });

            if (collab) {
                return { success: true, role: collab.role, userId: resolvedUser.id };
            }

            // Default to viewer for authenticated users
            return { success: true, role: 'viewer', userId: resolvedUser.id };
        } catch (err) {
            console.error('[YjsServer] Role resolution error:', err);
            return { success: false, message: 'Role verification error' };
        }
    }

    /**
     * Get or create a room for the given flow ID.
     * @param {string} roomName - The flow ID
     * @returns {Promise<Room>}
     */
    async _getOrCreateRoom(roomName) {
        if (this.rooms.has(roomName)) {
            return this.rooms.get(roomName);
        }

        const doc = new Y.Doc();

        // Load persisted state if available
        if (this.persistence) {
            try {
                const persistedDoc = await this.persistence.getYDoc(roomName);
                const stateVector = Y.encodeStateAsUpdate(persistedDoc);
                Y.applyUpdate(doc, stateVector);
                console.log(`[YjsServer] 📂 Loaded persisted document for room: ${roomName}`);
            } catch (err) {
                console.warn(
                    `[YjsServer] ⚠️ No persisted state for room ${roomName}:`,
                    err.message,
                );
            }
        }

        // Set up persistence on document updates
        doc.on('update', (update) => {
            if (this.persistence) {
                this.persistence.storeUpdate(roomName, update).catch((err) => {
                    console.error(
                        `[YjsServer] ❌ Failed to persist update for room ${roomName}:`,
                        err.message,
                    );
                });
            }
        });

        const awareness = new awarenessProtocol.Awareness(doc);

        // Clean up awareness states when clients disconnect
        awareness.on('update', ({ added, updated, removed }) => {
            const room = this.rooms.get(roomName);
            if (!room) return;

            const changedClients = added.concat(updated).concat(removed);
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, MSG_AWARENESS);
            encoding.writeVarUint8Array(
                encoder,
                awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
            );
            const message = encoding.toUint8Array(encoder);

            // Broadcast awareness update to all connected clients in the room
            room.conns.forEach((conn) => {
                if (conn.readyState === WebSocket.OPEN) {
                    conn.send(message);
                }
            });
        });

        const room = { doc, awareness, conns: new Set() };
        this.rooms.set(roomName, room);

        console.log(`[YjsServer] 🏠 Room created: ${roomName}`);
        return room;
    }

    /**
     * Handle a new WebSocket connection to a room.
     * @param {WebSocket} conn
     * @param {string} roomName
     */
    async _onConnection(conn, roomName) {
        const room = await this._getOrCreateRoom(roomName);
        room.conns.add(conn);

        const peerCount = room.conns.size;
        console.log(`[YjsServer] 👤 Client connected to room "${roomName}" (${peerCount} peers)`);

        // Send initial sync (step 1)
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        syncProtocol.writeSyncStep1(encoder, room.doc);
        conn.send(encoding.toUint8Array(encoder));

        // Send full sync state (step 2)
        const encoder2 = encoding.createEncoder();
        encoding.writeVarUint(encoder2, MSG_SYNC);
        syncProtocol.writeSyncStep2(encoder2, room.doc);
        conn.send(encoding.toUint8Array(encoder2));

        // Send current awareness states
        const awarenessStates = room.awareness.getStates();
        if (awarenessStates.size > 0) {
            const encoderAwareness = encoding.createEncoder();
            encoding.writeVarUint(encoderAwareness, MSG_AWARENESS);
            encoding.writeVarUint8Array(
                encoderAwareness,
                awarenessProtocol.encodeAwarenessUpdate(
                    room.awareness,
                    Array.from(awarenessStates.keys()),
                ),
            );
            conn.send(encoding.toUint8Array(encoderAwareness));
        }

        // Handle incoming messages
        conn.on('message', (data) => {
            try {
                const message = new Uint8Array(data);
                this._handleMessage(conn, room, roomName, message);
            } catch (err) {
                console.error(
                    `[YjsServer] ❌ Error handling message in room "${roomName}":`,
                    err.message,
                );
            }
        });

        conn.on('close', () => {
            room.conns.delete(conn);
            const remaining = room.conns.size;
            console.log(
                `[YjsServer] 👤 Client disconnected from room "${roomName}" (${remaining} peers remaining)`,
            );

            // Clean up empty rooms after a delay (allow reconnection)
            if (remaining === 0) {
                setTimeout(() => {
                    const currentRoom = this.rooms.get(roomName);
                    if (currentRoom && currentRoom.conns.size === 0) {
                        currentRoom.awareness.destroy();
                        this.rooms.delete(roomName);
                        console.log(`[YjsServer] 🧹 Room destroyed (empty): ${roomName}`);
                    }
                }, 30000); // 30 second grace period
            }
        });

        conn.on('error', (err) => {
            console.error(`[YjsServer] ❌ WebSocket error in room "${roomName}":`, err.message);
        });
    }

    /**
     * Process an incoming Yjs protocol message.
     * @param {WebSocket} conn - The sending client
     * @param {Room} room
     * @param {string} roomName
     * @param {Uint8Array} message
     */
    _handleMessage(conn, room, roomName, message) {
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
            case MSG_SYNC: {
                // Check if viewer client is attempting to write updates
                const checkDecoder = decoding.createDecoder(message);
                decoding.readVarUint(checkDecoder); // consume messageType
                const syncType = decoding.readVarUint(checkDecoder);

                if (conn.userRole === 'viewer' && syncType !== 0) {
                    console.warn(
                        `[YjsServer] 🚫 Blocked write sync from viewer (UserId: ${conn.userId})`,
                    );
                    break;
                }

                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, MSG_SYNC);
                syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn);

                const response = encoding.toUint8Array(encoder);
                // Send sync response back to the originating client if there's a reply
                if (encoding.length(encoder) > 1) {
                    conn.send(response);
                }

                // Broadcast the update to all OTHER clients in the room
                room.conns.forEach((otherConn) => {
                    if (otherConn !== conn && otherConn.readyState === WebSocket.OPEN) {
                        otherConn.send(message);
                    }
                });
                break;
            }

            case MSG_AWARENESS: {
                awarenessProtocol.applyAwarenessUpdate(
                    room.awareness,
                    decoding.readVarUint8Array(decoder),
                    conn,
                );
                break;
            }

            default:
                console.warn(
                    `[YjsServer] ⚠️ Unknown message type ${messageType} in room "${roomName}"`,
                );
        }
    }

    /**
     * Get statistics about active rooms.
     * @returns {{ rooms: number, totalConnections: number, details: Object[] }}
     */
    getStats() {
        const details = [];
        let totalConnections = 0;

        this.rooms.forEach((room, name) => {
            const connCount = room.conns.size;
            totalConnections += connCount;
            details.push({
                room: name,
                connections: connCount,
                awarenessStates: room.awareness.getStates().size,
            });
        });

        return {
            rooms: this.rooms.size,
            totalConnections,
            details,
        };
    }

    /**
     * Get the Y.Doc for a specific room (used by ExecutionService for snapshot isolation).
     * @param {string} roomName
     * @returns {Y.Doc | null}
     */
    getDocument(roomName) {
        const room = this.rooms.get(roomName);
        return room ? room.doc : null;
    }

    /**
     * Graceful shutdown — close all connections and persist state.
     */
    async destroy() {
        console.log('[YjsServer] 🛑 Shutting down collaboration server...');

        // Close all connections
        this.rooms.forEach((room, _name) => {
            room.conns.forEach((conn) => {
                try {
                    conn.close();
                } catch (e) {
                    // ignore
                }
            });
            room.awareness.destroy();
        });

        this.rooms.clear();

        if (this.wss) {
            this.wss.close();
        }

        if (this.persistence) {
            await this.persistence.destroy();
        }

        console.log('[YjsServer] ✅ Collaboration server shut down.');
    }
}

// Singleton export
export const yjsServer = new YjsCollaborationServer();
