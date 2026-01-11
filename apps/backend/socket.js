import { Server } from 'socket.io';

let io;

export const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Adjust this in production
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('📡 [Socket.io] Client connected:', socket.id);

        socket.on('disconnect', (reason) => {
            console.log('🔌 [Socket.io] Client disconnected:', socket.id, `(Reason: ${reason})`);
        });
    });

    console.log('🚀 Socket.io server ready and listening on port 2001');
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call init(server) first.');
    }
    return io;
};

export const emitExecutionStatus = ({ stepId, status, error = null }) => {
    if (io) {
        console.log(`📡 [Socket.io] Emitting execution-status: ${stepId} -> ${status}`);
        io.emit('execution-status', { stepId, status, error });
    } else {
        console.warn('⚠️ [Socket.io] Skipping emission: Socket.io server not initialized');
    }
};

export const emitElementPicked = (selectorData) => {
    if (io) {
        console.log(`📡 [Socket.io] Emitting element_picked`, selectorData);
        io.emit('element_picked', selectorData);
    }
};
