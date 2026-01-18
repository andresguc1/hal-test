import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { STORAGE_DIR } from '../config/paths.js';

// Configuration
const KEYS_FILE = path.join(STORAGE_DIR, 'secure_keys.json');
// In production, this MUST come from process.env. For dev, we use a fallback (with warning).
const MASTER_KEY_HEX =
    process.env.HALTEST_MASTER_ENCRYPTION_KEY ||
    '000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f'; // 32 bytes hex

if (!process.env.HALTEST_MASTER_ENCRYPTION_KEY) {
    console.warn(
        '[KeyVault] WARNING: HALTEST_MASTER_ENCRYPTION_KEY not set. Using insecure default key.',
    );
}

class KeyVaultService {
    constructor() {
        this.cache = null;
        this.masterKey = Buffer.from(MASTER_KEY_HEX, 'hex');
        this.ensureFile();
    }

    ensureFile() {
        if (!fs.existsSync(KEYS_FILE)) {
            fs.writeFileSync(KEYS_FILE, JSON.stringify([], null, 2));
        }
    }

    loadKeys() {
        try {
            const data = fs.readFileSync(KEYS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            console.error('[KeyVault] Failed to load keys:', e);
            return [];
        }
    }

    saveKeys(keys) {
        fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
    }

    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.masterKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(text) {
        const parts = text.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = parts.join(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.masterKey, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * Stores a new API Key
     * @param {string} provider - 'openai', 'google', 'anthropic'
     * @param {string} alias - 'My Personal Key'
     * @param {string} key - The actual API Key (sk-...)
     * @param {string} [baseUrl] - Optional custom URL
     */
    addKey({ provider, alias, key, baseUrl }) {
        const keys = this.loadKeys();

        const newEntry = {
            id: crypto.randomUUID(),
            provider,
            alias,
            encryptedKey: this.encrypt(key),
            baseUrl: baseUrl || null,
            createdAt: new Date().toISOString(),
        };

        keys.push(newEntry);
        this.saveKeys(keys);

        return this.sanitize(newEntry);
    }

    /**
     * Lists all keys (masked)
     */
    listKeys() {
        const keys = this.loadKeys();
        return keys.map((k) => this.sanitize(k));
    }

    /**
     * Deletes a key by ID
     */
    deleteKey(id) {
        let keys = this.loadKeys();
        const initialLen = keys.length;
        keys = keys.filter((k) => k.id !== id);
        this.saveKeys(keys);
        return keys.length !== initialLen;
    }

    /**
     * Internal: Gets decrypted key by ID or Alias
     * USED BY FACTORY - NOT EXPOSED TO API
     */
    getDecryptedKey(idOrAlias) {
        const keys = this.loadKeys();
        const entry = keys.find((k) => k.id === idOrAlias || k.alias === idOrAlias);
        if (!entry) return null;

        return {
            ...entry,
            key: this.decrypt(entry.encryptedKey),
        };
    }

    /**
     * Helper to mask key for UI
     */
    sanitize(entry) {
        // Decrypt momentarily to mask it properly, or just store a masked version?
        // Decrypting is safer to ensure we have the real structure, but expensive?
        // We can just imply mask from encrypted string? No.
        // Let's decrypt, mask, return.
        try {
            const raw = this.decrypt(entry.encryptedKey);
            const masked = `${raw.substring(0, 4)}...${raw.substring(raw.length - 4)}`;

            return {
                id: entry.id,
                provider: entry.provider,
                alias: entry.alias,
                maskedKey: masked,
                baseUrl: entry.baseUrl,
                createdAt: entry.createdAt,
            };
        } catch (e) {
            return { ...entry, maskedKey: 'INVALID_ENCRYPTION' };
        }
    }
}

export const keyVaultService = new KeyVaultService();
