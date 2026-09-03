import { describe, it, expect } from 'vitest';
import Joi from 'joi';
import launchBrowserBodySchema from '../../schemas/launch_browser/body.js';

describe('launch_browser body schema - httpCredentials', () => {
    it('should accept httpCredentials with username and password only', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: { username: 'admin', password: 'pass123' },
        };
        const { error, value } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeUndefined();
        expect(value.httpCredentials).toEqual({
            username: 'admin',
            password: 'pass123',
            send: 'unauthorized',
        });
    });

    it('should accept httpCredentials with username only (password defaults to empty)', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: { username: 'admin' },
        };
        const { error, value } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeUndefined();
        expect(value.httpCredentials.username).toBe('admin');
        expect(value.httpCredentials.password).toBe('');
    });

    it('should accept httpCredentials with origin', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: {
                username: 'admin',
                password: 'pass123',
                origin: 'https://example.com',
            },
        };
        const { error, value } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeUndefined();
        expect(value.httpCredentials.origin).toBe('https://example.com');
    });

    it('should accept httpCredentials with send option "always"', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: {
                username: 'admin',
                password: 'pass123',
                send: 'always',
            },
        };
        const { error, value } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeUndefined();
        expect(value.httpCredentials.send).toBe('always');
    });

    it('should accept httpCredentials with send option "unauthorized"', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: {
                username: 'admin',
                password: 'pass123',
                send: 'unauthorized',
            },
        };
        const { error, value } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeUndefined();
        expect(value.httpCredentials.send).toBe('unauthorized');
    });

    it('should accept httpCredentials with username, password, origin, and send', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: {
                username: 'admin',
                password: 'pass123',
                origin: 'https://example.com:8080',
                send: 'always',
            },
        };
        const { error, value } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeUndefined();
        expect(value.httpCredentials).toEqual({
            username: 'admin',
            password: 'pass123',
            origin: 'https://example.com:8080',
            send: 'always',
        });
    });

    it('should reject httpCredentials with empty username and password', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: { username: '', password: '' },
        };
        const { error } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('httpCredentials requires a username');
    });

    it('should reject invalid origin URL', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: {
                username: 'admin',
                password: 'pass123',
                origin: 'not-a-valid-url',
            },
        };
        const { error } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('origin must be a valid URL');
    });

    it('should reject invalid send value', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: {
                username: 'admin',
                password: 'pass123',
                send: 'invalid',
            },
        };
        const { error } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('must be one of');
    });

    it('should default send to "unauthorized" when not provided', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: { username: 'admin' },
        };
        const { error, value } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeUndefined();
        expect(value.httpCredentials.send).toBe('unauthorized');
    });

    it('should accept origin with http scheme', () => {
        const payload = {
            browserType: 'chromium',
            httpCredentials: {
                username: 'admin',
                password: 'pass123',
                origin: 'http://localhost:3000',
            },
        };
        const { error, value } = launchBrowserBodySchema.validate(payload);
        expect(error).toBeUndefined();
        expect(value.httpCredentials.origin).toBe('http://localhost:3000');
    });
});
