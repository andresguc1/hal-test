import { R as r, g as _, s as A, a as E, c as K, j as s, b as d } from './index-B2OTYBQ0.js';
const h = {
        select: { label: 'Select', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
        'select-multi': {
            label: 'Select',
            cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        },
    },
    S = {
        NO_CHANGE: {
            labelKey: 'nodes.config.action_no_change',
            cls: 'bg-slate-600/20 text-slate-400 border-slate-600/40',
        },
        CHECK: {
            labelKey: 'nodes.config.action_check',
            cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        },
        UNCHECK: {
            labelKey: 'nodes.config.action_uncheck',
            cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        },
        SELECT: {
            labelKey: 'nodes.config.action_select',
            cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        },
    },
    w = {
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
    R = r.memo(({ detectedOptions: a, config: n, onChange: c, t: l, multiSelect: f }) => {
        const y = r.useCallback((e) => _(n, e), [n]),
            N = r.useCallback(
                (e) => (e.actualState ? e.actualState.checked : !!(e.checked || e.selected)),
                [],
            ),
            k = r.useCallback(
                (e, o) => {
                    c(A(n, e, o));
                },
                [n, c],
            ),
            j = r.useCallback(() => {
                c(E(a));
            }, [a, c]),
            b = K(n),
            x = a.filter((e) => e.enabled !== !1).length;
        return s.jsxs('div', {
            className: 'space-y-2',
            children: [
                s.jsxs('div', {
                    className:
                        'flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/60',
                    children: [
                        s.jsxs('span', {
                            className:
                                'text-xs uppercase tracking-wider font-semibold text-slate-400',
                            children: [
                                l('nodes.config.detected_options', 'Detected Options'),
                                ' (',
                                a.length,
                                ')',
                            ],
                        }),
                        s.jsxs('div', {
                            className: 'flex items-center gap-1',
                            children: [
                                f &&
                                    x > 0 &&
                                    s.jsx('button', {
                                        type: 'button',
                                        onClick: j,
                                        disabled: x === 0,
                                        className:
                                            'px-2 py-0.5 rounded text-[9px] font-semibold text-indigo-400 hover:bg-indigo-500/15 transition-colors disabled:opacity-40',
                                        children: l('nodes.config.all', 'All'),
                                    }),
                                b > 0 &&
                                    s.jsx('button', {
                                        type: 'button',
                                        onClick: () => c([]),
                                        disabled: b === 0,
                                        className:
                                            'px-2 py-0.5 rounded text-[9px] font-semibold text-slate-400 hover:bg-slate-500/15 transition-colors disabled:opacity-40',
                                        children: l('nodes.config.clear', 'Clear'),
                                    }),
                            ],
                        }),
                    ],
                }),
                s.jsx('div', {
                    className:
                        'border border-slate-700/60 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60',
                    children: a.map((e, o) => {
                        const m = N(e),
                            u = h[e.type] || h.select,
                            p = w[m ? 'checked' : 'unchecked'],
                            v = y(e);
                        return s.jsxs(
                            'div',
                            {
                                className: d(
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
                                                            `${l('nodes.config.option', 'Option')} ${o + 1}`,
                                                    }),
                                                    s.jsx('span', {
                                                        className: d(
                                                            'text-[8px] px-1 py-px rounded border leading-none shrink-0',
                                                            u.cls,
                                                        ),
                                                        children: u.label,
                                                    }),
                                                ],
                                            }),
                                            s.jsxs('div', {
                                                className: 'flex items-center gap-1.5 mt-1',
                                                children: [
                                                    s.jsxs('span', {
                                                        className: d(
                                                            'text-[8px] px-1.5 py-px rounded-full leading-none',
                                                            p.cls,
                                                        ),
                                                        children: [
                                                            l(
                                                                'nodes.config.current_label',
                                                                'Current',
                                                            ),
                                                            ':',
                                                            ' ',
                                                            l(
                                                                p.labelKey,
                                                                m ? 'Checked' : 'Unchecked',
                                                            ),
                                                        ],
                                                    }),
                                                    e.actualState && e.actualState.enabled === !1
                                                        ? s.jsx('span', {
                                                              className:
                                                                  'text-[8px] text-rose-400 px-1 py-px rounded-full bg-rose-500/10',
                                                              children: l(
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
                                            children: ['NO_CHANGE', 'SELECT'].map((t) => {
                                                const C = v === t,
                                                    i = S[t],
                                                    g = e.enabled === !1;
                                                return s.jsx(
                                                    'button',
                                                    {
                                                        type: 'button',
                                                        disabled: g,
                                                        onClick: () => k(e, t),
                                                        title: l(i.labelKey, t),
                                                        className: d(
                                                            'px-1.5 py-px rounded text-[9px] font-bold border leading-none transition-colors',
                                                            C
                                                                ? i.cls
                                                                : 'bg-transparent text-slate-600 border-transparent',
                                                            g && 'opacity-35 cursor-not-allowed',
                                                        ),
                                                        children: l(i.labelKey, t),
                                                    },
                                                    t,
                                                );
                                            }),
                                        }),
                                    }),
                                ],
                            },
                            e.id || o,
                        );
                    }),
                }),
            ],
        });
    });
R.displayName = 'SelectOptionRenderer';
export { R as SelectOptionRenderer, R as default };
