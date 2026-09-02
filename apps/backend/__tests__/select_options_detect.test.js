import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/browser.service.js', () => ({
    browserService: {
        get: vi.fn(),
    },
}));

vi.mock('../services/OptionDetector.js', () => ({
    detectOptions: vi.fn(),
}));

import { browserService } from '../services/browser.service.js';
import { detectOptions } from '../services/OptionDetector.js';
import { detectOptionsAction } from '../controllers/select-options.controller.js';

function res() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
}

describe('detectOptionsAction endpoint', () => {
    it('returns 400 when containerSelector is missing', async () => {
        const r = res();
        await detectOptionsAction({ body: {} }, r);
        expect(r.status).toHaveBeenCalledWith(400);
        expect(r.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'containerSelector is required' }),
        );
    });

    it('returns 404 when browser is not found', async () => {
        browserService.get.mockReturnValue(null);
        const r = res();
        await detectOptionsAction({ body: { containerSelector: '#c' } }, r);
        expect(r.status).toHaveBeenCalledWith(404);
    });

    it('returns detected options on success', async () => {
        browserService.get.mockReturnValue({
            browser: {
                contexts: () => [{ pages: () => [{ isClosed: () => false, id: 'p1' }] }],
            },
        });
        detectOptions.mockResolvedValue({
            found: true,
            groupType: 'checkbox-group',
            options: [{ id: '1', label: 'A', value: 'a', type: 'checkbox' }],
            message: '',
        });
        const r = res();
        await detectOptionsAction({ body: { containerSelector: '#c', browserId: 'b1' } }, r);
        expect(r.status).toHaveBeenCalledWith(200);
        expect(r.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({ groupType: 'checkbox-group' }),
            }),
        );
        expect(detectOptions).toHaveBeenCalled();
    });
});
