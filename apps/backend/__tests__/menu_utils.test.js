import { describe, it, expect, vi } from 'vitest';
import {
    clickContextMenuItem,
    dismissContextMenu,
    buildMenuCandidates,
    isLocatorExpression,
} from '../core/menu-utils.js';

// Fake locator that reports a configurable presence (`count`) and visibility.
function roleLocator(present, visible = true) {
    const loc = {
        click: vi.fn().mockResolvedValue(undefined),
        count: vi.fn().mockResolvedValue(present ? 1 : 0),
        isVisible: vi.fn().mockResolvedValue(visible),
    };
    loc.first = vi.fn(() => loc);
    return loc;
}

function buildFakePage({ roleStates = {}, domPresent = false, viewportStates = [[], []] } = {}) {
    const getByRole = vi.fn((role) => {
        const present = roleStates[role];
        return roleLocator(present !== undefined ? present : false);
    });

    const locator = vi.fn(() => roleLocator(domPresent));
    // Stateful dismiss locator: first read = before state, second = after state.
    let reads = 0;
    const viewportState = () => viewportStates[Math.min(reads - 1, viewportStates.length - 1)];
    const dismissLocator = {
        count: vi.fn().mockImplementation(async () => {
            reads += 1;
            return viewportState().length;
        }),
        nth: vi.fn((i) => ({
            isVisible: vi.fn().mockResolvedValue(Boolean(viewportState()[i])),
        })),
    };

    const page = {
        getByRole,
        locator: vi.fn((selector) =>
            String(selector).includes('[role=') ? dismissLocator : locator(selector),
        ),
        mouse: {
            click: vi.fn().mockResolvedValue(undefined),
            move: vi.fn().mockResolvedValue(undefined),
            down: vi.fn().mockResolvedValue(undefined),
            up: vi.fn().mockResolvedValue(undefined),
        },
        evaluate: vi.fn().mockResolvedValue(undefined),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
    };

    return { page, getByRole, locator, dismissLocator };
}

describe('isLocatorExpression', () => {
    it('detects Playwright locator expressions', () => {
        expect(isLocatorExpression("page.getByRole('menuitem', { name: 'Delete' })")).toBe(true);
        expect(isLocatorExpression('getByText("Copy")')).toBe(true);
        expect(isLocatorExpression('Delete')).toBe(false);
    });
});

describe('buildMenuCandidates', () => {
    it('builds a role-aware chain for plain text names', () => {
        const { page } = buildFakePage();
        const candidates = buildMenuCandidates(page, 'Delete');
        expect(candidates).toHaveLength(4); // 3 roles + dom fallback
        expect(candidates[0].strategy).toContain('menuitem');
        expect(page.getByRole).toHaveBeenCalledWith('menuitem', { name: 'Delete' });
    });

    it('keeps a single candidate for locator expressions', () => {
        const { page } = buildFakePage();
        const candidates = buildMenuCandidates(
            page,
            "page.getByRole('menuitem', { name: 'Copy' })",
        );
        expect(candidates).toHaveLength(1);
        expect(candidates[0].strategy).toBe('locator');
    });
});

describe('clickContextMenuItem', () => {
    it('clicks a menuitem found by role/name', async () => {
        const { page } = buildFakePage({ roleStates: { menuitem: true } });
        const result = await clickContextMenuItem(page, 'Delete', {});
        expect(result.strategy).toBe("getByRole('menuitem', name)");
        const loc = page.getByRole.mock.results[0].value;
        expect(loc.click).toHaveBeenCalledTimes(1);
    });

    it('falls through to menuitemcheckbox when menuitem is absent', async () => {
        const { page } = buildFakePage({ roleStates: { menuitemcheckbox: true } });
        const result = await clickContextMenuItem(page, 'Delete', {});
        expect(result.strategy).toBe("getByRole('menuitemcheckbox', name)");
    });

    it('clicks a raw locator expression verbatim', async () => {
        const { page } = buildFakePage({ roleStates: { menuitem: true } });
        const result = await clickContextMenuItem(
            page,
            "page.getByRole('menuitem', { name: 'Copy' })",
            {},
        );
        expect(result.strategy).toBe('locator');
        expect(page.getByRole).toHaveBeenCalledWith('menuitem', { name: 'Copy' });
    });

    it('throws a 400 selector error when no option matches', async () => {
        const { page } = buildFakePage({});
        await expect(clickContextMenuItem(page, 'Nope', {})).rejects.toMatchObject({ status: 400 });
    });

    it('throws a 400 error when no item is configured', async () => {
        const { page } = buildFakePage();
        await expect(clickContextMenuItem(page, '', {})).rejects.toMatchObject({ status: 400 });
    });
});

describe('dismissContextMenu', () => {
    it('blurs + clicks outside and reports a fully dismissed menu', async () => {
        const { page } = buildFakePage({ viewportStates: [[true], []] });
        const result = await dismissContextMenu(page);

        expect(page.mouse.click).toHaveBeenCalledWith(4, 4);
        expect(page.evaluate).toHaveBeenCalled();
        expect(result).toMatchObject({ hadMenu: true, dismissed: true, visibleAfter: 0 });
    });

    it('throws when the menu is still visible after click-outside', async () => {
        const { page } = buildFakePage({ viewportStates: [[true], [true]] });
        await expect(dismissContextMenu(page)).rejects.toThrow(/did not close/);
    });

    it('does nothing when no menu was open', async () => {
        const { page } = buildFakePage({ viewportStates: [[], []] });
        const result = await dismissContextMenu(page);
        expect(result).toMatchObject({ hadMenu: false, dismissed: false });
        expect(page.mouse.click).toHaveBeenCalledWith(4, 4);
    });
});
