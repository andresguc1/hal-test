import { describe, it, expect, vi } from 'vitest';
import { getHttpCredentials } from '../core/browser-utils.js';

const mockService = {
    get: vi.fn(),
};

describe('getHttpCredentials', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when browserId is null', () => {
        const result = getHttpCredentials(null, mockService);
        expect(result).toBeNull();
    });

    it('should return null when browserId is undefined', () => {
        const result = getHttpCredentials(undefined, mockService);
        expect(result).toBeNull();
    });

    it('should return null when browser entry is not found', () => {
        mockService.get.mockReturnValue(undefined);
        const result = getHttpCredentials('nonexistent', mockService);
        expect(result).toBeNull();
    });

    it('should return null when httpCredentials is not set', () => {
        mockService.get.mockReturnValue({ options: {} });
        const result = getHttpCredentials('browser1', mockService);
        expect(result).toBeNull();
    });

    it('should return null when username is empty', () => {
        mockService.get.mockReturnValue({
            options: { httpCredentials: { username: '', password: '' } },
        });
        const result = getHttpCredentials('browser1', mockService);
        expect(result).toBeNull();
    });

    it('should return credentials with username and password', () => {
        mockService.get.mockReturnValue({
            options: { httpCredentials: { username: 'admin', password: 'secret' } },
        });
        const result = getHttpCredentials('browser1', mockService);
        expect(result).toEqual({ username: 'admin', password: 'secret' });
    });

    it('should default password to empty string when not provided', () => {
        mockService.get.mockReturnValue({
            options: { httpCredentials: { username: 'admin' } },
        });
        const result = getHttpCredentials('browser1', mockService);
        expect(result).toEqual({ username: 'admin', password: '' });
    });

    it('should include origin when present', () => {
        mockService.get.mockReturnValue({
            options: {
                httpCredentials: {
                    username: 'admin',
                    password: 'secret',
                    origin: 'https://example.com',
                },
            },
        });
        const result = getHttpCredentials('browser1', mockService);
        expect(result).toEqual({
            username: 'admin',
            password: 'secret',
            origin: 'https://example.com',
        });
    });

    it('should include send when present', () => {
        mockService.get.mockReturnValue({
            options: {
                httpCredentials: {
                    username: 'admin',
                    password: 'secret',
                    send: 'always',
                },
            },
        });
        const result = getHttpCredentials('browser1', mockService);
        expect(result).toEqual({
            username: 'admin',
            password: 'secret',
            send: 'always',
        });
    });

    it('should include origin and send when both present', () => {
        mockService.get.mockReturnValue({
            options: {
                httpCredentials: {
                    username: 'admin',
                    password: 'secret',
                    origin: 'https://api.example.com',
                    send: 'unauthorized',
                },
            },
        });
        const result = getHttpCredentials('browser1', mockService);
        expect(result).toEqual({
            username: 'admin',
            password: 'secret',
            origin: 'https://api.example.com',
            send: 'unauthorized',
        });
    });

    it('should not include origin when not present', () => {
        mockService.get.mockReturnValue({
            options: {
                httpCredentials: {
                    username: 'admin',
                    password: 'secret',
                },
            },
        });
        const result = getHttpCredentials('browser1', mockService);
        expect(result).not.toHaveProperty('origin');
        expect(result).not.toHaveProperty('send');
    });
});
