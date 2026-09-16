import {
    R as d,
    g as _,
    s as A,
    c as w,
    j as s,
    C as E,
    b as l,
    A as K,
    e as g,
} from './index-B2OTYBQ0.js';
const N = {
        radio: { label: 'Radio', cls: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30' },
        aria_radio: {
            label: 'Radio',
            cls: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
        },
    },
    R = {
        NO_CHANGE: {
            labelKey: 'nodes.config.action_no_change',
            cls: 'bg-slate-600/20 text-slate-400 border-slate-600/40',
        },
        CHECK: {
            labelKey: 'nodes.config.action_check',
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
    S = d.memo(({ detectedOptions: i, config: n, onChange: o, t: a }) => {
        const b = d.useCallback((e) => _(n, e), [n]),
            y = d.useCallback(
                (e) => (e.actualState ? e.actualState.checked : !!(e.checked || e.selected)),
                [],
            ),
            j = d.useCallback(
                (e, c) => {
                    o(A(n, e, c));
                },
                [n, o],
            ),
            u = w(n),
            m = i.find((e) => b(e) === 'CHECK');
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
                                a('nodes.config.detected_options', 'Detected Options'),
                                ' (',
                                i.length,
                                ')',
                            ],
                        }),
                        s.jsx('div', {
                            className: 'flex items-center gap-1',
                            children:
                                u > 0 &&
                                s.jsxs('button', {
                                    type: 'button',
                                    onClick: () => o([]),
                                    disabled: u === 0,
                                    className:
                                        'px-2 py-0.5 rounded text-[9px] font-semibold text-slate-400 hover:bg-slate-500/15 transition-colors disabled:opacity-40',
                                    children: [
                                        s.jsx(E, { size: 10, className: 'inline mr-0.5' }),
                                        a('nodes.config.clear', 'Clear'),
                                    ],
                                }),
                        }),
                    ],
                }),
                s.jsx('div', {
                    className:
                        'border border-slate-700/60 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60',
                    children: i.map((e, c) => {
                        const r = y(e),
                            h = N[e.type] || N.radio,
                            f = O[r ? 'checked' : 'unchecked'],
                            k = b(e);
                        return s.jsxs(
                            'div',
                            {
                                className: l(
                                    'flex items-center gap-3 px-3 py-2 hover:bg-slate-800/40 transition-colors',
                                    e.enabled === !1 && 'opacity-45',
                                ),
                                children: [
                                    s.jsx('div', {
                                        className: 'flex items-center gap-2 shrink-0',
                                        children: s.jsx('span', {
                                            className: l(
                                                'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                                                r
                                                    ? 'bg-fuchsia-500 border-fuchsia-500'
                                                    : 'border-slate-600',
                                            ),
                                            children:
                                                r &&
                                                s.jsx('span', {
                                                    className: 'w-2 h-2 rounded-full bg-white',
                                                }),
                                        }),
                                    }),
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
                                                            `${a('nodes.config.option', 'Option')} ${c + 1}`,
                                                    }),
                                                    s.jsx('span', {
                                                        className: l(
                                                            'text-[8px] px-1 py-px rounded border leading-none shrink-0',
                                                            h.cls,
                                                        ),
                                                        children: h.label,
                                                    }),
                                                ],
                                            }),
                                            s.jsxs('div', {
                                                className: 'flex items-center gap-1.5 mt-1',
                                                children: [
                                                    s.jsxs('span', {
                                                        className: l(
                                                            'text-[8px] px-1.5 py-px rounded-full leading-none',
                                                            f.cls,
                                                        ),
                                                        children: [
                                                            a(
                                                                'nodes.config.current_label',
                                                                'Current',
                                                            ),
                                                            ':',
                                                            ' ',
                                                            a(
                                                                f.labelKey,
                                                                r ? 'Checked' : 'Unchecked',
                                                            ),
                                                        ],
                                                    }),
                                                    e.actualState && e.actualState.enabled === !1
                                                        ? s.jsx('span', {
                                                              className:
                                                                  'text-[8px] text-rose-400 px-1 py-px rounded-full bg-rose-500/10',
                                                              children: a(
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
                                            children: [K, g].map((t) => {
                                                const C = k === t,
                                                    x = R[t],
                                                    v = t === g && m && m.id !== e.id,
                                                    p = e.enabled === !1 || v;
                                                return s.jsx(
                                                    'button',
                                                    {
                                                        type: 'button',
                                                        disabled: p,
                                                        onClick: () => j(e, t),
                                                        title: a(x.labelKey, t),
                                                        className: l(
                                                            'px-1.5 py-px rounded text-[9px] font-bold border leading-none transition-colors',
                                                            C
                                                                ? x.cls
                                                                : 'bg-transparent text-slate-600 border-transparent',
                                                            p && 'opacity-35 cursor-not-allowed',
                                                        ),
                                                        children: a(x.labelKey, t),
                                                    },
                                                    t,
                                                );
                                            }),
                                        }),
                                    }),
                                ],
                            },
                            e.id || c,
                        );
                    }),
                }),
            ],
        });
    });
S.displayName = 'RadioOptionRenderer';
export { S as RadioOptionRenderer, S as default };
