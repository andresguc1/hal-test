import {
    c as xe,
    a as z,
    o as xt,
    b as B,
    d as q,
    e as m,
    P as zo,
    m as ve,
    S as R,
    t as _,
    i as S,
    f as G,
    g as I,
    h as ws,
    j as lr,
    u as we,
    k as U,
    s as Wn,
    l as Qn,
    n as dt,
    p as A,
    q as $s,
    r as sn,
    v as Ot,
    w as Oe,
    x as Cs,
    y as qt,
    z as zt,
    A as Ss,
    B as ks,
    C as Sn,
    F as Es,
    D as Bt,
    $ as Ko,
    E as Ms,
    G as Ds,
    H as j,
    I as Hr,
    J as As,
    K as Ts,
    L as ur,
    M as Fs,
    N as Is,
    O as Nn,
    Q as Ps,
    R as Ls,
    T as J,
    U as Os,
    V as qs,
    W as _s,
} from './index-TbwO0NdA.js';
var Rs = (e) => e != null,
    zs = (e) => e.filter(Rs);
function Ks(e) {
    return (...t) => {
        for (const n of e) n && n(...t);
    };
}
var E = (e) => (typeof e == 'function' && !e.length ? e() : e),
    Yn = (e) => (Array.isArray(e) ? e : e ? [e] : []);
function Bs(e, ...t) {
    return typeof e == 'function' ? e(...t) : e;
}
var Ns = U;
function Hs(e, t, n, r) {
    const o = e.length,
        s = t.length;
    let a = 0;
    if (!s) {
        for (; a < o; a++) n(e[a]);
        return;
    }
    if (!o) {
        for (; a < s; a++) r(t[a]);
        return;
    }
    for (; a < s && t[a] === e[a]; a++);
    let l, i;
    ((t = t.slice(a)), (e = e.slice(a)));
    for (l of t) e.includes(l) || r(l);
    for (i of e) t.includes(i) || n(i);
}
function Gs(e) {
    const [t, n] = z(),
        r = e?.throw
            ? (d, f) => {
                  throw (n(d instanceof Error ? d : new Error(f)), d);
              }
            : (d, f) => {
                  n(d instanceof Error ? d : new Error(f));
              },
        o = e?.api
            ? Array.isArray(e.api)
                ? e.api
                : [e.api]
            : [globalThis.localStorage].filter(Boolean),
        s = e?.prefix ? `${e.prefix}.` : '',
        a = new Map(),
        l = new Proxy(
            {},
            {
                get(d, f) {
                    let h = a.get(f);
                    (h || ((h = z(void 0, { equals: !1 })), a.set(f, h)), h[0]());
                    const p = o.reduce((v, y) => {
                        if (v !== null || !y) return v;
                        try {
                            return y.getItem(`${s}${f}`);
                        } catch (x) {
                            return (r(x, `Error reading ${s}${f} from ${y.name}`), null);
                        }
                    }, null);
                    return p !== null && e?.deserializer ? e.deserializer(p, f, e.options) : p;
                },
            },
        ),
        i = (d, f, h) => {
            const p = e?.serializer ? e.serializer(f, d, h ?? e.options) : f,
                v = `${s}${d}`;
            o.forEach((x) => {
                try {
                    x.getItem(v) !== p && x.setItem(v, p);
                } catch (b) {
                    r(b, `Error setting ${s}${d} to ${p} in ${x.name}`);
                }
            });
            const y = a.get(d);
            y && y[1]();
        },
        u = (d) =>
            o.forEach((f) => {
                try {
                    f.removeItem(`${s}${d}`);
                } catch (h) {
                    r(h, `Error removing ${s}${d} from ${f.name}`);
                }
            }),
        g = () =>
            o.forEach((d) => {
                try {
                    d.clear();
                } catch (f) {
                    r(f, `Error clearing ${d.name}`);
                }
            }),
        c = () => {
            const d = {},
                f = (h, p) => {
                    if (!d.hasOwnProperty(h)) {
                        const v = p && e?.deserializer ? e.deserializer(p, h, e.options) : p;
                        v && (d[h] = v);
                    }
                };
            return (
                o.forEach((h) => {
                    if (typeof h.getAll == 'function') {
                        let p;
                        try {
                            p = h.getAll();
                        } catch (v) {
                            r(v, `Error getting all values from in ${h.name}`);
                        }
                        for (const v of p) f(v, p[v]);
                    } else {
                        let p = 0,
                            v;
                        try {
                            for (; (v = h.key(p++)); ) d.hasOwnProperty(v) || f(v, h.getItem(v));
                        } catch (y) {
                            r(y, `Error getting all values from ${h.name}`);
                        }
                    }
                }),
                d
            );
        };
    return (
        e?.sync !== !1 &&
            xt(() => {
                const d = (f) => {
                    let h = !1;
                    (o.forEach((p) => {
                        try {
                            p !== f.storageArea &&
                                f.key &&
                                f.newValue !== p.getItem(f.key) &&
                                (f.newValue ? p.setItem(f.key, f.newValue) : p.removeItem(f.key),
                                (h = !0));
                        } catch (v) {
                            r(
                                v,
                                `Error synching api ${p.name} from storage event (${f.key}=${f.newValue})`,
                            );
                        }
                    }),
                        h && f.key && a.get(f.key)?.[1]());
                };
                'addEventListener' in globalThis
                    ? (globalThis.addEventListener('storage', d),
                      U(() => globalThis.removeEventListener('storage', d)))
                    : (o.forEach((f) => f.addEventListener?.('storage', d)),
                      U(() => o.forEach((f) => f.removeEventListener?.('storage', d))));
            }),
        [l, i, { clear: g, error: t, remove: u, toJSON: c }]
    );
}
var Us = Gs,
    Vs = (e) => (
        typeof e.clear == 'function' ||
            (e.clear = () => {
                let t;
                for (; (t = e.key(0)); ) e.removeItem(t);
            }),
        e
    ),
    Gr = (e) => {
        if (!e) return '';
        let t = '';
        for (const n in e) {
            if (!e.hasOwnProperty(n)) continue;
            const r = e[n];
            t +=
                r instanceof Date
                    ? `; ${n}=${r.toUTCString()}`
                    : typeof r == 'boolean'
                      ? `; ${n}`
                      : `; ${n}=${r}`;
        }
        return t;
    },
    _e = Vs({
        _cookies: [globalThis.document, 'cookie'],
        getItem: (e) =>
            _e._cookies[0][_e._cookies[1]].match('(^|;)\\s*' + e + '\\s*=\\s*([^;]+)')?.pop() ??
            null,
        setItem: (e, t, n) => {
            const r = _e.getItem(e);
            _e._cookies[0][_e._cookies[1]] = `${e}=${t}${Gr(n)}`;
            const o = Object.assign(new Event('storage'), {
                key: e,
                oldValue: r,
                newValue: t,
                url: globalThis.document.URL,
                storageArea: _e,
            });
            window.dispatchEvent(o);
        },
        removeItem: (e) => {
            _e._cookies[0][_e._cookies[1]] = `${e}=deleted${Gr({ expires: new Date(0) })}`;
        },
        key: (e) => {
            let t = null,
                n = 0;
            return (
                _e._cookies[0][_e._cookies[1]].replace(
                    /(?:^|;)\s*(.+?)\s*=\s*[^;]+/g,
                    (r, o) => (!t && o && n++ === e && (t = o), ''),
                ),
                t
            );
        },
        get length() {
            let e = 0;
            return (
                _e._cookies[0][_e._cookies[1]].replace(
                    /(?:^|;)\s*.+?\s*=\s*[^;]+/g,
                    (t) => ((e += t ? 1 : 0), ''),
                ),
                e
            );
        },
    }),
    js = 1024,
    Ht = 796,
    Bo = 700,
    Ws = 'bottom-right',
    Xn = 'bottom',
    Qs = 'system',
    Ys = !1,
    $n = 500,
    Xs = 500,
    Cn = 500,
    Zs = Object.keys(Wn)[0],
    Ur = 1,
    Js = Object.keys(Qn)[0],
    No = xe({
        client: void 0,
        onlineManager: void 0,
        queryFlavor: '',
        version: '',
        shadowDOMTarget: void 0,
    });
function K() {
    return we(No);
}
var Vr = class extends Error {},
    Ho = xe(void 0),
    ea = (e) => {
        const [t, n] = z(null),
            r = () => {
                const a = t();
                a != null && (a.close(), n(null));
            },
            o = (a, l) => {
                if (t() != null) return;
                const i = window.open('', 'TSQD-Devtools-Panel', `width=${a},height=${l},popup`);
                if (!i)
                    throw new Vr(
                        'Failed to open popup. Please allow popups for this site to view the devtools in picture-in-picture mode.',
                    );
                ((i.document.head.innerHTML = ''),
                    (i.document.body.innerHTML = ''),
                    ws(i.document),
                    (i.document.title = 'TanStack Query Devtools'),
                    (i.document.body.style.margin = '0'),
                    i.addEventListener('pagehide', () => {
                        (e.setLocalStore('pip_open', 'false'), n(null));
                    }),
                    [...(K().shadowDOMTarget || document).styleSheets].forEach((u) => {
                        try {
                            const g = [...u.cssRules].map((h) => h.cssText).join(''),
                                c = document.createElement('style'),
                                d = u.ownerNode;
                            let f = '';
                            (d && 'id' in d && (f = d.id),
                                f && c.setAttribute('id', f),
                                (c.textContent = g),
                                i.document.head.appendChild(c));
                        } catch {
                            const c = document.createElement('link');
                            if (u.href == null) return;
                            ((c.rel = 'stylesheet'),
                                (c.type = u.type),
                                (c.media = u.media.toString()),
                                (c.href = u.href),
                                i.document.head.appendChild(c));
                        }
                    }),
                    lr(
                        [
                            'focusin',
                            'focusout',
                            'pointermove',
                            'keydown',
                            'pointerdown',
                            'pointerup',
                            'click',
                            'mousedown',
                            'input',
                        ],
                        i.document,
                    ),
                    e.setLocalStore('pip_open', 'true'),
                    n(i));
            };
        (B(() => {
            if ((e.localStore.pip_open ?? 'false') === 'true' && !e.disabled)
                try {
                    o(Number(window.innerWidth), Number(e.localStore.height || Xs));
                } catch (l) {
                    if (l instanceof Vr) {
                        (console.error(l.message),
                            e.setLocalStore('pip_open', 'false'),
                            e.setLocalStore('open', 'false'));
                        return;
                    }
                    throw l;
                }
        }),
            B(() => {
                const a = (K().shadowDOMTarget || document).querySelector('#_goober'),
                    l = t();
                if (a && l) {
                    const i = new MutationObserver(() => {
                        const u = (K().shadowDOMTarget || l.document).querySelector('#_goober');
                        u && (u.textContent = a.textContent);
                    });
                    (i.observe(a, { childList: !0, subtree: !0, characterDataOldValue: !0 }),
                        U(() => {
                            i.disconnect();
                        }));
                }
            }));
        const s = q(() => ({
            pipWindow: t(),
            requestPipWindow: o,
            closePipWindow: r,
            disabled: e.disabled ?? !1,
        }));
        return m(Ho.Provider, {
            value: s,
            get children() {
                return e.children;
            },
        });
    },
    cr = () =>
        q(() => {
            const t = we(Ho);
            if (!t) throw new Error('usePiPWindow must be used within a PiPProvider');
            return t();
        }),
    Go = xe(() => 'dark');
function $e() {
    return we(Go);
}
var Uo = {
        À: 'A',
        Á: 'A',
        Â: 'A',
        Ã: 'A',
        Ä: 'A',
        Å: 'A',
        Ấ: 'A',
        Ắ: 'A',
        Ẳ: 'A',
        Ẵ: 'A',
        Ặ: 'A',
        Æ: 'AE',
        Ầ: 'A',
        Ằ: 'A',
        Ȃ: 'A',
        Ç: 'C',
        Ḉ: 'C',
        È: 'E',
        É: 'E',
        Ê: 'E',
        Ë: 'E',
        Ế: 'E',
        Ḗ: 'E',
        Ề: 'E',
        Ḕ: 'E',
        Ḝ: 'E',
        Ȇ: 'E',
        Ì: 'I',
        Í: 'I',
        Î: 'I',
        Ï: 'I',
        Ḯ: 'I',
        Ȋ: 'I',
        Ð: 'D',
        Ñ: 'N',
        Ò: 'O',
        Ó: 'O',
        Ô: 'O',
        Õ: 'O',
        Ö: 'O',
        Ø: 'O',
        Ố: 'O',
        Ṍ: 'O',
        Ṓ: 'O',
        Ȏ: 'O',
        Ù: 'U',
        Ú: 'U',
        Û: 'U',
        Ü: 'U',
        Ý: 'Y',
        à: 'a',
        á: 'a',
        â: 'a',
        ã: 'a',
        ä: 'a',
        å: 'a',
        ấ: 'a',
        ắ: 'a',
        ẳ: 'a',
        ẵ: 'a',
        ặ: 'a',
        æ: 'ae',
        ầ: 'a',
        ằ: 'a',
        ȃ: 'a',
        ç: 'c',
        ḉ: 'c',
        è: 'e',
        é: 'e',
        ê: 'e',
        ë: 'e',
        ế: 'e',
        ḗ: 'e',
        ề: 'e',
        ḕ: 'e',
        ḝ: 'e',
        ȇ: 'e',
        ì: 'i',
        í: 'i',
        î: 'i',
        ï: 'i',
        ḯ: 'i',
        ȋ: 'i',
        ð: 'd',
        ñ: 'n',
        ò: 'o',
        ó: 'o',
        ô: 'o',
        õ: 'o',
        ö: 'o',
        ø: 'o',
        ố: 'o',
        ṍ: 'o',
        ṓ: 'o',
        ȏ: 'o',
        ù: 'u',
        ú: 'u',
        û: 'u',
        ü: 'u',
        ý: 'y',
        ÿ: 'y',
        Ā: 'A',
        ā: 'a',
        Ă: 'A',
        ă: 'a',
        Ą: 'A',
        ą: 'a',
        Ć: 'C',
        ć: 'c',
        Ĉ: 'C',
        ĉ: 'c',
        Ċ: 'C',
        ċ: 'c',
        Č: 'C',
        č: 'c',
        C̆: 'C',
        c̆: 'c',
        Ď: 'D',
        ď: 'd',
        Đ: 'D',
        đ: 'd',
        Ē: 'E',
        ē: 'e',
        Ĕ: 'E',
        ĕ: 'e',
        Ė: 'E',
        ė: 'e',
        Ę: 'E',
        ę: 'e',
        Ě: 'E',
        ě: 'e',
        Ĝ: 'G',
        Ǵ: 'G',
        ĝ: 'g',
        ǵ: 'g',
        Ğ: 'G',
        ğ: 'g',
        Ġ: 'G',
        ġ: 'g',
        Ģ: 'G',
        ģ: 'g',
        Ĥ: 'H',
        ĥ: 'h',
        Ħ: 'H',
        ħ: 'h',
        Ḫ: 'H',
        ḫ: 'h',
        Ĩ: 'I',
        ĩ: 'i',
        Ī: 'I',
        ī: 'i',
        Ĭ: 'I',
        ĭ: 'i',
        Į: 'I',
        į: 'i',
        İ: 'I',
        ı: 'i',
        Ĳ: 'IJ',
        ĳ: 'ij',
        Ĵ: 'J',
        ĵ: 'j',
        Ķ: 'K',
        ķ: 'k',
        Ḱ: 'K',
        ḱ: 'k',
        K̆: 'K',
        k̆: 'k',
        Ĺ: 'L',
        ĺ: 'l',
        Ļ: 'L',
        ļ: 'l',
        Ľ: 'L',
        ľ: 'l',
        Ŀ: 'L',
        ŀ: 'l',
        Ł: 'l',
        ł: 'l',
        Ḿ: 'M',
        ḿ: 'm',
        M̆: 'M',
        m̆: 'm',
        Ń: 'N',
        ń: 'n',
        Ņ: 'N',
        ņ: 'n',
        Ň: 'N',
        ň: 'n',
        ŉ: 'n',
        N̆: 'N',
        n̆: 'n',
        Ō: 'O',
        ō: 'o',
        Ŏ: 'O',
        ŏ: 'o',
        Ő: 'O',
        ő: 'o',
        Œ: 'OE',
        œ: 'oe',
        P̆: 'P',
        p̆: 'p',
        Ŕ: 'R',
        ŕ: 'r',
        Ŗ: 'R',
        ŗ: 'r',
        Ř: 'R',
        ř: 'r',
        R̆: 'R',
        r̆: 'r',
        Ȓ: 'R',
        ȓ: 'r',
        Ś: 'S',
        ś: 's',
        Ŝ: 'S',
        ŝ: 's',
        Ş: 'S',
        Ș: 'S',
        ș: 's',
        ş: 's',
        Š: 'S',
        š: 's',
        Ţ: 'T',
        ţ: 't',
        ț: 't',
        Ț: 'T',
        Ť: 'T',
        ť: 't',
        Ŧ: 'T',
        ŧ: 't',
        T̆: 'T',
        t̆: 't',
        Ũ: 'U',
        ũ: 'u',
        Ū: 'U',
        ū: 'u',
        Ŭ: 'U',
        ŭ: 'u',
        Ů: 'U',
        ů: 'u',
        Ű: 'U',
        ű: 'u',
        Ų: 'U',
        ų: 'u',
        Ȗ: 'U',
        ȗ: 'u',
        V̆: 'V',
        v̆: 'v',
        Ŵ: 'W',
        ŵ: 'w',
        Ẃ: 'W',
        ẃ: 'w',
        X̆: 'X',
        x̆: 'x',
        Ŷ: 'Y',
        ŷ: 'y',
        Ÿ: 'Y',
        Y̆: 'Y',
        y̆: 'y',
        Ź: 'Z',
        ź: 'z',
        Ż: 'Z',
        ż: 'z',
        Ž: 'Z',
        ž: 'z',
        ſ: 's',
        ƒ: 'f',
        Ơ: 'O',
        ơ: 'o',
        Ư: 'U',
        ư: 'u',
        Ǎ: 'A',
        ǎ: 'a',
        Ǐ: 'I',
        ǐ: 'i',
        Ǒ: 'O',
        ǒ: 'o',
        Ǔ: 'U',
        ǔ: 'u',
        Ǖ: 'U',
        ǖ: 'u',
        Ǘ: 'U',
        ǘ: 'u',
        Ǚ: 'U',
        ǚ: 'u',
        Ǜ: 'U',
        ǜ: 'u',
        Ứ: 'U',
        ứ: 'u',
        Ṹ: 'U',
        ṹ: 'u',
        Ǻ: 'A',
        ǻ: 'a',
        Ǽ: 'AE',
        ǽ: 'ae',
        Ǿ: 'O',
        ǿ: 'o',
        Þ: 'TH',
        þ: 'th',
        Ṕ: 'P',
        ṕ: 'p',
        Ṥ: 'S',
        ṥ: 's',
        X́: 'X',
        x́: 'x',
        Ѓ: 'Г',
        ѓ: 'г',
        Ќ: 'К',
        ќ: 'к',
        A̋: 'A',
        a̋: 'a',
        E̋: 'E',
        e̋: 'e',
        I̋: 'I',
        i̋: 'i',
        Ǹ: 'N',
        ǹ: 'n',
        Ồ: 'O',
        ồ: 'o',
        Ṑ: 'O',
        ṑ: 'o',
        Ừ: 'U',
        ừ: 'u',
        Ẁ: 'W',
        ẁ: 'w',
        Ỳ: 'Y',
        ỳ: 'y',
        Ȁ: 'A',
        ȁ: 'a',
        Ȅ: 'E',
        ȅ: 'e',
        Ȉ: 'I',
        ȉ: 'i',
        Ȍ: 'O',
        ȍ: 'o',
        Ȑ: 'R',
        ȑ: 'r',
        Ȕ: 'U',
        ȕ: 'u',
        B̌: 'B',
        b̌: 'b',
        Č̣: 'C',
        č̣: 'c',
        Ê̌: 'E',
        ê̌: 'e',
        F̌: 'F',
        f̌: 'f',
        Ǧ: 'G',
        ǧ: 'g',
        Ȟ: 'H',
        ȟ: 'h',
        J̌: 'J',
        ǰ: 'j',
        Ǩ: 'K',
        ǩ: 'k',
        M̌: 'M',
        m̌: 'm',
        P̌: 'P',
        p̌: 'p',
        Q̌: 'Q',
        q̌: 'q',
        Ř̩: 'R',
        ř̩: 'r',
        Ṧ: 'S',
        ṧ: 's',
        V̌: 'V',
        v̌: 'v',
        W̌: 'W',
        w̌: 'w',
        X̌: 'X',
        x̌: 'x',
        Y̌: 'Y',
        y̌: 'y',
        A̧: 'A',
        a̧: 'a',
        B̧: 'B',
        b̧: 'b',
        Ḑ: 'D',
        ḑ: 'd',
        Ȩ: 'E',
        ȩ: 'e',
        Ɛ̧: 'E',
        ɛ̧: 'e',
        Ḩ: 'H',
        ḩ: 'h',
        I̧: 'I',
        i̧: 'i',
        Ɨ̧: 'I',
        ɨ̧: 'i',
        M̧: 'M',
        m̧: 'm',
        O̧: 'O',
        o̧: 'o',
        Q̧: 'Q',
        q̧: 'q',
        U̧: 'U',
        u̧: 'u',
        X̧: 'X',
        x̧: 'x',
        Z̧: 'Z',
        z̧: 'z',
    },
    ta = Object.keys(Uo).join('|'),
    na = new RegExp(ta, 'g');
function ra(e) {
    return e.replace(na, (t) => Uo[t]);
}
var Te = {
    CASE_SENSITIVE_EQUAL: 7,
    EQUAL: 6,
    STARTS_WITH: 5,
    WORD_STARTS_WITH: 4,
    CONTAINS: 3,
    ACRONYM: 2,
    MATCHES: 1,
    NO_MATCH: 0,
};
function jr(e, t, n) {
    var r;
    if (((n = n || {}), (n.threshold = (r = n.threshold) != null ? r : Te.MATCHES), !n.accessors)) {
        const a = Wr(e, t, n);
        return {
            rankedValue: e,
            rank: a,
            accessorIndex: -1,
            accessorThreshold: n.threshold,
            passed: a >= n.threshold,
        };
    }
    const o = aa(e, n.accessors),
        s = {
            rankedValue: e,
            rank: Te.NO_MATCH,
            accessorIndex: -1,
            accessorThreshold: n.threshold,
            passed: !1,
        };
    for (let a = 0; a < o.length; a++) {
        const l = o[a];
        let i = Wr(l.itemValue, t, n);
        const { minRanking: u, maxRanking: g, threshold: c = n.threshold } = l.attributes;
        (i < u && i >= Te.MATCHES ? (i = u) : i > g && (i = g),
            (i = Math.min(i, g)),
            i >= c &&
                i > s.rank &&
                ((s.rank = i),
                (s.passed = !0),
                (s.accessorIndex = a),
                (s.accessorThreshold = c),
                (s.rankedValue = l.itemValue)));
    }
    return s;
}
function Wr(e, t, n) {
    return (
        (e = Qr(e, n)),
        (t = Qr(t, n)),
        t.length > e.length
            ? Te.NO_MATCH
            : e === t
              ? Te.CASE_SENSITIVE_EQUAL
              : ((e = e.toLowerCase()),
                (t = t.toLowerCase()),
                e === t
                    ? Te.EQUAL
                    : e.startsWith(t)
                      ? Te.STARTS_WITH
                      : e.includes(` ${t}`)
                        ? Te.WORD_STARTS_WITH
                        : e.includes(t)
                          ? Te.CONTAINS
                          : t.length === 1
                            ? Te.NO_MATCH
                            : oa(e).includes(t)
                              ? Te.ACRONYM
                              : ia(e, t))
    );
}
function oa(e) {
    let t = '';
    return (
        e.split(' ').forEach((r) => {
            r.split('-').forEach((s) => {
                t += s.substr(0, 1);
            });
        }),
        t
    );
}
function ia(e, t) {
    let n = 0,
        r = 0;
    function o(i, u, g) {
        for (let c = g, d = u.length; c < d; c++) if (u[c] === i) return ((n += 1), c + 1);
        return -1;
    }
    function s(i) {
        const u = 1 / i,
            g = n / t.length;
        return Te.MATCHES + g * u;
    }
    const a = o(t[0], e, 0);
    if (a < 0) return Te.NO_MATCH;
    r = a;
    for (let i = 1, u = t.length; i < u; i++) {
        const g = t[i];
        if (((r = o(g, e, r)), !(r > -1))) return Te.NO_MATCH;
    }
    const l = r - a;
    return s(l);
}
function Qr(e, t) {
    let { keepDiacritics: n } = t;
    return ((e = `${e}`), n || (e = ra(e)), e);
}
function sa(e, t) {
    let n = t;
    typeof t == 'object' && (n = t.accessor);
    const r = n(e);
    return r == null ? [] : Array.isArray(r) ? r : [String(r)];
}
function aa(e, t) {
    const n = [];
    for (let r = 0, o = t.length; r < o; r++) {
        const s = t[r],
            a = la(s),
            l = sa(e, s);
        for (let i = 0, u = l.length; i < u; i++) n.push({ itemValue: l[i], attributes: a });
    }
    return n;
}
var Yr = { maxRanking: 1 / 0, minRanking: -1 / 0 };
function la(e) {
    return typeof e == 'function' ? Yr : { ...Yr, ...e };
}
var ua = { data: '' },
    ca = (e) =>
        typeof window == 'object'
            ? (
                  (e ? e.querySelector('#_goober') : window._goober) ||
                  Object.assign((e || document.head).appendChild(document.createElement('style')), {
                      innerHTML: ' ',
                      id: '_goober',
                  })
              ).firstChild
            : e || ua,
    da = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,
    fa = /\/\*[^]*?\*\/|  +/g,
    Xr = /\n+/g,
    Dt = (e, t) => {
        let n = '',
            r = '',
            o = '';
        for (let s in e) {
            let a = e[s];
            s[0] == '@'
                ? s[1] == 'i'
                    ? (n = s + ' ' + a + ';')
                    : (r += s[1] == 'f' ? Dt(a, s) : s + '{' + Dt(a, s[1] == 'k' ? '' : t) + '}')
                : typeof a == 'object'
                  ? (r += Dt(
                        a,
                        t
                            ? t.replace(/([^,])+/g, (l) =>
                                  s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g, (i) =>
                                      /&/.test(i) ? i.replace(/&/g, l) : l ? l + ' ' + i : i,
                                  ),
                              )
                            : s,
                    ))
                  : a != null &&
                    ((s = /^--/.test(s) ? s : s.replace(/[A-Z]/g, '-$&').toLowerCase()),
                    (o += Dt.p ? Dt.p(s, a) : s + ':' + a + ';'));
        }
        return n + (t && o ? t + '{' + o + '}' : o) + r;
    },
    at = {},
    Vo = (e) => {
        if (typeof e == 'object') {
            let t = '';
            for (let n in e) t += n + Vo(e[n]);
            return t;
        }
        return e;
    },
    ga = (e, t, n, r, o) => {
        let s = Vo(e),
            a =
                at[s] ||
                (at[s] = ((i) => {
                    let u = 0,
                        g = 11;
                    for (; u < i.length; ) g = (101 * g + i.charCodeAt(u++)) >>> 0;
                    return 'go' + g;
                })(s));
        if (!at[a]) {
            let i =
                s !== e
                    ? e
                    : ((u) => {
                          let g,
                              c,
                              d = [{}];
                          for (; (g = da.exec(u.replace(fa, ''))); )
                              g[4]
                                  ? d.shift()
                                  : g[3]
                                    ? ((c = g[3].replace(Xr, ' ').trim()),
                                      d.unshift((d[0][c] = d[0][c] || {})))
                                    : (d[0][g[1]] = g[2].replace(Xr, ' ').trim());
                          return d[0];
                      })(e);
            at[a] = Dt(o ? { ['@keyframes ' + a]: i } : i, n ? '' : '.' + a);
        }
        let l = n && at.g ? at.g : null;
        return (
            n && (at.g = at[a]),
            ((i, u, g, c) => {
                c
                    ? (u.data = u.data.replace(c, i))
                    : u.data.indexOf(i) === -1 && (u.data = g ? i + u.data : u.data + i);
            })(at[a], t, r, l),
            a
        );
    },
    ha = (e, t, n) =>
        e.reduce((r, o, s) => {
            let a = t[s];
            if (a && a.call) {
                let l = a(n),
                    i = (l && l.props && l.props.className) || (/^go/.test(l) && l);
                a = i
                    ? '.' + i
                    : l && typeof l == 'object'
                      ? l.props
                          ? ''
                          : Dt(l, '')
                      : l === !1
                        ? ''
                        : l;
            }
            return r + o + (a ?? '');
        }, '');
function W(e) {
    let t = this || {},
        n = e.call ? e(t.p) : e;
    return ga(
        n.unshift
            ? n.raw
                ? ha(n, [].slice.call(arguments, 1), t.p)
                : n.reduce((r, o) => Object.assign(r, o && o.call ? o(t.p) : o), {})
            : n,
        ca(t.target),
        t.g,
        t.o,
        t.k,
    );
}
W.bind({ g: 1 });
W.bind({ k: 1 });
function jo(e) {
    var t,
        n,
        r = '';
    if (typeof e == 'string' || typeof e == 'number') r += e;
    else if (typeof e == 'object')
        if (Array.isArray(e)) {
            var o = e.length;
            for (t = 0; t < o; t++) e[t] && (n = jo(e[t])) && (r && (r += ' '), (r += n));
        } else for (n in e) e[n] && (r && (r += ' '), (r += n));
    return r;
}
function O() {
    for (var e, t, n = 0, r = '', o = arguments.length; n < o; n++)
        (e = arguments[n]) && (t = jo(e)) && (r && (r += ' '), (r += t));
    return r;
}
function va(e, t) {
    const n = Bt(e),
        { onChange: r } = t;
    let o = new Set(t.appear ? void 0 : n);
    const s = new WeakSet(),
        [a, l] = z([], { equals: !1 }),
        [i] = Ms(),
        u = (c) => {
            l((d) => (d.push.apply(d, c), d));
            for (const d of c) s.delete(d);
        },
        g = (c, d, f) => c.splice(f, 0, d);
    return q(
        (c) => {
            const d = a(),
                f = e();
            if ((f[Ko], Bt(i))) return (i(), c);
            if (d.length) {
                const h = c.filter((p) => !d.includes(p));
                return (
                    (d.length = 0),
                    r({ list: h, added: [], removed: [], unchanged: h, finishRemoved: u }),
                    h
                );
            }
            return Bt(() => {
                const h = new Set(f),
                    p = f.slice(),
                    v = [],
                    y = [],
                    x = [];
                for (const w of f) (o.has(w) ? x : v).push(w);
                let b = !v.length;
                for (let w = 0; w < c.length; w++) {
                    const $ = c[w];
                    (h.has($) || (s.has($) || (y.push($), s.add($)), g(p, $, w)),
                        b && $ !== p[w] && (b = !1));
                }
                return !y.length && b
                    ? c
                    : (r({ list: p, added: v, removed: y, unchanged: x, finishRemoved: u }),
                      (o = h),
                      p);
            });
        },
        t.appear ? [] : n.slice(),
    );
}
function De(...e) {
    return Ks(e);
}
var Zr = (e) => e instanceof Element;
function Zn(e, t) {
    if (t(e)) return e;
    if (typeof e == 'function' && !e.length) return Zn(e(), t);
    if (Array.isArray(e)) {
        const n = [];
        for (const r of e) {
            const o = Zn(r, t);
            o && (Array.isArray(o) ? n.push.apply(n, o) : n.push(o));
        }
        return n.length ? n : null;
    }
    return null;
}
function ma(e, t = Zr, n = Zr) {
    const r = q(e),
        o = q(() => Zn(r(), t));
    return (
        (o.toArray = () => {
            const s = o();
            return Array.isArray(s) ? s : s ? [s] : [];
        }),
        o
    );
}
function ya(e) {
    return q(() => {
        const t = e.name || 's';
        return {
            enterActive: (e.enterActiveClass || t + '-enter-active').split(' '),
            enter: (e.enterClass || t + '-enter').split(' '),
            enterTo: (e.enterToClass || t + '-enter-to').split(' '),
            exitActive: (e.exitActiveClass || t + '-exit-active').split(' '),
            exit: (e.exitClass || t + '-exit').split(' '),
            exitTo: (e.exitToClass || t + '-exit-to').split(' '),
            move: (e.moveClass || t + '-move').split(' '),
        };
    });
}
function Wo(e) {
    requestAnimationFrame(() => requestAnimationFrame(e));
}
function pa(e, t, n, r) {
    const { onBeforeEnter: o, onEnter: s, onAfterEnter: a } = t;
    (o?.(n),
        n.classList.add(...e.enter),
        n.classList.add(...e.enterActive),
        queueMicrotask(() => {
            if (!n.parentNode) return r?.();
            s?.(n, () => l());
        }),
        Wo(() => {
            (n.classList.remove(...e.enter),
                n.classList.add(...e.enterTo),
                (!s || s.length < 2) &&
                    (n.addEventListener('transitionend', l),
                    n.addEventListener('animationend', l)));
        }));
    function l(i) {
        (!i || i.target === n) &&
            (n.removeEventListener('transitionend', l),
            n.removeEventListener('animationend', l),
            n.classList.remove(...e.enterActive),
            n.classList.remove(...e.enterTo),
            a?.(n));
    }
}
function ba(e, t, n, r) {
    const { onBeforeExit: o, onExit: s, onAfterExit: a } = t;
    if (!n.parentNode) return r?.();
    (o?.(n),
        n.classList.add(...e.exit),
        n.classList.add(...e.exitActive),
        s?.(n, () => l()),
        Wo(() => {
            (n.classList.remove(...e.exit),
                n.classList.add(...e.exitTo),
                (!s || s.length < 2) &&
                    (n.addEventListener('transitionend', l),
                    n.addEventListener('animationend', l)));
        }));
    function l(i) {
        (!i || i.target === n) &&
            (r?.(),
            n.removeEventListener('transitionend', l),
            n.removeEventListener('animationend', l),
            n.classList.remove(...e.exitActive),
            n.classList.remove(...e.exitTo),
            a?.(n));
    }
}
var Jr = (e) => {
        const t = ya(e);
        return va(ma(() => e.children).toArray, {
            appear: e.appear,
            onChange({ added: n, removed: r, finishRemoved: o, list: s }) {
                const a = t();
                for (const i of n) pa(a, e, i);
                const l = [];
                for (const i of s)
                    i.isConnected &&
                        (i instanceof HTMLElement || i instanceof SVGElement) &&
                        l.push({ el: i, rect: i.getBoundingClientRect() });
                queueMicrotask(() => {
                    const i = [];
                    for (const { el: u, rect: g } of l)
                        if (u.isConnected) {
                            const c = u.getBoundingClientRect(),
                                d = g.left - c.left,
                                f = g.top - c.top;
                            (d || f) &&
                                ((u.style.transform = `translate(${d}px, ${f}px)`),
                                (u.style.transitionDuration = '0s'),
                                i.push(u));
                        }
                    document.body.offsetHeight;
                    for (const u of i) {
                        let g = function (c) {
                            (c.target === u || /transform$/.test(c.propertyName)) &&
                                (u.removeEventListener('transitionend', g),
                                u.classList.remove(...a.move));
                        };
                        (u.classList.add(...a.move),
                            (u.style.transform = u.style.transitionDuration = ''),
                            u.addEventListener('transitionend', g));
                    }
                });
                for (const i of r) ba(a, e, i, () => o([i]));
            },
        });
    },
    Hn = Symbol('fallback');
function eo(e) {
    for (const t of e) t.dispose();
}
function xa(e, t, n, r = {}) {
    const o = new Map();
    return (
        U(() => eo(o.values())),
        () => {
            const a = e() || [];
            return (
                a[Ko],
                Bt(() => {
                    if (!a.length)
                        return (
                            eo(o.values()),
                            o.clear(),
                            r.fallback ? [Hr((c) => (o.set(Hn, { dispose: c }), r.fallback()))] : []
                        );
                    const l = new Array(a.length),
                        i = o.get(Hn);
                    if (!o.size || i) {
                        (i?.dispose(), o.delete(Hn));
                        for (let g = 0; g < a.length; g++) {
                            const c = a[g],
                                d = t(c, g);
                            s(l, c, g, d);
                        }
                        return l;
                    }
                    const u = new Set(o.keys());
                    for (let g = 0; g < a.length; g++) {
                        const c = a[g],
                            d = t(c, g);
                        u.delete(d);
                        const f = o.get(d);
                        f
                            ? ((l[g] = f.mapped), f.setIndex?.(g), f.setItem(() => c))
                            : s(l, c, g, d);
                    }
                    for (const g of u) (o.get(g)?.dispose(), o.delete(g));
                    return l;
                })
            );
        }
    );
    function s(a, l, i, u) {
        Hr((g) => {
            const [c, d] = z(l),
                f = { setItem: d, dispose: g };
            if (n.length > 1) {
                const [h, p] = z(i);
                ((f.setIndex = p), (f.mapped = n(c, h)));
            } else f.mapped = n(c);
            (o.set(u, f), (a[i] = f.mapped));
        });
    }
}
function kn(e) {
    const { by: t } = e;
    return q(
        xa(
            () => e.each,
            typeof t == 'function' ? t : (n) => n[t],
            e.children,
            'fallback' in e ? { fallback: () => e.fallback } : void 0,
        ),
    );
}
function wa(e, t, n, r) {
    return (e.addEventListener(t, n, r), Ns(e.removeEventListener.bind(e, t, n, r)));
}
function $a(e, t, n, r) {
    const o = () => {
        Yn(E(e)).forEach((s) => {
            s && Yn(E(t)).forEach((a) => wa(s, a, n, r));
        });
    };
    typeof e == 'function' ? B(o) : G(o);
}
function Ca(e, t) {
    const n = new ResizeObserver(e);
    return (
        U(n.disconnect.bind(n)),
        { observe: (r) => n.observe(r, t), unobserve: n.unobserve.bind(n) }
    );
}
function Sa(e, t, n) {
    const r = new WeakMap(),
        { observe: o, unobserve: s } = Ca((a) => {
            for (const l of a) {
                const { contentRect: i, target: u } = l,
                    g = Math.round(i.width),
                    c = Math.round(i.height),
                    d = r.get(u);
                (!d || d.width !== g || d.height !== c) &&
                    (t(i, u, l), r.set(u, { width: g, height: c }));
            }
        }, n);
    B((a) => {
        const l = zs(Yn(E(e)));
        return (Hs(l, a, o, s), l);
    }, []);
}
var ka = /((?:--)?(?:\w+-?)+)\s*:\s*([^;]*)/g;
function to(e) {
    const t = {};
    let n;
    for (; (n = ka.exec(e)); ) t[n[1]] = n[2];
    return t;
}
function In(e, t) {
    if (typeof e == 'string') {
        if (typeof t == 'string') return `${e};${t}`;
        e = to(e);
    } else typeof t == 'string' && (t = to(t));
    return { ...e, ...t };
}
function Ea(e, t, n = -1) {
    return n in e ? [...e.slice(0, n), t, ...e.slice(n)] : [...e, t];
}
function Jn(e, t) {
    const n = [...e],
        r = n.indexOf(t);
    return (r !== -1 && n.splice(r, 1), n);
}
function Ma(e) {
    return typeof e == 'number';
}
function _t(e) {
    return Object.prototype.toString.call(e) === '[object String]';
}
function Da(e) {
    return typeof e == 'function';
}
function dn(e) {
    return (t) => `${e()}-${t}`;
}
function Ke(e, t) {
    return e ? e === t || e.contains(t) : !1;
}
function rn(e, t = !1) {
    const { activeElement: n } = Ze(e);
    if (!n?.nodeName) return null;
    if (Qo(n) && n.contentDocument) return rn(n.contentDocument.body, t);
    if (t) {
        const r = n.getAttribute('aria-activedescendant');
        if (r) {
            const o = Ze(n).getElementById(r);
            if (o) return o;
        }
    }
    return n;
}
function Aa(e) {
    return Ze(e).defaultView || window;
}
function Ze(e) {
    return e ? e.ownerDocument || e : document;
}
function Qo(e) {
    return e.tagName === 'IFRAME';
}
var dr = ((e) => (
    (e.Escape = 'Escape'),
    (e.Enter = 'Enter'),
    (e.Tab = 'Tab'),
    (e.Space = ' '),
    (e.ArrowDown = 'ArrowDown'),
    (e.ArrowLeft = 'ArrowLeft'),
    (e.ArrowRight = 'ArrowRight'),
    (e.ArrowUp = 'ArrowUp'),
    (e.End = 'End'),
    (e.Home = 'Home'),
    (e.PageDown = 'PageDown'),
    (e.PageUp = 'PageUp'),
    e
))(dr || {});
function fr(e) {
    return typeof window < 'u' && window.navigator != null
        ? e.test(window.navigator.userAgentData?.platform || window.navigator.platform)
        : !1;
}
function Pn() {
    return fr(/^Mac/i);
}
function Ta() {
    return fr(/^iPhone/i);
}
function Fa() {
    return fr(/^iPad/i) || (Pn() && navigator.maxTouchPoints > 1);
}
function Ia() {
    return Ta() || Fa();
}
function Pa() {
    return Pn() || Ia();
}
function de(e, t) {
    return (t && (Da(t) ? t(e) : t[0](t[1], e)), e?.defaultPrevented);
}
function be(e) {
    return (t) => {
        for (const n of e) de(t, n);
    };
}
function La(e) {
    return Pn() ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
}
function ke(e) {
    if (e)
        if (Oa()) e.focus({ preventScroll: !0 });
        else {
            const t = qa(e);
            (e.focus(), _a(t));
        }
}
var bn = null;
function Oa() {
    if (bn == null) {
        bn = !1;
        try {
            document.createElement('div').focus({
                get preventScroll() {
                    return ((bn = !0), !0);
                },
            });
        } catch {}
    }
    return bn;
}
function qa(e) {
    let t = e.parentNode;
    const n = [],
        r = document.scrollingElement || document.documentElement;
    for (; t instanceof HTMLElement && t !== r; )
        ((t.offsetHeight < t.scrollHeight || t.offsetWidth < t.scrollWidth) &&
            n.push({ element: t, scrollTop: t.scrollTop, scrollLeft: t.scrollLeft }),
            (t = t.parentNode));
    return (
        r instanceof HTMLElement &&
            n.push({ element: r, scrollTop: r.scrollTop, scrollLeft: r.scrollLeft }),
        n
    );
}
function _a(e) {
    for (const { element: t, scrollTop: n, scrollLeft: r } of e)
        ((t.scrollTop = n), (t.scrollLeft = r));
}
var Yo = [
        "input:not([type='hidden']):not([disabled])",
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'a[href]',
        'area[href]',
        '[tabindex]',
        'iframe',
        'object',
        'embed',
        'audio[controls]',
        'video[controls]',
        "[contenteditable]:not([contenteditable='false'])",
    ],
    Ra = [...Yo, '[tabindex]:not([tabindex="-1"]):not([disabled])'],
    gr = Yo.join(':not([hidden]),') + ',[tabindex]:not([disabled]):not([hidden])',
    za = Ra.join(':not([hidden]):not([tabindex="-1"]),');
function Xo(e, t) {
    const r = Array.from(e.querySelectorAll(gr)).filter(no);
    return (
        t && no(e) && r.unshift(e),
        r.forEach((o, s) => {
            if (Qo(o) && o.contentDocument) {
                const a = o.contentDocument.body,
                    l = Xo(a, !1);
                r.splice(s, 1, ...l);
            }
        }),
        r
    );
}
function no(e) {
    return Zo(e) && !Ka(e);
}
function Zo(e) {
    return e.matches(gr) && hr(e);
}
function Ka(e) {
    return parseInt(e.getAttribute('tabindex') || '0', 10) < 0;
}
function hr(e, t) {
    return (
        e.nodeName !== '#comment' &&
        Ba(e) &&
        Na(e, t) &&
        (!e.parentElement || hr(e.parentElement, e))
    );
}
function Ba(e) {
    if (!(e instanceof HTMLElement) && !(e instanceof SVGElement)) return !1;
    const { display: t, visibility: n } = e.style;
    let r = t !== 'none' && n !== 'hidden' && n !== 'collapse';
    if (r) {
        if (!e.ownerDocument.defaultView) return r;
        const { getComputedStyle: o } = e.ownerDocument.defaultView,
            { display: s, visibility: a } = o(e);
        r = s !== 'none' && a !== 'hidden' && a !== 'collapse';
    }
    return r;
}
function Na(e, t) {
    return (
        !e.hasAttribute('hidden') &&
        (e.nodeName === 'DETAILS' && t && t.nodeName !== 'SUMMARY' ? e.hasAttribute('open') : !0)
    );
}
function Ha(e, t, n) {
    const r = t?.tabbable ? za : gr,
        o = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
            acceptNode(s) {
                return t?.from?.contains(s)
                    ? NodeFilter.FILTER_REJECT
                    : s.matches(r) && hr(s) && (!t?.accept || t.accept(s))
                      ? NodeFilter.FILTER_ACCEPT
                      : NodeFilter.FILTER_SKIP;
            },
        });
    return (t?.from && (o.currentNode = t.from), o);
}
function ro(e) {
    for (; e && !Ga(e); ) e = e.parentElement;
    return e || document.scrollingElement || document.documentElement;
}
function Ga(e) {
    const t = window.getComputedStyle(e);
    return /(auto|scroll)/.test(t.overflow + t.overflowX + t.overflowY);
}
function Ua() {}
function Va(e, t) {
    const [n, r] = e;
    let o = !1;
    const s = t.length;
    for (let a = s, l = 0, i = a - 1; l < a; i = l++) {
        const [u, g] = t[l],
            [c, d] = t[i],
            [, f] = t[i === 0 ? a - 1 : i - 1] || [0, 0],
            h = (g - d) * (n - u) - (u - c) * (r - g);
        if (d < g) {
            if (r >= d && r < g) {
                if (h === 0) return !0;
                h > 0 && (r === d ? r > f && (o = !o) : (o = !o));
            }
        } else if (g < d) {
            if (r > g && r <= d) {
                if (h === 0) return !0;
                h < 0 && (r === d ? r < f && (o = !o) : (o = !o));
            }
        } else if (r == g && ((n >= c && n <= u) || (n >= u && n <= c))) return !0;
    }
    return o;
}
function Q(e, t) {
    return j(e, t);
}
var Jt = new Map(),
    oo = new Set();
function io() {
    if (typeof window > 'u') return;
    const e = (n) => {
            if (!n.target) return;
            let r = Jt.get(n.target);
            (r ||
                ((r = new Set()),
                Jt.set(n.target, r),
                n.target.addEventListener('transitioncancel', t)),
                r.add(n.propertyName));
        },
        t = (n) => {
            if (!n.target) return;
            const r = Jt.get(n.target);
            if (
                r &&
                (r.delete(n.propertyName),
                r.size === 0 &&
                    (n.target.removeEventListener('transitioncancel', t), Jt.delete(n.target)),
                Jt.size === 0)
            ) {
                for (const o of oo) o();
                oo.clear();
            }
        };
    (document.body.addEventListener('transitionrun', e),
        document.body.addEventListener('transitionend', t));
}
typeof document < 'u' &&
    (document.readyState !== 'loading' ? io() : document.addEventListener('DOMContentLoaded', io));
function er(e, t) {
    const n = so(e, t, 'left'),
        r = so(e, t, 'top'),
        o = t.offsetWidth,
        s = t.offsetHeight;
    let a = e.scrollLeft,
        l = e.scrollTop;
    const i = a + e.offsetWidth,
        u = l + e.offsetHeight;
    (n <= a ? (a = n) : n + o > i && (a += n + o - i),
        r <= l ? (l = r) : r + s > u && (l += r + s - u),
        (e.scrollLeft = a),
        (e.scrollTop = l));
}
function so(e, t, n) {
    const r = n === 'left' ? 'offsetLeft' : 'offsetTop';
    let o = 0;
    for (; t.offsetParent && ((o += t[r]), t.offsetParent !== e); ) {
        if (t.offsetParent.contains(e)) {
            o -= e[r];
            break;
        }
        t = t.offsetParent;
    }
    return o;
}
function ja(e, t) {
    if (document.contains(e)) {
        const n = document.scrollingElement || document.documentElement;
        if (window.getComputedStyle(n).overflow === 'hidden') {
            let o = ro(e);
            for (; e && o && e !== n && o !== n; ) (er(o, e), (e = o), (o = ro(e)));
        } else {
            const { left: o, top: s } = e.getBoundingClientRect();
            e?.scrollIntoView?.({ block: 'nearest' });
            const { left: a, top: l } = e.getBoundingClientRect();
            (Math.abs(o - a) > 1 || Math.abs(s - l) > 1) &&
                e.scrollIntoView?.({ block: 'nearest' });
        }
    }
}
var Jo = {
    border: '0',
    clip: 'rect(0 0 0 0)',
    'clip-path': 'inset(50%)',
    height: '1px',
    margin: '0 -1px -1px 0',
    overflow: 'hidden',
    padding: '0',
    position: 'absolute',
    width: '1px',
    'white-space': 'nowrap',
};
function Be(e) {
    return (t) => (e(t), () => e(void 0));
}
function Ln(e, t) {
    const [n, r] = z(ao(t?.()));
    return (
        B(() => {
            r(e()?.tagName.toLowerCase() || ao(t?.()));
        }),
        n
    );
}
function ao(e) {
    return _t(e) ? e : void 0;
}
function fe(e) {
    const [t, n] = J(e, ['as']);
    if (!t.as) throw new Error('[kobalte]: Polymorphic is missing the required `as` prop.');
    return m(
        Os,
        j(n, {
            get component() {
                return t.as;
            },
        }),
    );
}
var Wa = ['id', 'name', 'validationState', 'required', 'disabled', 'readOnly'];
function Qa(e) {
    const t = `form-control-${Oe()}`,
        n = Q({ id: t }, e),
        [r, o] = z(),
        [s, a] = z(),
        [l, i] = z(),
        [u, g] = z(),
        c = (p, v, y) => {
            const x = y != null || r() != null;
            return [y, r(), x && v != null ? p : void 0].filter(Boolean).join(' ') || void 0;
        },
        d = (p) => [l(), u(), p].filter(Boolean).join(' ') || void 0,
        f = q(() => ({
            'data-valid': E(n.validationState) === 'valid' ? '' : void 0,
            'data-invalid': E(n.validationState) === 'invalid' ? '' : void 0,
            'data-required': E(n.required) ? '' : void 0,
            'data-disabled': E(n.disabled) ? '' : void 0,
            'data-readonly': E(n.readOnly) ? '' : void 0,
        }));
    return {
        formControlContext: {
            name: () => E(n.name) ?? E(n.id),
            dataset: f,
            validationState: () => E(n.validationState),
            isRequired: () => E(n.required),
            isDisabled: () => E(n.disabled),
            isReadOnly: () => E(n.readOnly),
            labelId: r,
            fieldId: s,
            descriptionId: l,
            errorMessageId: u,
            getAriaLabelledBy: c,
            getAriaDescribedBy: d,
            generateId: dn(() => E(n.id)),
            registerLabel: Be(o),
            registerField: Be(a),
            registerDescription: Be(i),
            registerErrorMessage: Be(g),
        },
    };
}
var ei = xe();
function fn() {
    const e = we(ei);
    if (e === void 0)
        throw new Error(
            '[kobalte]: `useFormControlContext` must be used within a `FormControlContext.Provider` component',
        );
    return e;
}
function ti(e) {
    const t = fn(),
        n = Q({ id: t.generateId('description') }, e);
    return (
        B(() => U(t.registerDescription(n.id))),
        m(
            fe,
            j({ as: 'div' }, () => t.dataset(), n),
        )
    );
}
function ni(e) {
    const t = fn(),
        n = Q({ id: t.generateId('error-message') }, e),
        [r, o] = J(n, ['forceMount']),
        s = () => t.validationState() === 'invalid';
    return (
        B(() => {
            s() && U(t.registerErrorMessage(o.id));
        }),
        m(R, {
            get when() {
                return r.forceMount || s();
            },
            get children() {
                return m(
                    fe,
                    j({ as: 'div' }, () => t.dataset(), o),
                );
            },
        })
    );
}
function Ya(e) {
    let t;
    const n = fn(),
        r = Q({ id: n.generateId('label') }, e),
        [o, s] = J(r, ['ref']),
        a = Ln(
            () => t,
            () => 'label',
        );
    return (
        B(() => U(n.registerLabel(s.id))),
        m(
            fe,
            j(
                {
                    as: 'label',
                    ref(l) {
                        const i = De((u) => (t = u), o.ref);
                        typeof i == 'function' && i(l);
                    },
                    get for() {
                        return ve(() => a() === 'label')() ? n.fieldId() : void 0;
                    },
                },
                () => n.dataset(),
                s,
            ),
        )
    );
}
function Xa(e, t) {
    B(
        dt(e, (n) => {
            if (n == null) return;
            const r = Za(n);
            r != null &&
                (r.addEventListener('reset', t, { passive: !0 }),
                U(() => {
                    r.removeEventListener('reset', t);
                }));
        }),
    );
}
function Za(e) {
    return Ja(e) ? e.form : e.closest('form');
}
function Ja(e) {
    return e.matches('textarea, input, select, button');
}
function gn(e) {
    const [t, n] = z(e.defaultValue?.()),
        r = q(() => e.value?.() !== void 0),
        o = q(() => (r() ? e.value?.() : t()));
    return [
        o,
        (a) => {
            Bt(() => {
                const l = Bs(a, o());
                return (Object.is(l, o()) || (r() || n(l), e.onChange?.(l)), l);
            });
        },
    ];
}
function ri(e) {
    const [t, n] = gn(e);
    return [() => t() ?? !1, n];
}
function el(e) {
    const [t, n] = gn(e);
    return [() => t() ?? [], n];
}
function tl(e = {}) {
    const [t, n] = ri({
        value: () => E(e.isSelected),
        defaultValue: () => !!E(e.defaultIsSelected),
        onChange: (s) => e.onSelectedChange?.(s),
    });
    return {
        isSelected: t,
        setIsSelected: (s) => {
            !E(e.isReadOnly) && !E(e.isDisabled) && n(s);
        },
        toggle: () => {
            !E(e.isReadOnly) && !E(e.isDisabled) && n(!t());
        },
    };
}
var nl = Object.defineProperty,
    On = (e, t) => {
        for (var n in t) nl(e, n, { get: t[n], enumerable: !0 });
    },
    oi = xe();
function ii() {
    return we(oi);
}
function rl() {
    const e = ii();
    if (e === void 0)
        throw new Error(
            '[kobalte]: `useDomCollectionContext` must be used within a `DomCollectionProvider` component',
        );
    return e;
}
function si(e, t) {
    return !!(t.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING);
}
function ol(e, t) {
    const n = t.ref();
    if (!n) return -1;
    let r = e.length;
    if (!r) return -1;
    for (; r--; ) {
        const o = e[r]?.ref();
        if (o && si(o, n)) return r + 1;
    }
    return 0;
}
function il(e) {
    const t = e.map((r, o) => [o, r]);
    let n = !1;
    return (
        t.sort(([r, o], [s, a]) => {
            const l = o.ref(),
                i = a.ref();
            return l === i || !l || !i
                ? 0
                : si(l, i)
                  ? (r > s && (n = !0), -1)
                  : (r < s && (n = !0), 1);
        }),
        n ? t.map(([r, o]) => o) : e
    );
}
function ai(e, t) {
    const n = il(e);
    e !== n && t(n);
}
function sl(e) {
    const t = e[0],
        n = e[e.length - 1]?.ref();
    let r = t?.ref()?.parentElement;
    for (; r; ) {
        if (n && r.contains(n)) return r;
        r = r.parentElement;
    }
    return Ze(r).body;
}
function al(e, t) {
    B(() => {
        const n = setTimeout(() => {
            ai(e(), t);
        });
        U(() => clearTimeout(n));
    });
}
function ll(e, t) {
    if (typeof IntersectionObserver != 'function') {
        al(e, t);
        return;
    }
    let n = [];
    B(() => {
        const r = () => {
                const a = !!n.length;
                ((n = e()), a && ai(e(), t));
            },
            o = sl(e()),
            s = new IntersectionObserver(r, { root: o });
        for (const a of e()) {
            const l = a.ref();
            l && s.observe(l);
        }
        U(() => s.disconnect());
    });
}
function ul(e = {}) {
    const [t, n] = el({ value: () => E(e.items), onChange: (s) => e.onItemsChange?.(s) });
    ll(t, n);
    const r = (s) => (
        n((a) => {
            const l = ol(a, s);
            return Ea(a, s, l);
        }),
        () => {
            n((a) => {
                const l = a.filter((i) => i.ref() !== s.ref());
                return a.length === l.length ? a : l;
            });
        }
    );
    return {
        DomCollectionProvider: (s) =>
            m(oi.Provider, {
                value: { registerItem: r },
                get children() {
                    return s.children;
                },
            }),
    };
}
function cl(e) {
    const t = rl(),
        n = Q({ shouldRegisterItem: !0 }, e);
    B(() => {
        if (!n.shouldRegisterItem) return;
        const r = t.registerItem(n.getItem());
        U(r);
    });
}
function li(e) {
    let t = e.startIndex ?? 0;
    const n = e.startLevel ?? 0,
        r = [],
        o = (i) => {
            if (i == null) return '';
            const u = e.getKey ?? 'key',
                g = _t(u) ? i[u] : u(i);
            return g != null ? String(g) : '';
        },
        s = (i) => {
            if (i == null) return '';
            const u = e.getTextValue ?? 'textValue',
                g = _t(u) ? i[u] : u(i);
            return g != null ? String(g) : '';
        },
        a = (i) => {
            if (i == null) return !1;
            const u = e.getDisabled ?? 'disabled';
            return (_t(u) ? i[u] : u(i)) ?? !1;
        },
        l = (i) => {
            if (i != null)
                return _t(e.getSectionChildren)
                    ? i[e.getSectionChildren]
                    : e.getSectionChildren?.(i);
        };
    for (const i of e.dataSource) {
        if (_t(i) || Ma(i)) {
            (r.push({
                type: 'item',
                rawValue: i,
                key: String(i),
                textValue: String(i),
                disabled: a(i),
                level: n,
                index: t,
            }),
                t++);
            continue;
        }
        if (l(i) != null) {
            (r.push({
                type: 'section',
                rawValue: i,
                key: '',
                textValue: '',
                disabled: !1,
                level: n,
                index: t,
            }),
                t++);
            const u = l(i) ?? [];
            if (u.length > 0) {
                const g = li({
                    dataSource: u,
                    getKey: e.getKey,
                    getTextValue: e.getTextValue,
                    getDisabled: e.getDisabled,
                    getSectionChildren: e.getSectionChildren,
                    startIndex: t,
                    startLevel: n + 1,
                });
                (r.push(...g), (t += g.length));
            }
        } else
            (r.push({
                type: 'item',
                rawValue: i,
                key: o(i),
                textValue: s(i),
                disabled: a(i),
                level: n,
                index: t,
            }),
                t++);
    }
    return r;
}
function dl(e, t = []) {
    return q(() => {
        const n = li({
            dataSource: E(e.dataSource),
            getKey: E(e.getKey),
            getTextValue: E(e.getTextValue),
            getDisabled: E(e.getDisabled),
            getSectionChildren: E(e.getSectionChildren),
        });
        for (let r = 0; r < t.length; r++) t[r]();
        return e.factory(n);
    });
}
var fl = new Set([
        'Avst',
        'Arab',
        'Armi',
        'Syrc',
        'Samr',
        'Mand',
        'Thaa',
        'Mend',
        'Nkoo',
        'Adlm',
        'Rohg',
        'Hebr',
    ]),
    gl = new Set([
        'ae',
        'ar',
        'arc',
        'bcc',
        'bqi',
        'ckb',
        'dv',
        'fa',
        'glk',
        'he',
        'ku',
        'mzn',
        'nqo',
        'pnb',
        'ps',
        'sd',
        'ug',
        'ur',
        'yi',
    ]);
function hl(e) {
    if (Intl.Locale) {
        const n = new Intl.Locale(e).maximize().script ?? '';
        return fl.has(n);
    }
    const t = e.split('-')[0];
    return gl.has(t);
}
function vl(e) {
    return hl(e) ? 'rtl' : 'ltr';
}
function ui() {
    let e = (typeof navigator < 'u' && (navigator.language || navigator.userLanguage)) || 'en-US';
    return { locale: e, direction: vl(e) };
}
var tr = ui(),
    on = new Set();
function lo() {
    tr = ui();
    for (const e of on) e(tr);
}
function ml() {
    const [e, t] = z(tr),
        n = q(() => e());
    return (
        xt(() => {
            (on.size === 0 && window.addEventListener('languagechange', lo),
                on.add(t),
                U(() => {
                    (on.delete(t),
                        on.size === 0 && window.removeEventListener('languagechange', lo));
                }));
        }),
        { locale: () => n().locale, direction: () => n().direction }
    );
}
var yl = xe();
function St() {
    const e = ml();
    return we(yl) || e;
}
var Gn = new Map();
function pl(e) {
    const { locale: t } = St(),
        n = q(
            () =>
                t() +
                (e
                    ? Object.entries(e)
                          .sort((r, o) => (r[0] < o[0] ? -1 : 1))
                          .join()
                    : ''),
        );
    return q(() => {
        const r = n();
        let o;
        return (
            Gn.has(r) && (o = Gn.get(r)),
            o || ((o = new Intl.Collator(t(), e)), Gn.set(r, o)),
            o
        );
    });
}
var lt = class ci extends Set {
    anchorKey;
    currentKey;
    constructor(t, n, r) {
        (super(t),
            t instanceof ci
                ? ((this.anchorKey = n || t.anchorKey), (this.currentKey = r || t.currentKey))
                : ((this.anchorKey = n), (this.currentKey = r)));
    }
};
function bl(e) {
    const [t, n] = gn(e);
    return [() => t() ?? new lt(), n];
}
function di(e) {
    return Pa() ? e.altKey : e.ctrlKey;
}
function Rt(e) {
    return Pn() ? e.metaKey : e.ctrlKey;
}
function uo(e) {
    return new lt(e);
}
function xl(e, t) {
    if (e.size !== t.size) return !1;
    for (const n of e) if (!t.has(n)) return !1;
    return !0;
}
function wl(e) {
    const t = Q({ selectionMode: 'none', selectionBehavior: 'toggle' }, e),
        [n, r] = z(!1),
        [o, s] = z(),
        a = q(() => {
            const p = E(t.selectedKeys);
            return p != null ? uo(p) : p;
        }),
        l = q(() => {
            const p = E(t.defaultSelectedKeys);
            return p != null ? uo(p) : new lt();
        }),
        [i, u] = bl({ value: a, defaultValue: l, onChange: (p) => t.onSelectionChange?.(p) }),
        [g, c] = z(E(t.selectionBehavior)),
        d = () => E(t.selectionMode),
        f = () => E(t.disallowEmptySelection) ?? !1,
        h = (p) => {
            (E(t.allowDuplicateSelectionEvents) || !xl(p, i())) && u(p);
        };
    return (
        B(() => {
            const p = i();
            E(t.selectionBehavior) === 'replace' &&
                g() === 'toggle' &&
                typeof p == 'object' &&
                p.size === 0 &&
                c('replace');
        }),
        B(() => {
            c(E(t.selectionBehavior) ?? 'toggle');
        }),
        {
            selectionMode: d,
            disallowEmptySelection: f,
            selectionBehavior: g,
            setSelectionBehavior: c,
            isFocused: n,
            setFocused: r,
            focusedKey: o,
            setFocusedKey: s,
            selectedKeys: i,
            setSelectedKeys: h,
        }
    );
}
function $l(e) {
    const [t, n] = z(''),
        [r, o] = z(-1);
    return {
        typeSelectHandlers: {
            onKeyDown: (a) => {
                if (E(e.isDisabled)) return;
                const l = E(e.keyboardDelegate),
                    i = E(e.selectionManager);
                if (!l.getKeyForSearch) return;
                const u = Cl(a.key);
                if (!u || a.ctrlKey || a.metaKey) return;
                u === ' ' && t().trim().length > 0 && (a.preventDefault(), a.stopPropagation());
                let g = n((d) => d + u),
                    c = l.getKeyForSearch(g, i.focusedKey()) ?? l.getKeyForSearch(g);
                (c == null &&
                    Sl(g) &&
                    ((g = g[0]),
                    (c = l.getKeyForSearch(g, i.focusedKey()) ?? l.getKeyForSearch(g))),
                    c != null && (i.setFocusedKey(c), e.onTypeSelect?.(c)),
                    clearTimeout(r()),
                    o(window.setTimeout(() => n(''), 500)));
            },
        },
    };
}
function Cl(e) {
    return e.length === 1 || !/^[A-Z]/i.test(e) ? e : '';
}
function Sl(e) {
    return e.split('').every((t) => t === e[0]);
}
function kl(e, t, n) {
    const o = j(
            { selectOnFocus: () => E(e.selectionManager).selectionBehavior() === 'replace' },
            e,
        ),
        s = () => t(),
        { direction: a } = St();
    let l = { top: 0, left: 0 };
    $a(
        () => (E(o.isVirtualized) ? void 0 : s()),
        'scroll',
        () => {
            const v = s();
            v && (l = { top: v.scrollTop, left: v.scrollLeft });
        },
    );
    const { typeSelectHandlers: i } = $l({
            isDisabled: () => E(o.disallowTypeAhead),
            keyboardDelegate: () => E(o.keyboardDelegate),
            selectionManager: () => E(o.selectionManager),
        }),
        u = () => E(o.orientation) ?? 'vertical',
        g = (v) => {
            (de(v, i.onKeyDown), v.altKey && v.key === 'Tab' && v.preventDefault());
            const y = t();
            if (!y?.contains(v.target)) return;
            const x = E(o.selectionManager),
                b = E(o.selectOnFocus),
                w = (T) => {
                    T != null &&
                        (x.setFocusedKey(T),
                        v.shiftKey && x.selectionMode() === 'multiple'
                            ? x.extendSelection(T)
                            : b && !di(v) && x.replaceSelection(T));
                },
                $ = E(o.keyboardDelegate),
                L = E(o.shouldFocusWrap),
                D = x.focusedKey();
            switch (v.key) {
                case u() === 'vertical' ? 'ArrowDown' : 'ArrowRight': {
                    if ($.getKeyBelow) {
                        v.preventDefault();
                        let T;
                        (D != null ? (T = $.getKeyBelow(D)) : (T = $.getFirstKey?.()),
                            T == null && L && (T = $.getFirstKey?.(D)),
                            w(T));
                    }
                    break;
                }
                case u() === 'vertical' ? 'ArrowUp' : 'ArrowLeft': {
                    if ($.getKeyAbove) {
                        v.preventDefault();
                        let T;
                        (D != null ? (T = $.getKeyAbove(D)) : (T = $.getLastKey?.()),
                            T == null && L && (T = $.getLastKey?.(D)),
                            w(T));
                    }
                    break;
                }
                case u() === 'vertical' ? 'ArrowLeft' : 'ArrowUp': {
                    if ($.getKeyLeftOf) {
                        v.preventDefault();
                        const T = a() === 'rtl';
                        let k;
                        (D != null
                            ? (k = $.getKeyLeftOf(D))
                            : (k = T ? $.getFirstKey?.() : $.getLastKey?.()),
                            w(k));
                    }
                    break;
                }
                case u() === 'vertical' ? 'ArrowRight' : 'ArrowDown': {
                    if ($.getKeyRightOf) {
                        v.preventDefault();
                        const T = a() === 'rtl';
                        let k;
                        (D != null
                            ? (k = $.getKeyRightOf(D))
                            : (k = T ? $.getLastKey?.() : $.getFirstKey?.()),
                            w(k));
                    }
                    break;
                }
                case 'Home':
                    if ($.getFirstKey) {
                        v.preventDefault();
                        const T = $.getFirstKey(D, Rt(v));
                        T != null &&
                            (x.setFocusedKey(T),
                            Rt(v) && v.shiftKey && x.selectionMode() === 'multiple'
                                ? x.extendSelection(T)
                                : b && x.replaceSelection(T));
                    }
                    break;
                case 'End':
                    if ($.getLastKey) {
                        v.preventDefault();
                        const T = $.getLastKey(D, Rt(v));
                        T != null &&
                            (x.setFocusedKey(T),
                            Rt(v) && v.shiftKey && x.selectionMode() === 'multiple'
                                ? x.extendSelection(T)
                                : b && x.replaceSelection(T));
                    }
                    break;
                case 'PageDown':
                    if ($.getKeyPageBelow && D != null) {
                        v.preventDefault();
                        const T = $.getKeyPageBelow(D);
                        w(T);
                    }
                    break;
                case 'PageUp':
                    if ($.getKeyPageAbove && D != null) {
                        v.preventDefault();
                        const T = $.getKeyPageAbove(D);
                        w(T);
                    }
                    break;
                case 'a':
                    Rt(v) &&
                        x.selectionMode() === 'multiple' &&
                        E(o.disallowSelectAll) !== !0 &&
                        (v.preventDefault(), x.selectAll());
                    break;
                case 'Escape':
                    v.defaultPrevented ||
                        (v.preventDefault(), E(o.disallowEmptySelection) || x.clearSelection());
                    break;
                case 'Tab':
                    if (!E(o.allowsTabNavigation)) {
                        if (v.shiftKey) y.focus();
                        else {
                            const T = Ha(y, { tabbable: !0 });
                            let k, F;
                            do ((F = T.lastChild()), F && (k = F));
                            while (F);
                            k && !k.contains(document.activeElement) && ke(k);
                        }
                        break;
                    }
            }
        },
        c = (v) => {
            const y = E(o.selectionManager),
                x = E(o.keyboardDelegate),
                b = E(o.selectOnFocus);
            if (y.isFocused()) {
                v.currentTarget.contains(v.target) || y.setFocused(!1);
                return;
            }
            if (v.currentTarget.contains(v.target)) {
                if ((y.setFocused(!0), y.focusedKey() == null)) {
                    const w = (L) => {
                            L != null && (y.setFocusedKey(L), b && y.replaceSelection(L));
                        },
                        $ = v.relatedTarget;
                    $ &&
                    v.currentTarget.compareDocumentPosition($) & Node.DOCUMENT_POSITION_FOLLOWING
                        ? w(y.lastSelectedKey() ?? x.getLastKey?.())
                        : w(y.firstSelectedKey() ?? x.getFirstKey?.());
                } else if (!E(o.isVirtualized)) {
                    const w = s();
                    if (w) {
                        ((w.scrollTop = l.top), (w.scrollLeft = l.left));
                        const $ = w.querySelector(`[data-key="${y.focusedKey()}"]`);
                        $ && (ke($), er(w, $));
                    }
                }
            }
        },
        d = (v) => {
            const y = E(o.selectionManager);
            v.currentTarget.contains(v.relatedTarget) || y.setFocused(!1);
        },
        f = (v) => {
            s() === v.target && v.preventDefault();
        },
        h = () => {
            const v = E(o.autoFocus);
            if (!v) return;
            const y = E(o.selectionManager),
                x = E(o.keyboardDelegate);
            let b;
            (v === 'first' && (b = x.getFirstKey?.()), v === 'last' && (b = x.getLastKey?.()));
            const w = y.selectedKeys();
            (w.size && (b = w.values().next().value), y.setFocused(!0), y.setFocusedKey(b));
            const $ = t();
            $ && b == null && !E(o.shouldUseVirtualFocus) && ke($);
        };
    return (
        xt(() => {
            o.deferAutoFocus ? setTimeout(h, 0) : h();
        }),
        B(
            dt([s, () => E(o.isVirtualized), () => E(o.selectionManager).focusedKey()], (v) => {
                const [y, x, b] = v;
                if (x) b && o.scrollToKey?.(b);
                else if (b && y) {
                    const w = y.querySelector(`[data-key="${b}"]`);
                    w && er(y, w);
                }
            }),
        ),
        {
            tabIndex: q(() => {
                if (!E(o.shouldUseVirtualFocus))
                    return E(o.selectionManager).focusedKey() == null ? 0 : -1;
            }),
            onKeyDown: g,
            onMouseDown: f,
            onFocusIn: c,
            onFocusOut: d,
        }
    );
}
function fi(e, t) {
    const n = () => E(e.selectionManager),
        r = () => E(e.key),
        o = () => E(e.shouldUseVirtualFocus),
        s = (x) => {
            n().selectionMode() !== 'none' &&
                (n().selectionMode() === 'single'
                    ? n().isSelected(r()) && !n().disallowEmptySelection()
                        ? n().toggleSelection(r())
                        : n().replaceSelection(r())
                    : x?.shiftKey
                      ? n().extendSelection(r())
                      : n().selectionBehavior() === 'toggle' ||
                          Rt(x) ||
                          ('pointerType' in x && x.pointerType === 'touch')
                        ? n().toggleSelection(r())
                        : n().replaceSelection(r()));
        },
        a = () => n().isSelected(r()),
        l = () => E(e.disabled) || n().isDisabled(r()),
        i = () => !l() && n().canSelectItem(r());
    let u = null;
    const g = (x) => {
            i() &&
                ((u = x.pointerType),
                x.pointerType === 'mouse' && x.button === 0 && !E(e.shouldSelectOnPressUp) && s(x));
        },
        c = (x) => {
            i() &&
                x.pointerType === 'mouse' &&
                x.button === 0 &&
                E(e.shouldSelectOnPressUp) &&
                E(e.allowsDifferentPressOrigin) &&
                s(x);
        },
        d = (x) => {
            i() &&
                ((E(e.shouldSelectOnPressUp) && !E(e.allowsDifferentPressOrigin)) ||
                    u !== 'mouse') &&
                s(x);
        },
        f = (x) => {
            !i() || !['Enter', ' '].includes(x.key) || (di(x) ? n().toggleSelection(r()) : s(x));
        },
        h = (x) => {
            l() && x.preventDefault();
        },
        p = (x) => {
            const b = t();
            o() || l() || !b || (x.target === b && n().setFocusedKey(r()));
        },
        v = q(() => {
            if (!(o() || l())) return r() === n().focusedKey() ? 0 : -1;
        }),
        y = q(() => (E(e.virtualized) ? void 0 : r()));
    return (
        B(
            dt([t, r, o, () => n().focusedKey(), () => n().isFocused()], ([x, b, w, $, L]) => {
                x &&
                    b === $ &&
                    L &&
                    !w &&
                    document.activeElement !== x &&
                    (e.focus ? e.focus() : ke(x));
            }),
        ),
        {
            isSelected: a,
            isDisabled: l,
            allowsSelection: i,
            tabIndex: v,
            dataKey: y,
            onPointerDown: g,
            onPointerUp: c,
            onClick: d,
            onKeyDown: f,
            onMouseDown: h,
            onFocus: p,
        }
    );
}
var El = class {
        collection;
        state;
        constructor(e, t) {
            ((this.collection = e), (this.state = t));
        }
        selectionMode() {
            return this.state.selectionMode();
        }
        disallowEmptySelection() {
            return this.state.disallowEmptySelection();
        }
        selectionBehavior() {
            return this.state.selectionBehavior();
        }
        setSelectionBehavior(e) {
            this.state.setSelectionBehavior(e);
        }
        isFocused() {
            return this.state.isFocused();
        }
        setFocused(e) {
            this.state.setFocused(e);
        }
        focusedKey() {
            return this.state.focusedKey();
        }
        setFocusedKey(e) {
            (e == null || this.collection().getItem(e)) && this.state.setFocusedKey(e);
        }
        selectedKeys() {
            return this.state.selectedKeys();
        }
        isSelected(e) {
            if (this.state.selectionMode() === 'none') return !1;
            const t = this.getKey(e);
            return t == null ? !1 : this.state.selectedKeys().has(t);
        }
        isEmpty() {
            return this.state.selectedKeys().size === 0;
        }
        isSelectAll() {
            if (this.isEmpty()) return !1;
            const e = this.state.selectedKeys();
            return this.getAllSelectableKeys().every((t) => e.has(t));
        }
        firstSelectedKey() {
            let e;
            for (const t of this.state.selectedKeys()) {
                const n = this.collection().getItem(t),
                    r = n?.index != null && e?.index != null && n.index < e.index;
                (!e || r) && (e = n);
            }
            return e?.key;
        }
        lastSelectedKey() {
            let e;
            for (const t of this.state.selectedKeys()) {
                const n = this.collection().getItem(t),
                    r = n?.index != null && e?.index != null && n.index > e.index;
                (!e || r) && (e = n);
            }
            return e?.key;
        }
        extendSelection(e) {
            if (this.selectionMode() === 'none') return;
            if (this.selectionMode() === 'single') {
                this.replaceSelection(e);
                return;
            }
            const t = this.getKey(e);
            if (t == null) return;
            const n = this.state.selectedKeys(),
                r = n.anchorKey || t,
                o = new lt(n, r, t);
            for (const s of this.getKeyRange(r, n.currentKey || t)) o.delete(s);
            for (const s of this.getKeyRange(t, r)) this.canSelectItem(s) && o.add(s);
            this.state.setSelectedKeys(o);
        }
        getKeyRange(e, t) {
            const n = this.collection().getItem(e),
                r = this.collection().getItem(t);
            return n && r
                ? n.index != null && r.index != null && n.index <= r.index
                    ? this.getKeyRangeInternal(e, t)
                    : this.getKeyRangeInternal(t, e)
                : [];
        }
        getKeyRangeInternal(e, t) {
            const n = [];
            let r = e;
            for (; r != null; ) {
                const o = this.collection().getItem(r);
                if ((o && o.type === 'item' && n.push(r), r === t)) return n;
                r = this.collection().getKeyAfter(r);
            }
            return [];
        }
        getKey(e) {
            const t = this.collection().getItem(e);
            return t ? (!t || t.type !== 'item' ? null : t.key) : e;
        }
        toggleSelection(e) {
            if (this.selectionMode() === 'none') return;
            if (this.selectionMode() === 'single' && !this.isSelected(e)) {
                this.replaceSelection(e);
                return;
            }
            const t = this.getKey(e);
            if (t == null) return;
            const n = new lt(this.state.selectedKeys());
            (n.has(t)
                ? n.delete(t)
                : this.canSelectItem(t) && (n.add(t), (n.anchorKey = t), (n.currentKey = t)),
                !(this.disallowEmptySelection() && n.size === 0) && this.state.setSelectedKeys(n));
        }
        replaceSelection(e) {
            if (this.selectionMode() === 'none') return;
            const t = this.getKey(e);
            if (t == null) return;
            const n = this.canSelectItem(t) ? new lt([t], t, t) : new lt();
            this.state.setSelectedKeys(n);
        }
        setSelectedKeys(e) {
            if (this.selectionMode() === 'none') return;
            const t = new lt();
            for (const n of e) {
                const r = this.getKey(n);
                if (r != null && (t.add(r), this.selectionMode() === 'single')) break;
            }
            this.state.setSelectedKeys(t);
        }
        selectAll() {
            this.selectionMode() === 'multiple' &&
                this.state.setSelectedKeys(new Set(this.getAllSelectableKeys()));
        }
        clearSelection() {
            const e = this.state.selectedKeys();
            !this.disallowEmptySelection() && e.size > 0 && this.state.setSelectedKeys(new lt());
        }
        toggleSelectAll() {
            this.isSelectAll() ? this.clearSelection() : this.selectAll();
        }
        select(e, t) {
            this.selectionMode() !== 'none' &&
                (this.selectionMode() === 'single'
                    ? this.isSelected(e) && !this.disallowEmptySelection()
                        ? this.toggleSelection(e)
                        : this.replaceSelection(e)
                    : this.selectionBehavior() === 'toggle' || (t && t.pointerType === 'touch')
                      ? this.toggleSelection(e)
                      : this.replaceSelection(e));
        }
        isSelectionEqual(e) {
            if (e === this.state.selectedKeys()) return !0;
            const t = this.selectedKeys();
            if (e.size !== t.size) return !1;
            for (const n of e) if (!t.has(n)) return !1;
            for (const n of t) if (!e.has(n)) return !1;
            return !0;
        }
        canSelectItem(e) {
            if (this.state.selectionMode() === 'none') return !1;
            const t = this.collection().getItem(e);
            return t != null && !t.disabled;
        }
        isDisabled(e) {
            const t = this.collection().getItem(e);
            return !t || t.disabled;
        }
        getAllSelectableKeys() {
            const e = [];
            return (
                ((n) => {
                    for (; n != null; ) {
                        if (this.canSelectItem(n)) {
                            const r = this.collection().getItem(n);
                            if (!r) continue;
                            r.type === 'item' && e.push(n);
                        }
                        n = this.collection().getKeyAfter(n);
                    }
                })(this.collection().getFirstKey()),
                e
            );
        }
    },
    co = class {
        keyMap = new Map();
        iterable;
        firstKey;
        lastKey;
        constructor(e) {
            this.iterable = e;
            for (const r of e) this.keyMap.set(r.key, r);
            if (this.keyMap.size === 0) return;
            let t,
                n = 0;
            for (const [r, o] of this.keyMap)
                (t
                    ? ((t.nextKey = r), (o.prevKey = t.key))
                    : ((this.firstKey = r), (o.prevKey = void 0)),
                    o.type === 'item' && (o.index = n++),
                    (t = o),
                    (t.nextKey = void 0));
            this.lastKey = t.key;
        }
        *[Symbol.iterator]() {
            yield* this.iterable;
        }
        getSize() {
            return this.keyMap.size;
        }
        getKeys() {
            return this.keyMap.keys();
        }
        getKeyBefore(e) {
            return this.keyMap.get(e)?.prevKey;
        }
        getKeyAfter(e) {
            return this.keyMap.get(e)?.nextKey;
        }
        getFirstKey() {
            return this.firstKey;
        }
        getLastKey() {
            return this.lastKey;
        }
        getItem(e) {
            return this.keyMap.get(e);
        }
        at(e) {
            const t = [...this.getKeys()];
            return this.getItem(t[e]);
        }
    };
function Ml(e) {
    const t = wl(e),
        r = dl(
            {
                dataSource: () => E(e.dataSource),
                getKey: () => E(e.getKey),
                getTextValue: () => E(e.getTextValue),
                getDisabled: () => E(e.getDisabled),
                getSectionChildren: () => E(e.getSectionChildren),
                factory: (s) => (e.filter ? new co(e.filter(s)) : new co(s)),
            },
            [() => e.filter],
        ),
        o = new El(r, t);
    return (
        qs(() => {
            const s = t.focusedKey();
            s != null && !r().getItem(s) && t.setFocusedKey(void 0);
        }),
        { collection: r, selectionManager: () => o }
    );
}
var Se = (e) => (typeof e == 'function' ? e() : e),
    Dl = (e) => {
        const t = q(() => {
                const a = Se(e.element);
                if (a) return getComputedStyle(a);
            }),
            n = () => t()?.animationName ?? 'none',
            [r, o] = z(Se(e.show) ? 'present' : 'hidden');
        let s = 'none';
        return (
            B((a) => {
                const l = Se(e.show);
                return (
                    Bt(() => {
                        if (a === l) return l;
                        const i = s,
                            u = n();
                        l
                            ? o('present')
                            : u === 'none' || t()?.display === 'none'
                              ? o('hidden')
                              : o(a === !0 && i !== u ? 'hiding' : 'hidden');
                    }),
                    l
                );
            }),
            B(() => {
                const a = Se(e.element);
                if (!a) return;
                const l = (u) => {
                        u.target === a && (s = n());
                    },
                    i = (u) => {
                        const c = n().includes(u.animationName);
                        u.target === a && c && r() === 'hiding' && o('hidden');
                    };
                (a.addEventListener('animationstart', l),
                    a.addEventListener('animationcancel', i),
                    a.addEventListener('animationend', i),
                    U(() => {
                        (a.removeEventListener('animationstart', l),
                            a.removeEventListener('animationcancel', i),
                            a.removeEventListener('animationend', i));
                    }));
            }),
            { present: () => r() === 'present' || r() === 'hiding', state: r }
        );
    },
    Al = Dl,
    gi = Al,
    En = 'data-kb-top-layer',
    hi,
    nr = !1,
    ft = [];
function an(e) {
    return ft.findIndex((t) => t.node === e);
}
function Tl(e) {
    return ft[an(e)];
}
function Fl(e) {
    return ft[ft.length - 1].node === e;
}
function vi() {
    return ft.filter((e) => e.isPointerBlocking);
}
function Il() {
    return [...vi()].slice(-1)[0];
}
function vr() {
    return vi().length > 0;
}
function mi(e) {
    const t = an(Il()?.node);
    return an(e) < t;
}
function Pl(e) {
    ft.push(e);
}
function Ll(e) {
    const t = an(e);
    t < 0 || ft.splice(t, 1);
}
function Ol() {
    for (const { node: e } of ft) e.style.pointerEvents = mi(e) ? 'none' : 'auto';
}
function ql(e) {
    if (vr() && !nr) {
        const t = Ze(e);
        ((hi = document.body.style.pointerEvents),
            (t.body.style.pointerEvents = 'none'),
            (nr = !0));
    }
}
function _l(e) {
    if (vr()) return;
    const t = Ze(e);
    ((t.body.style.pointerEvents = hi),
        t.body.style.length === 0 && t.body.removeAttribute('style'),
        (nr = !1));
}
var Fe = {
        layers: ft,
        isTopMostLayer: Fl,
        hasPointerBlockingLayer: vr,
        isBelowPointerBlockingLayer: mi,
        addLayer: Pl,
        removeLayer: Ll,
        indexOf: an,
        find: Tl,
        assignPointerEventToLayers: Ol,
        disableBodyPointerEvents: ql,
        restoreBodyPointerEvents: _l,
    },
    Rl = {};
On(Rl, { Button: () => Bl, Root: () => mr });
var zl = ['button', 'color', 'file', 'image', 'reset', 'submit'];
function Kl(e) {
    const t = e.tagName.toLowerCase();
    return t === 'button' ? !0 : t === 'input' && e.type ? zl.indexOf(e.type) !== -1 : !1;
}
function mr(e) {
    let t;
    const n = Q({ type: 'button' }, e),
        [r, o] = J(n, ['ref', 'type', 'disabled']),
        s = Ln(
            () => t,
            () => 'button',
        ),
        a = q(() => {
            const u = s();
            return u == null ? !1 : Kl({ tagName: u, type: r.type });
        }),
        l = q(() => s() === 'input'),
        i = q(() => s() === 'a' && t?.getAttribute('href') != null);
    return m(
        fe,
        j(
            {
                as: 'button',
                ref(u) {
                    const g = De((c) => (t = c), r.ref);
                    typeof g == 'function' && g(u);
                },
                get type() {
                    return a() || l() ? r.type : void 0;
                },
                get role() {
                    return !a() && !i() ? 'button' : void 0;
                },
                get tabIndex() {
                    return !a() && !i() && !r.disabled ? 0 : void 0;
                },
                get disabled() {
                    return a() || l() ? r.disabled : void 0;
                },
                get 'aria-disabled'() {
                    return !a() && !l() && r.disabled ? !0 : void 0;
                },
                get 'data-disabled'() {
                    return r.disabled ? '' : void 0;
                },
            },
            o,
        ),
    );
}
var Bl = mr,
    Nl = ['top', 'right', 'bottom', 'left'],
    Xe = Math.min,
    Pe = Math.max,
    Mn = Math.round,
    xn = Math.floor,
    wt = (e) => ({ x: e, y: e }),
    Hl = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' },
    Gl = { start: 'end', end: 'start' };
function rr(e, t, n) {
    return Pe(e, Xe(t, n));
}
function Ft(e, t) {
    return typeof e == 'function' ? e(t) : e;
}
function $t(e) {
    return e.split('-')[0];
}
function Ut(e) {
    return e.split('-')[1];
}
function yi(e) {
    return e === 'x' ? 'y' : 'x';
}
function yr(e) {
    return e === 'y' ? 'height' : 'width';
}
function At(e) {
    return ['top', 'bottom'].includes($t(e)) ? 'y' : 'x';
}
function pr(e) {
    return yi(At(e));
}
function Ul(e, t, n) {
    n === void 0 && (n = !1);
    const r = Ut(e),
        o = pr(e),
        s = yr(o);
    let a =
        o === 'x'
            ? r === (n ? 'end' : 'start')
                ? 'right'
                : 'left'
            : r === 'start'
              ? 'bottom'
              : 'top';
    return (t.reference[s] > t.floating[s] && (a = Dn(a)), [a, Dn(a)]);
}
function Vl(e) {
    const t = Dn(e);
    return [or(e), t, or(t)];
}
function or(e) {
    return e.replace(/start|end/g, (t) => Gl[t]);
}
function jl(e, t, n) {
    const r = ['left', 'right'],
        o = ['right', 'left'],
        s = ['top', 'bottom'],
        a = ['bottom', 'top'];
    switch (e) {
        case 'top':
        case 'bottom':
            return n ? (t ? o : r) : t ? r : o;
        case 'left':
        case 'right':
            return t ? s : a;
        default:
            return [];
    }
}
function Wl(e, t, n, r) {
    const o = Ut(e);
    let s = jl($t(e), n === 'start', r);
    return (o && ((s = s.map((a) => a + '-' + o)), t && (s = s.concat(s.map(or)))), s);
}
function Dn(e) {
    return e.replace(/left|right|bottom|top/g, (t) => Hl[t]);
}
function Ql(e) {
    return { top: 0, right: 0, bottom: 0, left: 0, ...e };
}
function pi(e) {
    return typeof e != 'number' ? Ql(e) : { top: e, right: e, bottom: e, left: e };
}
function An(e) {
    const { x: t, y: n, width: r, height: o } = e;
    return { width: r, height: o, top: n, left: t, right: t + r, bottom: n + o, x: t, y: n };
}
function fo(e, t, n) {
    let { reference: r, floating: o } = e;
    const s = At(t),
        a = pr(t),
        l = yr(a),
        i = $t(t),
        u = s === 'y',
        g = r.x + r.width / 2 - o.width / 2,
        c = r.y + r.height / 2 - o.height / 2,
        d = r[l] / 2 - o[l] / 2;
    let f;
    switch (i) {
        case 'top':
            f = { x: g, y: r.y - o.height };
            break;
        case 'bottom':
            f = { x: g, y: r.y + r.height };
            break;
        case 'right':
            f = { x: r.x + r.width, y: c };
            break;
        case 'left':
            f = { x: r.x - o.width, y: c };
            break;
        default:
            f = { x: r.x, y: r.y };
    }
    switch (Ut(t)) {
        case 'start':
            f[a] -= d * (n && u ? -1 : 1);
            break;
        case 'end':
            f[a] += d * (n && u ? -1 : 1);
            break;
    }
    return f;
}
var Yl = async (e, t, n) => {
    const {
            placement: r = 'bottom',
            strategy: o = 'absolute',
            middleware: s = [],
            platform: a,
        } = n,
        l = s.filter(Boolean),
        i = await (a.isRTL == null ? void 0 : a.isRTL(t));
    let u = await a.getElementRects({ reference: e, floating: t, strategy: o }),
        { x: g, y: c } = fo(u, r, i),
        d = r,
        f = {},
        h = 0;
    for (let p = 0; p < l.length; p++) {
        const { name: v, fn: y } = l[p],
            {
                x,
                y: b,
                data: w,
                reset: $,
            } = await y({
                x: g,
                y: c,
                initialPlacement: r,
                placement: d,
                strategy: o,
                middlewareData: f,
                rects: u,
                platform: a,
                elements: { reference: e, floating: t },
            });
        ((g = x ?? g),
            (c = b ?? c),
            (f = { ...f, [v]: { ...f[v], ...w } }),
            $ &&
                h <= 50 &&
                (h++,
                typeof $ == 'object' &&
                    ($.placement && (d = $.placement),
                    $.rects &&
                        (u =
                            $.rects === !0
                                ? await a.getElementRects({
                                      reference: e,
                                      floating: t,
                                      strategy: o,
                                  })
                                : $.rects),
                    ({ x: g, y: c } = fo(u, d, i))),
                (p = -1)));
    }
    return { x: g, y: c, placement: d, strategy: o, middlewareData: f };
};
async function ln(e, t) {
    var n;
    t === void 0 && (t = {});
    const { x: r, y: o, platform: s, rects: a, elements: l, strategy: i } = e,
        {
            boundary: u = 'clippingAncestors',
            rootBoundary: g = 'viewport',
            elementContext: c = 'floating',
            altBoundary: d = !1,
            padding: f = 0,
        } = Ft(t, e),
        h = pi(f),
        v = l[d ? (c === 'floating' ? 'reference' : 'floating') : c],
        y = An(
            await s.getClippingRect({
                element:
                    (n = await (s.isElement == null ? void 0 : s.isElement(v))) == null || n
                        ? v
                        : v.contextElement ||
                          (await (s.getDocumentElement == null
                              ? void 0
                              : s.getDocumentElement(l.floating))),
                boundary: u,
                rootBoundary: g,
                strategy: i,
            }),
        ),
        x =
            c === 'floating'
                ? { x: r, y: o, width: a.floating.width, height: a.floating.height }
                : a.reference,
        b = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(l.floating)),
        w = (await (s.isElement == null ? void 0 : s.isElement(b)))
            ? (await (s.getScale == null ? void 0 : s.getScale(b))) || { x: 1, y: 1 }
            : { x: 1, y: 1 },
        $ = An(
            s.convertOffsetParentRelativeRectToViewportRelativeRect
                ? await s.convertOffsetParentRelativeRectToViewportRelativeRect({
                      elements: l,
                      rect: x,
                      offsetParent: b,
                      strategy: i,
                  })
                : x,
        );
    return {
        top: (y.top - $.top + h.top) / w.y,
        bottom: ($.bottom - y.bottom + h.bottom) / w.y,
        left: (y.left - $.left + h.left) / w.x,
        right: ($.right - y.right + h.right) / w.x,
    };
}
var Xl = (e) => ({
        name: 'arrow',
        options: e,
        async fn(t) {
            const {
                    x: n,
                    y: r,
                    placement: o,
                    rects: s,
                    platform: a,
                    elements: l,
                    middlewareData: i,
                } = t,
                { element: u, padding: g = 0 } = Ft(e, t) || {};
            if (u == null) return {};
            const c = pi(g),
                d = { x: n, y: r },
                f = pr(o),
                h = yr(f),
                p = await a.getDimensions(u),
                v = f === 'y',
                y = v ? 'top' : 'left',
                x = v ? 'bottom' : 'right',
                b = v ? 'clientHeight' : 'clientWidth',
                w = s.reference[h] + s.reference[f] - d[f] - s.floating[h],
                $ = d[f] - s.reference[f],
                L = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(u));
            let D = L ? L[b] : 0;
            (!D || !(await (a.isElement == null ? void 0 : a.isElement(L)))) &&
                (D = l.floating[b] || s.floating[h]);
            const T = w / 2 - $ / 2,
                k = D / 2 - p[h] / 2 - 1,
                F = Xe(c[y], k),
                N = Xe(c[x], k),
                H = F,
                ne = D - p[h] - N,
                ee = D / 2 - p[h] / 2 + T,
                le = rr(H, ee, ne),
                ie =
                    !i.arrow &&
                    Ut(o) != null &&
                    ee !== le &&
                    s.reference[h] / 2 - (ee < H ? F : N) - p[h] / 2 < 0,
                re = ie ? (ee < H ? ee - H : ee - ne) : 0;
            return {
                [f]: d[f] + re,
                data: { [f]: le, centerOffset: ee - le - re, ...(ie && { alignmentOffset: re }) },
                reset: ie,
            };
        },
    }),
    Zl = function (e) {
        return (
            e === void 0 && (e = {}),
            {
                name: 'flip',
                options: e,
                async fn(t) {
                    var n, r;
                    const {
                            placement: o,
                            middlewareData: s,
                            rects: a,
                            initialPlacement: l,
                            platform: i,
                            elements: u,
                        } = t,
                        {
                            mainAxis: g = !0,
                            crossAxis: c = !0,
                            fallbackPlacements: d,
                            fallbackStrategy: f = 'bestFit',
                            fallbackAxisSideDirection: h = 'none',
                            flipAlignment: p = !0,
                            ...v
                        } = Ft(e, t);
                    if ((n = s.arrow) != null && n.alignmentOffset) return {};
                    const y = $t(o),
                        x = At(l),
                        b = $t(l) === l,
                        w = await (i.isRTL == null ? void 0 : i.isRTL(u.floating)),
                        $ = d || (b || !p ? [Dn(l)] : Vl(l)),
                        L = h !== 'none';
                    !d && L && $.push(...Wl(l, p, h, w));
                    const D = [l, ...$],
                        T = await ln(t, v),
                        k = [];
                    let F = ((r = s.flip) == null ? void 0 : r.overflows) || [];
                    if ((g && k.push(T[y]), c)) {
                        const ee = Ul(o, a, w);
                        k.push(T[ee[0]], T[ee[1]]);
                    }
                    if (((F = [...F, { placement: o, overflows: k }]), !k.every((ee) => ee <= 0))) {
                        var N, H;
                        const ee = (((N = s.flip) == null ? void 0 : N.index) || 0) + 1,
                            le = D[ee];
                        if (le)
                            return { data: { index: ee, overflows: F }, reset: { placement: le } };
                        let ie =
                            (H = F.filter((re) => re.overflows[0] <= 0).sort(
                                (re, se) => re.overflows[1] - se.overflows[1],
                            )[0]) == null
                                ? void 0
                                : H.placement;
                        if (!ie)
                            switch (f) {
                                case 'bestFit': {
                                    var ne;
                                    const re =
                                        (ne = F.filter((se) => {
                                            if (L) {
                                                const ue = At(se.placement);
                                                return ue === x || ue === 'y';
                                            }
                                            return !0;
                                        })
                                            .map((se) => [
                                                se.placement,
                                                se.overflows
                                                    .filter((ue) => ue > 0)
                                                    .reduce((ue, me) => ue + me, 0),
                                            ])
                                            .sort((se, ue) => se[1] - ue[1])[0]) == null
                                            ? void 0
                                            : ne[0];
                                    re && (ie = re);
                                    break;
                                }
                                case 'initialPlacement':
                                    ie = l;
                                    break;
                            }
                        if (o !== ie) return { reset: { placement: ie } };
                    }
                    return {};
                },
            }
        );
    };
function go(e, t) {
    return {
        top: e.top - t.height,
        right: e.right - t.width,
        bottom: e.bottom - t.height,
        left: e.left - t.width,
    };
}
function ho(e) {
    return Nl.some((t) => e[t] >= 0);
}
var Jl = function (e) {
    return (
        e === void 0 && (e = {}),
        {
            name: 'hide',
            options: e,
            async fn(t) {
                const { rects: n } = t,
                    { strategy: r = 'referenceHidden', ...o } = Ft(e, t);
                switch (r) {
                    case 'referenceHidden': {
                        const s = await ln(t, { ...o, elementContext: 'reference' }),
                            a = go(s, n.reference);
                        return { data: { referenceHiddenOffsets: a, referenceHidden: ho(a) } };
                    }
                    case 'escaped': {
                        const s = await ln(t, { ...o, altBoundary: !0 }),
                            a = go(s, n.floating);
                        return { data: { escapedOffsets: a, escaped: ho(a) } };
                    }
                    default:
                        return {};
                }
            },
        }
    );
};
async function eu(e, t) {
    const { placement: n, platform: r, elements: o } = e,
        s = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)),
        a = $t(n),
        l = Ut(n),
        i = At(n) === 'y',
        u = ['left', 'top'].includes(a) ? -1 : 1,
        g = s && i ? -1 : 1,
        c = Ft(t, e);
    let {
        mainAxis: d,
        crossAxis: f,
        alignmentAxis: h,
    } = typeof c == 'number'
        ? { mainAxis: c, crossAxis: 0, alignmentAxis: null }
        : { mainAxis: 0, crossAxis: 0, alignmentAxis: null, ...c };
    return (
        l && typeof h == 'number' && (f = l === 'end' ? h * -1 : h),
        i ? { x: f * g, y: d * u } : { x: d * u, y: f * g }
    );
}
var tu = function (e) {
        return (
            e === void 0 && (e = 0),
            {
                name: 'offset',
                options: e,
                async fn(t) {
                    var n, r;
                    const { x: o, y: s, placement: a, middlewareData: l } = t,
                        i = await eu(t, e);
                    return a === ((n = l.offset) == null ? void 0 : n.placement) &&
                        (r = l.arrow) != null &&
                        r.alignmentOffset
                        ? {}
                        : { x: o + i.x, y: s + i.y, data: { ...i, placement: a } };
                },
            }
        );
    },
    nu = function (e) {
        return (
            e === void 0 && (e = {}),
            {
                name: 'shift',
                options: e,
                async fn(t) {
                    const { x: n, y: r, placement: o } = t,
                        {
                            mainAxis: s = !0,
                            crossAxis: a = !1,
                            limiter: l = {
                                fn: (v) => {
                                    let { x: y, y: x } = v;
                                    return { x: y, y: x };
                                },
                            },
                            ...i
                        } = Ft(e, t),
                        u = { x: n, y: r },
                        g = await ln(t, i),
                        c = At($t(o)),
                        d = yi(c);
                    let f = u[d],
                        h = u[c];
                    if (s) {
                        const v = d === 'y' ? 'top' : 'left',
                            y = d === 'y' ? 'bottom' : 'right',
                            x = f + g[v],
                            b = f - g[y];
                        f = rr(x, f, b);
                    }
                    if (a) {
                        const v = c === 'y' ? 'top' : 'left',
                            y = c === 'y' ? 'bottom' : 'right',
                            x = h + g[v],
                            b = h - g[y];
                        h = rr(x, h, b);
                    }
                    const p = l.fn({ ...t, [d]: f, [c]: h });
                    return { ...p, data: { x: p.x - n, y: p.y - r } };
                },
            }
        );
    },
    ru = function (e) {
        return (
            e === void 0 && (e = {}),
            {
                name: 'size',
                options: e,
                async fn(t) {
                    const { placement: n, rects: r, platform: o, elements: s } = t,
                        { apply: a = () => {}, ...l } = Ft(e, t),
                        i = await ln(t, l),
                        u = $t(n),
                        g = Ut(n),
                        c = At(n) === 'y',
                        { width: d, height: f } = r.floating;
                    let h, p;
                    u === 'top' || u === 'bottom'
                        ? ((h = u),
                          (p =
                              g ===
                              ((await (o.isRTL == null ? void 0 : o.isRTL(s.floating)))
                                  ? 'start'
                                  : 'end')
                                  ? 'left'
                                  : 'right'))
                        : ((p = u), (h = g === 'end' ? 'top' : 'bottom'));
                    const v = f - i.top - i.bottom,
                        y = d - i.left - i.right,
                        x = Xe(f - i[h], v),
                        b = Xe(d - i[p], y),
                        w = !t.middlewareData.shift;
                    let $ = x,
                        L = b;
                    if ((c ? (L = g || w ? Xe(b, y) : y) : ($ = g || w ? Xe(x, v) : v), w && !g)) {
                        const T = Pe(i.left, 0),
                            k = Pe(i.right, 0),
                            F = Pe(i.top, 0),
                            N = Pe(i.bottom, 0);
                        c
                            ? (L = d - 2 * (T !== 0 || k !== 0 ? T + k : Pe(i.left, i.right)))
                            : ($ = f - 2 * (F !== 0 || N !== 0 ? F + N : Pe(i.top, i.bottom)));
                    }
                    await a({ ...t, availableWidth: L, availableHeight: $ });
                    const D = await o.getDimensions(s.floating);
                    return d !== D.width || f !== D.height ? { reset: { rects: !0 } } : {};
                },
            }
        );
    };
function Vt(e) {
    return bi(e) ? (e.nodeName || '').toLowerCase() : '#document';
}
function Le(e) {
    var t;
    return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function gt(e) {
    var t;
    return (t = (bi(e) ? e.ownerDocument : e.document) || window.document) == null
        ? void 0
        : t.documentElement;
}
function bi(e) {
    return e instanceof Node || e instanceof Le(e).Node;
}
function Ue(e) {
    return e instanceof Element || e instanceof Le(e).Element;
}
function Je(e) {
    return e instanceof HTMLElement || e instanceof Le(e).HTMLElement;
}
function vo(e) {
    return typeof ShadowRoot > 'u' ? !1 : e instanceof ShadowRoot || e instanceof Le(e).ShadowRoot;
}
function hn(e) {
    const { overflow: t, overflowX: n, overflowY: r, display: o } = Ve(e);
    return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !['inline', 'contents'].includes(o);
}
function ou(e) {
    return ['table', 'td', 'th'].includes(Vt(e));
}
function qn(e) {
    return [':popover-open', ':modal'].some((t) => {
        try {
            return e.matches(t);
        } catch {
            return !1;
        }
    });
}
function br(e) {
    const t = xr(),
        n = Ue(e) ? Ve(e) : e;
    return (
        n.transform !== 'none' ||
        n.perspective !== 'none' ||
        (n.containerType ? n.containerType !== 'normal' : !1) ||
        (!t && (n.backdropFilter ? n.backdropFilter !== 'none' : !1)) ||
        (!t && (n.filter ? n.filter !== 'none' : !1)) ||
        ['transform', 'perspective', 'filter'].some((r) => (n.willChange || '').includes(r)) ||
        ['paint', 'layout', 'strict', 'content'].some((r) => (n.contain || '').includes(r))
    );
}
function iu(e) {
    let t = Ct(e);
    for (; Je(t) && !Gt(t); ) {
        if (br(t)) return t;
        if (qn(t)) return null;
        t = Ct(t);
    }
    return null;
}
function xr() {
    return typeof CSS > 'u' || !CSS.supports ? !1 : CSS.supports('-webkit-backdrop-filter', 'none');
}
function Gt(e) {
    return ['html', 'body', '#document'].includes(Vt(e));
}
function Ve(e) {
    return Le(e).getComputedStyle(e);
}
function _n(e) {
    return Ue(e)
        ? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
        : { scrollLeft: e.scrollX, scrollTop: e.scrollY };
}
function Ct(e) {
    if (Vt(e) === 'html') return e;
    const t = e.assignedSlot || e.parentNode || (vo(e) && e.host) || gt(e);
    return vo(t) ? t.host : t;
}
function xi(e) {
    const t = Ct(e);
    return Gt(t) ? (e.ownerDocument ? e.ownerDocument.body : e.body) : Je(t) && hn(t) ? t : xi(t);
}
function un(e, t, n) {
    var r;
    (t === void 0 && (t = []), n === void 0 && (n = !0));
    const o = xi(e),
        s = o === ((r = e.ownerDocument) == null ? void 0 : r.body),
        a = Le(o);
    return s
        ? t.concat(
              a,
              a.visualViewport || [],
              hn(o) ? o : [],
              a.frameElement && n ? un(a.frameElement) : [],
          )
        : t.concat(o, un(o, [], n));
}
function wi(e) {
    const t = Ve(e);
    let n = parseFloat(t.width) || 0,
        r = parseFloat(t.height) || 0;
    const o = Je(e),
        s = o ? e.offsetWidth : n,
        a = o ? e.offsetHeight : r,
        l = Mn(n) !== s || Mn(r) !== a;
    return (l && ((n = s), (r = a)), { width: n, height: r, $: l });
}
function wr(e) {
    return Ue(e) ? e : e.contextElement;
}
function Nt(e) {
    const t = wr(e);
    if (!Je(t)) return wt(1);
    const n = t.getBoundingClientRect(),
        { width: r, height: o, $: s } = wi(t);
    let a = (s ? Mn(n.width) : n.width) / r,
        l = (s ? Mn(n.height) : n.height) / o;
    return (
        (!a || !Number.isFinite(a)) && (a = 1),
        (!l || !Number.isFinite(l)) && (l = 1),
        { x: a, y: l }
    );
}
var su = wt(0);
function $i(e) {
    const t = Le(e);
    return !xr() || !t.visualViewport
        ? su
        : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop };
}
function au(e, t, n) {
    return (t === void 0 && (t = !1), !n || (t && n !== Le(e)) ? !1 : t);
}
function Tt(e, t, n, r) {
    (t === void 0 && (t = !1), n === void 0 && (n = !1));
    const o = e.getBoundingClientRect(),
        s = wr(e);
    let a = wt(1);
    t && (r ? Ue(r) && (a = Nt(r)) : (a = Nt(e)));
    const l = au(s, n, r) ? $i(s) : wt(0);
    let i = (o.left + l.x) / a.x,
        u = (o.top + l.y) / a.y,
        g = o.width / a.x,
        c = o.height / a.y;
    if (s) {
        const d = Le(s),
            f = r && Ue(r) ? Le(r) : r;
        let h = d,
            p = h.frameElement;
        for (; p && r && f !== h; ) {
            const v = Nt(p),
                y = p.getBoundingClientRect(),
                x = Ve(p),
                b = y.left + (p.clientLeft + parseFloat(x.paddingLeft)) * v.x,
                w = y.top + (p.clientTop + parseFloat(x.paddingTop)) * v.y;
            ((i *= v.x),
                (u *= v.y),
                (g *= v.x),
                (c *= v.y),
                (i += b),
                (u += w),
                (h = Le(p)),
                (p = h.frameElement));
        }
    }
    return An({ width: g, height: c, x: i, y: u });
}
function lu(e) {
    let { elements: t, rect: n, offsetParent: r, strategy: o } = e;
    const s = o === 'fixed',
        a = gt(r),
        l = t ? qn(t.floating) : !1;
    if (r === a || (l && s)) return n;
    let i = { scrollLeft: 0, scrollTop: 0 },
        u = wt(1);
    const g = wt(0),
        c = Je(r);
    if ((c || (!c && !s)) && ((Vt(r) !== 'body' || hn(a)) && (i = _n(r)), Je(r))) {
        const d = Tt(r);
        ((u = Nt(r)), (g.x = d.x + r.clientLeft), (g.y = d.y + r.clientTop));
    }
    return {
        width: n.width * u.x,
        height: n.height * u.y,
        x: n.x * u.x - i.scrollLeft * u.x + g.x,
        y: n.y * u.y - i.scrollTop * u.y + g.y,
    };
}
function uu(e) {
    return Array.from(e.getClientRects());
}
function Ci(e) {
    return Tt(gt(e)).left + _n(e).scrollLeft;
}
function cu(e) {
    const t = gt(e),
        n = _n(e),
        r = e.ownerDocument.body,
        o = Pe(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
        s = Pe(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
    let a = -n.scrollLeft + Ci(e);
    const l = -n.scrollTop;
    return (
        Ve(r).direction === 'rtl' && (a += Pe(t.clientWidth, r.clientWidth) - o),
        { width: o, height: s, x: a, y: l }
    );
}
function du(e, t) {
    const n = Le(e),
        r = gt(e),
        o = n.visualViewport;
    let s = r.clientWidth,
        a = r.clientHeight,
        l = 0,
        i = 0;
    if (o) {
        ((s = o.width), (a = o.height));
        const u = xr();
        (!u || (u && t === 'fixed')) && ((l = o.offsetLeft), (i = o.offsetTop));
    }
    return { width: s, height: a, x: l, y: i };
}
function fu(e, t) {
    const n = Tt(e, !0, t === 'fixed'),
        r = n.top + e.clientTop,
        o = n.left + e.clientLeft,
        s = Je(e) ? Nt(e) : wt(1),
        a = e.clientWidth * s.x,
        l = e.clientHeight * s.y,
        i = o * s.x,
        u = r * s.y;
    return { width: a, height: l, x: i, y: u };
}
function mo(e, t, n) {
    let r;
    if (t === 'viewport') r = du(e, n);
    else if (t === 'document') r = cu(gt(e));
    else if (Ue(t)) r = fu(t, n);
    else {
        const o = $i(e);
        r = { ...t, x: t.x - o.x, y: t.y - o.y };
    }
    return An(r);
}
function Si(e, t) {
    const n = Ct(e);
    return n === t || !Ue(n) || Gt(n) ? !1 : Ve(n).position === 'fixed' || Si(n, t);
}
function gu(e, t) {
    const n = t.get(e);
    if (n) return n;
    let r = un(e, [], !1).filter((l) => Ue(l) && Vt(l) !== 'body'),
        o = null;
    const s = Ve(e).position === 'fixed';
    let a = s ? Ct(e) : e;
    for (; Ue(a) && !Gt(a); ) {
        const l = Ve(a),
            i = br(a);
        (!i && l.position === 'fixed' && (o = null),
            (
                s
                    ? !i && !o
                    : (!i &&
                          l.position === 'static' &&
                          !!o &&
                          ['absolute', 'fixed'].includes(o.position)) ||
                      (hn(a) && !i && Si(e, a))
            )
                ? (r = r.filter((g) => g !== a))
                : (o = l),
            (a = Ct(a)));
    }
    return (t.set(e, r), r);
}
function hu(e) {
    let { element: t, boundary: n, rootBoundary: r, strategy: o } = e;
    const a = [...(n === 'clippingAncestors' ? (qn(t) ? [] : gu(t, this._c)) : [].concat(n)), r],
        l = a[0],
        i = a.reduce(
            (u, g) => {
                const c = mo(t, g, o);
                return (
                    (u.top = Pe(c.top, u.top)),
                    (u.right = Xe(c.right, u.right)),
                    (u.bottom = Xe(c.bottom, u.bottom)),
                    (u.left = Pe(c.left, u.left)),
                    u
                );
            },
            mo(t, l, o),
        );
    return { width: i.right - i.left, height: i.bottom - i.top, x: i.left, y: i.top };
}
function vu(e) {
    const { width: t, height: n } = wi(e);
    return { width: t, height: n };
}
function mu(e, t, n) {
    const r = Je(t),
        o = gt(t),
        s = n === 'fixed',
        a = Tt(e, !0, s, t);
    let l = { scrollLeft: 0, scrollTop: 0 };
    const i = wt(0);
    if (r || (!r && !s))
        if (((Vt(t) !== 'body' || hn(o)) && (l = _n(t)), r)) {
            const c = Tt(t, !0, s, t);
            ((i.x = c.x + t.clientLeft), (i.y = c.y + t.clientTop));
        } else o && (i.x = Ci(o));
    const u = a.left + l.scrollLeft - i.x,
        g = a.top + l.scrollTop - i.y;
    return { x: u, y: g, width: a.width, height: a.height };
}
function Un(e) {
    return Ve(e).position === 'static';
}
function yo(e, t) {
    return !Je(e) || Ve(e).position === 'fixed' ? null : t ? t(e) : e.offsetParent;
}
function ki(e, t) {
    const n = Le(e);
    if (qn(e)) return n;
    if (!Je(e)) {
        let o = Ct(e);
        for (; o && !Gt(o); ) {
            if (Ue(o) && !Un(o)) return o;
            o = Ct(o);
        }
        return n;
    }
    let r = yo(e, t);
    for (; r && ou(r) && Un(r); ) r = yo(r, t);
    return r && Gt(r) && Un(r) && !br(r) ? n : r || iu(e) || n;
}
var yu = async function (e) {
    const t = this.getOffsetParent || ki,
        n = this.getDimensions,
        r = await n(e.floating);
    return {
        reference: mu(e.reference, await t(e.floating), e.strategy),
        floating: { x: 0, y: 0, width: r.width, height: r.height },
    };
};
function pu(e) {
    return Ve(e).direction === 'rtl';
}
var Ei = {
    convertOffsetParentRelativeRectToViewportRelativeRect: lu,
    getDocumentElement: gt,
    getClippingRect: hu,
    getOffsetParent: ki,
    getElementRects: yu,
    getClientRects: uu,
    getDimensions: vu,
    getScale: Nt,
    isElement: Ue,
    isRTL: pu,
};
function bu(e, t) {
    let n = null,
        r;
    const o = gt(e);
    function s() {
        var l;
        (clearTimeout(r), (l = n) == null || l.disconnect(), (n = null));
    }
    function a(l, i) {
        (l === void 0 && (l = !1), i === void 0 && (i = 1), s());
        const { left: u, top: g, width: c, height: d } = e.getBoundingClientRect();
        if ((l || t(), !c || !d)) return;
        const f = xn(g),
            h = xn(o.clientWidth - (u + c)),
            p = xn(o.clientHeight - (g + d)),
            v = xn(u),
            x = {
                rootMargin: -f + 'px ' + -h + 'px ' + -p + 'px ' + -v + 'px',
                threshold: Pe(0, Xe(1, i)) || 1,
            };
        let b = !0;
        function w($) {
            const L = $[0].intersectionRatio;
            if (L !== i) {
                if (!b) return a();
                L
                    ? a(!1, L)
                    : (r = setTimeout(() => {
                          a(!1, 1e-7);
                      }, 1e3));
            }
            b = !1;
        }
        try {
            n = new IntersectionObserver(w, { ...x, root: o.ownerDocument });
        } catch {
            n = new IntersectionObserver(w, x);
        }
        n.observe(e);
    }
    return (a(!0), s);
}
function xu(e, t, n, r) {
    r === void 0 && (r = {});
    const {
            ancestorScroll: o = !0,
            ancestorResize: s = !0,
            elementResize: a = typeof ResizeObserver == 'function',
            layoutShift: l = typeof IntersectionObserver == 'function',
            animationFrame: i = !1,
        } = r,
        u = wr(e),
        g = o || s ? [...(u ? un(u) : []), ...un(t)] : [];
    g.forEach((y) => {
        (o && y.addEventListener('scroll', n, { passive: !0 }),
            s && y.addEventListener('resize', n));
    });
    const c = u && l ? bu(u, n) : null;
    let d = -1,
        f = null;
    a &&
        ((f = new ResizeObserver((y) => {
            let [x] = y;
            (x &&
                x.target === u &&
                f &&
                (f.unobserve(t),
                cancelAnimationFrame(d),
                (d = requestAnimationFrame(() => {
                    var b;
                    (b = f) == null || b.observe(t);
                }))),
                n());
        })),
        u && !i && f.observe(u),
        f.observe(t));
    let h,
        p = i ? Tt(e) : null;
    i && v();
    function v() {
        const y = Tt(e);
        (p && (y.x !== p.x || y.y !== p.y || y.width !== p.width || y.height !== p.height) && n(),
            (p = y),
            (h = requestAnimationFrame(v)));
    }
    return (
        n(),
        () => {
            var y;
            (g.forEach((x) => {
                (o && x.removeEventListener('scroll', n), s && x.removeEventListener('resize', n));
            }),
                c?.(),
                (y = f) == null || y.disconnect(),
                (f = null),
                i && cancelAnimationFrame(h));
        }
    );
}
var wu = tu,
    $u = nu,
    Cu = Zl,
    Su = ru,
    ku = Jl,
    Eu = Xl,
    Mu = (e, t, n) => {
        const r = new Map(),
            o = { platform: Ei, ...n },
            s = { ...o.platform, _c: r };
        return Yl(e, t, { ...o, platform: s });
    },
    $r = xe();
function Cr() {
    const e = we($r);
    if (e === void 0)
        throw new Error('[kobalte]: `usePopperContext` must be used within a `Popper` component');
    return e;
}
var Du = _(
        '<svg display="block" viewBox="0 0 30 30" style="transform:scale(1.02)"><g><path fill="none" d="M23,27.8c1.1,1.2,3.4,2.2,5,2.2h2H0h2c1.7,0,3.9-1,5-2.2l6.6-7.2c0.7-0.8,2-0.8,2.7,0L23,27.8L23,27.8z"></path><path stroke="none" d="M23,27.8c1.1,1.2,3.4,2.2,5,2.2h2H0h2c1.7,0,3.9-1,5-2.2l6.6-7.2c0.7-0.8,2-0.8,2.7,0L23,27.8L23,27.8z">',
    ),
    ir = 30,
    po = ir / 2,
    Au = { top: 180, right: -90, bottom: 0, left: 90 };
function Sr(e) {
    const t = Cr(),
        n = Q({ size: ir }, e),
        [r, o] = J(n, ['ref', 'style', 'size']),
        s = () => t.currentPlacement().split('-')[0],
        a = Tu(t.contentRef),
        l = () => a()?.getPropertyValue('background-color') || 'none',
        i = () => a()?.getPropertyValue(`border-${s()}-color`) || 'none',
        u = () => a()?.getPropertyValue(`border-${s()}-width`) || '0px',
        g = () => Number.parseInt(u()) * 2 * (ir / r.size),
        c = () => `rotate(${Au[s()]} ${po} ${po}) translate(0 2)`;
    return m(
        fe,
        j(
            {
                as: 'div',
                ref(d) {
                    const f = De(t.setArrowRef, r.ref);
                    typeof f == 'function' && f(d);
                },
                'aria-hidden': 'true',
                get style() {
                    return In(
                        {
                            position: 'absolute',
                            'font-size': `${r.size}px`,
                            width: '1em',
                            height: '1em',
                            'pointer-events': 'none',
                            fill: l(),
                            stroke: i(),
                            'stroke-width': g(),
                        },
                        r.style,
                    );
                },
            },
            o,
            {
                get children() {
                    const d = Du(),
                        f = d.firstChild;
                    return (G(() => A(f, 'transform', c())), d);
                },
            },
        ),
    );
}
function Tu(e) {
    const [t, n] = z();
    return (
        B(() => {
            const r = e();
            r && n(Aa(r).getComputedStyle(r));
        }),
        t
    );
}
function Fu(e) {
    const t = Cr(),
        [n, r] = J(e, ['ref', 'style']);
    return m(
        fe,
        j(
            {
                as: 'div',
                ref(o) {
                    const s = De(t.setPositionerRef, n.ref);
                    typeof s == 'function' && s(o);
                },
                'data-popper-positioner': '',
                get style() {
                    return In(
                        { position: 'absolute', top: 0, left: 0, 'min-width': 'max-content' },
                        n.style,
                    );
                },
            },
            r,
        ),
    );
}
function bo(e) {
    const { x: t = 0, y: n = 0, width: r = 0, height: o = 0 } = e ?? {};
    if (typeof DOMRect == 'function') return new DOMRect(t, n, r, o);
    const s = { x: t, y: n, width: r, height: o, top: n, right: t + r, bottom: n + o, left: t };
    return { ...s, toJSON: () => s };
}
function Iu(e, t) {
    return {
        contextElement: e,
        getBoundingClientRect: () => {
            const r = t(e);
            return r ? bo(r) : e ? e.getBoundingClientRect() : bo();
        },
    };
}
function Pu(e) {
    return /^(?:top|bottom|left|right)(?:-(?:start|end))?$/.test(e);
}
var Lu = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
function Ou(e, t) {
    const [n, r] = e.split('-'),
        o = Lu[n];
    return r
        ? n === 'left' || n === 'right'
            ? `${o} ${r === 'start' ? 'top' : 'bottom'}`
            : r === 'start'
              ? `${o} ${t === 'rtl' ? 'right' : 'left'}`
              : `${o} ${t === 'rtl' ? 'left' : 'right'}`
        : `${o} center`;
}
function qu(e) {
    const t = Q(
            {
                getAnchorRect: (d) => d?.getBoundingClientRect(),
                placement: 'bottom',
                gutter: 0,
                shift: 0,
                flip: !0,
                slide: !0,
                overlap: !1,
                sameWidth: !1,
                fitViewport: !1,
                hideWhenDetached: !1,
                detachedPadding: 0,
                arrowPadding: 4,
                overflowPadding: 8,
            },
            e,
        ),
        [n, r] = z(),
        [o, s] = z(),
        [a, l] = z(t.placement),
        i = () => Iu(t.anchorRef?.(), t.getAnchorRect),
        { direction: u } = St();
    async function g() {
        const d = i(),
            f = n(),
            h = o();
        if (!d || !f) return;
        const p = (h?.clientHeight || 0) / 2,
            v = typeof t.gutter == 'number' ? t.gutter + p : (t.gutter ?? p);
        (f.style.setProperty('--kb-popper-content-overflow-padding', `${t.overflowPadding}px`),
            d.getBoundingClientRect());
        const y = [
            wu(({ placement: L }) => {
                const D = !!L.split('-')[1];
                return { mainAxis: v, crossAxis: D ? void 0 : t.shift, alignmentAxis: t.shift };
            }),
        ];
        if (t.flip !== !1) {
            const L = typeof t.flip == 'string' ? t.flip.split(' ') : void 0;
            if (L !== void 0 && !L.every(Pu))
                throw new Error('`flip` expects a spaced-delimited list of placements');
            y.push(Cu({ padding: t.overflowPadding, fallbackPlacements: L }));
        }
        ((t.slide || t.overlap) &&
            y.push($u({ mainAxis: t.slide, crossAxis: t.overlap, padding: t.overflowPadding })),
            y.push(
                Su({
                    padding: t.overflowPadding,
                    apply({ availableWidth: L, availableHeight: D, rects: T }) {
                        const k = Math.round(T.reference.width);
                        ((L = Math.floor(L)),
                            (D = Math.floor(D)),
                            f.style.setProperty('--kb-popper-anchor-width', `${k}px`),
                            f.style.setProperty('--kb-popper-content-available-width', `${L}px`),
                            f.style.setProperty('--kb-popper-content-available-height', `${D}px`),
                            t.sameWidth && (f.style.width = `${k}px`),
                            t.fitViewport &&
                                ((f.style.maxWidth = `${L}px`), (f.style.maxHeight = `${D}px`)));
                    },
                }),
            ),
            t.hideWhenDetached && y.push(ku({ padding: t.detachedPadding })),
            h && y.push(Eu({ element: h, padding: t.arrowPadding })));
        const x = await Mu(d, f, {
            placement: t.placement,
            strategy: 'absolute',
            middleware: y,
            platform: { ...Ei, isRTL: () => u() === 'rtl' },
        });
        if ((l(x.placement), t.onCurrentPlacementChange?.(x.placement), !f)) return;
        f.style.setProperty('--kb-popper-content-transform-origin', Ou(x.placement, u()));
        const b = Math.round(x.x),
            w = Math.round(x.y);
        let $;
        if (
            (t.hideWhenDetached &&
                ($ = x.middlewareData.hide?.referenceHidden ? 'hidden' : 'visible'),
            Object.assign(f.style, {
                top: '0',
                left: '0',
                transform: `translate3d(${b}px, ${w}px, 0)`,
                visibility: $,
            }),
            h && x.middlewareData.arrow)
        ) {
            const { x: L, y: D } = x.middlewareData.arrow,
                T = x.placement.split('-')[0];
            Object.assign(h.style, {
                left: L != null ? `${L}px` : '',
                top: D != null ? `${D}px` : '',
                [T]: '100%',
            });
        }
    }
    (B(() => {
        const d = i(),
            f = n();
        if (!d || !f) return;
        const h = xu(d, f, g, { elementResize: typeof ResizeObserver == 'function' });
        U(h);
    }),
        B(() => {
            const d = n(),
                f = t.contentRef?.();
            !d ||
                !f ||
                queueMicrotask(() => {
                    d.style.zIndex = getComputedStyle(f).zIndex;
                });
        }));
    const c = {
        currentPlacement: a,
        contentRef: () => t.contentRef?.(),
        setPositionerRef: r,
        setArrowRef: s,
    };
    return m($r.Provider, {
        value: c,
        get children() {
            return t.children;
        },
    });
}
var Mi = Object.assign(qu, { Arrow: Sr, Context: $r, usePopperContext: Cr, Positioner: Fu });
function _u(e) {
    const t = (n) => {
        n.key === dr.Escape && e.onEscapeKeyDown?.(n);
    };
    B(() => {
        if (E(e.isDisabled)) return;
        const n = e.ownerDocument?.() ?? Ze();
        (n.addEventListener('keydown', t),
            U(() => {
                n.removeEventListener('keydown', t);
            }));
    });
}
var xo = 'interactOutside.pointerDownOutside',
    wo = 'interactOutside.focusOutside';
function Ru(e, t) {
    let n,
        r = Ua;
    const o = () => Ze(t()),
        s = (c) => e.onPointerDownOutside?.(c),
        a = (c) => e.onFocusOutside?.(c),
        l = (c) => e.onInteractOutside?.(c),
        i = (c) => {
            const d = c.target;
            return !(d instanceof HTMLElement) || d.closest(`[${En}]`) || !Ke(o(), d) || Ke(t(), d)
                ? !1
                : !e.shouldExcludeElement?.(d);
        },
        u = (c) => {
            function d() {
                const f = t(),
                    h = c.target;
                if (!f || !h || !i(c)) return;
                const p = be([s, l]);
                h.addEventListener(xo, p, { once: !0 });
                const v = new CustomEvent(xo, {
                    bubbles: !1,
                    cancelable: !0,
                    detail: {
                        originalEvent: c,
                        isContextMenu: c.button === 2 || (La(c) && c.button === 0),
                    },
                });
                h.dispatchEvent(v);
            }
            c.pointerType === 'touch'
                ? (o().removeEventListener('click', d),
                  (r = d),
                  o().addEventListener('click', d, { once: !0 }))
                : d();
        },
        g = (c) => {
            const d = t(),
                f = c.target;
            if (!d || !f || !i(c)) return;
            const h = be([a, l]);
            f.addEventListener(wo, h, { once: !0 });
            const p = new CustomEvent(wo, {
                bubbles: !1,
                cancelable: !0,
                detail: { originalEvent: c, isContextMenu: !1 },
            });
            f.dispatchEvent(p);
        };
    B(() => {
        E(e.isDisabled) ||
            ((n = window.setTimeout(() => {
                o().addEventListener('pointerdown', u, !0);
            }, 0)),
            o().addEventListener('focusin', g, !0),
            U(() => {
                (window.clearTimeout(n),
                    o().removeEventListener('click', r),
                    o().removeEventListener('pointerdown', u, !0),
                    o().removeEventListener('focusin', g, !0));
            }));
    });
}
var Di = xe();
function zu() {
    return we(Di);
}
function Ku(e) {
    let t;
    const n = zu(),
        [r, o] = J(e, [
            'ref',
            'disableOutsidePointerEvents',
            'excludedElements',
            'onEscapeKeyDown',
            'onPointerDownOutside',
            'onFocusOutside',
            'onInteractOutside',
            'onDismiss',
            'bypassTopMostLayerCheck',
        ]),
        s = new Set([]),
        a = (c) => {
            s.add(c);
            const d = n?.registerNestedLayer(c);
            return () => {
                (s.delete(c), d?.());
            };
        };
    (Ru(
        {
            shouldExcludeElement: (c) =>
                t
                    ? r.excludedElements?.some((d) => Ke(d(), c)) || [...s].some((d) => Ke(d, c))
                    : !1,
            onPointerDownOutside: (c) => {
                !t ||
                    Fe.isBelowPointerBlockingLayer(t) ||
                    (!r.bypassTopMostLayerCheck && !Fe.isTopMostLayer(t)) ||
                    (r.onPointerDownOutside?.(c),
                    r.onInteractOutside?.(c),
                    c.defaultPrevented || r.onDismiss?.());
            },
            onFocusOutside: (c) => {
                (r.onFocusOutside?.(c),
                    r.onInteractOutside?.(c),
                    c.defaultPrevented || r.onDismiss?.());
            },
        },
        () => t,
    ),
        _u({
            ownerDocument: () => Ze(t),
            onEscapeKeyDown: (c) => {
                !t ||
                    !Fe.isTopMostLayer(t) ||
                    (r.onEscapeKeyDown?.(c),
                    !c.defaultPrevented && r.onDismiss && (c.preventDefault(), r.onDismiss()));
            },
        }),
        xt(() => {
            if (!t) return;
            Fe.addLayer({
                node: t,
                isPointerBlocking: r.disableOutsidePointerEvents,
                dismiss: r.onDismiss,
            });
            const c = n?.registerNestedLayer(t);
            (Fe.assignPointerEventToLayers(),
                Fe.disableBodyPointerEvents(t),
                U(() => {
                    t &&
                        (Fe.removeLayer(t),
                        c?.(),
                        Fe.assignPointerEventToLayers(),
                        Fe.restoreBodyPointerEvents(t));
                }));
        }),
        B(
            dt(
                [() => t, () => r.disableOutsidePointerEvents],
                ([c, d]) => {
                    if (!c) return;
                    const f = Fe.find(c);
                    (f &&
                        f.isPointerBlocking !== d &&
                        ((f.isPointerBlocking = d), Fe.assignPointerEventToLayers()),
                        d && Fe.disableBodyPointerEvents(c),
                        U(() => {
                            Fe.restoreBodyPointerEvents(c);
                        }));
                },
                { defer: !0 },
            ),
        ));
    const g = { registerNestedLayer: a };
    return m(Di.Provider, {
        value: g,
        get children() {
            return m(
                fe,
                j(
                    {
                        as: 'div',
                        ref(c) {
                            const d = De((f) => (t = f), r.ref);
                            typeof d == 'function' && d(c);
                        },
                    },
                    o,
                ),
            );
        },
    });
}
function Ai(e = {}) {
    const [t, n] = ri({
            value: () => E(e.open),
            defaultValue: () => !!E(e.defaultOpen),
            onChange: (a) => e.onOpenChange?.(a),
        }),
        r = () => {
            n(!0);
        },
        o = () => {
            n(!1);
        };
    return {
        isOpen: t,
        setIsOpen: n,
        open: r,
        close: o,
        toggle: () => {
            t() ? o() : r();
        },
    };
}
var ze = {};
On(ze, {
    Description: () => ti,
    ErrorMessage: () => ni,
    Item: () => Pi,
    ItemControl: () => Li,
    ItemDescription: () => Oi,
    ItemIndicator: () => qi,
    ItemInput: () => _i,
    ItemLabel: () => Ri,
    Label: () => zi,
    RadioGroup: () => Bu,
    Root: () => Ki,
});
var Ti = xe();
function Fi() {
    const e = we(Ti);
    if (e === void 0)
        throw new Error(
            '[kobalte]: `useRadioGroupContext` must be used within a `RadioGroup` component',
        );
    return e;
}
var Ii = xe();
function vn() {
    const e = we(Ii);
    if (e === void 0)
        throw new Error(
            '[kobalte]: `useRadioGroupItemContext` must be used within a `RadioGroup.Item` component',
        );
    return e;
}
function Pi(e) {
    const t = fn(),
        n = Fi(),
        r = `${t.generateId('item')}-${Oe()}`,
        o = Q({ id: r }, e),
        [s, a] = J(o, ['value', 'disabled', 'onPointerDown']),
        [l, i] = z(),
        [u, g] = z(),
        [c, d] = z(),
        [f, h] = z(),
        [p, v] = z(!1),
        y = q(() => n.isSelectedValue(s.value)),
        x = q(() => s.disabled || t.isDisabled() || !1),
        b = (L) => {
            (de(L, s.onPointerDown), p() && L.preventDefault());
        },
        w = q(() => ({
            ...t.dataset(),
            'data-disabled': x() ? '' : void 0,
            'data-checked': y() ? '' : void 0,
        })),
        $ = {
            value: () => s.value,
            dataset: w,
            isSelected: y,
            isDisabled: x,
            inputId: l,
            labelId: u,
            descriptionId: c,
            inputRef: f,
            select: () => n.setSelectedValue(s.value),
            generateId: dn(() => a.id),
            registerInput: Be(i),
            registerLabel: Be(g),
            registerDescription: Be(d),
            setIsFocused: v,
            setInputRef: h,
        };
    return m(Ii.Provider, {
        value: $,
        get children() {
            return m(fe, j({ as: 'div', role: 'group', onPointerDown: b }, w, a));
        },
    });
}
function Li(e) {
    const t = vn(),
        n = Q({ id: t.generateId('control') }, e),
        [r, o] = J(n, ['onClick', 'onKeyDown']);
    return m(
        fe,
        j(
            {
                as: 'div',
                onClick: (l) => {
                    (de(l, r.onClick), t.select(), t.inputRef()?.focus());
                },
                onKeyDown: (l) => {
                    (de(l, r.onKeyDown), l.key === dr.Space && (t.select(), t.inputRef()?.focus()));
                },
            },
            () => t.dataset(),
            o,
        ),
    );
}
function Oi(e) {
    const t = vn(),
        n = Q({ id: t.generateId('description') }, e);
    return (
        B(() => U(t.registerDescription(n.id))),
        m(
            fe,
            j({ as: 'div' }, () => t.dataset(), n),
        )
    );
}
function qi(e) {
    const t = vn(),
        n = Q({ id: t.generateId('indicator') }, e),
        [r, o] = J(n, ['ref', 'forceMount']),
        [s, a] = z(),
        { present: l } = gi({
            show: () => r.forceMount || t.isSelected(),
            element: () => s() ?? null,
        });
    return m(R, {
        get when() {
            return l();
        },
        get children() {
            return m(
                fe,
                j(
                    {
                        as: 'div',
                        ref(i) {
                            const u = De(a, r.ref);
                            typeof u == 'function' && u(i);
                        },
                    },
                    () => t.dataset(),
                    o,
                ),
            );
        },
    });
}
function _i(e) {
    const t = fn(),
        n = Fi(),
        r = vn(),
        o = Q({ id: r.generateId('input') }, e),
        [s, a] = J(o, [
            'ref',
            'style',
            'aria-labelledby',
            'aria-describedby',
            'onChange',
            'onFocus',
            'onBlur',
        ]),
        l = () =>
            [
                s['aria-labelledby'],
                r.labelId(),
                s['aria-labelledby'] != null && a['aria-label'] != null ? a.id : void 0,
            ]
                .filter(Boolean)
                .join(' ') || void 0,
        i = () =>
            [s['aria-describedby'], r.descriptionId(), n.ariaDescribedBy()]
                .filter(Boolean)
                .join(' ') || void 0,
        [u, g] = z(!1),
        c = (h) => {
            if ((de(h, s.onChange), h.stopPropagation(), !u())) {
                n.setSelectedValue(r.value());
                const p = h.target;
                p.checked = r.isSelected();
            }
            g(!1);
        },
        d = (h) => {
            (de(h, s.onFocus), r.setIsFocused(!0));
        },
        f = (h) => {
            (de(h, s.onBlur), r.setIsFocused(!1));
        };
    return (
        B(
            dt(
                [() => r.isSelected(), () => r.value()],
                (h) => {
                    if (!h[0] && h[1] === r.value()) return;
                    g(!0);
                    const p = r.inputRef();
                    (p?.dispatchEvent(new Event('input', { bubbles: !0, cancelable: !0 })),
                        p?.dispatchEvent(new Event('change', { bubbles: !0, cancelable: !0 })));
                },
                { defer: !0 },
            ),
        ),
        B(() => U(r.registerInput(a.id))),
        m(
            fe,
            j(
                {
                    as: 'input',
                    ref(h) {
                        const p = De(r.setInputRef, s.ref);
                        typeof p == 'function' && p(h);
                    },
                    type: 'radio',
                    get name() {
                        return t.name();
                    },
                    get value() {
                        return r.value();
                    },
                    get checked() {
                        return r.isSelected();
                    },
                    get required() {
                        return t.isRequired();
                    },
                    get disabled() {
                        return r.isDisabled();
                    },
                    get readonly() {
                        return t.isReadOnly();
                    },
                    get style() {
                        return In({ ...Jo }, s.style);
                    },
                    get 'aria-labelledby'() {
                        return l();
                    },
                    get 'aria-describedby'() {
                        return i();
                    },
                    onChange: c,
                    onFocus: d,
                    onBlur: f,
                },
                () => r.dataset(),
                a,
            ),
        )
    );
}
function Ri(e) {
    const t = vn(),
        n = Q({ id: t.generateId('label') }, e);
    return (
        B(() => U(t.registerLabel(n.id))),
        m(
            fe,
            j(
                {
                    as: 'label',
                    get for() {
                        return t.inputId();
                    },
                },
                () => t.dataset(),
                n,
            ),
        )
    );
}
function zi(e) {
    return m(Ya, j({ as: 'span' }, e));
}
function Ki(e) {
    let t;
    const n = `radiogroup-${Oe()}`,
        r = Q({ id: n, orientation: 'vertical' }, e),
        [o, s, a] = J(
            r,
            [
                'ref',
                'value',
                'defaultValue',
                'onChange',
                'orientation',
                'aria-labelledby',
                'aria-describedby',
            ],
            Wa,
        ),
        [l, i] = gn({
            value: () => o.value,
            defaultValue: () => o.defaultValue,
            onChange: (h) => o.onChange?.(h),
        }),
        { formControlContext: u } = Qa(s);
    Xa(
        () => t,
        () => i(o.defaultValue ?? ''),
    );
    const g = () => u.getAriaLabelledBy(E(s.id), a['aria-label'], o['aria-labelledby']),
        c = () => u.getAriaDescribedBy(o['aria-describedby']),
        d = (h) => h === l(),
        f = {
            ariaDescribedBy: c,
            isSelectedValue: d,
            setSelectedValue: (h) => {
                if (!(u.isReadOnly() || u.isDisabled()) && (i(h), t))
                    for (const p of t.querySelectorAll("[type='radio']")) {
                        const v = p;
                        v.checked = d(v.value);
                    }
            },
        };
    return m(ei.Provider, {
        value: u,
        get children() {
            return m(Ti.Provider, {
                value: f,
                get children() {
                    return m(
                        fe,
                        j(
                            {
                                as: 'div',
                                ref(h) {
                                    const p = De((v) => (t = v), o.ref);
                                    typeof p == 'function' && p(h);
                                },
                                role: 'radiogroup',
                                get id() {
                                    return E(s.id);
                                },
                                get 'aria-invalid'() {
                                    return u.validationState() === 'invalid' || void 0;
                                },
                                get 'aria-required'() {
                                    return u.isRequired() || void 0;
                                },
                                get 'aria-disabled'() {
                                    return u.isDisabled() || void 0;
                                },
                                get 'aria-readonly'() {
                                    return u.isReadOnly() || void 0;
                                },
                                get 'aria-orientation'() {
                                    return o.orientation;
                                },
                                get 'aria-labelledby'() {
                                    return g();
                                },
                                get 'aria-describedby'() {
                                    return c();
                                },
                            },
                            () => u.dataset(),
                            a,
                        ),
                    );
                },
            });
        },
    });
}
var Bu = Object.assign(Ki, {
        Description: ti,
        ErrorMessage: ni,
        Item: Pi,
        ItemControl: Li,
        ItemDescription: Oi,
        ItemIndicator: qi,
        ItemInput: _i,
        ItemLabel: Ri,
        Label: zi,
    }),
    Nu = class {
        collection;
        ref;
        collator;
        constructor(e, t, n) {
            ((this.collection = e), (this.ref = t), (this.collator = n));
        }
        getKeyBelow(e) {
            let t = this.collection().getKeyAfter(e);
            for (; t != null; ) {
                const n = this.collection().getItem(t);
                if (n && n.type === 'item' && !n.disabled) return t;
                t = this.collection().getKeyAfter(t);
            }
        }
        getKeyAbove(e) {
            let t = this.collection().getKeyBefore(e);
            for (; t != null; ) {
                const n = this.collection().getItem(t);
                if (n && n.type === 'item' && !n.disabled) return t;
                t = this.collection().getKeyBefore(t);
            }
        }
        getFirstKey() {
            let e = this.collection().getFirstKey();
            for (; e != null; ) {
                const t = this.collection().getItem(e);
                if (t && t.type === 'item' && !t.disabled) return e;
                e = this.collection().getKeyAfter(e);
            }
        }
        getLastKey() {
            let e = this.collection().getLastKey();
            for (; e != null; ) {
                const t = this.collection().getItem(e);
                if (t && t.type === 'item' && !t.disabled) return e;
                e = this.collection().getKeyBefore(e);
            }
        }
        getItem(e) {
            return this.ref?.()?.querySelector(`[data-key="${e}"]`) ?? null;
        }
        getKeyPageAbove(e) {
            const t = this.ref?.();
            let n = this.getItem(e);
            if (!t || !n) return;
            const r = Math.max(0, n.offsetTop + n.offsetHeight - t.offsetHeight);
            let o = e;
            for (; o && n && n.offsetTop > r; )
                ((o = this.getKeyAbove(o)), (n = o != null ? this.getItem(o) : null));
            return o;
        }
        getKeyPageBelow(e) {
            const t = this.ref?.();
            let n = this.getItem(e);
            if (!t || !n) return;
            const r = Math.min(t.scrollHeight, n.offsetTop - n.offsetHeight + t.offsetHeight);
            let o = e;
            for (; o && n && n.offsetTop < r; )
                ((o = this.getKeyBelow(o)), (n = o != null ? this.getItem(o) : null));
            return o;
        }
        getKeyForSearch(e, t) {
            const n = this.collator?.();
            if (!n) return;
            let r = t != null ? this.getKeyBelow(t) : this.getFirstKey();
            for (; r != null; ) {
                const o = this.collection().getItem(r);
                if (o) {
                    const s = o.textValue.slice(0, e.length);
                    if (o.textValue && n.compare(s, e) === 0) return r;
                }
                r = this.getKeyBelow(r);
            }
        }
    };
function Hu(e, t, n) {
    const r = pl({ usage: 'search', sensitivity: 'base' }),
        o = q(() => {
            const s = E(e.keyboardDelegate);
            return s || new Nu(e.collection, t, r);
        });
    return kl(
        {
            selectionManager: () => E(e.selectionManager),
            keyboardDelegate: o,
            autoFocus: () => E(e.autoFocus),
            deferAutoFocus: () => E(e.deferAutoFocus),
            shouldFocusWrap: () => E(e.shouldFocusWrap),
            disallowEmptySelection: () => E(e.disallowEmptySelection),
            selectOnFocus: () => E(e.selectOnFocus),
            disallowTypeAhead: () => E(e.disallowTypeAhead),
            shouldUseVirtualFocus: () => E(e.shouldUseVirtualFocus),
            allowsTabNavigation: () => E(e.allowsTabNavigation),
            isVirtualized: () => E(e.isVirtualized),
            scrollToKey: (s) => E(e.scrollToKey)?.(s),
            orientation: () => E(e.orientation),
        },
        t,
    );
}
var Vn = 'focusScope.autoFocusOnMount',
    jn = 'focusScope.autoFocusOnUnmount',
    $o = { bubbles: !1, cancelable: !0 },
    Co = {
        stack: [],
        active() {
            return this.stack[0];
        },
        add(e) {
            (e !== this.active() && this.active()?.pause(),
                (this.stack = Jn(this.stack, e)),
                this.stack.unshift(e));
        },
        remove(e) {
            ((this.stack = Jn(this.stack, e)), this.active()?.resume());
        },
    };
function Gu(e, t) {
    const [n, r] = z(!1),
        o = {
            pause() {
                r(!0);
            },
            resume() {
                r(!1);
            },
        };
    let s = null;
    const a = (h) => e.onMountAutoFocus?.(h),
        l = (h) => e.onUnmountAutoFocus?.(h),
        i = () => Ze(t()),
        u = () => {
            const h = i().createElement('span');
            return (
                h.setAttribute('data-focus-trap', ''),
                (h.tabIndex = 0),
                Object.assign(h.style, Jo),
                h
            );
        },
        g = () => {
            const h = t();
            return h ? Xo(h, !0).filter((p) => !p.hasAttribute('data-focus-trap')) : [];
        },
        c = () => {
            const h = g();
            return h.length > 0 ? h[0] : null;
        },
        d = () => {
            const h = g();
            return h.length > 0 ? h[h.length - 1] : null;
        },
        f = () => {
            const h = t();
            if (!h) return !1;
            const p = rn(h);
            return !p || Ke(h, p) ? !1 : Zo(p);
        };
    (B(() => {
        const h = t();
        if (!h) return;
        Co.add(o);
        const p = rn(h);
        if (!Ke(h, p)) {
            const y = new CustomEvent(Vn, $o);
            (h.addEventListener(Vn, a),
                h.dispatchEvent(y),
                y.defaultPrevented ||
                    setTimeout(() => {
                        (ke(c()), rn(h) === p && ke(h));
                    }, 0));
        }
        U(() => {
            (h.removeEventListener(Vn, a),
                setTimeout(() => {
                    const y = new CustomEvent(jn, $o);
                    (f() && y.preventDefault(),
                        h.addEventListener(jn, l),
                        h.dispatchEvent(y),
                        y.defaultPrevented || ke(p ?? i().body),
                        h.removeEventListener(jn, l),
                        Co.remove(o));
                }, 0));
        });
    }),
        B(() => {
            const h = t();
            if (!h || !E(e.trapFocus) || n()) return;
            const p = (y) => {
                    const x = y.target;
                    x?.closest(`[${En}]`) || (Ke(h, x) ? (s = x) : ke(s));
                },
                v = (y) => {
                    const b = y.relatedTarget ?? rn(h);
                    b?.closest(`[${En}]`) || Ke(h, b) || ke(s);
                };
            (i().addEventListener('focusin', p),
                i().addEventListener('focusout', v),
                U(() => {
                    (i().removeEventListener('focusin', p), i().removeEventListener('focusout', v));
                }));
        }),
        B(() => {
            const h = t();
            if (!h || !E(e.trapFocus) || n()) return;
            const p = u();
            h.insertAdjacentElement('afterbegin', p);
            const v = u();
            h.insertAdjacentElement('beforeend', v);
            function y(b) {
                const w = c(),
                    $ = d();
                b.relatedTarget === w ? ke($) : ke(w);
            }
            (p.addEventListener('focusin', y), v.addEventListener('focusin', y));
            const x = new MutationObserver((b) => {
                for (const w of b)
                    (w.previousSibling === v &&
                        (v.remove(), h.insertAdjacentElement('beforeend', v)),
                        w.nextSibling === p &&
                            (p.remove(), h.insertAdjacentElement('afterbegin', p)));
            });
            (x.observe(h, { childList: !0, subtree: !1 }),
                U(() => {
                    (p.removeEventListener('focusin', y),
                        v.removeEventListener('focusin', y),
                        p.remove(),
                        v.remove(),
                        x.disconnect());
                }));
        }));
}
var Uu = 'data-live-announcer';
function Vu(e) {
    B(() => {
        E(e.isDisabled) || U(ju(E(e.targets), E(e.root)));
    });
}
var en = new WeakMap(),
    Re = [];
function ju(e, t = document.body) {
    const n = new Set(e),
        r = new Set(),
        o = (i) => {
            for (const d of i.querySelectorAll(`[${Uu}], [${En}]`)) n.add(d);
            const u = (d) => {
                    if (
                        n.has(d) ||
                        (d.parentElement &&
                            r.has(d.parentElement) &&
                            d.parentElement.getAttribute('role') !== 'row')
                    )
                        return NodeFilter.FILTER_REJECT;
                    for (const f of n) if (d.contains(f)) return NodeFilter.FILTER_SKIP;
                    return NodeFilter.FILTER_ACCEPT;
                },
                g = document.createTreeWalker(i, NodeFilter.SHOW_ELEMENT, { acceptNode: u }),
                c = u(i);
            if ((c === NodeFilter.FILTER_ACCEPT && s(i), c !== NodeFilter.FILTER_REJECT)) {
                let d = g.nextNode();
                for (; d != null; ) (s(d), (d = g.nextNode()));
            }
        },
        s = (i) => {
            const u = en.get(i) ?? 0;
            (i.getAttribute('aria-hidden') === 'true' && u === 0) ||
                (u === 0 && i.setAttribute('aria-hidden', 'true'), r.add(i), en.set(i, u + 1));
        };
    (Re.length && Re[Re.length - 1].disconnect(), o(t));
    const a = new MutationObserver((i) => {
        for (const u of i)
            if (
                !(u.type !== 'childList' || u.addedNodes.length === 0) &&
                ![...n, ...r].some((g) => g.contains(u.target))
            ) {
                for (const g of u.removedNodes) g instanceof Element && (n.delete(g), r.delete(g));
                for (const g of u.addedNodes)
                    (g instanceof HTMLElement || g instanceof SVGElement) &&
                    (g.dataset.liveAnnouncer === 'true' || g.dataset.reactAriaTopLayer === 'true')
                        ? n.add(g)
                        : g instanceof Element && o(g);
            }
    });
    a.observe(t, { childList: !0, subtree: !0 });
    const l = {
        observe() {
            a.observe(t, { childList: !0, subtree: !0 });
        },
        disconnect() {
            a.disconnect();
        },
    };
    return (
        Re.push(l),
        () => {
            a.disconnect();
            for (const i of r) {
                const u = en.get(i);
                if (u == null) return;
                u === 1 ? (i.removeAttribute('aria-hidden'), en.delete(i)) : en.set(i, u - 1);
            }
            l === Re[Re.length - 1]
                ? (Re.pop(), Re.length && Re[Re.length - 1].observe())
                : Re.splice(Re.indexOf(l), 1);
        }
    );
}
var wn = new Map(),
    Wu = (e) => {
        B(() => {
            const t = Se(e.style) ?? {},
                n = Se(e.properties) ?? [],
                r = {};
            for (const s in t) r[s] = e.element.style[s];
            const o = wn.get(e.key);
            (o
                ? o.activeCount++
                : wn.set(e.key, {
                      activeCount: 1,
                      originalStyles: r,
                      properties: n.map((s) => s.key),
                  }),
                Object.assign(e.element.style, e.style));
            for (const s of n) e.element.style.setProperty(s.key, s.value);
            U(() => {
                const s = wn.get(e.key);
                if (s) {
                    if (s.activeCount !== 1) {
                        s.activeCount--;
                        return;
                    }
                    wn.delete(e.key);
                    for (const [a, l] of Object.entries(s.originalStyles)) e.element.style[a] = l;
                    for (const a of s.properties) e.element.style.removeProperty(a);
                    (e.element.style.length === 0 && e.element.removeAttribute('style'),
                        e.cleanup?.());
                }
            });
        });
    },
    So = Wu,
    Qu = (e, t) => {
        switch (t) {
            case 'x':
                return [e.clientWidth, e.scrollLeft, e.scrollWidth];
            case 'y':
                return [e.clientHeight, e.scrollTop, e.scrollHeight];
        }
    },
    Yu = (e, t) => {
        const n = getComputedStyle(e),
            r = t === 'x' ? n.overflowX : n.overflowY;
        return r === 'auto' || r === 'scroll' || (e.tagName === 'HTML' && r === 'visible');
    },
    Xu = (e, t, n) => {
        const r = t === 'x' && window.getComputedStyle(e).direction === 'rtl' ? -1 : 1;
        let o = e,
            s = 0,
            a = 0,
            l = !1;
        do {
            const [i, u, g] = Qu(o, t),
                c = g - i - r * u;
            ((u !== 0 || c !== 0) && Yu(o, t) && ((s += c), (a += u)),
                o === (n ?? document.documentElement)
                    ? (l = !0)
                    : (o = o._$host ?? o.parentElement));
        } while (o && !l);
        return [s, a];
    },
    [ko, Eo] = z([]),
    Zu = (e) => ko().indexOf(e) === ko().length - 1,
    Ju = (e) => {
        const t = j(
                {
                    element: null,
                    enabled: !0,
                    hideScrollbar: !0,
                    preventScrollbarShift: !0,
                    preventScrollbarShiftMode: 'padding',
                    restoreScrollPosition: !0,
                    allowPinchZoom: !1,
                },
                e,
            ),
            n = Oe();
        let r = [0, 0],
            o = null,
            s = null;
        (B(() => {
            Se(t.enabled) &&
                (Eo((u) => [...u, n]),
                U(() => {
                    Eo((u) => u.filter((g) => g !== n));
                }));
        }),
            B(() => {
                if (!Se(t.enabled) || !Se(t.hideScrollbar)) return;
                const { body: u } = document,
                    g = window.innerWidth - u.offsetWidth;
                if (Se(t.preventScrollbarShift)) {
                    const c = { overflow: 'hidden' },
                        d = [];
                    g > 0 &&
                        (Se(t.preventScrollbarShiftMode) === 'padding'
                            ? (c.paddingRight = `calc(${window.getComputedStyle(u).paddingRight} + ${g}px)`)
                            : (c.marginRight = `calc(${window.getComputedStyle(u).marginRight} + ${g}px)`),
                        d.push({ key: '--scrollbar-width', value: `${g}px` }));
                    const f = window.scrollY,
                        h = window.scrollX;
                    So({
                        key: 'prevent-scroll',
                        element: u,
                        style: c,
                        properties: d,
                        cleanup: () => {
                            Se(t.restoreScrollPosition) && g > 0 && window.scrollTo(h, f);
                        },
                    });
                } else So({ key: 'prevent-scroll', element: u, style: { overflow: 'hidden' } });
            }),
            B(() => {
                !Zu(n) ||
                    !Se(t.enabled) ||
                    (document.addEventListener('wheel', l, { passive: !1 }),
                    document.addEventListener('touchstart', a, { passive: !1 }),
                    document.addEventListener('touchmove', i, { passive: !1 }),
                    U(() => {
                        (document.removeEventListener('wheel', l),
                            document.removeEventListener('touchstart', a),
                            document.removeEventListener('touchmove', i));
                    }));
            }));
        const a = (u) => {
                ((r = Mo(u)), (o = null), (s = null));
            },
            l = (u) => {
                const g = u.target,
                    c = Se(t.element),
                    d = ec(u),
                    f = Math.abs(d[0]) > Math.abs(d[1]) ? 'x' : 'y',
                    h = f === 'x' ? d[0] : d[1],
                    p = Do(g, f, h, c);
                let v;
                (c && sr(c, g) ? (v = !p) : (v = !0), v && u.cancelable && u.preventDefault());
            },
            i = (u) => {
                const g = Se(t.element),
                    c = u.target;
                let d;
                if (u.touches.length === 2) d = !Se(t.allowPinchZoom);
                else {
                    if (o == null || s === null) {
                        const f = Mo(u).map((p, v) => r[v] - p),
                            h = Math.abs(f[0]) > Math.abs(f[1]) ? 'x' : 'y';
                        ((o = h), (s = h === 'x' ? f[0] : f[1]));
                    }
                    if (c.type === 'range') d = !1;
                    else {
                        const f = Do(c, o, s, g);
                        g && sr(g, c) ? (d = !f) : (d = !0);
                    }
                }
                d && u.cancelable && u.preventDefault();
            };
    },
    ec = (e) => [e.deltaX, e.deltaY],
    Mo = (e) =>
        e.changedTouches[0] ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0],
    Do = (e, t, n, r) => {
        const o = r !== null && sr(r, e),
            [s, a] = Xu(e, t, o ? r : void 0);
        return !((n > 0 && Math.abs(s) <= 1) || (n < 0 && Math.abs(a) < 1));
    },
    sr = (e, t) => {
        if (e.contains(t)) return !0;
        let n = t;
        for (; n; ) {
            if (n === e) return !0;
            n = n._$host ?? n.parentElement;
        }
        return !1;
    },
    tc = Ju,
    nc = tc,
    Bi = xe();
function Ni() {
    return we(Bi);
}
function ht() {
    const e = Ni();
    if (e === void 0)
        throw new Error('[kobalte]: `useMenuContext` must be used within a `Menu` component');
    return e;
}
var Hi = xe();
function kr() {
    const e = we(Hi);
    if (e === void 0)
        throw new Error(
            '[kobalte]: `useMenuItemContext` must be used within a `Menu.Item` component',
        );
    return e;
}
var Gi = xe();
function et() {
    const e = we(Gi);
    if (e === void 0)
        throw new Error(
            '[kobalte]: `useMenuRootContext` must be used within a `MenuRoot` component',
        );
    return e;
}
function Er(e) {
    let t;
    const n = et(),
        r = ht(),
        o = Q({ id: n.generateId(`item-${Oe()}`) }, e),
        [s, a] = J(o, [
            'ref',
            'textValue',
            'disabled',
            'closeOnSelect',
            'checked',
            'indeterminate',
            'onSelect',
            'onPointerMove',
            'onPointerLeave',
            'onPointerDown',
            'onPointerUp',
            'onClick',
            'onKeyDown',
            'onMouseDown',
            'onFocus',
        ]),
        [l, i] = z(),
        [u, g] = z(),
        [c, d] = z(),
        f = () => r.listState().selectionManager(),
        h = () => a.id,
        p = () => f().focusedKey() === h(),
        v = () => {
            (s.onSelect?.(),
                s.closeOnSelect &&
                    setTimeout(() => {
                        r.close(!0);
                    }));
        };
    cl({
        getItem: () => ({
            ref: () => t,
            type: 'item',
            key: h(),
            textValue: s.textValue ?? c()?.textContent ?? t?.textContent ?? '',
            disabled: s.disabled ?? !1,
        }),
    });
    const y = fi(
            {
                key: h,
                selectionManager: f,
                shouldSelectOnPressUp: !0,
                allowsDifferentPressOrigin: !0,
                disabled: () => s.disabled,
            },
            () => t,
        ),
        x = (k) => {
            (de(k, s.onPointerMove),
                k.pointerType === 'mouse' &&
                    (s.disabled
                        ? r.onItemLeave(k)
                        : (r.onItemEnter(k),
                          k.defaultPrevented ||
                              (ke(k.currentTarget),
                              r.listState().selectionManager().setFocused(!0),
                              r.listState().selectionManager().setFocusedKey(h())))));
        },
        b = (k) => {
            (de(k, s.onPointerLeave), k.pointerType === 'mouse' && r.onItemLeave(k));
        },
        w = (k) => {
            (de(k, s.onPointerUp), !s.disabled && k.button === 0 && v());
        },
        $ = (k) => {
            if ((de(k, s.onKeyDown), !k.repeat && !s.disabled))
                switch (k.key) {
                    case 'Enter':
                    case ' ':
                        v();
                        break;
                }
        },
        L = q(() => {
            if (s.indeterminate) return 'mixed';
            if (s.checked != null) return s.checked;
        }),
        D = q(() => ({
            'data-indeterminate': s.indeterminate ? '' : void 0,
            'data-checked': s.checked && !s.indeterminate ? '' : void 0,
            'data-disabled': s.disabled ? '' : void 0,
            'data-highlighted': p() ? '' : void 0,
        })),
        T = {
            isChecked: () => s.checked,
            dataset: D,
            setLabelRef: d,
            generateId: dn(() => a.id),
            registerLabel: Be(i),
            registerDescription: Be(g),
        };
    return m(Hi.Provider, {
        value: T,
        get children() {
            return m(
                fe,
                j(
                    {
                        as: 'div',
                        ref(k) {
                            const F = De((N) => (t = N), s.ref);
                            typeof F == 'function' && F(k);
                        },
                        get tabIndex() {
                            return y.tabIndex();
                        },
                        get 'aria-checked'() {
                            return L();
                        },
                        get 'aria-disabled'() {
                            return s.disabled;
                        },
                        get 'aria-labelledby'() {
                            return l();
                        },
                        get 'aria-describedby'() {
                            return u();
                        },
                        get 'data-key'() {
                            return y.dataKey();
                        },
                        get onPointerDown() {
                            return be([s.onPointerDown, y.onPointerDown]);
                        },
                        get onPointerUp() {
                            return be([w, y.onPointerUp]);
                        },
                        get onClick() {
                            return be([s.onClick, y.onClick]);
                        },
                        get onKeyDown() {
                            return be([$, y.onKeyDown]);
                        },
                        get onMouseDown() {
                            return be([s.onMouseDown, y.onMouseDown]);
                        },
                        get onFocus() {
                            return be([s.onFocus, y.onFocus]);
                        },
                        onPointerMove: x,
                        onPointerLeave: b,
                    },
                    D,
                    a,
                ),
            );
        },
    });
}
function Ui(e) {
    const t = Q({ closeOnSelect: !1 }, e),
        [n, r] = J(t, ['checked', 'defaultChecked', 'onChange', 'onSelect']),
        o = tl({
            isSelected: () => n.checked,
            defaultIsSelected: () => n.defaultChecked,
            onSelectedChange: (a) => n.onChange?.(a),
            isDisabled: () => r.disabled,
        });
    return m(
        Er,
        j(
            {
                role: 'menuitemcheckbox',
                get checked() {
                    return o.isSelected();
                },
                onSelect: () => {
                    (n.onSelect?.(), o.toggle());
                },
            },
            r,
        ),
    );
}
var rc = xe();
function Rn() {
    return we(rc);
}
var cn = {
        next: (e, t) =>
            e === 'ltr'
                ? t === 'horizontal'
                    ? 'ArrowRight'
                    : 'ArrowDown'
                : t === 'horizontal'
                  ? 'ArrowLeft'
                  : 'ArrowUp',
        previous: (e, t) => cn.next(e === 'ltr' ? 'rtl' : 'ltr', t),
    },
    Ao = {
        first: (e) => (e === 'horizontal' ? 'ArrowDown' : 'ArrowRight'),
        last: (e) => (e === 'horizontal' ? 'ArrowUp' : 'ArrowLeft'),
    };
function Vi(e) {
    const t = et(),
        n = ht(),
        r = Rn(),
        { direction: o } = St(),
        s = Q({ id: t.generateId('trigger') }, e),
        [a, l] = J(s, [
            'ref',
            'id',
            'disabled',
            'onPointerDown',
            'onClick',
            'onKeyDown',
            'onMouseOver',
            'onFocus',
        ]);
    let i = () => t.value();
    r !== void 0 && ((i = () => t.value() ?? a.id), r.lastValue() === void 0 && r.setLastValue(i));
    const u = Ln(
            () => n.triggerRef(),
            () => 'button',
        ),
        g = q(() => u() === 'a' && n.triggerRef()?.getAttribute('href') != null);
    B(
        dt(
            () => r?.value(),
            (y) => {
                g() && y === i() && n.triggerRef()?.focus();
            },
        ),
    );
    const c = () => {
            r !== void 0
                ? n.isOpen()
                    ? r.value() === i() && r.closeMenu()
                    : (r.autoFocusMenu() || r.setAutoFocusMenu(!0), n.open(!1))
                : n.toggle(!0);
        },
        d = (y) => {
            (de(y, a.onPointerDown),
                (y.currentTarget.dataset.pointerType = y.pointerType),
                !a.disabled && y.pointerType !== 'touch' && y.button === 0 && c());
        },
        f = (y) => {
            (de(y, a.onClick),
                a.disabled || (y.currentTarget.dataset.pointerType === 'touch' && c()));
        },
        h = (y) => {
            if ((de(y, a.onKeyDown), !a.disabled)) {
                if (g())
                    switch (y.key) {
                        case 'Enter':
                        case ' ':
                            return;
                    }
                switch (y.key) {
                    case 'Enter':
                    case ' ':
                    case Ao.first(t.orientation()):
                        (y.stopPropagation(),
                            y.preventDefault(),
                            ja(y.currentTarget),
                            n.open('first'),
                            r?.setAutoFocusMenu(!0),
                            r?.setValue(i));
                        break;
                    case Ao.last(t.orientation()):
                        (y.stopPropagation(), y.preventDefault(), n.open('last'));
                        break;
                    case cn.next(o(), t.orientation()):
                        if (r === void 0) break;
                        (y.stopPropagation(), y.preventDefault(), r.nextMenu());
                        break;
                    case cn.previous(o(), t.orientation()):
                        if (r === void 0) break;
                        (y.stopPropagation(), y.preventDefault(), r.previousMenu());
                        break;
                }
            }
        },
        p = (y) => {
            (de(y, a.onMouseOver),
                n.triggerRef()?.dataset.pointerType !== 'touch' &&
                    !a.disabled &&
                    r !== void 0 &&
                    r.value() !== void 0 &&
                    r.setValue(i));
        },
        v = (y) => {
            (de(y, a.onFocus),
                r !== void 0 && y.currentTarget.dataset.pointerType !== 'touch' && r.setValue(i));
        };
    return (
        B(() => U(n.registerTriggerId(a.id))),
        m(
            mr,
            j(
                {
                    ref(y) {
                        const x = De(n.setTriggerRef, a.ref);
                        typeof x == 'function' && x(y);
                    },
                    get 'data-kb-menu-value-trigger'() {
                        return t.value();
                    },
                    get id() {
                        return a.id;
                    },
                    get disabled() {
                        return a.disabled;
                    },
                    'aria-haspopup': 'true',
                    get 'aria-expanded'() {
                        return n.isOpen();
                    },
                    get 'aria-controls'() {
                        return ve(() => !!n.isOpen())() ? n.contentId() : void 0;
                    },
                    get 'data-highlighted'() {
                        return i() !== void 0 && r?.value() === i() ? !0 : void 0;
                    },
                    get tabIndex() {
                        return r !== void 0
                            ? r.value() === i() || r.lastValue() === i()
                                ? 0
                                : -1
                            : void 0;
                    },
                    onPointerDown: d,
                    onMouseOver: p,
                    onClick: f,
                    onKeyDown: h,
                    onFocus: v,
                    role: r !== void 0 ? 'menuitem' : void 0,
                },
                () => n.dataset(),
                l,
            ),
        )
    );
}
var oc = xe();
function ji() {
    return we(oc);
}
function Wi(e) {
    let t;
    const n = et(),
        r = ht(),
        o = Rn(),
        s = ji(),
        { direction: a } = St(),
        l = Q({ id: n.generateId(`content-${Oe()}`) }, e),
        [i, u] = J(l, [
            'ref',
            'id',
            'style',
            'onOpenAutoFocus',
            'onCloseAutoFocus',
            'onEscapeKeyDown',
            'onFocusOutside',
            'onPointerEnter',
            'onPointerMove',
            'onKeyDown',
            'onMouseDown',
            'onFocusIn',
            'onFocusOut',
        ]);
    let g = 0;
    const c = () => r.parentMenuContext() == null && o === void 0 && n.isModal(),
        d = Hu(
            {
                selectionManager: r.listState().selectionManager,
                collection: r.listState().collection,
                autoFocus: r.autoFocus,
                deferAutoFocus: !0,
                shouldFocusWrap: !0,
                disallowTypeAhead: () => !r.listState().selectionManager().isFocused(),
                orientation: () => (n.orientation() === 'horizontal' ? 'vertical' : 'horizontal'),
            },
            () => t,
        );
    Gu(
        {
            trapFocus: () => c() && r.isOpen(),
            onMountAutoFocus: (b) => {
                o === void 0 && i.onOpenAutoFocus?.(b);
            },
            onUnmountAutoFocus: i.onCloseAutoFocus,
        },
        () => t,
    );
    const f = (b) => {
            if (
                Ke(b.currentTarget, b.target) &&
                (b.key === 'Tab' && r.isOpen() && b.preventDefault(),
                o !== void 0 && b.currentTarget.getAttribute('aria-haspopup') !== 'true')
            )
                switch (b.key) {
                    case cn.next(a(), n.orientation()):
                        (b.stopPropagation(),
                            b.preventDefault(),
                            r.close(!0),
                            o.setAutoFocusMenu(!0),
                            o.nextMenu());
                        break;
                    case cn.previous(a(), n.orientation()):
                        if (b.currentTarget.hasAttribute('data-closed')) break;
                        (b.stopPropagation(),
                            b.preventDefault(),
                            r.close(!0),
                            o.setAutoFocusMenu(!0),
                            o.previousMenu());
                        break;
                }
        },
        h = (b) => {
            (i.onEscapeKeyDown?.(b), o?.setAutoFocusMenu(!1), r.close(!0));
        },
        p = (b) => {
            (i.onFocusOutside?.(b), n.isModal() && b.preventDefault());
        },
        v = (b) => {
            (de(b, i.onPointerEnter),
                r.isOpen() &&
                    (r.parentMenuContext()?.listState().selectionManager().setFocused(!1),
                    r
                        .parentMenuContext()
                        ?.listState()
                        .selectionManager()
                        .setFocusedKey(void 0)));
        },
        y = (b) => {
            if ((de(b, i.onPointerMove), b.pointerType !== 'mouse')) return;
            const w = b.target,
                $ = g !== b.clientX;
            Ke(b.currentTarget, w) &&
                $ &&
                (r.setPointerDir(b.clientX > g ? 'right' : 'left'), (g = b.clientX));
        };
    B(() => U(r.registerContentId(i.id)));
    const x = {
        ref: De((b) => {
            (r.setContentRef(b), (t = b));
        }, i.ref),
        role: 'menu',
        get id() {
            return i.id;
        },
        get tabIndex() {
            return d.tabIndex();
        },
        get 'aria-labelledby'() {
            return r.triggerId();
        },
        onKeyDown: be([i.onKeyDown, d.onKeyDown, f]),
        onMouseDown: be([i.onMouseDown, d.onMouseDown]),
        onFocusIn: be([i.onFocusIn, d.onFocusIn]),
        onFocusOut: be([i.onFocusOut, d.onFocusOut]),
        onPointerEnter: v,
        onPointerMove: y,
        get 'data-orientation'() {
            return n.orientation();
        },
    };
    return m(R, {
        get when() {
            return r.contentPresent();
        },
        get children() {
            return m(R, {
                get when() {
                    return s === void 0 || r.parentMenuContext() != null;
                },
                get fallback() {
                    return m(
                        fe,
                        j({ as: 'div' }, () => r.dataset(), x, u),
                    );
                },
                get children() {
                    return m(Mi.Positioner, {
                        get children() {
                            return m(
                                Ku,
                                j(
                                    {
                                        get disableOutsidePointerEvents() {
                                            return ve(() => !!c())() && r.isOpen();
                                        },
                                        get excludedElements() {
                                            return [r.triggerRef];
                                        },
                                        bypassTopMostLayerCheck: !0,
                                        get style() {
                                            return In(
                                                {
                                                    '--kb-menu-content-transform-origin':
                                                        'var(--kb-popper-content-transform-origin)',
                                                    position: 'relative',
                                                },
                                                i.style,
                                            );
                                        },
                                        onEscapeKeyDown: h,
                                        onFocusOutside: p,
                                        get onDismiss() {
                                            return r.close;
                                        },
                                    },
                                    () => r.dataset(),
                                    x,
                                    u,
                                ),
                            );
                        },
                    });
                },
            });
        },
    });
}
function ic(e) {
    let t;
    const n = et(),
        r = ht(),
        [o, s] = J(e, ['ref']);
    return (
        nc({ element: () => t ?? null, enabled: () => r.contentPresent() && n.preventScroll() }),
        m(
            Wi,
            j(
                {
                    ref(a) {
                        const l = De((i) => {
                            t = i;
                        }, o.ref);
                        typeof l == 'function' && l(a);
                    },
                },
                s,
            ),
        )
    );
}
var Qi = xe();
function sc() {
    const e = we(Qi);
    if (e === void 0)
        throw new Error(
            '[kobalte]: `useMenuGroupContext` must be used within a `Menu.Group` component',
        );
    return e;
}
function Mr(e) {
    const t = et(),
        n = Q({ id: t.generateId(`group-${Oe()}`) }, e),
        [r, o] = z(),
        s = { generateId: dn(() => n.id), registerLabelId: Be(o) };
    return m(Qi.Provider, {
        value: s,
        get children() {
            return m(
                fe,
                j(
                    {
                        as: 'div',
                        role: 'group',
                        get 'aria-labelledby'() {
                            return r();
                        },
                    },
                    n,
                ),
            );
        },
    });
}
function Yi(e) {
    const t = sc(),
        n = Q({ id: t.generateId('label') }, e),
        [r, o] = J(n, ['id']);
    return (
        B(() => U(t.registerLabelId(r.id))),
        m(
            fe,
            j(
                {
                    as: 'span',
                    get id() {
                        return r.id;
                    },
                    'aria-hidden': 'true',
                },
                o,
            ),
        )
    );
}
function Xi(e) {
    const t = ht(),
        n = Q({ children: '▼' }, e);
    return m(
        fe,
        j({ as: 'span', 'aria-hidden': 'true' }, () => t.dataset(), n),
    );
}
function Zi(e) {
    return m(Er, j({ role: 'menuitem', closeOnSelect: !0 }, e));
}
function Ji(e) {
    const t = kr(),
        n = Q({ id: t.generateId('description') }, e),
        [r, o] = J(n, ['id']);
    return (
        B(() => U(t.registerDescription(r.id))),
        m(
            fe,
            j(
                {
                    as: 'div',
                    get id() {
                        return r.id;
                    },
                },
                () => t.dataset(),
                o,
            ),
        )
    );
}
function es(e) {
    const t = kr(),
        n = Q({ id: t.generateId('indicator') }, e),
        [r, o] = J(n, ['forceMount']);
    return m(R, {
        get when() {
            return r.forceMount || t.isChecked();
        },
        get children() {
            return m(
                fe,
                j({ as: 'div' }, () => t.dataset(), o),
            );
        },
    });
}
function ts(e) {
    const t = kr(),
        n = Q({ id: t.generateId('label') }, e),
        [r, o] = J(n, ['ref', 'id']);
    return (
        B(() => U(t.registerLabel(r.id))),
        m(
            fe,
            j(
                {
                    as: 'div',
                    ref(s) {
                        const a = De(t.setLabelRef, r.ref);
                        typeof a == 'function' && a(s);
                    },
                    get id() {
                        return r.id;
                    },
                },
                () => t.dataset(),
                o,
            ),
        )
    );
}
function ns(e) {
    const t = ht();
    return m(R, {
        get when() {
            return t.contentPresent();
        },
        get children() {
            return m(zo, e);
        },
    });
}
var rs = xe();
function ac() {
    const e = we(rs);
    if (e === void 0)
        throw new Error(
            '[kobalte]: `useMenuRadioGroupContext` must be used within a `Menu.RadioGroup` component',
        );
    return e;
}
function os(e) {
    const n = et().generateId(`radiogroup-${Oe()}`),
        r = Q({ id: n }, e),
        [o, s] = J(r, ['value', 'defaultValue', 'onChange', 'disabled']),
        [a, l] = gn({
            value: () => o.value,
            defaultValue: () => o.defaultValue,
            onChange: (u) => o.onChange?.(u),
        }),
        i = {
            isDisabled: () => o.disabled,
            isSelectedValue: (u) => u === a(),
            setSelectedValue: l,
        };
    return m(rs.Provider, {
        value: i,
        get children() {
            return m(Mr, s);
        },
    });
}
function is(e) {
    const t = ac(),
        n = Q({ closeOnSelect: !1 }, e),
        [r, o] = J(n, ['value', 'onSelect']);
    return m(
        Er,
        j(
            {
                role: 'menuitemradio',
                get checked() {
                    return t.isSelectedValue(r.value);
                },
                onSelect: () => {
                    (r.onSelect?.(), t.setSelectedValue(r.value));
                },
            },
            o,
        ),
    );
}
function lc(e, t, n) {
    const r = e.split('-')[0],
        o = n.getBoundingClientRect(),
        s = [],
        a = t.clientX,
        l = t.clientY;
    switch (r) {
        case 'top':
            (s.push([a, l + 5]),
                s.push([o.left, o.bottom]),
                s.push([o.left, o.top]),
                s.push([o.right, o.top]),
                s.push([o.right, o.bottom]));
            break;
        case 'right':
            (s.push([a - 5, l]),
                s.push([o.left, o.top]),
                s.push([o.right, o.top]),
                s.push([o.right, o.bottom]),
                s.push([o.left, o.bottom]));
            break;
        case 'bottom':
            (s.push([a, l - 5]),
                s.push([o.right, o.top]),
                s.push([o.right, o.bottom]),
                s.push([o.left, o.bottom]),
                s.push([o.left, o.top]));
            break;
        case 'left':
            (s.push([a + 5, l]),
                s.push([o.right, o.bottom]),
                s.push([o.left, o.bottom]),
                s.push([o.left, o.top]),
                s.push([o.right, o.top]));
            break;
    }
    return s;
}
function uc(e, t) {
    return t ? Va([e.clientX, e.clientY], t) : !1;
}
function ss(e) {
    const t = et(),
        n = ii(),
        r = Ni(),
        o = Rn(),
        s = ji(),
        a = Q({ placement: t.orientation() === 'horizontal' ? 'bottom-start' : 'right-start' }, e),
        [l, i] = J(a, ['open', 'defaultOpen', 'onOpenChange']);
    let u = 0,
        g = null,
        c = 'right';
    const [d, f] = z(),
        [h, p] = z(),
        [v, y] = z(),
        [x, b] = z(),
        [w, $] = z(!0),
        [L, D] = z(i.placement),
        [T, k] = z([]),
        [F, N] = z([]),
        { DomCollectionProvider: H } = ul({ items: F, onItemsChange: N }),
        ne = Ai({
            open: () => l.open,
            defaultOpen: () => l.defaultOpen,
            onOpenChange: (V) => l.onOpenChange?.(V),
        }),
        { present: ee } = gi({
            show: () => t.forceMount() || ne.isOpen(),
            element: () => x() ?? null,
        }),
        le = Ml({ selectionMode: 'none', dataSource: F }),
        ie = (V) => {
            ($(V), ne.open());
        },
        re = (V = !1) => {
            (ne.close(), V && r && r.close(!0));
        },
        se = (V) => {
            ($(V), ne.toggle());
        },
        ue = () => {
            const V = x();
            V &&
                (ke(V),
                le.selectionManager().setFocused(!0),
                le.selectionManager().setFocusedKey(void 0));
        },
        me = () => {
            s != null ? setTimeout(() => ue()) : ue();
        },
        Ae = (V) => {
            k((Ce) => [...Ce, V]);
            const Ne = r?.registerNestedMenu(V);
            return () => {
                (k((Ce) => Jn(Ce, V)), Ne?.());
            };
        },
        he = (V) => c === g?.side && uc(V, g?.area),
        Ee = (V) => {
            he(V) && V.preventDefault();
        },
        M = (V) => {
            he(V) || me();
        },
        ge = (V) => {
            he(V) && V.preventDefault();
        };
    (Vu({
        isDisabled: () => !(r == null && ne.isOpen() && t.isModal()),
        targets: () => [x(), ...T()].filter(Boolean),
    }),
        B(() => {
            const V = x();
            if (!V || !r) return;
            const Ne = r.registerNestedMenu(V);
            U(() => {
                Ne();
            });
        }),
        B(() => {
            r === void 0 && o?.registerMenu(t.value(), [x(), ...T()]);
        }),
        B(() => {
            r !== void 0 ||
                o === void 0 ||
                (o.value() === t.value() ? (v()?.focus(), o.autoFocusMenu() && ie(!0)) : re());
        }),
        B(() => {
            r !== void 0 || o === void 0 || (ne.isOpen() && o.setValue(t.value()));
        }),
        U(() => {
            r === void 0 && o?.unregisterMenu(t.value());
        }));
    const vt = {
        dataset: q(() => ({
            'data-expanded': ne.isOpen() ? '' : void 0,
            'data-closed': ne.isOpen() ? void 0 : '',
        })),
        isOpen: ne.isOpen,
        contentPresent: ee,
        nestedMenus: T,
        currentPlacement: L,
        pointerGraceTimeoutId: () => u,
        autoFocus: w,
        listState: () => le,
        parentMenuContext: () => r,
        triggerRef: v,
        contentRef: x,
        triggerId: d,
        contentId: h,
        setTriggerRef: y,
        setContentRef: b,
        open: ie,
        close: re,
        toggle: se,
        focusContent: me,
        onItemEnter: Ee,
        onItemLeave: M,
        onTriggerLeave: ge,
        setPointerDir: (V) => (c = V),
        setPointerGraceTimeoutId: (V) => (u = V),
        setPointerGraceIntent: (V) => (g = V),
        registerNestedMenu: Ae,
        registerItemToParentDomCollection: n?.registerItem,
        registerTriggerId: Be(f),
        registerContentId: Be(p),
    };
    return m(H, {
        get children() {
            return m(Bi.Provider, {
                value: vt,
                get children() {
                    return m(R, {
                        when: s === void 0,
                        get fallback() {
                            return i.children;
                        },
                        get children() {
                            return m(
                                Mi,
                                j({ anchorRef: v, contentRef: x, onCurrentPlacementChange: D }, i),
                            );
                        },
                    });
                },
            });
        },
    });
}
function as(e) {
    const { direction: t } = St();
    return m(
        ss,
        j(
            {
                get placement() {
                    return t() === 'rtl' ? 'left-start' : 'right-start';
                },
                flip: !0,
            },
            e,
        ),
    );
}
var cc = {
    close: (e, t) =>
        e === 'ltr'
            ? [t === 'horizontal' ? 'ArrowLeft' : 'ArrowUp']
            : [t === 'horizontal' ? 'ArrowRight' : 'ArrowDown'],
};
function ls(e) {
    const t = ht(),
        n = et(),
        [r, o] = J(e, ['onFocusOutside', 'onKeyDown']),
        { direction: s } = St();
    return m(
        Wi,
        j(
            {
                onOpenAutoFocus: (g) => {
                    g.preventDefault();
                },
                onCloseAutoFocus: (g) => {
                    g.preventDefault();
                },
                onFocusOutside: (g) => {
                    r.onFocusOutside?.(g);
                    const c = g.target;
                    Ke(t.triggerRef(), c) || t.close();
                },
                onKeyDown: (g) => {
                    de(g, r.onKeyDown);
                    const c = Ke(g.currentTarget, g.target),
                        d = cc.close(s(), n.orientation()).includes(g.key),
                        f = t.parentMenuContext() != null;
                    c && d && f && (t.close(), ke(t.triggerRef()));
                },
            },
            o,
        ),
    );
}
var To = ['Enter', ' '],
    dc = {
        open: (e, t) =>
            e === 'ltr'
                ? [...To, t === 'horizontal' ? 'ArrowRight' : 'ArrowDown']
                : [...To, t === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'],
    };
function us(e) {
    let t;
    const n = et(),
        r = ht(),
        o = Q({ id: n.generateId(`sub-trigger-${Oe()}`) }, e),
        [s, a] = J(o, [
            'ref',
            'id',
            'textValue',
            'disabled',
            'onPointerMove',
            'onPointerLeave',
            'onPointerDown',
            'onPointerUp',
            'onClick',
            'onKeyDown',
            'onMouseDown',
            'onFocus',
        ]);
    let l = null;
    const i = () => {
            (l && window.clearTimeout(l), (l = null));
        },
        { direction: u } = St(),
        g = () => s.id,
        c = () => {
            const b = r.parentMenuContext();
            if (b == null)
                throw new Error(
                    '[kobalte]: `Menu.SubTrigger` must be used within a `Menu.Sub` component',
                );
            return b.listState().selectionManager();
        },
        d = () => r.listState().collection(),
        f = () => c().focusedKey() === g(),
        h = fi(
            {
                key: g,
                selectionManager: c,
                shouldSelectOnPressUp: !0,
                allowsDifferentPressOrigin: !0,
                disabled: () => s.disabled,
            },
            () => t,
        ),
        p = (b) => {
            (de(b, s.onClick), !r.isOpen() && !s.disabled && r.open(!0));
        },
        v = (b) => {
            if ((de(b, s.onPointerMove), b.pointerType !== 'mouse')) return;
            const w = r.parentMenuContext();
            if ((w?.onItemEnter(b), !b.defaultPrevented)) {
                if (s.disabled) {
                    w?.onItemLeave(b);
                    return;
                }
                (!r.isOpen() &&
                    !l &&
                    (r.parentMenuContext()?.setPointerGraceIntent(null),
                    (l = window.setTimeout(() => {
                        (r.open(!1), i());
                    }, 100))),
                    w?.onItemEnter(b),
                    b.defaultPrevented ||
                        (r.listState().selectionManager().isFocused() &&
                            (r.listState().selectionManager().setFocused(!1),
                            r
                                .listState()
                                .selectionManager()
                                .setFocusedKey(void 0)),
                        ke(b.currentTarget),
                        w?.listState().selectionManager().setFocused(!0),
                        w?.listState().selectionManager().setFocusedKey(g())));
            }
        },
        y = (b) => {
            if ((de(b, s.onPointerLeave), b.pointerType !== 'mouse')) return;
            i();
            const w = r.parentMenuContext(),
                $ = r.contentRef();
            if ($) {
                (w?.setPointerGraceIntent({
                    area: lc(r.currentPlacement(), b, $),
                    side: r.currentPlacement().split('-')[0],
                }),
                    window.clearTimeout(w?.pointerGraceTimeoutId()));
                const L = window.setTimeout(() => {
                    w?.setPointerGraceIntent(null);
                }, 300);
                w?.setPointerGraceTimeoutId(L);
            } else {
                if ((w?.onTriggerLeave(b), b.defaultPrevented)) return;
                w?.setPointerGraceIntent(null);
            }
            w?.onItemLeave(b);
        },
        x = (b) => {
            (de(b, s.onKeyDown),
                !b.repeat &&
                    (s.disabled ||
                        (dc.open(u(), n.orientation()).includes(b.key) &&
                            (b.stopPropagation(),
                            b.preventDefault(),
                            c().setFocused(!1),
                            c().setFocusedKey(void 0),
                            r.isOpen() || r.open('first'),
                            r.focusContent(),
                            r.listState().selectionManager().setFocused(!0),
                            r.listState().selectionManager().setFocusedKey(d().getFirstKey())))));
        };
    return (
        B(() => {
            if (r.registerItemToParentDomCollection == null)
                throw new Error(
                    '[kobalte]: `Menu.SubTrigger` must be used within a `Menu.Sub` component',
                );
            const b = r.registerItemToParentDomCollection({
                ref: () => t,
                type: 'item',
                key: g(),
                textValue: s.textValue ?? t?.textContent ?? '',
                disabled: s.disabled ?? !1,
            });
            U(b);
        }),
        B(
            dt(
                () => r.parentMenuContext()?.pointerGraceTimeoutId(),
                (b) => {
                    U(() => {
                        (window.clearTimeout(b),
                            r.parentMenuContext()?.setPointerGraceIntent(null));
                    });
                },
            ),
        ),
        B(() => U(r.registerTriggerId(s.id))),
        U(() => {
            i();
        }),
        m(
            fe,
            j(
                {
                    as: 'div',
                    ref(b) {
                        const w = De(($) => {
                            (r.setTriggerRef($), (t = $));
                        }, s.ref);
                        typeof w == 'function' && w(b);
                    },
                    get id() {
                        return s.id;
                    },
                    role: 'menuitem',
                    get tabIndex() {
                        return h.tabIndex();
                    },
                    'aria-haspopup': 'true',
                    get 'aria-expanded'() {
                        return r.isOpen();
                    },
                    get 'aria-controls'() {
                        return ve(() => !!r.isOpen())() ? r.contentId() : void 0;
                    },
                    get 'aria-disabled'() {
                        return s.disabled;
                    },
                    get 'data-key'() {
                        return h.dataKey();
                    },
                    get 'data-highlighted'() {
                        return f() ? '' : void 0;
                    },
                    get 'data-disabled'() {
                        return s.disabled ? '' : void 0;
                    },
                    get onPointerDown() {
                        return be([s.onPointerDown, h.onPointerDown]);
                    },
                    get onPointerUp() {
                        return be([s.onPointerUp, h.onPointerUp]);
                    },
                    get onClick() {
                        return be([p, h.onClick]);
                    },
                    get onKeyDown() {
                        return be([x, h.onKeyDown]);
                    },
                    get onMouseDown() {
                        return be([s.onMouseDown, h.onMouseDown]);
                    },
                    get onFocus() {
                        return be([s.onFocus, h.onFocus]);
                    },
                    onPointerMove: v,
                    onPointerLeave: y,
                },
                () => r.dataset(),
                a,
            ),
        )
    );
}
function fc(e) {
    const t = Rn(),
        n = `menu-${Oe()}`,
        r = Q({ id: n, modal: !0 }, e),
        [o, s] = J(r, [
            'id',
            'modal',
            'preventScroll',
            'forceMount',
            'open',
            'defaultOpen',
            'onOpenChange',
            'value',
            'orientation',
        ]),
        a = Ai({
            open: () => o.open,
            defaultOpen: () => o.defaultOpen,
            onOpenChange: (i) => o.onOpenChange?.(i),
        }),
        l = {
            isModal: () => o.modal ?? !0,
            preventScroll: () => o.preventScroll ?? l.isModal(),
            forceMount: () => o.forceMount ?? !1,
            generateId: dn(() => o.id),
            value: () => o.value,
            orientation: () => o.orientation ?? t?.orientation() ?? 'horizontal',
        };
    return m(Gi.Provider, {
        value: l,
        get children() {
            return m(
                ss,
                j(
                    {
                        get open() {
                            return a.isOpen();
                        },
                        get onOpenChange() {
                            return a.setIsOpen;
                        },
                    },
                    s,
                ),
            );
        },
    });
}
var gc = {};
On(gc, { Root: () => zn, Separator: () => hc });
function zn(e) {
    let t;
    const n = Q({ orientation: 'horizontal' }, e),
        [r, o] = J(n, ['ref', 'orientation']),
        s = Ln(
            () => t,
            () => 'hr',
        );
    return m(
        fe,
        j(
            {
                as: 'hr',
                ref(a) {
                    const l = De((i) => (t = i), r.ref);
                    typeof l == 'function' && l(a);
                },
                get role() {
                    return s() !== 'hr' ? 'separator' : void 0;
                },
                get 'aria-orientation'() {
                    return r.orientation === 'vertical' ? 'vertical' : void 0;
                },
                get 'data-orientation'() {
                    return r.orientation;
                },
            },
            o,
        ),
    );
}
var hc = zn,
    Z = {};
On(Z, {
    Arrow: () => Sr,
    CheckboxItem: () => Ui,
    Content: () => cs,
    DropdownMenu: () => vc,
    Group: () => Mr,
    GroupLabel: () => Yi,
    Icon: () => Xi,
    Item: () => Zi,
    ItemDescription: () => Ji,
    ItemIndicator: () => es,
    ItemLabel: () => ts,
    Portal: () => ns,
    RadioGroup: () => os,
    RadioItem: () => is,
    Root: () => ds,
    Separator: () => zn,
    Sub: () => as,
    SubContent: () => ls,
    SubTrigger: () => us,
    Trigger: () => Vi,
});
function cs(e) {
    const t = et(),
        n = ht(),
        [r, o] = J(e, ['onCloseAutoFocus', 'onInteractOutside']);
    let s = !1;
    return m(
        ic,
        j(
            {
                onCloseAutoFocus: (i) => {
                    (r.onCloseAutoFocus?.(i),
                        s || ke(n.triggerRef()),
                        (s = !1),
                        i.preventDefault());
                },
                onInteractOutside: (i) => {
                    (r.onInteractOutside?.(i),
                        (!t.isModal() || i.detail.isContextMenu) && (s = !0));
                },
            },
            o,
        ),
    );
}
function ds(e) {
    const t = `dropdownmenu-${Oe()}`,
        n = Q({ id: t }, e);
    return m(fc, n);
}
var vc = Object.assign(ds, {
        Arrow: Sr,
        CheckboxItem: Ui,
        Content: cs,
        Group: Mr,
        GroupLabel: Yi,
        Icon: Xi,
        Item: Zi,
        ItemDescription: Ji,
        ItemIndicator: es,
        ItemLabel: ts,
        Portal: ns,
        RadioGroup: os,
        RadioItem: is,
        Separator: zn,
        Sub: as,
        SubContent: ls,
        SubTrigger: us,
        Trigger: Vi,
    }),
    C = {
        colors: {
            inherit: 'inherit',
            current: 'currentColor',
            transparent: 'transparent',
            black: '#000000',
            white: '#ffffff',
            neutral: {
                50: '#f9fafb',
                100: '#f2f4f7',
                200: '#eaecf0',
                300: '#d0d5dd',
                400: '#98a2b3',
                500: '#667085',
                600: '#475467',
                700: '#344054',
                800: '#1d2939',
                900: '#101828',
            },
            darkGray: {
                50: '#525c7a',
                100: '#49536e',
                200: '#414962',
                300: '#394056',
                400: '#313749',
                500: '#292e3d',
                600: '#212530',
                700: '#191c24',
                800: '#111318',
                900: '#0b0d10',
            },
            gray: {
                50: '#f9fafb',
                100: '#f2f4f7',
                200: '#eaecf0',
                300: '#d0d5dd',
                400: '#98a2b3',
                500: '#667085',
                600: '#475467',
                700: '#344054',
                800: '#1d2939',
                900: '#101828',
            },
            blue: {
                25: '#F5FAFF',
                50: '#EFF8FF',
                100: '#D1E9FF',
                200: '#B2DDFF',
                300: '#84CAFF',
                400: '#53B1FD',
                500: '#2E90FA',
                600: '#1570EF',
                700: '#175CD3',
                800: '#1849A9',
                900: '#194185',
            },
            green: {
                25: '#F6FEF9',
                50: '#ECFDF3',
                100: '#D1FADF',
                200: '#A6F4C5',
                300: '#6CE9A6',
                400: '#32D583',
                500: '#12B76A',
                600: '#039855',
                700: '#027A48',
                800: '#05603A',
                900: '#054F31',
            },
            red: {
                50: '#fef2f2',
                100: '#fee2e2',
                200: '#fecaca',
                300: '#fca5a5',
                400: '#f87171',
                500: '#ef4444',
                600: '#dc2626',
                700: '#b91c1c',
                800: '#991b1b',
                900: '#7f1d1d',
                950: '#450a0a',
            },
            yellow: {
                25: '#FFFCF5',
                50: '#FFFAEB',
                100: '#FEF0C7',
                200: '#FEDF89',
                300: '#FEC84B',
                400: '#FDB022',
                500: '#F79009',
                600: '#DC6803',
                700: '#B54708',
                800: '#93370D',
                900: '#7A2E0E',
            },
            purple: {
                25: '#FAFAFF',
                50: '#F4F3FF',
                100: '#EBE9FE',
                200: '#D9D6FE',
                300: '#BDB4FE',
                400: '#9B8AFB',
                500: '#7A5AF8',
                600: '#6938EF',
                700: '#5925DC',
                800: '#4A1FB8',
                900: '#3E1C96',
            },
            teal: {
                25: '#F6FEFC',
                50: '#F0FDF9',
                100: '#CCFBEF',
                200: '#99F6E0',
                300: '#5FE9D0',
                400: '#2ED3B7',
                500: '#15B79E',
                600: '#0E9384',
                700: '#107569',
                800: '#125D56',
                900: '#134E48',
            },
            pink: {
                25: '#fdf2f8',
                50: '#fce7f3',
                100: '#fbcfe8',
                200: '#f9a8d4',
                300: '#f472b6',
                400: '#ec4899',
                500: '#db2777',
                600: '#be185d',
                700: '#9d174d',
                800: '#831843',
                900: '#500724',
            },
            cyan: {
                25: '#ecfeff',
                50: '#cffafe',
                100: '#a5f3fc',
                200: '#67e8f9',
                300: '#22d3ee',
                400: '#06b6d4',
                500: '#0891b2',
                600: '#0e7490',
                700: '#155e75',
                800: '#164e63',
                900: '#083344',
            },
        },
        alpha: { 90: 'e5', 80: 'cc' },
        font: {
            size: {
                xs: 'calc(var(--tsqd-font-size) * 0.75)',
                sm: 'calc(var(--tsqd-font-size) * 0.875)',
                md: 'var(--tsqd-font-size)',
            },
            lineHeight: {
                xs: 'calc(var(--tsqd-font-size) * 1)',
                sm: 'calc(var(--tsqd-font-size) * 1.25)',
                md: 'calc(var(--tsqd-font-size) * 1.5)',
            },
            weight: { medium: '500', semibold: '600', bold: '700' },
        },
        border: {
            radius: {
                xs: 'calc(var(--tsqd-font-size) * 0.125)',
                sm: 'calc(var(--tsqd-font-size) * 0.25)',
                full: '9999px',
            },
        },
        size: {
            0.25: 'calc(var(--tsqd-font-size) * 0.0625)',
            0.5: 'calc(var(--tsqd-font-size) * 0.125)',
            1: 'calc(var(--tsqd-font-size) * 0.25)',
            1.5: 'calc(var(--tsqd-font-size) * 0.375)',
            2: 'calc(var(--tsqd-font-size) * 0.5)',
            2.5: 'calc(var(--tsqd-font-size) * 0.625)',
            3: 'calc(var(--tsqd-font-size) * 0.75)',
            3.5: 'calc(var(--tsqd-font-size) * 0.875)',
            4: 'calc(var(--tsqd-font-size) * 1)',
            4.5: 'calc(var(--tsqd-font-size) * 1.125)',
            5: 'calc(var(--tsqd-font-size) * 1.25)',
            6: 'calc(var(--tsqd-font-size) * 1.5)',
            6.5: 'calc(var(--tsqd-font-size) * 1.625)',
            14: 'calc(var(--tsqd-font-size) * 3.5)',
        },
        shadow: {
            xs: (e = 'rgb(0 0 0 / 0.1)') => '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            sm: (e = 'rgb(0 0 0 / 0.1)') => `0 1px 3px 0 ${e}, 0 1px 2px -1px ${e}`,
            md: (e = 'rgb(0 0 0 / 0.1)') => `0 4px 6px -1px ${e}, 0 2px 4px -2px ${e}`,
            lg: (e = 'rgb(0 0 0 / 0.1)') => `0 10px 15px -3px ${e}, 0 4px 6px -4px ${e}`,
            xl: (e = 'rgb(0 0 0 / 0.1)') => `0 20px 25px -5px ${e}, 0 8px 10px -6px ${e}`,
            '2xl': (e = 'rgb(0 0 0 / 0.25)') => `0 25px 50px -12px ${e}`,
            inner: (e = 'rgb(0 0 0 / 0.05)') => `inset 0 2px 4px 0 ${e}`,
            none: () => 'none',
        },
    },
    mc = _(
        '<svg width=14 height=14 viewBox="0 0 14 14"fill=none xmlns=http://www.w3.org/2000/svg><path d="M13 13L9.00007 9M10.3333 5.66667C10.3333 8.244 8.244 10.3333 5.66667 10.3333C3.08934 10.3333 1 8.244 1 5.66667C1 3.08934 3.08934 1 5.66667 1C8.244 1 10.3333 3.08934 10.3333 5.66667Z"stroke=currentColor stroke-width=1.66667 stroke-linecap=round stroke-linejoin=round>',
    ),
    yc = _(
        '<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    pc = _(
        '<svg width=10 height=6 viewBox="0 0 10 6"fill=none xmlns=http://www.w3.org/2000/svg><path d="M1 1L5 5L9 1"stroke=currentColor stroke-width=1.66667 stroke-linecap=round stroke-linejoin=round>',
    ),
    bc = _(
        '<svg width=12 height=12 viewBox="0 0 16 16"fill=none xmlns=http://www.w3.org/2000/svg><path d="M8 13.3333V2.66667M8 2.66667L4 6.66667M8 2.66667L12 6.66667"stroke=currentColor stroke-width=1.66667 stroke-linecap=round stroke-linejoin=round>',
    ),
    Dr = _(
        '<svg width=12 height=12 viewBox="0 0 16 16"fill=none xmlns=http://www.w3.org/2000/svg><path d="M8 2.66667V13.3333M8 13.3333L4 9.33333M8 13.3333L12 9.33333"stroke=currentColor stroke-width=1.66667 stroke-linecap=round stroke-linejoin=round>',
    ),
    xc = _(
        '<svg viewBox="0 0 24 24"height=12 width=12 fill=none xmlns=http://www.w3.org/2000/svg><path d="M12 2v2m0 16v2M4 12H2m4.314-5.686L4.9 4.9m12.786 1.414L19.1 4.9M6.314 17.69 4.9 19.104m12.786-1.414 1.414 1.414M22 12h-2m-3 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    wc = _(
        '<svg viewBox="0 0 24 24"height=12 width=12 fill=none xmlns=http://www.w3.org/2000/svg><path d="M22 15.844a10.424 10.424 0 0 1-4.306.925c-5.779 0-10.463-4.684-10.463-10.462 0-1.536.33-2.994.925-4.307A10.464 10.464 0 0 0 2 11.538C2 17.316 6.684 22 12.462 22c4.243 0 7.896-2.526 9.538-6.156Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    $c = _(
        '<svg viewBox="0 0 24 24"height=12 width=12 fill=none xmlns=http://www.w3.org/2000/svg><path d="M8 21h8m-4-4v4m-5.2-4h10.4c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C22 14.72 22 13.88 22 12.2V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C19.72 3 18.88 3 17.2 3H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C2 5.28 2 6.12 2 7.8v4.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C4.28 17 5.12 17 6.8 17Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    Cc = _(
        '<svg stroke=currentColor fill=currentColor stroke-width=0 viewBox="0 0 24 24"height=1em width=1em xmlns=http://www.w3.org/2000/svg><path fill=none d="M0 0h24v24H0z"></path><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z">',
    ),
    Sc = _(
        '<svg stroke-width=0 viewBox="0 0 24 24"height=1em width=1em xmlns=http://www.w3.org/2000/svg><path fill=none d="M24 .01c0-.01 0-.01 0 0L0 0v24h24V.01zM0 0h24v24H0V0zm0 0h24v24H0V0z"></path><path d="M22.99 9C19.15 5.16 13.8 3.76 8.84 4.78l2.52 2.52c3.47-.17 6.99 1.05 9.63 3.7l2-2zm-4 4a9.793 9.793 0 00-4.49-2.56l3.53 3.53.96-.97zM2 3.05L5.07 6.1C3.6 6.82 2.22 7.78 1 9l1.99 2c1.24-1.24 2.67-2.16 4.2-2.77l2.24 2.24A9.684 9.684 0 005 13v.01L6.99 15a7.042 7.042 0 014.92-2.06L18.98 20l1.27-1.26L3.29 1.79 2 3.05zM9 17l3 3 3-3a4.237 4.237 0 00-6 0z">',
    ),
    kc = _(
        '<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M9.3951 19.3711L9.97955 20.6856C10.1533 21.0768 10.4368 21.4093 10.7958 21.6426C11.1547 21.8759 11.5737 22.0001 12.0018 22C12.4299 22.0001 12.8488 21.8759 13.2078 21.6426C13.5667 21.4093 13.8503 21.0768 14.024 20.6856L14.6084 19.3711C14.8165 18.9047 15.1664 18.5159 15.6084 18.26C16.0532 18.0034 16.5678 17.8941 17.0784 17.9478L18.5084 18.1C18.9341 18.145 19.3637 18.0656 19.7451 17.8713C20.1265 17.6771 20.4434 17.3763 20.6573 17.0056C20.8715 16.635 20.9735 16.2103 20.9511 15.7829C20.9286 15.3555 20.7825 14.9438 20.5307 14.5978L19.684 13.4344C19.3825 13.0171 19.2214 12.5148 19.224 12C19.2239 11.4866 19.3865 10.9864 19.6884 10.5711L20.5351 9.40778C20.787 9.06175 20.933 8.65007 20.9555 8.22267C20.978 7.79528 20.8759 7.37054 20.6618 7C20.4479 6.62923 20.131 6.32849 19.7496 6.13423C19.3681 5.93997 18.9386 5.86053 18.5129 5.90556L17.0829 6.05778C16.5722 6.11141 16.0577 6.00212 15.6129 5.74556C15.17 5.48825 14.82 5.09736 14.6129 4.62889L14.024 3.31444C13.8503 2.92317 13.5667 2.59072 13.2078 2.3574C12.8488 2.12408 12.4299 1.99993 12.0018 2C11.5737 1.99993 11.1547 2.12408 10.7958 2.3574C10.4368 2.59072 10.1533 2.92317 9.97955 3.31444L9.3951 4.62889C9.18803 5.09736 8.83798 5.48825 8.3951 5.74556C7.95032 6.00212 7.43577 6.11141 6.9251 6.05778L5.49066 5.90556C5.06499 5.86053 4.6354 5.93997 4.25397 6.13423C3.87255 6.32849 3.55567 6.62923 3.34177 7C3.12759 7.37054 3.02555 7.79528 3.04804 8.22267C3.07052 8.65007 3.21656 9.06175 3.46844 9.40778L4.3151 10.5711C4.61704 10.9864 4.77964 11.4866 4.77955 12C4.77964 12.5134 4.61704 13.0137 4.3151 13.4289L3.46844 14.5922C3.21656 14.9382 3.07052 15.3499 3.04804 15.7773C3.02555 16.2047 3.12759 16.6295 3.34177 17C3.55589 17.3706 3.8728 17.6712 4.25417 17.8654C4.63554 18.0596 5.06502 18.1392 5.49066 18.0944L6.92066 17.9422C7.43133 17.8886 7.94587 17.9979 8.39066 18.2544C8.83519 18.511 9.18687 18.902 9.3951 19.3711Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round></path><path d="M12 15C13.6568 15 15 13.6569 15 12C15 10.3431 13.6568 9 12 9C10.3431 9 8.99998 10.3431 8.99998 12C8.99998 13.6569 10.3431 15 12 15Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    Ec = _(
        '<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M16 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V8M11.5 12.5L17 7M17 7H12M17 7V12M6.2 21H8.8C9.9201 21 10.4802 21 10.908 20.782C11.2843 20.5903 11.5903 20.2843 11.782 19.908C12 19.4802 12 18.9201 12 17.8V15.2C12 14.0799 12 13.5198 11.782 13.092C11.5903 12.7157 11.2843 12.4097 10.908 12.218C10.4802 12 9.92011 12 8.8 12H6.2C5.0799 12 4.51984 12 4.09202 12.218C3.71569 12.4097 3.40973 12.7157 3.21799 13.092C3 13.5198 3 14.0799 3 15.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    Mc = _(
        '<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path class=copier d="M8 8V5.2C8 4.0799 8 3.51984 8.21799 3.09202C8.40973 2.71569 8.71569 2.40973 9.09202 2.21799C9.51984 2 10.0799 2 11.2 2H18.8C19.9201 2 20.4802 2 20.908 2.21799C21.2843 2.40973 21.5903 2.71569 21.782 3.09202C22 3.51984 22 4.0799 22 5.2V12.8C22 13.9201 22 14.4802 21.782 14.908C21.5903 15.2843 21.2843 15.5903 20.908 15.782C20.4802 16 19.9201 16 18.8 16H16M5.2 22H12.8C13.9201 22 14.4802 22 14.908 21.782C15.2843 21.5903 15.5903 21.2843 15.782 20.908C16 20.4802 16 19.9201 16 18.8V11.2C16 10.0799 16 9.51984 15.782 9.09202C15.5903 8.71569 15.2843 8.40973 14.908 8.21799C14.4802 8 13.9201 8 12.8 8H5.2C4.0799 8 3.51984 8 3.09202 8.21799C2.71569 8.40973 2.40973 8.71569 2.21799 9.09202C2 9.51984 2 10.0799 2 11.2V18.8C2 19.9201 2 20.4802 2.21799 20.908C2.40973 21.2843 2.71569 21.5903 3.09202 21.782C3.51984 22 4.07989 22 5.2 22Z"stroke-width=2 stroke-linecap=round stroke-linejoin=round stroke=currentColor>',
    ),
    Dc = _(
        '<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M2.5 21.4998L8.04927 19.3655C8.40421 19.229 8.58168 19.1607 8.74772 19.0716C8.8952 18.9924 9.0358 18.901 9.16804 18.7984C9.31692 18.6829 9.45137 18.5484 9.72028 18.2795L21 6.99982C22.1046 5.89525 22.1046 4.10438 21 2.99981C19.8955 1.89525 18.1046 1.89524 17 2.99981L5.72028 14.2795C5.45138 14.5484 5.31692 14.6829 5.20139 14.8318C5.09877 14.964 5.0074 15.1046 4.92823 15.2521C4.83911 15.4181 4.77085 15.5956 4.63433 15.9506L2.5 21.4998ZM2.5 21.4998L4.55812 16.1488C4.7054 15.7659 4.77903 15.5744 4.90534 15.4867C5.01572 15.4101 5.1523 15.3811 5.2843 15.4063C5.43533 15.4351 5.58038 15.5802 5.87048 15.8703L8.12957 18.1294C8.41967 18.4195 8.56472 18.5645 8.59356 18.7155C8.61877 18.8475 8.58979 18.9841 8.51314 19.0945C8.42545 19.2208 8.23399 19.2944 7.85107 19.4417L2.5 21.4998Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    fs = _(
        '<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M7.5 12L10.5 15L16.5 9M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    Ac = _(
        '<svg width=24 height=24 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M9 9L15 15M15 9L9 15M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"stroke=#F04438 stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    Tc = _(
        '<svg width=24 height=24 viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2 xmlns=http://www.w3.org/2000/svg><rect class=list width=20 height=20 y=2 x=2 rx=2></rect><line class=list-item y1=7 y2=7 x1=6 x2=18></line><line class=list-item y2=12 y1=12 x1=6 x2=18></line><line class=list-item y1=17 y2=17 x1=6 x2=18>',
    ),
    Fc = _(
        '<svg viewBox="0 0 24 24"height=20 width=20 fill=none xmlns=http://www.w3.org/2000/svg><path d="M3 7.8c0-1.68 0-2.52.327-3.162a3 3 0 0 1 1.311-1.311C5.28 3 6.12 3 7.8 3h8.4c1.68 0 2.52 0 3.162.327a3 3 0 0 1 1.311 1.311C21 5.28 21 6.12 21 7.8v8.4c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C18.72 21 17.88 21 16.2 21H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C3 18.72 3 17.88 3 16.2V7.8Z"stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    Ic = _(
        '<svg width=14 height=14 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    Pc = _(
        '<svg width=14 height=14 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 19.0784L16.25 16.25M19.0784 4.99994L16.25 7.82837M4.92157 19.0784L7.75 16.25M4.92157 4.99994L7.75 7.82837"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round></path><animateTransform attributeName=transform attributeType=XML type=rotate from=0 to=360 dur=2s repeatCount=indefinite>',
    ),
    Lc = _(
        '<svg width=14 height=14 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    Oc = _(
        '<svg width=14 height=14 viewBox="0 0 24 24"fill=none xmlns=http://www.w3.org/2000/svg><path d="M9.5 15V9M14.5 15V9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    qc = _(
        '<svg version=1.0 viewBox="0 0 633 633"><linearGradient x1=-666.45 x2=-666.45 y1=163.28 y2=163.99 gradientTransform="matrix(633 0 0 633 422177 -103358)"gradientUnits=userSpaceOnUse><stop stop-color=#6BDAFF offset=0></stop><stop stop-color=#F9FFB5 offset=.32></stop><stop stop-color=#FFA770 offset=.71></stop><stop stop-color=#FF7373 offset=1></stop></linearGradient><circle cx=316.5 cy=316.5 r=316.5></circle><defs><filter x=-137.5 y=412 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=-137.5 y=412 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=89.5 cy=610.5 rx=214.5 ry=186 fill=#015064 stroke=#00CFE2 stroke-width=25></ellipse></g><defs><filter x=316.5 y=412 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=316.5 y=412 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=543.5 cy=610.5 rx=214.5 ry=186 fill=#015064 stroke=#00CFE2 stroke-width=25></ellipse></g><defs><filter x=-137.5 y=450 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=-137.5 y=450 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=89.5 cy=648.5 rx=214.5 ry=186 fill=#015064 stroke=#00A8B8 stroke-width=25></ellipse></g><defs><filter x=316.5 y=450 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=316.5 y=450 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=543.5 cy=648.5 rx=214.5 ry=186 fill=#015064 stroke=#00A8B8 stroke-width=25></ellipse></g><defs><filter x=-137.5 y=486 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=-137.5 y=486 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=89.5 cy=684.5 rx=214.5 ry=186 fill=#015064 stroke=#007782 stroke-width=25></ellipse></g><defs><filter x=316.5 y=486 width=454 height=396.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=316.5 y=486 width=454 height=396.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><ellipse cx=543.5 cy=684.5 rx=214.5 ry=186 fill=#015064 stroke=#007782 stroke-width=25></ellipse></g><defs><filter x=272.2 y=308 width=176.9 height=129.3 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=272.2 y=308 width=176.9 height=129.3 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><line x1=436 x2=431 y1=403.2 y2=431.8 fill=none stroke=#000 stroke-linecap=round stroke-linejoin=bevel stroke-width=11></line><line x1=291 x2=280 y1=341.5 y2=403.5 fill=none stroke=#000 stroke-linecap=round stroke-linejoin=bevel stroke-width=11></line><line x1=332.9 x2=328.6 y1=384.1 y2=411.2 fill=none stroke=#000 stroke-linecap=round stroke-linejoin=bevel stroke-width=11></line><linearGradient x1=-670.75 x2=-671.59 y1=164.4 y2=164.49 gradientTransform="matrix(-184.16 -32.472 -11.461 64.997 -121359 -32126)"gradientUnits=userSpaceOnUse><stop stop-color=#EE2700 offset=0></stop><stop stop-color=#FF008E offset=1></stop></linearGradient><path d="m344.1 363 97.7 17.2c5.8 2.1 8.2 6.1 7.1 12.1s-4.7 9.2-11 9.9l-106-18.7-57.5-59.2c-3.2-4.8-2.9-9.1 0.8-12.8s8.3-4.4 13.7-2.1l55.2 53.6z"clip-rule=evenodd fill-rule=evenodd></path><line x1=428.2 x2=429.1 y1=384.5 y2=378 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line><line x1=395.2 x2=396.1 y1=379.5 y2=373 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line><line x1=362.2 x2=363.1 y1=373.5 y2=367.4 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line><line x1=324.2 x2=328.4 y1=351.3 y2=347.4 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line><line x1=303.2 x2=307.4 y1=331.3 y2=327.4 fill=none stroke=#fff stroke-linecap=round stroke-linejoin=bevel stroke-width=7></line></g><defs><filter x=73.2 y=113.8 width=280.6 height=317.4 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=73.2 y=113.8 width=280.6 height=317.4 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><linearGradient x1=-672.16 x2=-672.16 y1=165.03 y2=166.03 gradientTransform="matrix(-100.18 48.861 97.976 200.88 -83342 -93.059)"gradientUnits=userSpaceOnUse><stop stop-color=#A17500 offset=0></stop><stop stop-color=#5D2100 offset=1></stop></linearGradient><path d="m192.3 203c8.1 37.3 14 73.6 17.8 109.1 3.8 35.4 2.8 75.1-3 119.2l61.2-16.7c-15.6-59-25.2-97.9-28.6-116.6s-10.8-51.9-22.1-99.6l-25.3 4.6"clip-rule=evenodd fill-rule=evenodd></path><g stroke=#2F8A00><linearGradient x1=-660.23 x2=-660.23 y1=166.72 y2=167.72 gradientTransform="matrix(92.683 4.8573 -2.0259 38.657 61680 -3088.6)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m195 183.9s-12.6-22.1-36.5-29.9c-15.9-5.2-34.4-1.5-55.5 11.1 15.9 14.3 29.5 22.6 40.7 24.9 16.8 3.6 51.3-6.1 51.3-6.1z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-661.36 x2=-661.36 y1=164.18 y2=165.18 gradientTransform="matrix(110 5.7648 -6.3599 121.35 73933 -15933)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m194.9 184.5s-47.5-8.5-83.2 15.7c-23.8 16.2-34.3 49.3-31.6 99.4 30.3-27.8 52.1-48.5 65.2-61.9 19.8-20.2 49.6-53.2 49.6-53.2z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-656.79 x2=-656.79 y1=165.15 y2=166.15 gradientTransform="matrix(62.954 3.2993 -3.5023 66.828 42156 -8754.1)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m195 183.9c-0.8-21.9 6-38 20.6-48.2s29.8-15.4 45.5-15.3c-6.1 21.4-14.5 35.8-25.2 43.4s-24.4 14.2-40.9 20.1z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-663.07 x2=-663.07 y1=165.44 y2=166.44 gradientTransform="matrix(152.47 7.9907 -3.0936 59.029 101884 -4318.7)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m194.9 184.5c31.9-30 64.1-39.7 96.7-29s50.8 30.4 54.6 59.1c-35.2-5.5-60.4-9.6-75.8-12.1-15.3-2.6-40.5-8.6-75.5-18z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-662.57 x2=-662.57 y1=164.44 y2=165.44 gradientTransform="matrix(136.46 7.1517 -5.2163 99.533 91536 -11442)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m194.9 184.5c35.8-7.6 65.6-0.2 89.2 22s37.7 49 42.3 80.3c-39.8-9.7-68.3-23.8-85.5-42.4s-32.5-38.5-46-59.9z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><linearGradient x1=-656.43 x2=-656.43 y1=163.86 y2=164.86 gradientTransform="matrix(60.866 3.1899 -8.7773 167.48 41560 -25168)"gradientUnits=userSpaceOnUse><stop stop-color=#2F8A00 offset=0></stop><stop stop-color=#90FF57 offset=1></stop></linearGradient><path d="m194.9 184.5c-33.6 13.8-53.6 35.7-60.1 65.6s-3.6 63.1 8.7 99.6c27.4-40.3 43.2-69.6 47.4-88s5.6-44.1 4-77.2z"clip-rule=evenodd fill-rule=evenodd stroke-width=13></path><path d="m196.5 182.3c-14.8 21.6-25.1 41.4-30.8 59.4s-9.5 33-11.1 45.1"fill=none stroke-linecap=round stroke-width=8></path><path d="m194.9 185.7c-24.4 1.7-43.8 9-58.1 21.8s-24.7 25.4-31.3 37.8"fill=none stroke-linecap=round stroke-width=8></path><path d="m204.5 176.4c29.7-6.7 52-8.4 67-5.1s26.9 8.6 35.8 15.9"fill=none stroke-linecap=round stroke-width=8></path><path d="m196.5 181.4c20.3 9.9 38.2 20.5 53.9 31.9s27.4 22.1 35.1 32"fill=none stroke-linecap=round stroke-width=8></path></g></g><defs><filter x=50.5 y=399 width=532 height=633 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=50.5 y=399 width=532 height=633 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><linearGradient x1=-666.06 x2=-666.23 y1=163.36 y2=163.75 gradientTransform="matrix(532 0 0 633 354760 -102959)"gradientUnits=userSpaceOnUse><stop stop-color=#FFF400 offset=0></stop><stop stop-color=#3C8700 offset=1></stop></linearGradient><ellipse cx=316.5 cy=715.5 rx=266 ry=316.5></ellipse></g><defs><filter x=391 y=-24 width=288 height=283 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"></feColorMatrix></filter></defs><mask x=391 y=-24 width=288 height=283 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#fff></circle></g></mask><g><linearGradient x1=-664.56 x2=-664.56 y1=163.79 y2=164.79 gradientTransform="matrix(227 0 0 227 151421 -37204)"gradientUnits=userSpaceOnUse><stop stop-color=#FFDF00 offset=0></stop><stop stop-color=#FF9D00 offset=1></stop></linearGradient><circle cx=565.5 cy=89.5 r=113.5></circle><linearGradient x1=-644.5 x2=-645.77 y1=342 y2=342 gradientTransform="matrix(30 0 0 1 19770 -253)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=427 x2=397 y1=89 y2=89 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-641.56 x2=-642.83 y1=196.02 y2=196.07 gradientTransform="matrix(26.5 0 0 5.5 17439 -1025.5)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=430.5 x2=404 y1=55.5 y2=50 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-643.73 x2=-645 y1=185.83 y2=185.9 gradientTransform="matrix(29 0 0 8 19107 -1361)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=431 x2=402 y1=122 y2=130 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-638.94 x2=-640.22 y1=177.09 y2=177.39 gradientTransform="matrix(24 0 0 13 15783 -2145)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=442 x2=418 y1=153 y2=166 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-633.42 x2=-634.7 y1=172.41 y2=173.31 gradientTransform="matrix(20 0 0 19 13137 -3096)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=464 x2=444 y1=180 y2=199 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-619.05 x2=-619.52 y1=170.82 y2=171.82 gradientTransform="matrix(13.83 0 0 22.85 9050 -3703.4)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=491.4 x2=477.5 y1=203 y2=225.9 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=-578.5 x2=-578.63 y1=170.31 y2=171.31 gradientTransform="matrix(7.5 0 0 24.5 4860 -3953)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=524.5 x2=517 y1=219.5 y2=244 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12></line><linearGradient x1=666.5 x2=666.5 y1=170.31 y2=171.31 gradientTransform="matrix(.5 0 0 24.5 231.5 -3944)"gradientUnits=userSpaceOnUse><stop stop-color=#FFA400 offset=0></stop><stop stop-color=#FF5E00 offset=1></stop></linearGradient><line x1=564.5 x2=565 y1=228.5 y2=253 fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12>',
    );
function _c() {
    return mc();
}
function gs() {
    return yc();
}
function Kt() {
    return pc();
}
function Fo() {
    return bc();
}
function Io() {
    return Dr();
}
function Rc() {
    return (() => {
        var e = Dr();
        return (e.style.setProperty('transform', 'rotate(90deg)'), e);
    })();
}
function zc() {
    return (() => {
        var e = Dr();
        return (e.style.setProperty('transform', 'rotate(-90deg)'), e);
    })();
}
function Kc() {
    return xc();
}
function Bc() {
    return wc();
}
function Nc() {
    return $c();
}
function Hc() {
    return Cc();
}
function Gc() {
    return Sc();
}
function Uc() {
    return kc();
}
function Vc() {
    return Ec();
}
function jc() {
    return Mc();
}
function Wc() {
    return Dc();
}
function Qc(e) {
    return (() => {
        var t = fs(),
            n = t.firstChild;
        return (G(() => A(n, 'stroke', e.theme === 'dark' ? '#12B76A' : '#027A48')), t);
    })();
}
function Yc() {
    return Ac();
}
function Xc() {
    return Tc();
}
function Zc(e) {
    return [
        m(R, {
            get when() {
                return e.checked;
            },
            get children() {
                var t = fs(),
                    n = t.firstChild;
                return (G(() => A(n, 'stroke', e.theme === 'dark' ? '#9B8AFB' : '#6938EF')), t);
            },
        }),
        m(R, {
            get when() {
                return !e.checked;
            },
            get children() {
                var t = Fc(),
                    n = t.firstChild;
                return (G(() => A(n, 'stroke', e.theme === 'dark' ? '#9B8AFB' : '#6938EF')), t);
            },
        }),
    ];
}
function ar() {
    return Ic();
}
function Jc() {
    return Pc();
}
function ed() {
    return Lc();
}
function td() {
    return Oc();
}
function Po() {
    const e = Oe();
    return (() => {
        var t = qc(),
            n = t.firstChild,
            r = n.nextSibling,
            o = r.nextSibling,
            s = o.firstChild,
            a = o.nextSibling,
            l = a.firstChild,
            i = a.nextSibling,
            u = i.nextSibling,
            g = u.firstChild,
            c = u.nextSibling,
            d = c.firstChild,
            f = c.nextSibling,
            h = f.nextSibling,
            p = h.firstChild,
            v = h.nextSibling,
            y = v.firstChild,
            x = v.nextSibling,
            b = x.nextSibling,
            w = b.firstChild,
            $ = b.nextSibling,
            L = $.firstChild,
            D = $.nextSibling,
            T = D.nextSibling,
            k = T.firstChild,
            F = T.nextSibling,
            N = F.firstChild,
            H = F.nextSibling,
            ne = H.nextSibling,
            ee = ne.firstChild,
            le = ne.nextSibling,
            ie = le.firstChild,
            re = le.nextSibling,
            se = re.nextSibling,
            ue = se.firstChild,
            me = se.nextSibling,
            Ae = me.firstChild,
            he = me.nextSibling,
            Ee = he.firstChild,
            M = Ee.nextSibling,
            ge = M.nextSibling,
            Y = ge.nextSibling,
            vt = Y.nextSibling,
            V = he.nextSibling,
            Ne = V.firstChild,
            Ce = V.nextSibling,
            It = Ce.firstChild,
            qe = Ce.nextSibling,
            mt = qe.firstChild,
            kt = mt.nextSibling,
            tt = kt.nextSibling,
            Qe = tt.firstChild,
            nt = Qe.nextSibling,
            P = nt.nextSibling,
            oe = P.nextSibling,
            Me = oe.nextSibling,
            ae = Me.nextSibling,
            te = ae.nextSibling,
            ce = te.nextSibling,
            ye = ce.nextSibling,
            X = ye.nextSibling,
            rt = X.nextSibling,
            ot = rt.nextSibling,
            He = qe.nextSibling,
            Et = He.firstChild,
            it = He.nextSibling,
            Mt = it.firstChild,
            st = it.nextSibling,
            yt = st.firstChild,
            mn = yt.nextSibling,
            Qt = st.nextSibling,
            yn = Qt.firstChild,
            Pt = Qt.nextSibling,
            pn = Pt.firstChild,
            Yt = Pt.nextSibling,
            Xt = Yt.firstChild,
            Zt = Xt.nextSibling,
            Lt = Zt.nextSibling,
            Ar = Lt.nextSibling,
            Tr = Ar.nextSibling,
            Fr = Tr.nextSibling,
            Ir = Fr.nextSibling,
            Pr = Ir.nextSibling,
            Lr = Pr.nextSibling,
            Or = Lr.nextSibling,
            qr = Or.nextSibling,
            _r = qr.nextSibling,
            Rr = _r.nextSibling,
            zr = Rr.nextSibling,
            Kr = zr.nextSibling,
            Br = Kr.nextSibling,
            Nr = Br.nextSibling,
            xs = Nr.nextSibling;
        return (
            A(n, 'id', `a-${e}`),
            A(r, 'fill', `url(#a-${e})`),
            A(s, 'id', `am-${e}`),
            A(a, 'id', `b-${e}`),
            A(l, 'filter', `url(#am-${e})`),
            A(i, 'mask', `url(#b-${e})`),
            A(g, 'id', `ah-${e}`),
            A(c, 'id', `k-${e}`),
            A(d, 'filter', `url(#ah-${e})`),
            A(f, 'mask', `url(#k-${e})`),
            A(p, 'id', `ae-${e}`),
            A(v, 'id', `j-${e}`),
            A(y, 'filter', `url(#ae-${e})`),
            A(x, 'mask', `url(#j-${e})`),
            A(w, 'id', `ai-${e}`),
            A($, 'id', `i-${e}`),
            A(L, 'filter', `url(#ai-${e})`),
            A(D, 'mask', `url(#i-${e})`),
            A(k, 'id', `aj-${e}`),
            A(F, 'id', `h-${e}`),
            A(N, 'filter', `url(#aj-${e})`),
            A(H, 'mask', `url(#h-${e})`),
            A(ee, 'id', `ag-${e}`),
            A(le, 'id', `g-${e}`),
            A(ie, 'filter', `url(#ag-${e})`),
            A(re, 'mask', `url(#g-${e})`),
            A(ue, 'id', `af-${e}`),
            A(me, 'id', `f-${e}`),
            A(Ae, 'filter', `url(#af-${e})`),
            A(he, 'mask', `url(#f-${e})`),
            A(Y, 'id', `m-${e}`),
            A(vt, 'fill', `url(#m-${e})`),
            A(Ne, 'id', `ak-${e}`),
            A(Ce, 'id', `e-${e}`),
            A(It, 'filter', `url(#ak-${e})`),
            A(qe, 'mask', `url(#e-${e})`),
            A(mt, 'id', `n-${e}`),
            A(kt, 'fill', `url(#n-${e})`),
            A(Qe, 'id', `r-${e}`),
            A(nt, 'fill', `url(#r-${e})`),
            A(P, 'id', `s-${e}`),
            A(oe, 'fill', `url(#s-${e})`),
            A(Me, 'id', `q-${e}`),
            A(ae, 'fill', `url(#q-${e})`),
            A(te, 'id', `p-${e}`),
            A(ce, 'fill', `url(#p-${e})`),
            A(ye, 'id', `o-${e}`),
            A(X, 'fill', `url(#o-${e})`),
            A(rt, 'id', `l-${e}`),
            A(ot, 'fill', `url(#l-${e})`),
            A(Et, 'id', `al-${e}`),
            A(it, 'id', `d-${e}`),
            A(Mt, 'filter', `url(#al-${e})`),
            A(st, 'mask', `url(#d-${e})`),
            A(yt, 'id', `u-${e}`),
            A(mn, 'fill', `url(#u-${e})`),
            A(yn, 'id', `ad-${e}`),
            A(Pt, 'id', `c-${e}`),
            A(pn, 'filter', `url(#ad-${e})`),
            A(Yt, 'mask', `url(#c-${e})`),
            A(Xt, 'id', `t-${e}`),
            A(Zt, 'fill', `url(#t-${e})`),
            A(Lt, 'id', `v-${e}`),
            A(Ar, 'stroke', `url(#v-${e})`),
            A(Tr, 'id', `aa-${e}`),
            A(Fr, 'stroke', `url(#aa-${e})`),
            A(Ir, 'id', `w-${e}`),
            A(Pr, 'stroke', `url(#w-${e})`),
            A(Lr, 'id', `ac-${e}`),
            A(Or, 'stroke', `url(#ac-${e})`),
            A(qr, 'id', `ab-${e}`),
            A(_r, 'stroke', `url(#ab-${e})`),
            A(Rr, 'id', `y-${e}`),
            A(zr, 'stroke', `url(#y-${e})`),
            A(Kr, 'id', `x-${e}`),
            A(Br, 'stroke', `url(#x-${e})`),
            A(Nr, 'id', `z-${e}`),
            A(xs, 'stroke', `url(#z-${e})`),
            t
        );
    })();
}
var nd = _(
        '<span><svg width=16 height=16 viewBox="0 0 16 16"fill=none xmlns=http://www.w3.org/2000/svg><path d="M6 12L10 8L6 4"stroke-width=2 stroke-linecap=round stroke-linejoin=round>',
    ),
    rd = _('<button title="Copy object to clipboard">'),
    od = _('<button title="Remove all items"aria-label="Remove all items">'),
    id = _('<button title="Delete item"aria-label="Delete item">'),
    sd = _('<button title="Toggle value"aria-label="Toggle value">'),
    ad = _('<button title="Bulk Edit Data"aria-label="Bulk Edit Data">'),
    tn = _('<div>'),
    ld = _('<div><button> <span></span> <span> '),
    ud = _('<input>'),
    Lo = _('<span>'),
    cd = _('<div><label>:'),
    dd = _('<div><div><button> [<!>...<!>]');
function fd(e, t) {
    let n = 0;
    const r = [];
    for (; n < e.length; ) (r.push(e.slice(n, n + t)), (n = n + t));
    return r;
}
var Oo = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? Wt(n) : jt(n)));
        return (() => {
            var o = nd();
            return (
                G(() =>
                    I(
                        o,
                        O(
                            r().expander,
                            n`
          transform: rotate(${e.expanded ? 90 : 0}deg);
        `,
                            e.expanded &&
                                n`
            & svg {
              top: -1px;
            }
          `,
                        ),
                    ),
                ),
                o
            );
        })();
    },
    gd = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? Wt(n) : jt(n))),
            [o, s] = z('NoCopy');
        return (() => {
            var a = rd();
            return (
                Fs(
                    a,
                    'click',
                    o() === 'NoCopy'
                        ? () => {
                              navigator.clipboard.writeText(Is(e.value)).then(
                                  () => {
                                      (s('SuccessCopy'),
                                          setTimeout(() => {
                                              s('NoCopy');
                                          }, 1500));
                                  },
                                  (l) => {
                                      (console.error('Failed to copy: ', l),
                                          s('ErrorCopy'),
                                          setTimeout(() => {
                                              s('NoCopy');
                                          }, 1500));
                                  },
                              );
                          }
                        : void 0,
                    !0,
                ),
                S(
                    a,
                    m(Ps, {
                        get children() {
                            return [
                                m(Nn, {
                                    get when() {
                                        return o() === 'NoCopy';
                                    },
                                    get children() {
                                        return m(jc, {});
                                    },
                                }),
                                m(Nn, {
                                    get when() {
                                        return o() === 'SuccessCopy';
                                    },
                                    get children() {
                                        return m(Qc, {
                                            get theme() {
                                                return t();
                                            },
                                        });
                                    },
                                }),
                                m(Nn, {
                                    get when() {
                                        return o() === 'ErrorCopy';
                                    },
                                    get children() {
                                        return m(Yc, {});
                                    },
                                }),
                            ];
                        },
                    }),
                ),
                G(
                    (l) => {
                        var i = r().actionButton,
                            u = `${o() === 'NoCopy' ? 'Copy object to clipboard' : o() === 'SuccessCopy' ? 'Object copied to clipboard' : 'Error copying object to clipboard'}`;
                        return (
                            i !== l.e && I(a, (l.e = i)),
                            u !== l.t && A(a, 'aria-label', (l.t = u)),
                            l
                        );
                    },
                    { e: void 0, t: void 0 },
                ),
                a
            );
        })();
    },
    hd = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? Wt(n) : jt(n))),
            o = K().client;
        return (() => {
            var s = od();
            return (
                (s.$$click = () => {
                    const a = e.activeQuery.state.data,
                        l = ur(a, e.dataPath, []);
                    o.setQueryData(e.activeQuery.queryKey, l);
                }),
                S(s, m(Xc, {})),
                G(() => I(s, r().actionButton)),
                s
            );
        })();
    },
    qo = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? Wt(n) : jt(n))),
            o = K().client;
        return (() => {
            var s = id();
            return (
                (s.$$click = () => {
                    const a = e.activeQuery.state.data,
                        l = Ls(a, e.dataPath);
                    o.setQueryData(e.activeQuery.queryKey, l);
                }),
                S(s, m(gs, {})),
                G(() => I(s, O(r().actionButton))),
                s
            );
        })();
    },
    vd = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? Wt(n) : jt(n))),
            o = K().client;
        return (() => {
            var s = sd();
            return (
                (s.$$click = () => {
                    const a = e.activeQuery.state.data,
                        l = ur(a, e.dataPath, !e.value);
                    o.setQueryData(e.activeQuery.queryKey, l);
                }),
                S(
                    s,
                    m(Zc, {
                        get theme() {
                            return t();
                        },
                        get checked() {
                            return e.value;
                        },
                    }),
                ),
                G(() =>
                    I(
                        s,
                        O(
                            r().actionButton,
                            n`
          width: ${C.size[3.5]};
          height: ${C.size[3.5]};
        `,
                        ),
                    ),
                ),
                s
            );
        })();
    };
function _o(e) {
    return Symbol.iterator in e;
}
function pt(e) {
    const t = $e(),
        n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
        r = q(() => (t() === 'dark' ? Wt(n) : jt(n))),
        o = K().client,
        [s, a] = z((e.defaultExpanded || []).includes(e.label)),
        l = () => a((p) => !p),
        [i, u] = z([]),
        g = q(() =>
            Array.isArray(e.value)
                ? e.value.map((p, v) => ({ label: v.toString(), value: p }))
                : e.value !== null &&
                    typeof e.value == 'object' &&
                    _o(e.value) &&
                    typeof e.value[Symbol.iterator] == 'function'
                  ? e.value instanceof Map
                      ? Array.from(e.value, ([p, v]) => ({ label: p, value: v }))
                      : Array.from(e.value, (p, v) => ({ label: v.toString(), value: p }))
                  : typeof e.value == 'object' && e.value !== null
                    ? Object.entries(e.value).map(([p, v]) => ({ label: p, value: v }))
                    : [],
        ),
        c = q(() =>
            Array.isArray(e.value)
                ? 'array'
                : e.value !== null &&
                    typeof e.value == 'object' &&
                    _o(e.value) &&
                    typeof e.value[Symbol.iterator] == 'function'
                  ? 'Iterable'
                  : typeof e.value == 'object' && e.value !== null
                    ? 'object'
                    : typeof e.value,
        ),
        d = q(() => fd(g(), 100)),
        f = e.dataPath ?? [],
        h = Oe();
    return (() => {
        var p = tn();
        return (
            S(
                p,
                m(R, {
                    get when() {
                        return d().length;
                    },
                    get children() {
                        return [
                            (() => {
                                var v = ld(),
                                    y = v.firstChild,
                                    x = y.firstChild,
                                    b = x.nextSibling,
                                    w = b.nextSibling,
                                    $ = w.nextSibling,
                                    L = $.firstChild;
                                return (
                                    (y.$$click = () => l()),
                                    S(
                                        y,
                                        m(Oo, {
                                            get expanded() {
                                                return s();
                                            },
                                        }),
                                        x,
                                    ),
                                    S(b, () => e.label),
                                    S(
                                        $,
                                        () =>
                                            String(c()).toLowerCase() === 'iterable'
                                                ? '(Iterable) '
                                                : '',
                                        L,
                                    ),
                                    S($, () => g().length, L),
                                    S($, () => (g().length > 1 ? 'items' : 'item'), null),
                                    S(
                                        v,
                                        m(R, {
                                            get when() {
                                                return e.editable;
                                            },
                                            get children() {
                                                var D = tn();
                                                return (
                                                    S(
                                                        D,
                                                        m(gd, {
                                                            get value() {
                                                                return e.value;
                                                            },
                                                        }),
                                                        null,
                                                    ),
                                                    S(
                                                        D,
                                                        m(R, {
                                                            get when() {
                                                                return (
                                                                    e.itemsDeletable &&
                                                                    e.activeQuery !== void 0
                                                                );
                                                            },
                                                            get children() {
                                                                return m(qo, {
                                                                    get activeQuery() {
                                                                        return e.activeQuery;
                                                                    },
                                                                    dataPath: f,
                                                                });
                                                            },
                                                        }),
                                                        null,
                                                    ),
                                                    S(
                                                        D,
                                                        m(R, {
                                                            get when() {
                                                                return (
                                                                    c() === 'array' &&
                                                                    e.activeQuery !== void 0
                                                                );
                                                            },
                                                            get children() {
                                                                return m(hd, {
                                                                    get activeQuery() {
                                                                        return e.activeQuery;
                                                                    },
                                                                    dataPath: f,
                                                                });
                                                            },
                                                        }),
                                                        null,
                                                    ),
                                                    S(
                                                        D,
                                                        m(R, {
                                                            get when() {
                                                                return (
                                                                    ve(() => !!e.onEdit)() &&
                                                                    !As(e.value).meta
                                                                );
                                                            },
                                                            get children() {
                                                                var T = ad();
                                                                return (
                                                                    (T.$$click = () => {
                                                                        e.onEdit?.();
                                                                    }),
                                                                    S(T, m(Wc, {})),
                                                                    G(() => I(T, r().actionButton)),
                                                                    T
                                                                );
                                                            },
                                                        }),
                                                        null,
                                                    ),
                                                    G(() => I(D, r().actions)),
                                                    D
                                                );
                                            },
                                        }),
                                        null,
                                    ),
                                    G(
                                        (D) => {
                                            var T = r().expanderButtonContainer,
                                                k = r().expanderButton,
                                                F = s() ? 'true' : 'false',
                                                N = r().info;
                                            return (
                                                T !== D.e && I(v, (D.e = T)),
                                                k !== D.t && I(y, (D.t = k)),
                                                F !== D.a && A(y, 'aria-expanded', (D.a = F)),
                                                N !== D.o && I($, (D.o = N)),
                                                D
                                            );
                                        },
                                        { e: void 0, t: void 0, a: void 0, o: void 0 },
                                    ),
                                    v
                                );
                            })(),
                            m(R, {
                                get when() {
                                    return s();
                                },
                                get children() {
                                    return [
                                        m(R, {
                                            get when() {
                                                return d().length === 1;
                                            },
                                            get children() {
                                                var v = tn();
                                                return (
                                                    S(
                                                        v,
                                                        m(kn, {
                                                            get each() {
                                                                return g();
                                                            },
                                                            by: (y) => y.label,
                                                            children: (y) =>
                                                                m(pt, {
                                                                    get defaultExpanded() {
                                                                        return e.defaultExpanded;
                                                                    },
                                                                    get label() {
                                                                        return y().label;
                                                                    },
                                                                    get value() {
                                                                        return y().value;
                                                                    },
                                                                    get editable() {
                                                                        return e.editable;
                                                                    },
                                                                    get dataPath() {
                                                                        return [...f, y().label];
                                                                    },
                                                                    get activeQuery() {
                                                                        return e.activeQuery;
                                                                    },
                                                                    get itemsDeletable() {
                                                                        return (
                                                                            c() === 'array' ||
                                                                            c() === 'Iterable' ||
                                                                            c() === 'object'
                                                                        );
                                                                    },
                                                                }),
                                                        }),
                                                    ),
                                                    G(() => I(v, r().subEntry)),
                                                    v
                                                );
                                            },
                                        }),
                                        m(R, {
                                            get when() {
                                                return d().length > 1;
                                            },
                                            get children() {
                                                var v = tn();
                                                return (
                                                    S(
                                                        v,
                                                        m(Ts, {
                                                            get each() {
                                                                return d();
                                                            },
                                                            children: (y, x) =>
                                                                (() => {
                                                                    var b = dd(),
                                                                        w = b.firstChild,
                                                                        $ = w.firstChild,
                                                                        L = $.firstChild,
                                                                        D = L.nextSibling,
                                                                        T = D.nextSibling,
                                                                        k = T.nextSibling;
                                                                    return (
                                                                        k.nextSibling,
                                                                        ($.$$click = () =>
                                                                            u((F) =>
                                                                                F.includes(x)
                                                                                    ? F.filter(
                                                                                          (N) =>
                                                                                              N !==
                                                                                              x,
                                                                                      )
                                                                                    : [...F, x],
                                                                            )),
                                                                        S(
                                                                            $,
                                                                            m(Oo, {
                                                                                get expanded() {
                                                                                    return i().includes(
                                                                                        x,
                                                                                    );
                                                                                },
                                                                            }),
                                                                            L,
                                                                        ),
                                                                        S($, x * 100, D),
                                                                        S($, x * 100 + 100 - 1, k),
                                                                        S(
                                                                            w,
                                                                            m(R, {
                                                                                get when() {
                                                                                    return i().includes(
                                                                                        x,
                                                                                    );
                                                                                },
                                                                                get children() {
                                                                                    var F = tn();
                                                                                    return (
                                                                                        S(
                                                                                            F,
                                                                                            m(kn, {
                                                                                                get each() {
                                                                                                    return y();
                                                                                                },
                                                                                                by: (
                                                                                                    N,
                                                                                                ) =>
                                                                                                    N.label,
                                                                                                children:
                                                                                                    (
                                                                                                        N,
                                                                                                    ) =>
                                                                                                        m(
                                                                                                            pt,
                                                                                                            {
                                                                                                                get defaultExpanded() {
                                                                                                                    return e.defaultExpanded;
                                                                                                                },
                                                                                                                get label() {
                                                                                                                    return N()
                                                                                                                        .label;
                                                                                                                },
                                                                                                                get value() {
                                                                                                                    return N()
                                                                                                                        .value;
                                                                                                                },
                                                                                                                get editable() {
                                                                                                                    return e.editable;
                                                                                                                },
                                                                                                                get dataPath() {
                                                                                                                    return [
                                                                                                                        ...f,
                                                                                                                        N()
                                                                                                                            .label,
                                                                                                                    ];
                                                                                                                },
                                                                                                                get activeQuery() {
                                                                                                                    return e.activeQuery;
                                                                                                                },
                                                                                                            },
                                                                                                        ),
                                                                                            }),
                                                                                        ),
                                                                                        G(() =>
                                                                                            I(
                                                                                                F,
                                                                                                r()
                                                                                                    .subEntry,
                                                                                            ),
                                                                                        ),
                                                                                        F
                                                                                    );
                                                                                },
                                                                            }),
                                                                            null,
                                                                        ),
                                                                        G(
                                                                            (F) => {
                                                                                var N = r().entry,
                                                                                    H =
                                                                                        r()
                                                                                            .expanderButton;
                                                                                return (
                                                                                    N !== F.e &&
                                                                                        I(
                                                                                            w,
                                                                                            (F.e =
                                                                                                N),
                                                                                        ),
                                                                                    H !== F.t &&
                                                                                        I(
                                                                                            $,
                                                                                            (F.t =
                                                                                                H),
                                                                                        ),
                                                                                    F
                                                                                );
                                                                            },
                                                                            {
                                                                                e: void 0,
                                                                                t: void 0,
                                                                            },
                                                                        ),
                                                                        b
                                                                    );
                                                                })(),
                                                        }),
                                                    ),
                                                    G(() => I(v, r().subEntry)),
                                                    v
                                                );
                                            },
                                        }),
                                    ];
                                },
                            }),
                        ];
                    },
                }),
                null,
            ),
            S(
                p,
                m(R, {
                    get when() {
                        return d().length === 0;
                    },
                    get children() {
                        var v = cd(),
                            y = v.firstChild,
                            x = y.firstChild;
                        return (
                            A(y, 'for', h),
                            S(y, () => e.label, x),
                            S(
                                v,
                                m(R, {
                                    get when() {
                                        return (
                                            ve(
                                                () => !!(e.editable && e.activeQuery !== void 0),
                                            )() &&
                                            (c() === 'string' ||
                                                c() === 'number' ||
                                                c() === 'boolean')
                                        );
                                    },
                                    get fallback() {
                                        return (() => {
                                            var b = Lo();
                                            return (
                                                S(b, () => Sn(e.value)),
                                                G(() => I(b, r().value)),
                                                b
                                            );
                                        })();
                                    },
                                    get children() {
                                        return [
                                            m(R, {
                                                get when() {
                                                    return (
                                                        ve(
                                                            () =>
                                                                !!(
                                                                    e.editable &&
                                                                    e.activeQuery !== void 0
                                                                ),
                                                        )() &&
                                                        (c() === 'string' || c() === 'number')
                                                    );
                                                },
                                                get children() {
                                                    var b = ud();
                                                    return (
                                                        b.addEventListener('change', (w) => {
                                                            const $ = e.activeQuery.state.data,
                                                                L = ur(
                                                                    $,
                                                                    f,
                                                                    c() === 'number'
                                                                        ? w.target.valueAsNumber
                                                                        : w.target.value,
                                                                );
                                                            o.setQueryData(
                                                                e.activeQuery.queryKey,
                                                                L,
                                                            );
                                                        }),
                                                        A(b, 'id', h),
                                                        G(
                                                            (w) => {
                                                                var $ =
                                                                        c() === 'number'
                                                                            ? 'number'
                                                                            : 'text',
                                                                    L = O(
                                                                        r().value,
                                                                        r().editableInput,
                                                                    );
                                                                return (
                                                                    $ !== w.e &&
                                                                        A(b, 'type', (w.e = $)),
                                                                    L !== w.t && I(b, (w.t = L)),
                                                                    w
                                                                );
                                                            },
                                                            { e: void 0, t: void 0 },
                                                        ),
                                                        G(() => (b.value = e.value)),
                                                        b
                                                    );
                                                },
                                            }),
                                            m(R, {
                                                get when() {
                                                    return c() === 'boolean';
                                                },
                                                get children() {
                                                    var b = Lo();
                                                    return (
                                                        S(
                                                            b,
                                                            m(vd, {
                                                                get activeQuery() {
                                                                    return e.activeQuery;
                                                                },
                                                                dataPath: f,
                                                                get value() {
                                                                    return e.value;
                                                                },
                                                            }),
                                                            null,
                                                        ),
                                                        S(b, () => Sn(e.value), null),
                                                        G(() =>
                                                            I(
                                                                b,
                                                                O(
                                                                    r().value,
                                                                    r().actions,
                                                                    r().editableInput,
                                                                ),
                                                            ),
                                                        ),
                                                        b
                                                    );
                                                },
                                            }),
                                        ];
                                    },
                                }),
                                null,
                            ),
                            S(
                                v,
                                m(R, {
                                    get when() {
                                        return (
                                            e.editable &&
                                            e.itemsDeletable &&
                                            e.activeQuery !== void 0
                                        );
                                    },
                                    get children() {
                                        return m(qo, {
                                            get activeQuery() {
                                                return e.activeQuery;
                                            },
                                            dataPath: f,
                                        });
                                    },
                                }),
                                null,
                            ),
                            G(
                                (b) => {
                                    var w = r().row,
                                        $ = r().label;
                                    return (
                                        w !== b.e && I(v, (b.e = w)),
                                        $ !== b.t && I(y, (b.t = $)),
                                        b
                                    );
                                },
                                { e: void 0, t: void 0 },
                            ),
                            v
                        );
                    },
                }),
                null,
            ),
            G(() => I(p, r().entry)),
            p
        );
    })();
}
var hs = (e, t) => {
        const { colors: n, font: r, size: o, border: s } = C,
            a = (l, i) => (e === 'light' ? l : i);
        return {
            entry: t`
      & * {
        font-size: ${r.size.xs};
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
      }
      position: relative;
      outline: none;
      word-break: break-word;
    `,
            subEntry: t`
      margin: 0 0 0 0.5em;
      padding-left: 0.75em;
      border-left: 2px solid ${a(n.gray[300], n.darkGray[400])};
      /* outline: 1px solid ${n.teal[400]}; */
    `,
            expander: t`
      & path {
        stroke: ${n.gray[400]};
      }
      & svg {
        width: ${o[3]};
        height: ${o[3]};
      }
      display: inline-flex;
      align-items: center;
      transition: all 0.1s ease;
      /* outline: 1px solid ${n.blue[400]}; */
    `,
            expanderButtonContainer: t`
      display: flex;
      align-items: center;
      line-height: ${o[4]};
      min-height: ${o[4]};
      gap: ${o[2]};
    `,
            expanderButton: t`
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      height: ${o[5]};
      background: transparent;
      border: none;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: ${o[1]};
      position: relative;
      /* outline: 1px solid ${n.green[400]}; */

      &:focus-visible {
        border-radius: ${s.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }

      & svg {
        position: relative;
        left: 1px;
      }
    `,
            info: t`
      color: ${a(n.gray[500], n.gray[500])};
      font-size: ${r.size.xs};
      margin-left: ${o[1]};
      /* outline: 1px solid ${n.yellow[400]}; */
    `,
            label: t`
      color: ${a(n.gray[700], n.gray[300])};
      white-space: nowrap;
    `,
            value: t`
      color: ${a(n.purple[600], n.purple[400])};
      flex-grow: 1;
    `,
            actions: t`
      display: inline-flex;
      gap: ${o[2]};
      align-items: center;
    `,
            row: t`
      display: inline-flex;
      gap: ${o[2]};
      width: 100%;
      margin: ${o[0.25]} 0px;
      line-height: ${o[4.5]};
      align-items: center;
    `,
            editableInput: t`
      border: none;
      padding: ${o[0.5]} ${o[1]} ${o[0.5]} ${o[1.5]};
      flex-grow: 1;
      border-radius: ${s.radius.xs};
      background-color: ${a(n.gray[200], n.darkGray[500])};

      &:hover {
        background-color: ${a(n.gray[300], n.darkGray[600])};
      }
    `,
            actionButton: t`
      background-color: transparent;
      color: ${a(n.gray[500], n.gray[500])};
      border: none;
      display: inline-flex;
      padding: 0px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      width: ${o[3]};
      height: ${o[3]};
      position: relative;
      z-index: 1;

      &:hover svg {
        color: ${a(n.gray[600], n.gray[400])};
      }

      &:focus-visible {
        border-radius: ${s.radius.xs};
        outline: 2px solid ${n.blue[800]};
        outline-offset: 2px;
      }
    `,
        };
    },
    jt = (e) => hs('light', e),
    Wt = (e) => hs('dark', e);
lr(['click']);
var md = _(
        '<div><div aria-hidden=true></div><button type=button aria-label="Open Tanstack query devtools"class=tsqd-open-btn>',
    ),
    Kn = _('<div>'),
    yd = _(
        '<aside aria-label="Tanstack query devtools"><div role=separator aria-label="Resize devtools panel"tabindex=0></div><button aria-label="Close tanstack query devtools">',
    ),
    pd = _('<select name=tsqd-queries-filter-sort aria-label="Sort queries by">'),
    bd = _('<select name=tsqd-mutations-filter-sort aria-label="Sort mutations by">'),
    xd = _('<span>Asc'),
    wd = _('<span>Desc'),
    $d = _(
        '<button aria-label="Open in picture-in-picture mode"title="Open in picture-in-picture mode">',
    ),
    Cd = _('<div>Settings'),
    Sd = _('<span>Position'),
    kd = _('<span>Top'),
    Ed = _('<span>Bottom'),
    Md = _('<span>Left'),
    Dd = _('<span>Right'),
    Ad = _('<span>Theme'),
    Td = _('<span>Light'),
    Fd = _('<span>Dark'),
    Id = _('<span>System'),
    Pd = _('<span>Disabled Queries'),
    Ld = _('<span>Show'),
    Od = _('<span>Hide'),
    qd = _('<div><div class=tsqd-queries-container>'),
    _d = _('<div><div class=tsqd-mutations-container>'),
    Rd = _(
        '<div><div><div><button aria-label="Close Tanstack query devtools"><span>TANSTACK</span><span> v</span></button></div></div><div><div><div><input aria-label="Filter queries by query key"type=text placeholder=Filter name=tsqd-query-filter-input></div><div></div><button class=tsqd-query-filter-sort-order-btn></button></div><div><button aria-label="Clear query cache"></button><button>',
    ),
    Ro = _('<option>Sort by '),
    zd = _('<div class=tsqd-query-disabled-indicator aria-hidden=true>disabled'),
    Kd = _('<div class=tsqd-query-static-indicator aria-hidden=true>static'),
    vs = _('<button><div></div><code class=tsqd-query-hash>'),
    Bd = _('<div role=tooltip id=tsqd-status-tooltip>'),
    Nd = _('<span>'),
    Hd = _('<button><span aria-hidden=true></span><span>'),
    Gd = _('<button><span aria-hidden=true></span> Error'),
    Ud = _(
        '<div><span aria-hidden=true></span>Trigger Error<select aria-label="Select error type to trigger"><option value=""disabled selected>',
    ),
    Vd = _('<div class="tsqd-query-details-explorer-container tsqd-query-details-data-explorer">'),
    jd = _(
        '<form><textarea name=data aria-label="Edit query data as JSON"></textarea><div><span></span><div><button type=button>Cancel</button><button>Save',
    ),
    Wd = _(
        '<div><div role=heading aria-level=2>Query Details</div><div><div class=tsqd-query-details-summary><pre><code></code></pre><span role=status aria-live=polite></span></div><div class=tsqd-query-details-observers-count><span>Observers:</span><span></span></div><div class=tsqd-query-details-last-updated><span>Last Updated:</span><span></span></div></div><div role=heading aria-level=2>Actions</div><div><button><span aria-hidden=true></span>Refetch</button><button><span aria-hidden=true></span>Invalidate</button><button><span aria-hidden=true></span>Reset</button><button><span aria-hidden=true></span>Remove</button><button><span aria-hidden=true></span> Loading</button></div><div role=heading aria-level=2>Data </div><div role=heading aria-level=2>Query Explorer</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer">',
    ),
    Qd = _('<option>'),
    Yd = _(
        '<div><div role=heading aria-level=2>Mutation Details</div><div><div class=tsqd-query-details-summary><pre><code></code></pre><span role=status aria-live=polite></span></div><div class=tsqd-query-details-last-updated><span>Submitted At:</span><span></span></div></div><div role=heading aria-level=2>Variables Details</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"></div><div role=heading aria-level=2>Context Details</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"></div><div role=heading aria-level=2>Data Explorer</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer"></div><div role=heading aria-level=2>Mutations Explorer</div><div class="tsqd-query-details-explorer-container tsqd-query-details-query-explorer">',
    ),
    [Ie, Bn] = z(null),
    [bt, ms] = z(null),
    [ct, ys] = z(0),
    [nn, Xd] = z(!1),
    Zd = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? We(n) : je(n))),
            o = q(() => K().onlineManager);
        xt(() => {
            const c = o().subscribe((d) => {
                Xd(!d);
            });
            U(() => {
                c();
            });
        });
        const s = cr(),
            a = q(() => K().buttonPosition || Ws),
            l = q(() =>
                e.localStore.open === 'true'
                    ? !0
                    : e.localStore.open === 'false'
                      ? !1
                      : K().initialIsOpen || Ys,
            ),
            i = q(() => e.localStore.position || K().position || Xn);
        let u;
        (B(() => {
            const c = u.parentElement,
                d = e.localStore.height || $n,
                f = e.localStore.width || Cn,
                h = i();
            (c.style.setProperty('--tsqd-panel-height', `${h === 'top' ? '-' : ''}${d}px`),
                c.style.setProperty('--tsqd-panel-width', `${h === 'left' ? '-' : ''}${f}px`));
        }),
            xt(() => {
                const c = () => {
                    const d = u.parentElement,
                        f = getComputedStyle(d).fontSize;
                    d.style.setProperty('--tsqd-font-size', f);
                };
                (c(),
                    window.addEventListener('focus', c),
                    U(() => {
                        window.removeEventListener('focus', c);
                    }));
            }));
        const g = q(() => e.localStore.pip_open ?? 'false');
        return [
            m(R, {
                get when() {
                    return ve(() => !!s().pipWindow)() && g() == 'true';
                },
                get children() {
                    return m(zo, {
                        get mount() {
                            return s().pipWindow?.document.body;
                        },
                        get children() {
                            return m(Jd, {
                                get children() {
                                    return m(ps, e);
                                },
                            });
                        },
                    });
                },
            }),
            (() => {
                var c = Kn(),
                    d = u;
                return (
                    typeof d == 'function' ? sn(d, c) : (u = c),
                    S(
                        c,
                        m(Jr, {
                            name: 'tsqd-panel-transition',
                            get children() {
                                return m(R, {
                                    get when() {
                                        return (
                                            ve(() => !!(l() && !s().pipWindow))() && g() == 'false'
                                        );
                                    },
                                    get children() {
                                        return m(e0, {
                                            get localStore() {
                                                return e.localStore;
                                            },
                                            get setLocalStore() {
                                                return e.setLocalStore;
                                            },
                                        });
                                    },
                                });
                            },
                        }),
                        null,
                    ),
                    S(
                        c,
                        m(Jr, {
                            name: 'tsqd-button-transition',
                            get children() {
                                return m(R, {
                                    get when() {
                                        return !l();
                                    },
                                    get children() {
                                        var f = md(),
                                            h = f.firstChild,
                                            p = h.nextSibling;
                                        return (
                                            S(h, m(Po, {})),
                                            (p.$$click = () => e.setLocalStore('open', 'true')),
                                            S(p, m(Po, {})),
                                            G(() =>
                                                I(
                                                    f,
                                                    O(
                                                        r().devtoolsBtn,
                                                        r()[`devtoolsBtn-position-${a()}`],
                                                        'tsqd-open-btn-container',
                                                    ),
                                                ),
                                            ),
                                            f
                                        );
                                    },
                                });
                            },
                        }),
                        null,
                    ),
                    G(() =>
                        I(
                            c,
                            O(
                                n`
            & .tsqd-panel-transition-exit-active,
            & .tsqd-panel-transition-enter-active {
              transition:
                opacity 0.3s,
                transform 0.3s;
            }

            & .tsqd-panel-transition-exit-to,
            & .tsqd-panel-transition-enter {
              ${i() === 'top' || i() === 'bottom' ? 'transform: translateY(var(--tsqd-panel-height));' : 'transform: translateX(var(--tsqd-panel-width));'}
            }

            & .tsqd-button-transition-exit-active,
            & .tsqd-button-transition-enter-active {
              transition:
                opacity 0.3s,
                transform 0.3s;
              opacity: 1;
            }

            & .tsqd-button-transition-exit-to,
            & .tsqd-button-transition-enter {
              transform: ${a() === 'relative' ? 'none;' : a() === 'top-left' ? 'translateX(-72px);' : a() === 'top-right' ? 'translateX(72px);' : 'translateY(72px);'};
              opacity: 0;
            }
          `,
                                'tsqd-transitions-container',
                            ),
                        ),
                    ),
                    c
                );
            })(),
        ];
    },
    Jd = (e) => {
        const t = cr(),
            n = $e(),
            r = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            o = q(() => (n() === 'dark' ? We(r) : je(r))),
            s = () => {
                const { colors: a } = C,
                    l = (i, u) => (n() === 'dark' ? u : i);
                return ct() < Ht
                    ? r`
        flex-direction: column;
        background-color: ${l(a.gray[300], a.gray[600])};
      `
                    : r`
      flex-direction: row;
      background-color: ${l(a.gray[200], a.darkGray[900])};
    `;
            };
        return (
            B(() => {
                const a = t().pipWindow,
                    l = () => {
                        a && ys(a.innerWidth);
                    };
                (a && (a.addEventListener('resize', l), l()),
                    U(() => {
                        a && a.removeEventListener('resize', l);
                    }));
            }),
            (() => {
                var a = Kn();
                return (
                    a.style.setProperty('--tsqd-font-size', '16px'),
                    a.style.setProperty('max-height', '100vh'),
                    a.style.setProperty('height', '100vh'),
                    a.style.setProperty('width', '100vw'),
                    S(a, () => e.children),
                    G(() =>
                        I(
                            a,
                            O(
                                o().panel,
                                s(),
                                {
                                    [r`
            min-width: min-content;
          `]: ct() < Bo,
                                },
                                'tsqd-main-panel',
                            ),
                        ),
                    ),
                    a
                );
            })()
        );
    },
    e0 = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? We(n) : je(n)));
        let o;
        xt(() => {
            o.focus();
        });
        const [s, a] = z(!1),
            l = q(() => e.localStore.position || K().position || Xn),
            i = (c) => {
                const d = c.currentTarget.parentElement;
                if (!d) return;
                a(!0);
                const { height: f, width: h } = d.getBoundingClientRect(),
                    p = c.clientX,
                    v = c.clientY;
                let y = 0;
                const x = Ot(3.5),
                    b = Ot(12),
                    w = (L) => {
                        if ((L.preventDefault(), l() === 'left' || l() === 'right')) {
                            const D = l() === 'right' ? p - L.clientX : L.clientX - p;
                            ((y = Math.round(h + D)),
                                y < b && (y = b),
                                e.setLocalStore('width', String(Math.round(y))));
                            const T = d.getBoundingClientRect().width;
                            Number(e.localStore.width) < T && e.setLocalStore('width', String(T));
                        } else {
                            const D = l() === 'bottom' ? v - L.clientY : L.clientY - v;
                            ((y = Math.round(f + D)),
                                y < x && ((y = x), Bn(null)),
                                e.setLocalStore('height', String(Math.round(y))));
                        }
                    },
                    $ = () => {
                        (s() && a(!1),
                            document.removeEventListener('mousemove', w, !1),
                            document.removeEventListener('mouseup', $, !1));
                    };
                (document.addEventListener('mousemove', w, !1),
                    document.addEventListener('mouseup', $, !1));
            };
        let u;
        (xt(() => {
            Sa(u, ({ width: c }, d) => {
                d === u && ys(c);
            });
        }),
            B(() => {
                const c = u.parentElement?.parentElement?.parentElement;
                if (!c) return;
                const d = e.localStore.position || Xn,
                    f = $s('padding', d),
                    h = e.localStore.position === 'left' || e.localStore.position === 'right',
                    p = (({
                        padding: v,
                        paddingTop: y,
                        paddingBottom: x,
                        paddingLeft: b,
                        paddingRight: w,
                    }) => ({
                        padding: v,
                        paddingTop: y,
                        paddingBottom: x,
                        paddingLeft: b,
                        paddingRight: w,
                    }))(c.style);
                ((c.style[f] = `${h ? e.localStore.width : e.localStore.height}px`),
                    U(() => {
                        Object.entries(p).forEach(([v, y]) => {
                            c.style[v] = y;
                        });
                    }));
            }));
        const g = () => {
            const { colors: c } = C,
                d = (f, h) => (t() === 'dark' ? h : f);
            return ct() < Ht
                ? n`
        flex-direction: column;
        background-color: ${d(c.gray[300], c.gray[600])};
      `
                : n`
      flex-direction: row;
      background-color: ${d(c.gray[200], c.darkGray[900])};
    `;
        };
        return (() => {
            var c = yd(),
                d = c.firstChild,
                f = d.nextSibling,
                h = u;
            (typeof h == 'function' ? sn(h, c) : (u = c),
                (d.$$keydown = (v) => {
                    const x = Ot(3.5),
                        b = Ot(12);
                    if (l() === 'top' || l() === 'bottom') {
                        if (v.key === 'ArrowUp' || v.key === 'ArrowDown') {
                            v.preventDefault();
                            const w = Number(e.localStore.height || $n),
                                $ =
                                    l() === 'bottom'
                                        ? v.key === 'ArrowUp'
                                            ? 10
                                            : -10
                                        : v.key === 'ArrowDown'
                                          ? 10
                                          : -10,
                                L = Math.max(x, w + $);
                            e.setLocalStore('height', String(L));
                        }
                    } else if (v.key === 'ArrowLeft' || v.key === 'ArrowRight') {
                        v.preventDefault();
                        const w = Number(e.localStore.width || Cn),
                            $ =
                                l() === 'right'
                                    ? v.key === 'ArrowLeft'
                                        ? 10
                                        : -10
                                    : v.key === 'ArrowRight'
                                      ? 10
                                      : -10,
                            L = Math.max(b, w + $);
                        e.setLocalStore('width', String(L));
                    }
                }),
                (d.$$mousedown = i),
                (f.$$click = () => e.setLocalStore('open', 'false')));
            var p = o;
            return (
                typeof p == 'function' ? sn(p, f) : (o = f),
                S(f, m(Kt, {})),
                S(c, m(ps, e), null),
                G(
                    (v) => {
                        var y = O(
                                r().panel,
                                r()[`panel-position-${l()}`],
                                g(),
                                {
                                    [n`
            min-width: min-content;
          `]: ct() < Bo && (l() === 'right' || l() === 'left'),
                                },
                                'tsqd-main-panel',
                            ),
                            x =
                                l() === 'bottom' || l() === 'top'
                                    ? `${e.localStore.height || $n}px`
                                    : 'auto',
                            b =
                                l() === 'right' || l() === 'left'
                                    ? `${e.localStore.width || Cn}px`
                                    : 'auto',
                            w = l() === 'top' || l() === 'bottom' ? 'horizontal' : 'vertical',
                            $ = l() === 'top' || l() === 'bottom' ? Ot(3.5) : Ot(12),
                            L =
                                l() === 'top' || l() === 'bottom'
                                    ? Number(e.localStore.height || $n)
                                    : Number(e.localStore.width || Cn),
                            D = O(
                                r().dragHandle,
                                r()[`dragHandle-position-${l()}`],
                                'tsqd-drag-handle',
                            ),
                            T = O(
                                r().closeBtn,
                                r()[`closeBtn-position-${l()}`],
                                'tsqd-minimize-btn',
                            );
                        return (
                            y !== v.e && I(c, (v.e = y)),
                            x !== v.t &&
                                ((v.t = x) != null
                                    ? c.style.setProperty('height', x)
                                    : c.style.removeProperty('height')),
                            b !== v.a &&
                                ((v.a = b) != null
                                    ? c.style.setProperty('width', b)
                                    : c.style.removeProperty('width')),
                            w !== v.o && A(d, 'aria-orientation', (v.o = w)),
                            $ !== v.i && A(d, 'aria-valuemin', (v.i = $)),
                            L !== v.n && A(d, 'aria-valuenow', (v.n = L)),
                            D !== v.s && I(d, (v.s = D)),
                            T !== v.h && I(f, (v.h = T)),
                            v
                        );
                    },
                    {
                        e: void 0,
                        t: void 0,
                        a: void 0,
                        o: void 0,
                        i: void 0,
                        n: void 0,
                        s: void 0,
                        h: void 0,
                    },
                ),
                c
            );
        })();
    },
    ps = (e) => {
        (a0(), l0());
        let t;
        const n = $e(),
            r = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            o = q(() => (n() === 'dark' ? We(r) : je(r))),
            s = cr(),
            [a, l] = z('queries'),
            i = q(() => e.localStore.sort || Zs),
            u = q(() => Number(e.localStore.sortOrder) || Ur),
            g = q(() => e.localStore.mutationSort || Js),
            c = q(() => Number(e.localStore.mutationSortOrder) || Ur),
            d = q(() => Wn[i()]),
            f = q(() => Qn[g()]),
            h = q(() => K().onlineManager),
            p = q(() => K().client.getQueryCache()),
            v = q(() => K().client.getMutationCache()),
            y = pe((D) => D().getAll().length, !1),
            x = q(
                dt(
                    () => [y(), e.localStore.filter, i(), u(), e.localStore.hideDisabledQueries],
                    () => {
                        const D = p().getAll();
                        let T = e.localStore.filter
                            ? D.filter((F) => jr(F.queryHash, e.localStore.filter || '').passed)
                            : [...D];
                        return (
                            e.localStore.hideDisabledQueries === 'true' &&
                                (T = T.filter((F) => !F.isDisabled())),
                            d() ? T.sort((F, N) => d()(F, N) * u()) : T
                        );
                    },
                ),
            ),
            b = Ge((D) => D().getAll().length, !1),
            w = q(
                dt(
                    () => [b(), e.localStore.mutationFilter, g(), c()],
                    () => {
                        const D = v().getAll(),
                            T = e.localStore.mutationFilter
                                ? D.filter((F) => {
                                      const N = `${F.options.mutationKey ? JSON.stringify(F.options.mutationKey) + ' - ' : ''}${new Date(F.state.submittedAt).toLocaleString()}`;
                                      return jr(N, e.localStore.mutationFilter || '').passed;
                                  })
                                : [...D];
                        return f() ? T.sort((F, N) => f()(F, N) * c()) : T;
                    },
                ),
            ),
            $ = (D) => {
                e.setLocalStore('position', D);
            },
            L = (D) => {
                const k = getComputedStyle(t).getPropertyValue('--tsqd-font-size');
                D.style.setProperty('--tsqd-font-size', k);
            };
        return [
            (() => {
                var D = Rd(),
                    T = D.firstChild,
                    k = T.firstChild,
                    F = k.firstChild,
                    N = F.firstChild,
                    H = N.nextSibling,
                    ne = H.firstChild,
                    ee = T.nextSibling,
                    le = ee.firstChild,
                    ie = le.firstChild,
                    re = ie.firstChild,
                    se = ie.nextSibling,
                    ue = se.nextSibling,
                    me = le.nextSibling,
                    Ae = me.firstChild,
                    he = Ae.nextSibling,
                    Ee = t;
                return (
                    typeof Ee == 'function' ? sn(Ee, D) : (t = D),
                    (F.$$click = () => {
                        if (!s().pipWindow && !e.showPanelViewOnly) {
                            e.setLocalStore('open', 'false');
                            return;
                        }
                        e.onClose && e.onClose();
                    }),
                    S(H, () => K().queryFlavor, ne),
                    S(H, () => K().version, null),
                    S(
                        k,
                        m(ze.Root, {
                            get class() {
                                return O(o().viewToggle);
                            },
                            get value() {
                                return a();
                            },
                            'aria-label': 'Toggle between queries and mutations view',
                            onChange: (M) => {
                                (l(M), Bn(null), ms(null));
                            },
                            get children() {
                                return [
                                    m(ze.Item, {
                                        value: 'queries',
                                        class: 'tsqd-radio-toggle',
                                        get children() {
                                            return [
                                                m(ze.ItemInput, {}),
                                                m(ze.ItemControl, {
                                                    get children() {
                                                        return m(ze.ItemIndicator, {});
                                                    },
                                                }),
                                                m(ze.ItemLabel, {
                                                    title: 'Toggle Queries View',
                                                    children: 'Queries',
                                                }),
                                            ];
                                        },
                                    }),
                                    m(ze.Item, {
                                        value: 'mutations',
                                        class: 'tsqd-radio-toggle',
                                        get children() {
                                            return [
                                                m(ze.ItemInput, {}),
                                                m(ze.ItemControl, {
                                                    get children() {
                                                        return m(ze.ItemIndicator, {});
                                                    },
                                                }),
                                                m(ze.ItemLabel, {
                                                    title: 'Toggle Mutations View',
                                                    children: 'Mutations',
                                                }),
                                            ];
                                        },
                                    }),
                                ];
                            },
                        }),
                        null,
                    ),
                    S(
                        T,
                        m(R, {
                            get when() {
                                return a() === 'queries';
                            },
                            get children() {
                                return m(r0, {});
                            },
                        }),
                        null,
                    ),
                    S(
                        T,
                        m(R, {
                            get when() {
                                return a() === 'mutations';
                            },
                            get children() {
                                return m(o0, {});
                            },
                        }),
                        null,
                    ),
                    S(ie, m(_c, {}), re),
                    (re.$$input = (M) => {
                        a() === 'queries'
                            ? e.setLocalStore('filter', M.currentTarget.value)
                            : e.setLocalStore('mutationFilter', M.currentTarget.value);
                    }),
                    S(
                        se,
                        m(R, {
                            get when() {
                                return a() === 'queries';
                            },
                            get children() {
                                var M = pd();
                                return (
                                    M.addEventListener('change', (ge) => {
                                        e.setLocalStore('sort', ge.currentTarget.value);
                                    }),
                                    S(M, () =>
                                        Object.keys(Wn).map((ge) =>
                                            (() => {
                                                var Y = Ro();
                                                return (
                                                    Y.firstChild,
                                                    (Y.value = ge),
                                                    S(Y, ge, null),
                                                    Y
                                                );
                                            })(),
                                        ),
                                    ),
                                    G(() => (M.value = i())),
                                    M
                                );
                            },
                        }),
                        null,
                    ),
                    S(
                        se,
                        m(R, {
                            get when() {
                                return a() === 'mutations';
                            },
                            get children() {
                                var M = bd();
                                return (
                                    M.addEventListener('change', (ge) => {
                                        e.setLocalStore('mutationSort', ge.currentTarget.value);
                                    }),
                                    S(M, () =>
                                        Object.keys(Qn).map((ge) =>
                                            (() => {
                                                var Y = Ro();
                                                return (
                                                    Y.firstChild,
                                                    (Y.value = ge),
                                                    S(Y, ge, null),
                                                    Y
                                                );
                                            })(),
                                        ),
                                    ),
                                    G(() => (M.value = g())),
                                    M
                                );
                            },
                        }),
                        null,
                    ),
                    S(se, m(Kt, {}), null),
                    (ue.$$click = () => {
                        a() === 'queries'
                            ? e.setLocalStore('sortOrder', String(u() * -1))
                            : e.setLocalStore('mutationSortOrder', String(c() * -1));
                    }),
                    S(
                        ue,
                        m(R, {
                            get when() {
                                return (a() === 'queries' ? u() : c()) === 1;
                            },
                            get children() {
                                return [xd(), m(Fo, {})];
                            },
                        }),
                        null,
                    ),
                    S(
                        ue,
                        m(R, {
                            get when() {
                                return (a() === 'queries' ? u() : c()) === -1;
                            },
                            get children() {
                                return [wd(), m(Io, {})];
                            },
                        }),
                        null,
                    ),
                    (Ae.$$click = () => {
                        a() === 'queries'
                            ? (Ye({ type: 'CLEAR_QUERY_CACHE' }), p().clear())
                            : (Ye({ type: 'CLEAR_MUTATION_CACHE' }), v().clear());
                    }),
                    S(Ae, m(gs, {})),
                    (he.$$click = () => {
                        h().setOnline(!h().isOnline());
                    }),
                    S(
                        he,
                        (() => {
                            var M = ve(() => !!nn());
                            return () => (M() ? m(Gc, {}) : m(Hc, {}));
                        })(),
                    ),
                    S(
                        me,
                        m(R, {
                            get when() {
                                return ve(() => !s().pipWindow)() && !s().disabled;
                            },
                            get children() {
                                var M = $d();
                                return (
                                    (M.$$click = () => {
                                        s().requestPipWindow(
                                            Number(window.innerWidth),
                                            Number(e.localStore.height ?? 500),
                                        );
                                    }),
                                    S(M, m(Vc, {})),
                                    G(() =>
                                        I(
                                            M,
                                            O(
                                                o().actionsBtn,
                                                'tsqd-actions-btn',
                                                'tsqd-action-open-pip',
                                            ),
                                        ),
                                    ),
                                    M
                                );
                            },
                        }),
                        null,
                    ),
                    S(
                        me,
                        m(Z.Root, {
                            gutter: 4,
                            get children() {
                                return [
                                    m(Z.Trigger, {
                                        get class() {
                                            return O(
                                                o().actionsBtn,
                                                'tsqd-actions-btn',
                                                'tsqd-action-settings',
                                            );
                                        },
                                        'aria-label': 'Open settings menu',
                                        title: 'Open settings menu',
                                        get children() {
                                            return m(Uc, {});
                                        },
                                    }),
                                    m(Z.Portal, {
                                        ref: (M) => L(M),
                                        get mount() {
                                            return ve(() => !!s().pipWindow)()
                                                ? s().pipWindow.document.body
                                                : document.body;
                                        },
                                        get children() {
                                            return m(Z.Content, {
                                                get class() {
                                                    return O(
                                                        o().settingsMenu,
                                                        'tsqd-settings-menu',
                                                    );
                                                },
                                                get children() {
                                                    return [
                                                        (() => {
                                                            var M = Cd();
                                                            return (
                                                                G(() =>
                                                                    I(
                                                                        M,
                                                                        O(
                                                                            o().settingsMenuHeader,
                                                                            'tsqd-settings-menu-header',
                                                                        ),
                                                                    ),
                                                                ),
                                                                M
                                                            );
                                                        })(),
                                                        m(R, {
                                                            get when() {
                                                                return !e.showPanelViewOnly;
                                                            },
                                                            get children() {
                                                                return m(Z.Sub, {
                                                                    overlap: !0,
                                                                    gutter: 8,
                                                                    shift: -4,
                                                                    get children() {
                                                                        return [
                                                                            m(Z.SubTrigger, {
                                                                                get class() {
                                                                                    return O(
                                                                                        o()
                                                                                            .settingsSubTrigger,
                                                                                        'tsqd-settings-menu-sub-trigger',
                                                                                        'tsqd-settings-menu-sub-trigger-position',
                                                                                    );
                                                                                },
                                                                                get children() {
                                                                                    return [
                                                                                        Sd(),
                                                                                        m(Kt, {}),
                                                                                    ];
                                                                                },
                                                                            }),
                                                                            m(Z.Portal, {
                                                                                ref: (M) => L(M),
                                                                                get mount() {
                                                                                    return ve(
                                                                                        () =>
                                                                                            !!s()
                                                                                                .pipWindow,
                                                                                    )()
                                                                                        ? s()
                                                                                              .pipWindow
                                                                                              .document
                                                                                              .body
                                                                                        : document.body;
                                                                                },
                                                                                get children() {
                                                                                    return m(
                                                                                        Z.SubContent,
                                                                                        {
                                                                                            get class() {
                                                                                                return O(
                                                                                                    o()
                                                                                                        .settingsMenu,
                                                                                                    'tsqd-settings-submenu',
                                                                                                );
                                                                                            },
                                                                                            get children() {
                                                                                                return m(
                                                                                                    Z.RadioGroup,
                                                                                                    {
                                                                                                        'aria-label':
                                                                                                            'Position settings',
                                                                                                        get value() {
                                                                                                            return e
                                                                                                                .localStore
                                                                                                                .position;
                                                                                                        },
                                                                                                        onChange:
                                                                                                            (
                                                                                                                M,
                                                                                                            ) =>
                                                                                                                $(
                                                                                                                    M,
                                                                                                                ),
                                                                                                        get children() {
                                                                                                            return [
                                                                                                                m(
                                                                                                                    Z.RadioItem,
                                                                                                                    {
                                                                                                                        value: 'top',
                                                                                                                        get class() {
                                                                                                                            return O(
                                                                                                                                o()
                                                                                                                                    .settingsSubButton,
                                                                                                                                'tsqd-settings-menu-position-btn',
                                                                                                                                'tsqd-settings-menu-position-btn-top',
                                                                                                                            );
                                                                                                                        },
                                                                                                                        get children() {
                                                                                                                            return [
                                                                                                                                kd(),
                                                                                                                                m(
                                                                                                                                    Fo,
                                                                                                                                    {},
                                                                                                                                ),
                                                                                                                            ];
                                                                                                                        },
                                                                                                                    },
                                                                                                                ),
                                                                                                                m(
                                                                                                                    Z.RadioItem,
                                                                                                                    {
                                                                                                                        value: 'bottom',
                                                                                                                        get class() {
                                                                                                                            return O(
                                                                                                                                o()
                                                                                                                                    .settingsSubButton,
                                                                                                                                'tsqd-settings-menu-position-btn',
                                                                                                                                'tsqd-settings-menu-position-btn-bottom',
                                                                                                                            );
                                                                                                                        },
                                                                                                                        get children() {
                                                                                                                            return [
                                                                                                                                Ed(),
                                                                                                                                m(
                                                                                                                                    Io,
                                                                                                                                    {},
                                                                                                                                ),
                                                                                                                            ];
                                                                                                                        },
                                                                                                                    },
                                                                                                                ),
                                                                                                                m(
                                                                                                                    Z.RadioItem,
                                                                                                                    {
                                                                                                                        value: 'left',
                                                                                                                        get class() {
                                                                                                                            return O(
                                                                                                                                o()
                                                                                                                                    .settingsSubButton,
                                                                                                                                'tsqd-settings-menu-position-btn',
                                                                                                                                'tsqd-settings-menu-position-btn-left',
                                                                                                                            );
                                                                                                                        },
                                                                                                                        get children() {
                                                                                                                            return [
                                                                                                                                Md(),
                                                                                                                                m(
                                                                                                                                    Rc,
                                                                                                                                    {},
                                                                                                                                ),
                                                                                                                            ];
                                                                                                                        },
                                                                                                                    },
                                                                                                                ),
                                                                                                                m(
                                                                                                                    Z.RadioItem,
                                                                                                                    {
                                                                                                                        value: 'right',
                                                                                                                        get class() {
                                                                                                                            return O(
                                                                                                                                o()
                                                                                                                                    .settingsSubButton,
                                                                                                                                'tsqd-settings-menu-position-btn',
                                                                                                                                'tsqd-settings-menu-position-btn-right',
                                                                                                                            );
                                                                                                                        },
                                                                                                                        get children() {
                                                                                                                            return [
                                                                                                                                Dd(),
                                                                                                                                m(
                                                                                                                                    zc,
                                                                                                                                    {},
                                                                                                                                ),
                                                                                                                            ];
                                                                                                                        },
                                                                                                                    },
                                                                                                                ),
                                                                                                            ];
                                                                                                        },
                                                                                                    },
                                                                                                );
                                                                                            },
                                                                                        },
                                                                                    );
                                                                                },
                                                                            }),
                                                                        ];
                                                                    },
                                                                });
                                                            },
                                                        }),
                                                        m(Z.Sub, {
                                                            overlap: !0,
                                                            gutter: 8,
                                                            shift: -4,
                                                            get children() {
                                                                return [
                                                                    m(Z.SubTrigger, {
                                                                        get class() {
                                                                            return O(
                                                                                o()
                                                                                    .settingsSubTrigger,
                                                                                'tsqd-settings-menu-sub-trigger',
                                                                                'tsqd-settings-menu-sub-trigger-position',
                                                                            );
                                                                        },
                                                                        get children() {
                                                                            return [
                                                                                Ad(),
                                                                                m(Kt, {}),
                                                                            ];
                                                                        },
                                                                    }),
                                                                    m(Z.Portal, {
                                                                        ref: (M) => L(M),
                                                                        get mount() {
                                                                            return ve(
                                                                                () =>
                                                                                    !!s().pipWindow,
                                                                            )()
                                                                                ? s().pipWindow
                                                                                      .document.body
                                                                                : document.body;
                                                                        },
                                                                        get children() {
                                                                            return m(Z.SubContent, {
                                                                                get class() {
                                                                                    return O(
                                                                                        o()
                                                                                            .settingsMenu,
                                                                                        'tsqd-settings-submenu',
                                                                                    );
                                                                                },
                                                                                get children() {
                                                                                    return m(
                                                                                        Z.RadioGroup,
                                                                                        {
                                                                                            get value() {
                                                                                                return e
                                                                                                    .localStore
                                                                                                    .theme_preference;
                                                                                            },
                                                                                            onChange:
                                                                                                (
                                                                                                    M,
                                                                                                ) => {
                                                                                                    e.setLocalStore(
                                                                                                        'theme_preference',
                                                                                                        M,
                                                                                                    );
                                                                                                },
                                                                                            'aria-label':
                                                                                                'Theme preference',
                                                                                            get children() {
                                                                                                return [
                                                                                                    m(
                                                                                                        Z.RadioItem,
                                                                                                        {
                                                                                                            value: 'light',
                                                                                                            get class() {
                                                                                                                return O(
                                                                                                                    o()
                                                                                                                        .settingsSubButton,
                                                                                                                    'tsqd-settings-menu-position-btn',
                                                                                                                    'tsqd-settings-menu-position-btn-top',
                                                                                                                );
                                                                                                            },
                                                                                                            get children() {
                                                                                                                return [
                                                                                                                    Td(),
                                                                                                                    m(
                                                                                                                        Kc,
                                                                                                                        {},
                                                                                                                    ),
                                                                                                                ];
                                                                                                            },
                                                                                                        },
                                                                                                    ),
                                                                                                    m(
                                                                                                        Z.RadioItem,
                                                                                                        {
                                                                                                            value: 'dark',
                                                                                                            get class() {
                                                                                                                return O(
                                                                                                                    o()
                                                                                                                        .settingsSubButton,
                                                                                                                    'tsqd-settings-menu-position-btn',
                                                                                                                    'tsqd-settings-menu-position-btn-bottom',
                                                                                                                );
                                                                                                            },
                                                                                                            get children() {
                                                                                                                return [
                                                                                                                    Fd(),
                                                                                                                    m(
                                                                                                                        Bc,
                                                                                                                        {},
                                                                                                                    ),
                                                                                                                ];
                                                                                                            },
                                                                                                        },
                                                                                                    ),
                                                                                                    m(
                                                                                                        Z.RadioItem,
                                                                                                        {
                                                                                                            value: 'system',
                                                                                                            get class() {
                                                                                                                return O(
                                                                                                                    o()
                                                                                                                        .settingsSubButton,
                                                                                                                    'tsqd-settings-menu-position-btn',
                                                                                                                    'tsqd-settings-menu-position-btn-left',
                                                                                                                );
                                                                                                            },
                                                                                                            get children() {
                                                                                                                return [
                                                                                                                    Id(),
                                                                                                                    m(
                                                                                                                        Nc,
                                                                                                                        {},
                                                                                                                    ),
                                                                                                                ];
                                                                                                            },
                                                                                                        },
                                                                                                    ),
                                                                                                ];
                                                                                            },
                                                                                        },
                                                                                    );
                                                                                },
                                                                            });
                                                                        },
                                                                    }),
                                                                ];
                                                            },
                                                        }),
                                                        m(Z.Sub, {
                                                            overlap: !0,
                                                            gutter: 8,
                                                            shift: -4,
                                                            get children() {
                                                                return [
                                                                    m(Z.SubTrigger, {
                                                                        get class() {
                                                                            return O(
                                                                                o()
                                                                                    .settingsSubTrigger,
                                                                                'tsqd-settings-menu-sub-trigger',
                                                                                'tsqd-settings-menu-sub-trigger-disabled-queries',
                                                                            );
                                                                        },
                                                                        get children() {
                                                                            return [
                                                                                Pd(),
                                                                                m(Kt, {}),
                                                                            ];
                                                                        },
                                                                    }),
                                                                    m(Z.Portal, {
                                                                        ref: (M) => L(M),
                                                                        get mount() {
                                                                            return ve(
                                                                                () =>
                                                                                    !!s().pipWindow,
                                                                            )()
                                                                                ? s().pipWindow
                                                                                      .document.body
                                                                                : document.body;
                                                                        },
                                                                        get children() {
                                                                            return m(Z.SubContent, {
                                                                                get class() {
                                                                                    return O(
                                                                                        o()
                                                                                            .settingsMenu,
                                                                                        'tsqd-settings-submenu',
                                                                                    );
                                                                                },
                                                                                get children() {
                                                                                    return m(
                                                                                        Z.RadioGroup,
                                                                                        {
                                                                                            get value() {
                                                                                                return e
                                                                                                    .localStore
                                                                                                    .hideDisabledQueries;
                                                                                            },
                                                                                            'aria-label':
                                                                                                'Hide disabled queries setting',
                                                                                            onChange:
                                                                                                (
                                                                                                    M,
                                                                                                ) =>
                                                                                                    e.setLocalStore(
                                                                                                        'hideDisabledQueries',
                                                                                                        M,
                                                                                                    ),
                                                                                            get children() {
                                                                                                return [
                                                                                                    m(
                                                                                                        Z.RadioItem,
                                                                                                        {
                                                                                                            value: 'false',
                                                                                                            get class() {
                                                                                                                return O(
                                                                                                                    o()
                                                                                                                        .settingsSubButton,
                                                                                                                    'tsqd-settings-menu-position-btn',
                                                                                                                    'tsqd-settings-menu-position-btn-show',
                                                                                                                );
                                                                                                            },
                                                                                                            get children() {
                                                                                                                return [
                                                                                                                    Ld(),
                                                                                                                    m(
                                                                                                                        R,
                                                                                                                        {
                                                                                                                            get when() {
                                                                                                                                return (
                                                                                                                                    e
                                                                                                                                        .localStore
                                                                                                                                        .hideDisabledQueries !==
                                                                                                                                    'true'
                                                                                                                                );
                                                                                                                            },
                                                                                                                            get children() {
                                                                                                                                return m(
                                                                                                                                    ar,
                                                                                                                                    {},
                                                                                                                                );
                                                                                                                            },
                                                                                                                        },
                                                                                                                    ),
                                                                                                                ];
                                                                                                            },
                                                                                                        },
                                                                                                    ),
                                                                                                    m(
                                                                                                        Z.RadioItem,
                                                                                                        {
                                                                                                            value: 'true',
                                                                                                            get class() {
                                                                                                                return O(
                                                                                                                    o()
                                                                                                                        .settingsSubButton,
                                                                                                                    'tsqd-settings-menu-position-btn',
                                                                                                                    'tsqd-settings-menu-position-btn-hide',
                                                                                                                );
                                                                                                            },
                                                                                                            get children() {
                                                                                                                return [
                                                                                                                    Od(),
                                                                                                                    m(
                                                                                                                        R,
                                                                                                                        {
                                                                                                                            get when() {
                                                                                                                                return (
                                                                                                                                    e
                                                                                                                                        .localStore
                                                                                                                                        .hideDisabledQueries ===
                                                                                                                                    'true'
                                                                                                                                );
                                                                                                                            },
                                                                                                                            get children() {
                                                                                                                                return m(
                                                                                                                                    ar,
                                                                                                                                    {},
                                                                                                                                );
                                                                                                                            },
                                                                                                                        },
                                                                                                                    ),
                                                                                                                ];
                                                                                                            },
                                                                                                        },
                                                                                                    ),
                                                                                                ];
                                                                                            },
                                                                                        },
                                                                                    );
                                                                                },
                                                                            });
                                                                        },
                                                                    }),
                                                                ];
                                                            },
                                                        }),
                                                    ];
                                                },
                                            });
                                        },
                                    }),
                                ];
                            },
                        }),
                        null,
                    ),
                    S(
                        D,
                        m(R, {
                            get when() {
                                return a() === 'queries';
                            },
                            get children() {
                                var M = qd(),
                                    ge = M.firstChild;
                                return (
                                    S(
                                        ge,
                                        m(kn, {
                                            by: (Y) => Y.queryHash,
                                            get each() {
                                                return x();
                                            },
                                            children: (Y) =>
                                                m(t0, {
                                                    get query() {
                                                        return Y();
                                                    },
                                                }),
                                        }),
                                    ),
                                    G(() =>
                                        I(
                                            M,
                                            O(
                                                o().overflowQueryContainer,
                                                'tsqd-queries-overflow-container',
                                            ),
                                        ),
                                    ),
                                    M
                                );
                            },
                        }),
                        null,
                    ),
                    S(
                        D,
                        m(R, {
                            get when() {
                                return a() === 'mutations';
                            },
                            get children() {
                                var M = _d(),
                                    ge = M.firstChild;
                                return (
                                    S(
                                        ge,
                                        m(kn, {
                                            by: (Y) => Y.mutationId,
                                            get each() {
                                                return w();
                                            },
                                            children: (Y) =>
                                                m(n0, {
                                                    get mutation() {
                                                        return Y();
                                                    },
                                                }),
                                        }),
                                    ),
                                    G(() =>
                                        I(
                                            M,
                                            O(
                                                o().overflowQueryContainer,
                                                'tsqd-mutations-overflow-container',
                                            ),
                                        ),
                                    ),
                                    M
                                );
                            },
                        }),
                        null,
                    ),
                    G(
                        (M) => {
                            var ge = O(
                                    o().queriesContainer,
                                    ct() < Ht &&
                                        (Ie() || bt()) &&
                                        r`
              height: 50%;
              max-height: 50%;
            `,
                                    ct() < Ht &&
                                        !(Ie() || bt()) &&
                                        r`
              height: 100%;
              max-height: 100%;
            `,
                                    'tsqd-queries-container',
                                ),
                                Y = O(o().row, 'tsqd-header'),
                                vt = o().logoAndToggleContainer,
                                V = O(o().logo, 'tsqd-text-logo-container'),
                                Ne = O(o().tanstackLogo, 'tsqd-text-logo-tanstack'),
                                Ce = O(o().queryFlavorLogo, 'tsqd-text-logo-query-flavor'),
                                It = O(o().row, 'tsqd-filters-actions-container'),
                                qe = O(o().filtersContainer, 'tsqd-filters-container'),
                                mt = O(o().filterInput, 'tsqd-query-filter-textfield-container'),
                                kt = O('tsqd-query-filter-textfield'),
                                tt = O(o().filterSelect, 'tsqd-query-filter-sort-container'),
                                Qe = `Sort order ${(a() === 'queries' ? u() : c()) === -1 ? 'descending' : 'ascending'}`,
                                nt = (a() === 'queries' ? u() : c()) === -1,
                                P = O(o().actionsContainer, 'tsqd-actions-container'),
                                oe = O(
                                    o().actionsBtn,
                                    'tsqd-actions-btn',
                                    'tsqd-action-clear-cache',
                                ),
                                Me = `Clear ${a()} cache`,
                                ae = O(
                                    o().actionsBtn,
                                    nn() && o().actionsBtnOffline,
                                    'tsqd-actions-btn',
                                    'tsqd-action-mock-offline-behavior',
                                ),
                                te = `${nn() ? 'Unset offline mocking behavior' : 'Mock offline behavior'}`,
                                ce = nn(),
                                ye = `${nn() ? 'Unset offline mocking behavior' : 'Mock offline behavior'}`;
                            return (
                                ge !== M.e && I(D, (M.e = ge)),
                                Y !== M.t && I(T, (M.t = Y)),
                                vt !== M.a && I(k, (M.a = vt)),
                                V !== M.o && I(F, (M.o = V)),
                                Ne !== M.i && I(N, (M.i = Ne)),
                                Ce !== M.n && I(H, (M.n = Ce)),
                                It !== M.s && I(ee, (M.s = It)),
                                qe !== M.h && I(le, (M.h = qe)),
                                mt !== M.r && I(ie, (M.r = mt)),
                                kt !== M.d && I(re, (M.d = kt)),
                                tt !== M.l && I(se, (M.l = tt)),
                                Qe !== M.u && A(ue, 'aria-label', (M.u = Qe)),
                                nt !== M.c && A(ue, 'aria-pressed', (M.c = nt)),
                                P !== M.w && I(me, (M.w = P)),
                                oe !== M.m && I(Ae, (M.m = oe)),
                                Me !== M.f && A(Ae, 'title', (M.f = Me)),
                                ae !== M.y && I(he, (M.y = ae)),
                                te !== M.g && A(he, 'aria-label', (M.g = te)),
                                ce !== M.p && A(he, 'aria-pressed', (M.p = ce)),
                                ye !== M.b && A(he, 'title', (M.b = ye)),
                                M
                            );
                        },
                        {
                            e: void 0,
                            t: void 0,
                            a: void 0,
                            o: void 0,
                            i: void 0,
                            n: void 0,
                            s: void 0,
                            h: void 0,
                            r: void 0,
                            d: void 0,
                            l: void 0,
                            u: void 0,
                            c: void 0,
                            w: void 0,
                            m: void 0,
                            f: void 0,
                            y: void 0,
                            g: void 0,
                            p: void 0,
                            b: void 0,
                        },
                    ),
                    G(
                        () =>
                            (re.value =
                                a() === 'queries'
                                    ? e.localStore.filter || ''
                                    : e.localStore.mutationFilter || ''),
                    ),
                    D
                );
            })(),
            m(R, {
                get when() {
                    return ve(() => a() === 'queries')() && Ie();
                },
                get children() {
                    return m(i0, {});
                },
            }),
            m(R, {
                get when() {
                    return ve(() => a() === 'mutations')() && bt();
                },
                get children() {
                    return m(s0, {});
                },
            }),
        ];
    },
    t0 = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? We(n) : je(n))),
            { colors: o, alpha: s } = C,
            a = (h, p) => (t() === 'dark' ? p : h),
            l = pe(
                (h) => h().find({ queryKey: e.query.queryKey })?.state,
                !0,
                (h) => h.query.queryHash === e.query.queryHash,
            ),
            i = pe(
                (h) => h().find({ queryKey: e.query.queryKey })?.isDisabled() ?? !1,
                !0,
                (h) => h.query.queryHash === e.query.queryHash,
            ),
            u = pe(
                (h) => h().find({ queryKey: e.query.queryKey })?.isStatic() ?? !1,
                !0,
                (h) => h.query.queryHash === e.query.queryHash,
            ),
            g = pe(
                (h) => h().find({ queryKey: e.query.queryKey })?.isStale() ?? !1,
                !0,
                (h) => h.query.queryHash === e.query.queryHash,
            ),
            c = pe(
                (h) => h().find({ queryKey: e.query.queryKey })?.getObserversCount() ?? 0,
                !0,
                (h) => h.query.queryHash === e.query.queryHash,
            ),
            d = q(() => Ss({ queryState: l(), observerCount: c(), isStale: g() })),
            f = () =>
                d() === 'gray'
                    ? n`
        background-color: ${a(o[d()][200], o[d()][700])};
        color: ${a(o[d()][700], o[d()][300])};
      `
                    : n`
      background-color: ${a(o[d()][200] + s[80], o[d()][900])};
      color: ${a(o[d()][800], o[d()][300])};
    `;
        return m(R, {
            get when() {
                return l();
            },
            get children() {
                var h = vs(),
                    p = h.firstChild,
                    v = p.nextSibling;
                return (
                    (h.$$click = () => Bn(e.query.queryHash === Ie() ? null : e.query.queryHash)),
                    S(p, c),
                    S(v, () => e.query.queryHash),
                    S(
                        h,
                        m(R, {
                            get when() {
                                return i();
                            },
                            get children() {
                                return zd();
                            },
                        }),
                        null,
                    ),
                    S(
                        h,
                        m(R, {
                            get when() {
                                return u();
                            },
                            get children() {
                                return Kd();
                            },
                        }),
                        null,
                    ),
                    G(
                        (y) => {
                            var x = O(
                                    r().queryRow,
                                    Ie() === e.query.queryHash && r().selectedQueryRow,
                                    'tsqd-query-row',
                                ),
                                b = `Query key ${e.query.queryHash}${i() ? ', disabled' : ''}${u() ? ', static' : ''}`,
                                w = O(f(), 'tsqd-query-observer-count');
                            return (
                                x !== y.e && I(h, (y.e = x)),
                                b !== y.t && A(h, 'aria-label', (y.t = b)),
                                w !== y.a && I(p, (y.a = w)),
                                y
                            );
                        },
                        { e: void 0, t: void 0, a: void 0 },
                    ),
                    h
                );
            },
        });
    },
    n0 = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? We(n) : je(n))),
            { colors: o, alpha: s } = C,
            a = (d, f) => (t() === 'dark' ? f : d),
            l = Ge(
                (d) =>
                    d()
                        .getAll()
                        .find((p) => p.mutationId === e.mutation.mutationId)?.state,
            ),
            i = Ge((d) => {
                const h = d()
                    .getAll()
                    .find((p) => p.mutationId === e.mutation.mutationId);
                return h ? h.state.isPaused : !1;
            }),
            u = Ge((d) => {
                const h = d()
                    .getAll()
                    .find((p) => p.mutationId === e.mutation.mutationId);
                return h ? h.state.status : 'idle';
            }),
            g = q(() => zt({ isPaused: i(), status: u() })),
            c = () =>
                g() === 'gray'
                    ? n`
        background-color: ${a(o[g()][200], o[g()][700])};
        color: ${a(o[g()][700], o[g()][300])};
      `
                    : n`
      background-color: ${a(o[g()][200] + s[80], o[g()][900])};
      color: ${a(o[g()][800], o[g()][300])};
    `;
        return m(R, {
            get when() {
                return l();
            },
            get children() {
                var d = vs(),
                    f = d.firstChild,
                    h = f.nextSibling;
                return (
                    (d.$$click = () => {
                        ms(e.mutation.mutationId === bt() ? null : e.mutation.mutationId);
                    }),
                    S(
                        f,
                        m(R, {
                            get when() {
                                return g() === 'purple';
                            },
                            get children() {
                                return m(td, {});
                            },
                        }),
                        null,
                    ),
                    S(
                        f,
                        m(R, {
                            get when() {
                                return g() === 'green';
                            },
                            get children() {
                                return m(ar, {});
                            },
                        }),
                        null,
                    ),
                    S(
                        f,
                        m(R, {
                            get when() {
                                return g() === 'red';
                            },
                            get children() {
                                return m(ed, {});
                            },
                        }),
                        null,
                    ),
                    S(
                        f,
                        m(R, {
                            get when() {
                                return g() === 'yellow';
                            },
                            get children() {
                                return m(Jc, {});
                            },
                        }),
                        null,
                    ),
                    S(
                        h,
                        m(R, {
                            get when() {
                                return e.mutation.options.mutationKey;
                            },
                            get children() {
                                return [
                                    ve(() => JSON.stringify(e.mutation.options.mutationKey)),
                                    ' -',
                                    ' ',
                                ];
                            },
                        }),
                        null,
                    ),
                    S(h, () => new Date(e.mutation.state.submittedAt).toLocaleString(), null),
                    G(
                        (p) => {
                            var v = O(
                                    r().queryRow,
                                    bt() === e.mutation.mutationId && r().selectedQueryRow,
                                    'tsqd-query-row',
                                ),
                                y = `Mutation submitted at ${new Date(e.mutation.state.submittedAt).toLocaleString()}`,
                                x = O(c(), 'tsqd-query-observer-count');
                            return (
                                v !== p.e && I(d, (p.e = v)),
                                y !== p.t && A(d, 'aria-label', (p.t = y)),
                                x !== p.a && I(f, (p.a = x)),
                                p
                            );
                        },
                        { e: void 0, t: void 0, a: void 0 },
                    ),
                    d
                );
            },
        });
    },
    r0 = () => {
        const e = pe(
                (i) =>
                    i()
                        .getAll()
                        .filter((u) => qt(u) === 'stale').length,
            ),
            t = pe(
                (i) =>
                    i()
                        .getAll()
                        .filter((u) => qt(u) === 'fresh').length,
            ),
            n = pe(
                (i) =>
                    i()
                        .getAll()
                        .filter((u) => qt(u) === 'fetching').length,
            ),
            r = pe(
                (i) =>
                    i()
                        .getAll()
                        .filter((u) => qt(u) === 'paused').length,
            ),
            o = pe(
                (i) =>
                    i()
                        .getAll()
                        .filter((u) => qt(u) === 'inactive').length,
            ),
            s = $e(),
            a = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            l = q(() => (s() === 'dark' ? We(a) : je(a)));
        return (() => {
            var i = Kn();
            return (
                S(
                    i,
                    m(ut, {
                        label: 'Fresh',
                        color: 'green',
                        get count() {
                            return t();
                        },
                    }),
                    null,
                ),
                S(
                    i,
                    m(ut, {
                        label: 'Fetching',
                        color: 'blue',
                        get count() {
                            return n();
                        },
                    }),
                    null,
                ),
                S(
                    i,
                    m(ut, {
                        label: 'Paused',
                        color: 'purple',
                        get count() {
                            return r();
                        },
                    }),
                    null,
                ),
                S(
                    i,
                    m(ut, {
                        label: 'Stale',
                        color: 'yellow',
                        get count() {
                            return e();
                        },
                    }),
                    null,
                ),
                S(
                    i,
                    m(ut, {
                        label: 'Inactive',
                        color: 'gray',
                        get count() {
                            return o();
                        },
                    }),
                    null,
                ),
                G(() => I(i, O(l().queryStatusContainer, 'tsqd-query-status-container'))),
                i
            );
        })();
    },
    o0 = () => {
        const e = Ge(
                (l) =>
                    l()
                        .getAll()
                        .filter(
                            (i) =>
                                zt({ isPaused: i.state.isPaused, status: i.state.status }) ===
                                'green',
                        ).length,
            ),
            t = Ge(
                (l) =>
                    l()
                        .getAll()
                        .filter(
                            (i) =>
                                zt({ isPaused: i.state.isPaused, status: i.state.status }) ===
                                'yellow',
                        ).length,
            ),
            n = Ge(
                (l) =>
                    l()
                        .getAll()
                        .filter(
                            (i) =>
                                zt({ isPaused: i.state.isPaused, status: i.state.status }) ===
                                'purple',
                        ).length,
            ),
            r = Ge(
                (l) =>
                    l()
                        .getAll()
                        .filter(
                            (i) =>
                                zt({ isPaused: i.state.isPaused, status: i.state.status }) ===
                                'red',
                        ).length,
            ),
            o = $e(),
            s = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            a = q(() => (o() === 'dark' ? We(s) : je(s)));
        return (() => {
            var l = Kn();
            return (
                S(
                    l,
                    m(ut, {
                        label: 'Paused',
                        color: 'purple',
                        get count() {
                            return n();
                        },
                    }),
                    null,
                ),
                S(
                    l,
                    m(ut, {
                        label: 'Pending',
                        color: 'yellow',
                        get count() {
                            return t();
                        },
                    }),
                    null,
                ),
                S(
                    l,
                    m(ut, {
                        label: 'Success',
                        color: 'green',
                        get count() {
                            return e();
                        },
                    }),
                    null,
                ),
                S(
                    l,
                    m(ut, {
                        label: 'Error',
                        color: 'red',
                        get count() {
                            return r();
                        },
                    }),
                    null,
                ),
                G(() => I(l, O(a().queryStatusContainer, 'tsqd-query-status-container'))),
                l
            );
        })();
    },
    ut = (e) => {
        const t = $e(),
            n = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            r = q(() => (t() === 'dark' ? We(n) : je(n))),
            { colors: o, alpha: s } = C,
            a = (f, h) => (t() === 'dark' ? h : f);
        let l;
        const [i, u] = z(!1),
            [g, c] = z(!1),
            d = q(() => !((Ie() && ct() < js && ct() > Ht) || ct() < Ht));
        return (() => {
            var f = Hd(),
                h = f.firstChild,
                p = h.nextSibling,
                v = l;
            return (
                typeof v == 'function' ? sn(v, f) : (l = f),
                f.addEventListener('mouseleave', () => {
                    (u(!1), c(!1));
                }),
                f.addEventListener('mouseenter', () => u(!0)),
                f.addEventListener('blur', () => c(!1)),
                f.addEventListener('focus', () => c(!0)),
                Ds(
                    f,
                    j(
                        {
                            get disabled() {
                                return d();
                            },
                            get 'aria-label'() {
                                return `${e.label}: ${e.count}`;
                            },
                            get class() {
                                return O(
                                    r().queryStatusTag,
                                    !d() &&
                                        n`
            cursor: pointer;
            &:hover {
              background: ${a(o.gray[200], o.darkGray[400])}${s[80]};
            }
          `,
                                    'tsqd-query-status-tag',
                                    `tsqd-query-status-tag-${e.label.toLowerCase()}`,
                                );
                            },
                        },
                        () => (i() || g() ? { 'aria-describedby': 'tsqd-status-tooltip' } : {}),
                    ),
                    !1,
                    !0,
                ),
                S(
                    f,
                    m(R, {
                        get when() {
                            return ve(() => !d())() && (i() || g());
                        },
                        get children() {
                            var y = Bd();
                            return (
                                S(y, () => e.label),
                                G(() => I(y, O(r().statusTooltip, 'tsqd-query-status-tooltip'))),
                                y
                            );
                        },
                    }),
                    h,
                ),
                S(
                    f,
                    m(R, {
                        get when() {
                            return d();
                        },
                        get children() {
                            var y = Nd();
                            return (
                                S(y, () => e.label),
                                G(() =>
                                    I(y, O(r().queryStatusTagLabel, 'tsqd-query-status-tag-label')),
                                ),
                                y
                            );
                        },
                    }),
                    p,
                ),
                S(p, () => e.count),
                G(
                    (y) => {
                        var x = O(
                                n`
            width: ${C.size[1.5]};
            height: ${C.size[1.5]};
            border-radius: ${C.border.radius.full};
            background-color: ${C.colors[e.color][500]};
          `,
                                'tsqd-query-status-tag-dot',
                            ),
                            b = O(
                                r().queryStatusCount,
                                e.count > 0 &&
                                    e.color !== 'gray' &&
                                    n`
              background-color: ${a(o[e.color][100], o[e.color][900])};
              color: ${a(o[e.color][700], o[e.color][300])};
            `,
                                'tsqd-query-status-tag-count',
                            );
                        return (x !== y.e && I(h, (y.e = x)), b !== y.t && I(p, (y.t = b)), y);
                    },
                    { e: void 0, t: void 0 },
                ),
                f
            );
        })();
    },
    i0 = () => {
        const e = $e(),
            t = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            n = q(() => (e() === 'dark' ? We(t) : je(t))),
            { colors: r } = C,
            o = (k, F) => (e() === 'dark' ? F : k),
            s = K().client,
            [a, l] = z(!1),
            [i, u] = z('view'),
            [g, c] = z(!1),
            d = q(() => K().errorTypes || []),
            f = pe(
                (k) =>
                    k()
                        .getAll()
                        .find((F) => F.queryHash === Ie()),
                !1,
            ),
            h = pe(
                (k) =>
                    k()
                        .getAll()
                        .find((F) => F.queryHash === Ie()),
                !1,
            ),
            p = pe(
                (k) =>
                    k()
                        .getAll()
                        .find((F) => F.queryHash === Ie())?.state,
                !1,
            ),
            v = pe(
                (k) =>
                    k()
                        .getAll()
                        .find((F) => F.queryHash === Ie())?.state.data,
                !1,
            ),
            y = pe((k) => {
                const F = k()
                    .getAll()
                    .find((N) => N.queryHash === Ie());
                return F ? qt(F) : 'inactive';
            }),
            x = pe((k) => {
                const F = k()
                    .getAll()
                    .find((N) => N.queryHash === Ie());
                return F ? F.state.status : 'pending';
            }),
            b = pe(
                (k) =>
                    k()
                        .getAll()
                        .find((F) => F.queryHash === Ie())
                        ?.getObserversCount() ?? 0,
            ),
            w = q(() => ks(y())),
            $ = () => {
                (Ye({ type: 'REFETCH', queryHash: f()?.queryHash }),
                    f()
                        ?.fetch()
                        ?.catch(() => {}));
            },
            L = (k) => {
                const F = f();
                if (!F) return;
                Ye({ type: 'TRIGGER_ERROR', queryHash: F.queryHash, metadata: { error: k?.name } });
                const N = k?.initializer(F) ?? new Error('Unknown error from devtools'),
                    H = F.options;
                F.setState({
                    status: 'error',
                    error: N,
                    fetchMeta: { ...F.state.fetchMeta, __previousQueryOptions: H },
                });
            },
            D = () => {
                const k = f();
                if (!k) return;
                Ye({ type: 'RESTORE_LOADING', queryHash: k.queryHash });
                const F = k.state,
                    N = k.state.fetchMeta ? k.state.fetchMeta.__previousQueryOptions : null;
                (k.cancel({ silent: !0 }),
                    k.setState({ ...F, fetchStatus: 'idle', fetchMeta: null }),
                    N && k.fetch(N));
            };
        B(() => {
            y() !== 'fetching' && l(!1);
        });
        const T = () =>
            w() === 'gray'
                ? t`
        background-color: ${o(r[w()][200], r[w()][700])};
        color: ${o(r[w()][700], r[w()][300])};
        border-color: ${o(r[w()][400], r[w()][600])};
      `
                : t`
      background-color: ${o(r[w()][100], r[w()][900])};
      color: ${o(r[w()][700], r[w()][300])};
      border-color: ${o(r[w()][400], r[w()][600])};
    `;
        return m(R, {
            get when() {
                return ve(() => !!f())() && p();
            },
            get children() {
                var k = Wd(),
                    F = k.firstChild,
                    N = F.nextSibling,
                    H = N.firstChild,
                    ne = H.firstChild,
                    ee = ne.firstChild,
                    le = ne.nextSibling,
                    ie = H.nextSibling,
                    re = ie.firstChild,
                    se = re.nextSibling,
                    ue = ie.nextSibling,
                    me = ue.firstChild,
                    Ae = me.nextSibling,
                    he = N.nextSibling,
                    Ee = he.nextSibling,
                    M = Ee.firstChild,
                    ge = M.firstChild,
                    Y = M.nextSibling,
                    vt = Y.firstChild,
                    V = Y.nextSibling,
                    Ne = V.firstChild,
                    Ce = V.nextSibling,
                    It = Ce.firstChild,
                    qe = Ce.nextSibling,
                    mt = qe.firstChild,
                    kt = mt.nextSibling,
                    tt = Ee.nextSibling;
                tt.firstChild;
                var Qe = tt.nextSibling,
                    nt = Qe.nextSibling;
                return (
                    S(ee, () => Sn(f().queryKey, !0)),
                    S(le, y),
                    S(se, b),
                    S(Ae, () => new Date(p().dataUpdatedAt).toLocaleTimeString()),
                    (M.$$click = $),
                    (Y.$$click = () => {
                        (Ye({ type: 'INVALIDATE', queryHash: f()?.queryHash }),
                            s.invalidateQueries(f()));
                    }),
                    (V.$$click = () => {
                        (Ye({ type: 'RESET', queryHash: f()?.queryHash }), s.resetQueries(f()));
                    }),
                    (Ce.$$click = () => {
                        (Ye({ type: 'REMOVE', queryHash: f()?.queryHash }),
                            s.removeQueries(f()),
                            Bn(null));
                    }),
                    (qe.$$click = () => {
                        if (f()?.state.data === void 0) (l(!0), D());
                        else {
                            const P = f();
                            if (!P) return;
                            Ye({ type: 'TRIGGER_LOADING', queryHash: P.queryHash });
                            const oe = P.options;
                            (P.fetch({ ...oe, queryFn: () => new Promise(() => {}), gcTime: -1 }),
                                P.setState({
                                    data: void 0,
                                    status: 'pending',
                                    fetchMeta: { ...P.state.fetchMeta, __previousQueryOptions: oe },
                                }));
                        }
                    }),
                    S(qe, () => (x() === 'pending' ? 'Restore' : 'Trigger'), kt),
                    S(
                        Ee,
                        m(R, {
                            get when() {
                                return d().length === 0 || x() === 'error';
                            },
                            get children() {
                                var P = Gd(),
                                    oe = P.firstChild,
                                    Me = oe.nextSibling;
                                return (
                                    (P.$$click = () => {
                                        f().state.error
                                            ? (Ye({
                                                  type: 'RESTORE_ERROR',
                                                  queryHash: f()?.queryHash,
                                              }),
                                              s.resetQueries(f()))
                                            : L();
                                    }),
                                    S(P, () => (x() === 'error' ? 'Restore' : 'Trigger'), Me),
                                    G(
                                        (ae) => {
                                            var te = O(
                                                    t`
                  color: ${o(r.red[500], r.red[400])};
                `,
                                                    'tsqd-query-details-actions-btn',
                                                    'tsqd-query-details-action-error',
                                                ),
                                                ce = x() === 'pending',
                                                ye = t`
                  background-color: ${o(r.red[500], r.red[400])};
                `;
                                            return (
                                                te !== ae.e && I(P, (ae.e = te)),
                                                ce !== ae.t && (P.disabled = ae.t = ce),
                                                ye !== ae.a && I(oe, (ae.a = ye)),
                                                ae
                                            );
                                        },
                                        { e: void 0, t: void 0, a: void 0 },
                                    ),
                                    P
                                );
                            },
                        }),
                        null,
                    ),
                    S(
                        Ee,
                        m(R, {
                            get when() {
                                return !(d().length === 0 || x() === 'error');
                            },
                            get children() {
                                var P = Ud(),
                                    oe = P.firstChild,
                                    Me = oe.nextSibling,
                                    ae = Me.nextSibling;
                                return (
                                    ae.firstChild,
                                    ae.addEventListener('change', (te) => {
                                        const ce = d().find(
                                            (ye) => ye.name === te.currentTarget.value,
                                        );
                                        L(ce);
                                    }),
                                    S(
                                        ae,
                                        m(Es, {
                                            get each() {
                                                return d();
                                            },
                                            children: (te) =>
                                                (() => {
                                                    var ce = Qd();
                                                    return (
                                                        S(ce, () => te.name),
                                                        G(() => (ce.value = te.name)),
                                                        ce
                                                    );
                                                })(),
                                        }),
                                        null,
                                    ),
                                    S(P, m(Kt, {}), null),
                                    G(
                                        (te) => {
                                            var ce = O(
                                                    n().actionsSelect,
                                                    'tsqd-query-details-actions-btn',
                                                    'tsqd-query-details-action-error-multiple',
                                                ),
                                                ye = t`
                  background-color: ${C.colors.red[400]};
                `,
                                                X = x() === 'pending';
                                            return (
                                                ce !== te.e && I(P, (te.e = ce)),
                                                ye !== te.t && I(oe, (te.t = ye)),
                                                X !== te.a && (ae.disabled = te.a = X),
                                                te
                                            );
                                        },
                                        { e: void 0, t: void 0, a: void 0 },
                                    ),
                                    P
                                );
                            },
                        }),
                        null,
                    ),
                    S(tt, () => (i() === 'view' ? 'Explorer' : 'Editor'), null),
                    S(
                        k,
                        m(R, {
                            get when() {
                                return i() === 'view';
                            },
                            get children() {
                                var P = Vd();
                                return (
                                    S(
                                        P,
                                        m(pt, {
                                            label: 'Data',
                                            defaultExpanded: ['Data'],
                                            get value() {
                                                return v();
                                            },
                                            editable: !0,
                                            onEdit: () => u('edit'),
                                            get activeQuery() {
                                                return f();
                                            },
                                        }),
                                    ),
                                    G((oe) =>
                                        (oe = C.size[2]) != null
                                            ? P.style.setProperty('padding', oe)
                                            : P.style.removeProperty('padding'),
                                    ),
                                    P
                                );
                            },
                        }),
                        Qe,
                    ),
                    S(
                        k,
                        m(R, {
                            get when() {
                                return i() === 'edit';
                            },
                            get children() {
                                var P = jd(),
                                    oe = P.firstChild,
                                    Me = oe.nextSibling,
                                    ae = Me.firstChild,
                                    te = ae.nextSibling,
                                    ce = te.firstChild,
                                    ye = ce.nextSibling;
                                return (
                                    P.addEventListener('submit', (X) => {
                                        X.preventDefault();
                                        const ot = new FormData(X.currentTarget).get('data');
                                        try {
                                            const He = JSON.parse(ot);
                                            (f().setState({ ...f().state, data: He }), u('view'));
                                        } catch {
                                            c(!0);
                                        }
                                    }),
                                    oe.addEventListener('focus', () => c(!1)),
                                    S(ae, () => (g() ? 'Invalid Value' : '')),
                                    (ce.$$click = () => u('view')),
                                    G(
                                        (X) => {
                                            var rt = O(
                                                    n().devtoolsEditForm,
                                                    'tsqd-query-details-data-editor',
                                                ),
                                                ot = n().devtoolsEditTextarea,
                                                He = g(),
                                                Et = n().devtoolsEditFormActions,
                                                it = n().devtoolsEditFormError,
                                                Mt = n().devtoolsEditFormActionContainer,
                                                st = O(
                                                    n().devtoolsEditFormAction,
                                                    t`
                      color: ${o(r.gray[600], r.gray[300])};
                    `,
                                                ),
                                                yt = O(
                                                    n().devtoolsEditFormAction,
                                                    t`
                      color: ${o(r.blue[600], r.blue[400])};
                    `,
                                                );
                                            return (
                                                rt !== X.e && I(P, (X.e = rt)),
                                                ot !== X.t && I(oe, (X.t = ot)),
                                                He !== X.a && A(oe, 'data-error', (X.a = He)),
                                                Et !== X.o && I(Me, (X.o = Et)),
                                                it !== X.i && I(ae, (X.i = it)),
                                                Mt !== X.n && I(te, (X.n = Mt)),
                                                st !== X.s && I(ce, (X.s = st)),
                                                yt !== X.h && I(ye, (X.h = yt)),
                                                X
                                            );
                                        },
                                        {
                                            e: void 0,
                                            t: void 0,
                                            a: void 0,
                                            o: void 0,
                                            i: void 0,
                                            n: void 0,
                                            s: void 0,
                                            h: void 0,
                                        },
                                    ),
                                    G(() => (oe.value = JSON.stringify(v(), null, 2))),
                                    P
                                );
                            },
                        }),
                        Qe,
                    ),
                    S(
                        nt,
                        m(pt, {
                            label: 'Query',
                            defaultExpanded: ['Query', 'queryKey'],
                            get value() {
                                return h();
                            },
                        }),
                    ),
                    G(
                        (P) => {
                            var oe = O(n().detailsContainer, 'tsqd-query-details-container'),
                                Me = O(n().detailsHeader, 'tsqd-query-details-header'),
                                ae = O(n().detailsBody, 'tsqd-query-details-summary-container'),
                                te = O(n().queryDetailsStatus, T()),
                                ce = O(n().detailsHeader, 'tsqd-query-details-header'),
                                ye = O(n().actionsBody, 'tsqd-query-details-actions-container'),
                                X = O(
                                    t`
                color: ${o(r.blue[600], r.blue[400])};
              `,
                                    'tsqd-query-details-actions-btn',
                                    'tsqd-query-details-action-refetch',
                                ),
                                rt = y() === 'fetching',
                                ot = t`
                background-color: ${o(r.blue[600], r.blue[400])};
              `,
                                He = O(
                                    t`
                color: ${o(r.yellow[600], r.yellow[400])};
              `,
                                    'tsqd-query-details-actions-btn',
                                    'tsqd-query-details-action-invalidate',
                                ),
                                Et = x() === 'pending',
                                it = t`
                background-color: ${o(r.yellow[600], r.yellow[400])};
              `,
                                Mt = O(
                                    t`
                color: ${o(r.gray[600], r.gray[300])};
              `,
                                    'tsqd-query-details-actions-btn',
                                    'tsqd-query-details-action-reset',
                                ),
                                st = x() === 'pending',
                                yt = t`
                background-color: ${o(r.gray[600], r.gray[400])};
              `,
                                mn = O(
                                    t`
                color: ${o(r.pink[500], r.pink[400])};
              `,
                                    'tsqd-query-details-actions-btn',
                                    'tsqd-query-details-action-remove',
                                ),
                                Qt = y() === 'fetching',
                                yn = t`
                background-color: ${o(r.pink[500], r.pink[400])};
              `,
                                Pt = O(
                                    t`
                color: ${o(r.cyan[500], r.cyan[400])};
              `,
                                    'tsqd-query-details-actions-btn',
                                    'tsqd-query-details-action-loading',
                                ),
                                pn = a(),
                                Yt = t`
                background-color: ${o(r.cyan[500], r.cyan[400])};
              `,
                                Xt = O(n().detailsHeader, 'tsqd-query-details-header'),
                                Zt = O(n().detailsHeader, 'tsqd-query-details-header'),
                                Lt = C.size[2];
                            return (
                                oe !== P.e && I(k, (P.e = oe)),
                                Me !== P.t && I(F, (P.t = Me)),
                                ae !== P.a && I(N, (P.a = ae)),
                                te !== P.o && I(le, (P.o = te)),
                                ce !== P.i && I(he, (P.i = ce)),
                                ye !== P.n && I(Ee, (P.n = ye)),
                                X !== P.s && I(M, (P.s = X)),
                                rt !== P.h && (M.disabled = P.h = rt),
                                ot !== P.r && I(ge, (P.r = ot)),
                                He !== P.d && I(Y, (P.d = He)),
                                Et !== P.l && (Y.disabled = P.l = Et),
                                it !== P.u && I(vt, (P.u = it)),
                                Mt !== P.c && I(V, (P.c = Mt)),
                                st !== P.w && (V.disabled = P.w = st),
                                yt !== P.m && I(Ne, (P.m = yt)),
                                mn !== P.f && I(Ce, (P.f = mn)),
                                Qt !== P.y && (Ce.disabled = P.y = Qt),
                                yn !== P.g && I(It, (P.g = yn)),
                                Pt !== P.p && I(qe, (P.p = Pt)),
                                pn !== P.b && (qe.disabled = P.b = pn),
                                Yt !== P.T && I(mt, (P.T = Yt)),
                                Xt !== P.A && I(tt, (P.A = Xt)),
                                Zt !== P.O && I(Qe, (P.O = Zt)),
                                Lt !== P.I &&
                                    ((P.I = Lt) != null
                                        ? nt.style.setProperty('padding', Lt)
                                        : nt.style.removeProperty('padding')),
                                P
                            );
                        },
                        {
                            e: void 0,
                            t: void 0,
                            a: void 0,
                            o: void 0,
                            i: void 0,
                            n: void 0,
                            s: void 0,
                            h: void 0,
                            r: void 0,
                            d: void 0,
                            l: void 0,
                            u: void 0,
                            c: void 0,
                            w: void 0,
                            m: void 0,
                            f: void 0,
                            y: void 0,
                            g: void 0,
                            p: void 0,
                            b: void 0,
                            T: void 0,
                            A: void 0,
                            O: void 0,
                            I: void 0,
                        },
                    ),
                    k
                );
            },
        });
    },
    s0 = () => {
        const e = $e(),
            t = K().shadowDOMTarget ? W.bind({ target: K().shadowDOMTarget }) : W,
            n = q(() => (e() === 'dark' ? We(t) : je(t))),
            { colors: r } = C,
            o = (g, c) => (e() === 'dark' ? c : g),
            s = Ge((g) => {
                const d = g()
                    .getAll()
                    .find((f) => f.mutationId === bt());
                return d ? d.state.isPaused : !1;
            }),
            a = Ge((g) => {
                const d = g()
                    .getAll()
                    .find((f) => f.mutationId === bt());
                return d ? d.state.status : 'idle';
            }),
            l = q(() => zt({ isPaused: s(), status: a() })),
            i = Ge(
                (g) =>
                    g()
                        .getAll()
                        .find((c) => c.mutationId === bt()),
                !1,
            ),
            u = () =>
                l() === 'gray'
                    ? t`
        background-color: ${o(r[l()][200], r[l()][700])};
        color: ${o(r[l()][700], r[l()][300])};
        border-color: ${o(r[l()][400], r[l()][600])};
      `
                    : t`
      background-color: ${o(r[l()][100], r[l()][900])};
      color: ${o(r[l()][700], r[l()][300])};
      border-color: ${o(r[l()][400], r[l()][600])};
    `;
        return m(R, {
            get when() {
                return i();
            },
            get children() {
                var g = Yd(),
                    c = g.firstChild,
                    d = c.nextSibling,
                    f = d.firstChild,
                    h = f.firstChild,
                    p = h.firstChild,
                    v = h.nextSibling,
                    y = f.nextSibling,
                    x = y.firstChild,
                    b = x.nextSibling,
                    w = d.nextSibling,
                    $ = w.nextSibling,
                    L = $.nextSibling,
                    D = L.nextSibling,
                    T = D.nextSibling,
                    k = T.nextSibling,
                    F = k.nextSibling,
                    N = F.nextSibling;
                return (
                    S(
                        p,
                        m(R, {
                            get when() {
                                return i().options.mutationKey;
                            },
                            fallback: 'No mutationKey found',
                            get children() {
                                return Sn(i().options.mutationKey, !0);
                            },
                        }),
                    ),
                    S(
                        v,
                        m(R, {
                            get when() {
                                return l() === 'purple';
                            },
                            children: 'pending',
                        }),
                        null,
                    ),
                    S(
                        v,
                        m(R, {
                            get when() {
                                return l() !== 'purple';
                            },
                            get children() {
                                return a();
                            },
                        }),
                        null,
                    ),
                    S(b, () => new Date(i().state.submittedAt).toLocaleTimeString()),
                    S(
                        $,
                        m(pt, {
                            label: 'Variables',
                            defaultExpanded: ['Variables'],
                            get value() {
                                return i().state.variables;
                            },
                        }),
                    ),
                    S(
                        D,
                        m(pt, {
                            label: 'Context',
                            defaultExpanded: ['Context'],
                            get value() {
                                return i().state.context;
                            },
                        }),
                    ),
                    S(
                        k,
                        m(pt, {
                            label: 'Data',
                            defaultExpanded: ['Data'],
                            get value() {
                                return i().state.data;
                            },
                        }),
                    ),
                    S(
                        N,
                        m(pt, {
                            label: 'Mutation',
                            defaultExpanded: ['Mutation'],
                            get value() {
                                return i();
                            },
                        }),
                    ),
                    G(
                        (H) => {
                            var ne = O(n().detailsContainer, 'tsqd-query-details-container'),
                                ee = O(n().detailsHeader, 'tsqd-query-details-header'),
                                le = O(n().detailsBody, 'tsqd-query-details-summary-container'),
                                ie = O(n().queryDetailsStatus, u()),
                                re = O(n().detailsHeader, 'tsqd-query-details-header'),
                                se = C.size[2],
                                ue = O(n().detailsHeader, 'tsqd-query-details-header'),
                                me = C.size[2],
                                Ae = O(n().detailsHeader, 'tsqd-query-details-header'),
                                he = C.size[2],
                                Ee = O(n().detailsHeader, 'tsqd-query-details-header'),
                                M = C.size[2];
                            return (
                                ne !== H.e && I(g, (H.e = ne)),
                                ee !== H.t && I(c, (H.t = ee)),
                                le !== H.a && I(d, (H.a = le)),
                                ie !== H.o && I(v, (H.o = ie)),
                                re !== H.i && I(w, (H.i = re)),
                                se !== H.n &&
                                    ((H.n = se) != null
                                        ? $.style.setProperty('padding', se)
                                        : $.style.removeProperty('padding')),
                                ue !== H.s && I(L, (H.s = ue)),
                                me !== H.h &&
                                    ((H.h = me) != null
                                        ? D.style.setProperty('padding', me)
                                        : D.style.removeProperty('padding')),
                                Ae !== H.r && I(T, (H.r = Ae)),
                                he !== H.d &&
                                    ((H.d = he) != null
                                        ? k.style.setProperty('padding', he)
                                        : k.style.removeProperty('padding')),
                                Ee !== H.l && I(F, (H.l = Ee)),
                                M !== H.u &&
                                    ((H.u = M) != null
                                        ? N.style.setProperty('padding', M)
                                        : N.style.removeProperty('padding')),
                                H
                            );
                        },
                        {
                            e: void 0,
                            t: void 0,
                            a: void 0,
                            o: void 0,
                            i: void 0,
                            n: void 0,
                            s: void 0,
                            h: void 0,
                            r: void 0,
                            d: void 0,
                            l: void 0,
                            u: void 0,
                        },
                    ),
                    g
                );
            },
        });
    },
    Tn = new Map(),
    a0 = () => {
        const e = q(() => K().client.getQueryCache()),
            t = e().subscribe((n) => {
                Cs(() => {
                    for (const [r, o] of Tn.entries()) o.shouldUpdate(n) && o.setter(r(e));
                });
            });
        return (
            U(() => {
                (Tn.clear(), t());
            }),
            t
        );
    },
    pe = (e, t = !0, n = () => !0) => {
        const r = q(() => K().client.getQueryCache()),
            [o, s] = z(e(r), t ? void 0 : { equals: !1 });
        return (
            B(() => {
                s(e(r));
            }),
            Tn.set(e, { setter: s, shouldUpdate: n }),
            U(() => {
                Tn.delete(e);
            }),
            o
        );
    },
    Fn = new Map(),
    l0 = () => {
        const e = q(() => K().client.getMutationCache()),
            t = e().subscribe(() => {
                for (const [n, r] of Fn.entries())
                    queueMicrotask(() => {
                        r(n(e));
                    });
            });
        return (
            U(() => {
                (Fn.clear(), t());
            }),
            t
        );
    },
    Ge = (e, t = !0) => {
        const n = q(() => K().client.getMutationCache()),
            [r, o] = z(e(n), t ? void 0 : { equals: !1 });
        return (
            B(() => {
                o(e(n));
            }),
            Fn.set(e, o),
            U(() => {
                Fn.delete(e);
            }),
            r
        );
    },
    u0 = '@tanstack/query-devtools-event',
    Ye = ({ type: e, queryHash: t, metadata: n }) => {
        const r = new CustomEvent(u0, {
            detail: { type: e, queryHash: t, metadata: n },
            bubbles: !0,
            cancelable: !0,
        });
        window.dispatchEvent(r);
    },
    bs = (e, t) => {
        const { colors: n, font: r, size: o, alpha: s, shadow: a, border: l } = C,
            i = (u, g) => (e === 'light' ? u : g);
        return {
            devtoolsBtn: t`
      z-index: 100000;
      position: fixed;
      padding: 4px;
      text-align: left;

      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      box-shadow: ${a.md()};
      overflow: hidden;

      & div {
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        border-radius: 9999px;

        & svg {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        filter: blur(6px) saturate(1.2) contrast(1.1);
      }

      &:focus-within {
        outline-offset: 2px;
        outline: 3px solid ${n.green[600]};
      }

      & button {
        position: relative;
        z-index: 1;
        padding: 0;
        border-radius: 9999px;
        background-color: transparent;
        border: none;
        height: 40px;
        display: flex;
        width: 40px;
        overflow: hidden;
        cursor: pointer;
        outline: none;
        & svg {
          position: absolute;
          width: 100%;
          height: 100%;
        }
      }
    `,
            panel: t`
      position: fixed;
      z-index: 9999;
      display: flex;
      gap: ${C.size[0.5]};
      & * {
        box-sizing: border-box;
        text-transform: none;
      }

      & *::-webkit-scrollbar {
        width: 7px;
      }

      & *::-webkit-scrollbar-track {
        background: transparent;
      }

      & *::-webkit-scrollbar-thumb {
        background: ${i(n.gray[300], n.darkGray[200])};
      }

      & *::-webkit-scrollbar-thumb:hover {
        background: ${i(n.gray[400], n.darkGray[300])};
      }
    `,
            parentPanel: t`
      z-index: 9999;
      display: flex;
      height: 100%;
      gap: ${C.size[0.5]};
      & * {
        box-sizing: border-box;
        text-transform: none;
      }

      & *::-webkit-scrollbar {
        width: 7px;
      }

      & *::-webkit-scrollbar-track {
        background: transparent;
      }

      & *::-webkit-scrollbar-thumb {
        background: ${i(n.gray[300], n.darkGray[200])};
      }

      & *::-webkit-scrollbar-thumb:hover {
        background: ${i(n.gray[400], n.darkGray[300])};
      }
    `,
            'devtoolsBtn-position-bottom-right': t`
      bottom: 12px;
      right: 12px;
    `,
            'devtoolsBtn-position-bottom-left': t`
      bottom: 12px;
      left: 12px;
    `,
            'devtoolsBtn-position-top-left': t`
      top: 12px;
      left: 12px;
    `,
            'devtoolsBtn-position-top-right': t`
      top: 12px;
      right: 12px;
    `,
            'devtoolsBtn-position-relative': t`
      position: relative;
    `,
            'panel-position-top': t`
      top: 0;
      right: 0;
      left: 0;
      max-height: 90%;
      min-height: ${o[14]};
      border-bottom: ${i(n.gray[400], n.darkGray[300])} 1px solid;
    `,
            'panel-position-bottom': t`
      bottom: 0;
      right: 0;
      left: 0;
      max-height: 90%;
      min-height: ${o[14]};
      border-top: ${i(n.gray[400], n.darkGray[300])} 1px solid;
    `,
            'panel-position-right': t`
      bottom: 0;
      right: 0;
      top: 0;
      border-left: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      max-width: 90%;
    `,
            'panel-position-left': t`
      bottom: 0;
      left: 0;
      top: 0;
      border-right: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      max-width: 90%;
    `,
            closeBtn: t`
      position: absolute;
      cursor: pointer;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      background-color: ${i(n.gray[50], n.darkGray[700])};
      &:hover {
        background-color: ${i(n.gray[200], n.darkGray[500])};
      }
      &:focus-visible {
        outline: 2px solid ${n.blue[600]};
      }
      & svg {
        color: ${i(n.gray[600], n.gray[400])};
        width: ${o[2]};
        height: ${o[2]};
      }
    `,
            'closeBtn-position-top': t`
      bottom: 0;
      right: ${o[2]};
      transform: translate(0, 100%);
      border-right: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-left: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-top: none;
      border-bottom: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-radius: 0px 0px ${l.radius.sm} ${l.radius.sm};
      padding: ${o[0.5]} ${o[1.5]} ${o[1]} ${o[1.5]};

      &::after {
        content: ' ';
        position: absolute;
        bottom: 100%;
        left: -${o[2.5]};
        height: ${o[1.5]};
        width: calc(100% + ${o[5]});
      }

      & svg {
        transform: rotate(180deg);
      }
    `,
            'closeBtn-position-bottom': t`
      top: 0;
      right: ${o[2]};
      transform: translate(0, -100%);
      border-right: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-left: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-top: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-bottom: none;
      border-radius: ${l.radius.sm} ${l.radius.sm} 0px 0px;
      padding: ${o[1]} ${o[1.5]} ${o[0.5]} ${o[1.5]};

      &::after {
        content: ' ';
        position: absolute;
        top: 100%;
        left: -${o[2.5]};
        height: ${o[1.5]};
        width: calc(100% + ${o[5]});
      }
    `,
            'closeBtn-position-right': t`
      bottom: ${o[2]};
      left: 0;
      transform: translate(-100%, 0);
      border-right: none;
      border-left: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-top: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-bottom: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-radius: ${l.radius.sm} 0px 0px ${l.radius.sm};
      padding: ${o[1.5]} ${o[0.5]} ${o[1.5]} ${o[1]};

      &::after {
        content: ' ';
        position: absolute;
        left: 100%;
        height: calc(100% + ${o[5]});
        width: ${o[1.5]};
      }

      & svg {
        transform: rotate(-90deg);
      }
    `,
            'closeBtn-position-left': t`
      bottom: ${o[2]};
      right: 0;
      transform: translate(100%, 0);
      border-left: none;
      border-right: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-top: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-bottom: ${i(n.gray[400], n.darkGray[300])} 1px solid;
      border-radius: 0px ${l.radius.sm} ${l.radius.sm} 0px;
      padding: ${o[1.5]} ${o[1]} ${o[1.5]} ${o[0.5]};

      &::after {
        content: ' ';
        position: absolute;
        right: 100%;
        height: calc(100% + ${o[5]});
        width: ${o[1.5]};
      }

      & svg {
        transform: rotate(90deg);
      }
    `,
            queriesContainer: t`
      flex: 1 1 700px;
      background-color: ${i(n.gray[50], n.darkGray[700])};
      display: flex;
      flex-direction: column;
      & * {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      }
    `,
            dragHandle: t`
      position: absolute;
      transition: background-color 0.125s ease;
      &:hover {
        background-color: ${n.purple[400]}${i('', s[90])};
      }
      &:focus {
        outline: none;
        background-color: ${n.purple[400]}${i('', s[90])};
      }
      &:focus-visible {
        outline: 2px solid ${n.blue[800]};
        outline-offset: -2px;
        background-color: ${n.purple[400]}${i('', s[90])};
      }
      z-index: 4;
    `,
            'dragHandle-position-top': t`
      bottom: 0;
      width: 100%;
      height: 3px;
      cursor: ns-resize;
    `,
            'dragHandle-position-bottom': t`
      top: 0;
      width: 100%;
      height: 3px;
      cursor: ns-resize;
    `,
            'dragHandle-position-right': t`
      left: 0;
      width: 3px;
      height: 100%;
      cursor: ew-resize;
    `,
            'dragHandle-position-left': t`
      right: 0;
      width: 3px;
      height: 100%;
      cursor: ew-resize;
    `,
            row: t`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${C.size[2]} ${C.size[2.5]};
      gap: ${C.size[2.5]};
      border-bottom: ${i(n.gray[300], n.darkGray[500])} 1px solid;
      align-items: center;
      & > button {
        padding: 0;
        background: transparent;
        border: none;
        display: flex;
        gap: ${o[0.5]};
        flex-direction: column;
      }
    `,
            logoAndToggleContainer: t`
      display: flex;
      gap: ${C.size[3]};
      align-items: center;
    `,
            logo: t`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      gap: ${C.size[0.5]};
      padding: 0px;
      &:hover {
        opacity: 0.7;
      }
      &:focus-visible {
        outline-offset: 4px;
        border-radius: ${l.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
    `,
            tanstackLogo: t`
      font-size: ${r.size.md};
      font-weight: ${r.weight.bold};
      line-height: ${r.lineHeight.xs};
      white-space: nowrap;
      color: ${i(n.gray[600], n.gray[300])};
    `,
            queryFlavorLogo: t`
      font-weight: ${r.weight.semibold};
      font-size: ${r.size.xs};
      background: linear-gradient(
        to right,
        ${i('#ea4037, #ff9b11', '#dd524b, #e9a03b')}
      );
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,
            queryStatusContainer: t`
      display: flex;
      gap: ${C.size[2]};
      height: min-content;
    `,
            queryStatusTag: t`
      display: flex;
      gap: ${C.size[1.5]};
      box-sizing: border-box;
      height: ${C.size[6.5]};
      background: ${i(n.gray[50], n.darkGray[500])};
      color: ${i(n.gray[700], n.gray[300])};
      border-radius: ${C.border.radius.sm};
      font-size: ${r.size.sm};
      padding: ${C.size[1]};
      padding-left: ${C.size[1.5]};
      align-items: center;
      font-weight: ${r.weight.medium};
      border: ${i('1px solid ' + n.gray[300], '1px solid transparent')};
      user-select: none;
      position: relative;
      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid ${n.blue[800]};
      }
    `,
            queryStatusTagLabel: t`
      font-size: ${r.size.xs};
    `,
            queryStatusCount: t`
      font-size: ${r.size.xs};
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${i(n.gray[500], n.gray[400])};
      background-color: ${i(n.gray[200], n.darkGray[300])};
      border-radius: 2px;
      font-variant-numeric: tabular-nums;
      height: ${C.size[4.5]};
    `,
            statusTooltip: t`
      position: absolute;
      z-index: 1;
      background-color: ${i(n.gray[50], n.darkGray[500])};
      top: 100%;
      left: 50%;
      transform: translate(-50%, calc(${C.size[2]}));
      padding: ${C.size[0.5]} ${C.size[2]};
      border-radius: ${C.border.radius.sm};
      font-size: ${r.size.xs};
      border: 1px solid ${i(n.gray[400], n.gray[600])};
      color: ${i(n.gray[600], n.gray[300])};

      &::before {
        top: 0px;
        content: ' ';
        display: block;
        left: 50%;
        transform: translate(-50%, -100%);
        position: absolute;
        border-color: transparent transparent
          ${i(n.gray[400], n.gray[600])} transparent;
        border-style: solid;
        border-width: 7px;
        /* transform: rotate(180deg); */
      }

      &::after {
        top: 0px;
        content: ' ';
        display: block;
        left: 50%;
        transform: translate(-50%, calc(-100% + 2px));
        position: absolute;
        border-color: transparent transparent
          ${i(n.gray[100], n.darkGray[500])} transparent;
        border-style: solid;
        border-width: 7px;
      }
    `,
            filtersContainer: t`
      display: flex;
      gap: ${C.size[2]};
      & > button {
        cursor: pointer;
        padding: ${C.size[0.5]} ${C.size[1.5]} ${C.size[0.5]}
          ${C.size[2]};
        border-radius: ${C.border.radius.sm};
        background-color: ${i(n.gray[100], n.darkGray[400])};
        border: 1px solid ${i(n.gray[300], n.darkGray[200])};
        color: ${i(n.gray[700], n.gray[300])};
        font-size: ${r.size.xs};
        display: flex;
        align-items: center;
        line-height: ${r.lineHeight.sm};
        gap: ${C.size[1.5]};
        max-width: 160px;
        &:focus-visible {
          outline-offset: 2px;
          border-radius: ${l.radius.xs};
          outline: 2px solid ${n.blue[800]};
        }
        & svg {
          width: ${C.size[3]};
          height: ${C.size[3]};
          color: ${i(n.gray[500], n.gray[400])};
        }
      }
    `,
            filterInput: t`
      padding: ${o[0.5]} ${o[2]};
      border-radius: ${C.border.radius.sm};
      background-color: ${i(n.gray[100], n.darkGray[400])};
      display: flex;
      box-sizing: content-box;
      align-items: center;
      gap: ${C.size[1.5]};
      max-width: 160px;
      min-width: 100px;
      border: 1px solid ${i(n.gray[300], n.darkGray[200])};
      height: min-content;
      color: ${i(n.gray[600], n.gray[400])};
      & > svg {
        width: ${o[3]};
        height: ${o[3]};
      }
      & input {
        font-size: ${r.size.xs};
        width: 100%;
        background-color: ${i(n.gray[100], n.darkGray[400])};
        border: none;
        padding: 0;
        line-height: ${r.lineHeight.sm};
        color: ${i(n.gray[700], n.gray[300])};
        &::placeholder {
          color: ${i(n.gray[700], n.gray[300])};
        }
        &:focus {
          outline: none;
        }
      }

      &:focus-within {
        outline-offset: 2px;
        border-radius: ${l.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
    `,
            filterSelect: t`
      padding: ${C.size[0.5]} ${C.size[2]};
      border-radius: ${C.border.radius.sm};
      background-color: ${i(n.gray[100], n.darkGray[400])};
      display: flex;
      align-items: center;
      gap: ${C.size[1.5]};
      box-sizing: content-box;
      max-width: 160px;
      border: 1px solid ${i(n.gray[300], n.darkGray[200])};
      height: min-content;
      & > svg {
        color: ${i(n.gray[600], n.gray[400])};
        width: ${C.size[2]};
        height: ${C.size[2]};
      }
      & > select {
        appearance: none;
        color: ${i(n.gray[700], n.gray[300])};
        min-width: 100px;
        line-height: ${r.lineHeight.sm};
        font-size: ${r.size.xs};
        background-color: ${i(n.gray[100], n.darkGray[400])};
        border: none;
        &:focus {
          outline: none;
        }
      }
      &:focus-within {
        outline-offset: 2px;
        border-radius: ${l.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
    `,
            actionsContainer: t`
      display: flex;
      gap: ${C.size[2]};
    `,
            actionsBtn: t`
      border-radius: ${C.border.radius.sm};
      background-color: ${i(n.gray[100], n.darkGray[400])};
      border: 1px solid ${i(n.gray[300], n.darkGray[200])};
      width: ${C.size[6.5]};
      height: ${C.size[6.5]};
      justify-content: center;
      display: flex;
      align-items: center;
      gap: ${C.size[1.5]};
      max-width: 160px;
      cursor: pointer;
      padding: 0;
      &:hover {
        background-color: ${i(n.gray[200], n.darkGray[500])};
      }
      & svg {
        color: ${i(n.gray[700], n.gray[300])};
        width: ${C.size[3]};
        height: ${C.size[3]};
      }
      &:focus-visible {
        outline-offset: 2px;
        border-radius: ${l.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
    `,
            actionsBtnOffline: t`
      & svg {
        stroke: ${i(n.yellow[700], n.yellow[500])};
        fill: ${i(n.yellow[700], n.yellow[500])};
      }
    `,
            overflowQueryContainer: t`
      flex: 1;
      overflow-y: auto;
      & > div {
        display: flex;
        flex-direction: column;
      }
    `,
            queryRow: t`
      display: flex;
      align-items: center;
      padding: 0;
      border: none;
      cursor: pointer;
      color: ${i(n.gray[700], n.gray[300])};
      background-color: ${i(n.gray[50], n.darkGray[700])};
      line-height: 1;
      &:focus {
        outline: none;
      }
      &:focus-visible {
        outline-offset: -2px;
        border-radius: ${l.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
      &:hover .tsqd-query-hash {
        background-color: ${i(n.gray[200], n.darkGray[600])};
      }

      & .tsqd-query-observer-count {
        padding: 0 ${C.size[1]};
        user-select: none;
        min-width: ${C.size[6.5]};
        align-self: stretch;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${r.size.xs};
        font-weight: ${r.weight.medium};
        border-bottom-width: 1px;
        border-bottom-style: solid;
        border-bottom: 1px solid ${i(n.gray[300], n.darkGray[700])};
      }
      & .tsqd-query-hash {
        user-select: text;
        font-size: ${r.size.xs};
        display: flex;
        align-items: center;
        min-height: ${C.size[6]};
        flex: 1;
        padding: ${C.size[1]} ${C.size[2]};
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
        border-bottom: 1px solid ${i(n.gray[300], n.darkGray[400])};
        text-align: left;
        text-overflow: clip;
        word-break: break-word;
      }

      & .tsqd-query-disabled-indicator {
        align-self: stretch;
        display: flex;
        align-items: center;
        padding: 0 ${C.size[2]};
        color: ${i(n.gray[800], n.gray[300])};
        background-color: ${i(n.gray[300], n.darkGray[600])};
        border-bottom: 1px solid ${i(n.gray[300], n.darkGray[400])};
        font-size: ${r.size.xs};
      }

      & .tsqd-query-static-indicator {
        align-self: stretch;
        display: flex;
        align-items: center;
        padding: 0 ${C.size[2]};
        color: ${i(n.teal[800], n.teal[300])};
        background-color: ${i(n.teal[100], n.teal[900])};
        border-bottom: 1px solid ${i(n.teal[300], n.teal[700])};
        font-size: ${r.size.xs};
      }
    `,
            selectedQueryRow: t`
      background-color: ${i(n.gray[200], n.darkGray[500])};
    `,
            detailsContainer: t`
      flex: 1 1 700px;
      background-color: ${i(n.gray[50], n.darkGray[700])};
      color: ${i(n.gray[700], n.gray[300])};
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      display: flex;
      text-align: left;
    `,
            detailsHeader: t`
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      position: sticky;
      top: 0;
      z-index: 2;
      background-color: ${i(n.gray[200], n.darkGray[600])};
      padding: ${C.size[1.5]} ${C.size[2]};
      font-weight: ${r.weight.medium};
      font-size: ${r.size.xs};
      line-height: ${r.lineHeight.xs};
      text-align: left;
    `,
            detailsBody: t`
      margin: ${C.size[1.5]} 0px ${C.size[2]} 0px;
      & > div {
        display: flex;
        align-items: stretch;
        padding: 0 ${C.size[2]};
        line-height: ${r.lineHeight.sm};
        justify-content: space-between;
        & > span {
          font-size: ${r.size.xs};
        }
        & > span:nth-child(2) {
          font-variant-numeric: tabular-nums;
        }
      }

      & > div:first-child {
        margin-bottom: ${C.size[1.5]};
      }

      & code {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
        margin: 0;
        font-size: ${r.size.xs};
        line-height: ${r.lineHeight.xs};
        max-width: 100%;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      & pre {
        margin: 0;
        display: flex;
        align-items: center;
      }
    `,
            queryDetailsStatus: t`
      border: 1px solid ${n.darkGray[200]};
      border-radius: ${C.border.radius.sm};
      font-weight: ${r.weight.medium};
      padding: ${C.size[1]} ${C.size[2.5]};
    `,
            actionsBody: t`
      flex-wrap: wrap;
      margin: ${C.size[2]} 0px ${C.size[2]} 0px;
      display: flex;
      gap: ${C.size[2]};
      padding: 0px ${C.size[2]};
      & > button {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
        font-size: ${r.size.xs};
        padding: ${C.size[1]} ${C.size[2]};
        display: flex;
        border-radius: ${C.border.radius.sm};
        background-color: ${i(n.gray[100], n.darkGray[600])};
        border: 1px solid ${i(n.gray[300], n.darkGray[400])};
        align-items: center;
        gap: ${C.size[2]};
        font-weight: ${r.weight.medium};
        line-height: ${r.lineHeight.xs};
        cursor: pointer;
        &:focus-visible {
          outline-offset: 2px;
          border-radius: ${l.radius.xs};
          outline: 2px solid ${n.blue[800]};
        }
        &:hover {
          background-color: ${i(n.gray[200], n.darkGray[500])};
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        & > span {
          width: ${o[1.5]};
          height: ${o[1.5]};
          border-radius: ${C.border.radius.full};
        }
      }
    `,
            actionsSelect: t`
      font-size: ${r.size.xs};
      padding: ${C.size[0.5]} ${C.size[2]};
      display: flex;
      border-radius: ${C.border.radius.sm};
      overflow: hidden;
      background-color: ${i(n.gray[100], n.darkGray[600])};
      border: 1px solid ${i(n.gray[300], n.darkGray[400])};
      align-items: center;
      gap: ${C.size[2]};
      font-weight: ${r.weight.medium};
      line-height: ${r.lineHeight.sm};
      color: ${i(n.red[500], n.red[400])};
      cursor: pointer;
      position: relative;
      &:hover {
        background-color: ${i(n.gray[200], n.darkGray[500])};
      }
      & > span {
        width: ${o[1.5]};
        height: ${o[1.5]};
        border-radius: ${C.border.radius.full};
      }
      &:focus-within {
        outline-offset: 2px;
        border-radius: ${l.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
      & select {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        appearance: none;
        background-color: transparent;
        border: none;
        color: transparent;
        outline: none;
      }

      & svg path {
        stroke: ${C.colors.red[400]};
      }
      & svg {
        width: ${C.size[2]};
        height: ${C.size[2]};
      }
    `,
            settingsMenu: t`
      display: flex;
      & * {
        font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      }
      flex-direction: column;
      gap: ${o[0.5]};
      border-radius: ${C.border.radius.sm};
      border: 1px solid ${i(n.gray[300], n.gray[700])};
      background-color: ${i(n.gray[50], n.darkGray[600])};
      font-size: ${r.size.xs};
      color: ${i(n.gray[700], n.gray[300])};
      z-index: 99999;
      min-width: 120px;
      padding: ${o[0.5]};
    `,
            settingsSubTrigger: t`
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: ${C.border.radius.xs};
      padding: ${C.size[1]} ${C.size[1]};
      cursor: pointer;
      background-color: transparent;
      border: none;
      color: ${i(n.gray[700], n.gray[300])};
      & svg {
        color: ${i(n.gray[600], n.gray[400])};
        transform: rotate(-90deg);
        width: ${C.size[2]};
        height: ${C.size[2]};
      }
      &:hover {
        background-color: ${i(n.gray[200], n.darkGray[500])};
      }
      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid ${n.blue[800]};
      }
      &.data-disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
            settingsMenuHeader: t`
      padding: ${C.size[1]} ${C.size[1]};
      font-weight: ${r.weight.medium};
      border-bottom: 1px solid ${i(n.gray[300], n.darkGray[400])};
      color: ${i(n.gray[500], n.gray[400])};
      font-size: ${r.size.xs};
    `,
            settingsSubButton: t`
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: ${i(n.gray[700], n.gray[300])};
      font-size: ${r.size.xs};
      border-radius: ${C.border.radius.xs};
      padding: ${C.size[1]} ${C.size[1]};
      cursor: pointer;
      background-color: transparent;
      border: none;
      & svg {
        color: ${i(n.gray[600], n.gray[400])};
      }
      &:hover {
        background-color: ${i(n.gray[200], n.darkGray[500])};
      }
      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid ${n.blue[800]};
      }
      &[data-checked] {
        background-color: ${i(n.purple[100], n.purple[900])};
        color: ${i(n.purple[700], n.purple[300])};
        & svg {
          color: ${i(n.purple[700], n.purple[300])};
        }
        &:hover {
          background-color: ${i(n.purple[100], n.purple[900])};
        }
      }
    `,
            viewToggle: t`
      border-radius: ${C.border.radius.sm};
      background-color: ${i(n.gray[200], n.darkGray[600])};
      border: 1px solid ${i(n.gray[300], n.darkGray[200])};
      display: flex;
      padding: 0;
      font-size: ${r.size.xs};
      color: ${i(n.gray[700], n.gray[300])};
      overflow: hidden;

      &:has(:focus-visible) {
        outline: 2px solid ${n.blue[800]};
      }

      & .tsqd-radio-toggle {
        opacity: 0.5;
        display: flex;
        & label {
          display: flex;
          align-items: center;
          cursor: pointer;
          line-height: ${r.lineHeight.md};
        }

        & label:hover {
          background-color: ${i(n.gray[100], n.darkGray[500])};
        }
      }

      & > [data-checked] {
        opacity: 1;
        background-color: ${i(n.gray[100], n.darkGray[400])};
        & label:hover {
          background-color: ${i(n.gray[100], n.darkGray[400])};
        }
      }

      & .tsqd-radio-toggle:first-child {
        & label {
          padding: 0 ${C.size[1.5]} 0 ${C.size[2]};
        }
        border-right: 1px solid ${i(n.gray[300], n.darkGray[200])};
      }

      & .tsqd-radio-toggle:nth-child(2) {
        & label {
          padding: 0 ${C.size[2]} 0 ${C.size[1.5]};
        }
      }
    `,
            devtoolsEditForm: t`
      padding: ${o[2]};
      & > [data-error='true'] {
        outline: 2px solid ${i(n.red[200], n.red[800])};
        outline-offset: 2px;
        border-radius: ${l.radius.xs};
      }
    `,
            devtoolsEditTextarea: t`
      width: 100%;
      max-height: 500px;
      font-family: 'Fira Code', monospace;
      font-size: ${r.size.xs};
      border-radius: ${l.radius.sm};
      field-sizing: content;
      padding: ${o[2]};
      background-color: ${i(n.gray[100], n.darkGray[800])};
      color: ${i(n.gray[900], n.gray[100])};
      border: 1px solid ${i(n.gray[200], n.gray[700])};
      resize: none;
      &:focus {
        outline-offset: 2px;
        border-radius: ${l.radius.xs};
        outline: 2px solid ${i(n.blue[200], n.blue[800])};
      }
    `,
            devtoolsEditFormActions: t`
      display: flex;
      justify-content: space-between;
      gap: ${o[2]};
      align-items: center;
      padding-top: ${o[1]};
      font-size: ${r.size.xs};
    `,
            devtoolsEditFormError: t`
      color: ${i(n.red[700], n.red[500])};
    `,
            devtoolsEditFormActionContainer: t`
      display: flex;
      gap: ${o[2]};
    `,
            devtoolsEditFormAction: t`
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      font-size: ${r.size.xs};
      padding: ${o[1]} ${C.size[2]};
      display: flex;
      border-radius: ${l.radius.sm};
      background-color: ${i(n.gray[100], n.darkGray[600])};
      border: 1px solid ${i(n.gray[300], n.darkGray[400])};
      align-items: center;
      gap: ${o[2]};
      font-weight: ${r.weight.medium};
      line-height: ${r.lineHeight.xs};
      cursor: pointer;
      &:focus-visible {
        outline-offset: 2px;
        border-radius: ${l.radius.xs};
        outline: 2px solid ${n.blue[800]};
      }
      &:hover {
        background-color: ${i(n.gray[200], n.darkGray[500])};
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
        };
    },
    je = (e) => bs('light', e),
    We = (e) => bs('dark', e);
lr(['click', 'mousedown', 'keydown', 'input']);
var c0 = (e) => {
        const [t, n] = Us({ prefix: 'TanstackQueryDevtools' }),
            r = _s(),
            o = q(() => {
                const s = e.theme || t.theme_preference || Qs;
                return s !== 'system' ? s : r();
            });
        return m(No.Provider, {
            value: e,
            get children() {
                return m(ea, {
                    localStore: t,
                    setLocalStore: n,
                    get children() {
                        return m(Go.Provider, {
                            value: o,
                            get children() {
                                return m(Zd, { localStore: t, setLocalStore: n });
                            },
                        });
                    },
                });
            },
        });
    },
    f0 = c0;
export { f0 as default };
