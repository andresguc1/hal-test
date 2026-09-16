import {
    R as c,
    g as k,
    s as E,
    c as _,
    j as s,
    i as A,
    k as S,
    b as o,
    A as K,
} from './index-B2OTYBQ0.js';
const f = {
        combobox: {
            label: 'Combobox',
            cls: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
        },
        aria_option: {
            label: 'Option',
            cls: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
        },
    },
    w = {
        NO_CHANGE: {
            labelKey: 'nodes.config.action_no_change',
            cls: 'bg-slate-600/20 text-slate-400 border-slate-600/40',
        },
        CHECK: {
            labelKey: 'nodes.config.action_check',
            cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        },
        SELECT: {
            labelKey: 'nodes.config.action_select',
            cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        },
    },
    O = {
        checked: {
            labelKey: 'nodes.config.current_checked',
            cls: 'bg-emerald-500/10 text-emerald-400',
        },
        unchecked: {
            labelKey: 'nodes.config.current_unchecked',
            cls: 'bg-slate-600/20 text-slate-500',
        },
        unknown: {
            labelKey: 'nodes.config.current_unknown',
            cls: 'bg-amber-500/10 text-amber-400',
        },
    },
    T = c.memo(({ detectedOptions: r, config: n, onChange: d, t }) => {
        const x = c.useCallback((e) => k(n, e), [n]),
            y = c.useCallback(
                (e) => (e.actualState ? e.actualState.checked : !!(e.checked || e.selected)),
                [],
            ),
            N = c.useCallback(
                (e, a) => {
                    d(E(n, e, a));
                },
                [n, d],
            ),
            b = _(n),
            m = r.find((e) => x(e) === 'SELECT');
        return s.jsxs('div', {
            className: 'space-y-2',
            children: [
                s.jsxs('div', {
                    className:
                        'flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/60',
                    children: [
                        s.jsxs('span', {
                            className:
                                'text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5',
                            children: [
                                s.jsx(A, { size: 12 }),
                                t('nodes.config.detected_options', 'Detected Options'),
                                ' (',
                                r.length,
                                ')',
                            ],
                        }),
                        s.jsx('div', {
                            className: 'flex items-center gap-1',
                            children:
                                b > 0 &&
                                s.jsxs('button', {
                                    type: 'button',
                                    onClick: () => d([]),
                                    disabled: b === 0,
                                    className:
                                        'px-2 py-0.5 rounded text-[9px] font-semibold text-slate-400 hover:bg-slate-500/15 transition-colors disabled:opacity-40',
                                    children: [
                                        s.jsx(S, { size: 10, className: 'inline mr-0.5' }),
                                        t('nodes.config.clear', 'Clear'),
                                    ],
                                }),
                        }),
                    ],
                }),
                s.jsx('div', {
                    className:
                        'border border-slate-700/60 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60',
                    children: r.map((e, a) => {
                        const u = y(e),
                            p = f[e.type] || f.combobox,
                            h = O[u ? 'checked' : 'unchecked'],
                            v = x(e);
                        return s.jsxs(
                            'div',
                            {
                                className: o(
                                    'flex items-center gap-3 px-3 py-2 hover:bg-slate-800/40 transition-colors',
                                    e.enabled === !1 && 'opacity-45',
                                ),
                                children: [
                                    s.jsxs('div', {
                                        className: 'flex-1 min-w-0',
                                        children: [
                                            s.jsxs('div', {
                                                className: 'flex items-center gap-2',
                                                children: [
                                                    s.jsx('span', {
                                                        className:
                                                            'text-xs text-slate-200 truncate',
                                                        children:
                                                            e.label ||
                                                            `${t('nodes.config.option', 'Option')} ${a + 1}`,
                                                    }),
                                                    s.jsx('span', {
                                                        className: o(
                                                            'text-[8px] px-1 py-px rounded border leading-none shrink-0',
                                                            p.cls,
                                                        ),
                                                        children: p.label,
                                                    }),
                                                ],
                                            }),
                                            s.jsxs('div', {
                                                className: 'flex items-center gap-1.5 mt-1',
                                                children: [
                                                    s.jsxs('span', {
                                                        className: o(
                                                            'text-[8px] px-1.5 py-px rounded-full leading-none',
                                                            h.cls,
                                                        ),
                                                        children: [
                                                            t(
                                                                'nodes.config.current_label',
                                                                'Current',
                                                            ),
                                                            ':',
                                                            ' ',
                                                            t(
                                                                h.labelKey,
                                                                u ? 'Checked' : 'Unchecked',
                                                            ),
                                                        ],
                                                    }),
                                                    e.actualState && e.actualState.enabled === !1
                                                        ? s.jsx('span', {
                                                              className:
                                                                  'text-[8px] text-rose-400 px-1 py-px rounded-full bg-rose-500/10',
                                                              children: t(
                                                                  'nodes.config.disabled',
                                                                  'disabled',
                                                              ),
                                                          })
                                                        : null,
                                                ],
                                            }),
                                            s.jsx('div', {
                                                className:
                                                    'text-[8px] text-slate-600 font-mono truncate mt-0.5',
                                                children:
                                                    e.locator ||
                                                    `#${e.containerSelector || 'container'} [index ${e.index}]`,
                                            }),
                                        ],
                                    }),
                                    s.jsx('div', {
                                        className: 'shrink-0 flex items-center',
                                        children: s.jsx('div', {
                                            className: 'flex items-center gap-0.5',
                                            children: [K, 'SELECT'].map((l) => {
                                                const C = v === l,
                                                    i = w[l],
                                                    j = l === 'SELECT' && m && m.id !== e.id,
                                                    g = e.enabled === !1 || j;
                                                return s.jsx(
                                                    'button',
                                                    {
                                                        type: 'button',
                                                        disabled: g,
                                                        onClick: () => N(e, l),
                                                        title: t(i.labelKey, l),
                                                        className: o(
                                                            'px-1.5 py-px rounded text-[9px] font-bold border leading-none transition-colors',
                                                            C
                                                                ? i.cls
                                                                : 'bg-transparent text-slate-600 border-transparent',
                                                            g && 'opacity-35 cursor-not-allowed',
                                                        ),
                                                        children: t(i.labelKey, l),
                                                    },
                                                    l,
                                                );
                                            }),
                                        }),
                                    }),
                                ],
                            },
                            e.id || a,
                        );
                    }),
                }),
            ],
        });
    });
T.displayName = 'ComboboxOptionRenderer';
export { T as ComboboxOptionRenderer, T as default };
