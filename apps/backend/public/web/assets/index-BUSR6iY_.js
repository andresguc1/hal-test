(function () {
    const t = document.createElement('link').relList;
    if (t && t.supports && t.supports('modulepreload')) return;
    for (const i of document.querySelectorAll('link[rel="modulepreload"]')) r(i);
    new MutationObserver((i) => {
        for (const s of i)
            if (s.type === 'childList')
                for (const o of s.addedNodes)
                    o.tagName === 'LINK' && o.rel === 'modulepreload' && r(o);
    }).observe(document, { childList: !0, subtree: !0 });
    function n(i) {
        const s = {};
        return (
            i.integrity && (s.integrity = i.integrity),
            i.referrerPolicy && (s.referrerPolicy = i.referrerPolicy),
            i.crossOrigin === 'use-credentials'
                ? (s.credentials = 'include')
                : i.crossOrigin === 'anonymous'
                  ? (s.credentials = 'omit')
                  : (s.credentials = 'same-origin'),
            s
        );
    }
    function r(i) {
        if (i.ep) return;
        i.ep = !0;
        const s = n(i);
        fetch(i.href, s);
    }
})();
function Fg(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
}
var Vf = { exports: {} },
    Is = {},
    bf = { exports: {} },
    F = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var di = Symbol.for('react.element'),
    zg = Symbol.for('react.portal'),
    Bg = Symbol.for('react.fragment'),
    $g = Symbol.for('react.strict_mode'),
    Ug = Symbol.for('react.profiler'),
    Hg = Symbol.for('react.provider'),
    Wg = Symbol.for('react.context'),
    Kg = Symbol.for('react.forward_ref'),
    Gg = Symbol.for('react.suspense'),
    Qg = Symbol.for('react.memo'),
    Yg = Symbol.for('react.lazy'),
    $u = Symbol.iterator;
function Xg(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = ($u && e[$u]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var _f = {
        isMounted: function () {
            return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
    },
    If = Object.assign,
    Ff = {};
function sr(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = Ff), (this.updater = n || _f));
}
sr.prototype.isReactComponent = {};
sr.prototype.setState = function (e, t) {
    if (typeof e != 'object' && typeof e != 'function' && e != null)
        throw Error(
            'setState(...): takes an object of state variables to update or a function which returns an object of state variables.',
        );
    this.updater.enqueueSetState(this, e, t, 'setState');
};
sr.prototype.forceUpdate = function (e) {
    this.updater.enqueueForceUpdate(this, e, 'forceUpdate');
};
function zf() {}
zf.prototype = sr.prototype;
function cl(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = Ff), (this.updater = n || _f));
}
var dl = (cl.prototype = new zf());
dl.constructor = cl;
If(dl, sr.prototype);
dl.isPureReactComponent = !0;
var Uu = Array.isArray,
    Bf = Object.prototype.hasOwnProperty,
    fl = { current: null },
    $f = { key: !0, ref: !0, __self: !0, __source: !0 };
function Uf(e, t, n) {
    var r,
        i = {},
        s = null,
        o = null;
    if (t != null)
        for (r in (t.ref !== void 0 && (o = t.ref), t.key !== void 0 && (s = '' + t.key), t))
            Bf.call(t, r) && !$f.hasOwnProperty(r) && (i[r] = t[r]);
    var a = arguments.length - 2;
    if (a === 1) i.children = n;
    else if (1 < a) {
        for (var l = Array(a), u = 0; u < a; u++) l[u] = arguments[u + 2];
        i.children = l;
    }
    if (e && e.defaultProps) for (r in ((a = e.defaultProps), a)) i[r] === void 0 && (i[r] = a[r]);
    return { $$typeof: di, type: e, key: s, ref: o, props: i, _owner: fl.current };
}
function Zg(e, t) {
    return { $$typeof: di, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function hl(e) {
    return typeof e == 'object' && e !== null && e.$$typeof === di;
}
function qg(e) {
    var t = { '=': '=0', ':': '=2' };
    return (
        '$' +
        e.replace(/[=:]/g, function (n) {
            return t[n];
        })
    );
}
var Hu = /\/+/g;
function lo(e, t) {
    return typeof e == 'object' && e !== null && e.key != null ? qg('' + e.key) : t.toString(36);
}
function Ui(e, t, n, r, i) {
    var s = typeof e;
    (s === 'undefined' || s === 'boolean') && (e = null);
    var o = !1;
    if (e === null) o = !0;
    else
        switch (s) {
            case 'string':
            case 'number':
                o = !0;
                break;
            case 'object':
                switch (e.$$typeof) {
                    case di:
                    case zg:
                        o = !0;
                }
        }
    if (o)
        return (
            (o = e),
            (i = i(o)),
            (e = r === '' ? '.' + lo(o, 0) : r),
            Uu(i)
                ? ((n = ''),
                  e != null && (n = e.replace(Hu, '$&/') + '/'),
                  Ui(i, t, n, '', function (u) {
                      return u;
                  }))
                : i != null &&
                  (hl(i) &&
                      (i = Zg(
                          i,
                          n +
                              (!i.key || (o && o.key === i.key)
                                  ? ''
                                  : ('' + i.key).replace(Hu, '$&/') + '/') +
                              e,
                      )),
                  t.push(i)),
            1
        );
    if (((o = 0), (r = r === '' ? '.' : r + ':'), Uu(e)))
        for (var a = 0; a < e.length; a++) {
            s = e[a];
            var l = r + lo(s, a);
            o += Ui(s, t, n, l, i);
        }
    else if (((l = Xg(e)), typeof l == 'function'))
        for (e = l.call(e), a = 0; !(s = e.next()).done; )
            ((s = s.value), (l = r + lo(s, a++)), (o += Ui(s, t, n, l, i)));
    else if (s === 'object')
        throw (
            (t = String(e)),
            Error(
                'Objects are not valid as a React child (found: ' +
                    (t === '[object Object]'
                        ? 'object with keys {' + Object.keys(e).join(', ') + '}'
                        : t) +
                    '). If you meant to render a collection of children, use an array instead.',
            )
        );
    return o;
}
function Si(e, t, n) {
    if (e == null) return e;
    var r = [],
        i = 0;
    return (
        Ui(e, r, '', '', function (s) {
            return t.call(n, s, i++);
        }),
        r
    );
}
function Jg(e) {
    if (e._status === -1) {
        var t = e._result;
        ((t = t()),
            t.then(
                function (n) {
                    (e._status === 0 || e._status === -1) && ((e._status = 1), (e._result = n));
                },
                function (n) {
                    (e._status === 0 || e._status === -1) && ((e._status = 2), (e._result = n));
                },
            ),
            e._status === -1 && ((e._status = 0), (e._result = t)));
    }
    if (e._status === 1) return e._result.default;
    throw e._result;
}
var Ee = { current: null },
    Hi = { transition: null },
    ey = { ReactCurrentDispatcher: Ee, ReactCurrentBatchConfig: Hi, ReactCurrentOwner: fl };
function Hf() {
    throw Error('act(...) is not supported in production builds of React.');
}
F.Children = {
    map: Si,
    forEach: function (e, t, n) {
        Si(
            e,
            function () {
                t.apply(this, arguments);
            },
            n,
        );
    },
    count: function (e) {
        var t = 0;
        return (
            Si(e, function () {
                t++;
            }),
            t
        );
    },
    toArray: function (e) {
        return (
            Si(e, function (t) {
                return t;
            }) || []
        );
    },
    only: function (e) {
        if (!hl(e))
            throw Error('React.Children.only expected to receive a single React element child.');
        return e;
    },
};
F.Component = sr;
F.Fragment = Bg;
F.Profiler = Ug;
F.PureComponent = cl;
F.StrictMode = $g;
F.Suspense = Gg;
F.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ey;
F.act = Hf;
F.cloneElement = function (e, t, n) {
    if (e == null)
        throw Error(
            'React.cloneElement(...): The argument must be a React element, but you passed ' +
                e +
                '.',
        );
    var r = If({}, e.props),
        i = e.key,
        s = e.ref,
        o = e._owner;
    if (t != null) {
        if (
            (t.ref !== void 0 && ((s = t.ref), (o = fl.current)),
            t.key !== void 0 && (i = '' + t.key),
            e.type && e.type.defaultProps)
        )
            var a = e.type.defaultProps;
        for (l in t)
            Bf.call(t, l) &&
                !$f.hasOwnProperty(l) &&
                (r[l] = t[l] === void 0 && a !== void 0 ? a[l] : t[l]);
    }
    var l = arguments.length - 2;
    if (l === 1) r.children = n;
    else if (1 < l) {
        a = Array(l);
        for (var u = 0; u < l; u++) a[u] = arguments[u + 2];
        r.children = a;
    }
    return { $$typeof: di, type: e.type, key: i, ref: s, props: r, _owner: o };
};
F.createContext = function (e) {
    return (
        (e = {
            $$typeof: Wg,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
            _defaultValue: null,
            _globalName: null,
        }),
        (e.Provider = { $$typeof: Hg, _context: e }),
        (e.Consumer = e)
    );
};
F.createElement = Uf;
F.createFactory = function (e) {
    var t = Uf.bind(null, e);
    return ((t.type = e), t);
};
F.createRef = function () {
    return { current: null };
};
F.forwardRef = function (e) {
    return { $$typeof: Kg, render: e };
};
F.isValidElement = hl;
F.lazy = function (e) {
    return { $$typeof: Yg, _payload: { _status: -1, _result: e }, _init: Jg };
};
F.memo = function (e, t) {
    return { $$typeof: Qg, type: e, compare: t === void 0 ? null : t };
};
F.startTransition = function (e) {
    var t = Hi.transition;
    Hi.transition = {};
    try {
        e();
    } finally {
        Hi.transition = t;
    }
};
F.unstable_act = Hf;
F.useCallback = function (e, t) {
    return Ee.current.useCallback(e, t);
};
F.useContext = function (e) {
    return Ee.current.useContext(e);
};
F.useDebugValue = function () {};
F.useDeferredValue = function (e) {
    return Ee.current.useDeferredValue(e);
};
F.useEffect = function (e, t) {
    return Ee.current.useEffect(e, t);
};
F.useId = function () {
    return Ee.current.useId();
};
F.useImperativeHandle = function (e, t, n) {
    return Ee.current.useImperativeHandle(e, t, n);
};
F.useInsertionEffect = function (e, t) {
    return Ee.current.useInsertionEffect(e, t);
};
F.useLayoutEffect = function (e, t) {
    return Ee.current.useLayoutEffect(e, t);
};
F.useMemo = function (e, t) {
    return Ee.current.useMemo(e, t);
};
F.useReducer = function (e, t, n) {
    return Ee.current.useReducer(e, t, n);
};
F.useRef = function (e) {
    return Ee.current.useRef(e);
};
F.useState = function (e) {
    return Ee.current.useState(e);
};
F.useSyncExternalStore = function (e, t, n) {
    return Ee.current.useSyncExternalStore(e, t, n);
};
F.useTransition = function () {
    return Ee.current.useTransition();
};
F.version = '18.3.1';
bf.exports = F;
var L = bf.exports;
const Fs = Fg(L);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var ty = L,
    ny = Symbol.for('react.element'),
    ry = Symbol.for('react.fragment'),
    iy = Object.prototype.hasOwnProperty,
    sy = ty.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    oy = { key: !0, ref: !0, __self: !0, __source: !0 };
function Wf(e, t, n) {
    var r,
        i = {},
        s = null,
        o = null;
    (n !== void 0 && (s = '' + n),
        t.key !== void 0 && (s = '' + t.key),
        t.ref !== void 0 && (o = t.ref));
    for (r in t) iy.call(t, r) && !oy.hasOwnProperty(r) && (i[r] = t[r]);
    if (e && e.defaultProps) for (r in ((t = e.defaultProps), t)) i[r] === void 0 && (i[r] = t[r]);
    return { $$typeof: ny, type: e, key: s, ref: o, props: i, _owner: sy.current };
}
Is.Fragment = ry;
Is.jsx = Wf;
Is.jsxs = Wf;
Vf.exports = Is;
var g = Vf.exports,
    Zo = {},
    Kf = { exports: {} },
    ze = {},
    Gf = { exports: {} },
    Qf = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
    function t(N, D) {
        var V = N.length;
        N.push(D);
        e: for (; 0 < V; ) {
            var B = (V - 1) >>> 1,
                W = N[B];
            if (0 < i(W, D)) ((N[B] = D), (N[V] = W), (V = B));
            else break e;
        }
    }
    function n(N) {
        return N.length === 0 ? null : N[0];
    }
    function r(N) {
        if (N.length === 0) return null;
        var D = N[0],
            V = N.pop();
        if (V !== D) {
            N[0] = V;
            e: for (var B = 0, W = N.length, it = W >>> 1; B < it; ) {
                var st = 2 * (B + 1) - 1,
                    wn = N[st],
                    Zt = st + 1,
                    wi = N[Zt];
                if (0 > i(wn, V))
                    Zt < W && 0 > i(wi, wn)
                        ? ((N[B] = wi), (N[Zt] = V), (B = Zt))
                        : ((N[B] = wn), (N[st] = V), (B = st));
                else if (Zt < W && 0 > i(wi, V)) ((N[B] = wi), (N[Zt] = V), (B = Zt));
                else break e;
            }
        }
        return D;
    }
    function i(N, D) {
        var V = N.sortIndex - D.sortIndex;
        return V !== 0 ? V : N.id - D.id;
    }
    if (typeof performance == 'object' && typeof performance.now == 'function') {
        var s = performance;
        e.unstable_now = function () {
            return s.now();
        };
    } else {
        var o = Date,
            a = o.now();
        e.unstable_now = function () {
            return o.now() - a;
        };
    }
    var l = [],
        u = [],
        c = 1,
        d = null,
        f = 3,
        m = !1,
        v = !1,
        x = !1,
        k = typeof setTimeout == 'function' ? setTimeout : null,
        p = typeof clearTimeout == 'function' ? clearTimeout : null,
        h = typeof setImmediate < 'u' ? setImmediate : null;
    typeof navigator < 'u' &&
        navigator.scheduling !== void 0 &&
        navigator.scheduling.isInputPending !== void 0 &&
        navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function y(N) {
        for (var D = n(u); D !== null; ) {
            if (D.callback === null) r(u);
            else if (D.startTime <= N) (r(u), (D.sortIndex = D.expirationTime), t(l, D));
            else break;
            D = n(u);
        }
    }
    function w(N) {
        if (((x = !1), y(N), !v))
            if (n(l) !== null) ((v = !0), le(S));
            else {
                var D = n(u);
                D !== null && U(w, D.startTime - N);
            }
    }
    function S(N, D) {
        ((v = !1), x && ((x = !1), p(C), (C = -1)), (m = !0));
        var V = f;
        try {
            for (y(D), d = n(l); d !== null && (!(d.expirationTime > D) || (N && !Z())); ) {
                var B = d.callback;
                if (typeof B == 'function') {
                    ((d.callback = null), (f = d.priorityLevel));
                    var W = B(d.expirationTime <= D);
                    ((D = e.unstable_now()),
                        typeof W == 'function' ? (d.callback = W) : d === n(l) && r(l),
                        y(D));
                } else r(l);
                d = n(l);
            }
            if (d !== null) var it = !0;
            else {
                var st = n(u);
                (st !== null && U(w, st.startTime - D), (it = !1));
            }
            return it;
        } finally {
            ((d = null), (f = V), (m = !1));
        }
    }
    var P = !1,
        E = null,
        C = -1,
        A = 5,
        j = -1;
    function Z() {
        return !(e.unstable_now() - j < A);
    }
    function z() {
        if (E !== null) {
            var N = e.unstable_now();
            j = N;
            var D = !0;
            try {
                D = E(!0, N);
            } finally {
                D ? b() : ((P = !1), (E = null));
            }
        } else P = !1;
    }
    var b;
    if (typeof h == 'function')
        b = function () {
            h(z);
        };
    else if (typeof MessageChannel < 'u') {
        var I = new MessageChannel(),
            q = I.port2;
        ((I.port1.onmessage = z),
            (b = function () {
                q.postMessage(null);
            }));
    } else
        b = function () {
            k(z, 0);
        };
    function le(N) {
        ((E = N), P || ((P = !0), b()));
    }
    function U(N, D) {
        C = k(function () {
            N(e.unstable_now());
        }, D);
    }
    ((e.unstable_IdlePriority = 5),
        (e.unstable_ImmediatePriority = 1),
        (e.unstable_LowPriority = 4),
        (e.unstable_NormalPriority = 3),
        (e.unstable_Profiling = null),
        (e.unstable_UserBlockingPriority = 2),
        (e.unstable_cancelCallback = function (N) {
            N.callback = null;
        }),
        (e.unstable_continueExecution = function () {
            v || m || ((v = !0), le(S));
        }),
        (e.unstable_forceFrameRate = function (N) {
            0 > N || 125 < N
                ? console.error(
                      'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported',
                  )
                : (A = 0 < N ? Math.floor(1e3 / N) : 5);
        }),
        (e.unstable_getCurrentPriorityLevel = function () {
            return f;
        }),
        (e.unstable_getFirstCallbackNode = function () {
            return n(l);
        }),
        (e.unstable_next = function (N) {
            switch (f) {
                case 1:
                case 2:
                case 3:
                    var D = 3;
                    break;
                default:
                    D = f;
            }
            var V = f;
            f = D;
            try {
                return N();
            } finally {
                f = V;
            }
        }),
        (e.unstable_pauseExecution = function () {}),
        (e.unstable_requestPaint = function () {}),
        (e.unstable_runWithPriority = function (N, D) {
            switch (N) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    break;
                default:
                    N = 3;
            }
            var V = f;
            f = N;
            try {
                return D();
            } finally {
                f = V;
            }
        }),
        (e.unstable_scheduleCallback = function (N, D, V) {
            var B = e.unstable_now();
            switch (
                (typeof V == 'object' && V !== null
                    ? ((V = V.delay), (V = typeof V == 'number' && 0 < V ? B + V : B))
                    : (V = B),
                N)
            ) {
                case 1:
                    var W = -1;
                    break;
                case 2:
                    W = 250;
                    break;
                case 5:
                    W = 1073741823;
                    break;
                case 4:
                    W = 1e4;
                    break;
                default:
                    W = 5e3;
            }
            return (
                (W = V + W),
                (N = {
                    id: c++,
                    callback: D,
                    priorityLevel: N,
                    startTime: V,
                    expirationTime: W,
                    sortIndex: -1,
                }),
                V > B
                    ? ((N.sortIndex = V),
                      t(u, N),
                      n(l) === null && N === n(u) && (x ? (p(C), (C = -1)) : (x = !0), U(w, V - B)))
                    : ((N.sortIndex = W), t(l, N), v || m || ((v = !0), le(S))),
                N
            );
        }),
        (e.unstable_shouldYield = Z),
        (e.unstable_wrapCallback = function (N) {
            var D = f;
            return function () {
                var V = f;
                f = D;
                try {
                    return N.apply(this, arguments);
                } finally {
                    f = V;
                }
            };
        }));
})(Qf);
Gf.exports = Qf;
var ay = Gf.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var ly = L,
    Ie = ay;
function T(e) {
    for (
        var t = 'https://reactjs.org/docs/error-decoder.html?invariant=' + e, n = 1;
        n < arguments.length;
        n++
    )
        t += '&args[]=' + encodeURIComponent(arguments[n]);
    return (
        'Minified React error #' +
        e +
        '; visit ' +
        t +
        ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
    );
}
var Yf = new Set(),
    $r = {};
function yn(e, t) {
    (Qn(e, t), Qn(e + 'Capture', t));
}
function Qn(e, t) {
    for ($r[e] = t, e = 0; e < t.length; e++) Yf.add(t[e]);
}
var St = !(
        typeof window > 'u' ||
        typeof window.document > 'u' ||
        typeof window.document.createElement > 'u'
    ),
    qo = Object.prototype.hasOwnProperty,
    uy =
        /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
    Wu = {},
    Ku = {};
function cy(e) {
    return qo.call(Ku, e)
        ? !0
        : qo.call(Wu, e)
          ? !1
          : uy.test(e)
            ? (Ku[e] = !0)
            : ((Wu[e] = !0), !1);
}
function dy(e, t, n, r) {
    if (n !== null && n.type === 0) return !1;
    switch (typeof t) {
        case 'function':
        case 'symbol':
            return !0;
        case 'boolean':
            return r
                ? !1
                : n !== null
                  ? !n.acceptsBooleans
                  : ((e = e.toLowerCase().slice(0, 5)), e !== 'data-' && e !== 'aria-');
        default:
            return !1;
    }
}
function fy(e, t, n, r) {
    if (t === null || typeof t > 'u' || dy(e, t, n, r)) return !0;
    if (r) return !1;
    if (n !== null)
        switch (n.type) {
            case 3:
                return !t;
            case 4:
                return t === !1;
            case 5:
                return isNaN(t);
            case 6:
                return isNaN(t) || 1 > t;
        }
    return !1;
}
function Ne(e, t, n, r, i, s, o) {
    ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
        (this.attributeName = r),
        (this.attributeNamespace = i),
        (this.mustUseProperty = n),
        (this.propertyName = e),
        (this.type = t),
        (this.sanitizeURL = s),
        (this.removeEmptyString = o));
}
var ye = {};
'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
    .split(' ')
    .forEach(function (e) {
        ye[e] = new Ne(e, 0, !1, e, null, !1, !1);
    });
[
    ['acceptCharset', 'accept-charset'],
    ['className', 'class'],
    ['htmlFor', 'for'],
    ['httpEquiv', 'http-equiv'],
].forEach(function (e) {
    var t = e[0];
    ye[t] = new Ne(t, 1, !1, e[1], null, !1, !1);
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
    ye[e] = new Ne(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (e) {
    ye[e] = new Ne(e, 2, !1, e, null, !1, !1);
});
'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
    .split(' ')
    .forEach(function (e) {
        ye[e] = new Ne(e, 3, !1, e.toLowerCase(), null, !1, !1);
    });
['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
    ye[e] = new Ne(e, 3, !0, e, null, !1, !1);
});
['capture', 'download'].forEach(function (e) {
    ye[e] = new Ne(e, 4, !1, e, null, !1, !1);
});
['cols', 'rows', 'size', 'span'].forEach(function (e) {
    ye[e] = new Ne(e, 6, !1, e, null, !1, !1);
});
['rowSpan', 'start'].forEach(function (e) {
    ye[e] = new Ne(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var pl = /[\-:]([a-z])/g;
function ml(e) {
    return e[1].toUpperCase();
}
'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(pl, ml);
        ye[t] = new Ne(t, 1, !1, e, null, !1, !1);
    });
'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(pl, ml);
        ye[t] = new Ne(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
    });
['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
    var t = e.replace(pl, ml);
    ye[t] = new Ne(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
});
['tabIndex', 'crossOrigin'].forEach(function (e) {
    ye[e] = new Ne(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
ye.xlinkHref = new Ne('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1);
['src', 'href', 'action', 'formAction'].forEach(function (e) {
    ye[e] = new Ne(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function gl(e, t, n, r) {
    var i = ye.hasOwnProperty(t) ? ye[t] : null;
    (i !== null
        ? i.type !== 0
        : r ||
          !(2 < t.length) ||
          (t[0] !== 'o' && t[0] !== 'O') ||
          (t[1] !== 'n' && t[1] !== 'N')) &&
        (fy(t, n, i, r) && (n = null),
        r || i === null
            ? cy(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, '' + n))
            : i.mustUseProperty
              ? (e[i.propertyName] = n === null ? (i.type === 3 ? !1 : '') : n)
              : ((t = i.attributeName),
                (r = i.attributeNamespace),
                n === null
                    ? e.removeAttribute(t)
                    : ((i = i.type),
                      (n = i === 3 || (i === 4 && n === !0) ? '' : '' + n),
                      r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var Et = ly.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    ki = Symbol.for('react.element'),
    Tn = Symbol.for('react.portal'),
    En = Symbol.for('react.fragment'),
    yl = Symbol.for('react.strict_mode'),
    Jo = Symbol.for('react.profiler'),
    Xf = Symbol.for('react.provider'),
    Zf = Symbol.for('react.context'),
    vl = Symbol.for('react.forward_ref'),
    ea = Symbol.for('react.suspense'),
    ta = Symbol.for('react.suspense_list'),
    xl = Symbol.for('react.memo'),
    jt = Symbol.for('react.lazy'),
    qf = Symbol.for('react.offscreen'),
    Gu = Symbol.iterator;
function cr(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = (Gu && e[Gu]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var ne = Object.assign,
    uo;
function wr(e) {
    if (uo === void 0)
        try {
            throw Error();
        } catch (n) {
            var t = n.stack.trim().match(/\n( *(at )?)/);
            uo = (t && t[1]) || '';
        }
    return (
        `
` +
        uo +
        e
    );
}
var co = !1;
function fo(e, t) {
    if (!e || co) return '';
    co = !0;
    var n = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
        if (t)
            if (
                ((t = function () {
                    throw Error();
                }),
                Object.defineProperty(t.prototype, 'props', {
                    set: function () {
                        throw Error();
                    },
                }),
                typeof Reflect == 'object' && Reflect.construct)
            ) {
                try {
                    Reflect.construct(t, []);
                } catch (u) {
                    var r = u;
                }
                Reflect.construct(e, [], t);
            } else {
                try {
                    t.call();
                } catch (u) {
                    r = u;
                }
                e.call(t.prototype);
            }
        else {
            try {
                throw Error();
            } catch (u) {
                r = u;
            }
            e();
        }
    } catch (u) {
        if (u && r && typeof u.stack == 'string') {
            for (
                var i = u.stack.split(`
`),
                    s = r.stack.split(`
`),
                    o = i.length - 1,
                    a = s.length - 1;
                1 <= o && 0 <= a && i[o] !== s[a];
            )
                a--;
            for (; 1 <= o && 0 <= a; o--, a--)
                if (i[o] !== s[a]) {
                    if (o !== 1 || a !== 1)
                        do
                            if ((o--, a--, 0 > a || i[o] !== s[a])) {
                                var l =
                                    `
` + i[o].replace(' at new ', ' at ');
                                return (
                                    e.displayName &&
                                        l.includes('<anonymous>') &&
                                        (l = l.replace('<anonymous>', e.displayName)),
                                    l
                                );
                            }
                        while (1 <= o && 0 <= a);
                    break;
                }
        }
    } finally {
        ((co = !1), (Error.prepareStackTrace = n));
    }
    return (e = e ? e.displayName || e.name : '') ? wr(e) : '';
}
function hy(e) {
    switch (e.tag) {
        case 5:
            return wr(e.type);
        case 16:
            return wr('Lazy');
        case 13:
            return wr('Suspense');
        case 19:
            return wr('SuspenseList');
        case 0:
        case 2:
        case 15:
            return ((e = fo(e.type, !1)), e);
        case 11:
            return ((e = fo(e.type.render, !1)), e);
        case 1:
            return ((e = fo(e.type, !0)), e);
        default:
            return '';
    }
}
function na(e) {
    if (e == null) return null;
    if (typeof e == 'function') return e.displayName || e.name || null;
    if (typeof e == 'string') return e;
    switch (e) {
        case En:
            return 'Fragment';
        case Tn:
            return 'Portal';
        case Jo:
            return 'Profiler';
        case yl:
            return 'StrictMode';
        case ea:
            return 'Suspense';
        case ta:
            return 'SuspenseList';
    }
    if (typeof e == 'object')
        switch (e.$$typeof) {
            case Zf:
                return (e.displayName || 'Context') + '.Consumer';
            case Xf:
                return (e._context.displayName || 'Context') + '.Provider';
            case vl:
                var t = e.render;
                return (
                    (e = e.displayName),
                    e ||
                        ((e = t.displayName || t.name || ''),
                        (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
                    e
                );
            case xl:
                return ((t = e.displayName || null), t !== null ? t : na(e.type) || 'Memo');
            case jt:
                ((t = e._payload), (e = e._init));
                try {
                    return na(e(t));
                } catch {}
        }
    return null;
}
function py(e) {
    var t = e.type;
    switch (e.tag) {
        case 24:
            return 'Cache';
        case 9:
            return (t.displayName || 'Context') + '.Consumer';
        case 10:
            return (t._context.displayName || 'Context') + '.Provider';
        case 18:
            return 'DehydratedFragment';
        case 11:
            return (
                (e = t.render),
                (e = e.displayName || e.name || ''),
                t.displayName || (e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')
            );
        case 7:
            return 'Fragment';
        case 5:
            return t;
        case 4:
            return 'Portal';
        case 3:
            return 'Root';
        case 6:
            return 'Text';
        case 16:
            return na(t);
        case 8:
            return t === yl ? 'StrictMode' : 'Mode';
        case 22:
            return 'Offscreen';
        case 12:
            return 'Profiler';
        case 21:
            return 'Scope';
        case 13:
            return 'Suspense';
        case 19:
            return 'SuspenseList';
        case 25:
            return 'TracingMarker';
        case 1:
        case 0:
        case 17:
        case 2:
        case 14:
        case 15:
            if (typeof t == 'function') return t.displayName || t.name || null;
            if (typeof t == 'string') return t;
    }
    return null;
}
function Ut(e) {
    switch (typeof e) {
        case 'boolean':
        case 'number':
        case 'string':
        case 'undefined':
            return e;
        case 'object':
            return e;
        default:
            return '';
    }
}
function Jf(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio');
}
function my(e) {
    var t = Jf(e) ? 'checked' : 'value',
        n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
        r = '' + e[t];
    if (
        !e.hasOwnProperty(t) &&
        typeof n < 'u' &&
        typeof n.get == 'function' &&
        typeof n.set == 'function'
    ) {
        var i = n.get,
            s = n.set;
        return (
            Object.defineProperty(e, t, {
                configurable: !0,
                get: function () {
                    return i.call(this);
                },
                set: function (o) {
                    ((r = '' + o), s.call(this, o));
                },
            }),
            Object.defineProperty(e, t, { enumerable: n.enumerable }),
            {
                getValue: function () {
                    return r;
                },
                setValue: function (o) {
                    r = '' + o;
                },
                stopTracking: function () {
                    ((e._valueTracker = null), delete e[t]);
                },
            }
        );
    }
}
function Ci(e) {
    e._valueTracker || (e._valueTracker = my(e));
}
function eh(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var n = t.getValue(),
        r = '';
    return (
        e && (r = Jf(e) ? (e.checked ? 'true' : 'false') : e.value),
        (e = r),
        e !== n ? (t.setValue(e), !0) : !1
    );
}
function is(e) {
    if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
    try {
        return e.activeElement || e.body;
    } catch {
        return e.body;
    }
}
function ra(e, t) {
    var n = t.checked;
    return ne({}, t, {
        defaultChecked: void 0,
        defaultValue: void 0,
        value: void 0,
        checked: n ?? e._wrapperState.initialChecked,
    });
}
function Qu(e, t) {
    var n = t.defaultValue == null ? '' : t.defaultValue,
        r = t.checked != null ? t.checked : t.defaultChecked;
    ((n = Ut(t.value != null ? t.value : n)),
        (e._wrapperState = {
            initialChecked: r,
            initialValue: n,
            controlled:
                t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
        }));
}
function th(e, t) {
    ((t = t.checked), t != null && gl(e, 'checked', t, !1));
}
function ia(e, t) {
    th(e, t);
    var n = Ut(t.value),
        r = t.type;
    if (n != null)
        r === 'number'
            ? ((n === 0 && e.value === '') || e.value != n) && (e.value = '' + n)
            : e.value !== '' + n && (e.value = '' + n);
    else if (r === 'submit' || r === 'reset') {
        e.removeAttribute('value');
        return;
    }
    (t.hasOwnProperty('value')
        ? sa(e, t.type, n)
        : t.hasOwnProperty('defaultValue') && sa(e, t.type, Ut(t.defaultValue)),
        t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked));
}
function Yu(e, t, n) {
    if (t.hasOwnProperty('value') || t.hasOwnProperty('defaultValue')) {
        var r = t.type;
        if (!((r !== 'submit' && r !== 'reset') || (t.value !== void 0 && t.value !== null)))
            return;
        ((t = '' + e._wrapperState.initialValue),
            n || t === e.value || (e.value = t),
            (e.defaultValue = t));
    }
    ((n = e.name),
        n !== '' && (e.name = ''),
        (e.defaultChecked = !!e._wrapperState.initialChecked),
        n !== '' && (e.name = n));
}
function sa(e, t, n) {
    (t !== 'number' || is(e.ownerDocument) !== e) &&
        (n == null
            ? (e.defaultValue = '' + e._wrapperState.initialValue)
            : e.defaultValue !== '' + n && (e.defaultValue = '' + n));
}
var Sr = Array.isArray;
function $n(e, t, n, r) {
    if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t['$' + n[i]] = !0;
        for (n = 0; n < e.length; n++)
            ((i = t.hasOwnProperty('$' + e[n].value)),
                e[n].selected !== i && (e[n].selected = i),
                i && r && (e[n].defaultSelected = !0));
    } else {
        for (n = '' + Ut(n), t = null, i = 0; i < e.length; i++) {
            if (e[i].value === n) {
                ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
                return;
            }
            t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
    }
}
function oa(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(T(91));
    return ne({}, t, {
        value: void 0,
        defaultValue: void 0,
        children: '' + e._wrapperState.initialValue,
    });
}
function Xu(e, t) {
    var n = t.value;
    if (n == null) {
        if (((n = t.children), (t = t.defaultValue), n != null)) {
            if (t != null) throw Error(T(92));
            if (Sr(n)) {
                if (1 < n.length) throw Error(T(93));
                n = n[0];
            }
            t = n;
        }
        (t == null && (t = ''), (n = t));
    }
    e._wrapperState = { initialValue: Ut(n) };
}
function nh(e, t) {
    var n = Ut(t.value),
        r = Ut(t.defaultValue);
    (n != null &&
        ((n = '' + n),
        n !== e.value && (e.value = n),
        t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
        r != null && (e.defaultValue = '' + r));
}
function Zu(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
}
function rh(e) {
    switch (e) {
        case 'svg':
            return 'http://www.w3.org/2000/svg';
        case 'math':
            return 'http://www.w3.org/1998/Math/MathML';
        default:
            return 'http://www.w3.org/1999/xhtml';
    }
}
function aa(e, t) {
    return e == null || e === 'http://www.w3.org/1999/xhtml'
        ? rh(t)
        : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
          ? 'http://www.w3.org/1999/xhtml'
          : e;
}
var Pi,
    ih = (function (e) {
        return typeof MSApp < 'u' && MSApp.execUnsafeLocalFunction
            ? function (t, n, r, i) {
                  MSApp.execUnsafeLocalFunction(function () {
                      return e(t, n, r, i);
                  });
              }
            : e;
    })(function (e, t) {
        if (e.namespaceURI !== 'http://www.w3.org/2000/svg' || 'innerHTML' in e) e.innerHTML = t;
        else {
            for (
                Pi = Pi || document.createElement('div'),
                    Pi.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>',
                    t = Pi.firstChild;
                e.firstChild;
            )
                e.removeChild(e.firstChild);
            for (; t.firstChild; ) e.appendChild(t.firstChild);
        }
    });
function Ur(e, t) {
    if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
            n.nodeValue = t;
            return;
        }
    }
    e.textContent = t;
}
var Nr = {
        animationIterationCount: !0,
        aspectRatio: !0,
        borderImageOutset: !0,
        borderImageSlice: !0,
        borderImageWidth: !0,
        boxFlex: !0,
        boxFlexGroup: !0,
        boxOrdinalGroup: !0,
        columnCount: !0,
        columns: !0,
        flex: !0,
        flexGrow: !0,
        flexPositive: !0,
        flexShrink: !0,
        flexNegative: !0,
        flexOrder: !0,
        gridArea: !0,
        gridRow: !0,
        gridRowEnd: !0,
        gridRowSpan: !0,
        gridRowStart: !0,
        gridColumn: !0,
        gridColumnEnd: !0,
        gridColumnSpan: !0,
        gridColumnStart: !0,
        fontWeight: !0,
        lineClamp: !0,
        lineHeight: !0,
        opacity: !0,
        order: !0,
        orphans: !0,
        tabSize: !0,
        widows: !0,
        zIndex: !0,
        zoom: !0,
        fillOpacity: !0,
        floodOpacity: !0,
        stopOpacity: !0,
        strokeDasharray: !0,
        strokeDashoffset: !0,
        strokeMiterlimit: !0,
        strokeOpacity: !0,
        strokeWidth: !0,
    },
    gy = ['Webkit', 'ms', 'Moz', 'O'];
Object.keys(Nr).forEach(function (e) {
    gy.forEach(function (t) {
        ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Nr[t] = Nr[e]));
    });
});
function sh(e, t, n) {
    return t == null || typeof t == 'boolean' || t === ''
        ? ''
        : n || typeof t != 'number' || t === 0 || (Nr.hasOwnProperty(e) && Nr[e])
          ? ('' + t).trim()
          : t + 'px';
}
function oh(e, t) {
    e = e.style;
    for (var n in t)
        if (t.hasOwnProperty(n)) {
            var r = n.indexOf('--') === 0,
                i = sh(n, t[n], r);
            (n === 'float' && (n = 'cssFloat'), r ? e.setProperty(n, i) : (e[n] = i));
        }
}
var yy = ne(
    { menuitem: !0 },
    {
        area: !0,
        base: !0,
        br: !0,
        col: !0,
        embed: !0,
        hr: !0,
        img: !0,
        input: !0,
        keygen: !0,
        link: !0,
        meta: !0,
        param: !0,
        source: !0,
        track: !0,
        wbr: !0,
    },
);
function la(e, t) {
    if (t) {
        if (yy[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
            throw Error(T(137, e));
        if (t.dangerouslySetInnerHTML != null) {
            if (t.children != null) throw Error(T(60));
            if (
                typeof t.dangerouslySetInnerHTML != 'object' ||
                !('__html' in t.dangerouslySetInnerHTML)
            )
                throw Error(T(61));
        }
        if (t.style != null && typeof t.style != 'object') throw Error(T(62));
    }
}
function ua(e, t) {
    if (e.indexOf('-') === -1) return typeof t.is == 'string';
    switch (e) {
        case 'annotation-xml':
        case 'color-profile':
        case 'font-face':
        case 'font-face-src':
        case 'font-face-uri':
        case 'font-face-format':
        case 'font-face-name':
        case 'missing-glyph':
            return !1;
        default:
            return !0;
    }
}
var ca = null;
function wl(e) {
    return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    );
}
var da = null,
    Un = null,
    Hn = null;
function qu(e) {
    if ((e = pi(e))) {
        if (typeof da != 'function') throw Error(T(280));
        var t = e.stateNode;
        t && ((t = Hs(t)), da(e.stateNode, e.type, t));
    }
}
function ah(e) {
    Un ? (Hn ? Hn.push(e) : (Hn = [e])) : (Un = e);
}
function lh() {
    if (Un) {
        var e = Un,
            t = Hn;
        if (((Hn = Un = null), qu(e), t)) for (e = 0; e < t.length; e++) qu(t[e]);
    }
}
function uh(e, t) {
    return e(t);
}
function ch() {}
var ho = !1;
function dh(e, t, n) {
    if (ho) return e(t, n);
    ho = !0;
    try {
        return uh(e, t, n);
    } finally {
        ((ho = !1), (Un !== null || Hn !== null) && (ch(), lh()));
    }
}
function Hr(e, t) {
    var n = e.stateNode;
    if (n === null) return null;
    var r = Hs(n);
    if (r === null) return null;
    n = r[t];
    e: switch (t) {
        case 'onClick':
        case 'onClickCapture':
        case 'onDoubleClick':
        case 'onDoubleClickCapture':
        case 'onMouseDown':
        case 'onMouseDownCapture':
        case 'onMouseMove':
        case 'onMouseMoveCapture':
        case 'onMouseUp':
        case 'onMouseUpCapture':
        case 'onMouseEnter':
            ((r = !r.disabled) ||
                ((e = e.type),
                (r = !(e === 'button' || e === 'input' || e === 'select' || e === 'textarea'))),
                (e = !r));
            break e;
        default:
            e = !1;
    }
    if (e) return null;
    if (n && typeof n != 'function') throw Error(T(231, t, typeof n));
    return n;
}
var fa = !1;
if (St)
    try {
        var dr = {};
        (Object.defineProperty(dr, 'passive', {
            get: function () {
                fa = !0;
            },
        }),
            window.addEventListener('test', dr, dr),
            window.removeEventListener('test', dr, dr));
    } catch {
        fa = !1;
    }
function vy(e, t, n, r, i, s, o, a, l) {
    var u = Array.prototype.slice.call(arguments, 3);
    try {
        t.apply(n, u);
    } catch (c) {
        this.onError(c);
    }
}
var Lr = !1,
    ss = null,
    os = !1,
    ha = null,
    xy = {
        onError: function (e) {
            ((Lr = !0), (ss = e));
        },
    };
function wy(e, t, n, r, i, s, o, a, l) {
    ((Lr = !1), (ss = null), vy.apply(xy, arguments));
}
function Sy(e, t, n, r, i, s, o, a, l) {
    if ((wy.apply(this, arguments), Lr)) {
        if (Lr) {
            var u = ss;
            ((Lr = !1), (ss = null));
        } else throw Error(T(198));
        os || ((os = !0), (ha = u));
    }
}
function vn(e) {
    var t = e,
        n = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
        e = t;
        do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
        while (e);
    }
    return t.tag === 3 ? n : null;
}
function fh(e) {
    if (e.tag === 13) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
            return t.dehydrated;
    }
    return null;
}
function Ju(e) {
    if (vn(e) !== e) throw Error(T(188));
}
function ky(e) {
    var t = e.alternate;
    if (!t) {
        if (((t = vn(e)), t === null)) throw Error(T(188));
        return t !== e ? null : e;
    }
    for (var n = e, r = t; ; ) {
        var i = n.return;
        if (i === null) break;
        var s = i.alternate;
        if (s === null) {
            if (((r = i.return), r !== null)) {
                n = r;
                continue;
            }
            break;
        }
        if (i.child === s.child) {
            for (s = i.child; s; ) {
                if (s === n) return (Ju(i), e);
                if (s === r) return (Ju(i), t);
                s = s.sibling;
            }
            throw Error(T(188));
        }
        if (n.return !== r.return) ((n = i), (r = s));
        else {
            for (var o = !1, a = i.child; a; ) {
                if (a === n) {
                    ((o = !0), (n = i), (r = s));
                    break;
                }
                if (a === r) {
                    ((o = !0), (r = i), (n = s));
                    break;
                }
                a = a.sibling;
            }
            if (!o) {
                for (a = s.child; a; ) {
                    if (a === n) {
                        ((o = !0), (n = s), (r = i));
                        break;
                    }
                    if (a === r) {
                        ((o = !0), (r = s), (n = i));
                        break;
                    }
                    a = a.sibling;
                }
                if (!o) throw Error(T(189));
            }
        }
        if (n.alternate !== r) throw Error(T(190));
    }
    if (n.tag !== 3) throw Error(T(188));
    return n.stateNode.current === n ? e : t;
}
function hh(e) {
    return ((e = ky(e)), e !== null ? ph(e) : null);
}
function ph(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
        var t = ph(e);
        if (t !== null) return t;
        e = e.sibling;
    }
    return null;
}
var mh = Ie.unstable_scheduleCallback,
    ec = Ie.unstable_cancelCallback,
    Cy = Ie.unstable_shouldYield,
    Py = Ie.unstable_requestPaint,
    ae = Ie.unstable_now,
    Ty = Ie.unstable_getCurrentPriorityLevel,
    Sl = Ie.unstable_ImmediatePriority,
    gh = Ie.unstable_UserBlockingPriority,
    as = Ie.unstable_NormalPriority,
    Ey = Ie.unstable_LowPriority,
    yh = Ie.unstable_IdlePriority,
    zs = null,
    ct = null;
function Ny(e) {
    if (ct && typeof ct.onCommitFiberRoot == 'function')
        try {
            ct.onCommitFiberRoot(zs, e, void 0, (e.current.flags & 128) === 128);
        } catch {}
}
var tt = Math.clz32 ? Math.clz32 : Ry,
    Ly = Math.log,
    jy = Math.LN2;
function Ry(e) {
    return ((e >>>= 0), e === 0 ? 32 : (31 - ((Ly(e) / jy) | 0)) | 0);
}
var Ti = 64,
    Ei = 4194304;
function kr(e) {
    switch (e & -e) {
        case 1:
            return 1;
        case 2:
            return 2;
        case 4:
            return 4;
        case 8:
            return 8;
        case 16:
            return 16;
        case 32:
            return 32;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return e & 4194240;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
            return e & 130023424;
        case 134217728:
            return 134217728;
        case 268435456:
            return 268435456;
        case 536870912:
            return 536870912;
        case 1073741824:
            return 1073741824;
        default:
            return e;
    }
}
function ls(e, t) {
    var n = e.pendingLanes;
    if (n === 0) return 0;
    var r = 0,
        i = e.suspendedLanes,
        s = e.pingedLanes,
        o = n & 268435455;
    if (o !== 0) {
        var a = o & ~i;
        a !== 0 ? (r = kr(a)) : ((s &= o), s !== 0 && (r = kr(s)));
    } else ((o = n & ~i), o !== 0 ? (r = kr(o)) : s !== 0 && (r = kr(s)));
    if (r === 0) return 0;
    if (
        t !== 0 &&
        t !== r &&
        !(t & i) &&
        ((i = r & -r), (s = t & -t), i >= s || (i === 16 && (s & 4194240) !== 0))
    )
        return t;
    if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
        for (e = e.entanglements, t &= r; 0 < t; )
            ((n = 31 - tt(t)), (i = 1 << n), (r |= e[n]), (t &= ~i));
    return r;
}
function Ay(e, t) {
    switch (e) {
        case 1:
        case 2:
        case 4:
            return t + 250;
        case 8:
        case 16:
        case 32:
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
            return -1;
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
            return -1;
        default:
            return -1;
    }
}
function Dy(e, t) {
    for (
        var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, s = e.pendingLanes;
        0 < s;
    ) {
        var o = 31 - tt(s),
            a = 1 << o,
            l = i[o];
        (l === -1 ? (!(a & n) || a & r) && (i[o] = Ay(a, t)) : l <= t && (e.expiredLanes |= a),
            (s &= ~a));
    }
}
function pa(e) {
    return ((e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0);
}
function vh() {
    var e = Ti;
    return ((Ti <<= 1), !(Ti & 4194240) && (Ti = 64), e);
}
function po(e) {
    for (var t = [], n = 0; 31 > n; n++) t.push(e);
    return t;
}
function fi(e, t, n) {
    ((e.pendingLanes |= t),
        t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
        (e = e.eventTimes),
        (t = 31 - tt(t)),
        (e[t] = n));
}
function My(e, t) {
    var n = e.pendingLanes & ~t;
    ((e.pendingLanes = t),
        (e.suspendedLanes = 0),
        (e.pingedLanes = 0),
        (e.expiredLanes &= t),
        (e.mutableReadLanes &= t),
        (e.entangledLanes &= t),
        (t = e.entanglements));
    var r = e.eventTimes;
    for (e = e.expirationTimes; 0 < n; ) {
        var i = 31 - tt(n),
            s = 1 << i;
        ((t[i] = 0), (r[i] = -1), (e[i] = -1), (n &= ~s));
    }
}
function kl(e, t) {
    var n = (e.entangledLanes |= t);
    for (e = e.entanglements; n; ) {
        var r = 31 - tt(n),
            i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
    }
}
var H = 0;
function xh(e) {
    return ((e &= -e), 1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1);
}
var wh,
    Cl,
    Sh,
    kh,
    Ch,
    ma = !1,
    Ni = [],
    Vt = null,
    bt = null,
    _t = null,
    Wr = new Map(),
    Kr = new Map(),
    At = [],
    Oy =
        'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
            ' ',
        );
function tc(e, t) {
    switch (e) {
        case 'focusin':
        case 'focusout':
            Vt = null;
            break;
        case 'dragenter':
        case 'dragleave':
            bt = null;
            break;
        case 'mouseover':
        case 'mouseout':
            _t = null;
            break;
        case 'pointerover':
        case 'pointerout':
            Wr.delete(t.pointerId);
            break;
        case 'gotpointercapture':
        case 'lostpointercapture':
            Kr.delete(t.pointerId);
    }
}
function fr(e, t, n, r, i, s) {
    return e === null || e.nativeEvent !== s
        ? ((e = {
              blockedOn: t,
              domEventName: n,
              eventSystemFlags: r,
              nativeEvent: s,
              targetContainers: [i],
          }),
          t !== null && ((t = pi(t)), t !== null && Cl(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
}
function Vy(e, t, n, r, i) {
    switch (t) {
        case 'focusin':
            return ((Vt = fr(Vt, e, t, n, r, i)), !0);
        case 'dragenter':
            return ((bt = fr(bt, e, t, n, r, i)), !0);
        case 'mouseover':
            return ((_t = fr(_t, e, t, n, r, i)), !0);
        case 'pointerover':
            var s = i.pointerId;
            return (Wr.set(s, fr(Wr.get(s) || null, e, t, n, r, i)), !0);
        case 'gotpointercapture':
            return ((s = i.pointerId), Kr.set(s, fr(Kr.get(s) || null, e, t, n, r, i)), !0);
    }
    return !1;
}
function Ph(e) {
    var t = rn(e.target);
    if (t !== null) {
        var n = vn(t);
        if (n !== null) {
            if (((t = n.tag), t === 13)) {
                if (((t = fh(n)), t !== null)) {
                    ((e.blockedOn = t),
                        Ch(e.priority, function () {
                            Sh(n);
                        }));
                    return;
                }
            } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
                e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
                return;
            }
        }
    }
    e.blockedOn = null;
}
function Wi(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
        var n = ga(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
        if (n === null) {
            n = e.nativeEvent;
            var r = new n.constructor(n.type, n);
            ((ca = r), n.target.dispatchEvent(r), (ca = null));
        } else return ((t = pi(n)), t !== null && Cl(t), (e.blockedOn = n), !1);
        t.shift();
    }
    return !0;
}
function nc(e, t, n) {
    Wi(e) && n.delete(t);
}
function by() {
    ((ma = !1),
        Vt !== null && Wi(Vt) && (Vt = null),
        bt !== null && Wi(bt) && (bt = null),
        _t !== null && Wi(_t) && (_t = null),
        Wr.forEach(nc),
        Kr.forEach(nc));
}
function hr(e, t) {
    e.blockedOn === t &&
        ((e.blockedOn = null),
        ma || ((ma = !0), Ie.unstable_scheduleCallback(Ie.unstable_NormalPriority, by)));
}
function Gr(e) {
    function t(i) {
        return hr(i, e);
    }
    if (0 < Ni.length) {
        hr(Ni[0], e);
        for (var n = 1; n < Ni.length; n++) {
            var r = Ni[n];
            r.blockedOn === e && (r.blockedOn = null);
        }
    }
    for (
        Vt !== null && hr(Vt, e),
            bt !== null && hr(bt, e),
            _t !== null && hr(_t, e),
            Wr.forEach(t),
            Kr.forEach(t),
            n = 0;
        n < At.length;
        n++
    )
        ((r = At[n]), r.blockedOn === e && (r.blockedOn = null));
    for (; 0 < At.length && ((n = At[0]), n.blockedOn === null); )
        (Ph(n), n.blockedOn === null && At.shift());
}
var Wn = Et.ReactCurrentBatchConfig,
    us = !0;
function _y(e, t, n, r) {
    var i = H,
        s = Wn.transition;
    Wn.transition = null;
    try {
        ((H = 1), Pl(e, t, n, r));
    } finally {
        ((H = i), (Wn.transition = s));
    }
}
function Iy(e, t, n, r) {
    var i = H,
        s = Wn.transition;
    Wn.transition = null;
    try {
        ((H = 4), Pl(e, t, n, r));
    } finally {
        ((H = i), (Wn.transition = s));
    }
}
function Pl(e, t, n, r) {
    if (us) {
        var i = ga(e, t, n, r);
        if (i === null) (Po(e, t, r, cs, n), tc(e, r));
        else if (Vy(i, e, t, n, r)) r.stopPropagation();
        else if ((tc(e, r), t & 4 && -1 < Oy.indexOf(e))) {
            for (; i !== null; ) {
                var s = pi(i);
                if (
                    (s !== null && wh(s),
                    (s = ga(e, t, n, r)),
                    s === null && Po(e, t, r, cs, n),
                    s === i)
                )
                    break;
                i = s;
            }
            i !== null && r.stopPropagation();
        } else Po(e, t, r, null, n);
    }
}
var cs = null;
function ga(e, t, n, r) {
    if (((cs = null), (e = wl(r)), (e = rn(e)), e !== null))
        if (((t = vn(e)), t === null)) e = null;
        else if (((n = t.tag), n === 13)) {
            if (((e = fh(t)), e !== null)) return e;
            e = null;
        } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
                return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
        } else t !== e && (e = null);
    return ((cs = e), null);
}
function Th(e) {
    switch (e) {
        case 'cancel':
        case 'click':
        case 'close':
        case 'contextmenu':
        case 'copy':
        case 'cut':
        case 'auxclick':
        case 'dblclick':
        case 'dragend':
        case 'dragstart':
        case 'drop':
        case 'focusin':
        case 'focusout':
        case 'input':
        case 'invalid':
        case 'keydown':
        case 'keypress':
        case 'keyup':
        case 'mousedown':
        case 'mouseup':
        case 'paste':
        case 'pause':
        case 'play':
        case 'pointercancel':
        case 'pointerdown':
        case 'pointerup':
        case 'ratechange':
        case 'reset':
        case 'resize':
        case 'seeked':
        case 'submit':
        case 'touchcancel':
        case 'touchend':
        case 'touchstart':
        case 'volumechange':
        case 'change':
        case 'selectionchange':
        case 'textInput':
        case 'compositionstart':
        case 'compositionend':
        case 'compositionupdate':
        case 'beforeblur':
        case 'afterblur':
        case 'beforeinput':
        case 'blur':
        case 'fullscreenchange':
        case 'focus':
        case 'hashchange':
        case 'popstate':
        case 'select':
        case 'selectstart':
            return 1;
        case 'drag':
        case 'dragenter':
        case 'dragexit':
        case 'dragleave':
        case 'dragover':
        case 'mousemove':
        case 'mouseout':
        case 'mouseover':
        case 'pointermove':
        case 'pointerout':
        case 'pointerover':
        case 'scroll':
        case 'toggle':
        case 'touchmove':
        case 'wheel':
        case 'mouseenter':
        case 'mouseleave':
        case 'pointerenter':
        case 'pointerleave':
            return 4;
        case 'message':
            switch (Ty()) {
                case Sl:
                    return 1;
                case gh:
                    return 4;
                case as:
                case Ey:
                    return 16;
                case yh:
                    return 536870912;
                default:
                    return 16;
            }
        default:
            return 16;
    }
}
var Mt = null,
    Tl = null,
    Ki = null;
function Eh() {
    if (Ki) return Ki;
    var e,
        t = Tl,
        n = t.length,
        r,
        i = 'value' in Mt ? Mt.value : Mt.textContent,
        s = i.length;
    for (e = 0; e < n && t[e] === i[e]; e++);
    var o = n - e;
    for (r = 1; r <= o && t[n - r] === i[s - r]; r++);
    return (Ki = i.slice(e, 1 < r ? 1 - r : void 0));
}
function Gi(e) {
    var t = e.keyCode;
    return (
        'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
    );
}
function Li() {
    return !0;
}
function rc() {
    return !1;
}
function Be(e) {
    function t(n, r, i, s, o) {
        ((this._reactName = n),
            (this._targetInst = i),
            (this.type = r),
            (this.nativeEvent = s),
            (this.target = o),
            (this.currentTarget = null));
        for (var a in e) e.hasOwnProperty(a) && ((n = e[a]), (this[a] = n ? n(s) : s[a]));
        return (
            (this.isDefaultPrevented = (
                s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1
            )
                ? Li
                : rc),
            (this.isPropagationStopped = rc),
            this
        );
    }
    return (
        ne(t.prototype, {
            preventDefault: function () {
                this.defaultPrevented = !0;
                var n = this.nativeEvent;
                n &&
                    (n.preventDefault
                        ? n.preventDefault()
                        : typeof n.returnValue != 'unknown' && (n.returnValue = !1),
                    (this.isDefaultPrevented = Li));
            },
            stopPropagation: function () {
                var n = this.nativeEvent;
                n &&
                    (n.stopPropagation
                        ? n.stopPropagation()
                        : typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
                    (this.isPropagationStopped = Li));
            },
            persist: function () {},
            isPersistent: Li,
        }),
        t
    );
}
var or = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
            return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
    },
    El = Be(or),
    hi = ne({}, or, { view: 0, detail: 0 }),
    Fy = Be(hi),
    mo,
    go,
    pr,
    Bs = ne({}, hi, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: Nl,
        button: 0,
        buttons: 0,
        relatedTarget: function (e) {
            return e.relatedTarget === void 0
                ? e.fromElement === e.srcElement
                    ? e.toElement
                    : e.fromElement
                : e.relatedTarget;
        },
        movementX: function (e) {
            return 'movementX' in e
                ? e.movementX
                : (e !== pr &&
                      (pr && e.type === 'mousemove'
                          ? ((mo = e.screenX - pr.screenX), (go = e.screenY - pr.screenY))
                          : (go = mo = 0),
                      (pr = e)),
                  mo);
        },
        movementY: function (e) {
            return 'movementY' in e ? e.movementY : go;
        },
    }),
    ic = Be(Bs),
    zy = ne({}, Bs, { dataTransfer: 0 }),
    By = Be(zy),
    $y = ne({}, hi, { relatedTarget: 0 }),
    yo = Be($y),
    Uy = ne({}, or, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Hy = Be(Uy),
    Wy = ne({}, or, {
        clipboardData: function (e) {
            return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
        },
    }),
    Ky = Be(Wy),
    Gy = ne({}, or, { data: 0 }),
    sc = Be(Gy),
    Qy = {
        Esc: 'Escape',
        Spacebar: ' ',
        Left: 'ArrowLeft',
        Up: 'ArrowUp',
        Right: 'ArrowRight',
        Down: 'ArrowDown',
        Del: 'Delete',
        Win: 'OS',
        Menu: 'ContextMenu',
        Apps: 'ContextMenu',
        Scroll: 'ScrollLock',
        MozPrintableKey: 'Unidentified',
    },
    Yy = {
        8: 'Backspace',
        9: 'Tab',
        12: 'Clear',
        13: 'Enter',
        16: 'Shift',
        17: 'Control',
        18: 'Alt',
        19: 'Pause',
        20: 'CapsLock',
        27: 'Escape',
        32: ' ',
        33: 'PageUp',
        34: 'PageDown',
        35: 'End',
        36: 'Home',
        37: 'ArrowLeft',
        38: 'ArrowUp',
        39: 'ArrowRight',
        40: 'ArrowDown',
        45: 'Insert',
        46: 'Delete',
        112: 'F1',
        113: 'F2',
        114: 'F3',
        115: 'F4',
        116: 'F5',
        117: 'F6',
        118: 'F7',
        119: 'F8',
        120: 'F9',
        121: 'F10',
        122: 'F11',
        123: 'F12',
        144: 'NumLock',
        145: 'ScrollLock',
        224: 'Meta',
    },
    Xy = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
function Zy(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = Xy[e]) ? !!t[e] : !1;
}
function Nl() {
    return Zy;
}
var qy = ne({}, hi, {
        key: function (e) {
            if (e.key) {
                var t = Qy[e.key] || e.key;
                if (t !== 'Unidentified') return t;
            }
            return e.type === 'keypress'
                ? ((e = Gi(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
                : e.type === 'keydown' || e.type === 'keyup'
                  ? Yy[e.keyCode] || 'Unidentified'
                  : '';
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: Nl,
        charCode: function (e) {
            return e.type === 'keypress' ? Gi(e) : 0;
        },
        keyCode: function (e) {
            return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
        },
        which: function (e) {
            return e.type === 'keypress'
                ? Gi(e)
                : e.type === 'keydown' || e.type === 'keyup'
                  ? e.keyCode
                  : 0;
        },
    }),
    Jy = Be(qy),
    e0 = ne({}, Bs, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0,
    }),
    oc = Be(e0),
    t0 = ne({}, hi, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: Nl,
    }),
    n0 = Be(t0),
    r0 = ne({}, or, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    i0 = Be(r0),
    s0 = ne({}, Bs, {
        deltaX: function (e) {
            return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0;
        },
        deltaY: function (e) {
            return 'deltaY' in e
                ? e.deltaY
                : 'wheelDeltaY' in e
                  ? -e.wheelDeltaY
                  : 'wheelDelta' in e
                    ? -e.wheelDelta
                    : 0;
        },
        deltaZ: 0,
        deltaMode: 0,
    }),
    o0 = Be(s0),
    a0 = [9, 13, 27, 32],
    Ll = St && 'CompositionEvent' in window,
    jr = null;
St && 'documentMode' in document && (jr = document.documentMode);
var l0 = St && 'TextEvent' in window && !jr,
    Nh = St && (!Ll || (jr && 8 < jr && 11 >= jr)),
    ac = ' ',
    lc = !1;
function Lh(e, t) {
    switch (e) {
        case 'keyup':
            return a0.indexOf(t.keyCode) !== -1;
        case 'keydown':
            return t.keyCode !== 229;
        case 'keypress':
        case 'mousedown':
        case 'focusout':
            return !0;
        default:
            return !1;
    }
}
function jh(e) {
    return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null);
}
var Nn = !1;
function u0(e, t) {
    switch (e) {
        case 'compositionend':
            return jh(t);
        case 'keypress':
            return t.which !== 32 ? null : ((lc = !0), ac);
        case 'textInput':
            return ((e = t.data), e === ac && lc ? null : e);
        default:
            return null;
    }
}
function c0(e, t) {
    if (Nn)
        return e === 'compositionend' || (!Ll && Lh(e, t))
            ? ((e = Eh()), (Ki = Tl = Mt = null), (Nn = !1), e)
            : null;
    switch (e) {
        case 'paste':
            return null;
        case 'keypress':
            if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
                if (t.char && 1 < t.char.length) return t.char;
                if (t.which) return String.fromCharCode(t.which);
            }
            return null;
        case 'compositionend':
            return Nh && t.locale !== 'ko' ? null : t.data;
        default:
            return null;
    }
}
var d0 = {
    color: !0,
    date: !0,
    datetime: !0,
    'datetime-local': !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0,
};
function uc(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === 'input' ? !!d0[e.type] : t === 'textarea';
}
function Rh(e, t, n, r) {
    (ah(r),
        (t = ds(t, 'onChange')),
        0 < t.length &&
            ((n = new El('onChange', 'change', null, n, r)), e.push({ event: n, listeners: t })));
}
var Rr = null,
    Qr = null;
function f0(e) {
    Bh(e, 0);
}
function $s(e) {
    var t = Rn(e);
    if (eh(t)) return e;
}
function h0(e, t) {
    if (e === 'change') return t;
}
var Ah = !1;
if (St) {
    var vo;
    if (St) {
        var xo = 'oninput' in document;
        if (!xo) {
            var cc = document.createElement('div');
            (cc.setAttribute('oninput', 'return;'), (xo = typeof cc.oninput == 'function'));
        }
        vo = xo;
    } else vo = !1;
    Ah = vo && (!document.documentMode || 9 < document.documentMode);
}
function dc() {
    Rr && (Rr.detachEvent('onpropertychange', Dh), (Qr = Rr = null));
}
function Dh(e) {
    if (e.propertyName === 'value' && $s(Qr)) {
        var t = [];
        (Rh(t, Qr, e, wl(e)), dh(f0, t));
    }
}
function p0(e, t, n) {
    e === 'focusin'
        ? (dc(), (Rr = t), (Qr = n), Rr.attachEvent('onpropertychange', Dh))
        : e === 'focusout' && dc();
}
function m0(e) {
    if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return $s(Qr);
}
function g0(e, t) {
    if (e === 'click') return $s(t);
}
function y0(e, t) {
    if (e === 'input' || e === 'change') return $s(t);
}
function v0(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var rt = typeof Object.is == 'function' ? Object.is : v0;
function Yr(e, t) {
    if (rt(e, t)) return !0;
    if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
    var n = Object.keys(e),
        r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!qo.call(t, i) || !rt(e[i], t[i])) return !1;
    }
    return !0;
}
function fc(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
}
function hc(e, t) {
    var n = fc(e);
    e = 0;
    for (var r; n; ) {
        if (n.nodeType === 3) {
            if (((r = e + n.textContent.length), e <= t && r >= t))
                return { node: n, offset: t - e };
            e = r;
        }
        e: {
            for (; n; ) {
                if (n.nextSibling) {
                    n = n.nextSibling;
                    break e;
                }
                n = n.parentNode;
            }
            n = void 0;
        }
        n = fc(n);
    }
}
function Mh(e, t) {
    return e && t
        ? e === t
            ? !0
            : e && e.nodeType === 3
              ? !1
              : t && t.nodeType === 3
                ? Mh(e, t.parentNode)
                : 'contains' in e
                  ? e.contains(t)
                  : e.compareDocumentPosition
                    ? !!(e.compareDocumentPosition(t) & 16)
                    : !1
        : !1;
}
function Oh() {
    for (var e = window, t = is(); t instanceof e.HTMLIFrameElement; ) {
        try {
            var n = typeof t.contentWindow.location.href == 'string';
        } catch {
            n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = is(e.document);
    }
    return t;
}
function jl(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return (
        t &&
        ((t === 'input' &&
            (e.type === 'text' ||
                e.type === 'search' ||
                e.type === 'tel' ||
                e.type === 'url' ||
                e.type === 'password')) ||
            t === 'textarea' ||
            e.contentEditable === 'true')
    );
}
function x0(e) {
    var t = Oh(),
        n = e.focusedElem,
        r = e.selectionRange;
    if (t !== n && n && n.ownerDocument && Mh(n.ownerDocument.documentElement, n)) {
        if (r !== null && jl(n)) {
            if (((t = r.start), (e = r.end), e === void 0 && (e = t), 'selectionStart' in n))
                ((n.selectionStart = t), (n.selectionEnd = Math.min(e, n.value.length)));
            else if (
                ((e = ((t = n.ownerDocument || document) && t.defaultView) || window),
                e.getSelection)
            ) {
                e = e.getSelection();
                var i = n.textContent.length,
                    s = Math.min(r.start, i);
                ((r = r.end === void 0 ? s : Math.min(r.end, i)),
                    !e.extend && s > r && ((i = r), (r = s), (s = i)),
                    (i = hc(n, s)));
                var o = hc(n, r);
                i &&
                    o &&
                    (e.rangeCount !== 1 ||
                        e.anchorNode !== i.node ||
                        e.anchorOffset !== i.offset ||
                        e.focusNode !== o.node ||
                        e.focusOffset !== o.offset) &&
                    ((t = t.createRange()),
                    t.setStart(i.node, i.offset),
                    e.removeAllRanges(),
                    s > r
                        ? (e.addRange(t), e.extend(o.node, o.offset))
                        : (t.setEnd(o.node, o.offset), e.addRange(t)));
            }
        }
        for (t = [], e = n; (e = e.parentNode); )
            e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
        for (typeof n.focus == 'function' && n.focus(), n = 0; n < t.length; n++)
            ((e = t[n]), (e.element.scrollLeft = e.left), (e.element.scrollTop = e.top));
    }
}
var w0 = St && 'documentMode' in document && 11 >= document.documentMode,
    Ln = null,
    ya = null,
    Ar = null,
    va = !1;
function pc(e, t, n) {
    var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    va ||
        Ln == null ||
        Ln !== is(r) ||
        ((r = Ln),
        'selectionStart' in r && jl(r)
            ? (r = { start: r.selectionStart, end: r.selectionEnd })
            : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
              (r = {
                  anchorNode: r.anchorNode,
                  anchorOffset: r.anchorOffset,
                  focusNode: r.focusNode,
                  focusOffset: r.focusOffset,
              })),
        (Ar && Yr(Ar, r)) ||
            ((Ar = r),
            (r = ds(ya, 'onSelect')),
            0 < r.length &&
                ((t = new El('onSelect', 'select', null, t, n)),
                e.push({ event: t, listeners: r }),
                (t.target = Ln))));
}
function ji(e, t) {
    var n = {};
    return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n['Webkit' + e] = 'webkit' + t),
        (n['Moz' + e] = 'moz' + t),
        n
    );
}
var jn = {
        animationend: ji('Animation', 'AnimationEnd'),
        animationiteration: ji('Animation', 'AnimationIteration'),
        animationstart: ji('Animation', 'AnimationStart'),
        transitionend: ji('Transition', 'TransitionEnd'),
    },
    wo = {},
    Vh = {};
St &&
    ((Vh = document.createElement('div').style),
    'AnimationEvent' in window ||
        (delete jn.animationend.animation,
        delete jn.animationiteration.animation,
        delete jn.animationstart.animation),
    'TransitionEvent' in window || delete jn.transitionend.transition);
function Us(e) {
    if (wo[e]) return wo[e];
    if (!jn[e]) return e;
    var t = jn[e],
        n;
    for (n in t) if (t.hasOwnProperty(n) && n in Vh) return (wo[e] = t[n]);
    return e;
}
var bh = Us('animationend'),
    _h = Us('animationiteration'),
    Ih = Us('animationstart'),
    Fh = Us('transitionend'),
    zh = new Map(),
    mc =
        'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
            ' ',
        );
function Gt(e, t) {
    (zh.set(e, t), yn(t, [e]));
}
for (var So = 0; So < mc.length; So++) {
    var ko = mc[So],
        S0 = ko.toLowerCase(),
        k0 = ko[0].toUpperCase() + ko.slice(1);
    Gt(S0, 'on' + k0);
}
Gt(bh, 'onAnimationEnd');
Gt(_h, 'onAnimationIteration');
Gt(Ih, 'onAnimationStart');
Gt('dblclick', 'onDoubleClick');
Gt('focusin', 'onFocus');
Gt('focusout', 'onBlur');
Gt(Fh, 'onTransitionEnd');
Qn('onMouseEnter', ['mouseout', 'mouseover']);
Qn('onMouseLeave', ['mouseout', 'mouseover']);
Qn('onPointerEnter', ['pointerout', 'pointerover']);
Qn('onPointerLeave', ['pointerout', 'pointerover']);
yn('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '));
yn(
    'onSelect',
    'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(
        ' ',
    ),
);
yn('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']);
yn('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '));
yn('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '));
yn('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '));
var Cr =
        'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
            ' ',
        ),
    C0 = new Set('cancel close invalid load scroll toggle'.split(' ').concat(Cr));
function gc(e, t, n) {
    var r = e.type || 'unknown-event';
    ((e.currentTarget = n), Sy(r, t, void 0, e), (e.currentTarget = null));
}
function Bh(e, t) {
    t = (t & 4) !== 0;
    for (var n = 0; n < e.length; n++) {
        var r = e[n],
            i = r.event;
        r = r.listeners;
        e: {
            var s = void 0;
            if (t)
                for (var o = r.length - 1; 0 <= o; o--) {
                    var a = r[o],
                        l = a.instance,
                        u = a.currentTarget;
                    if (((a = a.listener), l !== s && i.isPropagationStopped())) break e;
                    (gc(i, a, u), (s = l));
                }
            else
                for (o = 0; o < r.length; o++) {
                    if (
                        ((a = r[o]),
                        (l = a.instance),
                        (u = a.currentTarget),
                        (a = a.listener),
                        l !== s && i.isPropagationStopped())
                    )
                        break e;
                    (gc(i, a, u), (s = l));
                }
        }
    }
    if (os) throw ((e = ha), (os = !1), (ha = null), e);
}
function G(e, t) {
    var n = t[Ca];
    n === void 0 && (n = t[Ca] = new Set());
    var r = e + '__bubble';
    n.has(r) || ($h(t, e, 2, !1), n.add(r));
}
function Co(e, t, n) {
    var r = 0;
    (t && (r |= 4), $h(n, e, r, t));
}
var Ri = '_reactListening' + Math.random().toString(36).slice(2);
function Xr(e) {
    if (!e[Ri]) {
        ((e[Ri] = !0),
            Yf.forEach(function (n) {
                n !== 'selectionchange' && (C0.has(n) || Co(n, !1, e), Co(n, !0, e));
            }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[Ri] || ((t[Ri] = !0), Co('selectionchange', !1, t));
    }
}
function $h(e, t, n, r) {
    switch (Th(t)) {
        case 1:
            var i = _y;
            break;
        case 4:
            i = Iy;
            break;
        default:
            i = Pl;
    }
    ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !fa || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (i = !0),
        r
            ? i !== void 0
                ? e.addEventListener(t, n, { capture: !0, passive: i })
                : e.addEventListener(t, n, !0)
            : i !== void 0
              ? e.addEventListener(t, n, { passive: i })
              : e.addEventListener(t, n, !1));
}
function Po(e, t, n, r, i) {
    var s = r;
    if (!(t & 1) && !(t & 2) && r !== null)
        e: for (;;) {
            if (r === null) return;
            var o = r.tag;
            if (o === 3 || o === 4) {
                var a = r.stateNode.containerInfo;
                if (a === i || (a.nodeType === 8 && a.parentNode === i)) break;
                if (o === 4)
                    for (o = r.return; o !== null; ) {
                        var l = o.tag;
                        if (
                            (l === 3 || l === 4) &&
                            ((l = o.stateNode.containerInfo),
                            l === i || (l.nodeType === 8 && l.parentNode === i))
                        )
                            return;
                        o = o.return;
                    }
                for (; a !== null; ) {
                    if (((o = rn(a)), o === null)) return;
                    if (((l = o.tag), l === 5 || l === 6)) {
                        r = s = o;
                        continue e;
                    }
                    a = a.parentNode;
                }
            }
            r = r.return;
        }
    dh(function () {
        var u = s,
            c = wl(n),
            d = [];
        e: {
            var f = zh.get(e);
            if (f !== void 0) {
                var m = El,
                    v = e;
                switch (e) {
                    case 'keypress':
                        if (Gi(n) === 0) break e;
                    case 'keydown':
                    case 'keyup':
                        m = Jy;
                        break;
                    case 'focusin':
                        ((v = 'focus'), (m = yo));
                        break;
                    case 'focusout':
                        ((v = 'blur'), (m = yo));
                        break;
                    case 'beforeblur':
                    case 'afterblur':
                        m = yo;
                        break;
                    case 'click':
                        if (n.button === 2) break e;
                    case 'auxclick':
                    case 'dblclick':
                    case 'mousedown':
                    case 'mousemove':
                    case 'mouseup':
                    case 'mouseout':
                    case 'mouseover':
                    case 'contextmenu':
                        m = ic;
                        break;
                    case 'drag':
                    case 'dragend':
                    case 'dragenter':
                    case 'dragexit':
                    case 'dragleave':
                    case 'dragover':
                    case 'dragstart':
                    case 'drop':
                        m = By;
                        break;
                    case 'touchcancel':
                    case 'touchend':
                    case 'touchmove':
                    case 'touchstart':
                        m = n0;
                        break;
                    case bh:
                    case _h:
                    case Ih:
                        m = Hy;
                        break;
                    case Fh:
                        m = i0;
                        break;
                    case 'scroll':
                        m = Fy;
                        break;
                    case 'wheel':
                        m = o0;
                        break;
                    case 'copy':
                    case 'cut':
                    case 'paste':
                        m = Ky;
                        break;
                    case 'gotpointercapture':
                    case 'lostpointercapture':
                    case 'pointercancel':
                    case 'pointerdown':
                    case 'pointermove':
                    case 'pointerout':
                    case 'pointerover':
                    case 'pointerup':
                        m = oc;
                }
                var x = (t & 4) !== 0,
                    k = !x && e === 'scroll',
                    p = x ? (f !== null ? f + 'Capture' : null) : f;
                x = [];
                for (var h = u, y; h !== null; ) {
                    y = h;
                    var w = y.stateNode;
                    if (
                        (y.tag === 5 &&
                            w !== null &&
                            ((y = w),
                            p !== null && ((w = Hr(h, p)), w != null && x.push(Zr(h, w, y)))),
                        k)
                    )
                        break;
                    h = h.return;
                }
                0 < x.length && ((f = new m(f, v, null, n, c)), d.push({ event: f, listeners: x }));
            }
        }
        if (!(t & 7)) {
            e: {
                if (
                    ((f = e === 'mouseover' || e === 'pointerover'),
                    (m = e === 'mouseout' || e === 'pointerout'),
                    f && n !== ca && (v = n.relatedTarget || n.fromElement) && (rn(v) || v[kt]))
                )
                    break e;
                if (
                    (m || f) &&
                    ((f =
                        c.window === c
                            ? c
                            : (f = c.ownerDocument)
                              ? f.defaultView || f.parentWindow
                              : window),
                    m
                        ? ((v = n.relatedTarget || n.toElement),
                          (m = u),
                          (v = v ? rn(v) : null),
                          v !== null &&
                              ((k = vn(v)), v !== k || (v.tag !== 5 && v.tag !== 6)) &&
                              (v = null))
                        : ((m = null), (v = u)),
                    m !== v)
                ) {
                    if (
                        ((x = ic),
                        (w = 'onMouseLeave'),
                        (p = 'onMouseEnter'),
                        (h = 'mouse'),
                        (e === 'pointerout' || e === 'pointerover') &&
                            ((x = oc),
                            (w = 'onPointerLeave'),
                            (p = 'onPointerEnter'),
                            (h = 'pointer')),
                        (k = m == null ? f : Rn(m)),
                        (y = v == null ? f : Rn(v)),
                        (f = new x(w, h + 'leave', m, n, c)),
                        (f.target = k),
                        (f.relatedTarget = y),
                        (w = null),
                        rn(c) === u &&
                            ((x = new x(p, h + 'enter', v, n, c)),
                            (x.target = y),
                            (x.relatedTarget = k),
                            (w = x)),
                        (k = w),
                        m && v)
                    )
                        t: {
                            for (x = m, p = v, h = 0, y = x; y; y = Sn(y)) h++;
                            for (y = 0, w = p; w; w = Sn(w)) y++;
                            for (; 0 < h - y; ) ((x = Sn(x)), h--);
                            for (; 0 < y - h; ) ((p = Sn(p)), y--);
                            for (; h--; ) {
                                if (x === p || (p !== null && x === p.alternate)) break t;
                                ((x = Sn(x)), (p = Sn(p)));
                            }
                            x = null;
                        }
                    else x = null;
                    (m !== null && yc(d, f, m, x, !1),
                        v !== null && k !== null && yc(d, k, v, x, !0));
                }
            }
            e: {
                if (
                    ((f = u ? Rn(u) : window),
                    (m = f.nodeName && f.nodeName.toLowerCase()),
                    m === 'select' || (m === 'input' && f.type === 'file'))
                )
                    var S = h0;
                else if (uc(f))
                    if (Ah) S = y0;
                    else {
                        S = m0;
                        var P = p0;
                    }
                else
                    (m = f.nodeName) &&
                        m.toLowerCase() === 'input' &&
                        (f.type === 'checkbox' || f.type === 'radio') &&
                        (S = g0);
                if (S && (S = S(e, u))) {
                    Rh(d, S, n, c);
                    break e;
                }
                (P && P(e, f, u),
                    e === 'focusout' &&
                        (P = f._wrapperState) &&
                        P.controlled &&
                        f.type === 'number' &&
                        sa(f, 'number', f.value));
            }
            switch (((P = u ? Rn(u) : window), e)) {
                case 'focusin':
                    (uc(P) || P.contentEditable === 'true') && ((Ln = P), (ya = u), (Ar = null));
                    break;
                case 'focusout':
                    Ar = ya = Ln = null;
                    break;
                case 'mousedown':
                    va = !0;
                    break;
                case 'contextmenu':
                case 'mouseup':
                case 'dragend':
                    ((va = !1), pc(d, n, c));
                    break;
                case 'selectionchange':
                    if (w0) break;
                case 'keydown':
                case 'keyup':
                    pc(d, n, c);
            }
            var E;
            if (Ll)
                e: {
                    switch (e) {
                        case 'compositionstart':
                            var C = 'onCompositionStart';
                            break e;
                        case 'compositionend':
                            C = 'onCompositionEnd';
                            break e;
                        case 'compositionupdate':
                            C = 'onCompositionUpdate';
                            break e;
                    }
                    C = void 0;
                }
            else
                Nn
                    ? Lh(e, n) && (C = 'onCompositionEnd')
                    : e === 'keydown' && n.keyCode === 229 && (C = 'onCompositionStart');
            (C &&
                (Nh &&
                    n.locale !== 'ko' &&
                    (Nn || C !== 'onCompositionStart'
                        ? C === 'onCompositionEnd' && Nn && (E = Eh())
                        : ((Mt = c), (Tl = 'value' in Mt ? Mt.value : Mt.textContent), (Nn = !0))),
                (P = ds(u, C)),
                0 < P.length &&
                    ((C = new sc(C, e, null, n, c)),
                    d.push({ event: C, listeners: P }),
                    E ? (C.data = E) : ((E = jh(n)), E !== null && (C.data = E)))),
                (E = l0 ? u0(e, n) : c0(e, n)) &&
                    ((u = ds(u, 'onBeforeInput')),
                    0 < u.length &&
                        ((c = new sc('onBeforeInput', 'beforeinput', null, n, c)),
                        d.push({ event: c, listeners: u }),
                        (c.data = E))));
        }
        Bh(d, t);
    });
}
function Zr(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
}
function ds(e, t) {
    for (var n = t + 'Capture', r = []; e !== null; ) {
        var i = e,
            s = i.stateNode;
        (i.tag === 5 &&
            s !== null &&
            ((i = s),
            (s = Hr(e, n)),
            s != null && r.unshift(Zr(e, s, i)),
            (s = Hr(e, t)),
            s != null && r.push(Zr(e, s, i))),
            (e = e.return));
    }
    return r;
}
function Sn(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5);
    return e || null;
}
function yc(e, t, n, r, i) {
    for (var s = t._reactName, o = []; n !== null && n !== r; ) {
        var a = n,
            l = a.alternate,
            u = a.stateNode;
        if (l !== null && l === r) break;
        (a.tag === 5 &&
            u !== null &&
            ((a = u),
            i
                ? ((l = Hr(n, s)), l != null && o.unshift(Zr(n, l, a)))
                : i || ((l = Hr(n, s)), l != null && o.push(Zr(n, l, a)))),
            (n = n.return));
    }
    o.length !== 0 && e.push({ event: t, listeners: o });
}
var P0 = /\r\n?/g,
    T0 = /\u0000|\uFFFD/g;
function vc(e) {
    return (typeof e == 'string' ? e : '' + e)
        .replace(
            P0,
            `
`,
        )
        .replace(T0, '');
}
function Ai(e, t, n) {
    if (((t = vc(t)), vc(e) !== t && n)) throw Error(T(425));
}
function fs() {}
var xa = null,
    wa = null;
function Sa(e, t) {
    return (
        e === 'textarea' ||
        e === 'noscript' ||
        typeof t.children == 'string' ||
        typeof t.children == 'number' ||
        (typeof t.dangerouslySetInnerHTML == 'object' &&
            t.dangerouslySetInnerHTML !== null &&
            t.dangerouslySetInnerHTML.__html != null)
    );
}
var ka = typeof setTimeout == 'function' ? setTimeout : void 0,
    E0 = typeof clearTimeout == 'function' ? clearTimeout : void 0,
    xc = typeof Promise == 'function' ? Promise : void 0,
    N0 =
        typeof queueMicrotask == 'function'
            ? queueMicrotask
            : typeof xc < 'u'
              ? function (e) {
                    return xc.resolve(null).then(e).catch(L0);
                }
              : ka;
function L0(e) {
    setTimeout(function () {
        throw e;
    });
}
function To(e, t) {
    var n = t,
        r = 0;
    do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8))
            if (((n = i.data), n === '/$')) {
                if (r === 0) {
                    (e.removeChild(i), Gr(t));
                    return;
                }
                r--;
            } else (n !== '$' && n !== '$?' && n !== '$!') || r++;
        n = i;
    } while (n);
    Gr(t);
}
function It(e) {
    for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === 1 || t === 3) break;
        if (t === 8) {
            if (((t = e.data), t === '$' || t === '$!' || t === '$?')) break;
            if (t === '/$') return null;
        }
    }
    return e;
}
function wc(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
        if (e.nodeType === 8) {
            var n = e.data;
            if (n === '$' || n === '$!' || n === '$?') {
                if (t === 0) return e;
                t--;
            } else n === '/$' && t++;
        }
        e = e.previousSibling;
    }
    return null;
}
var ar = Math.random().toString(36).slice(2),
    lt = '__reactFiber$' + ar,
    qr = '__reactProps$' + ar,
    kt = '__reactContainer$' + ar,
    Ca = '__reactEvents$' + ar,
    j0 = '__reactListeners$' + ar,
    R0 = '__reactHandles$' + ar;
function rn(e) {
    var t = e[lt];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
        if ((t = n[kt] || n[lt])) {
            if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
                for (e = wc(e); e !== null; ) {
                    if ((n = e[lt])) return n;
                    e = wc(e);
                }
            return t;
        }
        ((e = n), (n = e.parentNode));
    }
    return null;
}
function pi(e) {
    return (
        (e = e[lt] || e[kt]),
        !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
    );
}
function Rn(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(T(33));
}
function Hs(e) {
    return e[qr] || null;
}
var Pa = [],
    An = -1;
function Qt(e) {
    return { current: e };
}
function Q(e) {
    0 > An || ((e.current = Pa[An]), (Pa[An] = null), An--);
}
function K(e, t) {
    (An++, (Pa[An] = e.current), (e.current = t));
}
var Ht = {},
    Ce = Qt(Ht),
    Ae = Qt(!1),
    dn = Ht;
function Yn(e, t) {
    var n = e.type.contextTypes;
    if (!n) return Ht;
    var r = e.stateNode;
    if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
        return r.__reactInternalMemoizedMaskedChildContext;
    var i = {},
        s;
    for (s in n) i[s] = t[s];
    return (
        r &&
            ((e = e.stateNode),
            (e.__reactInternalMemoizedUnmaskedChildContext = t),
            (e.__reactInternalMemoizedMaskedChildContext = i)),
        i
    );
}
function De(e) {
    return ((e = e.childContextTypes), e != null);
}
function hs() {
    (Q(Ae), Q(Ce));
}
function Sc(e, t, n) {
    if (Ce.current !== Ht) throw Error(T(168));
    (K(Ce, t), K(Ae, n));
}
function Uh(e, t, n) {
    var r = e.stateNode;
    if (((t = t.childContextTypes), typeof r.getChildContext != 'function')) return n;
    r = r.getChildContext();
    for (var i in r) if (!(i in t)) throw Error(T(108, py(e) || 'Unknown', i));
    return ne({}, n, r);
}
function ps(e) {
    return (
        (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || Ht),
        (dn = Ce.current),
        K(Ce, e),
        K(Ae, Ae.current),
        !0
    );
}
function kc(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(T(169));
    (n
        ? ((e = Uh(e, t, dn)),
          (r.__reactInternalMemoizedMergedChildContext = e),
          Q(Ae),
          Q(Ce),
          K(Ce, e))
        : Q(Ae),
        K(Ae, n));
}
var mt = null,
    Ws = !1,
    Eo = !1;
function Hh(e) {
    mt === null ? (mt = [e]) : mt.push(e);
}
function A0(e) {
    ((Ws = !0), Hh(e));
}
function Yt() {
    if (!Eo && mt !== null) {
        Eo = !0;
        var e = 0,
            t = H;
        try {
            var n = mt;
            for (H = 1; e < n.length; e++) {
                var r = n[e];
                do r = r(!0);
                while (r !== null);
            }
            ((mt = null), (Ws = !1));
        } catch (i) {
            throw (mt !== null && (mt = mt.slice(e + 1)), mh(Sl, Yt), i);
        } finally {
            ((H = t), (Eo = !1));
        }
    }
    return null;
}
var Dn = [],
    Mn = 0,
    ms = null,
    gs = 0,
    He = [],
    We = 0,
    fn = null,
    gt = 1,
    yt = '';
function Jt(e, t) {
    ((Dn[Mn++] = gs), (Dn[Mn++] = ms), (ms = e), (gs = t));
}
function Wh(e, t, n) {
    ((He[We++] = gt), (He[We++] = yt), (He[We++] = fn), (fn = e));
    var r = gt;
    e = yt;
    var i = 32 - tt(r) - 1;
    ((r &= ~(1 << i)), (n += 1));
    var s = 32 - tt(t) + i;
    if (30 < s) {
        var o = i - (i % 5);
        ((s = (r & ((1 << o) - 1)).toString(32)),
            (r >>= o),
            (i -= o),
            (gt = (1 << (32 - tt(t) + i)) | (n << i) | r),
            (yt = s + e));
    } else ((gt = (1 << s) | (n << i) | r), (yt = e));
}
function Rl(e) {
    e.return !== null && (Jt(e, 1), Wh(e, 1, 0));
}
function Al(e) {
    for (; e === ms; ) ((ms = Dn[--Mn]), (Dn[Mn] = null), (gs = Dn[--Mn]), (Dn[Mn] = null));
    for (; e === fn; )
        ((fn = He[--We]),
            (He[We] = null),
            (yt = He[--We]),
            (He[We] = null),
            (gt = He[--We]),
            (He[We] = null));
}
var be = null,
    Ve = null,
    X = !1,
    et = null;
function Kh(e, t) {
    var n = Ke(5, null, null, 0);
    ((n.elementType = 'DELETED'),
        (n.stateNode = t),
        (n.return = e),
        (t = e.deletions),
        t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function Cc(e, t) {
    switch (e.tag) {
        case 5:
            var n = e.type;
            return (
                (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
                t !== null ? ((e.stateNode = t), (be = e), (Ve = It(t.firstChild)), !0) : !1
            );
        case 6:
            return (
                (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
                t !== null ? ((e.stateNode = t), (be = e), (Ve = null), !0) : !1
            );
        case 13:
            return (
                (t = t.nodeType !== 8 ? null : t),
                t !== null
                    ? ((n = fn !== null ? { id: gt, overflow: yt } : null),
                      (e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }),
                      (n = Ke(18, null, null, 0)),
                      (n.stateNode = t),
                      (n.return = e),
                      (e.child = n),
                      (be = e),
                      (Ve = null),
                      !0)
                    : !1
            );
        default:
            return !1;
    }
}
function Ta(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Ea(e) {
    if (X) {
        var t = Ve;
        if (t) {
            var n = t;
            if (!Cc(e, t)) {
                if (Ta(e)) throw Error(T(418));
                t = It(n.nextSibling);
                var r = be;
                t && Cc(e, t) ? Kh(r, n) : ((e.flags = (e.flags & -4097) | 2), (X = !1), (be = e));
            }
        } else {
            if (Ta(e)) throw Error(T(418));
            ((e.flags = (e.flags & -4097) | 2), (X = !1), (be = e));
        }
    }
}
function Pc(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    be = e;
}
function Di(e) {
    if (e !== be) return !1;
    if (!X) return (Pc(e), (X = !0), !1);
    var t;
    if (
        ((t = e.tag !== 3) &&
            !(t = e.tag !== 5) &&
            ((t = e.type), (t = t !== 'head' && t !== 'body' && !Sa(e.type, e.memoizedProps))),
        t && (t = Ve))
    ) {
        if (Ta(e)) throw (Gh(), Error(T(418)));
        for (; t; ) (Kh(e, t), (t = It(t.nextSibling)));
    }
    if ((Pc(e), e.tag === 13)) {
        if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
            throw Error(T(317));
        e: {
            for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                    var n = e.data;
                    if (n === '/$') {
                        if (t === 0) {
                            Ve = It(e.nextSibling);
                            break e;
                        }
                        t--;
                    } else (n !== '$' && n !== '$!' && n !== '$?') || t++;
                }
                e = e.nextSibling;
            }
            Ve = null;
        }
    } else Ve = be ? It(e.stateNode.nextSibling) : null;
    return !0;
}
function Gh() {
    for (var e = Ve; e; ) e = It(e.nextSibling);
}
function Xn() {
    ((Ve = be = null), (X = !1));
}
function Dl(e) {
    et === null ? (et = [e]) : et.push(e);
}
var D0 = Et.ReactCurrentBatchConfig;
function mr(e, t, n) {
    if (((e = n.ref), e !== null && typeof e != 'function' && typeof e != 'object')) {
        if (n._owner) {
            if (((n = n._owner), n)) {
                if (n.tag !== 1) throw Error(T(309));
                var r = n.stateNode;
            }
            if (!r) throw Error(T(147, e));
            var i = r,
                s = '' + e;
            return t !== null &&
                t.ref !== null &&
                typeof t.ref == 'function' &&
                t.ref._stringRef === s
                ? t.ref
                : ((t = function (o) {
                      var a = i.refs;
                      o === null ? delete a[s] : (a[s] = o);
                  }),
                  (t._stringRef = s),
                  t);
        }
        if (typeof e != 'string') throw Error(T(284));
        if (!n._owner) throw Error(T(290, e));
    }
    return e;
}
function Mi(e, t) {
    throw (
        (e = Object.prototype.toString.call(t)),
        Error(
            T(
                31,
                e === '[object Object]'
                    ? 'object with keys {' + Object.keys(t).join(', ') + '}'
                    : e,
            ),
        )
    );
}
function Tc(e) {
    var t = e._init;
    return t(e._payload);
}
function Qh(e) {
    function t(p, h) {
        if (e) {
            var y = p.deletions;
            y === null ? ((p.deletions = [h]), (p.flags |= 16)) : y.push(h);
        }
    }
    function n(p, h) {
        if (!e) return null;
        for (; h !== null; ) (t(p, h), (h = h.sibling));
        return null;
    }
    function r(p, h) {
        for (p = new Map(); h !== null; )
            (h.key !== null ? p.set(h.key, h) : p.set(h.index, h), (h = h.sibling));
        return p;
    }
    function i(p, h) {
        return ((p = $t(p, h)), (p.index = 0), (p.sibling = null), p);
    }
    function s(p, h, y) {
        return (
            (p.index = y),
            e
                ? ((y = p.alternate),
                  y !== null
                      ? ((y = y.index), y < h ? ((p.flags |= 2), h) : y)
                      : ((p.flags |= 2), h))
                : ((p.flags |= 1048576), h)
        );
    }
    function o(p) {
        return (e && p.alternate === null && (p.flags |= 2), p);
    }
    function a(p, h, y, w) {
        return h === null || h.tag !== 6
            ? ((h = Mo(y, p.mode, w)), (h.return = p), h)
            : ((h = i(h, y)), (h.return = p), h);
    }
    function l(p, h, y, w) {
        var S = y.type;
        return S === En
            ? c(p, h, y.props.children, w, y.key)
            : h !== null &&
                (h.elementType === S ||
                    (typeof S == 'object' && S !== null && S.$$typeof === jt && Tc(S) === h.type))
              ? ((w = i(h, y.props)), (w.ref = mr(p, h, y)), (w.return = p), w)
              : ((w = es(y.type, y.key, y.props, null, p.mode, w)),
                (w.ref = mr(p, h, y)),
                (w.return = p),
                w);
    }
    function u(p, h, y, w) {
        return h === null ||
            h.tag !== 4 ||
            h.stateNode.containerInfo !== y.containerInfo ||
            h.stateNode.implementation !== y.implementation
            ? ((h = Oo(y, p.mode, w)), (h.return = p), h)
            : ((h = i(h, y.children || [])), (h.return = p), h);
    }
    function c(p, h, y, w, S) {
        return h === null || h.tag !== 7
            ? ((h = un(y, p.mode, w, S)), (h.return = p), h)
            : ((h = i(h, y)), (h.return = p), h);
    }
    function d(p, h, y) {
        if ((typeof h == 'string' && h !== '') || typeof h == 'number')
            return ((h = Mo('' + h, p.mode, y)), (h.return = p), h);
        if (typeof h == 'object' && h !== null) {
            switch (h.$$typeof) {
                case ki:
                    return (
                        (y = es(h.type, h.key, h.props, null, p.mode, y)),
                        (y.ref = mr(p, null, h)),
                        (y.return = p),
                        y
                    );
                case Tn:
                    return ((h = Oo(h, p.mode, y)), (h.return = p), h);
                case jt:
                    var w = h._init;
                    return d(p, w(h._payload), y);
            }
            if (Sr(h) || cr(h)) return ((h = un(h, p.mode, y, null)), (h.return = p), h);
            Mi(p, h);
        }
        return null;
    }
    function f(p, h, y, w) {
        var S = h !== null ? h.key : null;
        if ((typeof y == 'string' && y !== '') || typeof y == 'number')
            return S !== null ? null : a(p, h, '' + y, w);
        if (typeof y == 'object' && y !== null) {
            switch (y.$$typeof) {
                case ki:
                    return y.key === S ? l(p, h, y, w) : null;
                case Tn:
                    return y.key === S ? u(p, h, y, w) : null;
                case jt:
                    return ((S = y._init), f(p, h, S(y._payload), w));
            }
            if (Sr(y) || cr(y)) return S !== null ? null : c(p, h, y, w, null);
            Mi(p, y);
        }
        return null;
    }
    function m(p, h, y, w, S) {
        if ((typeof w == 'string' && w !== '') || typeof w == 'number')
            return ((p = p.get(y) || null), a(h, p, '' + w, S));
        if (typeof w == 'object' && w !== null) {
            switch (w.$$typeof) {
                case ki:
                    return ((p = p.get(w.key === null ? y : w.key) || null), l(h, p, w, S));
                case Tn:
                    return ((p = p.get(w.key === null ? y : w.key) || null), u(h, p, w, S));
                case jt:
                    var P = w._init;
                    return m(p, h, y, P(w._payload), S);
            }
            if (Sr(w) || cr(w)) return ((p = p.get(y) || null), c(h, p, w, S, null));
            Mi(h, w);
        }
        return null;
    }
    function v(p, h, y, w) {
        for (
            var S = null, P = null, E = h, C = (h = 0), A = null;
            E !== null && C < y.length;
            C++
        ) {
            E.index > C ? ((A = E), (E = null)) : (A = E.sibling);
            var j = f(p, E, y[C], w);
            if (j === null) {
                E === null && (E = A);
                break;
            }
            (e && E && j.alternate === null && t(p, E),
                (h = s(j, h, C)),
                P === null ? (S = j) : (P.sibling = j),
                (P = j),
                (E = A));
        }
        if (C === y.length) return (n(p, E), X && Jt(p, C), S);
        if (E === null) {
            for (; C < y.length; C++)
                ((E = d(p, y[C], w)),
                    E !== null &&
                        ((h = s(E, h, C)), P === null ? (S = E) : (P.sibling = E), (P = E)));
            return (X && Jt(p, C), S);
        }
        for (E = r(p, E); C < y.length; C++)
            ((A = m(E, p, C, y[C], w)),
                A !== null &&
                    (e && A.alternate !== null && E.delete(A.key === null ? C : A.key),
                    (h = s(A, h, C)),
                    P === null ? (S = A) : (P.sibling = A),
                    (P = A)));
        return (
            e &&
                E.forEach(function (Z) {
                    return t(p, Z);
                }),
            X && Jt(p, C),
            S
        );
    }
    function x(p, h, y, w) {
        var S = cr(y);
        if (typeof S != 'function') throw Error(T(150));
        if (((y = S.call(y)), y == null)) throw Error(T(151));
        for (
            var P = (S = null), E = h, C = (h = 0), A = null, j = y.next();
            E !== null && !j.done;
            C++, j = y.next()
        ) {
            E.index > C ? ((A = E), (E = null)) : (A = E.sibling);
            var Z = f(p, E, j.value, w);
            if (Z === null) {
                E === null && (E = A);
                break;
            }
            (e && E && Z.alternate === null && t(p, E),
                (h = s(Z, h, C)),
                P === null ? (S = Z) : (P.sibling = Z),
                (P = Z),
                (E = A));
        }
        if (j.done) return (n(p, E), X && Jt(p, C), S);
        if (E === null) {
            for (; !j.done; C++, j = y.next())
                ((j = d(p, j.value, w)),
                    j !== null &&
                        ((h = s(j, h, C)), P === null ? (S = j) : (P.sibling = j), (P = j)));
            return (X && Jt(p, C), S);
        }
        for (E = r(p, E); !j.done; C++, j = y.next())
            ((j = m(E, p, C, j.value, w)),
                j !== null &&
                    (e && j.alternate !== null && E.delete(j.key === null ? C : j.key),
                    (h = s(j, h, C)),
                    P === null ? (S = j) : (P.sibling = j),
                    (P = j)));
        return (
            e &&
                E.forEach(function (z) {
                    return t(p, z);
                }),
            X && Jt(p, C),
            S
        );
    }
    function k(p, h, y, w) {
        if (
            (typeof y == 'object' &&
                y !== null &&
                y.type === En &&
                y.key === null &&
                (y = y.props.children),
            typeof y == 'object' && y !== null)
        ) {
            switch (y.$$typeof) {
                case ki:
                    e: {
                        for (var S = y.key, P = h; P !== null; ) {
                            if (P.key === S) {
                                if (((S = y.type), S === En)) {
                                    if (P.tag === 7) {
                                        (n(p, P.sibling),
                                            (h = i(P, y.props.children)),
                                            (h.return = p),
                                            (p = h));
                                        break e;
                                    }
                                } else if (
                                    P.elementType === S ||
                                    (typeof S == 'object' &&
                                        S !== null &&
                                        S.$$typeof === jt &&
                                        Tc(S) === P.type)
                                ) {
                                    (n(p, P.sibling),
                                        (h = i(P, y.props)),
                                        (h.ref = mr(p, P, y)),
                                        (h.return = p),
                                        (p = h));
                                    break e;
                                }
                                n(p, P);
                                break;
                            } else t(p, P);
                            P = P.sibling;
                        }
                        y.type === En
                            ? ((h = un(y.props.children, p.mode, w, y.key)),
                              (h.return = p),
                              (p = h))
                            : ((w = es(y.type, y.key, y.props, null, p.mode, w)),
                              (w.ref = mr(p, h, y)),
                              (w.return = p),
                              (p = w));
                    }
                    return o(p);
                case Tn:
                    e: {
                        for (P = y.key; h !== null; ) {
                            if (h.key === P)
                                if (
                                    h.tag === 4 &&
                                    h.stateNode.containerInfo === y.containerInfo &&
                                    h.stateNode.implementation === y.implementation
                                ) {
                                    (n(p, h.sibling),
                                        (h = i(h, y.children || [])),
                                        (h.return = p),
                                        (p = h));
                                    break e;
                                } else {
                                    n(p, h);
                                    break;
                                }
                            else t(p, h);
                            h = h.sibling;
                        }
                        ((h = Oo(y, p.mode, w)), (h.return = p), (p = h));
                    }
                    return o(p);
                case jt:
                    return ((P = y._init), k(p, h, P(y._payload), w));
            }
            if (Sr(y)) return v(p, h, y, w);
            if (cr(y)) return x(p, h, y, w);
            Mi(p, y);
        }
        return (typeof y == 'string' && y !== '') || typeof y == 'number'
            ? ((y = '' + y),
              h !== null && h.tag === 6
                  ? (n(p, h.sibling), (h = i(h, y)), (h.return = p), (p = h))
                  : (n(p, h), (h = Mo(y, p.mode, w)), (h.return = p), (p = h)),
              o(p))
            : n(p, h);
    }
    return k;
}
var Zn = Qh(!0),
    Yh = Qh(!1),
    ys = Qt(null),
    vs = null,
    On = null,
    Ml = null;
function Ol() {
    Ml = On = vs = null;
}
function Vl(e) {
    var t = ys.current;
    (Q(ys), (e._currentValue = t));
}
function Na(e, t, n) {
    for (; e !== null; ) {
        var r = e.alternate;
        if (
            ((e.childLanes & t) !== t
                ? ((e.childLanes |= t), r !== null && (r.childLanes |= t))
                : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t),
            e === n)
        )
            break;
        e = e.return;
    }
}
function Kn(e, t) {
    ((vs = e),
        (Ml = On = null),
        (e = e.dependencies),
        e !== null &&
            e.firstContext !== null &&
            (e.lanes & t && (Re = !0), (e.firstContext = null)));
}
function Qe(e) {
    var t = e._currentValue;
    if (Ml !== e)
        if (((e = { context: e, memoizedValue: t, next: null }), On === null)) {
            if (vs === null) throw Error(T(308));
            ((On = e), (vs.dependencies = { lanes: 0, firstContext: e }));
        } else On = On.next = e;
    return t;
}
var sn = null;
function bl(e) {
    sn === null ? (sn = [e]) : sn.push(e);
}
function Xh(e, t, n, r) {
    var i = t.interleaved;
    return (
        i === null ? ((n.next = n), bl(t)) : ((n.next = i.next), (i.next = n)),
        (t.interleaved = n),
        Ct(e, r)
    );
}
function Ct(e, t) {
    e.lanes |= t;
    var n = e.alternate;
    for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
        ((e.childLanes |= t),
            (n = e.alternate),
            n !== null && (n.childLanes |= t),
            (n = e),
            (e = e.return));
    return n.tag === 3 ? n.stateNode : null;
}
var Rt = !1;
function _l(e) {
    e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, interleaved: null, lanes: 0 },
        effects: null,
    };
}
function Zh(e, t) {
    ((e = e.updateQueue),
        t.updateQueue === e &&
            (t.updateQueue = {
                baseState: e.baseState,
                firstBaseUpdate: e.firstBaseUpdate,
                lastBaseUpdate: e.lastBaseUpdate,
                shared: e.shared,
                effects: e.effects,
            }));
}
function vt(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function Ft(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (((r = r.shared), $ & 2)) {
        var i = r.pending;
        return (
            i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
            (r.pending = t),
            Ct(e, n)
        );
    }
    return (
        (i = r.interleaved),
        i === null ? ((t.next = t), bl(r)) : ((t.next = i.next), (i.next = t)),
        (r.interleaved = t),
        Ct(e, n)
    );
}
function Qi(e, t, n) {
    if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), kl(e, n));
    }
}
function Ec(e, t) {
    var n = e.updateQueue,
        r = e.alternate;
    if (r !== null && ((r = r.updateQueue), n === r)) {
        var i = null,
            s = null;
        if (((n = n.firstBaseUpdate), n !== null)) {
            do {
                var o = {
                    eventTime: n.eventTime,
                    lane: n.lane,
                    tag: n.tag,
                    payload: n.payload,
                    callback: n.callback,
                    next: null,
                };
                (s === null ? (i = s = o) : (s = s.next = o), (n = n.next));
            } while (n !== null);
            s === null ? (i = s = t) : (s = s.next = t);
        } else i = s = t;
        ((n = {
            baseState: r.baseState,
            firstBaseUpdate: i,
            lastBaseUpdate: s,
            shared: r.shared,
            effects: r.effects,
        }),
            (e.updateQueue = n));
        return;
    }
    ((e = n.lastBaseUpdate),
        e === null ? (n.firstBaseUpdate = t) : (e.next = t),
        (n.lastBaseUpdate = t));
}
function xs(e, t, n, r) {
    var i = e.updateQueue;
    Rt = !1;
    var s = i.firstBaseUpdate,
        o = i.lastBaseUpdate,
        a = i.shared.pending;
    if (a !== null) {
        i.shared.pending = null;
        var l = a,
            u = l.next;
        ((l.next = null), o === null ? (s = u) : (o.next = u), (o = l));
        var c = e.alternate;
        c !== null &&
            ((c = c.updateQueue),
            (a = c.lastBaseUpdate),
            a !== o &&
                (a === null ? (c.firstBaseUpdate = u) : (a.next = u), (c.lastBaseUpdate = l)));
    }
    if (s !== null) {
        var d = i.baseState;
        ((o = 0), (c = u = l = null), (a = s));
        do {
            var f = a.lane,
                m = a.eventTime;
            if ((r & f) === f) {
                c !== null &&
                    (c = c.next =
                        {
                            eventTime: m,
                            lane: 0,
                            tag: a.tag,
                            payload: a.payload,
                            callback: a.callback,
                            next: null,
                        });
                e: {
                    var v = e,
                        x = a;
                    switch (((f = t), (m = n), x.tag)) {
                        case 1:
                            if (((v = x.payload), typeof v == 'function')) {
                                d = v.call(m, d, f);
                                break e;
                            }
                            d = v;
                            break e;
                        case 3:
                            v.flags = (v.flags & -65537) | 128;
                        case 0:
                            if (
                                ((v = x.payload),
                                (f = typeof v == 'function' ? v.call(m, d, f) : v),
                                f == null)
                            )
                                break e;
                            d = ne({}, d, f);
                            break e;
                        case 2:
                            Rt = !0;
                    }
                }
                a.callback !== null &&
                    a.lane !== 0 &&
                    ((e.flags |= 64), (f = i.effects), f === null ? (i.effects = [a]) : f.push(a));
            } else
                ((m = {
                    eventTime: m,
                    lane: f,
                    tag: a.tag,
                    payload: a.payload,
                    callback: a.callback,
                    next: null,
                }),
                    c === null ? ((u = c = m), (l = d)) : (c = c.next = m),
                    (o |= f));
            if (((a = a.next), a === null)) {
                if (((a = i.shared.pending), a === null)) break;
                ((f = a),
                    (a = f.next),
                    (f.next = null),
                    (i.lastBaseUpdate = f),
                    (i.shared.pending = null));
            }
        } while (!0);
        if (
            (c === null && (l = d),
            (i.baseState = l),
            (i.firstBaseUpdate = u),
            (i.lastBaseUpdate = c),
            (t = i.shared.interleaved),
            t !== null)
        ) {
            i = t;
            do ((o |= i.lane), (i = i.next));
            while (i !== t);
        } else s === null && (i.shared.lanes = 0);
        ((pn |= o), (e.lanes = o), (e.memoizedState = d));
    }
}
function Nc(e, t, n) {
    if (((e = t.effects), (t.effects = null), e !== null))
        for (t = 0; t < e.length; t++) {
            var r = e[t],
                i = r.callback;
            if (i !== null) {
                if (((r.callback = null), (r = n), typeof i != 'function')) throw Error(T(191, i));
                i.call(r);
            }
        }
}
var mi = {},
    dt = Qt(mi),
    Jr = Qt(mi),
    ei = Qt(mi);
function on(e) {
    if (e === mi) throw Error(T(174));
    return e;
}
function Il(e, t) {
    switch ((K(ei, t), K(Jr, e), K(dt, mi), (e = t.nodeType), e)) {
        case 9:
        case 11:
            t = (t = t.documentElement) ? t.namespaceURI : aa(null, '');
            break;
        default:
            ((e = e === 8 ? t.parentNode : t),
                (t = e.namespaceURI || null),
                (e = e.tagName),
                (t = aa(t, e)));
    }
    (Q(dt), K(dt, t));
}
function qn() {
    (Q(dt), Q(Jr), Q(ei));
}
function qh(e) {
    on(ei.current);
    var t = on(dt.current),
        n = aa(t, e.type);
    t !== n && (K(Jr, e), K(dt, n));
}
function Fl(e) {
    Jr.current === e && (Q(dt), Q(Jr));
}
var J = Qt(0);
function ws(e) {
    for (var t = e; t !== null; ) {
        if (t.tag === 13) {
            var n = t.memoizedState;
            if (
                n !== null &&
                ((n = n.dehydrated), n === null || n.data === '$?' || n.data === '$!')
            )
                return t;
        } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
            if (t.flags & 128) return t;
        } else if (t.child !== null) {
            ((t.child.return = t), (t = t.child));
            continue;
        }
        if (t === e) break;
        for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) return null;
            t = t.return;
        }
        ((t.sibling.return = t.return), (t = t.sibling));
    }
    return null;
}
var No = [];
function zl() {
    for (var e = 0; e < No.length; e++) No[e]._workInProgressVersionPrimary = null;
    No.length = 0;
}
var Yi = Et.ReactCurrentDispatcher,
    Lo = Et.ReactCurrentBatchConfig,
    hn = 0,
    te = null,
    ce = null,
    fe = null,
    Ss = !1,
    Dr = !1,
    ti = 0,
    M0 = 0;
function ve() {
    throw Error(T(321));
}
function Bl(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++) if (!rt(e[n], t[n])) return !1;
    return !0;
}
function $l(e, t, n, r, i, s) {
    if (
        ((hn = s),
        (te = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (Yi.current = e === null || e.memoizedState === null ? _0 : I0),
        (e = n(r, i)),
        Dr)
    ) {
        s = 0;
        do {
            if (((Dr = !1), (ti = 0), 25 <= s)) throw Error(T(301));
            ((s += 1), (fe = ce = null), (t.updateQueue = null), (Yi.current = F0), (e = n(r, i)));
        } while (Dr);
    }
    if (
        ((Yi.current = ks),
        (t = ce !== null && ce.next !== null),
        (hn = 0),
        (fe = ce = te = null),
        (Ss = !1),
        t)
    )
        throw Error(T(300));
    return e;
}
function Ul() {
    var e = ti !== 0;
    return ((ti = 0), e);
}
function at() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return (fe === null ? (te.memoizedState = fe = e) : (fe = fe.next = e), fe);
}
function Ye() {
    if (ce === null) {
        var e = te.alternate;
        e = e !== null ? e.memoizedState : null;
    } else e = ce.next;
    var t = fe === null ? te.memoizedState : fe.next;
    if (t !== null) ((fe = t), (ce = e));
    else {
        if (e === null) throw Error(T(310));
        ((ce = e),
            (e = {
                memoizedState: ce.memoizedState,
                baseState: ce.baseState,
                baseQueue: ce.baseQueue,
                queue: ce.queue,
                next: null,
            }),
            fe === null ? (te.memoizedState = fe = e) : (fe = fe.next = e));
    }
    return fe;
}
function ni(e, t) {
    return typeof t == 'function' ? t(e) : t;
}
function jo(e) {
    var t = Ye(),
        n = t.queue;
    if (n === null) throw Error(T(311));
    n.lastRenderedReducer = e;
    var r = ce,
        i = r.baseQueue,
        s = n.pending;
    if (s !== null) {
        if (i !== null) {
            var o = i.next;
            ((i.next = s.next), (s.next = o));
        }
        ((r.baseQueue = i = s), (n.pending = null));
    }
    if (i !== null) {
        ((s = i.next), (r = r.baseState));
        var a = (o = null),
            l = null,
            u = s;
        do {
            var c = u.lane;
            if ((hn & c) === c)
                (l !== null &&
                    (l = l.next =
                        {
                            lane: 0,
                            action: u.action,
                            hasEagerState: u.hasEagerState,
                            eagerState: u.eagerState,
                            next: null,
                        }),
                    (r = u.hasEagerState ? u.eagerState : e(r, u.action)));
            else {
                var d = {
                    lane: c,
                    action: u.action,
                    hasEagerState: u.hasEagerState,
                    eagerState: u.eagerState,
                    next: null,
                };
                (l === null ? ((a = l = d), (o = r)) : (l = l.next = d),
                    (te.lanes |= c),
                    (pn |= c));
            }
            u = u.next;
        } while (u !== null && u !== s);
        (l === null ? (o = r) : (l.next = a),
            rt(r, t.memoizedState) || (Re = !0),
            (t.memoizedState = r),
            (t.baseState = o),
            (t.baseQueue = l),
            (n.lastRenderedState = r));
    }
    if (((e = n.interleaved), e !== null)) {
        i = e;
        do ((s = i.lane), (te.lanes |= s), (pn |= s), (i = i.next));
        while (i !== e);
    } else i === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
}
function Ro(e) {
    var t = Ye(),
        n = t.queue;
    if (n === null) throw Error(T(311));
    n.lastRenderedReducer = e;
    var r = n.dispatch,
        i = n.pending,
        s = t.memoizedState;
    if (i !== null) {
        n.pending = null;
        var o = (i = i.next);
        do ((s = e(s, o.action)), (o = o.next));
        while (o !== i);
        (rt(s, t.memoizedState) || (Re = !0),
            (t.memoizedState = s),
            t.baseQueue === null && (t.baseState = s),
            (n.lastRenderedState = s));
    }
    return [s, r];
}
function Jh() {}
function ep(e, t) {
    var n = te,
        r = Ye(),
        i = t(),
        s = !rt(r.memoizedState, i);
    if (
        (s && ((r.memoizedState = i), (Re = !0)),
        (r = r.queue),
        Hl(rp.bind(null, n, r, e), [e]),
        r.getSnapshot !== t || s || (fe !== null && fe.memoizedState.tag & 1))
    ) {
        if (((n.flags |= 2048), ri(9, np.bind(null, n, r, i, t), void 0, null), he === null))
            throw Error(T(349));
        hn & 30 || tp(n, t, i);
    }
    return i;
}
function tp(e, t, n) {
    ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = te.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }), (te.updateQueue = t), (t.stores = [e]))
            : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function np(e, t, n, r) {
    ((t.value = n), (t.getSnapshot = r), ip(t) && sp(e));
}
function rp(e, t, n) {
    return n(function () {
        ip(t) && sp(e);
    });
}
function ip(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !rt(e, n);
    } catch {
        return !0;
    }
}
function sp(e) {
    var t = Ct(e, 1);
    t !== null && nt(t, e, 1, -1);
}
function Lc(e) {
    var t = at();
    return (
        typeof e == 'function' && (e = e()),
        (t.memoizedState = t.baseState = e),
        (e = {
            pending: null,
            interleaved: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: ni,
            lastRenderedState: e,
        }),
        (t.queue = e),
        (e = e.dispatch = b0.bind(null, te, e)),
        [t.memoizedState, e]
    );
}
function ri(e, t, n, r) {
    return (
        (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
        (t = te.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }),
              (te.updateQueue = t),
              (t.lastEffect = e.next = e))
            : ((n = t.lastEffect),
              n === null
                  ? (t.lastEffect = e.next = e)
                  : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
        e
    );
}
function op() {
    return Ye().memoizedState;
}
function Xi(e, t, n, r) {
    var i = at();
    ((te.flags |= e), (i.memoizedState = ri(1 | t, n, void 0, r === void 0 ? null : r)));
}
function Ks(e, t, n, r) {
    var i = Ye();
    r = r === void 0 ? null : r;
    var s = void 0;
    if (ce !== null) {
        var o = ce.memoizedState;
        if (((s = o.destroy), r !== null && Bl(r, o.deps))) {
            i.memoizedState = ri(t, n, s, r);
            return;
        }
    }
    ((te.flags |= e), (i.memoizedState = ri(1 | t, n, s, r)));
}
function jc(e, t) {
    return Xi(8390656, 8, e, t);
}
function Hl(e, t) {
    return Ks(2048, 8, e, t);
}
function ap(e, t) {
    return Ks(4, 2, e, t);
}
function lp(e, t) {
    return Ks(4, 4, e, t);
}
function up(e, t) {
    if (typeof t == 'function')
        return (
            (e = e()),
            t(e),
            function () {
                t(null);
            }
        );
    if (t != null)
        return (
            (e = e()),
            (t.current = e),
            function () {
                t.current = null;
            }
        );
}
function cp(e, t, n) {
    return ((n = n != null ? n.concat([e]) : null), Ks(4, 4, up.bind(null, t, e), n));
}
function Wl() {}
function dp(e, t) {
    var n = Ye();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Bl(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
}
function fp(e, t) {
    var n = Ye();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Bl(t, r[1])
        ? r[0]
        : ((e = e()), (n.memoizedState = [e, t]), e);
}
function hp(e, t, n) {
    return hn & 21
        ? (rt(n, t) || ((n = vh()), (te.lanes |= n), (pn |= n), (e.baseState = !0)), t)
        : (e.baseState && ((e.baseState = !1), (Re = !0)), (e.memoizedState = n));
}
function O0(e, t) {
    var n = H;
    ((H = n !== 0 && 4 > n ? n : 4), e(!0));
    var r = Lo.transition;
    Lo.transition = {};
    try {
        (e(!1), t());
    } finally {
        ((H = n), (Lo.transition = r));
    }
}
function pp() {
    return Ye().memoizedState;
}
function V0(e, t, n) {
    var r = Bt(e);
    if (((n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }), mp(e)))
        gp(t, n);
    else if (((n = Xh(e, t, n, r)), n !== null)) {
        var i = Te();
        (nt(n, e, r, i), yp(n, t, r));
    }
}
function b0(e, t, n) {
    var r = Bt(e),
        i = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
    if (mp(e)) gp(t, i);
    else {
        var s = e.alternate;
        if (
            e.lanes === 0 &&
            (s === null || s.lanes === 0) &&
            ((s = t.lastRenderedReducer), s !== null)
        )
            try {
                var o = t.lastRenderedState,
                    a = s(o, n);
                if (((i.hasEagerState = !0), (i.eagerState = a), rt(a, o))) {
                    var l = t.interleaved;
                    (l === null ? ((i.next = i), bl(t)) : ((i.next = l.next), (l.next = i)),
                        (t.interleaved = i));
                    return;
                }
            } catch {
            } finally {
            }
        ((n = Xh(e, t, i, r)), n !== null && ((i = Te()), nt(n, e, r, i), yp(n, t, r)));
    }
}
function mp(e) {
    var t = e.alternate;
    return e === te || (t !== null && t === te);
}
function gp(e, t) {
    Dr = Ss = !0;
    var n = e.pending;
    (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t));
}
function yp(e, t, n) {
    if (n & 4194240) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), kl(e, n));
    }
}
var ks = {
        readContext: Qe,
        useCallback: ve,
        useContext: ve,
        useEffect: ve,
        useImperativeHandle: ve,
        useInsertionEffect: ve,
        useLayoutEffect: ve,
        useMemo: ve,
        useReducer: ve,
        useRef: ve,
        useState: ve,
        useDebugValue: ve,
        useDeferredValue: ve,
        useTransition: ve,
        useMutableSource: ve,
        useSyncExternalStore: ve,
        useId: ve,
        unstable_isNewReconciler: !1,
    },
    _0 = {
        readContext: Qe,
        useCallback: function (e, t) {
            return ((at().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: Qe,
        useEffect: jc,
        useImperativeHandle: function (e, t, n) {
            return ((n = n != null ? n.concat([e]) : null), Xi(4194308, 4, up.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
            return Xi(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
            return Xi(4, 2, e, t);
        },
        useMemo: function (e, t) {
            var n = at();
            return ((t = t === void 0 ? null : t), (e = e()), (n.memoizedState = [e, t]), e);
        },
        useReducer: function (e, t, n) {
            var r = at();
            return (
                (t = n !== void 0 ? n(t) : t),
                (r.memoizedState = r.baseState = t),
                (e = {
                    pending: null,
                    interleaved: null,
                    lanes: 0,
                    dispatch: null,
                    lastRenderedReducer: e,
                    lastRenderedState: t,
                }),
                (r.queue = e),
                (e = e.dispatch = V0.bind(null, te, e)),
                [r.memoizedState, e]
            );
        },
        useRef: function (e) {
            var t = at();
            return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: Lc,
        useDebugValue: Wl,
        useDeferredValue: function (e) {
            return (at().memoizedState = e);
        },
        useTransition: function () {
            var e = Lc(!1),
                t = e[0];
            return ((e = O0.bind(null, e[1])), (at().memoizedState = e), [t, e]);
        },
        useMutableSource: function () {},
        useSyncExternalStore: function (e, t, n) {
            var r = te,
                i = at();
            if (X) {
                if (n === void 0) throw Error(T(407));
                n = n();
            } else {
                if (((n = t()), he === null)) throw Error(T(349));
                hn & 30 || tp(r, t, n);
            }
            i.memoizedState = n;
            var s = { value: n, getSnapshot: t };
            return (
                (i.queue = s),
                jc(rp.bind(null, r, s, e), [e]),
                (r.flags |= 2048),
                ri(9, np.bind(null, r, s, n, t), void 0, null),
                n
            );
        },
        useId: function () {
            var e = at(),
                t = he.identifierPrefix;
            if (X) {
                var n = yt,
                    r = gt;
                ((n = (r & ~(1 << (32 - tt(r) - 1))).toString(32) + n),
                    (t = ':' + t + 'R' + n),
                    (n = ti++),
                    0 < n && (t += 'H' + n.toString(32)),
                    (t += ':'));
            } else ((n = M0++), (t = ':' + t + 'r' + n.toString(32) + ':'));
            return (e.memoizedState = t);
        },
        unstable_isNewReconciler: !1,
    },
    I0 = {
        readContext: Qe,
        useCallback: dp,
        useContext: Qe,
        useEffect: Hl,
        useImperativeHandle: cp,
        useInsertionEffect: ap,
        useLayoutEffect: lp,
        useMemo: fp,
        useReducer: jo,
        useRef: op,
        useState: function () {
            return jo(ni);
        },
        useDebugValue: Wl,
        useDeferredValue: function (e) {
            var t = Ye();
            return hp(t, ce.memoizedState, e);
        },
        useTransition: function () {
            var e = jo(ni)[0],
                t = Ye().memoizedState;
            return [e, t];
        },
        useMutableSource: Jh,
        useSyncExternalStore: ep,
        useId: pp,
        unstable_isNewReconciler: !1,
    },
    F0 = {
        readContext: Qe,
        useCallback: dp,
        useContext: Qe,
        useEffect: Hl,
        useImperativeHandle: cp,
        useInsertionEffect: ap,
        useLayoutEffect: lp,
        useMemo: fp,
        useReducer: Ro,
        useRef: op,
        useState: function () {
            return Ro(ni);
        },
        useDebugValue: Wl,
        useDeferredValue: function (e) {
            var t = Ye();
            return ce === null ? (t.memoizedState = e) : hp(t, ce.memoizedState, e);
        },
        useTransition: function () {
            var e = Ro(ni)[0],
                t = Ye().memoizedState;
            return [e, t];
        },
        useMutableSource: Jh,
        useSyncExternalStore: ep,
        useId: pp,
        unstable_isNewReconciler: !1,
    };
function qe(e, t) {
    if (e && e.defaultProps) {
        ((t = ne({}, t)), (e = e.defaultProps));
        for (var n in e) t[n] === void 0 && (t[n] = e[n]);
        return t;
    }
    return t;
}
function La(e, t, n, r) {
    ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : ne({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
}
var Gs = {
    isMounted: function (e) {
        return (e = e._reactInternals) ? vn(e) === e : !1;
    },
    enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = Te(),
            i = Bt(e),
            s = vt(r, i);
        ((s.payload = t),
            n != null && (s.callback = n),
            (t = Ft(e, s, i)),
            t !== null && (nt(t, e, i, r), Qi(t, e, i)));
    },
    enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = Te(),
            i = Bt(e),
            s = vt(r, i);
        ((s.tag = 1),
            (s.payload = t),
            n != null && (s.callback = n),
            (t = Ft(e, s, i)),
            t !== null && (nt(t, e, i, r), Qi(t, e, i)));
    },
    enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = Te(),
            r = Bt(e),
            i = vt(n, r);
        ((i.tag = 2),
            t != null && (i.callback = t),
            (t = Ft(e, i, r)),
            t !== null && (nt(t, e, r, n), Qi(t, e, r)));
    },
};
function Rc(e, t, n, r, i, s, o) {
    return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == 'function'
            ? e.shouldComponentUpdate(r, s, o)
            : t.prototype && t.prototype.isPureReactComponent
              ? !Yr(n, r) || !Yr(i, s)
              : !0
    );
}
function vp(e, t, n) {
    var r = !1,
        i = Ht,
        s = t.contextType;
    return (
        typeof s == 'object' && s !== null
            ? (s = Qe(s))
            : ((i = De(t) ? dn : Ce.current),
              (r = t.contextTypes),
              (s = (r = r != null) ? Yn(e, i) : Ht)),
        (t = new t(n, s)),
        (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
        (t.updater = Gs),
        (e.stateNode = t),
        (t._reactInternals = e),
        r &&
            ((e = e.stateNode),
            (e.__reactInternalMemoizedUnmaskedChildContext = i),
            (e.__reactInternalMemoizedMaskedChildContext = s)),
        t
    );
}
function Ac(e, t, n, r) {
    ((e = t.state),
        typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
            t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && Gs.enqueueReplaceState(t, t.state, null));
}
function ja(e, t, n, r) {
    var i = e.stateNode;
    ((i.props = n), (i.state = e.memoizedState), (i.refs = {}), _l(e));
    var s = t.contextType;
    (typeof s == 'object' && s !== null
        ? (i.context = Qe(s))
        : ((s = De(t) ? dn : Ce.current), (i.context = Yn(e, s))),
        (i.state = e.memoizedState),
        (s = t.getDerivedStateFromProps),
        typeof s == 'function' && (La(e, t, s, n), (i.state = e.memoizedState)),
        typeof t.getDerivedStateFromProps == 'function' ||
            typeof i.getSnapshotBeforeUpdate == 'function' ||
            (typeof i.UNSAFE_componentWillMount != 'function' &&
                typeof i.componentWillMount != 'function') ||
            ((t = i.state),
            typeof i.componentWillMount == 'function' && i.componentWillMount(),
            typeof i.UNSAFE_componentWillMount == 'function' && i.UNSAFE_componentWillMount(),
            t !== i.state && Gs.enqueueReplaceState(i, i.state, null),
            xs(e, n, i, r),
            (i.state = e.memoizedState)),
        typeof i.componentDidMount == 'function' && (e.flags |= 4194308));
}
function Jn(e, t) {
    try {
        var n = '',
            r = t;
        do ((n += hy(r)), (r = r.return));
        while (r);
        var i = n;
    } catch (s) {
        i =
            `
Error generating stack: ` +
            s.message +
            `
` +
            s.stack;
    }
    return { value: e, source: t, stack: i, digest: null };
}
function Ao(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Ra(e, t) {
    try {
        console.error(t.value);
    } catch (n) {
        setTimeout(function () {
            throw n;
        });
    }
}
var z0 = typeof WeakMap == 'function' ? WeakMap : Map;
function xp(e, t, n) {
    ((n = vt(-1, n)), (n.tag = 3), (n.payload = { element: null }));
    var r = t.value;
    return (
        (n.callback = function () {
            (Ps || ((Ps = !0), (za = r)), Ra(e, t));
        }),
        n
    );
}
function wp(e, t, n) {
    ((n = vt(-1, n)), (n.tag = 3));
    var r = e.type.getDerivedStateFromError;
    if (typeof r == 'function') {
        var i = t.value;
        ((n.payload = function () {
            return r(i);
        }),
            (n.callback = function () {
                Ra(e, t);
            }));
    }
    var s = e.stateNode;
    return (
        s !== null &&
            typeof s.componentDidCatch == 'function' &&
            (n.callback = function () {
                (Ra(e, t),
                    typeof r != 'function' &&
                        (zt === null ? (zt = new Set([this])) : zt.add(this)));
                var o = t.stack;
                this.componentDidCatch(t.value, { componentStack: o !== null ? o : '' });
            }),
        n
    );
}
function Dc(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
        r = e.pingCache = new z0();
        var i = new Set();
        r.set(t, i);
    } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
    i.has(n) || (i.add(n), (e = ev.bind(null, e, t, n)), t.then(e, e));
}
function Mc(e) {
    do {
        var t;
        if (
            ((t = e.tag === 13) &&
                ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)),
            t)
        )
            return e;
        e = e.return;
    } while (e !== null);
    return null;
}
function Oc(e, t, n, r, i) {
    return e.mode & 1
        ? ((e.flags |= 65536), (e.lanes = i), e)
        : (e === t
              ? (e.flags |= 65536)
              : ((e.flags |= 128),
                (n.flags |= 131072),
                (n.flags &= -52805),
                n.tag === 1 &&
                    (n.alternate === null
                        ? (n.tag = 17)
                        : ((t = vt(-1, 1)), (t.tag = 2), Ft(n, t, 1))),
                (n.lanes |= 1)),
          e);
}
var B0 = Et.ReactCurrentOwner,
    Re = !1;
function Pe(e, t, n, r) {
    t.child = e === null ? Yh(t, null, n, r) : Zn(t, e.child, n, r);
}
function Vc(e, t, n, r, i) {
    n = n.render;
    var s = t.ref;
    return (
        Kn(t, i),
        (r = $l(e, t, n, r, s, i)),
        (n = Ul()),
        e !== null && !Re
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), Pt(e, t, i))
            : (X && n && Rl(t), (t.flags |= 1), Pe(e, t, r, i), t.child)
    );
}
function bc(e, t, n, r, i) {
    if (e === null) {
        var s = n.type;
        return typeof s == 'function' &&
            !Jl(s) &&
            s.defaultProps === void 0 &&
            n.compare === null &&
            n.defaultProps === void 0
            ? ((t.tag = 15), (t.type = s), Sp(e, t, s, r, i))
            : ((e = es(n.type, null, r, t, t.mode, i)),
              (e.ref = t.ref),
              (e.return = t),
              (t.child = e));
    }
    if (((s = e.child), !(e.lanes & i))) {
        var o = s.memoizedProps;
        if (((n = n.compare), (n = n !== null ? n : Yr), n(o, r) && e.ref === t.ref))
            return Pt(e, t, i);
    }
    return ((t.flags |= 1), (e = $t(s, r)), (e.ref = t.ref), (e.return = t), (t.child = e));
}
function Sp(e, t, n, r, i) {
    if (e !== null) {
        var s = e.memoizedProps;
        if (Yr(s, r) && e.ref === t.ref)
            if (((Re = !1), (t.pendingProps = r = s), (e.lanes & i) !== 0))
                e.flags & 131072 && (Re = !0);
            else return ((t.lanes = e.lanes), Pt(e, t, i));
    }
    return Aa(e, t, n, r, i);
}
function kp(e, t, n) {
    var r = t.pendingProps,
        i = r.children,
        s = e !== null ? e.memoizedState : null;
    if (r.mode === 'hidden')
        if (!(t.mode & 1))
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                K(bn, Oe),
                (Oe |= n));
        else {
            if (!(n & 1073741824))
                return (
                    (e = s !== null ? s.baseLanes | n : n),
                    (t.lanes = t.childLanes = 1073741824),
                    (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
                    (t.updateQueue = null),
                    K(bn, Oe),
                    (Oe |= e),
                    null
                );
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                (r = s !== null ? s.baseLanes : n),
                K(bn, Oe),
                (Oe |= r));
        }
    else
        (s !== null ? ((r = s.baseLanes | n), (t.memoizedState = null)) : (r = n),
            K(bn, Oe),
            (Oe |= r));
    return (Pe(e, t, i, n), t.child);
}
function Cp(e, t) {
    var n = t.ref;
    ((e === null && n !== null) || (e !== null && e.ref !== n)) &&
        ((t.flags |= 512), (t.flags |= 2097152));
}
function Aa(e, t, n, r, i) {
    var s = De(n) ? dn : Ce.current;
    return (
        (s = Yn(t, s)),
        Kn(t, i),
        (n = $l(e, t, n, r, s, i)),
        (r = Ul()),
        e !== null && !Re
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), Pt(e, t, i))
            : (X && r && Rl(t), (t.flags |= 1), Pe(e, t, n, i), t.child)
    );
}
function _c(e, t, n, r, i) {
    if (De(n)) {
        var s = !0;
        ps(t);
    } else s = !1;
    if ((Kn(t, i), t.stateNode === null)) (Zi(e, t), vp(t, n, r), ja(t, n, r, i), (r = !0));
    else if (e === null) {
        var o = t.stateNode,
            a = t.memoizedProps;
        o.props = a;
        var l = o.context,
            u = n.contextType;
        typeof u == 'object' && u !== null
            ? (u = Qe(u))
            : ((u = De(n) ? dn : Ce.current), (u = Yn(t, u)));
        var c = n.getDerivedStateFromProps,
            d = typeof c == 'function' || typeof o.getSnapshotBeforeUpdate == 'function';
        (d ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((a !== r || l !== u) && Ac(t, o, r, u)),
            (Rt = !1));
        var f = t.memoizedState;
        ((o.state = f),
            xs(t, r, o, i),
            (l = t.memoizedState),
            a !== r || f !== l || Ae.current || Rt
                ? (typeof c == 'function' && (La(t, n, c, r), (l = t.memoizedState)),
                  (a = Rt || Rc(t, n, a, r, f, l, u))
                      ? (d ||
                            (typeof o.UNSAFE_componentWillMount != 'function' &&
                                typeof o.componentWillMount != 'function') ||
                            (typeof o.componentWillMount == 'function' && o.componentWillMount(),
                            typeof o.UNSAFE_componentWillMount == 'function' &&
                                o.UNSAFE_componentWillMount()),
                        typeof o.componentDidMount == 'function' && (t.flags |= 4194308))
                      : (typeof o.componentDidMount == 'function' && (t.flags |= 4194308),
                        (t.memoizedProps = r),
                        (t.memoizedState = l)),
                  (o.props = r),
                  (o.state = l),
                  (o.context = u),
                  (r = a))
                : (typeof o.componentDidMount == 'function' && (t.flags |= 4194308), (r = !1)));
    } else {
        ((o = t.stateNode),
            Zh(e, t),
            (a = t.memoizedProps),
            (u = t.type === t.elementType ? a : qe(t.type, a)),
            (o.props = u),
            (d = t.pendingProps),
            (f = o.context),
            (l = n.contextType),
            typeof l == 'object' && l !== null
                ? (l = Qe(l))
                : ((l = De(n) ? dn : Ce.current), (l = Yn(t, l))));
        var m = n.getDerivedStateFromProps;
        ((c = typeof m == 'function' || typeof o.getSnapshotBeforeUpdate == 'function') ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((a !== d || f !== l) && Ac(t, o, r, l)),
            (Rt = !1),
            (f = t.memoizedState),
            (o.state = f),
            xs(t, r, o, i));
        var v = t.memoizedState;
        a !== d || f !== v || Ae.current || Rt
            ? (typeof m == 'function' && (La(t, n, m, r), (v = t.memoizedState)),
              (u = Rt || Rc(t, n, u, r, f, v, l) || !1)
                  ? (c ||
                        (typeof o.UNSAFE_componentWillUpdate != 'function' &&
                            typeof o.componentWillUpdate != 'function') ||
                        (typeof o.componentWillUpdate == 'function' &&
                            o.componentWillUpdate(r, v, l),
                        typeof o.UNSAFE_componentWillUpdate == 'function' &&
                            o.UNSAFE_componentWillUpdate(r, v, l)),
                    typeof o.componentDidUpdate == 'function' && (t.flags |= 4),
                    typeof o.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
                  : (typeof o.componentDidUpdate != 'function' ||
                        (a === e.memoizedProps && f === e.memoizedState) ||
                        (t.flags |= 4),
                    typeof o.getSnapshotBeforeUpdate != 'function' ||
                        (a === e.memoizedProps && f === e.memoizedState) ||
                        (t.flags |= 1024),
                    (t.memoizedProps = r),
                    (t.memoizedState = v)),
              (o.props = r),
              (o.state = v),
              (o.context = l),
              (r = u))
            : (typeof o.componentDidUpdate != 'function' ||
                  (a === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 4),
              typeof o.getSnapshotBeforeUpdate != 'function' ||
                  (a === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 1024),
              (r = !1));
    }
    return Da(e, t, n, r, s, i);
}
function Da(e, t, n, r, i, s) {
    Cp(e, t);
    var o = (t.flags & 128) !== 0;
    if (!r && !o) return (i && kc(t, n, !1), Pt(e, t, s));
    ((r = t.stateNode), (B0.current = t));
    var a = o && typeof n.getDerivedStateFromError != 'function' ? null : r.render();
    return (
        (t.flags |= 1),
        e !== null && o
            ? ((t.child = Zn(t, e.child, null, s)), (t.child = Zn(t, null, a, s)))
            : Pe(e, t, a, s),
        (t.memoizedState = r.state),
        i && kc(t, n, !0),
        t.child
    );
}
function Pp(e) {
    var t = e.stateNode;
    (t.pendingContext
        ? Sc(e, t.pendingContext, t.pendingContext !== t.context)
        : t.context && Sc(e, t.context, !1),
        Il(e, t.containerInfo));
}
function Ic(e, t, n, r, i) {
    return (Xn(), Dl(i), (t.flags |= 256), Pe(e, t, n, r), t.child);
}
var Ma = { dehydrated: null, treeContext: null, retryLane: 0 };
function Oa(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
}
function Tp(e, t, n) {
    var r = t.pendingProps,
        i = J.current,
        s = !1,
        o = (t.flags & 128) !== 0,
        a;
    if (
        ((a = o) || (a = e !== null && e.memoizedState === null ? !1 : (i & 2) !== 0),
        a ? ((s = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (i |= 1),
        K(J, i & 1),
        e === null)
    )
        return (
            Ea(t),
            (e = t.memoizedState),
            e !== null && ((e = e.dehydrated), e !== null)
                ? (t.mode & 1
                      ? e.data === '$!'
                          ? (t.lanes = 8)
                          : (t.lanes = 1073741824)
                      : (t.lanes = 1),
                  null)
                : ((o = r.children),
                  (e = r.fallback),
                  s
                      ? ((r = t.mode),
                        (s = t.child),
                        (o = { mode: 'hidden', children: o }),
                        !(r & 1) && s !== null
                            ? ((s.childLanes = 0), (s.pendingProps = o))
                            : (s = Xs(o, r, 0, null)),
                        (e = un(e, r, n, null)),
                        (s.return = t),
                        (e.return = t),
                        (s.sibling = e),
                        (t.child = s),
                        (t.child.memoizedState = Oa(n)),
                        (t.memoizedState = Ma),
                        e)
                      : Kl(t, o))
        );
    if (((i = e.memoizedState), i !== null && ((a = i.dehydrated), a !== null)))
        return $0(e, t, o, r, a, i, n);
    if (s) {
        ((s = r.fallback), (o = t.mode), (i = e.child), (a = i.sibling));
        var l = { mode: 'hidden', children: r.children };
        return (
            !(o & 1) && t.child !== i
                ? ((r = t.child), (r.childLanes = 0), (r.pendingProps = l), (t.deletions = null))
                : ((r = $t(i, l)), (r.subtreeFlags = i.subtreeFlags & 14680064)),
            a !== null ? (s = $t(a, s)) : ((s = un(s, o, n, null)), (s.flags |= 2)),
            (s.return = t),
            (r.return = t),
            (r.sibling = s),
            (t.child = r),
            (r = s),
            (s = t.child),
            (o = e.child.memoizedState),
            (o =
                o === null
                    ? Oa(n)
                    : { baseLanes: o.baseLanes | n, cachePool: null, transitions: o.transitions }),
            (s.memoizedState = o),
            (s.childLanes = e.childLanes & ~n),
            (t.memoizedState = Ma),
            r
        );
    }
    return (
        (s = e.child),
        (e = s.sibling),
        (r = $t(s, { mode: 'visible', children: r.children })),
        !(t.mode & 1) && (r.lanes = n),
        (r.return = t),
        (r.sibling = null),
        e !== null &&
            ((n = t.deletions), n === null ? ((t.deletions = [e]), (t.flags |= 16)) : n.push(e)),
        (t.child = r),
        (t.memoizedState = null),
        r
    );
}
function Kl(e, t) {
    return (
        (t = Xs({ mode: 'visible', children: t }, e.mode, 0, null)),
        (t.return = e),
        (e.child = t)
    );
}
function Oi(e, t, n, r) {
    return (
        r !== null && Dl(r),
        Zn(t, e.child, null, n),
        (e = Kl(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
    );
}
function $0(e, t, n, r, i, s, o) {
    if (n)
        return t.flags & 256
            ? ((t.flags &= -257), (r = Ao(Error(T(422)))), Oi(e, t, o, r))
            : t.memoizedState !== null
              ? ((t.child = e.child), (t.flags |= 128), null)
              : ((s = r.fallback),
                (i = t.mode),
                (r = Xs({ mode: 'visible', children: r.children }, i, 0, null)),
                (s = un(s, i, o, null)),
                (s.flags |= 2),
                (r.return = t),
                (s.return = t),
                (r.sibling = s),
                (t.child = r),
                t.mode & 1 && Zn(t, e.child, null, o),
                (t.child.memoizedState = Oa(o)),
                (t.memoizedState = Ma),
                s);
    if (!(t.mode & 1)) return Oi(e, t, o, null);
    if (i.data === '$!') {
        if (((r = i.nextSibling && i.nextSibling.dataset), r)) var a = r.dgst;
        return ((r = a), (s = Error(T(419))), (r = Ao(s, r, void 0)), Oi(e, t, o, r));
    }
    if (((a = (o & e.childLanes) !== 0), Re || a)) {
        if (((r = he), r !== null)) {
            switch (o & -o) {
                case 4:
                    i = 2;
                    break;
                case 16:
                    i = 8;
                    break;
                case 64:
                case 128:
                case 256:
                case 512:
                case 1024:
                case 2048:
                case 4096:
                case 8192:
                case 16384:
                case 32768:
                case 65536:
                case 131072:
                case 262144:
                case 524288:
                case 1048576:
                case 2097152:
                case 4194304:
                case 8388608:
                case 16777216:
                case 33554432:
                case 67108864:
                    i = 32;
                    break;
                case 536870912:
                    i = 268435456;
                    break;
                default:
                    i = 0;
            }
            ((i = i & (r.suspendedLanes | o) ? 0 : i),
                i !== 0 && i !== s.retryLane && ((s.retryLane = i), Ct(e, i), nt(r, e, i, -1)));
        }
        return (ql(), (r = Ao(Error(T(421)))), Oi(e, t, o, r));
    }
    return i.data === '$?'
        ? ((t.flags |= 128), (t.child = e.child), (t = tv.bind(null, e)), (i._reactRetry = t), null)
        : ((e = s.treeContext),
          (Ve = It(i.nextSibling)),
          (be = t),
          (X = !0),
          (et = null),
          e !== null &&
              ((He[We++] = gt),
              (He[We++] = yt),
              (He[We++] = fn),
              (gt = e.id),
              (yt = e.overflow),
              (fn = t)),
          (t = Kl(t, r.children)),
          (t.flags |= 4096),
          t);
}
function Fc(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    (r !== null && (r.lanes |= t), Na(e.return, t, n));
}
function Do(e, t, n, r, i) {
    var s = e.memoizedState;
    s === null
        ? (e.memoizedState = {
              isBackwards: t,
              rendering: null,
              renderingStartTime: 0,
              last: r,
              tail: n,
              tailMode: i,
          })
        : ((s.isBackwards = t),
          (s.rendering = null),
          (s.renderingStartTime = 0),
          (s.last = r),
          (s.tail = n),
          (s.tailMode = i));
}
function Ep(e, t, n) {
    var r = t.pendingProps,
        i = r.revealOrder,
        s = r.tail;
    if ((Pe(e, t, r.children, n), (r = J.current), r & 2)) ((r = (r & 1) | 2), (t.flags |= 128));
    else {
        if (e !== null && e.flags & 128)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13) e.memoizedState !== null && Fc(e, n, t);
                else if (e.tag === 19) Fc(e, n, t);
                else if (e.child !== null) {
                    ((e.child.return = e), (e = e.child));
                    continue;
                }
                if (e === t) break e;
                for (; e.sibling === null; ) {
                    if (e.return === null || e.return === t) break e;
                    e = e.return;
                }
                ((e.sibling.return = e.return), (e = e.sibling));
            }
        r &= 1;
    }
    if ((K(J, r), !(t.mode & 1))) t.memoizedState = null;
    else
        switch (i) {
            case 'forwards':
                for (n = t.child, i = null; n !== null; )
                    ((e = n.alternate), e !== null && ws(e) === null && (i = n), (n = n.sibling));
                ((n = i),
                    n === null
                        ? ((i = t.child), (t.child = null))
                        : ((i = n.sibling), (n.sibling = null)),
                    Do(t, !1, i, n, s));
                break;
            case 'backwards':
                for (n = null, i = t.child, t.child = null; i !== null; ) {
                    if (((e = i.alternate), e !== null && ws(e) === null)) {
                        t.child = i;
                        break;
                    }
                    ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
                }
                Do(t, !0, n, null, s);
                break;
            case 'together':
                Do(t, !1, null, null, void 0);
                break;
            default:
                t.memoizedState = null;
        }
    return t.child;
}
function Zi(e, t) {
    !(t.mode & 1) && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function Pt(e, t, n) {
    if ((e !== null && (t.dependencies = e.dependencies), (pn |= t.lanes), !(n & t.childLanes)))
        return null;
    if (e !== null && t.child !== e.child) throw Error(T(153));
    if (t.child !== null) {
        for (
            e = t.child, n = $t(e, e.pendingProps), t.child = n, n.return = t;
            e.sibling !== null;
        )
            ((e = e.sibling), (n = n.sibling = $t(e, e.pendingProps)), (n.return = t));
        n.sibling = null;
    }
    return t.child;
}
function U0(e, t, n) {
    switch (t.tag) {
        case 3:
            (Pp(t), Xn());
            break;
        case 5:
            qh(t);
            break;
        case 1:
            De(t.type) && ps(t);
            break;
        case 4:
            Il(t, t.stateNode.containerInfo);
            break;
        case 10:
            var r = t.type._context,
                i = t.memoizedProps.value;
            (K(ys, r._currentValue), (r._currentValue = i));
            break;
        case 13:
            if (((r = t.memoizedState), r !== null))
                return r.dehydrated !== null
                    ? (K(J, J.current & 1), (t.flags |= 128), null)
                    : n & t.child.childLanes
                      ? Tp(e, t, n)
                      : (K(J, J.current & 1), (e = Pt(e, t, n)), e !== null ? e.sibling : null);
            K(J, J.current & 1);
            break;
        case 19:
            if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
                if (r) return Ep(e, t, n);
                t.flags |= 128;
            }
            if (
                ((i = t.memoizedState),
                i !== null && ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
                K(J, J.current),
                r)
            )
                break;
            return null;
        case 22:
        case 23:
            return ((t.lanes = 0), kp(e, t, n));
    }
    return Pt(e, t, n);
}
var Np, Va, Lp, jp;
Np = function (e, t) {
    for (var n = t.child; n !== null; ) {
        if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
        else if (n.tag !== 4 && n.child !== null) {
            ((n.child.return = n), (n = n.child));
            continue;
        }
        if (n === t) break;
        for (; n.sibling === null; ) {
            if (n.return === null || n.return === t) return;
            n = n.return;
        }
        ((n.sibling.return = n.return), (n = n.sibling));
    }
};
Va = function () {};
Lp = function (e, t, n, r) {
    var i = e.memoizedProps;
    if (i !== r) {
        ((e = t.stateNode), on(dt.current));
        var s = null;
        switch (n) {
            case 'input':
                ((i = ra(e, i)), (r = ra(e, r)), (s = []));
                break;
            case 'select':
                ((i = ne({}, i, { value: void 0 })), (r = ne({}, r, { value: void 0 })), (s = []));
                break;
            case 'textarea':
                ((i = oa(e, i)), (r = oa(e, r)), (s = []));
                break;
            default:
                typeof i.onClick != 'function' &&
                    typeof r.onClick == 'function' &&
                    (e.onclick = fs);
        }
        la(n, r);
        var o;
        n = null;
        for (u in i)
            if (!r.hasOwnProperty(u) && i.hasOwnProperty(u) && i[u] != null)
                if (u === 'style') {
                    var a = i[u];
                    for (o in a) a.hasOwnProperty(o) && (n || (n = {}), (n[o] = ''));
                } else
                    u !== 'dangerouslySetInnerHTML' &&
                        u !== 'children' &&
                        u !== 'suppressContentEditableWarning' &&
                        u !== 'suppressHydrationWarning' &&
                        u !== 'autoFocus' &&
                        ($r.hasOwnProperty(u) ? s || (s = []) : (s = s || []).push(u, null));
        for (u in r) {
            var l = r[u];
            if (
                ((a = i != null ? i[u] : void 0),
                r.hasOwnProperty(u) && l !== a && (l != null || a != null))
            )
                if (u === 'style')
                    if (a) {
                        for (o in a)
                            !a.hasOwnProperty(o) ||
                                (l && l.hasOwnProperty(o)) ||
                                (n || (n = {}), (n[o] = ''));
                        for (o in l)
                            l.hasOwnProperty(o) && a[o] !== l[o] && (n || (n = {}), (n[o] = l[o]));
                    } else (n || (s || (s = []), s.push(u, n)), (n = l));
                else
                    u === 'dangerouslySetInnerHTML'
                        ? ((l = l ? l.__html : void 0),
                          (a = a ? a.__html : void 0),
                          l != null && a !== l && (s = s || []).push(u, l))
                        : u === 'children'
                          ? (typeof l != 'string' && typeof l != 'number') ||
                            (s = s || []).push(u, '' + l)
                          : u !== 'suppressContentEditableWarning' &&
                            u !== 'suppressHydrationWarning' &&
                            ($r.hasOwnProperty(u)
                                ? (l != null && u === 'onScroll' && G('scroll', e),
                                  s || a === l || (s = []))
                                : (s = s || []).push(u, l));
        }
        n && (s = s || []).push('style', n);
        var u = s;
        (t.updateQueue = u) && (t.flags |= 4);
    }
};
jp = function (e, t, n, r) {
    n !== r && (t.flags |= 4);
};
function gr(e, t) {
    if (!X)
        switch (e.tailMode) {
            case 'hidden':
                t = e.tail;
                for (var n = null; t !== null; ) (t.alternate !== null && (n = t), (t = t.sibling));
                n === null ? (e.tail = null) : (n.sibling = null);
                break;
            case 'collapsed':
                n = e.tail;
                for (var r = null; n !== null; ) (n.alternate !== null && (r = n), (n = n.sibling));
                r === null
                    ? t || e.tail === null
                        ? (e.tail = null)
                        : (e.tail.sibling = null)
                    : (r.sibling = null);
        }
}
function xe(e) {
    var t = e.alternate !== null && e.alternate.child === e.child,
        n = 0,
        r = 0;
    if (t)
        for (var i = e.child; i !== null; )
            ((n |= i.lanes | i.childLanes),
                (r |= i.subtreeFlags & 14680064),
                (r |= i.flags & 14680064),
                (i.return = e),
                (i = i.sibling));
    else
        for (i = e.child; i !== null; )
            ((n |= i.lanes | i.childLanes),
                (r |= i.subtreeFlags),
                (r |= i.flags),
                (i.return = e),
                (i = i.sibling));
    return ((e.subtreeFlags |= r), (e.childLanes = n), t);
}
function H0(e, t, n) {
    var r = t.pendingProps;
    switch ((Al(t), t.tag)) {
        case 2:
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
            return (xe(t), null);
        case 1:
            return (De(t.type) && hs(), xe(t), null);
        case 3:
            return (
                (r = t.stateNode),
                qn(),
                Q(Ae),
                Q(Ce),
                zl(),
                r.pendingContext && ((r.context = r.pendingContext), (r.pendingContext = null)),
                (e === null || e.child === null) &&
                    (Di(t)
                        ? (t.flags |= 4)
                        : e === null ||
                          (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                          ((t.flags |= 1024), et !== null && (Ua(et), (et = null)))),
                Va(e, t),
                xe(t),
                null
            );
        case 5:
            Fl(t);
            var i = on(ei.current);
            if (((n = t.type), e !== null && t.stateNode != null))
                (Lp(e, t, n, r, i), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
            else {
                if (!r) {
                    if (t.stateNode === null) throw Error(T(166));
                    return (xe(t), null);
                }
                if (((e = on(dt.current)), Di(t))) {
                    ((r = t.stateNode), (n = t.type));
                    var s = t.memoizedProps;
                    switch (((r[lt] = t), (r[qr] = s), (e = (t.mode & 1) !== 0), n)) {
                        case 'dialog':
                            (G('cancel', r), G('close', r));
                            break;
                        case 'iframe':
                        case 'object':
                        case 'embed':
                            G('load', r);
                            break;
                        case 'video':
                        case 'audio':
                            for (i = 0; i < Cr.length; i++) G(Cr[i], r);
                            break;
                        case 'source':
                            G('error', r);
                            break;
                        case 'img':
                        case 'image':
                        case 'link':
                            (G('error', r), G('load', r));
                            break;
                        case 'details':
                            G('toggle', r);
                            break;
                        case 'input':
                            (Qu(r, s), G('invalid', r));
                            break;
                        case 'select':
                            ((r._wrapperState = { wasMultiple: !!s.multiple }), G('invalid', r));
                            break;
                        case 'textarea':
                            (Xu(r, s), G('invalid', r));
                    }
                    (la(n, s), (i = null));
                    for (var o in s)
                        if (s.hasOwnProperty(o)) {
                            var a = s[o];
                            o === 'children'
                                ? typeof a == 'string'
                                    ? r.textContent !== a &&
                                      (s.suppressHydrationWarning !== !0 && Ai(r.textContent, a, e),
                                      (i = ['children', a]))
                                    : typeof a == 'number' &&
                                      r.textContent !== '' + a &&
                                      (s.suppressHydrationWarning !== !0 && Ai(r.textContent, a, e),
                                      (i = ['children', '' + a]))
                                : $r.hasOwnProperty(o) &&
                                  a != null &&
                                  o === 'onScroll' &&
                                  G('scroll', r);
                        }
                    switch (n) {
                        case 'input':
                            (Ci(r), Yu(r, s, !0));
                            break;
                        case 'textarea':
                            (Ci(r), Zu(r));
                            break;
                        case 'select':
                        case 'option':
                            break;
                        default:
                            typeof s.onClick == 'function' && (r.onclick = fs);
                    }
                    ((r = i), (t.updateQueue = r), r !== null && (t.flags |= 4));
                } else {
                    ((o = i.nodeType === 9 ? i : i.ownerDocument),
                        e === 'http://www.w3.org/1999/xhtml' && (e = rh(n)),
                        e === 'http://www.w3.org/1999/xhtml'
                            ? n === 'script'
                                ? ((e = o.createElement('div')),
                                  (e.innerHTML = '<script><\/script>'),
                                  (e = e.removeChild(e.firstChild)))
                                : typeof r.is == 'string'
                                  ? (e = o.createElement(n, { is: r.is }))
                                  : ((e = o.createElement(n)),
                                    n === 'select' &&
                                        ((o = e),
                                        r.multiple
                                            ? (o.multiple = !0)
                                            : r.size && (o.size = r.size)))
                            : (e = o.createElementNS(e, n)),
                        (e[lt] = t),
                        (e[qr] = r),
                        Np(e, t, !1, !1),
                        (t.stateNode = e));
                    e: {
                        switch (((o = ua(n, r)), n)) {
                            case 'dialog':
                                (G('cancel', e), G('close', e), (i = r));
                                break;
                            case 'iframe':
                            case 'object':
                            case 'embed':
                                (G('load', e), (i = r));
                                break;
                            case 'video':
                            case 'audio':
                                for (i = 0; i < Cr.length; i++) G(Cr[i], e);
                                i = r;
                                break;
                            case 'source':
                                (G('error', e), (i = r));
                                break;
                            case 'img':
                            case 'image':
                            case 'link':
                                (G('error', e), G('load', e), (i = r));
                                break;
                            case 'details':
                                (G('toggle', e), (i = r));
                                break;
                            case 'input':
                                (Qu(e, r), (i = ra(e, r)), G('invalid', e));
                                break;
                            case 'option':
                                i = r;
                                break;
                            case 'select':
                                ((e._wrapperState = { wasMultiple: !!r.multiple }),
                                    (i = ne({}, r, { value: void 0 })),
                                    G('invalid', e));
                                break;
                            case 'textarea':
                                (Xu(e, r), (i = oa(e, r)), G('invalid', e));
                                break;
                            default:
                                i = r;
                        }
                        (la(n, i), (a = i));
                        for (s in a)
                            if (a.hasOwnProperty(s)) {
                                var l = a[s];
                                s === 'style'
                                    ? oh(e, l)
                                    : s === 'dangerouslySetInnerHTML'
                                      ? ((l = l ? l.__html : void 0), l != null && ih(e, l))
                                      : s === 'children'
                                        ? typeof l == 'string'
                                            ? (n !== 'textarea' || l !== '') && Ur(e, l)
                                            : typeof l == 'number' && Ur(e, '' + l)
                                        : s !== 'suppressContentEditableWarning' &&
                                          s !== 'suppressHydrationWarning' &&
                                          s !== 'autoFocus' &&
                                          ($r.hasOwnProperty(s)
                                              ? l != null && s === 'onScroll' && G('scroll', e)
                                              : l != null && gl(e, s, l, o));
                            }
                        switch (n) {
                            case 'input':
                                (Ci(e), Yu(e, r, !1));
                                break;
                            case 'textarea':
                                (Ci(e), Zu(e));
                                break;
                            case 'option':
                                r.value != null && e.setAttribute('value', '' + Ut(r.value));
                                break;
                            case 'select':
                                ((e.multiple = !!r.multiple),
                                    (s = r.value),
                                    s != null
                                        ? $n(e, !!r.multiple, s, !1)
                                        : r.defaultValue != null &&
                                          $n(e, !!r.multiple, r.defaultValue, !0));
                                break;
                            default:
                                typeof i.onClick == 'function' && (e.onclick = fs);
                        }
                        switch (n) {
                            case 'button':
                            case 'input':
                            case 'select':
                            case 'textarea':
                                r = !!r.autoFocus;
                                break e;
                            case 'img':
                                r = !0;
                                break e;
                            default:
                                r = !1;
                        }
                    }
                    r && (t.flags |= 4);
                }
                t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
            }
            return (xe(t), null);
        case 6:
            if (e && t.stateNode != null) jp(e, t, e.memoizedProps, r);
            else {
                if (typeof r != 'string' && t.stateNode === null) throw Error(T(166));
                if (((n = on(ei.current)), on(dt.current), Di(t))) {
                    if (
                        ((r = t.stateNode),
                        (n = t.memoizedProps),
                        (r[lt] = t),
                        (s = r.nodeValue !== n) && ((e = be), e !== null))
                    )
                        switch (e.tag) {
                            case 3:
                                Ai(r.nodeValue, n, (e.mode & 1) !== 0);
                                break;
                            case 5:
                                e.memoizedProps.suppressHydrationWarning !== !0 &&
                                    Ai(r.nodeValue, n, (e.mode & 1) !== 0);
                        }
                    s && (t.flags |= 4);
                } else
                    ((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)),
                        (r[lt] = t),
                        (t.stateNode = r));
            }
            return (xe(t), null);
        case 13:
            if (
                (Q(J),
                (r = t.memoizedState),
                e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
            ) {
                if (X && Ve !== null && t.mode & 1 && !(t.flags & 128))
                    (Gh(), Xn(), (t.flags |= 98560), (s = !1));
                else if (((s = Di(t)), r !== null && r.dehydrated !== null)) {
                    if (e === null) {
                        if (!s) throw Error(T(318));
                        if (((s = t.memoizedState), (s = s !== null ? s.dehydrated : null), !s))
                            throw Error(T(317));
                        s[lt] = t;
                    } else (Xn(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
                    (xe(t), (s = !1));
                } else (et !== null && (Ua(et), (et = null)), (s = !0));
                if (!s) return t.flags & 65536 ? t : null;
            }
            return t.flags & 128
                ? ((t.lanes = n), t)
                : ((r = r !== null),
                  r !== (e !== null && e.memoizedState !== null) &&
                      r &&
                      ((t.child.flags |= 8192),
                      t.mode & 1 && (e === null || J.current & 1 ? de === 0 && (de = 3) : ql())),
                  t.updateQueue !== null && (t.flags |= 4),
                  xe(t),
                  null);
        case 4:
            return (qn(), Va(e, t), e === null && Xr(t.stateNode.containerInfo), xe(t), null);
        case 10:
            return (Vl(t.type._context), xe(t), null);
        case 17:
            return (De(t.type) && hs(), xe(t), null);
        case 19:
            if ((Q(J), (s = t.memoizedState), s === null)) return (xe(t), null);
            if (((r = (t.flags & 128) !== 0), (o = s.rendering), o === null))
                if (r) gr(s, !1);
                else {
                    if (de !== 0 || (e !== null && e.flags & 128))
                        for (e = t.child; e !== null; ) {
                            if (((o = ws(e)), o !== null)) {
                                for (
                                    t.flags |= 128,
                                        gr(s, !1),
                                        r = o.updateQueue,
                                        r !== null && ((t.updateQueue = r), (t.flags |= 4)),
                                        t.subtreeFlags = 0,
                                        r = n,
                                        n = t.child;
                                    n !== null;
                                )
                                    ((s = n),
                                        (e = r),
                                        (s.flags &= 14680066),
                                        (o = s.alternate),
                                        o === null
                                            ? ((s.childLanes = 0),
                                              (s.lanes = e),
                                              (s.child = null),
                                              (s.subtreeFlags = 0),
                                              (s.memoizedProps = null),
                                              (s.memoizedState = null),
                                              (s.updateQueue = null),
                                              (s.dependencies = null),
                                              (s.stateNode = null))
                                            : ((s.childLanes = o.childLanes),
                                              (s.lanes = o.lanes),
                                              (s.child = o.child),
                                              (s.subtreeFlags = 0),
                                              (s.deletions = null),
                                              (s.memoizedProps = o.memoizedProps),
                                              (s.memoizedState = o.memoizedState),
                                              (s.updateQueue = o.updateQueue),
                                              (s.type = o.type),
                                              (e = o.dependencies),
                                              (s.dependencies =
                                                  e === null
                                                      ? null
                                                      : {
                                                            lanes: e.lanes,
                                                            firstContext: e.firstContext,
                                                        })),
                                        (n = n.sibling));
                                return (K(J, (J.current & 1) | 2), t.child);
                            }
                            e = e.sibling;
                        }
                    s.tail !== null &&
                        ae() > er &&
                        ((t.flags |= 128), (r = !0), gr(s, !1), (t.lanes = 4194304));
                }
            else {
                if (!r)
                    if (((e = ws(o)), e !== null)) {
                        if (
                            ((t.flags |= 128),
                            (r = !0),
                            (n = e.updateQueue),
                            n !== null && ((t.updateQueue = n), (t.flags |= 4)),
                            gr(s, !0),
                            s.tail === null && s.tailMode === 'hidden' && !o.alternate && !X)
                        )
                            return (xe(t), null);
                    } else
                        2 * ae() - s.renderingStartTime > er &&
                            n !== 1073741824 &&
                            ((t.flags |= 128), (r = !0), gr(s, !1), (t.lanes = 4194304));
                s.isBackwards
                    ? ((o.sibling = t.child), (t.child = o))
                    : ((n = s.last), n !== null ? (n.sibling = o) : (t.child = o), (s.last = o));
            }
            return s.tail !== null
                ? ((t = s.tail),
                  (s.rendering = t),
                  (s.tail = t.sibling),
                  (s.renderingStartTime = ae()),
                  (t.sibling = null),
                  (n = J.current),
                  K(J, r ? (n & 1) | 2 : n & 1),
                  t)
                : (xe(t), null);
        case 22:
        case 23:
            return (
                Zl(),
                (r = t.memoizedState !== null),
                e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
                r && t.mode & 1
                    ? Oe & 1073741824 && (xe(t), t.subtreeFlags & 6 && (t.flags |= 8192))
                    : xe(t),
                null
            );
        case 24:
            return null;
        case 25:
            return null;
    }
    throw Error(T(156, t.tag));
}
function W0(e, t) {
    switch ((Al(t), t.tag)) {
        case 1:
            return (
                De(t.type) && hs(),
                (e = t.flags),
                e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 3:
            return (
                qn(),
                Q(Ae),
                Q(Ce),
                zl(),
                (e = t.flags),
                e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 5:
            return (Fl(t), null);
        case 13:
            if ((Q(J), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
                if (t.alternate === null) throw Error(T(340));
                Xn();
            }
            return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 19:
            return (Q(J), null);
        case 4:
            return (qn(), null);
        case 10:
            return (Vl(t.type._context), null);
        case 22:
        case 23:
            return (Zl(), null);
        case 24:
            return null;
        default:
            return null;
    }
}
var Vi = !1,
    Se = !1,
    K0 = typeof WeakSet == 'function' ? WeakSet : Set,
    R = null;
function Vn(e, t) {
    var n = e.ref;
    if (n !== null)
        if (typeof n == 'function')
            try {
                n(null);
            } catch (r) {
                se(e, t, r);
            }
        else n.current = null;
}
function ba(e, t, n) {
    try {
        n();
    } catch (r) {
        se(e, t, r);
    }
}
var zc = !1;
function G0(e, t) {
    if (((xa = us), (e = Oh()), jl(e))) {
        if ('selectionStart' in e) var n = { start: e.selectionStart, end: e.selectionEnd };
        else
            e: {
                n = ((n = e.ownerDocument) && n.defaultView) || window;
                var r = n.getSelection && n.getSelection();
                if (r && r.rangeCount !== 0) {
                    n = r.anchorNode;
                    var i = r.anchorOffset,
                        s = r.focusNode;
                    r = r.focusOffset;
                    try {
                        (n.nodeType, s.nodeType);
                    } catch {
                        n = null;
                        break e;
                    }
                    var o = 0,
                        a = -1,
                        l = -1,
                        u = 0,
                        c = 0,
                        d = e,
                        f = null;
                    t: for (;;) {
                        for (
                            var m;
                            d !== n || (i !== 0 && d.nodeType !== 3) || (a = o + i),
                                d !== s || (r !== 0 && d.nodeType !== 3) || (l = o + r),
                                d.nodeType === 3 && (o += d.nodeValue.length),
                                (m = d.firstChild) !== null;
                        )
                            ((f = d), (d = m));
                        for (;;) {
                            if (d === e) break t;
                            if (
                                (f === n && ++u === i && (a = o),
                                f === s && ++c === r && (l = o),
                                (m = d.nextSibling) !== null)
                            )
                                break;
                            ((d = f), (f = d.parentNode));
                        }
                        d = m;
                    }
                    n = a === -1 || l === -1 ? null : { start: a, end: l };
                } else n = null;
            }
        n = n || { start: 0, end: 0 };
    } else n = null;
    for (wa = { focusedElem: e, selectionRange: n }, us = !1, R = t; R !== null; )
        if (((t = R), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
            ((e.return = t), (R = e));
        else
            for (; R !== null; ) {
                t = R;
                try {
                    var v = t.alternate;
                    if (t.flags & 1024)
                        switch (t.tag) {
                            case 0:
                            case 11:
                            case 15:
                                break;
                            case 1:
                                if (v !== null) {
                                    var x = v.memoizedProps,
                                        k = v.memoizedState,
                                        p = t.stateNode,
                                        h = p.getSnapshotBeforeUpdate(
                                            t.elementType === t.type ? x : qe(t.type, x),
                                            k,
                                        );
                                    p.__reactInternalSnapshotBeforeUpdate = h;
                                }
                                break;
                            case 3:
                                var y = t.stateNode.containerInfo;
                                y.nodeType === 1
                                    ? (y.textContent = '')
                                    : y.nodeType === 9 &&
                                      y.documentElement &&
                                      y.removeChild(y.documentElement);
                                break;
                            case 5:
                            case 6:
                            case 4:
                            case 17:
                                break;
                            default:
                                throw Error(T(163));
                        }
                } catch (w) {
                    se(t, t.return, w);
                }
                if (((e = t.sibling), e !== null)) {
                    ((e.return = t.return), (R = e));
                    break;
                }
                R = t.return;
            }
    return ((v = zc), (zc = !1), v);
}
function Mr(e, t, n) {
    var r = t.updateQueue;
    if (((r = r !== null ? r.lastEffect : null), r !== null)) {
        var i = (r = r.next);
        do {
            if ((i.tag & e) === e) {
                var s = i.destroy;
                ((i.destroy = void 0), s !== void 0 && ba(t, n, s));
            }
            i = i.next;
        } while (i !== r);
    }
}
function Qs(e, t) {
    if (((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)) {
        var n = (t = t.next);
        do {
            if ((n.tag & e) === e) {
                var r = n.create;
                n.destroy = r();
            }
            n = n.next;
        } while (n !== t);
    }
}
function _a(e) {
    var t = e.ref;
    if (t !== null) {
        var n = e.stateNode;
        switch (e.tag) {
            case 5:
                e = n;
                break;
            default:
                e = n;
        }
        typeof t == 'function' ? t(e) : (t.current = e);
    }
}
function Rp(e) {
    var t = e.alternate;
    (t !== null && ((e.alternate = null), Rp(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 &&
            ((t = e.stateNode),
            t !== null && (delete t[lt], delete t[qr], delete t[Ca], delete t[j0], delete t[R0])),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
}
function Ap(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Bc(e) {
    e: for (;;) {
        for (; e.sibling === null; ) {
            if (e.return === null || Ap(e.return)) return null;
            e = e.return;
        }
        for (
            e.sibling.return = e.return, e = e.sibling;
            e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
        ) {
            if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
            ((e.child.return = e), (e = e.child));
        }
        if (!(e.flags & 2)) return e.stateNode;
    }
}
function Ia(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6)
        ((e = e.stateNode),
            t
                ? n.nodeType === 8
                    ? n.parentNode.insertBefore(e, t)
                    : n.insertBefore(e, t)
                : (n.nodeType === 8
                      ? ((t = n.parentNode), t.insertBefore(e, n))
                      : ((t = n), t.appendChild(e)),
                  (n = n._reactRootContainer),
                  n != null || t.onclick !== null || (t.onclick = fs)));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (Ia(e, t, n), e = e.sibling; e !== null; ) (Ia(e, t, n), (e = e.sibling));
}
function Fa(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (Fa(e, t, n), e = e.sibling; e !== null; ) (Fa(e, t, n), (e = e.sibling));
}
var pe = null,
    Je = !1;
function Nt(e, t, n) {
    for (n = n.child; n !== null; ) (Dp(e, t, n), (n = n.sibling));
}
function Dp(e, t, n) {
    if (ct && typeof ct.onCommitFiberUnmount == 'function')
        try {
            ct.onCommitFiberUnmount(zs, n);
        } catch {}
    switch (n.tag) {
        case 5:
            Se || Vn(n, t);
        case 6:
            var r = pe,
                i = Je;
            ((pe = null),
                Nt(e, t, n),
                (pe = r),
                (Je = i),
                pe !== null &&
                    (Je
                        ? ((e = pe),
                          (n = n.stateNode),
                          e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
                        : pe.removeChild(n.stateNode)));
            break;
        case 18:
            pe !== null &&
                (Je
                    ? ((e = pe),
                      (n = n.stateNode),
                      e.nodeType === 8 ? To(e.parentNode, n) : e.nodeType === 1 && To(e, n),
                      Gr(e))
                    : To(pe, n.stateNode));
            break;
        case 4:
            ((r = pe),
                (i = Je),
                (pe = n.stateNode.containerInfo),
                (Je = !0),
                Nt(e, t, n),
                (pe = r),
                (Je = i));
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            if (!Se && ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))) {
                i = r = r.next;
                do {
                    var s = i,
                        o = s.destroy;
                    ((s = s.tag), o !== void 0 && (s & 2 || s & 4) && ba(n, t, o), (i = i.next));
                } while (i !== r);
            }
            Nt(e, t, n);
            break;
        case 1:
            if (!Se && (Vn(n, t), (r = n.stateNode), typeof r.componentWillUnmount == 'function'))
                try {
                    ((r.props = n.memoizedProps),
                        (r.state = n.memoizedState),
                        r.componentWillUnmount());
                } catch (a) {
                    se(n, t, a);
                }
            Nt(e, t, n);
            break;
        case 21:
            Nt(e, t, n);
            break;
        case 22:
            n.mode & 1
                ? ((Se = (r = Se) || n.memoizedState !== null), Nt(e, t, n), (Se = r))
                : Nt(e, t, n);
            break;
        default:
            Nt(e, t, n);
    }
}
function $c(e) {
    var t = e.updateQueue;
    if (t !== null) {
        e.updateQueue = null;
        var n = e.stateNode;
        (n === null && (n = e.stateNode = new K0()),
            t.forEach(function (r) {
                var i = nv.bind(null, e, r);
                n.has(r) || (n.add(r), r.then(i, i));
            }));
    }
}
function Xe(e, t) {
    var n = t.deletions;
    if (n !== null)
        for (var r = 0; r < n.length; r++) {
            var i = n[r];
            try {
                var s = e,
                    o = t,
                    a = o;
                e: for (; a !== null; ) {
                    switch (a.tag) {
                        case 5:
                            ((pe = a.stateNode), (Je = !1));
                            break e;
                        case 3:
                            ((pe = a.stateNode.containerInfo), (Je = !0));
                            break e;
                        case 4:
                            ((pe = a.stateNode.containerInfo), (Je = !0));
                            break e;
                    }
                    a = a.return;
                }
                if (pe === null) throw Error(T(160));
                (Dp(s, o, i), (pe = null), (Je = !1));
                var l = i.alternate;
                (l !== null && (l.return = null), (i.return = null));
            } catch (u) {
                se(i, t, u);
            }
        }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) (Mp(t, e), (t = t.sibling));
}
function Mp(e, t) {
    var n = e.alternate,
        r = e.flags;
    switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            if ((Xe(t, e), ot(e), r & 4)) {
                try {
                    (Mr(3, e, e.return), Qs(3, e));
                } catch (x) {
                    se(e, e.return, x);
                }
                try {
                    Mr(5, e, e.return);
                } catch (x) {
                    se(e, e.return, x);
                }
            }
            break;
        case 1:
            (Xe(t, e), ot(e), r & 512 && n !== null && Vn(n, n.return));
            break;
        case 5:
            if ((Xe(t, e), ot(e), r & 512 && n !== null && Vn(n, n.return), e.flags & 32)) {
                var i = e.stateNode;
                try {
                    Ur(i, '');
                } catch (x) {
                    se(e, e.return, x);
                }
            }
            if (r & 4 && ((i = e.stateNode), i != null)) {
                var s = e.memoizedProps,
                    o = n !== null ? n.memoizedProps : s,
                    a = e.type,
                    l = e.updateQueue;
                if (((e.updateQueue = null), l !== null))
                    try {
                        (a === 'input' && s.type === 'radio' && s.name != null && th(i, s),
                            ua(a, o));
                        var u = ua(a, s);
                        for (o = 0; o < l.length; o += 2) {
                            var c = l[o],
                                d = l[o + 1];
                            c === 'style'
                                ? oh(i, d)
                                : c === 'dangerouslySetInnerHTML'
                                  ? ih(i, d)
                                  : c === 'children'
                                    ? Ur(i, d)
                                    : gl(i, c, d, u);
                        }
                        switch (a) {
                            case 'input':
                                ia(i, s);
                                break;
                            case 'textarea':
                                nh(i, s);
                                break;
                            case 'select':
                                var f = i._wrapperState.wasMultiple;
                                i._wrapperState.wasMultiple = !!s.multiple;
                                var m = s.value;
                                m != null
                                    ? $n(i, !!s.multiple, m, !1)
                                    : f !== !!s.multiple &&
                                      (s.defaultValue != null
                                          ? $n(i, !!s.multiple, s.defaultValue, !0)
                                          : $n(i, !!s.multiple, s.multiple ? [] : '', !1));
                        }
                        i[qr] = s;
                    } catch (x) {
                        se(e, e.return, x);
                    }
            }
            break;
        case 6:
            if ((Xe(t, e), ot(e), r & 4)) {
                if (e.stateNode === null) throw Error(T(162));
                ((i = e.stateNode), (s = e.memoizedProps));
                try {
                    i.nodeValue = s;
                } catch (x) {
                    se(e, e.return, x);
                }
            }
            break;
        case 3:
            if ((Xe(t, e), ot(e), r & 4 && n !== null && n.memoizedState.isDehydrated))
                try {
                    Gr(t.containerInfo);
                } catch (x) {
                    se(e, e.return, x);
                }
            break;
        case 4:
            (Xe(t, e), ot(e));
            break;
        case 13:
            (Xe(t, e),
                ot(e),
                (i = e.child),
                i.flags & 8192 &&
                    ((s = i.memoizedState !== null),
                    (i.stateNode.isHidden = s),
                    !s ||
                        (i.alternate !== null && i.alternate.memoizedState !== null) ||
                        (Yl = ae())),
                r & 4 && $c(e));
            break;
        case 22:
            if (
                ((c = n !== null && n.memoizedState !== null),
                e.mode & 1 ? ((Se = (u = Se) || c), Xe(t, e), (Se = u)) : Xe(t, e),
                ot(e),
                r & 8192)
            ) {
                if (
                    ((u = e.memoizedState !== null), (e.stateNode.isHidden = u) && !c && e.mode & 1)
                )
                    for (R = e, c = e.child; c !== null; ) {
                        for (d = R = c; R !== null; ) {
                            switch (((f = R), (m = f.child), f.tag)) {
                                case 0:
                                case 11:
                                case 14:
                                case 15:
                                    Mr(4, f, f.return);
                                    break;
                                case 1:
                                    Vn(f, f.return);
                                    var v = f.stateNode;
                                    if (typeof v.componentWillUnmount == 'function') {
                                        ((r = f), (n = f.return));
                                        try {
                                            ((t = r),
                                                (v.props = t.memoizedProps),
                                                (v.state = t.memoizedState),
                                                v.componentWillUnmount());
                                        } catch (x) {
                                            se(r, n, x);
                                        }
                                    }
                                    break;
                                case 5:
                                    Vn(f, f.return);
                                    break;
                                case 22:
                                    if (f.memoizedState !== null) {
                                        Hc(d);
                                        continue;
                                    }
                            }
                            m !== null ? ((m.return = f), (R = m)) : Hc(d);
                        }
                        c = c.sibling;
                    }
                e: for (c = null, d = e; ; ) {
                    if (d.tag === 5) {
                        if (c === null) {
                            c = d;
                            try {
                                ((i = d.stateNode),
                                    u
                                        ? ((s = i.style),
                                          typeof s.setProperty == 'function'
                                              ? s.setProperty('display', 'none', 'important')
                                              : (s.display = 'none'))
                                        : ((a = d.stateNode),
                                          (l = d.memoizedProps.style),
                                          (o =
                                              l != null && l.hasOwnProperty('display')
                                                  ? l.display
                                                  : null),
                                          (a.style.display = sh('display', o))));
                            } catch (x) {
                                se(e, e.return, x);
                            }
                        }
                    } else if (d.tag === 6) {
                        if (c === null)
                            try {
                                d.stateNode.nodeValue = u ? '' : d.memoizedProps;
                            } catch (x) {
                                se(e, e.return, x);
                            }
                    } else if (
                        ((d.tag !== 22 && d.tag !== 23) || d.memoizedState === null || d === e) &&
                        d.child !== null
                    ) {
                        ((d.child.return = d), (d = d.child));
                        continue;
                    }
                    if (d === e) break e;
                    for (; d.sibling === null; ) {
                        if (d.return === null || d.return === e) break e;
                        (c === d && (c = null), (d = d.return));
                    }
                    (c === d && (c = null), (d.sibling.return = d.return), (d = d.sibling));
                }
            }
            break;
        case 19:
            (Xe(t, e), ot(e), r & 4 && $c(e));
            break;
        case 21:
            break;
        default:
            (Xe(t, e), ot(e));
    }
}
function ot(e) {
    var t = e.flags;
    if (t & 2) {
        try {
            e: {
                for (var n = e.return; n !== null; ) {
                    if (Ap(n)) {
                        var r = n;
                        break e;
                    }
                    n = n.return;
                }
                throw Error(T(160));
            }
            switch (r.tag) {
                case 5:
                    var i = r.stateNode;
                    r.flags & 32 && (Ur(i, ''), (r.flags &= -33));
                    var s = Bc(e);
                    Fa(e, s, i);
                    break;
                case 3:
                case 4:
                    var o = r.stateNode.containerInfo,
                        a = Bc(e);
                    Ia(e, a, o);
                    break;
                default:
                    throw Error(T(161));
            }
        } catch (l) {
            se(e, e.return, l);
        }
        e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
}
function Q0(e, t, n) {
    ((R = e), Op(e));
}
function Op(e, t, n) {
    for (var r = (e.mode & 1) !== 0; R !== null; ) {
        var i = R,
            s = i.child;
        if (i.tag === 22 && r) {
            var o = i.memoizedState !== null || Vi;
            if (!o) {
                var a = i.alternate,
                    l = (a !== null && a.memoizedState !== null) || Se;
                a = Vi;
                var u = Se;
                if (((Vi = o), (Se = l) && !u))
                    for (R = i; R !== null; )
                        ((o = R),
                            (l = o.child),
                            o.tag === 22 && o.memoizedState !== null
                                ? Wc(i)
                                : l !== null
                                  ? ((l.return = o), (R = l))
                                  : Wc(i));
                for (; s !== null; ) ((R = s), Op(s), (s = s.sibling));
                ((R = i), (Vi = a), (Se = u));
            }
            Uc(e);
        } else i.subtreeFlags & 8772 && s !== null ? ((s.return = i), (R = s)) : Uc(e);
    }
}
function Uc(e) {
    for (; R !== null; ) {
        var t = R;
        if (t.flags & 8772) {
            var n = t.alternate;
            try {
                if (t.flags & 8772)
                    switch (t.tag) {
                        case 0:
                        case 11:
                        case 15:
                            Se || Qs(5, t);
                            break;
                        case 1:
                            var r = t.stateNode;
                            if (t.flags & 4 && !Se)
                                if (n === null) r.componentDidMount();
                                else {
                                    var i =
                                        t.elementType === t.type
                                            ? n.memoizedProps
                                            : qe(t.type, n.memoizedProps);
                                    r.componentDidUpdate(
                                        i,
                                        n.memoizedState,
                                        r.__reactInternalSnapshotBeforeUpdate,
                                    );
                                }
                            var s = t.updateQueue;
                            s !== null && Nc(t, s, r);
                            break;
                        case 3:
                            var o = t.updateQueue;
                            if (o !== null) {
                                if (((n = null), t.child !== null))
                                    switch (t.child.tag) {
                                        case 5:
                                            n = t.child.stateNode;
                                            break;
                                        case 1:
                                            n = t.child.stateNode;
                                    }
                                Nc(t, o, n);
                            }
                            break;
                        case 5:
                            var a = t.stateNode;
                            if (n === null && t.flags & 4) {
                                n = a;
                                var l = t.memoizedProps;
                                switch (t.type) {
                                    case 'button':
                                    case 'input':
                                    case 'select':
                                    case 'textarea':
                                        l.autoFocus && n.focus();
                                        break;
                                    case 'img':
                                        l.src && (n.src = l.src);
                                }
                            }
                            break;
                        case 6:
                            break;
                        case 4:
                            break;
                        case 12:
                            break;
                        case 13:
                            if (t.memoizedState === null) {
                                var u = t.alternate;
                                if (u !== null) {
                                    var c = u.memoizedState;
                                    if (c !== null) {
                                        var d = c.dehydrated;
                                        d !== null && Gr(d);
                                    }
                                }
                            }
                            break;
                        case 19:
                        case 17:
                        case 21:
                        case 22:
                        case 23:
                        case 25:
                            break;
                        default:
                            throw Error(T(163));
                    }
                Se || (t.flags & 512 && _a(t));
            } catch (f) {
                se(t, t.return, f);
            }
        }
        if (t === e) {
            R = null;
            break;
        }
        if (((n = t.sibling), n !== null)) {
            ((n.return = t.return), (R = n));
            break;
        }
        R = t.return;
    }
}
function Hc(e) {
    for (; R !== null; ) {
        var t = R;
        if (t === e) {
            R = null;
            break;
        }
        var n = t.sibling;
        if (n !== null) {
            ((n.return = t.return), (R = n));
            break;
        }
        R = t.return;
    }
}
function Wc(e) {
    for (; R !== null; ) {
        var t = R;
        try {
            switch (t.tag) {
                case 0:
                case 11:
                case 15:
                    var n = t.return;
                    try {
                        Qs(4, t);
                    } catch (l) {
                        se(t, n, l);
                    }
                    break;
                case 1:
                    var r = t.stateNode;
                    if (typeof r.componentDidMount == 'function') {
                        var i = t.return;
                        try {
                            r.componentDidMount();
                        } catch (l) {
                            se(t, i, l);
                        }
                    }
                    var s = t.return;
                    try {
                        _a(t);
                    } catch (l) {
                        se(t, s, l);
                    }
                    break;
                case 5:
                    var o = t.return;
                    try {
                        _a(t);
                    } catch (l) {
                        se(t, o, l);
                    }
            }
        } catch (l) {
            se(t, t.return, l);
        }
        if (t === e) {
            R = null;
            break;
        }
        var a = t.sibling;
        if (a !== null) {
            ((a.return = t.return), (R = a));
            break;
        }
        R = t.return;
    }
}
var Y0 = Math.ceil,
    Cs = Et.ReactCurrentDispatcher,
    Gl = Et.ReactCurrentOwner,
    Ge = Et.ReactCurrentBatchConfig,
    $ = 0,
    he = null,
    ue = null,
    ge = 0,
    Oe = 0,
    bn = Qt(0),
    de = 0,
    ii = null,
    pn = 0,
    Ys = 0,
    Ql = 0,
    Or = null,
    je = null,
    Yl = 0,
    er = 1 / 0,
    pt = null,
    Ps = !1,
    za = null,
    zt = null,
    bi = !1,
    Ot = null,
    Ts = 0,
    Vr = 0,
    Ba = null,
    qi = -1,
    Ji = 0;
function Te() {
    return $ & 6 ? ae() : qi !== -1 ? qi : (qi = ae());
}
function Bt(e) {
    return e.mode & 1
        ? $ & 2 && ge !== 0
            ? ge & -ge
            : D0.transition !== null
              ? (Ji === 0 && (Ji = vh()), Ji)
              : ((e = H), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : Th(e.type))), e)
        : 1;
}
function nt(e, t, n, r) {
    if (50 < Vr) throw ((Vr = 0), (Ba = null), Error(T(185)));
    (fi(e, n, r),
        (!($ & 2) || e !== he) &&
            (e === he && (!($ & 2) && (Ys |= n), de === 4 && Dt(e, ge)),
            Me(e, r),
            n === 1 && $ === 0 && !(t.mode & 1) && ((er = ae() + 500), Ws && Yt())));
}
function Me(e, t) {
    var n = e.callbackNode;
    Dy(e, t);
    var r = ls(e, e === he ? ge : 0);
    if (r === 0) (n !== null && ec(n), (e.callbackNode = null), (e.callbackPriority = 0));
    else if (((t = r & -r), e.callbackPriority !== t)) {
        if ((n != null && ec(n), t === 1))
            (e.tag === 0 ? A0(Kc.bind(null, e)) : Hh(Kc.bind(null, e)),
                N0(function () {
                    !($ & 6) && Yt();
                }),
                (n = null));
        else {
            switch (xh(r)) {
                case 1:
                    n = Sl;
                    break;
                case 4:
                    n = gh;
                    break;
                case 16:
                    n = as;
                    break;
                case 536870912:
                    n = yh;
                    break;
                default:
                    n = as;
            }
            n = $p(n, Vp.bind(null, e));
        }
        ((e.callbackPriority = t), (e.callbackNode = n));
    }
}
function Vp(e, t) {
    if (((qi = -1), (Ji = 0), $ & 6)) throw Error(T(327));
    var n = e.callbackNode;
    if (Gn() && e.callbackNode !== n) return null;
    var r = ls(e, e === he ? ge : 0);
    if (r === 0) return null;
    if (r & 30 || r & e.expiredLanes || t) t = Es(e, r);
    else {
        t = r;
        var i = $;
        $ |= 2;
        var s = _p();
        (he !== e || ge !== t) && ((pt = null), (er = ae() + 500), ln(e, t));
        do
            try {
                q0();
                break;
            } catch (a) {
                bp(e, a);
            }
        while (!0);
        (Ol(),
            (Cs.current = s),
            ($ = i),
            ue !== null ? (t = 0) : ((he = null), (ge = 0), (t = de)));
    }
    if (t !== 0) {
        if ((t === 2 && ((i = pa(e)), i !== 0 && ((r = i), (t = $a(e, i)))), t === 1))
            throw ((n = ii), ln(e, 0), Dt(e, r), Me(e, ae()), n);
        if (t === 6) Dt(e, r);
        else {
            if (
                ((i = e.current.alternate),
                !(r & 30) &&
                    !X0(i) &&
                    ((t = Es(e, r)),
                    t === 2 && ((s = pa(e)), s !== 0 && ((r = s), (t = $a(e, s)))),
                    t === 1))
            )
                throw ((n = ii), ln(e, 0), Dt(e, r), Me(e, ae()), n);
            switch (((e.finishedWork = i), (e.finishedLanes = r), t)) {
                case 0:
                case 1:
                    throw Error(T(345));
                case 2:
                    en(e, je, pt);
                    break;
                case 3:
                    if ((Dt(e, r), (r & 130023424) === r && ((t = Yl + 500 - ae()), 10 < t))) {
                        if (ls(e, 0) !== 0) break;
                        if (((i = e.suspendedLanes), (i & r) !== r)) {
                            (Te(), (e.pingedLanes |= e.suspendedLanes & i));
                            break;
                        }
                        e.timeoutHandle = ka(en.bind(null, e, je, pt), t);
                        break;
                    }
                    en(e, je, pt);
                    break;
                case 4:
                    if ((Dt(e, r), (r & 4194240) === r)) break;
                    for (t = e.eventTimes, i = -1; 0 < r; ) {
                        var o = 31 - tt(r);
                        ((s = 1 << o), (o = t[o]), o > i && (i = o), (r &= ~s));
                    }
                    if (
                        ((r = i),
                        (r = ae() - r),
                        (r =
                            (120 > r
                                ? 120
                                : 480 > r
                                  ? 480
                                  : 1080 > r
                                    ? 1080
                                    : 1920 > r
                                      ? 1920
                                      : 3e3 > r
                                        ? 3e3
                                        : 4320 > r
                                          ? 4320
                                          : 1960 * Y0(r / 1960)) - r),
                        10 < r)
                    ) {
                        e.timeoutHandle = ka(en.bind(null, e, je, pt), r);
                        break;
                    }
                    en(e, je, pt);
                    break;
                case 5:
                    en(e, je, pt);
                    break;
                default:
                    throw Error(T(329));
            }
        }
    }
    return (Me(e, ae()), e.callbackNode === n ? Vp.bind(null, e) : null);
}
function $a(e, t) {
    var n = Or;
    return (
        e.current.memoizedState.isDehydrated && (ln(e, t).flags |= 256),
        (e = Es(e, t)),
        e !== 2 && ((t = je), (je = n), t !== null && Ua(t)),
        e
    );
}
function Ua(e) {
    je === null ? (je = e) : je.push.apply(je, e);
}
function X0(e) {
    for (var t = e; ; ) {
        if (t.flags & 16384) {
            var n = t.updateQueue;
            if (n !== null && ((n = n.stores), n !== null))
                for (var r = 0; r < n.length; r++) {
                    var i = n[r],
                        s = i.getSnapshot;
                    i = i.value;
                    try {
                        if (!rt(s(), i)) return !1;
                    } catch {
                        return !1;
                    }
                }
        }
        if (((n = t.child), t.subtreeFlags & 16384 && n !== null)) ((n.return = t), (t = n));
        else {
            if (t === e) break;
            for (; t.sibling === null; ) {
                if (t.return === null || t.return === e) return !0;
                t = t.return;
            }
            ((t.sibling.return = t.return), (t = t.sibling));
        }
    }
    return !0;
}
function Dt(e, t) {
    for (
        t &= ~Ql, t &= ~Ys, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes;
        0 < t;
    ) {
        var n = 31 - tt(t),
            r = 1 << n;
        ((e[n] = -1), (t &= ~r));
    }
}
function Kc(e) {
    if ($ & 6) throw Error(T(327));
    Gn();
    var t = ls(e, 0);
    if (!(t & 1)) return (Me(e, ae()), null);
    var n = Es(e, t);
    if (e.tag !== 0 && n === 2) {
        var r = pa(e);
        r !== 0 && ((t = r), (n = $a(e, r)));
    }
    if (n === 1) throw ((n = ii), ln(e, 0), Dt(e, t), Me(e, ae()), n);
    if (n === 6) throw Error(T(345));
    return (
        (e.finishedWork = e.current.alternate),
        (e.finishedLanes = t),
        en(e, je, pt),
        Me(e, ae()),
        null
    );
}
function Xl(e, t) {
    var n = $;
    $ |= 1;
    try {
        return e(t);
    } finally {
        (($ = n), $ === 0 && ((er = ae() + 500), Ws && Yt()));
    }
}
function mn(e) {
    Ot !== null && Ot.tag === 0 && !($ & 6) && Gn();
    var t = $;
    $ |= 1;
    var n = Ge.transition,
        r = H;
    try {
        if (((Ge.transition = null), (H = 1), e)) return e();
    } finally {
        ((H = r), (Ge.transition = n), ($ = t), !($ & 6) && Yt());
    }
}
function Zl() {
    ((Oe = bn.current), Q(bn));
}
function ln(e, t) {
    ((e.finishedWork = null), (e.finishedLanes = 0));
    var n = e.timeoutHandle;
    if ((n !== -1 && ((e.timeoutHandle = -1), E0(n)), ue !== null))
        for (n = ue.return; n !== null; ) {
            var r = n;
            switch ((Al(r), r.tag)) {
                case 1:
                    ((r = r.type.childContextTypes), r != null && hs());
                    break;
                case 3:
                    (qn(), Q(Ae), Q(Ce), zl());
                    break;
                case 5:
                    Fl(r);
                    break;
                case 4:
                    qn();
                    break;
                case 13:
                    Q(J);
                    break;
                case 19:
                    Q(J);
                    break;
                case 10:
                    Vl(r.type._context);
                    break;
                case 22:
                case 23:
                    Zl();
            }
            n = n.return;
        }
    if (
        ((he = e),
        (ue = e = $t(e.current, null)),
        (ge = Oe = t),
        (de = 0),
        (ii = null),
        (Ql = Ys = pn = 0),
        (je = Or = null),
        sn !== null)
    ) {
        for (t = 0; t < sn.length; t++)
            if (((n = sn[t]), (r = n.interleaved), r !== null)) {
                n.interleaved = null;
                var i = r.next,
                    s = n.pending;
                if (s !== null) {
                    var o = s.next;
                    ((s.next = i), (r.next = o));
                }
                n.pending = r;
            }
        sn = null;
    }
    return e;
}
function bp(e, t) {
    do {
        var n = ue;
        try {
            if ((Ol(), (Yi.current = ks), Ss)) {
                for (var r = te.memoizedState; r !== null; ) {
                    var i = r.queue;
                    (i !== null && (i.pending = null), (r = r.next));
                }
                Ss = !1;
            }
            if (
                ((hn = 0),
                (fe = ce = te = null),
                (Dr = !1),
                (ti = 0),
                (Gl.current = null),
                n === null || n.return === null)
            ) {
                ((de = 1), (ii = t), (ue = null));
                break;
            }
            e: {
                var s = e,
                    o = n.return,
                    a = n,
                    l = t;
                if (
                    ((t = ge),
                    (a.flags |= 32768),
                    l !== null && typeof l == 'object' && typeof l.then == 'function')
                ) {
                    var u = l,
                        c = a,
                        d = c.tag;
                    if (!(c.mode & 1) && (d === 0 || d === 11 || d === 15)) {
                        var f = c.alternate;
                        f
                            ? ((c.updateQueue = f.updateQueue),
                              (c.memoizedState = f.memoizedState),
                              (c.lanes = f.lanes))
                            : ((c.updateQueue = null), (c.memoizedState = null));
                    }
                    var m = Mc(o);
                    if (m !== null) {
                        ((m.flags &= -257),
                            Oc(m, o, a, s, t),
                            m.mode & 1 && Dc(s, u, t),
                            (t = m),
                            (l = u));
                        var v = t.updateQueue;
                        if (v === null) {
                            var x = new Set();
                            (x.add(l), (t.updateQueue = x));
                        } else v.add(l);
                        break e;
                    } else {
                        if (!(t & 1)) {
                            (Dc(s, u, t), ql());
                            break e;
                        }
                        l = Error(T(426));
                    }
                } else if (X && a.mode & 1) {
                    var k = Mc(o);
                    if (k !== null) {
                        (!(k.flags & 65536) && (k.flags |= 256), Oc(k, o, a, s, t), Dl(Jn(l, a)));
                        break e;
                    }
                }
                ((s = l = Jn(l, a)),
                    de !== 4 && (de = 2),
                    Or === null ? (Or = [s]) : Or.push(s),
                    (s = o));
                do {
                    switch (s.tag) {
                        case 3:
                            ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
                            var p = xp(s, l, t);
                            Ec(s, p);
                            break e;
                        case 1:
                            a = l;
                            var h = s.type,
                                y = s.stateNode;
                            if (
                                !(s.flags & 128) &&
                                (typeof h.getDerivedStateFromError == 'function' ||
                                    (y !== null &&
                                        typeof y.componentDidCatch == 'function' &&
                                        (zt === null || !zt.has(y))))
                            ) {
                                ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
                                var w = wp(s, a, t);
                                Ec(s, w);
                                break e;
                            }
                    }
                    s = s.return;
                } while (s !== null);
            }
            Fp(n);
        } catch (S) {
            ((t = S), ue === n && n !== null && (ue = n = n.return));
            continue;
        }
        break;
    } while (!0);
}
function _p() {
    var e = Cs.current;
    return ((Cs.current = ks), e === null ? ks : e);
}
function ql() {
    ((de === 0 || de === 3 || de === 2) && (de = 4),
        he === null || (!(pn & 268435455) && !(Ys & 268435455)) || Dt(he, ge));
}
function Es(e, t) {
    var n = $;
    $ |= 2;
    var r = _p();
    (he !== e || ge !== t) && ((pt = null), ln(e, t));
    do
        try {
            Z0();
            break;
        } catch (i) {
            bp(e, i);
        }
    while (!0);
    if ((Ol(), ($ = n), (Cs.current = r), ue !== null)) throw Error(T(261));
    return ((he = null), (ge = 0), de);
}
function Z0() {
    for (; ue !== null; ) Ip(ue);
}
function q0() {
    for (; ue !== null && !Cy(); ) Ip(ue);
}
function Ip(e) {
    var t = Bp(e.alternate, e, Oe);
    ((e.memoizedProps = e.pendingProps), t === null ? Fp(e) : (ue = t), (Gl.current = null));
}
function Fp(e) {
    var t = e;
    do {
        var n = t.alternate;
        if (((e = t.return), t.flags & 32768)) {
            if (((n = W0(n, t)), n !== null)) {
                ((n.flags &= 32767), (ue = n));
                return;
            }
            if (e !== null) ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
            else {
                ((de = 6), (ue = null));
                return;
            }
        } else if (((n = H0(n, t, Oe)), n !== null)) {
            ue = n;
            return;
        }
        if (((t = t.sibling), t !== null)) {
            ue = t;
            return;
        }
        ue = t = e;
    } while (t !== null);
    de === 0 && (de = 5);
}
function en(e, t, n) {
    var r = H,
        i = Ge.transition;
    try {
        ((Ge.transition = null), (H = 1), J0(e, t, n, r));
    } finally {
        ((Ge.transition = i), (H = r));
    }
    return null;
}
function J0(e, t, n, r) {
    do Gn();
    while (Ot !== null);
    if ($ & 6) throw Error(T(327));
    n = e.finishedWork;
    var i = e.finishedLanes;
    if (n === null) return null;
    if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current)) throw Error(T(177));
    ((e.callbackNode = null), (e.callbackPriority = 0));
    var s = n.lanes | n.childLanes;
    if (
        (My(e, s),
        e === he && ((ue = he = null), (ge = 0)),
        (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
            bi ||
            ((bi = !0),
            $p(as, function () {
                return (Gn(), null);
            })),
        (s = (n.flags & 15990) !== 0),
        n.subtreeFlags & 15990 || s)
    ) {
        ((s = Ge.transition), (Ge.transition = null));
        var o = H;
        H = 1;
        var a = $;
        (($ |= 4),
            (Gl.current = null),
            G0(e, n),
            Mp(n, e),
            x0(wa),
            (us = !!xa),
            (wa = xa = null),
            (e.current = n),
            Q0(n),
            Py(),
            ($ = a),
            (H = o),
            (Ge.transition = s));
    } else e.current = n;
    if (
        (bi && ((bi = !1), (Ot = e), (Ts = i)),
        (s = e.pendingLanes),
        s === 0 && (zt = null),
        Ny(n.stateNode),
        Me(e, ae()),
        t !== null)
    )
        for (r = e.onRecoverableError, n = 0; n < t.length; n++)
            ((i = t[n]), r(i.value, { componentStack: i.stack, digest: i.digest }));
    if (Ps) throw ((Ps = !1), (e = za), (za = null), e);
    return (
        Ts & 1 && e.tag !== 0 && Gn(),
        (s = e.pendingLanes),
        s & 1 ? (e === Ba ? Vr++ : ((Vr = 0), (Ba = e))) : (Vr = 0),
        Yt(),
        null
    );
}
function Gn() {
    if (Ot !== null) {
        var e = xh(Ts),
            t = Ge.transition,
            n = H;
        try {
            if (((Ge.transition = null), (H = 16 > e ? 16 : e), Ot === null)) var r = !1;
            else {
                if (((e = Ot), (Ot = null), (Ts = 0), $ & 6)) throw Error(T(331));
                var i = $;
                for ($ |= 4, R = e.current; R !== null; ) {
                    var s = R,
                        o = s.child;
                    if (R.flags & 16) {
                        var a = s.deletions;
                        if (a !== null) {
                            for (var l = 0; l < a.length; l++) {
                                var u = a[l];
                                for (R = u; R !== null; ) {
                                    var c = R;
                                    switch (c.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            Mr(8, c, s);
                                    }
                                    var d = c.child;
                                    if (d !== null) ((d.return = c), (R = d));
                                    else
                                        for (; R !== null; ) {
                                            c = R;
                                            var f = c.sibling,
                                                m = c.return;
                                            if ((Rp(c), c === u)) {
                                                R = null;
                                                break;
                                            }
                                            if (f !== null) {
                                                ((f.return = m), (R = f));
                                                break;
                                            }
                                            R = m;
                                        }
                                }
                            }
                            var v = s.alternate;
                            if (v !== null) {
                                var x = v.child;
                                if (x !== null) {
                                    v.child = null;
                                    do {
                                        var k = x.sibling;
                                        ((x.sibling = null), (x = k));
                                    } while (x !== null);
                                }
                            }
                            R = s;
                        }
                    }
                    if (s.subtreeFlags & 2064 && o !== null) ((o.return = s), (R = o));
                    else
                        e: for (; R !== null; ) {
                            if (((s = R), s.flags & 2048))
                                switch (s.tag) {
                                    case 0:
                                    case 11:
                                    case 15:
                                        Mr(9, s, s.return);
                                }
                            var p = s.sibling;
                            if (p !== null) {
                                ((p.return = s.return), (R = p));
                                break e;
                            }
                            R = s.return;
                        }
                }
                var h = e.current;
                for (R = h; R !== null; ) {
                    o = R;
                    var y = o.child;
                    if (o.subtreeFlags & 2064 && y !== null) ((y.return = o), (R = y));
                    else
                        e: for (o = h; R !== null; ) {
                            if (((a = R), a.flags & 2048))
                                try {
                                    switch (a.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            Qs(9, a);
                                    }
                                } catch (S) {
                                    se(a, a.return, S);
                                }
                            if (a === o) {
                                R = null;
                                break e;
                            }
                            var w = a.sibling;
                            if (w !== null) {
                                ((w.return = a.return), (R = w));
                                break e;
                            }
                            R = a.return;
                        }
                }
                if ((($ = i), Yt(), ct && typeof ct.onPostCommitFiberRoot == 'function'))
                    try {
                        ct.onPostCommitFiberRoot(zs, e);
                    } catch {}
                r = !0;
            }
            return r;
        } finally {
            ((H = n), (Ge.transition = t));
        }
    }
    return !1;
}
function Gc(e, t, n) {
    ((t = Jn(n, t)),
        (t = xp(e, t, 1)),
        (e = Ft(e, t, 1)),
        (t = Te()),
        e !== null && (fi(e, 1, t), Me(e, t)));
}
function se(e, t, n) {
    if (e.tag === 3) Gc(e, e, n);
    else
        for (; t !== null; ) {
            if (t.tag === 3) {
                Gc(t, e, n);
                break;
            } else if (t.tag === 1) {
                var r = t.stateNode;
                if (
                    typeof t.type.getDerivedStateFromError == 'function' ||
                    (typeof r.componentDidCatch == 'function' && (zt === null || !zt.has(r)))
                ) {
                    ((e = Jn(n, e)),
                        (e = wp(t, e, 1)),
                        (t = Ft(t, e, 1)),
                        (e = Te()),
                        t !== null && (fi(t, 1, e), Me(t, e)));
                    break;
                }
            }
            t = t.return;
        }
}
function ev(e, t, n) {
    var r = e.pingCache;
    (r !== null && r.delete(t),
        (t = Te()),
        (e.pingedLanes |= e.suspendedLanes & n),
        he === e &&
            (ge & n) === n &&
            (de === 4 || (de === 3 && (ge & 130023424) === ge && 500 > ae() - Yl)
                ? ln(e, 0)
                : (Ql |= n)),
        Me(e, t));
}
function zp(e, t) {
    t === 0 && (e.mode & 1 ? ((t = Ei), (Ei <<= 1), !(Ei & 130023424) && (Ei = 4194304)) : (t = 1));
    var n = Te();
    ((e = Ct(e, t)), e !== null && (fi(e, t, n), Me(e, n)));
}
function tv(e) {
    var t = e.memoizedState,
        n = 0;
    (t !== null && (n = t.retryLane), zp(e, n));
}
function nv(e, t) {
    var n = 0;
    switch (e.tag) {
        case 13:
            var r = e.stateNode,
                i = e.memoizedState;
            i !== null && (n = i.retryLane);
            break;
        case 19:
            r = e.stateNode;
            break;
        default:
            throw Error(T(314));
    }
    (r !== null && r.delete(t), zp(e, n));
}
var Bp;
Bp = function (e, t, n) {
    if (e !== null)
        if (e.memoizedProps !== t.pendingProps || Ae.current) Re = !0;
        else {
            if (!(e.lanes & n) && !(t.flags & 128)) return ((Re = !1), U0(e, t, n));
            Re = !!(e.flags & 131072);
        }
    else ((Re = !1), X && t.flags & 1048576 && Wh(t, gs, t.index));
    switch (((t.lanes = 0), t.tag)) {
        case 2:
            var r = t.type;
            (Zi(e, t), (e = t.pendingProps));
            var i = Yn(t, Ce.current);
            (Kn(t, n), (i = $l(null, t, r, e, i, n)));
            var s = Ul();
            return (
                (t.flags |= 1),
                typeof i == 'object' &&
                i !== null &&
                typeof i.render == 'function' &&
                i.$$typeof === void 0
                    ? ((t.tag = 1),
                      (t.memoizedState = null),
                      (t.updateQueue = null),
                      De(r) ? ((s = !0), ps(t)) : (s = !1),
                      (t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null),
                      _l(t),
                      (i.updater = Gs),
                      (t.stateNode = i),
                      (i._reactInternals = t),
                      ja(t, r, e, n),
                      (t = Da(null, t, r, !0, s, n)))
                    : ((t.tag = 0), X && s && Rl(t), Pe(null, t, i, n), (t = t.child)),
                t
            );
        case 16:
            r = t.elementType;
            e: {
                switch (
                    (Zi(e, t),
                    (e = t.pendingProps),
                    (i = r._init),
                    (r = i(r._payload)),
                    (t.type = r),
                    (i = t.tag = iv(r)),
                    (e = qe(r, e)),
                    i)
                ) {
                    case 0:
                        t = Aa(null, t, r, e, n);
                        break e;
                    case 1:
                        t = _c(null, t, r, e, n);
                        break e;
                    case 11:
                        t = Vc(null, t, r, e, n);
                        break e;
                    case 14:
                        t = bc(null, t, r, qe(r.type, e), n);
                        break e;
                }
                throw Error(T(306, r, ''));
            }
            return t;
        case 0:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : qe(r, i)),
                Aa(e, t, r, i, n)
            );
        case 1:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : qe(r, i)),
                _c(e, t, r, i, n)
            );
        case 3:
            e: {
                if ((Pp(t), e === null)) throw Error(T(387));
                ((r = t.pendingProps),
                    (s = t.memoizedState),
                    (i = s.element),
                    Zh(e, t),
                    xs(t, r, null, n));
                var o = t.memoizedState;
                if (((r = o.element), s.isDehydrated))
                    if (
                        ((s = {
                            element: r,
                            isDehydrated: !1,
                            cache: o.cache,
                            pendingSuspenseBoundaries: o.pendingSuspenseBoundaries,
                            transitions: o.transitions,
                        }),
                        (t.updateQueue.baseState = s),
                        (t.memoizedState = s),
                        t.flags & 256)
                    ) {
                        ((i = Jn(Error(T(423)), t)), (t = Ic(e, t, r, n, i)));
                        break e;
                    } else if (r !== i) {
                        ((i = Jn(Error(T(424)), t)), (t = Ic(e, t, r, n, i)));
                        break e;
                    } else
                        for (
                            Ve = It(t.stateNode.containerInfo.firstChild),
                                be = t,
                                X = !0,
                                et = null,
                                n = Yh(t, null, r, n),
                                t.child = n;
                            n;
                        )
                            ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
                else {
                    if ((Xn(), r === i)) {
                        t = Pt(e, t, n);
                        break e;
                    }
                    Pe(e, t, r, n);
                }
                t = t.child;
            }
            return t;
        case 5:
            return (
                qh(t),
                e === null && Ea(t),
                (r = t.type),
                (i = t.pendingProps),
                (s = e !== null ? e.memoizedProps : null),
                (o = i.children),
                Sa(r, i) ? (o = null) : s !== null && Sa(r, s) && (t.flags |= 32),
                Cp(e, t),
                Pe(e, t, o, n),
                t.child
            );
        case 6:
            return (e === null && Ea(t), null);
        case 13:
            return Tp(e, t, n);
        case 4:
            return (
                Il(t, t.stateNode.containerInfo),
                (r = t.pendingProps),
                e === null ? (t.child = Zn(t, null, r, n)) : Pe(e, t, r, n),
                t.child
            );
        case 11:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : qe(r, i)),
                Vc(e, t, r, i, n)
            );
        case 7:
            return (Pe(e, t, t.pendingProps, n), t.child);
        case 8:
            return (Pe(e, t, t.pendingProps.children, n), t.child);
        case 12:
            return (Pe(e, t, t.pendingProps.children, n), t.child);
        case 10:
            e: {
                if (
                    ((r = t.type._context),
                    (i = t.pendingProps),
                    (s = t.memoizedProps),
                    (o = i.value),
                    K(ys, r._currentValue),
                    (r._currentValue = o),
                    s !== null)
                )
                    if (rt(s.value, o)) {
                        if (s.children === i.children && !Ae.current) {
                            t = Pt(e, t, n);
                            break e;
                        }
                    } else
                        for (s = t.child, s !== null && (s.return = t); s !== null; ) {
                            var a = s.dependencies;
                            if (a !== null) {
                                o = s.child;
                                for (var l = a.firstContext; l !== null; ) {
                                    if (l.context === r) {
                                        if (s.tag === 1) {
                                            ((l = vt(-1, n & -n)), (l.tag = 2));
                                            var u = s.updateQueue;
                                            if (u !== null) {
                                                u = u.shared;
                                                var c = u.pending;
                                                (c === null
                                                    ? (l.next = l)
                                                    : ((l.next = c.next), (c.next = l)),
                                                    (u.pending = l));
                                            }
                                        }
                                        ((s.lanes |= n),
                                            (l = s.alternate),
                                            l !== null && (l.lanes |= n),
                                            Na(s.return, n, t),
                                            (a.lanes |= n));
                                        break;
                                    }
                                    l = l.next;
                                }
                            } else if (s.tag === 10) o = s.type === t.type ? null : s.child;
                            else if (s.tag === 18) {
                                if (((o = s.return), o === null)) throw Error(T(341));
                                ((o.lanes |= n),
                                    (a = o.alternate),
                                    a !== null && (a.lanes |= n),
                                    Na(o, n, t),
                                    (o = s.sibling));
                            } else o = s.child;
                            if (o !== null) o.return = s;
                            else
                                for (o = s; o !== null; ) {
                                    if (o === t) {
                                        o = null;
                                        break;
                                    }
                                    if (((s = o.sibling), s !== null)) {
                                        ((s.return = o.return), (o = s));
                                        break;
                                    }
                                    o = o.return;
                                }
                            s = o;
                        }
                (Pe(e, t, i.children, n), (t = t.child));
            }
            return t;
        case 9:
            return (
                (i = t.type),
                (r = t.pendingProps.children),
                Kn(t, n),
                (i = Qe(i)),
                (r = r(i)),
                (t.flags |= 1),
                Pe(e, t, r, n),
                t.child
            );
        case 14:
            return (
                (r = t.type),
                (i = qe(r, t.pendingProps)),
                (i = qe(r.type, i)),
                bc(e, t, r, i, n)
            );
        case 15:
            return Sp(e, t, t.type, t.pendingProps, n);
        case 17:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : qe(r, i)),
                Zi(e, t),
                (t.tag = 1),
                De(r) ? ((e = !0), ps(t)) : (e = !1),
                Kn(t, n),
                vp(t, r, i),
                ja(t, r, i, n),
                Da(null, t, r, !0, e, n)
            );
        case 19:
            return Ep(e, t, n);
        case 22:
            return kp(e, t, n);
    }
    throw Error(T(156, t.tag));
};
function $p(e, t) {
    return mh(e, t);
}
function rv(e, t, n, r) {
    ((this.tag = e),
        (this.key = n),
        (this.sibling =
            this.child =
            this.return =
            this.stateNode =
            this.type =
            this.elementType =
                null),
        (this.index = 0),
        (this.ref = null),
        (this.pendingProps = t),
        (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
        (this.mode = r),
        (this.subtreeFlags = this.flags = 0),
        (this.deletions = null),
        (this.childLanes = this.lanes = 0),
        (this.alternate = null));
}
function Ke(e, t, n, r) {
    return new rv(e, t, n, r);
}
function Jl(e) {
    return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function iv(e) {
    if (typeof e == 'function') return Jl(e) ? 1 : 0;
    if (e != null) {
        if (((e = e.$$typeof), e === vl)) return 11;
        if (e === xl) return 14;
    }
    return 2;
}
function $t(e, t) {
    var n = e.alternate;
    return (
        n === null
            ? ((n = Ke(e.tag, t, e.key, e.mode)),
              (n.elementType = e.elementType),
              (n.type = e.type),
              (n.stateNode = e.stateNode),
              (n.alternate = e),
              (e.alternate = n))
            : ((n.pendingProps = t),
              (n.type = e.type),
              (n.flags = 0),
              (n.subtreeFlags = 0),
              (n.deletions = null)),
        (n.flags = e.flags & 14680064),
        (n.childLanes = e.childLanes),
        (n.lanes = e.lanes),
        (n.child = e.child),
        (n.memoizedProps = e.memoizedProps),
        (n.memoizedState = e.memoizedState),
        (n.updateQueue = e.updateQueue),
        (t = e.dependencies),
        (n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
        (n.sibling = e.sibling),
        (n.index = e.index),
        (n.ref = e.ref),
        n
    );
}
function es(e, t, n, r, i, s) {
    var o = 2;
    if (((r = e), typeof e == 'function')) Jl(e) && (o = 1);
    else if (typeof e == 'string') o = 5;
    else
        e: switch (e) {
            case En:
                return un(n.children, i, s, t);
            case yl:
                ((o = 8), (i |= 8));
                break;
            case Jo:
                return ((e = Ke(12, n, t, i | 2)), (e.elementType = Jo), (e.lanes = s), e);
            case ea:
                return ((e = Ke(13, n, t, i)), (e.elementType = ea), (e.lanes = s), e);
            case ta:
                return ((e = Ke(19, n, t, i)), (e.elementType = ta), (e.lanes = s), e);
            case qf:
                return Xs(n, i, s, t);
            default:
                if (typeof e == 'object' && e !== null)
                    switch (e.$$typeof) {
                        case Xf:
                            o = 10;
                            break e;
                        case Zf:
                            o = 9;
                            break e;
                        case vl:
                            o = 11;
                            break e;
                        case xl:
                            o = 14;
                            break e;
                        case jt:
                            ((o = 16), (r = null));
                            break e;
                    }
                throw Error(T(130, e == null ? e : typeof e, ''));
        }
    return ((t = Ke(o, n, t, i)), (t.elementType = e), (t.type = r), (t.lanes = s), t);
}
function un(e, t, n, r) {
    return ((e = Ke(7, e, r, t)), (e.lanes = n), e);
}
function Xs(e, t, n, r) {
    return (
        (e = Ke(22, e, r, t)),
        (e.elementType = qf),
        (e.lanes = n),
        (e.stateNode = { isHidden: !1 }),
        e
    );
}
function Mo(e, t, n) {
    return ((e = Ke(6, e, null, t)), (e.lanes = n), e);
}
function Oo(e, t, n) {
    return (
        (t = Ke(4, e.children !== null ? e.children : [], e.key, t)),
        (t.lanes = n),
        (t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation,
        }),
        t
    );
}
function sv(e, t, n, r, i) {
    ((this.tag = t),
        (this.containerInfo = e),
        (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode = this.pendingContext = this.context = null),
        (this.callbackPriority = 0),
        (this.eventTimes = po(0)),
        (this.expirationTimes = po(-1)),
        (this.entangledLanes =
            this.finishedLanes =
            this.mutableReadLanes =
            this.expiredLanes =
            this.pingedLanes =
            this.suspendedLanes =
            this.pendingLanes =
                0),
        (this.entanglements = po(0)),
        (this.identifierPrefix = r),
        (this.onRecoverableError = i),
        (this.mutableSourceEagerHydrationData = null));
}
function eu(e, t, n, r, i, s, o, a, l) {
    return (
        (e = new sv(e, t, n, a, l)),
        t === 1 ? ((t = 1), s === !0 && (t |= 8)) : (t = 0),
        (s = Ke(3, null, null, t)),
        (e.current = s),
        (s.stateNode = e),
        (s.memoizedState = {
            element: r,
            isDehydrated: n,
            cache: null,
            transitions: null,
            pendingSuspenseBoundaries: null,
        }),
        _l(s),
        e
    );
}
function ov(e, t, n) {
    var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
        $$typeof: Tn,
        key: r == null ? null : '' + r,
        children: e,
        containerInfo: t,
        implementation: n,
    };
}
function Up(e) {
    if (!e) return Ht;
    e = e._reactInternals;
    e: {
        if (vn(e) !== e || e.tag !== 1) throw Error(T(170));
        var t = e;
        do {
            switch (t.tag) {
                case 3:
                    t = t.stateNode.context;
                    break e;
                case 1:
                    if (De(t.type)) {
                        t = t.stateNode.__reactInternalMemoizedMergedChildContext;
                        break e;
                    }
            }
            t = t.return;
        } while (t !== null);
        throw Error(T(171));
    }
    if (e.tag === 1) {
        var n = e.type;
        if (De(n)) return Uh(e, n, t);
    }
    return t;
}
function Hp(e, t, n, r, i, s, o, a, l) {
    return (
        (e = eu(n, r, !0, e, i, s, o, a, l)),
        (e.context = Up(null)),
        (n = e.current),
        (r = Te()),
        (i = Bt(n)),
        (s = vt(r, i)),
        (s.callback = t ?? null),
        Ft(n, s, i),
        (e.current.lanes = i),
        fi(e, i, r),
        Me(e, r),
        e
    );
}
function Zs(e, t, n, r) {
    var i = t.current,
        s = Te(),
        o = Bt(i);
    return (
        (n = Up(n)),
        t.context === null ? (t.context = n) : (t.pendingContext = n),
        (t = vt(s, o)),
        (t.payload = { element: e }),
        (r = r === void 0 ? null : r),
        r !== null && (t.callback = r),
        (e = Ft(i, t, o)),
        e !== null && (nt(e, i, o, s), Qi(e, i, o)),
        o
    );
}
function Ns(e) {
    if (((e = e.current), !e.child)) return null;
    switch (e.child.tag) {
        case 5:
            return e.child.stateNode;
        default:
            return e.child.stateNode;
    }
}
function Qc(e, t) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
    }
}
function tu(e, t) {
    (Qc(e, t), (e = e.alternate) && Qc(e, t));
}
function av() {
    return null;
}
var Wp =
    typeof reportError == 'function'
        ? reportError
        : function (e) {
              console.error(e);
          };
function nu(e) {
    this._internalRoot = e;
}
qs.prototype.render = nu.prototype.render = function (e) {
    var t = this._internalRoot;
    if (t === null) throw Error(T(409));
    Zs(e, t, null, null);
};
qs.prototype.unmount = nu.prototype.unmount = function () {
    var e = this._internalRoot;
    if (e !== null) {
        this._internalRoot = null;
        var t = e.containerInfo;
        (mn(function () {
            Zs(null, e, null, null);
        }),
            (t[kt] = null));
    }
};
function qs(e) {
    this._internalRoot = e;
}
qs.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
        var t = kh();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < At.length && t !== 0 && t < At[n].priority; n++);
        (At.splice(n, 0, e), n === 0 && Ph(e));
    }
};
function ru(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function Js(e) {
    return !(
        !e ||
        (e.nodeType !== 1 &&
            e.nodeType !== 9 &&
            e.nodeType !== 11 &&
            (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
    );
}
function Yc() {}
function lv(e, t, n, r, i) {
    if (i) {
        if (typeof r == 'function') {
            var s = r;
            r = function () {
                var u = Ns(o);
                s.call(u);
            };
        }
        var o = Hp(t, r, e, 0, null, !1, !1, '', Yc);
        return (
            (e._reactRootContainer = o),
            (e[kt] = o.current),
            Xr(e.nodeType === 8 ? e.parentNode : e),
            mn(),
            o
        );
    }
    for (; (i = e.lastChild); ) e.removeChild(i);
    if (typeof r == 'function') {
        var a = r;
        r = function () {
            var u = Ns(l);
            a.call(u);
        };
    }
    var l = eu(e, 0, !1, null, null, !1, !1, '', Yc);
    return (
        (e._reactRootContainer = l),
        (e[kt] = l.current),
        Xr(e.nodeType === 8 ? e.parentNode : e),
        mn(function () {
            Zs(t, l, n, r);
        }),
        l
    );
}
function eo(e, t, n, r, i) {
    var s = n._reactRootContainer;
    if (s) {
        var o = s;
        if (typeof i == 'function') {
            var a = i;
            i = function () {
                var l = Ns(o);
                a.call(l);
            };
        }
        Zs(t, o, e, i);
    } else o = lv(n, t, e, i, r);
    return Ns(o);
}
wh = function (e) {
    switch (e.tag) {
        case 3:
            var t = e.stateNode;
            if (t.current.memoizedState.isDehydrated) {
                var n = kr(t.pendingLanes);
                n !== 0 && (kl(t, n | 1), Me(t, ae()), !($ & 6) && ((er = ae() + 500), Yt()));
            }
            break;
        case 13:
            (mn(function () {
                var r = Ct(e, 1);
                if (r !== null) {
                    var i = Te();
                    nt(r, e, 1, i);
                }
            }),
                tu(e, 1));
    }
};
Cl = function (e) {
    if (e.tag === 13) {
        var t = Ct(e, 134217728);
        if (t !== null) {
            var n = Te();
            nt(t, e, 134217728, n);
        }
        tu(e, 134217728);
    }
};
Sh = function (e) {
    if (e.tag === 13) {
        var t = Bt(e),
            n = Ct(e, t);
        if (n !== null) {
            var r = Te();
            nt(n, e, t, r);
        }
        tu(e, t);
    }
};
kh = function () {
    return H;
};
Ch = function (e, t) {
    var n = H;
    try {
        return ((H = e), t());
    } finally {
        H = n;
    }
};
da = function (e, t, n) {
    switch (t) {
        case 'input':
            if ((ia(e, n), (t = n.name), n.type === 'radio' && t != null)) {
                for (n = e; n.parentNode; ) n = n.parentNode;
                for (
                    n = n.querySelectorAll(
                        'input[name=' + JSON.stringify('' + t) + '][type="radio"]',
                    ),
                        t = 0;
                    t < n.length;
                    t++
                ) {
                    var r = n[t];
                    if (r !== e && r.form === e.form) {
                        var i = Hs(r);
                        if (!i) throw Error(T(90));
                        (eh(r), ia(r, i));
                    }
                }
            }
            break;
        case 'textarea':
            nh(e, n);
            break;
        case 'select':
            ((t = n.value), t != null && $n(e, !!n.multiple, t, !1));
    }
};
uh = Xl;
ch = mn;
var uv = { usingClientEntryPoint: !1, Events: [pi, Rn, Hs, ah, lh, Xl] },
    yr = {
        findFiberByHostInstance: rn,
        bundleType: 0,
        version: '18.3.1',
        rendererPackageName: 'react-dom',
    },
    cv = {
        bundleType: yr.bundleType,
        version: yr.version,
        rendererPackageName: yr.rendererPackageName,
        rendererConfig: yr.rendererConfig,
        overrideHookState: null,
        overrideHookStateDeletePath: null,
        overrideHookStateRenamePath: null,
        overrideProps: null,
        overridePropsDeletePath: null,
        overridePropsRenamePath: null,
        setErrorHandler: null,
        setSuspenseHandler: null,
        scheduleUpdate: null,
        currentDispatcherRef: Et.ReactCurrentDispatcher,
        findHostInstanceByFiber: function (e) {
            return ((e = hh(e)), e === null ? null : e.stateNode);
        },
        findFiberByHostInstance: yr.findFiberByHostInstance || av,
        findHostInstancesForRefresh: null,
        scheduleRefresh: null,
        scheduleRoot: null,
        setRefreshHandler: null,
        getCurrentFiber: null,
        reconcilerVersion: '18.3.1-next-f1338f8080-20240426',
    };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
    var _i = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!_i.isDisabled && _i.supportsFiber)
        try {
            ((zs = _i.inject(cv)), (ct = _i));
        } catch {}
}
ze.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = uv;
ze.createPortal = function (e, t) {
    var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!ru(t)) throw Error(T(200));
    return ov(e, t, null, n);
};
ze.createRoot = function (e, t) {
    if (!ru(e)) throw Error(T(299));
    var n = !1,
        r = '',
        i = Wp;
    return (
        t != null &&
            (t.unstable_strictMode === !0 && (n = !0),
            t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
            t.onRecoverableError !== void 0 && (i = t.onRecoverableError)),
        (t = eu(e, 1, !1, null, null, n, !1, r, i)),
        (e[kt] = t.current),
        Xr(e.nodeType === 8 ? e.parentNode : e),
        new nu(t)
    );
};
ze.findDOMNode = function (e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
        throw typeof e.render == 'function'
            ? Error(T(188))
            : ((e = Object.keys(e).join(',')), Error(T(268, e)));
    return ((e = hh(t)), (e = e === null ? null : e.stateNode), e);
};
ze.flushSync = function (e) {
    return mn(e);
};
ze.hydrate = function (e, t, n) {
    if (!Js(t)) throw Error(T(200));
    return eo(null, e, t, !0, n);
};
ze.hydrateRoot = function (e, t, n) {
    if (!ru(e)) throw Error(T(405));
    var r = (n != null && n.hydratedSources) || null,
        i = !1,
        s = '',
        o = Wp;
    if (
        (n != null &&
            (n.unstable_strictMode === !0 && (i = !0),
            n.identifierPrefix !== void 0 && (s = n.identifierPrefix),
            n.onRecoverableError !== void 0 && (o = n.onRecoverableError)),
        (t = Hp(t, null, e, 1, n ?? null, i, !1, s, o)),
        (e[kt] = t.current),
        Xr(e),
        r)
    )
        for (e = 0; e < r.length; e++)
            ((n = r[e]),
                (i = n._getVersion),
                (i = i(n._source)),
                t.mutableSourceEagerHydrationData == null
                    ? (t.mutableSourceEagerHydrationData = [n, i])
                    : t.mutableSourceEagerHydrationData.push(n, i));
    return new qs(t);
};
ze.render = function (e, t, n) {
    if (!Js(t)) throw Error(T(200));
    return eo(null, e, t, !1, n);
};
ze.unmountComponentAtNode = function (e) {
    if (!Js(e)) throw Error(T(40));
    return e._reactRootContainer
        ? (mn(function () {
              eo(null, null, e, !1, function () {
                  ((e._reactRootContainer = null), (e[kt] = null));
              });
          }),
          !0)
        : !1;
};
ze.unstable_batchedUpdates = Xl;
ze.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
    if (!Js(n)) throw Error(T(200));
    if (e == null || e._reactInternals === void 0) throw Error(T(38));
    return eo(e, t, n, !1, r);
};
ze.version = '18.3.1-next-f1338f8080-20240426';
function Kp() {
    if (
        !(
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
        )
    )
        try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Kp);
        } catch (e) {
            console.error(e);
        }
}
(Kp(), (Kf.exports = ze));
var dv = Kf.exports,
    Xc = dv;
((Zo.createRoot = Xc.createRoot), (Zo.hydrateRoot = Xc.hydrateRoot));
const O = (e) => typeof e == 'string',
    vr = () => {
        let e, t;
        const n = new Promise((r, i) => {
            ((e = r), (t = i));
        });
        return ((n.resolve = e), (n.reject = t), n);
    },
    Zc = (e) => (e == null ? '' : '' + e),
    fv = (e, t, n) => {
        e.forEach((r) => {
            t[r] && (n[r] = t[r]);
        });
    },
    hv = /###/g,
    qc = (e) => (e && e.indexOf('###') > -1 ? e.replace(hv, '.') : e),
    Jc = (e) => !e || O(e),
    br = (e, t, n) => {
        const r = O(t) ? t.split('.') : t;
        let i = 0;
        for (; i < r.length - 1; ) {
            if (Jc(e)) return {};
            const s = qc(r[i]);
            (!e[s] && n && (e[s] = new n()),
                Object.prototype.hasOwnProperty.call(e, s) ? (e = e[s]) : (e = {}),
                ++i);
        }
        return Jc(e) ? {} : { obj: e, k: qc(r[i]) };
    },
    ed = (e, t, n) => {
        const { obj: r, k: i } = br(e, t, Object);
        if (r !== void 0 || t.length === 1) {
            r[i] = n;
            return;
        }
        let s = t[t.length - 1],
            o = t.slice(0, t.length - 1),
            a = br(e, o, Object);
        for (; a.obj === void 0 && o.length; )
            ((s = `${o[o.length - 1]}.${s}`),
                (o = o.slice(0, o.length - 1)),
                (a = br(e, o, Object)),
                a != null && a.obj && typeof a.obj[`${a.k}.${s}`] < 'u' && (a.obj = void 0));
        a.obj[`${a.k}.${s}`] = n;
    },
    pv = (e, t, n, r) => {
        const { obj: i, k: s } = br(e, t, Object);
        ((i[s] = i[s] || []), i[s].push(n));
    },
    Ls = (e, t) => {
        const { obj: n, k: r } = br(e, t);
        if (n && Object.prototype.hasOwnProperty.call(n, r)) return n[r];
    },
    mv = (e, t, n) => {
        const r = Ls(e, n);
        return r !== void 0 ? r : Ls(t, n);
    },
    Gp = (e, t, n) => {
        for (const r in t)
            r !== '__proto__' &&
                r !== 'constructor' &&
                (r in e
                    ? O(e[r]) || e[r] instanceof String || O(t[r]) || t[r] instanceof String
                        ? n && (e[r] = t[r])
                        : Gp(e[r], t[r], n)
                    : (e[r] = t[r]));
        return e;
    },
    kn = (e) => e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
var gv = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;' };
const yv = (e) => (O(e) ? e.replace(/[&<>"'\/]/g, (t) => gv[t]) : e);
class vv {
    constructor(t) {
        ((this.capacity = t), (this.regExpMap = new Map()), (this.regExpQueue = []));
    }
    getRegExp(t) {
        const n = this.regExpMap.get(t);
        if (n !== void 0) return n;
        const r = new RegExp(t);
        return (
            this.regExpQueue.length === this.capacity &&
                this.regExpMap.delete(this.regExpQueue.shift()),
            this.regExpMap.set(t, r),
            this.regExpQueue.push(t),
            r
        );
    }
}
const xv = [' ', ',', '?', '!', ';'],
    wv = new vv(20),
    Sv = (e, t, n) => {
        ((t = t || ''), (n = n || ''));
        const r = xv.filter((o) => t.indexOf(o) < 0 && n.indexOf(o) < 0);
        if (r.length === 0) return !0;
        const i = wv.getRegExp(`(${r.map((o) => (o === '?' ? '\\?' : o)).join('|')})`);
        let s = !i.test(e);
        if (!s) {
            const o = e.indexOf(n);
            o > 0 && !i.test(e.substring(0, o)) && (s = !0);
        }
        return s;
    },
    Ha = (e, t, n = '.') => {
        if (!e) return;
        if (e[t]) return Object.prototype.hasOwnProperty.call(e, t) ? e[t] : void 0;
        const r = t.split(n);
        let i = e;
        for (let s = 0; s < r.length; ) {
            if (!i || typeof i != 'object') return;
            let o,
                a = '';
            for (let l = s; l < r.length; ++l)
                if ((l !== s && (a += n), (a += r[l]), (o = i[a]), o !== void 0)) {
                    if (['string', 'number', 'boolean'].indexOf(typeof o) > -1 && l < r.length - 1)
                        continue;
                    s += l - s + 1;
                    break;
                }
            i = o;
        }
        return i;
    },
    si = (e) => (e == null ? void 0 : e.replace('_', '-')),
    kv = {
        type: 'logger',
        log(e) {
            this.output('log', e);
        },
        warn(e) {
            this.output('warn', e);
        },
        error(e) {
            this.output('error', e);
        },
        output(e, t) {
            var n, r;
            (r = (n = console == null ? void 0 : console[e]) == null ? void 0 : n.apply) == null ||
                r.call(n, console, t);
        },
    };
class js {
    constructor(t, n = {}) {
        this.init(t, n);
    }
    init(t, n = {}) {
        ((this.prefix = n.prefix || 'i18next:'),
            (this.logger = t || kv),
            (this.options = n),
            (this.debug = n.debug));
    }
    log(...t) {
        return this.forward(t, 'log', '', !0);
    }
    warn(...t) {
        return this.forward(t, 'warn', '', !0);
    }
    error(...t) {
        return this.forward(t, 'error', '');
    }
    deprecate(...t) {
        return this.forward(t, 'warn', 'WARNING DEPRECATED: ', !0);
    }
    forward(t, n, r, i) {
        return i && !this.debug
            ? null
            : (O(t[0]) && (t[0] = `${r}${this.prefix} ${t[0]}`), this.logger[n](t));
    }
    create(t) {
        return new js(this.logger, { prefix: `${this.prefix}:${t}:`, ...this.options });
    }
    clone(t) {
        return (
            (t = t || this.options),
            (t.prefix = t.prefix || this.prefix),
            new js(this.logger, t)
        );
    }
}
var ut = new js();
class to {
    constructor() {
        this.observers = {};
    }
    on(t, n) {
        return (
            t.split(' ').forEach((r) => {
                this.observers[r] || (this.observers[r] = new Map());
                const i = this.observers[r].get(n) || 0;
                this.observers[r].set(n, i + 1);
            }),
            this
        );
    }
    off(t, n) {
        if (this.observers[t]) {
            if (!n) {
                delete this.observers[t];
                return;
            }
            this.observers[t].delete(n);
        }
    }
    emit(t, ...n) {
        (this.observers[t] &&
            Array.from(this.observers[t].entries()).forEach(([i, s]) => {
                for (let o = 0; o < s; o++) i(...n);
            }),
            this.observers['*'] &&
                Array.from(this.observers['*'].entries()).forEach(([i, s]) => {
                    for (let o = 0; o < s; o++) i.apply(i, [t, ...n]);
                }));
    }
}
class td extends to {
    constructor(t, n = { ns: ['translation'], defaultNS: 'translation' }) {
        (super(),
            (this.data = t || {}),
            (this.options = n),
            this.options.keySeparator === void 0 && (this.options.keySeparator = '.'),
            this.options.ignoreJSONStructure === void 0 && (this.options.ignoreJSONStructure = !0));
    }
    addNamespaces(t) {
        this.options.ns.indexOf(t) < 0 && this.options.ns.push(t);
    }
    removeNamespaces(t) {
        const n = this.options.ns.indexOf(t);
        n > -1 && this.options.ns.splice(n, 1);
    }
    getResource(t, n, r, i = {}) {
        var u, c;
        const s = i.keySeparator !== void 0 ? i.keySeparator : this.options.keySeparator,
            o =
                i.ignoreJSONStructure !== void 0
                    ? i.ignoreJSONStructure
                    : this.options.ignoreJSONStructure;
        let a;
        t.indexOf('.') > -1
            ? (a = t.split('.'))
            : ((a = [t, n]),
              r &&
                  (Array.isArray(r)
                      ? a.push(...r)
                      : O(r) && s
                        ? a.push(...r.split(s))
                        : a.push(r)));
        const l = Ls(this.data, a);
        return (
            !l &&
                !n &&
                !r &&
                t.indexOf('.') > -1 &&
                ((t = a[0]), (n = a[1]), (r = a.slice(2).join('.'))),
            l || !o || !O(r)
                ? l
                : Ha((c = (u = this.data) == null ? void 0 : u[t]) == null ? void 0 : c[n], r, s)
        );
    }
    addResource(t, n, r, i, s = { silent: !1 }) {
        const o = s.keySeparator !== void 0 ? s.keySeparator : this.options.keySeparator;
        let a = [t, n];
        (r && (a = a.concat(o ? r.split(o) : r)),
            t.indexOf('.') > -1 && ((a = t.split('.')), (i = n), (n = a[1])),
            this.addNamespaces(n),
            ed(this.data, a, i),
            s.silent || this.emit('added', t, n, r, i));
    }
    addResources(t, n, r, i = { silent: !1 }) {
        for (const s in r)
            (O(r[s]) || Array.isArray(r[s])) && this.addResource(t, n, s, r[s], { silent: !0 });
        i.silent || this.emit('added', t, n, r);
    }
    addResourceBundle(t, n, r, i, s, o = { silent: !1, skipCopy: !1 }) {
        let a = [t, n];
        (t.indexOf('.') > -1 && ((a = t.split('.')), (i = r), (r = n), (n = a[1])),
            this.addNamespaces(n));
        let l = Ls(this.data, a) || {};
        (o.skipCopy || (r = JSON.parse(JSON.stringify(r))),
            i ? Gp(l, r, s) : (l = { ...l, ...r }),
            ed(this.data, a, l),
            o.silent || this.emit('added', t, n, r));
    }
    removeResourceBundle(t, n) {
        (this.hasResourceBundle(t, n) && delete this.data[t][n],
            this.removeNamespaces(n),
            this.emit('removed', t, n));
    }
    hasResourceBundle(t, n) {
        return this.getResource(t, n) !== void 0;
    }
    getResourceBundle(t, n) {
        return (n || (n = this.options.defaultNS), this.getResource(t, n));
    }
    getDataByLanguage(t) {
        return this.data[t];
    }
    hasLanguageSomeTranslations(t) {
        const n = this.getDataByLanguage(t);
        return !!((n && Object.keys(n)) || []).find((i) => n[i] && Object.keys(n[i]).length > 0);
    }
    toJSON() {
        return this.data;
    }
}
var Qp = {
    processors: {},
    addPostProcessor(e) {
        this.processors[e.name] = e;
    },
    handle(e, t, n, r, i) {
        return (
            e.forEach((s) => {
                var o;
                t = ((o = this.processors[s]) == null ? void 0 : o.process(t, n, r, i)) ?? t;
            }),
            t
        );
    },
};
const Yp = Symbol('i18next/PATH_KEY');
function Cv() {
    const e = [],
        t = Object.create(null);
    let n;
    return (
        (t.get = (r, i) => {
            var s;
            return (
                (s = n == null ? void 0 : n.revoke) == null || s.call(n),
                i === Yp ? e : (e.push(i), (n = Proxy.revocable(r, t)), n.proxy)
            );
        }),
        Proxy.revocable(Object.create(null), t).proxy
    );
}
function Wa(e, t) {
    const { [Yp]: n } = e(Cv());
    return n.join((t == null ? void 0 : t.keySeparator) ?? '.');
}
const nd = {},
    Vo = (e) => !O(e) && typeof e != 'boolean' && typeof e != 'number';
class Rs extends to {
    constructor(t, n = {}) {
        (super(),
            fv(
                [
                    'resourceStore',
                    'languageUtils',
                    'pluralResolver',
                    'interpolator',
                    'backendConnector',
                    'i18nFormat',
                    'utils',
                ],
                t,
                this,
            ),
            (this.options = n),
            this.options.keySeparator === void 0 && (this.options.keySeparator = '.'),
            (this.logger = ut.create('translator')));
    }
    changeLanguage(t) {
        t && (this.language = t);
    }
    exists(t, n = { interpolation: {} }) {
        const r = { ...n };
        if (t == null) return !1;
        const i = this.resolve(t, r);
        if ((i == null ? void 0 : i.res) === void 0) return !1;
        const s = Vo(i.res);
        return !(r.returnObjects === !1 && s);
    }
    extractFromKey(t, n) {
        let r = n.nsSeparator !== void 0 ? n.nsSeparator : this.options.nsSeparator;
        r === void 0 && (r = ':');
        const i = n.keySeparator !== void 0 ? n.keySeparator : this.options.keySeparator;
        let s = n.ns || this.options.defaultNS || [];
        const o = r && t.indexOf(r) > -1,
            a =
                !this.options.userDefinedKeySeparator &&
                !n.keySeparator &&
                !this.options.userDefinedNsSeparator &&
                !n.nsSeparator &&
                !Sv(t, r, i);
        if (o && !a) {
            const l = t.match(this.interpolator.nestingRegexp);
            if (l && l.length > 0) return { key: t, namespaces: O(s) ? [s] : s };
            const u = t.split(r);
            ((r !== i || (r === i && this.options.ns.indexOf(u[0]) > -1)) && (s = u.shift()),
                (t = u.join(i)));
        }
        return { key: t, namespaces: O(s) ? [s] : s };
    }
    translate(t, n, r) {
        let i = typeof n == 'object' ? { ...n } : n;
        if (
            (typeof i != 'object' &&
                this.options.overloadTranslationOptionHandler &&
                (i = this.options.overloadTranslationOptionHandler(arguments)),
            typeof i == 'object' && (i = { ...i }),
            i || (i = {}),
            t == null)
        )
            return '';
        (typeof t == 'function' && (t = Wa(t, { ...this.options, ...i })),
            Array.isArray(t) || (t = [String(t)]));
        const s = i.returnDetails !== void 0 ? i.returnDetails : this.options.returnDetails,
            o = i.keySeparator !== void 0 ? i.keySeparator : this.options.keySeparator,
            { key: a, namespaces: l } = this.extractFromKey(t[t.length - 1], i),
            u = l[l.length - 1];
        let c = i.nsSeparator !== void 0 ? i.nsSeparator : this.options.nsSeparator;
        c === void 0 && (c = ':');
        const d = i.lng || this.language,
            f = i.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
        if ((d == null ? void 0 : d.toLowerCase()) === 'cimode')
            return f
                ? s
                    ? {
                          res: `${u}${c}${a}`,
                          usedKey: a,
                          exactUsedKey: a,
                          usedLng: d,
                          usedNS: u,
                          usedParams: this.getUsedParamsDetails(i),
                      }
                    : `${u}${c}${a}`
                : s
                  ? {
                        res: a,
                        usedKey: a,
                        exactUsedKey: a,
                        usedLng: d,
                        usedNS: u,
                        usedParams: this.getUsedParamsDetails(i),
                    }
                  : a;
        const m = this.resolve(t, i);
        let v = m == null ? void 0 : m.res;
        const x = (m == null ? void 0 : m.usedKey) || a,
            k = (m == null ? void 0 : m.exactUsedKey) || a,
            p = ['[object Number]', '[object Function]', '[object RegExp]'],
            h = i.joinArrays !== void 0 ? i.joinArrays : this.options.joinArrays,
            y = !this.i18nFormat || this.i18nFormat.handleAsObject,
            w = i.count !== void 0 && !O(i.count),
            S = Rs.hasDefaultValue(i),
            P = w ? this.pluralResolver.getSuffix(d, i.count, i) : '',
            E = i.ordinal && w ? this.pluralResolver.getSuffix(d, i.count, { ordinal: !1 }) : '',
            C = w && !i.ordinal && i.count === 0,
            A =
                (C && i[`defaultValue${this.options.pluralSeparator}zero`]) ||
                i[`defaultValue${P}`] ||
                i[`defaultValue${E}`] ||
                i.defaultValue;
        let j = v;
        y && !v && S && (j = A);
        const Z = Vo(j),
            z = Object.prototype.toString.apply(j);
        if (y && j && Z && p.indexOf(z) < 0 && !(O(h) && Array.isArray(j))) {
            if (!i.returnObjects && !this.options.returnObjects) {
                this.options.returnedObjectHandler ||
                    this.logger.warn(
                        'accessing an object - but returnObjects options is not enabled!',
                    );
                const b = this.options.returnedObjectHandler
                    ? this.options.returnedObjectHandler(x, j, { ...i, ns: l })
                    : `key '${a} (${this.language})' returned an object instead of string.`;
                return s ? ((m.res = b), (m.usedParams = this.getUsedParamsDetails(i)), m) : b;
            }
            if (o) {
                const b = Array.isArray(j),
                    I = b ? [] : {},
                    q = b ? k : x;
                for (const le in j)
                    if (Object.prototype.hasOwnProperty.call(j, le)) {
                        const U = `${q}${o}${le}`;
                        (S && !v
                            ? (I[le] = this.translate(U, {
                                  ...i,
                                  defaultValue: Vo(A) ? A[le] : void 0,
                                  joinArrays: !1,
                                  ns: l,
                              }))
                            : (I[le] = this.translate(U, { ...i, joinArrays: !1, ns: l })),
                            I[le] === U && (I[le] = j[le]));
                    }
                v = I;
            }
        } else if (y && O(h) && Array.isArray(v))
            ((v = v.join(h)), v && (v = this.extendTranslation(v, t, i, r)));
        else {
            let b = !1,
                I = !1;
            (!this.isValidLookup(v) && S && ((b = !0), (v = A)),
                this.isValidLookup(v) || ((I = !0), (v = a)));
            const le =
                    (i.missingKeyNoValueFallbackToKey ||
                        this.options.missingKeyNoValueFallbackToKey) &&
                    I
                        ? void 0
                        : v,
                U = S && A !== v && this.options.updateMissing;
            if (I || b || U) {
                if ((this.logger.log(U ? 'updateKey' : 'missingKey', d, u, a, U ? A : v), o)) {
                    const B = this.resolve(a, { ...i, keySeparator: !1 });
                    B &&
                        B.res &&
                        this.logger.warn(
                            'Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.',
                        );
                }
                let N = [];
                const D = this.languageUtils.getFallbackCodes(
                    this.options.fallbackLng,
                    i.lng || this.language,
                );
                if (this.options.saveMissingTo === 'fallback' && D && D[0])
                    for (let B = 0; B < D.length; B++) N.push(D[B]);
                else
                    this.options.saveMissingTo === 'all'
                        ? (N = this.languageUtils.toResolveHierarchy(i.lng || this.language))
                        : N.push(i.lng || this.language);
                const V = (B, W, it) => {
                    var wn;
                    const st = S && it !== v ? it : le;
                    (this.options.missingKeyHandler
                        ? this.options.missingKeyHandler(B, u, W, st, U, i)
                        : (wn = this.backendConnector) != null &&
                          wn.saveMissing &&
                          this.backendConnector.saveMissing(B, u, W, st, U, i),
                        this.emit('missingKey', B, u, W, v));
                };
                this.options.saveMissing &&
                    (this.options.saveMissingPlurals && w
                        ? N.forEach((B) => {
                              const W = this.pluralResolver.getSuffixes(B, i);
                              (C &&
                                  i[`defaultValue${this.options.pluralSeparator}zero`] &&
                                  W.indexOf(`${this.options.pluralSeparator}zero`) < 0 &&
                                  W.push(`${this.options.pluralSeparator}zero`),
                                  W.forEach((it) => {
                                      V([B], a + it, i[`defaultValue${it}`] || A);
                                  }));
                          })
                        : V(N, a, A));
            }
            ((v = this.extendTranslation(v, t, i, m, r)),
                I && v === a && this.options.appendNamespaceToMissingKey && (v = `${u}${c}${a}`),
                (I || b) &&
                    this.options.parseMissingKeyHandler &&
                    (v = this.options.parseMissingKeyHandler(
                        this.options.appendNamespaceToMissingKey ? `${u}${c}${a}` : a,
                        b ? v : void 0,
                        i,
                    )));
        }
        return s ? ((m.res = v), (m.usedParams = this.getUsedParamsDetails(i)), m) : v;
    }
    extendTranslation(t, n, r, i, s) {
        var l, u;
        if ((l = this.i18nFormat) != null && l.parse)
            t = this.i18nFormat.parse(
                t,
                { ...this.options.interpolation.defaultVariables, ...r },
                r.lng || this.language || i.usedLng,
                i.usedNS,
                i.usedKey,
                { resolved: i },
            );
        else if (!r.skipInterpolation) {
            r.interpolation &&
                this.interpolator.init({
                    ...r,
                    interpolation: { ...this.options.interpolation, ...r.interpolation },
                });
            const c =
                O(t) &&
                (((u = r == null ? void 0 : r.interpolation) == null
                    ? void 0
                    : u.skipOnVariables) !== void 0
                    ? r.interpolation.skipOnVariables
                    : this.options.interpolation.skipOnVariables);
            let d;
            if (c) {
                const m = t.match(this.interpolator.nestingRegexp);
                d = m && m.length;
            }
            let f = r.replace && !O(r.replace) ? r.replace : r;
            if (
                (this.options.interpolation.defaultVariables &&
                    (f = { ...this.options.interpolation.defaultVariables, ...f }),
                (t = this.interpolator.interpolate(t, f, r.lng || this.language || i.usedLng, r)),
                c)
            ) {
                const m = t.match(this.interpolator.nestingRegexp),
                    v = m && m.length;
                d < v && (r.nest = !1);
            }
            (!r.lng && i && i.res && (r.lng = this.language || i.usedLng),
                r.nest !== !1 &&
                    (t = this.interpolator.nest(
                        t,
                        (...m) =>
                            (s == null ? void 0 : s[0]) === m[0] && !r.context
                                ? (this.logger.warn(
                                      `It seems you are nesting recursively key: ${m[0]} in key: ${n[0]}`,
                                  ),
                                  null)
                                : this.translate(...m, n),
                        r,
                    )),
                r.interpolation && this.interpolator.reset());
        }
        const o = r.postProcess || this.options.postProcess,
            a = O(o) ? [o] : o;
        return (
            t != null &&
                a != null &&
                a.length &&
                r.applyPostProcessor !== !1 &&
                (t = Qp.handle(
                    a,
                    t,
                    n,
                    this.options && this.options.postProcessPassResolved
                        ? { i18nResolved: { ...i, usedParams: this.getUsedParamsDetails(r) }, ...r }
                        : r,
                    this,
                )),
            t
        );
    }
    resolve(t, n = {}) {
        let r, i, s, o, a;
        return (
            O(t) && (t = [t]),
            t.forEach((l) => {
                if (this.isValidLookup(r)) return;
                const u = this.extractFromKey(l, n),
                    c = u.key;
                i = c;
                let d = u.namespaces;
                this.options.fallbackNS && (d = d.concat(this.options.fallbackNS));
                const f = n.count !== void 0 && !O(n.count),
                    m = f && !n.ordinal && n.count === 0,
                    v =
                        n.context !== void 0 &&
                        (O(n.context) || typeof n.context == 'number') &&
                        n.context !== '',
                    x = n.lngs
                        ? n.lngs
                        : this.languageUtils.toResolveHierarchy(
                              n.lng || this.language,
                              n.fallbackLng,
                          );
                d.forEach((k) => {
                    var p, h;
                    this.isValidLookup(r) ||
                        ((a = k),
                        !nd[`${x[0]}-${k}`] &&
                            (p = this.utils) != null &&
                            p.hasLoadedNamespace &&
                            !((h = this.utils) != null && h.hasLoadedNamespace(a)) &&
                            ((nd[`${x[0]}-${k}`] = !0),
                            this.logger.warn(
                                `key "${i}" for languages "${x.join(', ')}" won't get resolved as namespace "${a}" was not yet loaded`,
                                'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!',
                            )),
                        x.forEach((y) => {
                            var P;
                            if (this.isValidLookup(r)) return;
                            o = y;
                            const w = [c];
                            if ((P = this.i18nFormat) != null && P.addLookupKeys)
                                this.i18nFormat.addLookupKeys(w, c, y, k, n);
                            else {
                                let E;
                                f && (E = this.pluralResolver.getSuffix(y, n.count, n));
                                const C = `${this.options.pluralSeparator}zero`,
                                    A = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                                if (
                                    (f &&
                                        (n.ordinal &&
                                            E.indexOf(A) === 0 &&
                                            w.push(c + E.replace(A, this.options.pluralSeparator)),
                                        w.push(c + E),
                                        m && w.push(c + C)),
                                    v)
                                ) {
                                    const j = `${c}${this.options.contextSeparator || '_'}${n.context}`;
                                    (w.push(j),
                                        f &&
                                            (n.ordinal &&
                                                E.indexOf(A) === 0 &&
                                                w.push(
                                                    j + E.replace(A, this.options.pluralSeparator),
                                                ),
                                            w.push(j + E),
                                            m && w.push(j + C)));
                                }
                            }
                            let S;
                            for (; (S = w.pop()); )
                                this.isValidLookup(r) ||
                                    ((s = S), (r = this.getResource(y, k, S, n)));
                        }));
                });
            }),
            { res: r, usedKey: i, exactUsedKey: s, usedLng: o, usedNS: a }
        );
    }
    isValidLookup(t) {
        return (
            t !== void 0 &&
            !(!this.options.returnNull && t === null) &&
            !(!this.options.returnEmptyString && t === '')
        );
    }
    getResource(t, n, r, i = {}) {
        var s;
        return (s = this.i18nFormat) != null && s.getResource
            ? this.i18nFormat.getResource(t, n, r, i)
            : this.resourceStore.getResource(t, n, r, i);
    }
    getUsedParamsDetails(t = {}) {
        const n = [
                'defaultValue',
                'ordinal',
                'context',
                'replace',
                'lng',
                'lngs',
                'fallbackLng',
                'ns',
                'keySeparator',
                'nsSeparator',
                'returnObjects',
                'returnDetails',
                'joinArrays',
                'postProcess',
                'interpolation',
            ],
            r = t.replace && !O(t.replace);
        let i = r ? t.replace : t;
        if (
            (r && typeof t.count < 'u' && (i.count = t.count),
            this.options.interpolation.defaultVariables &&
                (i = { ...this.options.interpolation.defaultVariables, ...i }),
            !r)
        ) {
            i = { ...i };
            for (const s of n) delete i[s];
        }
        return i;
    }
    static hasDefaultValue(t) {
        const n = 'defaultValue';
        for (const r in t)
            if (
                Object.prototype.hasOwnProperty.call(t, r) &&
                n === r.substring(0, n.length) &&
                t[r] !== void 0
            )
                return !0;
        return !1;
    }
}
class rd {
    constructor(t) {
        ((this.options = t),
            (this.supportedLngs = this.options.supportedLngs || !1),
            (this.logger = ut.create('languageUtils')));
    }
    getScriptPartFromCode(t) {
        if (((t = si(t)), !t || t.indexOf('-') < 0)) return null;
        const n = t.split('-');
        return n.length === 2 || (n.pop(), n[n.length - 1].toLowerCase() === 'x')
            ? null
            : this.formatLanguageCode(n.join('-'));
    }
    getLanguagePartFromCode(t) {
        if (((t = si(t)), !t || t.indexOf('-') < 0)) return t;
        const n = t.split('-');
        return this.formatLanguageCode(n[0]);
    }
    formatLanguageCode(t) {
        if (O(t) && t.indexOf('-') > -1) {
            let n;
            try {
                n = Intl.getCanonicalLocales(t)[0];
            } catch {}
            return (
                n && this.options.lowerCaseLng && (n = n.toLowerCase()),
                n || (this.options.lowerCaseLng ? t.toLowerCase() : t)
            );
        }
        return this.options.cleanCode || this.options.lowerCaseLng ? t.toLowerCase() : t;
    }
    isSupportedCode(t) {
        return (
            (this.options.load === 'languageOnly' || this.options.nonExplicitSupportedLngs) &&
                (t = this.getLanguagePartFromCode(t)),
            !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(t) > -1
        );
    }
    getBestMatchFromCodes(t) {
        if (!t) return null;
        let n;
        return (
            t.forEach((r) => {
                if (n) return;
                const i = this.formatLanguageCode(r);
                (!this.options.supportedLngs || this.isSupportedCode(i)) && (n = i);
            }),
            !n &&
                this.options.supportedLngs &&
                t.forEach((r) => {
                    if (n) return;
                    const i = this.getScriptPartFromCode(r);
                    if (this.isSupportedCode(i)) return (n = i);
                    const s = this.getLanguagePartFromCode(r);
                    if (this.isSupportedCode(s)) return (n = s);
                    n = this.options.supportedLngs.find((o) => {
                        if (o === s) return o;
                        if (
                            !(o.indexOf('-') < 0 && s.indexOf('-') < 0) &&
                            ((o.indexOf('-') > 0 &&
                                s.indexOf('-') < 0 &&
                                o.substring(0, o.indexOf('-')) === s) ||
                                (o.indexOf(s) === 0 && s.length > 1))
                        )
                            return o;
                    });
                }),
            n || (n = this.getFallbackCodes(this.options.fallbackLng)[0]),
            n
        );
    }
    getFallbackCodes(t, n) {
        if (!t) return [];
        if ((typeof t == 'function' && (t = t(n)), O(t) && (t = [t]), Array.isArray(t))) return t;
        if (!n) return t.default || [];
        let r = t[n];
        return (
            r || (r = t[this.getScriptPartFromCode(n)]),
            r || (r = t[this.formatLanguageCode(n)]),
            r || (r = t[this.getLanguagePartFromCode(n)]),
            r || (r = t.default),
            r || []
        );
    }
    toResolveHierarchy(t, n) {
        const r = this.getFallbackCodes((n === !1 ? [] : n) || this.options.fallbackLng || [], t),
            i = [],
            s = (o) => {
                o &&
                    (this.isSupportedCode(o)
                        ? i.push(o)
                        : this.logger.warn(
                              `rejecting language code not found in supportedLngs: ${o}`,
                          ));
            };
        return (
            O(t) && (t.indexOf('-') > -1 || t.indexOf('_') > -1)
                ? (this.options.load !== 'languageOnly' && s(this.formatLanguageCode(t)),
                  this.options.load !== 'languageOnly' &&
                      this.options.load !== 'currentOnly' &&
                      s(this.getScriptPartFromCode(t)),
                  this.options.load !== 'currentOnly' && s(this.getLanguagePartFromCode(t)))
                : O(t) && s(this.formatLanguageCode(t)),
            r.forEach((o) => {
                i.indexOf(o) < 0 && s(this.formatLanguageCode(o));
            }),
            i
        );
    }
}
const id = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 },
    sd = {
        select: (e) => (e === 1 ? 'one' : 'other'),
        resolvedOptions: () => ({ pluralCategories: ['one', 'other'] }),
    };
class Pv {
    constructor(t, n = {}) {
        ((this.languageUtils = t),
            (this.options = n),
            (this.logger = ut.create('pluralResolver')),
            (this.pluralRulesCache = {}));
    }
    addRule(t, n) {
        this.rules[t] = n;
    }
    clearCache() {
        this.pluralRulesCache = {};
    }
    getRule(t, n = {}) {
        const r = si(t === 'dev' ? 'en' : t),
            i = n.ordinal ? 'ordinal' : 'cardinal',
            s = JSON.stringify({ cleanedCode: r, type: i });
        if (s in this.pluralRulesCache) return this.pluralRulesCache[s];
        let o;
        try {
            o = new Intl.PluralRules(r, { type: i });
        } catch {
            if (!Intl)
                return (this.logger.error('No Intl support, please use an Intl polyfill!'), sd);
            if (!t.match(/-|_/)) return sd;
            const l = this.languageUtils.getLanguagePartFromCode(t);
            o = this.getRule(l, n);
        }
        return ((this.pluralRulesCache[s] = o), o);
    }
    needsPlural(t, n = {}) {
        let r = this.getRule(t, n);
        return (
            r || (r = this.getRule('dev', n)),
            (r == null ? void 0 : r.resolvedOptions().pluralCategories.length) > 1
        );
    }
    getPluralFormsOfKey(t, n, r = {}) {
        return this.getSuffixes(t, r).map((i) => `${n}${i}`);
    }
    getSuffixes(t, n = {}) {
        let r = this.getRule(t, n);
        return (
            r || (r = this.getRule('dev', n)),
            r
                ? r
                      .resolvedOptions()
                      .pluralCategories.sort((i, s) => id[i] - id[s])
                      .map(
                          (i) =>
                              `${this.options.prepend}${n.ordinal ? `ordinal${this.options.prepend}` : ''}${i}`,
                      )
                : []
        );
    }
    getSuffix(t, n, r = {}) {
        const i = this.getRule(t, r);
        return i
            ? `${this.options.prepend}${r.ordinal ? `ordinal${this.options.prepend}` : ''}${i.select(n)}`
            : (this.logger.warn(`no plural rule found for: ${t}`), this.getSuffix('dev', n, r));
    }
}
const od = (e, t, n, r = '.', i = !0) => {
        let s = mv(e, t, n);
        return (!s && i && O(n) && ((s = Ha(e, n, r)), s === void 0 && (s = Ha(t, n, r))), s);
    },
    bo = (e) => e.replace(/\$/g, '$$$$');
class ad {
    constructor(t = {}) {
        var n;
        ((this.logger = ut.create('interpolator')),
            (this.options = t),
            (this.format =
                ((n = t == null ? void 0 : t.interpolation) == null ? void 0 : n.format) ||
                ((r) => r)),
            this.init(t));
    }
    init(t = {}) {
        t.interpolation || (t.interpolation = { escapeValue: !0 });
        const {
            escape: n,
            escapeValue: r,
            useRawValueToEscape: i,
            prefix: s,
            prefixEscaped: o,
            suffix: a,
            suffixEscaped: l,
            formatSeparator: u,
            unescapeSuffix: c,
            unescapePrefix: d,
            nestingPrefix: f,
            nestingPrefixEscaped: m,
            nestingSuffix: v,
            nestingSuffixEscaped: x,
            nestingOptionsSeparator: k,
            maxReplaces: p,
            alwaysFormat: h,
        } = t.interpolation;
        ((this.escape = n !== void 0 ? n : yv),
            (this.escapeValue = r !== void 0 ? r : !0),
            (this.useRawValueToEscape = i !== void 0 ? i : !1),
            (this.prefix = s ? kn(s) : o || '{{'),
            (this.suffix = a ? kn(a) : l || '}}'),
            (this.formatSeparator = u || ','),
            (this.unescapePrefix = c ? '' : d || '-'),
            (this.unescapeSuffix = this.unescapePrefix ? '' : c || ''),
            (this.nestingPrefix = f ? kn(f) : m || kn('$t(')),
            (this.nestingSuffix = v ? kn(v) : x || kn(')')),
            (this.nestingOptionsSeparator = k || ','),
            (this.maxReplaces = p || 1e3),
            (this.alwaysFormat = h !== void 0 ? h : !1),
            this.resetRegExp());
    }
    reset() {
        this.options && this.init(this.options);
    }
    resetRegExp() {
        const t = (n, r) =>
            (n == null ? void 0 : n.source) === r ? ((n.lastIndex = 0), n) : new RegExp(r, 'g');
        ((this.regexp = t(this.regexp, `${this.prefix}(.+?)${this.suffix}`)),
            (this.regexpUnescape = t(
                this.regexpUnescape,
                `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`,
            )),
            (this.nestingRegexp = t(
                this.nestingRegexp,
                `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`,
            )));
    }
    interpolate(t, n, r, i) {
        var m;
        let s, o, a;
        const l =
                (this.options &&
                    this.options.interpolation &&
                    this.options.interpolation.defaultVariables) ||
                {},
            u = (v) => {
                if (v.indexOf(this.formatSeparator) < 0) {
                    const h = od(
                        n,
                        l,
                        v,
                        this.options.keySeparator,
                        this.options.ignoreJSONStructure,
                    );
                    return this.alwaysFormat
                        ? this.format(h, void 0, r, { ...i, ...n, interpolationkey: v })
                        : h;
                }
                const x = v.split(this.formatSeparator),
                    k = x.shift().trim(),
                    p = x.join(this.formatSeparator).trim();
                return this.format(
                    od(n, l, k, this.options.keySeparator, this.options.ignoreJSONStructure),
                    p,
                    r,
                    { ...i, ...n, interpolationkey: k },
                );
            };
        this.resetRegExp();
        const c =
                (i == null ? void 0 : i.missingInterpolationHandler) ||
                this.options.missingInterpolationHandler,
            d =
                ((m = i == null ? void 0 : i.interpolation) == null
                    ? void 0
                    : m.skipOnVariables) !== void 0
                    ? i.interpolation.skipOnVariables
                    : this.options.interpolation.skipOnVariables;
        return (
            [
                { regex: this.regexpUnescape, safeValue: (v) => bo(v) },
                {
                    regex: this.regexp,
                    safeValue: (v) => (this.escapeValue ? bo(this.escape(v)) : bo(v)),
                },
            ].forEach((v) => {
                for (a = 0; (s = v.regex.exec(t)); ) {
                    const x = s[1].trim();
                    if (((o = u(x)), o === void 0))
                        if (typeof c == 'function') {
                            const p = c(t, s, i);
                            o = O(p) ? p : '';
                        } else if (i && Object.prototype.hasOwnProperty.call(i, x)) o = '';
                        else if (d) {
                            o = s[0];
                            continue;
                        } else
                            (this.logger.warn(
                                `missed to pass in variable ${x} for interpolating ${t}`,
                            ),
                                (o = ''));
                    else !O(o) && !this.useRawValueToEscape && (o = Zc(o));
                    const k = v.safeValue(o);
                    if (
                        ((t = t.replace(s[0], k)),
                        d
                            ? ((v.regex.lastIndex += o.length), (v.regex.lastIndex -= s[0].length))
                            : (v.regex.lastIndex = 0),
                        a++,
                        a >= this.maxReplaces)
                    )
                        break;
                }
            }),
            t
        );
    }
    nest(t, n, r = {}) {
        let i, s, o;
        const a = (l, u) => {
            const c = this.nestingOptionsSeparator;
            if (l.indexOf(c) < 0) return l;
            const d = l.split(new RegExp(`${c}[ ]*{`));
            let f = `{${d[1]}`;
            ((l = d[0]), (f = this.interpolate(f, o)));
            const m = f.match(/'/g),
                v = f.match(/"/g);
            ((((m == null ? void 0 : m.length) ?? 0) % 2 === 0 && !v) || v.length % 2 !== 0) &&
                (f = f.replace(/'/g, '"'));
            try {
                ((o = JSON.parse(f)), u && (o = { ...u, ...o }));
            } catch (x) {
                return (
                    this.logger.warn(`failed parsing options string in nesting for key ${l}`, x),
                    `${l}${c}${f}`
                );
            }
            return (
                o.defaultValue && o.defaultValue.indexOf(this.prefix) > -1 && delete o.defaultValue,
                l
            );
        };
        for (; (i = this.nestingRegexp.exec(t)); ) {
            let l = [];
            ((o = { ...r }),
                (o = o.replace && !O(o.replace) ? o.replace : o),
                (o.applyPostProcessor = !1),
                delete o.defaultValue);
            const u = /{.*}/.test(i[1])
                ? i[1].lastIndexOf('}') + 1
                : i[1].indexOf(this.formatSeparator);
            if (
                (u !== -1 &&
                    ((l = i[1]
                        .slice(u)
                        .split(this.formatSeparator)
                        .map((c) => c.trim())
                        .filter(Boolean)),
                    (i[1] = i[1].slice(0, u))),
                (s = n(a.call(this, i[1].trim(), o), o)),
                s && i[0] === t && !O(s))
            )
                return s;
            (O(s) || (s = Zc(s)),
                s || (this.logger.warn(`missed to resolve ${i[1]} for nesting ${t}`), (s = '')),
                l.length &&
                    (s = l.reduce(
                        (c, d) => this.format(c, d, r.lng, { ...r, interpolationkey: i[1].trim() }),
                        s.trim(),
                    )),
                (t = t.replace(i[0], s)),
                (this.regexp.lastIndex = 0));
        }
        return t;
    }
}
const Tv = (e) => {
        let t = e.toLowerCase().trim();
        const n = {};
        if (e.indexOf('(') > -1) {
            const r = e.split('(');
            t = r[0].toLowerCase().trim();
            const i = r[1].substring(0, r[1].length - 1);
            t === 'currency' && i.indexOf(':') < 0
                ? n.currency || (n.currency = i.trim())
                : t === 'relativetime' && i.indexOf(':') < 0
                  ? n.range || (n.range = i.trim())
                  : i.split(';').forEach((o) => {
                        if (o) {
                            const [a, ...l] = o.split(':'),
                                u = l
                                    .join(':')
                                    .trim()
                                    .replace(/^'+|'+$/g, ''),
                                c = a.trim();
                            (n[c] || (n[c] = u),
                                u === 'false' && (n[c] = !1),
                                u === 'true' && (n[c] = !0),
                                isNaN(u) || (n[c] = parseInt(u, 10)));
                        }
                    });
        }
        return { formatName: t, formatOptions: n };
    },
    ld = (e) => {
        const t = {};
        return (n, r, i) => {
            let s = i;
            i &&
                i.interpolationkey &&
                i.formatParams &&
                i.formatParams[i.interpolationkey] &&
                i[i.interpolationkey] &&
                (s = { ...s, [i.interpolationkey]: void 0 });
            const o = r + JSON.stringify(s);
            let a = t[o];
            return (a || ((a = e(si(r), i)), (t[o] = a)), a(n));
        };
    },
    Ev = (e) => (t, n, r) => e(si(n), r)(t);
class Nv {
    constructor(t = {}) {
        ((this.logger = ut.create('formatter')), (this.options = t), this.init(t));
    }
    init(t, n = { interpolation: {} }) {
        this.formatSeparator = n.interpolation.formatSeparator || ',';
        const r = n.cacheInBuiltFormats ? ld : Ev;
        this.formats = {
            number: r((i, s) => {
                const o = new Intl.NumberFormat(i, { ...s });
                return (a) => o.format(a);
            }),
            currency: r((i, s) => {
                const o = new Intl.NumberFormat(i, { ...s, style: 'currency' });
                return (a) => o.format(a);
            }),
            datetime: r((i, s) => {
                const o = new Intl.DateTimeFormat(i, { ...s });
                return (a) => o.format(a);
            }),
            relativetime: r((i, s) => {
                const o = new Intl.RelativeTimeFormat(i, { ...s });
                return (a) => o.format(a, s.range || 'day');
            }),
            list: r((i, s) => {
                const o = new Intl.ListFormat(i, { ...s });
                return (a) => o.format(a);
            }),
        };
    }
    add(t, n) {
        this.formats[t.toLowerCase().trim()] = n;
    }
    addCached(t, n) {
        this.formats[t.toLowerCase().trim()] = ld(n);
    }
    format(t, n, r, i = {}) {
        const s = n.split(this.formatSeparator);
        if (
            s.length > 1 &&
            s[0].indexOf('(') > 1 &&
            s[0].indexOf(')') < 0 &&
            s.find((a) => a.indexOf(')') > -1)
        ) {
            const a = s.findIndex((l) => l.indexOf(')') > -1);
            s[0] = [s[0], ...s.splice(1, a)].join(this.formatSeparator);
        }
        return s.reduce((a, l) => {
            var d;
            const { formatName: u, formatOptions: c } = Tv(l);
            if (this.formats[u]) {
                let f = a;
                try {
                    const m =
                            ((d = i == null ? void 0 : i.formatParams) == null
                                ? void 0
                                : d[i.interpolationkey]) || {},
                        v = m.locale || m.lng || i.locale || i.lng || r;
                    f = this.formats[u](a, v, { ...c, ...i, ...m });
                } catch (m) {
                    this.logger.warn(m);
                }
                return f;
            } else this.logger.warn(`there was no format function for ${u}`);
            return a;
        }, t);
    }
}
const Lv = (e, t) => {
    e.pending[t] !== void 0 && (delete e.pending[t], e.pendingCount--);
};
class jv extends to {
    constructor(t, n, r, i = {}) {
        var s, o;
        (super(),
            (this.backend = t),
            (this.store = n),
            (this.services = r),
            (this.languageUtils = r.languageUtils),
            (this.options = i),
            (this.logger = ut.create('backendConnector')),
            (this.waitingReads = []),
            (this.maxParallelReads = i.maxParallelReads || 10),
            (this.readingCalls = 0),
            (this.maxRetries = i.maxRetries >= 0 ? i.maxRetries : 5),
            (this.retryTimeout = i.retryTimeout >= 1 ? i.retryTimeout : 350),
            (this.state = {}),
            (this.queue = []),
            (o = (s = this.backend) == null ? void 0 : s.init) == null ||
                o.call(s, r, i.backend, i));
    }
    queueLoad(t, n, r, i) {
        const s = {},
            o = {},
            a = {},
            l = {};
        return (
            t.forEach((u) => {
                let c = !0;
                (n.forEach((d) => {
                    const f = `${u}|${d}`;
                    !r.reload && this.store.hasResourceBundle(u, d)
                        ? (this.state[f] = 2)
                        : this.state[f] < 0 ||
                          (this.state[f] === 1
                              ? o[f] === void 0 && (o[f] = !0)
                              : ((this.state[f] = 1),
                                (c = !1),
                                o[f] === void 0 && (o[f] = !0),
                                s[f] === void 0 && (s[f] = !0),
                                l[d] === void 0 && (l[d] = !0)));
                }),
                    c || (a[u] = !0));
            }),
            (Object.keys(s).length || Object.keys(o).length) &&
                this.queue.push({
                    pending: o,
                    pendingCount: Object.keys(o).length,
                    loaded: {},
                    errors: [],
                    callback: i,
                }),
            {
                toLoad: Object.keys(s),
                pending: Object.keys(o),
                toLoadLanguages: Object.keys(a),
                toLoadNamespaces: Object.keys(l),
            }
        );
    }
    loaded(t, n, r) {
        const i = t.split('|'),
            s = i[0],
            o = i[1];
        (n && this.emit('failedLoading', s, o, n),
            !n && r && this.store.addResourceBundle(s, o, r, void 0, void 0, { skipCopy: !0 }),
            (this.state[t] = n ? -1 : 2),
            n && r && (this.state[t] = 0));
        const a = {};
        (this.queue.forEach((l) => {
            (pv(l.loaded, [s], o),
                Lv(l, t),
                n && l.errors.push(n),
                l.pendingCount === 0 &&
                    !l.done &&
                    (Object.keys(l.loaded).forEach((u) => {
                        a[u] || (a[u] = {});
                        const c = l.loaded[u];
                        c.length &&
                            c.forEach((d) => {
                                a[u][d] === void 0 && (a[u][d] = !0);
                            });
                    }),
                    (l.done = !0),
                    l.errors.length ? l.callback(l.errors) : l.callback()));
        }),
            this.emit('loaded', a),
            (this.queue = this.queue.filter((l) => !l.done)));
    }
    read(t, n, r, i = 0, s = this.retryTimeout, o) {
        if (!t.length) return o(null, {});
        if (this.readingCalls >= this.maxParallelReads) {
            this.waitingReads.push({ lng: t, ns: n, fcName: r, tried: i, wait: s, callback: o });
            return;
        }
        this.readingCalls++;
        const a = (u, c) => {
                if ((this.readingCalls--, this.waitingReads.length > 0)) {
                    const d = this.waitingReads.shift();
                    this.read(d.lng, d.ns, d.fcName, d.tried, d.wait, d.callback);
                }
                if (u && c && i < this.maxRetries) {
                    setTimeout(() => {
                        this.read.call(this, t, n, r, i + 1, s * 2, o);
                    }, s);
                    return;
                }
                o(u, c);
            },
            l = this.backend[r].bind(this.backend);
        if (l.length === 2) {
            try {
                const u = l(t, n);
                u && typeof u.then == 'function' ? u.then((c) => a(null, c)).catch(a) : a(null, u);
            } catch (u) {
                a(u);
            }
            return;
        }
        return l(t, n, a);
    }
    prepareLoading(t, n, r = {}, i) {
        if (!this.backend)
            return (
                this.logger.warn('No backend was added via i18next.use. Will not load resources.'),
                i && i()
            );
        (O(t) && (t = this.languageUtils.toResolveHierarchy(t)), O(n) && (n = [n]));
        const s = this.queueLoad(t, n, r, i);
        if (!s.toLoad.length) return (s.pending.length || i(), null);
        s.toLoad.forEach((o) => {
            this.loadOne(o);
        });
    }
    load(t, n, r) {
        this.prepareLoading(t, n, {}, r);
    }
    reload(t, n, r) {
        this.prepareLoading(t, n, { reload: !0 }, r);
    }
    loadOne(t, n = '') {
        const r = t.split('|'),
            i = r[0],
            s = r[1];
        this.read(i, s, 'read', void 0, void 0, (o, a) => {
            (o && this.logger.warn(`${n}loading namespace ${s} for language ${i} failed`, o),
                !o && a && this.logger.log(`${n}loaded namespace ${s} for language ${i}`, a),
                this.loaded(t, o, a));
        });
    }
    saveMissing(t, n, r, i, s, o = {}, a = () => {}) {
        var l, u, c, d, f;
        if (
            (u = (l = this.services) == null ? void 0 : l.utils) != null &&
            u.hasLoadedNamespace &&
            !(
                (d = (c = this.services) == null ? void 0 : c.utils) != null &&
                d.hasLoadedNamespace(n)
            )
        ) {
            this.logger.warn(
                `did not save key "${r}" as the namespace "${n}" was not yet loaded`,
                'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!',
            );
            return;
        }
        if (!(r == null || r === '')) {
            if ((f = this.backend) != null && f.create) {
                const m = { ...o, isUpdate: s },
                    v = this.backend.create.bind(this.backend);
                if (v.length < 6)
                    try {
                        let x;
                        (v.length === 5 ? (x = v(t, n, r, i, m)) : (x = v(t, n, r, i)),
                            x && typeof x.then == 'function'
                                ? x.then((k) => a(null, k)).catch(a)
                                : a(null, x));
                    } catch (x) {
                        a(x);
                    }
                else v(t, n, r, i, a, m);
            }
            !t || !t[0] || this.store.addResource(t[0], n, r, i);
        }
    }
}
const ud = () => ({
        debug: !1,
        initAsync: !0,
        ns: ['translation'],
        defaultNS: ['translation'],
        fallbackLng: ['dev'],
        fallbackNS: !1,
        supportedLngs: !1,
        nonExplicitSupportedLngs: !1,
        load: 'all',
        preload: !1,
        simplifyPluralSuffix: !0,
        keySeparator: '.',
        nsSeparator: ':',
        pluralSeparator: '_',
        contextSeparator: '_',
        partialBundledLanguages: !1,
        saveMissing: !1,
        updateMissing: !1,
        saveMissingTo: 'fallback',
        saveMissingPlurals: !0,
        missingKeyHandler: !1,
        missingInterpolationHandler: !1,
        postProcess: !1,
        postProcessPassResolved: !1,
        returnNull: !1,
        returnEmptyString: !0,
        returnObjects: !1,
        joinArrays: !1,
        returnedObjectHandler: !1,
        parseMissingKeyHandler: !1,
        appendNamespaceToMissingKey: !1,
        appendNamespaceToCIMode: !1,
        overloadTranslationOptionHandler: (e) => {
            let t = {};
            if (
                (typeof e[1] == 'object' && (t = e[1]),
                O(e[1]) && (t.defaultValue = e[1]),
                O(e[2]) && (t.tDescription = e[2]),
                typeof e[2] == 'object' || typeof e[3] == 'object')
            ) {
                const n = e[3] || e[2];
                Object.keys(n).forEach((r) => {
                    t[r] = n[r];
                });
            }
            return t;
        },
        interpolation: {
            escapeValue: !0,
            format: (e) => e,
            prefix: '{{',
            suffix: '}}',
            formatSeparator: ',',
            unescapePrefix: '-',
            nestingPrefix: '$t(',
            nestingSuffix: ')',
            nestingOptionsSeparator: ',',
            maxReplaces: 1e3,
            skipOnVariables: !0,
        },
        cacheInBuiltFormats: !0,
    }),
    cd = (e) => {
        var t, n;
        return (
            O(e.ns) && (e.ns = [e.ns]),
            O(e.fallbackLng) && (e.fallbackLng = [e.fallbackLng]),
            O(e.fallbackNS) && (e.fallbackNS = [e.fallbackNS]),
            ((n = (t = e.supportedLngs) == null ? void 0 : t.indexOf) == null
                ? void 0
                : n.call(t, 'cimode')) < 0 &&
                (e.supportedLngs = e.supportedLngs.concat(['cimode'])),
            typeof e.initImmediate == 'boolean' && (e.initAsync = e.initImmediate),
            e
        );
    },
    Ii = () => {},
    Rv = (e) => {
        Object.getOwnPropertyNames(Object.getPrototypeOf(e)).forEach((n) => {
            typeof e[n] == 'function' && (e[n] = e[n].bind(e));
        });
    };
class _r extends to {
    constructor(t = {}, n) {
        if (
            (super(),
            (this.options = cd(t)),
            (this.services = {}),
            (this.logger = ut),
            (this.modules = { external: [] }),
            Rv(this),
            n && !this.isInitialized && !t.isClone)
        ) {
            if (!this.options.initAsync) return (this.init(t, n), this);
            setTimeout(() => {
                this.init(t, n);
            }, 0);
        }
    }
    init(t = {}, n) {
        ((this.isInitializing = !0),
            typeof t == 'function' && ((n = t), (t = {})),
            t.defaultNS == null &&
                t.ns &&
                (O(t.ns)
                    ? (t.defaultNS = t.ns)
                    : t.ns.indexOf('translation') < 0 && (t.defaultNS = t.ns[0])));
        const r = ud();
        ((this.options = { ...r, ...this.options, ...cd(t) }),
            (this.options.interpolation = { ...r.interpolation, ...this.options.interpolation }),
            t.keySeparator !== void 0 && (this.options.userDefinedKeySeparator = t.keySeparator),
            t.nsSeparator !== void 0 && (this.options.userDefinedNsSeparator = t.nsSeparator),
            typeof this.options.overloadTranslationOptionHandler != 'function' &&
                (this.options.overloadTranslationOptionHandler =
                    r.overloadTranslationOptionHandler));
        const i = (u) => (u ? (typeof u == 'function' ? new u() : u) : null);
        if (!this.options.isClone) {
            this.modules.logger
                ? ut.init(i(this.modules.logger), this.options)
                : ut.init(null, this.options);
            let u;
            this.modules.formatter ? (u = this.modules.formatter) : (u = Nv);
            const c = new rd(this.options);
            this.store = new td(this.options.resources, this.options);
            const d = this.services;
            ((d.logger = ut),
                (d.resourceStore = this.store),
                (d.languageUtils = c),
                (d.pluralResolver = new Pv(c, {
                    prepend: this.options.pluralSeparator,
                    simplifyPluralSuffix: this.options.simplifyPluralSuffix,
                })),
                this.options.interpolation.format &&
                    this.options.interpolation.format !== r.interpolation.format &&
                    this.logger.deprecate(
                        'init: you are still using the legacy format function, please use the new approach: https://www.i18next.com/translation-function/formatting',
                    ),
                u &&
                    (!this.options.interpolation.format ||
                        this.options.interpolation.format === r.interpolation.format) &&
                    ((d.formatter = i(u)),
                    d.formatter.init && d.formatter.init(d, this.options),
                    (this.options.interpolation.format = d.formatter.format.bind(d.formatter))),
                (d.interpolator = new ad(this.options)),
                (d.utils = { hasLoadedNamespace: this.hasLoadedNamespace.bind(this) }),
                (d.backendConnector = new jv(
                    i(this.modules.backend),
                    d.resourceStore,
                    d,
                    this.options,
                )),
                d.backendConnector.on('*', (m, ...v) => {
                    this.emit(m, ...v);
                }),
                this.modules.languageDetector &&
                    ((d.languageDetector = i(this.modules.languageDetector)),
                    d.languageDetector.init &&
                        d.languageDetector.init(d, this.options.detection, this.options)),
                this.modules.i18nFormat &&
                    ((d.i18nFormat = i(this.modules.i18nFormat)),
                    d.i18nFormat.init && d.i18nFormat.init(this)),
                (this.translator = new Rs(this.services, this.options)),
                this.translator.on('*', (m, ...v) => {
                    this.emit(m, ...v);
                }),
                this.modules.external.forEach((m) => {
                    m.init && m.init(this);
                }));
        }
        if (
            ((this.format = this.options.interpolation.format),
            n || (n = Ii),
            this.options.fallbackLng && !this.services.languageDetector && !this.options.lng)
        ) {
            const u = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
            u.length > 0 && u[0] !== 'dev' && (this.options.lng = u[0]);
        }
        (!this.services.languageDetector &&
            !this.options.lng &&
            this.logger.warn('init: no languageDetector is used and no lng is defined'),
            ['getResource', 'hasResourceBundle', 'getResourceBundle', 'getDataByLanguage'].forEach(
                (u) => {
                    this[u] = (...c) => this.store[u](...c);
                },
            ),
            ['addResource', 'addResources', 'addResourceBundle', 'removeResourceBundle'].forEach(
                (u) => {
                    this[u] = (...c) => (this.store[u](...c), this);
                },
            ));
        const a = vr(),
            l = () => {
                const u = (c, d) => {
                    ((this.isInitializing = !1),
                        this.isInitialized &&
                            !this.initializedStoreOnce &&
                            this.logger.warn(
                                'init: i18next is already initialized. You should call init just once!',
                            ),
                        (this.isInitialized = !0),
                        this.options.isClone || this.logger.log('initialized', this.options),
                        this.emit('initialized', this.options),
                        a.resolve(d),
                        n(c, d));
                };
                if (this.languages && !this.isInitialized) return u(null, this.t.bind(this));
                this.changeLanguage(this.options.lng, u);
            };
        return (this.options.resources || !this.options.initAsync ? l() : setTimeout(l, 0), a);
    }
    loadResources(t, n = Ii) {
        var s, o;
        let r = n;
        const i = O(t) ? t : this.language;
        if (
            (typeof t == 'function' && (r = t),
            !this.options.resources || this.options.partialBundledLanguages)
        ) {
            if (
                (i == null ? void 0 : i.toLowerCase()) === 'cimode' &&
                (!this.options.preload || this.options.preload.length === 0)
            )
                return r();
            const a = [],
                l = (u) => {
                    if (!u || u === 'cimode') return;
                    this.services.languageUtils.toResolveHierarchy(u).forEach((d) => {
                        d !== 'cimode' && a.indexOf(d) < 0 && a.push(d);
                    });
                };
            (i
                ? l(i)
                : this.services.languageUtils
                      .getFallbackCodes(this.options.fallbackLng)
                      .forEach((c) => l(c)),
                (o = (s = this.options.preload) == null ? void 0 : s.forEach) == null ||
                    o.call(s, (u) => l(u)),
                this.services.backendConnector.load(a, this.options.ns, (u) => {
                    (!u &&
                        !this.resolvedLanguage &&
                        this.language &&
                        this.setResolvedLanguage(this.language),
                        r(u));
                }));
        } else r(null);
    }
    reloadResources(t, n, r) {
        const i = vr();
        return (
            typeof t == 'function' && ((r = t), (t = void 0)),
            typeof n == 'function' && ((r = n), (n = void 0)),
            t || (t = this.languages),
            n || (n = this.options.ns),
            r || (r = Ii),
            this.services.backendConnector.reload(t, n, (s) => {
                (i.resolve(), r(s));
            }),
            i
        );
    }
    use(t) {
        if (!t)
            throw new Error(
                'You are passing an undefined module! Please check the object you are passing to i18next.use()',
            );
        if (!t.type)
            throw new Error(
                'You are passing a wrong module! Please check the object you are passing to i18next.use()',
            );
        return (
            t.type === 'backend' && (this.modules.backend = t),
            (t.type === 'logger' || (t.log && t.warn && t.error)) && (this.modules.logger = t),
            t.type === 'languageDetector' && (this.modules.languageDetector = t),
            t.type === 'i18nFormat' && (this.modules.i18nFormat = t),
            t.type === 'postProcessor' && Qp.addPostProcessor(t),
            t.type === 'formatter' && (this.modules.formatter = t),
            t.type === '3rdParty' && this.modules.external.push(t),
            this
        );
    }
    setResolvedLanguage(t) {
        if (!(!t || !this.languages) && !(['cimode', 'dev'].indexOf(t) > -1)) {
            for (let n = 0; n < this.languages.length; n++) {
                const r = this.languages[n];
                if (
                    !(['cimode', 'dev'].indexOf(r) > -1) &&
                    this.store.hasLanguageSomeTranslations(r)
                ) {
                    this.resolvedLanguage = r;
                    break;
                }
            }
            !this.resolvedLanguage &&
                this.languages.indexOf(t) < 0 &&
                this.store.hasLanguageSomeTranslations(t) &&
                ((this.resolvedLanguage = t), this.languages.unshift(t));
        }
    }
    changeLanguage(t, n) {
        this.isLanguageChangingTo = t;
        const r = vr();
        this.emit('languageChanging', t);
        const i = (a) => {
                ((this.language = a),
                    (this.languages = this.services.languageUtils.toResolveHierarchy(a)),
                    (this.resolvedLanguage = void 0),
                    this.setResolvedLanguage(a));
            },
            s = (a, l) => {
                (l
                    ? this.isLanguageChangingTo === t &&
                      (i(l),
                      this.translator.changeLanguage(l),
                      (this.isLanguageChangingTo = void 0),
                      this.emit('languageChanged', l),
                      this.logger.log('languageChanged', l))
                    : (this.isLanguageChangingTo = void 0),
                    r.resolve((...u) => this.t(...u)),
                    n && n(a, (...u) => this.t(...u)));
            },
            o = (a) => {
                var c, d;
                !t && !a && this.services.languageDetector && (a = []);
                const l = O(a) ? a : a && a[0],
                    u = this.store.hasLanguageSomeTranslations(l)
                        ? l
                        : this.services.languageUtils.getBestMatchFromCodes(O(a) ? [a] : a);
                (u &&
                    (this.language || i(u),
                    this.translator.language || this.translator.changeLanguage(u),
                    (d =
                        (c = this.services.languageDetector) == null
                            ? void 0
                            : c.cacheUserLanguage) == null || d.call(c, u)),
                    this.loadResources(u, (f) => {
                        s(f, u);
                    }));
            };
        return (
            !t && this.services.languageDetector && !this.services.languageDetector.async
                ? o(this.services.languageDetector.detect())
                : !t && this.services.languageDetector && this.services.languageDetector.async
                  ? this.services.languageDetector.detect.length === 0
                      ? this.services.languageDetector.detect().then(o)
                      : this.services.languageDetector.detect(o)
                  : o(t),
            r
        );
    }
    getFixedT(t, n, r) {
        const i = (s, o, ...a) => {
            let l;
            (typeof o != 'object'
                ? (l = this.options.overloadTranslationOptionHandler([s, o].concat(a)))
                : (l = { ...o }),
                (l.lng = l.lng || i.lng),
                (l.lngs = l.lngs || i.lngs),
                (l.ns = l.ns || i.ns),
                l.keyPrefix !== '' && (l.keyPrefix = l.keyPrefix || r || i.keyPrefix));
            const u = this.options.keySeparator || '.';
            let c;
            return (
                l.keyPrefix && Array.isArray(s)
                    ? (c = s.map(
                          (d) => (
                              typeof d == 'function' && (d = Wa(d, { ...this.options, ...o })),
                              `${l.keyPrefix}${u}${d}`
                          ),
                      ))
                    : (typeof s == 'function' && (s = Wa(s, { ...this.options, ...o })),
                      (c = l.keyPrefix ? `${l.keyPrefix}${u}${s}` : s)),
                this.t(c, l)
            );
        };
        return (O(t) ? (i.lng = t) : (i.lngs = t), (i.ns = n), (i.keyPrefix = r), i);
    }
    t(...t) {
        var n;
        return (n = this.translator) == null ? void 0 : n.translate(...t);
    }
    exists(...t) {
        var n;
        return (n = this.translator) == null ? void 0 : n.exists(...t);
    }
    setDefaultNamespace(t) {
        this.options.defaultNS = t;
    }
    hasLoadedNamespace(t, n = {}) {
        if (!this.isInitialized)
            return (
                this.logger.warn('hasLoadedNamespace: i18next was not initialized', this.languages),
                !1
            );
        if (!this.languages || !this.languages.length)
            return (
                this.logger.warn(
                    'hasLoadedNamespace: i18n.languages were undefined or empty',
                    this.languages,
                ),
                !1
            );
        const r = n.lng || this.resolvedLanguage || this.languages[0],
            i = this.options ? this.options.fallbackLng : !1,
            s = this.languages[this.languages.length - 1];
        if (r.toLowerCase() === 'cimode') return !0;
        const o = (a, l) => {
            const u = this.services.backendConnector.state[`${a}|${l}`];
            return u === -1 || u === 0 || u === 2;
        };
        if (n.precheck) {
            const a = n.precheck(this, o);
            if (a !== void 0) return a;
        }
        return !!(
            this.hasResourceBundle(r, t) ||
            !this.services.backendConnector.backend ||
            (this.options.resources && !this.options.partialBundledLanguages) ||
            (o(r, t) && (!i || o(s, t)))
        );
    }
    loadNamespaces(t, n) {
        const r = vr();
        return this.options.ns
            ? (O(t) && (t = [t]),
              t.forEach((i) => {
                  this.options.ns.indexOf(i) < 0 && this.options.ns.push(i);
              }),
              this.loadResources((i) => {
                  (r.resolve(), n && n(i));
              }),
              r)
            : (n && n(), Promise.resolve());
    }
    loadLanguages(t, n) {
        const r = vr();
        O(t) && (t = [t]);
        const i = this.options.preload || [],
            s = t.filter((o) => i.indexOf(o) < 0 && this.services.languageUtils.isSupportedCode(o));
        return s.length
            ? ((this.options.preload = i.concat(s)),
              this.loadResources((o) => {
                  (r.resolve(), n && n(o));
              }),
              r)
            : (n && n(), Promise.resolve());
    }
    dir(t) {
        var i, s;
        if (
            (t ||
                (t =
                    this.resolvedLanguage ||
                    (((i = this.languages) == null ? void 0 : i.length) > 0
                        ? this.languages[0]
                        : this.language)),
            !t)
        )
            return 'rtl';
        try {
            const o = new Intl.Locale(t);
            if (o && o.getTextInfo) {
                const a = o.getTextInfo();
                if (a && a.direction) return a.direction;
            }
        } catch {}
        const n = [
                'ar',
                'shu',
                'sqr',
                'ssh',
                'xaa',
                'yhd',
                'yud',
                'aao',
                'abh',
                'abv',
                'acm',
                'acq',
                'acw',
                'acx',
                'acy',
                'adf',
                'ads',
                'aeb',
                'aec',
                'afb',
                'ajp',
                'apc',
                'apd',
                'arb',
                'arq',
                'ars',
                'ary',
                'arz',
                'auz',
                'avl',
                'ayh',
                'ayl',
                'ayn',
                'ayp',
                'bbz',
                'pga',
                'he',
                'iw',
                'ps',
                'pbt',
                'pbu',
                'pst',
                'prp',
                'prd',
                'ug',
                'ur',
                'ydd',
                'yds',
                'yih',
                'ji',
                'yi',
                'hbo',
                'men',
                'xmn',
                'fa',
                'jpr',
                'peo',
                'pes',
                'prs',
                'dv',
                'sam',
                'ckb',
            ],
            r = ((s = this.services) == null ? void 0 : s.languageUtils) || new rd(ud());
        return t.toLowerCase().indexOf('-latn') > 1
            ? 'ltr'
            : n.indexOf(r.getLanguagePartFromCode(t)) > -1 || t.toLowerCase().indexOf('-arab') > 1
              ? 'rtl'
              : 'ltr';
    }
    static createInstance(t = {}, n) {
        const r = new _r(t, n);
        return ((r.createInstance = _r.createInstance), r);
    }
    cloneInstance(t = {}, n = Ii) {
        const r = t.forkResourceStore;
        r && delete t.forkResourceStore;
        const i = { ...this.options, ...t, isClone: !0 },
            s = new _r(i);
        if (
            ((t.debug !== void 0 || t.prefix !== void 0) && (s.logger = s.logger.clone(t)),
            ['store', 'services', 'language'].forEach((a) => {
                s[a] = this[a];
            }),
            (s.services = { ...this.services }),
            (s.services.utils = { hasLoadedNamespace: s.hasLoadedNamespace.bind(s) }),
            r)
        ) {
            const a = Object.keys(this.store.data).reduce(
                (l, u) => (
                    (l[u] = { ...this.store.data[u] }),
                    (l[u] = Object.keys(l[u]).reduce((c, d) => ((c[d] = { ...l[u][d] }), c), l[u])),
                    l
                ),
                {},
            );
            ((s.store = new td(a, i)), (s.services.resourceStore = s.store));
        }
        return (
            t.interpolation && (s.services.interpolator = new ad(i)),
            (s.translator = new Rs(s.services, i)),
            s.translator.on('*', (a, ...l) => {
                s.emit(a, ...l);
            }),
            s.init(i, n),
            (s.translator.options = i),
            (s.translator.backendConnector.services.utils = {
                hasLoadedNamespace: s.hasLoadedNamespace.bind(s),
            }),
            s
        );
    }
    toJSON() {
        return {
            options: this.options,
            store: this.store,
            language: this.language,
            languages: this.languages,
            resolvedLanguage: this.resolvedLanguage,
        };
    }
}
const Le = _r.createInstance();
Le.createInstance;
Le.dir;
Le.init;
Le.loadResources;
Le.reloadResources;
Le.use;
Le.changeLanguage;
Le.getFixedT;
Le.t;
Le.exists;
Le.setDefaultNamespace;
Le.hasLoadedNamespace;
Le.loadNamespaces;
Le.loadLanguages;
const Av = (e, t, n, r) => {
        var s, o, a, l;
        const i = [n, { code: t, ...(r || {}) }];
        if (
            (o = (s = e == null ? void 0 : e.services) == null ? void 0 : s.logger) != null &&
            o.forward
        )
            return e.services.logger.forward(i, 'warn', 'react-i18next::', !0);
        (gn(i[0]) && (i[0] = `react-i18next:: ${i[0]}`),
            (l = (a = e == null ? void 0 : e.services) == null ? void 0 : a.logger) != null &&
            l.warn
                ? e.services.logger.warn(...i)
                : console != null && console.warn && console.warn(...i));
    },
    dd = {},
    Xp = (e, t, n, r) => {
        (gn(n) && dd[n]) || (gn(n) && (dd[n] = new Date()), Av(e, t, n, r));
    },
    Zp = (e, t) => () => {
        if (e.isInitialized) t();
        else {
            const n = () => {
                (setTimeout(() => {
                    e.off('initialized', n);
                }, 0),
                    t());
            };
            e.on('initialized', n);
        }
    },
    Ka = (e, t, n) => {
        e.loadNamespaces(t, Zp(e, n));
    },
    fd = (e, t, n, r) => {
        if ((gn(n) && (n = [n]), e.options.preload && e.options.preload.indexOf(t) > -1))
            return Ka(e, n, r);
        (n.forEach((i) => {
            e.options.ns.indexOf(i) < 0 && e.options.ns.push(i);
        }),
            e.loadLanguages(t, Zp(e, r)));
    },
    Dv = (e, t, n = {}) =>
        !t.languages || !t.languages.length
            ? (Xp(t, 'NO_LANGUAGES', 'i18n.languages were undefined or empty', {
                  languages: t.languages,
              }),
              !0)
            : t.hasLoadedNamespace(e, {
                  lng: n.lng,
                  precheck: (r, i) => {
                      if (
                          n.bindI18n &&
                          n.bindI18n.indexOf('languageChanging') > -1 &&
                          r.services.backendConnector.backend &&
                          r.isLanguageChangingTo &&
                          !i(r.isLanguageChangingTo, e)
                      )
                          return !1;
                  },
              }),
    gn = (e) => typeof e == 'string',
    Mv = (e) => typeof e == 'object' && e !== null,
    Ov =
        /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g,
    Vv = {
        '&amp;': '&',
        '&#38;': '&',
        '&lt;': '<',
        '&#60;': '<',
        '&gt;': '>',
        '&#62;': '>',
        '&apos;': "'",
        '&#39;': "'",
        '&quot;': '"',
        '&#34;': '"',
        '&nbsp;': ' ',
        '&#160;': ' ',
        '&copy;': '©',
        '&#169;': '©',
        '&reg;': '®',
        '&#174;': '®',
        '&hellip;': '…',
        '&#8230;': '…',
        '&#x2F;': '/',
        '&#47;': '/',
    },
    bv = (e) => Vv[e],
    _v = (e) => e.replace(Ov, bv);
let Ga = {
    bindI18n: 'languageChanged',
    bindI18nStore: '',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: !0,
    transWrapTextNodes: '',
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    useSuspense: !0,
    unescape: _v,
    transDefaultProps: void 0,
};
const Iv = (e = {}) => {
        Ga = { ...Ga, ...e };
    },
    Fv = () => Ga;
let qp;
const zv = (e) => {
        qp = e;
    },
    Bv = () => qp,
    $v = {
        type: '3rdParty',
        init(e) {
            (Iv(e.options.react), zv(e));
        },
    },
    Uv = L.createContext();
class Hv {
    constructor() {
        this.usedNamespaces = {};
    }
    addUsedNamespaces(t) {
        t.forEach((n) => {
            this.usedNamespaces[n] || (this.usedNamespaces[n] = !0);
        });
    }
    getUsedNamespaces() {
        return Object.keys(this.usedNamespaces);
    }
}
var Jp = { exports: {} },
    em = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var tr = L;
function Wv(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var Kv = typeof Object.is == 'function' ? Object.is : Wv,
    Gv = tr.useState,
    Qv = tr.useEffect,
    Yv = tr.useLayoutEffect,
    Xv = tr.useDebugValue;
function Zv(e, t) {
    var n = t(),
        r = Gv({ inst: { value: n, getSnapshot: t } }),
        i = r[0].inst,
        s = r[1];
    return (
        Yv(
            function () {
                ((i.value = n), (i.getSnapshot = t), _o(i) && s({ inst: i }));
            },
            [e, n, t],
        ),
        Qv(
            function () {
                return (
                    _o(i) && s({ inst: i }),
                    e(function () {
                        _o(i) && s({ inst: i });
                    })
                );
            },
            [e],
        ),
        Xv(n),
        n
    );
}
function _o(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !Kv(e, n);
    } catch {
        return !0;
    }
}
function qv(e, t) {
    return t();
}
var Jv =
    typeof window > 'u' ||
    typeof window.document > 'u' ||
    typeof window.document.createElement > 'u'
        ? qv
        : Zv;
em.useSyncExternalStore = tr.useSyncExternalStore !== void 0 ? tr.useSyncExternalStore : Jv;
Jp.exports = em;
var ex = Jp.exports;
const tx = (e, t) =>
        gn(t)
            ? t
            : Mv(t) && gn(t.defaultValue)
              ? t.defaultValue
              : Array.isArray(e)
                ? e[e.length - 1]
                : e,
    nx = { t: tx, ready: !1 },
    rx = () => () => {},
    tm = (e, t = {}) => {
        var A, j, Z;
        const { i18n: n } = t,
            { i18n: r, defaultNS: i } = L.useContext(Uv) || {},
            s = n || r || Bv();
        (s && !s.reportNamespaces && (s.reportNamespaces = new Hv()),
            s ||
                Xp(
                    s,
                    'NO_I18NEXT_INSTANCE',
                    'useTranslation: You will need to pass in an i18next instance by using initReactI18next',
                ));
        const o = L.useMemo(() => {
                var z;
                return {
                    ...Fv(),
                    ...((z = s == null ? void 0 : s.options) == null ? void 0 : z.react),
                    ...t,
                };
            }, [s, t]),
            { useSuspense: a, keyPrefix: l } = o,
            u = i || ((A = s == null ? void 0 : s.options) == null ? void 0 : A.defaultNS),
            c = gn(u) ? [u] : u || ['translation'],
            d = L.useMemo(() => c, c);
        (Z =
            (j = s == null ? void 0 : s.reportNamespaces) == null ? void 0 : j.addUsedNamespaces) ==
            null || Z.call(j, d);
        const f = L.useRef(0),
            m = L.useCallback(
                (z) => {
                    if (!s) return rx;
                    const { bindI18n: b, bindI18nStore: I } = o,
                        q = () => {
                            ((f.current += 1), z());
                        };
                    return (
                        b && s.on(b, q),
                        I && s.store.on(I, q),
                        () => {
                            (b && b.split(' ').forEach((le) => s.off(le, q)),
                                I && I.split(' ').forEach((le) => s.store.off(le, q)));
                        }
                    );
                },
                [s, o],
            ),
            v = L.useRef(),
            x = L.useCallback(() => {
                if (!s) return nx;
                const z =
                        !!(s.isInitialized || s.initializedStoreOnce) &&
                        d.every((N) => Dv(N, s, o)),
                    b = t.lng || s.language,
                    I = f.current,
                    q = v.current;
                if (q && q.ready === z && q.lng === b && q.keyPrefix === l && q.revision === I)
                    return q;
                const U = {
                    t: s.getFixedT(b, o.nsMode === 'fallback' ? d : d[0], l),
                    ready: z,
                    lng: b,
                    keyPrefix: l,
                    revision: I,
                };
                return ((v.current = U), U);
            }, [s, d, l, o, t.lng]),
            [k, p] = L.useState(0),
            { t: h, ready: y } = ex.useSyncExternalStore(m, x, x);
        L.useEffect(() => {
            if (s && !y && !a) {
                const z = () => p((b) => b + 1);
                t.lng ? fd(s, t.lng, d, z) : Ka(s, d, z);
            }
        }, [s, t.lng, d, y, a, k]);
        const w = s || {},
            S = L.useRef(null),
            P = L.useRef(),
            E = (z) => {
                const b = Object.getOwnPropertyDescriptors(z);
                b.__original && delete b.__original;
                const I = Object.create(Object.getPrototypeOf(z), b);
                if (!Object.prototype.hasOwnProperty.call(I, '__original'))
                    try {
                        Object.defineProperty(I, '__original', {
                            value: z,
                            writable: !1,
                            enumerable: !1,
                            configurable: !1,
                        });
                    } catch {}
                return I;
            },
            C = L.useMemo(() => {
                const z = w,
                    b = z == null ? void 0 : z.language;
                let I = z;
                z &&
                    (S.current && S.current.__original === z
                        ? P.current !== b
                            ? ((I = E(z)), (S.current = I), (P.current = b))
                            : (I = S.current)
                        : ((I = E(z)), (S.current = I), (P.current = b)));
                const q = [h, I, y];
                return ((q.t = h), (q.i18n = I), (q.ready = y), q);
            }, [h, w, y, w.resolvedLanguage, w.language, w.languages]);
        if (s && a && !y)
            throw new Promise((z) => {
                const b = () => z();
                t.lng ? fd(s, t.lng, d, b) : Ka(s, d, b);
            });
        return C;
    },
    iu = L.createContext({});
function su(e) {
    const t = L.useRef(null);
    return (t.current === null && (t.current = e()), t.current);
}
const no = L.createContext(null),
    ou = L.createContext({ transformPagePoint: (e) => e, isStatic: !1, reducedMotion: 'never' });
class ix extends L.Component {
    getSnapshotBeforeUpdate(t) {
        const n = this.props.childRef.current;
        if (n && t.isPresent && !this.props.isPresent) {
            const r = this.props.sizeRef.current;
            ((r.height = n.offsetHeight || 0),
                (r.width = n.offsetWidth || 0),
                (r.top = n.offsetTop),
                (r.left = n.offsetLeft));
        }
        return null;
    }
    componentDidUpdate() {}
    render() {
        return this.props.children;
    }
}
function sx({ children: e, isPresent: t }) {
    const n = L.useId(),
        r = L.useRef(null),
        i = L.useRef({ width: 0, height: 0, top: 0, left: 0 }),
        { nonce: s } = L.useContext(ou);
    return (
        L.useInsertionEffect(() => {
            const { width: o, height: a, top: l, left: u } = i.current;
            if (t || !r.current || !o || !a) return;
            r.current.dataset.motionPopId = n;
            const c = document.createElement('style');
            return (
                s && (c.nonce = s),
                document.head.appendChild(c),
                c.sheet &&
                    c.sheet.insertRule(`
          [data-motion-pop-id="${n}"] {
            position: absolute !important;
            width: ${o}px !important;
            height: ${a}px !important;
            top: ${l}px !important;
            left: ${u}px !important;
          }
        `),
                () => {
                    document.head.removeChild(c);
                }
            );
        }, [t]),
        g.jsx(ix, {
            isPresent: t,
            childRef: r,
            sizeRef: i,
            children: L.cloneElement(e, { ref: r }),
        })
    );
}
const ox = ({
    children: e,
    initial: t,
    isPresent: n,
    onExitComplete: r,
    custom: i,
    presenceAffectsLayout: s,
    mode: o,
}) => {
    const a = su(ax),
        l = L.useId(),
        u = L.useCallback(
            (d) => {
                a.set(d, !0);
                for (const f of a.values()) if (!f) return;
                r && r();
            },
            [a, r],
        ),
        c = L.useMemo(
            () => ({
                id: l,
                initial: t,
                isPresent: n,
                custom: i,
                onExitComplete: u,
                register: (d) => (a.set(d, !1), () => a.delete(d)),
            }),
            s ? [Math.random(), u] : [n, u],
        );
    return (
        L.useMemo(() => {
            a.forEach((d, f) => a.set(f, !1));
        }, [n]),
        L.useEffect(() => {
            !n && !a.size && r && r();
        }, [n]),
        o === 'popLayout' && (e = g.jsx(sx, { isPresent: n, children: e })),
        g.jsx(no.Provider, { value: c, children: e })
    );
};
function ax() {
    return new Map();
}
function nm(e = !0) {
    const t = L.useContext(no);
    if (t === null) return [!0, null];
    const { isPresent: n, onExitComplete: r, register: i } = t,
        s = L.useId();
    L.useEffect(() => {
        e && i(s);
    }, [e]);
    const o = L.useCallback(() => e && r && r(s), [s, r, e]);
    return !n && r ? [!1, o] : [!0];
}
const Fi = (e) => e.key || '';
function hd(e) {
    const t = [];
    return (
        L.Children.forEach(e, (n) => {
            L.isValidElement(n) && t.push(n);
        }),
        t
    );
}
const au = typeof window < 'u',
    rm = au ? L.useLayoutEffect : L.useEffect,
    lx = ({
        children: e,
        custom: t,
        initial: n = !0,
        onExitComplete: r,
        presenceAffectsLayout: i = !0,
        mode: s = 'sync',
        propagate: o = !1,
    }) => {
        const [a, l] = nm(o),
            u = L.useMemo(() => hd(e), [e]),
            c = o && !a ? [] : u.map(Fi),
            d = L.useRef(!0),
            f = L.useRef(u),
            m = su(() => new Map()),
            [v, x] = L.useState(u),
            [k, p] = L.useState(u);
        rm(() => {
            ((d.current = !1), (f.current = u));
            for (let w = 0; w < k.length; w++) {
                const S = Fi(k[w]);
                c.includes(S) ? m.delete(S) : m.get(S) !== !0 && m.set(S, !1);
            }
        }, [k, c.length, c.join('-')]);
        const h = [];
        if (u !== v) {
            let w = [...u];
            for (let S = 0; S < k.length; S++) {
                const P = k[S],
                    E = Fi(P);
                c.includes(E) || (w.splice(S, 0, P), h.push(P));
            }
            (s === 'wait' && h.length && (w = h), p(hd(w)), x(u));
            return;
        }
        const { forceRender: y } = L.useContext(iu);
        return g.jsx(g.Fragment, {
            children: k.map((w) => {
                const S = Fi(w),
                    P = o && !a ? !1 : u === k || c.includes(S),
                    E = () => {
                        if (m.has(S)) m.set(S, !0);
                        else return;
                        let C = !0;
                        (m.forEach((A) => {
                            A || (C = !1);
                        }),
                            C &&
                                (y == null || y(),
                                p(f.current),
                                o && (l == null || l()),
                                r && r()));
                    };
                return g.jsx(
                    ox,
                    {
                        isPresent: P,
                        initial: !d.current || n ? void 0 : !1,
                        custom: P ? void 0 : t,
                        presenceAffectsLayout: i,
                        mode: s,
                        onExitComplete: P ? void 0 : E,
                        children: w,
                    },
                    S,
                );
            }),
        });
    },
    _e = (e) => e;
let im = _e;
function lu(e) {
    let t;
    return () => (t === void 0 && (t = e()), t);
}
const nr = (e, t, n) => {
        const r = t - e;
        return r === 0 ? 1 : (n - e) / r;
    },
    xt = (e) => e * 1e3,
    wt = (e) => e / 1e3,
    ux = { useManualTiming: !1 };
function cx(e) {
    let t = new Set(),
        n = new Set(),
        r = !1,
        i = !1;
    const s = new WeakSet();
    let o = { delta: 0, timestamp: 0, isProcessing: !1 };
    function a(u) {
        (s.has(u) && (l.schedule(u), e()), u(o));
    }
    const l = {
        schedule: (u, c = !1, d = !1) => {
            const m = d && r ? t : n;
            return (c && s.add(u), m.has(u) || m.add(u), u);
        },
        cancel: (u) => {
            (n.delete(u), s.delete(u));
        },
        process: (u) => {
            if (((o = u), r)) {
                i = !0;
                return;
            }
            ((r = !0),
                ([t, n] = [n, t]),
                t.forEach(a),
                t.clear(),
                (r = !1),
                i && ((i = !1), l.process(u)));
        },
    };
    return l;
}
const zi = ['read', 'resolveKeyframes', 'update', 'preRender', 'render', 'postRender'],
    dx = 40;
function sm(e, t) {
    let n = !1,
        r = !0;
    const i = { delta: 0, timestamp: 0, isProcessing: !1 },
        s = () => (n = !0),
        o = zi.reduce((p, h) => ((p[h] = cx(s)), p), {}),
        { read: a, resolveKeyframes: l, update: u, preRender: c, render: d, postRender: f } = o,
        m = () => {
            const p = performance.now();
            ((n = !1),
                (i.delta = r ? 1e3 / 60 : Math.max(Math.min(p - i.timestamp, dx), 1)),
                (i.timestamp = p),
                (i.isProcessing = !0),
                a.process(i),
                l.process(i),
                u.process(i),
                c.process(i),
                d.process(i),
                f.process(i),
                (i.isProcessing = !1),
                n && t && ((r = !1), e(m)));
        },
        v = () => {
            ((n = !0), (r = !0), i.isProcessing || e(m));
        };
    return {
        schedule: zi.reduce((p, h) => {
            const y = o[h];
            return ((p[h] = (w, S = !1, P = !1) => (n || v(), y.schedule(w, S, P))), p);
        }, {}),
        cancel: (p) => {
            for (let h = 0; h < zi.length; h++) o[zi[h]].cancel(p);
        },
        state: i,
        steps: o,
    };
}
const {
        schedule: Y,
        cancel: Wt,
        state: me,
        steps: Io,
    } = sm(typeof requestAnimationFrame < 'u' ? requestAnimationFrame : _e, !0),
    om = L.createContext({ strict: !1 }),
    pd = {
        animation: [
            'animate',
            'variants',
            'whileHover',
            'whileTap',
            'exit',
            'whileInView',
            'whileFocus',
            'whileDrag',
        ],
        exit: ['exit'],
        drag: ['drag', 'dragControls'],
        focus: ['whileFocus'],
        hover: ['whileHover', 'onHoverStart', 'onHoverEnd'],
        tap: ['whileTap', 'onTap', 'onTapStart', 'onTapCancel'],
        pan: ['onPan', 'onPanStart', 'onPanSessionStart', 'onPanEnd'],
        inView: ['whileInView', 'onViewportEnter', 'onViewportLeave'],
        layout: ['layout', 'layoutId'],
    },
    rr = {};
for (const e in pd) rr[e] = { isEnabled: (t) => pd[e].some((n) => !!t[n]) };
function fx(e) {
    for (const t in e) rr[t] = { ...rr[t], ...e[t] };
}
const hx = new Set([
    'animate',
    'exit',
    'variants',
    'initial',
    'style',
    'values',
    'variants',
    'transition',
    'transformTemplate',
    'custom',
    'inherit',
    'onBeforeLayoutMeasure',
    'onAnimationStart',
    'onAnimationComplete',
    'onUpdate',
    'onDragStart',
    'onDrag',
    'onDragEnd',
    'onMeasureDragConstraints',
    'onDirectionLock',
    'onDragTransitionEnd',
    '_dragX',
    '_dragY',
    'onHoverStart',
    'onHoverEnd',
    'onViewportEnter',
    'onViewportLeave',
    'globalTapTarget',
    'ignoreStrict',
    'viewport',
]);
function As(e) {
    return (
        e.startsWith('while') ||
        (e.startsWith('drag') && e !== 'draggable') ||
        e.startsWith('layout') ||
        e.startsWith('onTap') ||
        e.startsWith('onPan') ||
        e.startsWith('onLayout') ||
        hx.has(e)
    );
}
let am = (e) => !As(e);
function px(e) {
    e && (am = (t) => (t.startsWith('on') ? !As(t) : e(t)));
}
try {
    px(require('@emotion/is-prop-valid').default);
} catch {}
function mx(e, t, n) {
    const r = {};
    for (const i in e)
        (i === 'values' && typeof e.values == 'object') ||
            ((am(i) ||
                (n === !0 && As(i)) ||
                (!t && !As(i)) ||
                (e.draggable && i.startsWith('onDrag'))) &&
                (r[i] = e[i]));
    return r;
}
function gx(e) {
    if (typeof Proxy > 'u') return e;
    const t = new Map(),
        n = (...r) => e(...r);
    return new Proxy(n, {
        get: (r, i) => (i === 'create' ? e : (t.has(i) || t.set(i, e(i)), t.get(i))),
    });
}
const ro = L.createContext({});
function oi(e) {
    return typeof e == 'string' || Array.isArray(e);
}
function io(e) {
    return e !== null && typeof e == 'object' && typeof e.start == 'function';
}
const uu = ['animate', 'whileInView', 'whileFocus', 'whileHover', 'whileTap', 'whileDrag', 'exit'],
    cu = ['initial', ...uu];
function so(e) {
    return io(e.animate) || cu.some((t) => oi(e[t]));
}
function lm(e) {
    return !!(so(e) || e.variants);
}
function yx(e, t) {
    if (so(e)) {
        const { initial: n, animate: r } = e;
        return { initial: n === !1 || oi(n) ? n : void 0, animate: oi(r) ? r : void 0 };
    }
    return e.inherit !== !1 ? t : {};
}
function vx(e) {
    const { initial: t, animate: n } = yx(e, L.useContext(ro));
    return L.useMemo(() => ({ initial: t, animate: n }), [md(t), md(n)]);
}
function md(e) {
    return Array.isArray(e) ? e.join(' ') : e;
}
const xx = Symbol.for('motionComponentSymbol');
function _n(e) {
    return e && typeof e == 'object' && Object.prototype.hasOwnProperty.call(e, 'current');
}
function wx(e, t, n) {
    return L.useCallback(
        (r) => {
            (r && e.onMount && e.onMount(r),
                t && (r ? t.mount(r) : t.unmount()),
                n && (typeof n == 'function' ? n(r) : _n(n) && (n.current = r)));
        },
        [t],
    );
}
const du = (e) => e.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase(),
    Sx = 'framerAppearId',
    um = 'data-' + du(Sx),
    { schedule: fu } = sm(queueMicrotask, !1),
    cm = L.createContext({});
function kx(e, t, n, r, i) {
    var s, o;
    const { visualElement: a } = L.useContext(ro),
        l = L.useContext(om),
        u = L.useContext(no),
        c = L.useContext(ou).reducedMotion,
        d = L.useRef(null);
    ((r = r || l.renderer),
        !d.current &&
            r &&
            (d.current = r(e, {
                visualState: t,
                parent: a,
                props: n,
                presenceContext: u,
                blockInitialAnimation: u ? u.initial === !1 : !1,
                reducedMotionConfig: c,
            })));
    const f = d.current,
        m = L.useContext(cm);
    f && !f.projection && i && (f.type === 'html' || f.type === 'svg') && Cx(d.current, n, i, m);
    const v = L.useRef(!1);
    L.useInsertionEffect(() => {
        f && v.current && f.update(n, u);
    });
    const x = n[um],
        k = L.useRef(
            !!x &&
                !(
                    !((s = window.MotionHandoffIsComplete) === null || s === void 0) &&
                    s.call(window, x)
                ) &&
                ((o = window.MotionHasOptimisedAnimation) === null || o === void 0
                    ? void 0
                    : o.call(window, x)),
        );
    return (
        rm(() => {
            f &&
                ((v.current = !0),
                (window.MotionIsMounted = !0),
                f.updateFeatures(),
                fu.render(f.render),
                k.current && f.animationState && f.animationState.animateChanges());
        }),
        L.useEffect(() => {
            f &&
                (!k.current && f.animationState && f.animationState.animateChanges(),
                k.current &&
                    (queueMicrotask(() => {
                        var p;
                        (p = window.MotionHandoffMarkAsComplete) === null ||
                            p === void 0 ||
                            p.call(window, x);
                    }),
                    (k.current = !1)));
        }),
        f
    );
}
function Cx(e, t, n, r) {
    const {
        layoutId: i,
        layout: s,
        drag: o,
        dragConstraints: a,
        layoutScroll: l,
        layoutRoot: u,
    } = t;
    ((e.projection = new n(e.latestValues, t['data-framer-portal-id'] ? void 0 : dm(e.parent))),
        e.projection.setOptions({
            layoutId: i,
            layout: s,
            alwaysMeasureLayout: !!o || (a && _n(a)),
            visualElement: e,
            animationType: typeof s == 'string' ? s : 'both',
            initialPromotionConfig: r,
            layoutScroll: l,
            layoutRoot: u,
        }));
}
function dm(e) {
    if (e) return e.options.allowProjection !== !1 ? e.projection : dm(e.parent);
}
function Px({
    preloadedFeatures: e,
    createVisualElement: t,
    useRender: n,
    useVisualState: r,
    Component: i,
}) {
    var s, o;
    e && fx(e);
    function a(u, c) {
        let d;
        const f = { ...L.useContext(ou), ...u, layoutId: Tx(u) },
            { isStatic: m } = f,
            v = vx(u),
            x = r(u, m);
        if (!m && au) {
            Ex();
            const k = Nx(f);
            ((d = k.MeasureLayout), (v.visualElement = kx(i, x, f, t, k.ProjectionNode)));
        }
        return g.jsxs(ro.Provider, {
            value: v,
            children: [
                d && v.visualElement ? g.jsx(d, { visualElement: v.visualElement, ...f }) : null,
                n(i, u, wx(x, v.visualElement, c), x, m, v.visualElement),
            ],
        });
    }
    a.displayName = `motion.${typeof i == 'string' ? i : `create(${(o = (s = i.displayName) !== null && s !== void 0 ? s : i.name) !== null && o !== void 0 ? o : ''})`}`;
    const l = L.forwardRef(a);
    return ((l[xx] = i), l);
}
function Tx({ layoutId: e }) {
    const t = L.useContext(iu).id;
    return t && e !== void 0 ? t + '-' + e : e;
}
function Ex(e, t) {
    L.useContext(om).strict;
}
function Nx(e) {
    const { drag: t, layout: n } = rr;
    if (!t && !n) return {};
    const r = { ...t, ...n };
    return {
        MeasureLayout:
            (t != null && t.isEnabled(e)) || (n != null && n.isEnabled(e))
                ? r.MeasureLayout
                : void 0,
        ProjectionNode: r.ProjectionNode,
    };
}
const Lx = [
    'animate',
    'circle',
    'defs',
    'desc',
    'ellipse',
    'g',
    'image',
    'line',
    'filter',
    'marker',
    'mask',
    'metadata',
    'path',
    'pattern',
    'polygon',
    'polyline',
    'rect',
    'stop',
    'switch',
    'symbol',
    'svg',
    'text',
    'tspan',
    'use',
    'view',
];
function hu(e) {
    return typeof e != 'string' || e.includes('-')
        ? !1
        : !!(Lx.indexOf(e) > -1 || /[A-Z]/u.test(e));
}
function gd(e) {
    const t = [{}, {}];
    return (
        e == null ||
            e.values.forEach((n, r) => {
                ((t[0][r] = n.get()), (t[1][r] = n.getVelocity()));
            }),
        t
    );
}
function pu(e, t, n, r) {
    if (typeof t == 'function') {
        const [i, s] = gd(r);
        t = t(n !== void 0 ? n : e.custom, i, s);
    }
    if ((typeof t == 'string' && (t = e.variants && e.variants[t]), typeof t == 'function')) {
        const [i, s] = gd(r);
        t = t(n !== void 0 ? n : e.custom, i, s);
    }
    return t;
}
const Qa = (e) => Array.isArray(e),
    jx = (e) => !!(e && typeof e == 'object' && e.mix && e.toValue),
    Rx = (e) => (Qa(e) ? e[e.length - 1] || 0 : e),
    ke = (e) => !!(e && e.getVelocity);
function ts(e) {
    const t = ke(e) ? e.get() : e;
    return jx(t) ? t.toValue() : t;
}
function Ax({ scrapeMotionValuesFromProps: e, createRenderState: t, onUpdate: n }, r, i, s) {
    const o = { latestValues: Dx(r, i, s, e), renderState: t() };
    return (
        n && ((o.onMount = (a) => n({ props: r, current: a, ...o })), (o.onUpdate = (a) => n(a))),
        o
    );
}
const fm = (e) => (t, n) => {
    const r = L.useContext(ro),
        i = L.useContext(no),
        s = () => Ax(e, t, r, i);
    return n ? s() : su(s);
};
function Dx(e, t, n, r) {
    const i = {},
        s = r(e, {});
    for (const f in s) i[f] = ts(s[f]);
    let { initial: o, animate: a } = e;
    const l = so(e),
        u = lm(e);
    t &&
        u &&
        !l &&
        e.inherit !== !1 &&
        (o === void 0 && (o = t.initial), a === void 0 && (a = t.animate));
    let c = n ? n.initial === !1 : !1;
    c = c || o === !1;
    const d = c ? a : o;
    if (d && typeof d != 'boolean' && !io(d)) {
        const f = Array.isArray(d) ? d : [d];
        for (let m = 0; m < f.length; m++) {
            const v = pu(e, f[m]);
            if (v) {
                const { transitionEnd: x, transition: k, ...p } = v;
                for (const h in p) {
                    let y = p[h];
                    if (Array.isArray(y)) {
                        const w = c ? y.length - 1 : 0;
                        y = y[w];
                    }
                    y !== null && (i[h] = y);
                }
                for (const h in x) i[h] = x[h];
            }
        }
    }
    return i;
}
const lr = [
        'transformPerspective',
        'x',
        'y',
        'z',
        'translateX',
        'translateY',
        'translateZ',
        'scale',
        'scaleX',
        'scaleY',
        'rotate',
        'rotateX',
        'rotateY',
        'rotateZ',
        'skew',
        'skewX',
        'skewY',
    ],
    xn = new Set(lr),
    hm = (e) => (t) => typeof t == 'string' && t.startsWith(e),
    pm = hm('--'),
    Mx = hm('var(--'),
    mu = (e) => (Mx(e) ? Ox.test(e.split('/*')[0].trim()) : !1),
    Ox = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu,
    mm = (e, t) => (t && typeof e == 'number' ? t.transform(e) : e),
    Tt = (e, t, n) => (n > t ? t : n < e ? e : n),
    ur = { test: (e) => typeof e == 'number', parse: parseFloat, transform: (e) => e },
    ai = { ...ur, transform: (e) => Tt(0, 1, e) },
    Bi = { ...ur, default: 1 },
    gi = (e) => ({
        test: (t) => typeof t == 'string' && t.endsWith(e) && t.split(' ').length === 1,
        parse: parseFloat,
        transform: (t) => `${t}${e}`,
    }),
    Lt = gi('deg'),
    ft = gi('%'),
    M = gi('px'),
    Vx = gi('vh'),
    bx = gi('vw'),
    yd = { ...ft, parse: (e) => ft.parse(e) / 100, transform: (e) => ft.transform(e * 100) },
    _x = {
        borderWidth: M,
        borderTopWidth: M,
        borderRightWidth: M,
        borderBottomWidth: M,
        borderLeftWidth: M,
        borderRadius: M,
        radius: M,
        borderTopLeftRadius: M,
        borderTopRightRadius: M,
        borderBottomRightRadius: M,
        borderBottomLeftRadius: M,
        width: M,
        maxWidth: M,
        height: M,
        maxHeight: M,
        top: M,
        right: M,
        bottom: M,
        left: M,
        padding: M,
        paddingTop: M,
        paddingRight: M,
        paddingBottom: M,
        paddingLeft: M,
        margin: M,
        marginTop: M,
        marginRight: M,
        marginBottom: M,
        marginLeft: M,
        backgroundPositionX: M,
        backgroundPositionY: M,
    },
    Ix = {
        rotate: Lt,
        rotateX: Lt,
        rotateY: Lt,
        rotateZ: Lt,
        scale: Bi,
        scaleX: Bi,
        scaleY: Bi,
        scaleZ: Bi,
        skew: Lt,
        skewX: Lt,
        skewY: Lt,
        distance: M,
        translateX: M,
        translateY: M,
        translateZ: M,
        x: M,
        y: M,
        z: M,
        perspective: M,
        transformPerspective: M,
        opacity: ai,
        originX: yd,
        originY: yd,
        originZ: M,
    },
    vd = { ...ur, transform: Math.round },
    gu = { ..._x, ...Ix, zIndex: vd, size: M, fillOpacity: ai, strokeOpacity: ai, numOctaves: vd },
    Fx = { x: 'translateX', y: 'translateY', z: 'translateZ', transformPerspective: 'perspective' },
    zx = lr.length;
function Bx(e, t, n) {
    let r = '',
        i = !0;
    for (let s = 0; s < zx; s++) {
        const o = lr[s],
            a = e[o];
        if (a === void 0) continue;
        let l = !0;
        if (
            (typeof a == 'number'
                ? (l = a === (o.startsWith('scale') ? 1 : 0))
                : (l = parseFloat(a) === 0),
            !l || n)
        ) {
            const u = mm(a, gu[o]);
            if (!l) {
                i = !1;
                const c = Fx[o] || o;
                r += `${c}(${u}) `;
            }
            n && (t[o] = u);
        }
    }
    return ((r = r.trim()), n ? (r = n(t, i ? '' : r)) : i && (r = 'none'), r);
}
function yu(e, t, n) {
    const { style: r, vars: i, transformOrigin: s } = e;
    let o = !1,
        a = !1;
    for (const l in t) {
        const u = t[l];
        if (xn.has(l)) {
            o = !0;
            continue;
        } else if (pm(l)) {
            i[l] = u;
            continue;
        } else {
            const c = mm(u, gu[l]);
            l.startsWith('origin') ? ((a = !0), (s[l] = c)) : (r[l] = c);
        }
    }
    if (
        (t.transform ||
            (o || n
                ? (r.transform = Bx(t, e.transform, n))
                : r.transform && (r.transform = 'none')),
        a)
    ) {
        const { originX: l = '50%', originY: u = '50%', originZ: c = 0 } = s;
        r.transformOrigin = `${l} ${u} ${c}`;
    }
}
const $x = { offset: 'stroke-dashoffset', array: 'stroke-dasharray' },
    Ux = { offset: 'strokeDashoffset', array: 'strokeDasharray' };
function Hx(e, t, n = 1, r = 0, i = !0) {
    e.pathLength = 1;
    const s = i ? $x : Ux;
    e[s.offset] = M.transform(-r);
    const o = M.transform(t),
        a = M.transform(n);
    e[s.array] = `${o} ${a}`;
}
function xd(e, t, n) {
    return typeof e == 'string' ? e : M.transform(t + n * e);
}
function Wx(e, t, n) {
    const r = xd(t, e.x, e.width),
        i = xd(n, e.y, e.height);
    return `${r} ${i}`;
}
function vu(
    e,
    {
        attrX: t,
        attrY: n,
        attrScale: r,
        originX: i,
        originY: s,
        pathLength: o,
        pathSpacing: a = 1,
        pathOffset: l = 0,
        ...u
    },
    c,
    d,
) {
    if ((yu(e, u, d), c)) {
        e.style.viewBox && (e.attrs.viewBox = e.style.viewBox);
        return;
    }
    ((e.attrs = e.style), (e.style = {}));
    const { attrs: f, style: m, dimensions: v } = e;
    (f.transform && (v && (m.transform = f.transform), delete f.transform),
        v &&
            (i !== void 0 || s !== void 0 || m.transform) &&
            (m.transformOrigin = Wx(v, i !== void 0 ? i : 0.5, s !== void 0 ? s : 0.5)),
        t !== void 0 && (f.x = t),
        n !== void 0 && (f.y = n),
        r !== void 0 && (f.scale = r),
        o !== void 0 && Hx(f, o, a, l, !1));
}
const xu = () => ({ style: {}, transform: {}, transformOrigin: {}, vars: {} }),
    gm = () => ({ ...xu(), attrs: {} }),
    wu = (e) => typeof e == 'string' && e.toLowerCase() === 'svg';
function ym(e, { style: t, vars: n }, r, i) {
    Object.assign(e.style, t, i && i.getProjectionStyles(r));
    for (const s in n) e.style.setProperty(s, n[s]);
}
const vm = new Set([
    'baseFrequency',
    'diffuseConstant',
    'kernelMatrix',
    'kernelUnitLength',
    'keySplines',
    'keyTimes',
    'limitingConeAngle',
    'markerHeight',
    'markerWidth',
    'numOctaves',
    'targetX',
    'targetY',
    'surfaceScale',
    'specularConstant',
    'specularExponent',
    'stdDeviation',
    'tableValues',
    'viewBox',
    'gradientTransform',
    'pathLength',
    'startOffset',
    'textLength',
    'lengthAdjust',
]);
function xm(e, t, n, r) {
    ym(e, t, void 0, r);
    for (const i in t.attrs) e.setAttribute(vm.has(i) ? i : du(i), t.attrs[i]);
}
const Ds = {};
function Kx(e) {
    Object.assign(Ds, e);
}
function wm(e, { layout: t, layoutId: n }) {
    return (
        xn.has(e) || e.startsWith('origin') || ((t || n !== void 0) && (!!Ds[e] || e === 'opacity'))
    );
}
function Su(e, t, n) {
    var r;
    const { style: i } = e,
        s = {};
    for (const o in i)
        (ke(i[o]) ||
            (t.style && ke(t.style[o])) ||
            wm(o, e) ||
            ((r = n == null ? void 0 : n.getValue(o)) === null || r === void 0
                ? void 0
                : r.liveStyle) !== void 0) &&
            (s[o] = i[o]);
    return s;
}
function Sm(e, t, n) {
    const r = Su(e, t, n);
    for (const i in e)
        if (ke(e[i]) || ke(t[i])) {
            const s =
                lr.indexOf(i) !== -1 ? 'attr' + i.charAt(0).toUpperCase() + i.substring(1) : i;
            r[s] = e[i];
        }
    return r;
}
function Gx(e, t) {
    try {
        t.dimensions = typeof e.getBBox == 'function' ? e.getBBox() : e.getBoundingClientRect();
    } catch {
        t.dimensions = { x: 0, y: 0, width: 0, height: 0 };
    }
}
const wd = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r'],
    Qx = {
        useVisualState: fm({
            scrapeMotionValuesFromProps: Sm,
            createRenderState: gm,
            onUpdate: ({ props: e, prevProps: t, current: n, renderState: r, latestValues: i }) => {
                if (!n) return;
                let s = !!e.drag;
                if (!s) {
                    for (const a in i)
                        if (xn.has(a)) {
                            s = !0;
                            break;
                        }
                }
                if (!s) return;
                let o = !t;
                if (t)
                    for (let a = 0; a < wd.length; a++) {
                        const l = wd[a];
                        e[l] !== t[l] && (o = !0);
                    }
                o &&
                    Y.read(() => {
                        (Gx(n, r),
                            Y.render(() => {
                                (vu(r, i, wu(n.tagName), e.transformTemplate), xm(n, r));
                            }));
                    });
            },
        }),
    },
    Yx = { useVisualState: fm({ scrapeMotionValuesFromProps: Su, createRenderState: xu }) };
function km(e, t, n) {
    for (const r in t) !ke(t[r]) && !wm(r, n) && (e[r] = t[r]);
}
function Xx({ transformTemplate: e }, t) {
    return L.useMemo(() => {
        const n = xu();
        return (yu(n, t, e), Object.assign({}, n.vars, n.style));
    }, [t]);
}
function Zx(e, t) {
    const n = e.style || {},
        r = {};
    return (km(r, n, e), Object.assign(r, Xx(e, t)), r);
}
function qx(e, t) {
    const n = {},
        r = Zx(e, t);
    return (
        e.drag &&
            e.dragListener !== !1 &&
            ((n.draggable = !1),
            (r.userSelect = r.WebkitUserSelect = r.WebkitTouchCallout = 'none'),
            (r.touchAction = e.drag === !0 ? 'none' : `pan-${e.drag === 'x' ? 'y' : 'x'}`)),
        e.tabIndex === void 0 && (e.onTap || e.onTapStart || e.whileTap) && (n.tabIndex = 0),
        (n.style = r),
        n
    );
}
function Jx(e, t, n, r) {
    const i = L.useMemo(() => {
        const s = gm();
        return (vu(s, t, wu(r), e.transformTemplate), { ...s.attrs, style: { ...s.style } });
    }, [t]);
    if (e.style) {
        const s = {};
        (km(s, e.style, e), (i.style = { ...s, ...i.style }));
    }
    return i;
}
function e1(e = !1) {
    return (n, r, i, { latestValues: s }, o) => {
        const l = (hu(n) ? Jx : qx)(r, s, o, n),
            u = mx(r, typeof n == 'string', e),
            c = n !== L.Fragment ? { ...u, ...l, ref: i } : {},
            { children: d } = r,
            f = L.useMemo(() => (ke(d) ? d.get() : d), [d]);
        return L.createElement(n, { ...c, children: f });
    };
}
function t1(e, t) {
    return function (r, { forwardMotionProps: i } = { forwardMotionProps: !1 }) {
        const o = {
            ...(hu(r) ? Qx : Yx),
            preloadedFeatures: e,
            useRender: e1(i),
            createVisualElement: t,
            Component: r,
        };
        return Px(o);
    };
}
function Cm(e, t) {
    if (!Array.isArray(t)) return !1;
    const n = t.length;
    if (n !== e.length) return !1;
    for (let r = 0; r < n; r++) if (t[r] !== e[r]) return !1;
    return !0;
}
function oo(e, t, n) {
    const r = e.getProps();
    return pu(r, t, n !== void 0 ? n : r.custom, e);
}
const n1 = lu(() => window.ScrollTimeline !== void 0);
class r1 {
    constructor(t) {
        ((this.stop = () => this.runAll('stop')), (this.animations = t.filter(Boolean)));
    }
    get finished() {
        return Promise.all(this.animations.map((t) => ('finished' in t ? t.finished : t)));
    }
    getAll(t) {
        return this.animations[0][t];
    }
    setAll(t, n) {
        for (let r = 0; r < this.animations.length; r++) this.animations[r][t] = n;
    }
    attachTimeline(t, n) {
        const r = this.animations.map((i) => {
            if (n1() && i.attachTimeline) return i.attachTimeline(t);
            if (typeof n == 'function') return n(i);
        });
        return () => {
            r.forEach((i, s) => {
                (i && i(), this.animations[s].stop());
            });
        };
    }
    get time() {
        return this.getAll('time');
    }
    set time(t) {
        this.setAll('time', t);
    }
    get speed() {
        return this.getAll('speed');
    }
    set speed(t) {
        this.setAll('speed', t);
    }
    get startTime() {
        return this.getAll('startTime');
    }
    get duration() {
        let t = 0;
        for (let n = 0; n < this.animations.length; n++)
            t = Math.max(t, this.animations[n].duration);
        return t;
    }
    runAll(t) {
        this.animations.forEach((n) => n[t]());
    }
    flatten() {
        this.runAll('flatten');
    }
    play() {
        this.runAll('play');
    }
    pause() {
        this.runAll('pause');
    }
    cancel() {
        this.runAll('cancel');
    }
    complete() {
        this.runAll('complete');
    }
}
class i1 extends r1 {
    then(t, n) {
        return Promise.all(this.animations).then(t).catch(n);
    }
}
function ku(e, t) {
    return e ? e[t] || e.default || e : void 0;
}
const Ya = 2e4;
function Pm(e) {
    let t = 0;
    const n = 50;
    let r = e.next(t);
    for (; !r.done && t < Ya; ) ((t += n), (r = e.next(t)));
    return t >= Ya ? 1 / 0 : t;
}
function Cu(e) {
    return typeof e == 'function';
}
function Sd(e, t) {
    ((e.timeline = t), (e.onfinish = null));
}
const Pu = (e) => Array.isArray(e) && typeof e[0] == 'number',
    s1 = { linearEasing: void 0 };
function o1(e, t) {
    const n = lu(e);
    return () => {
        var r;
        return (r = s1[t]) !== null && r !== void 0 ? r : n();
    };
}
const Ms = o1(() => {
        try {
            document.createElement('div').animate({ opacity: 0 }, { easing: 'linear(0, 1)' });
        } catch {
            return !1;
        }
        return !0;
    }, 'linearEasing'),
    Tm = (e, t, n = 10) => {
        let r = '';
        const i = Math.max(Math.round(t / n), 2);
        for (let s = 0; s < i; s++) r += e(nr(0, i - 1, s)) + ', ';
        return `linear(${r.substring(0, r.length - 2)})`;
    };
function Em(e) {
    return !!(
        (typeof e == 'function' && Ms()) ||
        !e ||
        (typeof e == 'string' && (e in Xa || Ms())) ||
        Pu(e) ||
        (Array.isArray(e) && e.every(Em))
    );
}
const Pr = ([e, t, n, r]) => `cubic-bezier(${e}, ${t}, ${n}, ${r})`,
    Xa = {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        circIn: Pr([0, 0.65, 0.55, 1]),
        circOut: Pr([0.55, 0, 1, 0.45]),
        backIn: Pr([0.31, 0.01, 0.66, -0.59]),
        backOut: Pr([0.33, 1.53, 0.69, 0.99]),
    };
function Nm(e, t) {
    if (e)
        return typeof e == 'function' && Ms()
            ? Tm(e, t)
            : Pu(e)
              ? Pr(e)
              : Array.isArray(e)
                ? e.map((n) => Nm(n, t) || Xa.easeOut)
                : Xa[e];
}
const Ze = { x: !1, y: !1 };
function Lm() {
    return Ze.x || Ze.y;
}
function a1(e, t, n) {
    var r;
    if (e instanceof Element) return [e];
    if (typeof e == 'string') {
        let i = document;
        const s = (r = void 0) !== null && r !== void 0 ? r : i.querySelectorAll(e);
        return s ? Array.from(s) : [];
    }
    return Array.from(e);
}
function jm(e, t) {
    const n = a1(e),
        r = new AbortController(),
        i = { passive: !0, ...t, signal: r.signal };
    return [n, i, () => r.abort()];
}
function kd(e) {
    return (t) => {
        t.pointerType === 'touch' || Lm() || e(t);
    };
}
function l1(e, t, n = {}) {
    const [r, i, s] = jm(e, n),
        o = kd((a) => {
            const { target: l } = a,
                u = t(a);
            if (typeof u != 'function' || !l) return;
            const c = kd((d) => {
                (u(d), l.removeEventListener('pointerleave', c));
            });
            l.addEventListener('pointerleave', c, i);
        });
    return (
        r.forEach((a) => {
            a.addEventListener('pointerenter', o, i);
        }),
        s
    );
}
const Rm = (e, t) => (t ? (e === t ? !0 : Rm(e, t.parentElement)) : !1),
    Tu = (e) =>
        e.pointerType === 'mouse'
            ? typeof e.button != 'number' || e.button <= 0
            : e.isPrimary !== !1,
    u1 = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']);
function c1(e) {
    return u1.has(e.tagName) || e.tabIndex !== -1;
}
const Tr = new WeakSet();
function Cd(e) {
    return (t) => {
        t.key === 'Enter' && e(t);
    };
}
function Fo(e, t) {
    e.dispatchEvent(new PointerEvent('pointer' + t, { isPrimary: !0, bubbles: !0 }));
}
const d1 = (e, t) => {
    const n = e.currentTarget;
    if (!n) return;
    const r = Cd(() => {
        if (Tr.has(n)) return;
        Fo(n, 'down');
        const i = Cd(() => {
                Fo(n, 'up');
            }),
            s = () => Fo(n, 'cancel');
        (n.addEventListener('keyup', i, t), n.addEventListener('blur', s, t));
    });
    (n.addEventListener('keydown', r, t),
        n.addEventListener('blur', () => n.removeEventListener('keydown', r), t));
};
function Pd(e) {
    return Tu(e) && !Lm();
}
function f1(e, t, n = {}) {
    const [r, i, s] = jm(e, n),
        o = (a) => {
            const l = a.currentTarget;
            if (!Pd(a) || Tr.has(l)) return;
            Tr.add(l);
            const u = t(a),
                c = (m, v) => {
                    (window.removeEventListener('pointerup', d),
                        window.removeEventListener('pointercancel', f),
                        !(!Pd(m) || !Tr.has(l)) &&
                            (Tr.delete(l), typeof u == 'function' && u(m, { success: v })));
                },
                d = (m) => {
                    c(m, n.useGlobalTarget || Rm(l, m.target));
                },
                f = (m) => {
                    c(m, !1);
                };
            (window.addEventListener('pointerup', d, i),
                window.addEventListener('pointercancel', f, i));
        };
    return (
        r.forEach((a) => {
            (!c1(a) && a.getAttribute('tabindex') === null && (a.tabIndex = 0),
                (n.useGlobalTarget ? window : a).addEventListener('pointerdown', o, i),
                a.addEventListener('focus', (u) => d1(u, i), i));
        }),
        s
    );
}
function h1(e) {
    return e === 'x' || e === 'y'
        ? Ze[e]
            ? null
            : ((Ze[e] = !0),
              () => {
                  Ze[e] = !1;
              })
        : Ze.x || Ze.y
          ? null
          : ((Ze.x = Ze.y = !0),
            () => {
                Ze.x = Ze.y = !1;
            });
}
const Am = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', ...lr]);
let ns;
function p1() {
    ns = void 0;
}
const ht = {
    now: () => (
        ns === void 0 &&
            ht.set(me.isProcessing || ux.useManualTiming ? me.timestamp : performance.now()),
        ns
    ),
    set: (e) => {
        ((ns = e), queueMicrotask(p1));
    },
};
function Eu(e, t) {
    e.indexOf(t) === -1 && e.push(t);
}
function Nu(e, t) {
    const n = e.indexOf(t);
    n > -1 && e.splice(n, 1);
}
class Lu {
    constructor() {
        this.subscriptions = [];
    }
    add(t) {
        return (Eu(this.subscriptions, t), () => Nu(this.subscriptions, t));
    }
    notify(t, n, r) {
        const i = this.subscriptions.length;
        if (i)
            if (i === 1) this.subscriptions[0](t, n, r);
            else
                for (let s = 0; s < i; s++) {
                    const o = this.subscriptions[s];
                    o && o(t, n, r);
                }
    }
    getSize() {
        return this.subscriptions.length;
    }
    clear() {
        this.subscriptions.length = 0;
    }
}
function Dm(e, t) {
    return t ? e * (1e3 / t) : 0;
}
const Td = 30,
    m1 = (e) => !isNaN(parseFloat(e));
class g1 {
    constructor(t, n = {}) {
        ((this.version = '11.18.2'),
            (this.canTrackVelocity = null),
            (this.events = {}),
            (this.updateAndNotify = (r, i = !0) => {
                const s = ht.now();
                (this.updatedAt !== s && this.setPrevFrameValue(),
                    (this.prev = this.current),
                    this.setCurrent(r),
                    this.current !== this.prev &&
                        this.events.change &&
                        this.events.change.notify(this.current),
                    i &&
                        this.events.renderRequest &&
                        this.events.renderRequest.notify(this.current));
            }),
            (this.hasAnimated = !1),
            this.setCurrent(t),
            (this.owner = n.owner));
    }
    setCurrent(t) {
        ((this.current = t),
            (this.updatedAt = ht.now()),
            this.canTrackVelocity === null &&
                t !== void 0 &&
                (this.canTrackVelocity = m1(this.current)));
    }
    setPrevFrameValue(t = this.current) {
        ((this.prevFrameValue = t), (this.prevUpdatedAt = this.updatedAt));
    }
    onChange(t) {
        return this.on('change', t);
    }
    on(t, n) {
        this.events[t] || (this.events[t] = new Lu());
        const r = this.events[t].add(n);
        return t === 'change'
            ? () => {
                  (r(),
                      Y.read(() => {
                          this.events.change.getSize() || this.stop();
                      }));
              }
            : r;
    }
    clearListeners() {
        for (const t in this.events) this.events[t].clear();
    }
    attach(t, n) {
        ((this.passiveEffect = t), (this.stopPassiveEffect = n));
    }
    set(t, n = !0) {
        !n || !this.passiveEffect
            ? this.updateAndNotify(t, n)
            : this.passiveEffect(t, this.updateAndNotify);
    }
    setWithVelocity(t, n, r) {
        (this.set(n),
            (this.prev = void 0),
            (this.prevFrameValue = t),
            (this.prevUpdatedAt = this.updatedAt - r));
    }
    jump(t, n = !0) {
        (this.updateAndNotify(t),
            (this.prev = t),
            (this.prevUpdatedAt = this.prevFrameValue = void 0),
            n && this.stop(),
            this.stopPassiveEffect && this.stopPassiveEffect());
    }
    get() {
        return this.current;
    }
    getPrevious() {
        return this.prev;
    }
    getVelocity() {
        const t = ht.now();
        if (!this.canTrackVelocity || this.prevFrameValue === void 0 || t - this.updatedAt > Td)
            return 0;
        const n = Math.min(this.updatedAt - this.prevUpdatedAt, Td);
        return Dm(parseFloat(this.current) - parseFloat(this.prevFrameValue), n);
    }
    start(t) {
        return (
            this.stop(),
            new Promise((n) => {
                ((this.hasAnimated = !0),
                    (this.animation = t(n)),
                    this.events.animationStart && this.events.animationStart.notify());
            }).then(() => {
                (this.events.animationComplete && this.events.animationComplete.notify(),
                    this.clearAnimation());
            })
        );
    }
    stop() {
        (this.animation &&
            (this.animation.stop(),
            this.events.animationCancel && this.events.animationCancel.notify()),
            this.clearAnimation());
    }
    isAnimating() {
        return !!this.animation;
    }
    clearAnimation() {
        delete this.animation;
    }
    destroy() {
        (this.clearListeners(), this.stop(), this.stopPassiveEffect && this.stopPassiveEffect());
    }
}
function li(e, t) {
    return new g1(e, t);
}
function y1(e, t, n) {
    e.hasValue(t) ? e.getValue(t).set(n) : e.addValue(t, li(n));
}
function v1(e, t) {
    const n = oo(e, t);
    let { transitionEnd: r = {}, transition: i = {}, ...s } = n || {};
    s = { ...s, ...r };
    for (const o in s) {
        const a = Rx(s[o]);
        y1(e, o, a);
    }
}
function x1(e) {
    return !!(ke(e) && e.add);
}
function Za(e, t) {
    const n = e.getValue('willChange');
    if (x1(n)) return n.add(t);
}
function Mm(e) {
    return e.props[um];
}
const Om = (e, t, n) => (((1 - 3 * n + 3 * t) * e + (3 * n - 6 * t)) * e + 3 * t) * e,
    w1 = 1e-7,
    S1 = 12;
function k1(e, t, n, r, i) {
    let s,
        o,
        a = 0;
    do ((o = t + (n - t) / 2), (s = Om(o, r, i) - e), s > 0 ? (n = o) : (t = o));
    while (Math.abs(s) > w1 && ++a < S1);
    return o;
}
function yi(e, t, n, r) {
    if (e === t && n === r) return _e;
    const i = (s) => k1(s, 0, 1, e, n);
    return (s) => (s === 0 || s === 1 ? s : Om(i(s), t, r));
}
const Vm = (e) => (t) => (t <= 0.5 ? e(2 * t) / 2 : (2 - e(2 * (1 - t))) / 2),
    bm = (e) => (t) => 1 - e(1 - t),
    _m = yi(0.33, 1.53, 0.69, 0.99),
    ju = bm(_m),
    Im = Vm(ju),
    Fm = (e) => ((e *= 2) < 1 ? 0.5 * ju(e) : 0.5 * (2 - Math.pow(2, -10 * (e - 1)))),
    Ru = (e) => 1 - Math.sin(Math.acos(e)),
    zm = bm(Ru),
    Bm = Vm(Ru),
    $m = (e) => /^0[^.\s]+$/u.test(e);
function C1(e) {
    return typeof e == 'number' ? e === 0 : e !== null ? e === 'none' || e === '0' || $m(e) : !0;
}
const Ir = (e) => Math.round(e * 1e5) / 1e5,
    Au = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function P1(e) {
    return e == null;
}
const T1 =
        /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu,
    Du = (e, t) => (n) =>
        !!(
            (typeof n == 'string' && T1.test(n) && n.startsWith(e)) ||
            (t && !P1(n) && Object.prototype.hasOwnProperty.call(n, t))
        ),
    Um = (e, t, n) => (r) => {
        if (typeof r != 'string') return r;
        const [i, s, o, a] = r.match(Au);
        return {
            [e]: parseFloat(i),
            [t]: parseFloat(s),
            [n]: parseFloat(o),
            alpha: a !== void 0 ? parseFloat(a) : 1,
        };
    },
    E1 = (e) => Tt(0, 255, e),
    zo = { ...ur, transform: (e) => Math.round(E1(e)) },
    an = {
        test: Du('rgb', 'red'),
        parse: Um('red', 'green', 'blue'),
        transform: ({ red: e, green: t, blue: n, alpha: r = 1 }) =>
            'rgba(' +
            zo.transform(e) +
            ', ' +
            zo.transform(t) +
            ', ' +
            zo.transform(n) +
            ', ' +
            Ir(ai.transform(r)) +
            ')',
    };
function N1(e) {
    let t = '',
        n = '',
        r = '',
        i = '';
    return (
        e.length > 5
            ? ((t = e.substring(1, 3)),
              (n = e.substring(3, 5)),
              (r = e.substring(5, 7)),
              (i = e.substring(7, 9)))
            : ((t = e.substring(1, 2)),
              (n = e.substring(2, 3)),
              (r = e.substring(3, 4)),
              (i = e.substring(4, 5)),
              (t += t),
              (n += n),
              (r += r),
              (i += i)),
        {
            red: parseInt(t, 16),
            green: parseInt(n, 16),
            blue: parseInt(r, 16),
            alpha: i ? parseInt(i, 16) / 255 : 1,
        }
    );
}
const qa = { test: Du('#'), parse: N1, transform: an.transform },
    In = {
        test: Du('hsl', 'hue'),
        parse: Um('hue', 'saturation', 'lightness'),
        transform: ({ hue: e, saturation: t, lightness: n, alpha: r = 1 }) =>
            'hsla(' +
            Math.round(e) +
            ', ' +
            ft.transform(Ir(t)) +
            ', ' +
            ft.transform(Ir(n)) +
            ', ' +
            Ir(ai.transform(r)) +
            ')',
    },
    we = {
        test: (e) => an.test(e) || qa.test(e) || In.test(e),
        parse: (e) => (an.test(e) ? an.parse(e) : In.test(e) ? In.parse(e) : qa.parse(e)),
        transform: (e) =>
            typeof e == 'string' ? e : e.hasOwnProperty('red') ? an.transform(e) : In.transform(e),
    },
    L1 =
        /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
function j1(e) {
    var t, n;
    return (
        isNaN(e) &&
        typeof e == 'string' &&
        (((t = e.match(Au)) === null || t === void 0 ? void 0 : t.length) || 0) +
            (((n = e.match(L1)) === null || n === void 0 ? void 0 : n.length) || 0) >
            0
    );
}
const Hm = 'number',
    Wm = 'color',
    R1 = 'var',
    A1 = 'var(',
    Ed = '${}',
    D1 =
        /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function ui(e) {
    const t = e.toString(),
        n = [],
        r = { color: [], number: [], var: [] },
        i = [];
    let s = 0;
    const a = t
        .replace(
            D1,
            (l) => (
                we.test(l)
                    ? (r.color.push(s), i.push(Wm), n.push(we.parse(l)))
                    : l.startsWith(A1)
                      ? (r.var.push(s), i.push(R1), n.push(l))
                      : (r.number.push(s), i.push(Hm), n.push(parseFloat(l))),
                ++s,
                Ed
            ),
        )
        .split(Ed);
    return { values: n, split: a, indexes: r, types: i };
}
function Km(e) {
    return ui(e).values;
}
function Gm(e) {
    const { split: t, types: n } = ui(e),
        r = t.length;
    return (i) => {
        let s = '';
        for (let o = 0; o < r; o++)
            if (((s += t[o]), i[o] !== void 0)) {
                const a = n[o];
                a === Hm ? (s += Ir(i[o])) : a === Wm ? (s += we.transform(i[o])) : (s += i[o]);
            }
        return s;
    };
}
const M1 = (e) => (typeof e == 'number' ? 0 : e);
function O1(e) {
    const t = Km(e);
    return Gm(e)(t.map(M1));
}
const Kt = { test: j1, parse: Km, createTransformer: Gm, getAnimatableNone: O1 },
    V1 = new Set(['brightness', 'contrast', 'saturate', 'opacity']);
function b1(e) {
    const [t, n] = e.slice(0, -1).split('(');
    if (t === 'drop-shadow') return e;
    const [r] = n.match(Au) || [];
    if (!r) return e;
    const i = n.replace(r, '');
    let s = V1.has(t) ? 1 : 0;
    return (r !== n && (s *= 100), t + '(' + s + i + ')');
}
const _1 = /\b([a-z-]*)\(.*?\)/gu,
    Ja = {
        ...Kt,
        getAnimatableNone: (e) => {
            const t = e.match(_1);
            return t ? t.map(b1).join(' ') : e;
        },
    },
    I1 = {
        ...gu,
        color: we,
        backgroundColor: we,
        outlineColor: we,
        fill: we,
        stroke: we,
        borderColor: we,
        borderTopColor: we,
        borderRightColor: we,
        borderBottomColor: we,
        borderLeftColor: we,
        filter: Ja,
        WebkitFilter: Ja,
    },
    Mu = (e) => I1[e];
function Qm(e, t) {
    let n = Mu(e);
    return (n !== Ja && (n = Kt), n.getAnimatableNone ? n.getAnimatableNone(t) : void 0);
}
const F1 = new Set(['auto', 'none', '0']);
function z1(e, t, n) {
    let r = 0,
        i;
    for (; r < e.length && !i; ) {
        const s = e[r];
        (typeof s == 'string' && !F1.has(s) && ui(s).values.length && (i = e[r]), r++);
    }
    if (i && n) for (const s of t) e[s] = Qm(n, i);
}
const Nd = (e) => e === ur || e === M,
    Ld = (e, t) => parseFloat(e.split(', ')[t]),
    jd =
        (e, t) =>
        (n, { transform: r }) => {
            if (r === 'none' || !r) return 0;
            const i = r.match(/^matrix3d\((.+)\)$/u);
            if (i) return Ld(i[1], t);
            {
                const s = r.match(/^matrix\((.+)\)$/u);
                return s ? Ld(s[1], e) : 0;
            }
        },
    B1 = new Set(['x', 'y', 'z']),
    $1 = lr.filter((e) => !B1.has(e));
function U1(e) {
    const t = [];
    return (
        $1.forEach((n) => {
            const r = e.getValue(n);
            r !== void 0 && (t.push([n, r.get()]), r.set(n.startsWith('scale') ? 1 : 0));
        }),
        t
    );
}
const ir = {
    width: ({ x: e }, { paddingLeft: t = '0', paddingRight: n = '0' }) =>
        e.max - e.min - parseFloat(t) - parseFloat(n),
    height: ({ y: e }, { paddingTop: t = '0', paddingBottom: n = '0' }) =>
        e.max - e.min - parseFloat(t) - parseFloat(n),
    top: (e, { top: t }) => parseFloat(t),
    left: (e, { left: t }) => parseFloat(t),
    bottom: ({ y: e }, { top: t }) => parseFloat(t) + (e.max - e.min),
    right: ({ x: e }, { left: t }) => parseFloat(t) + (e.max - e.min),
    x: jd(4, 13),
    y: jd(5, 14),
};
ir.translateX = ir.x;
ir.translateY = ir.y;
const cn = new Set();
let el = !1,
    tl = !1;
function Ym() {
    if (tl) {
        const e = Array.from(cn).filter((r) => r.needsMeasurement),
            t = new Set(e.map((r) => r.element)),
            n = new Map();
        (t.forEach((r) => {
            const i = U1(r);
            i.length && (n.set(r, i), r.render());
        }),
            e.forEach((r) => r.measureInitialState()),
            t.forEach((r) => {
                r.render();
                const i = n.get(r);
                i &&
                    i.forEach(([s, o]) => {
                        var a;
                        (a = r.getValue(s)) === null || a === void 0 || a.set(o);
                    });
            }),
            e.forEach((r) => r.measureEndState()),
            e.forEach((r) => {
                r.suspendedScrollY !== void 0 && window.scrollTo(0, r.suspendedScrollY);
            }));
    }
    ((tl = !1), (el = !1), cn.forEach((e) => e.complete()), cn.clear());
}
function Xm() {
    cn.forEach((e) => {
        (e.readKeyframes(), e.needsMeasurement && (tl = !0));
    });
}
function H1() {
    (Xm(), Ym());
}
class Ou {
    constructor(t, n, r, i, s, o = !1) {
        ((this.isComplete = !1),
            (this.isAsync = !1),
            (this.needsMeasurement = !1),
            (this.isScheduled = !1),
            (this.unresolvedKeyframes = [...t]),
            (this.onComplete = n),
            (this.name = r),
            (this.motionValue = i),
            (this.element = s),
            (this.isAsync = o));
    }
    scheduleResolve() {
        ((this.isScheduled = !0),
            this.isAsync
                ? (cn.add(this), el || ((el = !0), Y.read(Xm), Y.resolveKeyframes(Ym)))
                : (this.readKeyframes(), this.complete()));
    }
    readKeyframes() {
        const { unresolvedKeyframes: t, name: n, element: r, motionValue: i } = this;
        for (let s = 0; s < t.length; s++)
            if (t[s] === null)
                if (s === 0) {
                    const o = i == null ? void 0 : i.get(),
                        a = t[t.length - 1];
                    if (o !== void 0) t[0] = o;
                    else if (r && n) {
                        const l = r.readValue(n, a);
                        l != null && (t[0] = l);
                    }
                    (t[0] === void 0 && (t[0] = a), i && o === void 0 && i.set(t[0]));
                } else t[s] = t[s - 1];
    }
    setFinalKeyframe() {}
    measureInitialState() {}
    renderEndStyles() {}
    measureEndState() {}
    complete() {
        ((this.isComplete = !0),
            this.onComplete(this.unresolvedKeyframes, this.finalKeyframe),
            cn.delete(this));
    }
    cancel() {
        this.isComplete || ((this.isScheduled = !1), cn.delete(this));
    }
    resume() {
        this.isComplete || this.scheduleResolve();
    }
}
const Zm = (e) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(e),
    W1 = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function K1(e) {
    const t = W1.exec(e);
    if (!t) return [,];
    const [, n, r, i] = t;
    return [`--${n ?? r}`, i];
}
function qm(e, t, n = 1) {
    const [r, i] = K1(e);
    if (!r) return;
    const s = window.getComputedStyle(t).getPropertyValue(r);
    if (s) {
        const o = s.trim();
        return Zm(o) ? parseFloat(o) : o;
    }
    return mu(i) ? qm(i, t, n + 1) : i;
}
const Jm = (e) => (t) => t.test(e),
    G1 = { test: (e) => e === 'auto', parse: (e) => e },
    eg = [ur, M, ft, Lt, bx, Vx, G1],
    Rd = (e) => eg.find(Jm(e));
class tg extends Ou {
    constructor(t, n, r, i, s) {
        super(t, n, r, i, s, !0);
    }
    readKeyframes() {
        const { unresolvedKeyframes: t, element: n, name: r } = this;
        if (!n || !n.current) return;
        super.readKeyframes();
        for (let l = 0; l < t.length; l++) {
            let u = t[l];
            if (typeof u == 'string' && ((u = u.trim()), mu(u))) {
                const c = qm(u, n.current);
                (c !== void 0 && (t[l] = c), l === t.length - 1 && (this.finalKeyframe = u));
            }
        }
        if ((this.resolveNoneKeyframes(), !Am.has(r) || t.length !== 2)) return;
        const [i, s] = t,
            o = Rd(i),
            a = Rd(s);
        if (o !== a)
            if (Nd(o) && Nd(a))
                for (let l = 0; l < t.length; l++) {
                    const u = t[l];
                    typeof u == 'string' && (t[l] = parseFloat(u));
                }
            else this.needsMeasurement = !0;
    }
    resolveNoneKeyframes() {
        const { unresolvedKeyframes: t, name: n } = this,
            r = [];
        for (let i = 0; i < t.length; i++) C1(t[i]) && r.push(i);
        r.length && z1(t, r, n);
    }
    measureInitialState() {
        const { element: t, unresolvedKeyframes: n, name: r } = this;
        if (!t || !t.current) return;
        (r === 'height' && (this.suspendedScrollY = window.pageYOffset),
            (this.measuredOrigin = ir[r](
                t.measureViewportBox(),
                window.getComputedStyle(t.current),
            )),
            (n[0] = this.measuredOrigin));
        const i = n[n.length - 1];
        i !== void 0 && t.getValue(r, i).jump(i, !1);
    }
    measureEndState() {
        var t;
        const { element: n, name: r, unresolvedKeyframes: i } = this;
        if (!n || !n.current) return;
        const s = n.getValue(r);
        s && s.jump(this.measuredOrigin, !1);
        const o = i.length - 1,
            a = i[o];
        ((i[o] = ir[r](n.measureViewportBox(), window.getComputedStyle(n.current))),
            a !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = a),
            !((t = this.removedTransforms) === null || t === void 0) &&
                t.length &&
                this.removedTransforms.forEach(([l, u]) => {
                    n.getValue(l).set(u);
                }),
            this.resolveNoneKeyframes());
    }
}
const Ad = (e, t) =>
    t === 'zIndex'
        ? !1
        : !!(
              typeof e == 'number' ||
              Array.isArray(e) ||
              (typeof e == 'string' && (Kt.test(e) || e === '0') && !e.startsWith('url('))
          );
function Q1(e) {
    const t = e[0];
    if (e.length === 1) return !0;
    for (let n = 0; n < e.length; n++) if (e[n] !== t) return !0;
}
function Y1(e, t, n, r) {
    const i = e[0];
    if (i === null) return !1;
    if (t === 'display' || t === 'visibility') return !0;
    const s = e[e.length - 1],
        o = Ad(i, t),
        a = Ad(s, t);
    return !o || !a ? !1 : Q1(e) || ((n === 'spring' || Cu(n)) && r);
}
const X1 = (e) => e !== null;
function ao(e, { repeat: t, repeatType: n = 'loop' }, r) {
    const i = e.filter(X1),
        s = t && n !== 'loop' && t % 2 === 1 ? 0 : i.length - 1;
    return !s || r === void 0 ? i[s] : r;
}
const Z1 = 40;
class ng {
    constructor({
        autoplay: t = !0,
        delay: n = 0,
        type: r = 'keyframes',
        repeat: i = 0,
        repeatDelay: s = 0,
        repeatType: o = 'loop',
        ...a
    }) {
        ((this.isStopped = !1),
            (this.hasAttemptedResolve = !1),
            (this.createdAt = ht.now()),
            (this.options = {
                autoplay: t,
                delay: n,
                type: r,
                repeat: i,
                repeatDelay: s,
                repeatType: o,
                ...a,
            }),
            this.updateFinishedPromise());
    }
    calcStartTime() {
        return this.resolvedAt
            ? this.resolvedAt - this.createdAt > Z1
                ? this.resolvedAt
                : this.createdAt
            : this.createdAt;
    }
    get resolved() {
        return (!this._resolved && !this.hasAttemptedResolve && H1(), this._resolved);
    }
    onKeyframesResolved(t, n) {
        ((this.resolvedAt = ht.now()), (this.hasAttemptedResolve = !0));
        const {
            name: r,
            type: i,
            velocity: s,
            delay: o,
            onComplete: a,
            onUpdate: l,
            isGenerator: u,
        } = this.options;
        if (!u && !Y1(t, r, i, s))
            if (o) this.options.duration = 0;
            else {
                (l && l(ao(t, this.options, n)), a && a(), this.resolveFinishedPromise());
                return;
            }
        const c = this.initPlayback(t, n);
        c !== !1 &&
            ((this._resolved = { keyframes: t, finalKeyframe: n, ...c }), this.onPostResolved());
    }
    onPostResolved() {}
    then(t, n) {
        return this.currentFinishedPromise.then(t, n);
    }
    flatten() {
        ((this.options.type = 'keyframes'), (this.options.ease = 'linear'));
    }
    updateFinishedPromise() {
        this.currentFinishedPromise = new Promise((t) => {
            this.resolveFinishedPromise = t;
        });
    }
}
const ee = (e, t, n) => e + (t - e) * n;
function Bo(e, t, n) {
    return (
        n < 0 && (n += 1),
        n > 1 && (n -= 1),
        n < 1 / 6
            ? e + (t - e) * 6 * n
            : n < 1 / 2
              ? t
              : n < 2 / 3
                ? e + (t - e) * (2 / 3 - n) * 6
                : e
    );
}
function q1({ hue: e, saturation: t, lightness: n, alpha: r }) {
    ((e /= 360), (t /= 100), (n /= 100));
    let i = 0,
        s = 0,
        o = 0;
    if (!t) i = s = o = n;
    else {
        const a = n < 0.5 ? n * (1 + t) : n + t - n * t,
            l = 2 * n - a;
        ((i = Bo(l, a, e + 1 / 3)), (s = Bo(l, a, e)), (o = Bo(l, a, e - 1 / 3)));
    }
    return {
        red: Math.round(i * 255),
        green: Math.round(s * 255),
        blue: Math.round(o * 255),
        alpha: r,
    };
}
function Os(e, t) {
    return (n) => (n > 0 ? t : e);
}
const $o = (e, t, n) => {
        const r = e * e,
            i = n * (t * t - r) + r;
        return i < 0 ? 0 : Math.sqrt(i);
    },
    J1 = [qa, an, In],
    ew = (e) => J1.find((t) => t.test(e));
function Dd(e) {
    const t = ew(e);
    if (!t) return !1;
    let n = t.parse(e);
    return (t === In && (n = q1(n)), n);
}
const Md = (e, t) => {
        const n = Dd(e),
            r = Dd(t);
        if (!n || !r) return Os(e, t);
        const i = { ...n };
        return (s) => (
            (i.red = $o(n.red, r.red, s)),
            (i.green = $o(n.green, r.green, s)),
            (i.blue = $o(n.blue, r.blue, s)),
            (i.alpha = ee(n.alpha, r.alpha, s)),
            an.transform(i)
        );
    },
    tw = (e, t) => (n) => t(e(n)),
    vi = (...e) => e.reduce(tw),
    nl = new Set(['none', 'hidden']);
function nw(e, t) {
    return nl.has(e) ? (n) => (n <= 0 ? e : t) : (n) => (n >= 1 ? t : e);
}
function rw(e, t) {
    return (n) => ee(e, t, n);
}
function Vu(e) {
    return typeof e == 'number'
        ? rw
        : typeof e == 'string'
          ? mu(e)
              ? Os
              : we.test(e)
                ? Md
                : ow
          : Array.isArray(e)
            ? rg
            : typeof e == 'object'
              ? we.test(e)
                  ? Md
                  : iw
              : Os;
}
function rg(e, t) {
    const n = [...e],
        r = n.length,
        i = e.map((s, o) => Vu(s)(s, t[o]));
    return (s) => {
        for (let o = 0; o < r; o++) n[o] = i[o](s);
        return n;
    };
}
function iw(e, t) {
    const n = { ...e, ...t },
        r = {};
    for (const i in n) e[i] !== void 0 && t[i] !== void 0 && (r[i] = Vu(e[i])(e[i], t[i]));
    return (i) => {
        for (const s in r) n[s] = r[s](i);
        return n;
    };
}
function sw(e, t) {
    var n;
    const r = [],
        i = { color: 0, var: 0, number: 0 };
    for (let s = 0; s < t.values.length; s++) {
        const o = t.types[s],
            a = e.indexes[o][i[o]],
            l = (n = e.values[a]) !== null && n !== void 0 ? n : 0;
        ((r[s] = l), i[o]++);
    }
    return r;
}
const ow = (e, t) => {
    const n = Kt.createTransformer(t),
        r = ui(e),
        i = ui(t);
    return r.indexes.var.length === i.indexes.var.length &&
        r.indexes.color.length === i.indexes.color.length &&
        r.indexes.number.length >= i.indexes.number.length
        ? (nl.has(e) && !i.values.length) || (nl.has(t) && !r.values.length)
            ? nw(e, t)
            : vi(rg(sw(r, i), i.values), n)
        : Os(e, t);
};
function ig(e, t, n) {
    return typeof e == 'number' && typeof t == 'number' && typeof n == 'number'
        ? ee(e, t, n)
        : Vu(e)(e, t);
}
const aw = 5;
function sg(e, t, n) {
    const r = Math.max(t - aw, 0);
    return Dm(n - e(r), t - r);
}
const ie = {
        stiffness: 100,
        damping: 10,
        mass: 1,
        velocity: 0,
        duration: 800,
        bounce: 0.3,
        visualDuration: 0.3,
        restSpeed: { granular: 0.01, default: 2 },
        restDelta: { granular: 0.005, default: 0.5 },
        minDuration: 0.01,
        maxDuration: 10,
        minDamping: 0.05,
        maxDamping: 1,
    },
    Uo = 0.001;
function lw({
    duration: e = ie.duration,
    bounce: t = ie.bounce,
    velocity: n = ie.velocity,
    mass: r = ie.mass,
}) {
    let i,
        s,
        o = 1 - t;
    ((o = Tt(ie.minDamping, ie.maxDamping, o)),
        (e = Tt(ie.minDuration, ie.maxDuration, wt(e))),
        o < 1
            ? ((i = (u) => {
                  const c = u * o,
                      d = c * e,
                      f = c - n,
                      m = rl(u, o),
                      v = Math.exp(-d);
                  return Uo - (f / m) * v;
              }),
              (s = (u) => {
                  const d = u * o * e,
                      f = d * n + n,
                      m = Math.pow(o, 2) * Math.pow(u, 2) * e,
                      v = Math.exp(-d),
                      x = rl(Math.pow(u, 2), o);
                  return ((-i(u) + Uo > 0 ? -1 : 1) * ((f - m) * v)) / x;
              }))
            : ((i = (u) => {
                  const c = Math.exp(-u * e),
                      d = (u - n) * e + 1;
                  return -Uo + c * d;
              }),
              (s = (u) => {
                  const c = Math.exp(-u * e),
                      d = (n - u) * (e * e);
                  return c * d;
              })));
    const a = 5 / e,
        l = cw(i, s, a);
    if (((e = xt(e)), isNaN(l)))
        return { stiffness: ie.stiffness, damping: ie.damping, duration: e };
    {
        const u = Math.pow(l, 2) * r;
        return { stiffness: u, damping: o * 2 * Math.sqrt(r * u), duration: e };
    }
}
const uw = 12;
function cw(e, t, n) {
    let r = n;
    for (let i = 1; i < uw; i++) r = r - e(r) / t(r);
    return r;
}
function rl(e, t) {
    return e * Math.sqrt(1 - t * t);
}
const dw = ['duration', 'bounce'],
    fw = ['stiffness', 'damping', 'mass'];
function Od(e, t) {
    return t.some((n) => e[n] !== void 0);
}
function hw(e) {
    let t = {
        velocity: ie.velocity,
        stiffness: ie.stiffness,
        damping: ie.damping,
        mass: ie.mass,
        isResolvedFromDuration: !1,
        ...e,
    };
    if (!Od(e, fw) && Od(e, dw))
        if (e.visualDuration) {
            const n = e.visualDuration,
                r = (2 * Math.PI) / (n * 1.2),
                i = r * r,
                s = 2 * Tt(0.05, 1, 1 - (e.bounce || 0)) * Math.sqrt(i);
            t = { ...t, mass: ie.mass, stiffness: i, damping: s };
        } else {
            const n = lw(e);
            ((t = { ...t, ...n, mass: ie.mass }), (t.isResolvedFromDuration = !0));
        }
    return t;
}
function og(e = ie.visualDuration, t = ie.bounce) {
    const n = typeof e != 'object' ? { visualDuration: e, keyframes: [0, 1], bounce: t } : e;
    let { restSpeed: r, restDelta: i } = n;
    const s = n.keyframes[0],
        o = n.keyframes[n.keyframes.length - 1],
        a = { done: !1, value: s },
        {
            stiffness: l,
            damping: u,
            mass: c,
            duration: d,
            velocity: f,
            isResolvedFromDuration: m,
        } = hw({ ...n, velocity: -wt(n.velocity || 0) }),
        v = f || 0,
        x = u / (2 * Math.sqrt(l * c)),
        k = o - s,
        p = wt(Math.sqrt(l / c)),
        h = Math.abs(k) < 5;
    (r || (r = h ? ie.restSpeed.granular : ie.restSpeed.default),
        i || (i = h ? ie.restDelta.granular : ie.restDelta.default));
    let y;
    if (x < 1) {
        const S = rl(p, x);
        y = (P) => {
            const E = Math.exp(-x * p * P);
            return o - E * (((v + x * p * k) / S) * Math.sin(S * P) + k * Math.cos(S * P));
        };
    } else if (x === 1) y = (S) => o - Math.exp(-p * S) * (k + (v + p * k) * S);
    else {
        const S = p * Math.sqrt(x * x - 1);
        y = (P) => {
            const E = Math.exp(-x * p * P),
                C = Math.min(S * P, 300);
            return o - (E * ((v + x * p * k) * Math.sinh(C) + S * k * Math.cosh(C))) / S;
        };
    }
    const w = {
        calculatedDuration: (m && d) || null,
        next: (S) => {
            const P = y(S);
            if (m) a.done = S >= d;
            else {
                let E = 0;
                x < 1 && (E = S === 0 ? xt(v) : sg(y, S, P));
                const C = Math.abs(E) <= r,
                    A = Math.abs(o - P) <= i;
                a.done = C && A;
            }
            return ((a.value = a.done ? o : P), a);
        },
        toString: () => {
            const S = Math.min(Pm(w), Ya),
                P = Tm((E) => w.next(S * E).value, S, 30);
            return S + 'ms ' + P;
        },
    };
    return w;
}
function Vd({
    keyframes: e,
    velocity: t = 0,
    power: n = 0.8,
    timeConstant: r = 325,
    bounceDamping: i = 10,
    bounceStiffness: s = 500,
    modifyTarget: o,
    min: a,
    max: l,
    restDelta: u = 0.5,
    restSpeed: c,
}) {
    const d = e[0],
        f = { done: !1, value: d },
        m = (C) => (a !== void 0 && C < a) || (l !== void 0 && C > l),
        v = (C) => (a === void 0 ? l : l === void 0 || Math.abs(a - C) < Math.abs(l - C) ? a : l);
    let x = n * t;
    const k = d + x,
        p = o === void 0 ? k : o(k);
    p !== k && (x = p - d);
    const h = (C) => -x * Math.exp(-C / r),
        y = (C) => p + h(C),
        w = (C) => {
            const A = h(C),
                j = y(C);
            ((f.done = Math.abs(A) <= u), (f.value = f.done ? p : j));
        };
    let S, P;
    const E = (C) => {
        m(f.value) &&
            ((S = C),
            (P = og({
                keyframes: [f.value, v(f.value)],
                velocity: sg(y, C, f.value),
                damping: i,
                stiffness: s,
                restDelta: u,
                restSpeed: c,
            })));
    };
    return (
        E(0),
        {
            calculatedDuration: null,
            next: (C) => {
                let A = !1;
                return (
                    !P && S === void 0 && ((A = !0), w(C), E(C)),
                    S !== void 0 && C >= S ? P.next(C - S) : (!A && w(C), f)
                );
            },
        }
    );
}
const pw = yi(0.42, 0, 1, 1),
    mw = yi(0, 0, 0.58, 1),
    ag = yi(0.42, 0, 0.58, 1),
    gw = (e) => Array.isArray(e) && typeof e[0] != 'number',
    yw = {
        linear: _e,
        easeIn: pw,
        easeInOut: ag,
        easeOut: mw,
        circIn: Ru,
        circInOut: Bm,
        circOut: zm,
        backIn: ju,
        backInOut: Im,
        backOut: _m,
        anticipate: Fm,
    },
    bd = (e) => {
        if (Pu(e)) {
            im(e.length === 4);
            const [t, n, r, i] = e;
            return yi(t, n, r, i);
        } else if (typeof e == 'string') return yw[e];
        return e;
    };
function vw(e, t, n) {
    const r = [],
        i = n || ig,
        s = e.length - 1;
    for (let o = 0; o < s; o++) {
        let a = i(e[o], e[o + 1]);
        if (t) {
            const l = Array.isArray(t) ? t[o] || _e : t;
            a = vi(l, a);
        }
        r.push(a);
    }
    return r;
}
function xw(e, t, { clamp: n = !0, ease: r, mixer: i } = {}) {
    const s = e.length;
    if ((im(s === t.length), s === 1)) return () => t[0];
    if (s === 2 && t[0] === t[1]) return () => t[1];
    const o = e[0] === e[1];
    e[0] > e[s - 1] && ((e = [...e].reverse()), (t = [...t].reverse()));
    const a = vw(t, r, i),
        l = a.length,
        u = (c) => {
            if (o && c < e[0]) return t[0];
            let d = 0;
            if (l > 1) for (; d < e.length - 2 && !(c < e[d + 1]); d++);
            const f = nr(e[d], e[d + 1], c);
            return a[d](f);
        };
    return n ? (c) => u(Tt(e[0], e[s - 1], c)) : u;
}
function ww(e, t) {
    const n = e[e.length - 1];
    for (let r = 1; r <= t; r++) {
        const i = nr(0, t, r);
        e.push(ee(n, 1, i));
    }
}
function Sw(e) {
    const t = [0];
    return (ww(t, e.length - 1), t);
}
function kw(e, t) {
    return e.map((n) => n * t);
}
function Cw(e, t) {
    return e.map(() => t || ag).splice(0, e.length - 1);
}
function Vs({ duration: e = 300, keyframes: t, times: n, ease: r = 'easeInOut' }) {
    const i = gw(r) ? r.map(bd) : bd(r),
        s = { done: !1, value: t[0] },
        o = kw(n && n.length === t.length ? n : Sw(t), e),
        a = xw(o, t, { ease: Array.isArray(i) ? i : Cw(t, i) });
    return { calculatedDuration: e, next: (l) => ((s.value = a(l)), (s.done = l >= e), s) };
}
const Pw = (e) => {
        const t = ({ timestamp: n }) => e(n);
        return {
            start: () => Y.update(t, !0),
            stop: () => Wt(t),
            now: () => (me.isProcessing ? me.timestamp : ht.now()),
        };
    },
    Tw = { decay: Vd, inertia: Vd, tween: Vs, keyframes: Vs, spring: og },
    Ew = (e) => e / 100;
class bu extends ng {
    constructor(t) {
        (super(t),
            (this.holdTime = null),
            (this.cancelTime = null),
            (this.currentTime = 0),
            (this.playbackSpeed = 1),
            (this.pendingPlayState = 'running'),
            (this.startTime = null),
            (this.state = 'idle'),
            (this.stop = () => {
                if ((this.resolver.cancel(), (this.isStopped = !0), this.state === 'idle')) return;
                this.teardown();
                const { onStop: l } = this.options;
                l && l();
            }));
        const { name: n, motionValue: r, element: i, keyframes: s } = this.options,
            o = (i == null ? void 0 : i.KeyframeResolver) || Ou,
            a = (l, u) => this.onKeyframesResolved(l, u);
        ((this.resolver = new o(s, a, n, r, i)), this.resolver.scheduleResolve());
    }
    flatten() {
        (super.flatten(),
            this._resolved &&
                Object.assign(this._resolved, this.initPlayback(this._resolved.keyframes)));
    }
    initPlayback(t) {
        const {
                type: n = 'keyframes',
                repeat: r = 0,
                repeatDelay: i = 0,
                repeatType: s,
                velocity: o = 0,
            } = this.options,
            a = Cu(n) ? n : Tw[n] || Vs;
        let l, u;
        a !== Vs && typeof t[0] != 'number' && ((l = vi(Ew, ig(t[0], t[1]))), (t = [0, 100]));
        const c = a({ ...this.options, keyframes: t });
        (s === 'mirror' && (u = a({ ...this.options, keyframes: [...t].reverse(), velocity: -o })),
            c.calculatedDuration === null && (c.calculatedDuration = Pm(c)));
        const { calculatedDuration: d } = c,
            f = d + i,
            m = f * (r + 1) - i;
        return {
            generator: c,
            mirroredGenerator: u,
            mapPercentToKeyframes: l,
            calculatedDuration: d,
            resolvedDuration: f,
            totalDuration: m,
        };
    }
    onPostResolved() {
        const { autoplay: t = !0 } = this.options;
        (this.play(),
            this.pendingPlayState === 'paused' || !t
                ? this.pause()
                : (this.state = this.pendingPlayState));
    }
    tick(t, n = !1) {
        const { resolved: r } = this;
        if (!r) {
            const { keyframes: C } = this.options;
            return { done: !0, value: C[C.length - 1] };
        }
        const {
            finalKeyframe: i,
            generator: s,
            mirroredGenerator: o,
            mapPercentToKeyframes: a,
            keyframes: l,
            calculatedDuration: u,
            totalDuration: c,
            resolvedDuration: d,
        } = r;
        if (this.startTime === null) return s.next(0);
        const { delay: f, repeat: m, repeatType: v, repeatDelay: x, onUpdate: k } = this.options;
        (this.speed > 0
            ? (this.startTime = Math.min(this.startTime, t))
            : this.speed < 0 && (this.startTime = Math.min(t - c / this.speed, this.startTime)),
            n
                ? (this.currentTime = t)
                : this.holdTime !== null
                  ? (this.currentTime = this.holdTime)
                  : (this.currentTime = Math.round(t - this.startTime) * this.speed));
        const p = this.currentTime - f * (this.speed >= 0 ? 1 : -1),
            h = this.speed >= 0 ? p < 0 : p > c;
        ((this.currentTime = Math.max(p, 0)),
            this.state === 'finished' && this.holdTime === null && (this.currentTime = c));
        let y = this.currentTime,
            w = s;
        if (m) {
            const C = Math.min(this.currentTime, c) / d;
            let A = Math.floor(C),
                j = C % 1;
            (!j && C >= 1 && (j = 1),
                j === 1 && A--,
                (A = Math.min(A, m + 1)),
                !!(A % 2) &&
                    (v === 'reverse'
                        ? ((j = 1 - j), x && (j -= x / d))
                        : v === 'mirror' && (w = o)),
                (y = Tt(0, 1, j) * d));
        }
        const S = h ? { done: !1, value: l[0] } : w.next(y);
        a && (S.value = a(S.value));
        let { done: P } = S;
        !h && u !== null && (P = this.speed >= 0 ? this.currentTime >= c : this.currentTime <= 0);
        const E =
            this.holdTime === null &&
            (this.state === 'finished' || (this.state === 'running' && P));
        return (
            E && i !== void 0 && (S.value = ao(l, this.options, i)),
            k && k(S.value),
            E && this.finish(),
            S
        );
    }
    get duration() {
        const { resolved: t } = this;
        return t ? wt(t.calculatedDuration) : 0;
    }
    get time() {
        return wt(this.currentTime);
    }
    set time(t) {
        ((t = xt(t)),
            (this.currentTime = t),
            this.holdTime !== null || this.speed === 0
                ? (this.holdTime = t)
                : this.driver && (this.startTime = this.driver.now() - t / this.speed));
    }
    get speed() {
        return this.playbackSpeed;
    }
    set speed(t) {
        const n = this.playbackSpeed !== t;
        ((this.playbackSpeed = t), n && (this.time = wt(this.currentTime)));
    }
    play() {
        if ((this.resolver.isScheduled || this.resolver.resume(), !this._resolved)) {
            this.pendingPlayState = 'running';
            return;
        }
        if (this.isStopped) return;
        const { driver: t = Pw, onPlay: n, startTime: r } = this.options;
        (this.driver || (this.driver = t((s) => this.tick(s))), n && n());
        const i = this.driver.now();
        (this.holdTime !== null
            ? (this.startTime = i - this.holdTime)
            : this.startTime
              ? this.state === 'finished' && (this.startTime = i)
              : (this.startTime = r ?? this.calcStartTime()),
            this.state === 'finished' && this.updateFinishedPromise(),
            (this.cancelTime = this.startTime),
            (this.holdTime = null),
            (this.state = 'running'),
            this.driver.start());
    }
    pause() {
        var t;
        if (!this._resolved) {
            this.pendingPlayState = 'paused';
            return;
        }
        ((this.state = 'paused'),
            (this.holdTime = (t = this.currentTime) !== null && t !== void 0 ? t : 0));
    }
    complete() {
        (this.state !== 'running' && this.play(),
            (this.pendingPlayState = this.state = 'finished'),
            (this.holdTime = null));
    }
    finish() {
        (this.teardown(), (this.state = 'finished'));
        const { onComplete: t } = this.options;
        t && t();
    }
    cancel() {
        (this.cancelTime !== null && this.tick(this.cancelTime),
            this.teardown(),
            this.updateFinishedPromise());
    }
    teardown() {
        ((this.state = 'idle'),
            this.stopDriver(),
            this.resolveFinishedPromise(),
            this.updateFinishedPromise(),
            (this.startTime = this.cancelTime = null),
            this.resolver.cancel());
    }
    stopDriver() {
        this.driver && (this.driver.stop(), (this.driver = void 0));
    }
    sample(t) {
        return ((this.startTime = 0), this.tick(t, !0));
    }
}
const Nw = new Set(['opacity', 'clipPath', 'filter', 'transform']);
function Lw(
    e,
    t,
    n,
    {
        delay: r = 0,
        duration: i = 300,
        repeat: s = 0,
        repeatType: o = 'loop',
        ease: a = 'easeInOut',
        times: l,
    } = {},
) {
    const u = { [t]: n };
    l && (u.offset = l);
    const c = Nm(a, i);
    return (
        Array.isArray(c) && (u.easing = c),
        e.animate(u, {
            delay: r,
            duration: i,
            easing: Array.isArray(c) ? 'linear' : c,
            fill: 'both',
            iterations: s + 1,
            direction: o === 'reverse' ? 'alternate' : 'normal',
        })
    );
}
const jw = lu(() => Object.hasOwnProperty.call(Element.prototype, 'animate')),
    bs = 10,
    Rw = 2e4;
function Aw(e) {
    return Cu(e.type) || e.type === 'spring' || !Em(e.ease);
}
function Dw(e, t) {
    const n = new bu({ ...t, keyframes: e, repeat: 0, delay: 0, isGenerator: !0 });
    let r = { done: !1, value: e[0] };
    const i = [];
    let s = 0;
    for (; !r.done && s < Rw; ) ((r = n.sample(s)), i.push(r.value), (s += bs));
    return { times: void 0, keyframes: i, duration: s - bs, ease: 'linear' };
}
const lg = { anticipate: Fm, backInOut: Im, circInOut: Bm };
function Mw(e) {
    return e in lg;
}
class _d extends ng {
    constructor(t) {
        super(t);
        const { name: n, motionValue: r, element: i, keyframes: s } = this.options;
        ((this.resolver = new tg(s, (o, a) => this.onKeyframesResolved(o, a), n, r, i)),
            this.resolver.scheduleResolve());
    }
    initPlayback(t, n) {
        let {
            duration: r = 300,
            times: i,
            ease: s,
            type: o,
            motionValue: a,
            name: l,
            startTime: u,
        } = this.options;
        if (!a.owner || !a.owner.current) return !1;
        if ((typeof s == 'string' && Ms() && Mw(s) && (s = lg[s]), Aw(this.options))) {
            const { onComplete: d, onUpdate: f, motionValue: m, element: v, ...x } = this.options,
                k = Dw(t, x);
            ((t = k.keyframes),
                t.length === 1 && (t[1] = t[0]),
                (r = k.duration),
                (i = k.times),
                (s = k.ease),
                (o = 'keyframes'));
        }
        const c = Lw(a.owner.current, l, t, { ...this.options, duration: r, times: i, ease: s });
        return (
            (c.startTime = u ?? this.calcStartTime()),
            this.pendingTimeline
                ? (Sd(c, this.pendingTimeline), (this.pendingTimeline = void 0))
                : (c.onfinish = () => {
                      const { onComplete: d } = this.options;
                      (a.set(ao(t, this.options, n)),
                          d && d(),
                          this.cancel(),
                          this.resolveFinishedPromise());
                  }),
            { animation: c, duration: r, times: i, type: o, ease: s, keyframes: t }
        );
    }
    get duration() {
        const { resolved: t } = this;
        if (!t) return 0;
        const { duration: n } = t;
        return wt(n);
    }
    get time() {
        const { resolved: t } = this;
        if (!t) return 0;
        const { animation: n } = t;
        return wt(n.currentTime || 0);
    }
    set time(t) {
        const { resolved: n } = this;
        if (!n) return;
        const { animation: r } = n;
        r.currentTime = xt(t);
    }
    get speed() {
        const { resolved: t } = this;
        if (!t) return 1;
        const { animation: n } = t;
        return n.playbackRate;
    }
    set speed(t) {
        const { resolved: n } = this;
        if (!n) return;
        const { animation: r } = n;
        r.playbackRate = t;
    }
    get state() {
        const { resolved: t } = this;
        if (!t) return 'idle';
        const { animation: n } = t;
        return n.playState;
    }
    get startTime() {
        const { resolved: t } = this;
        if (!t) return null;
        const { animation: n } = t;
        return n.startTime;
    }
    attachTimeline(t) {
        if (!this._resolved) this.pendingTimeline = t;
        else {
            const { resolved: n } = this;
            if (!n) return _e;
            const { animation: r } = n;
            Sd(r, t);
        }
        return _e;
    }
    play() {
        if (this.isStopped) return;
        const { resolved: t } = this;
        if (!t) return;
        const { animation: n } = t;
        (n.playState === 'finished' && this.updateFinishedPromise(), n.play());
    }
    pause() {
        const { resolved: t } = this;
        if (!t) return;
        const { animation: n } = t;
        n.pause();
    }
    stop() {
        if ((this.resolver.cancel(), (this.isStopped = !0), this.state === 'idle')) return;
        (this.resolveFinishedPromise(), this.updateFinishedPromise());
        const { resolved: t } = this;
        if (!t) return;
        const { animation: n, keyframes: r, duration: i, type: s, ease: o, times: a } = t;
        if (n.playState === 'idle' || n.playState === 'finished') return;
        if (this.time) {
            const { motionValue: u, onUpdate: c, onComplete: d, element: f, ...m } = this.options,
                v = new bu({
                    ...m,
                    keyframes: r,
                    duration: i,
                    type: s,
                    ease: o,
                    times: a,
                    isGenerator: !0,
                }),
                x = xt(this.time);
            u.setWithVelocity(v.sample(x - bs).value, v.sample(x).value, bs);
        }
        const { onStop: l } = this.options;
        (l && l(), this.cancel());
    }
    complete() {
        const { resolved: t } = this;
        t && t.animation.finish();
    }
    cancel() {
        const { resolved: t } = this;
        t && t.animation.cancel();
    }
    static supports(t) {
        const { motionValue: n, name: r, repeatDelay: i, repeatType: s, damping: o, type: a } = t;
        if (!n || !n.owner || !(n.owner.current instanceof HTMLElement)) return !1;
        const { onUpdate: l, transformTemplate: u } = n.owner.getProps();
        return (
            jw() && r && Nw.has(r) && !l && !u && !i && s !== 'mirror' && o !== 0 && a !== 'inertia'
        );
    }
}
const Ow = { type: 'spring', stiffness: 500, damping: 25, restSpeed: 10 },
    Vw = (e) => ({
        type: 'spring',
        stiffness: 550,
        damping: e === 0 ? 2 * Math.sqrt(550) : 30,
        restSpeed: 10,
    }),
    bw = { type: 'keyframes', duration: 0.8 },
    _w = { type: 'keyframes', ease: [0.25, 0.1, 0.35, 1], duration: 0.3 },
    Iw = (e, { keyframes: t }) =>
        t.length > 2 ? bw : xn.has(e) ? (e.startsWith('scale') ? Vw(t[1]) : Ow) : _w;
function Fw({
    when: e,
    delay: t,
    delayChildren: n,
    staggerChildren: r,
    staggerDirection: i,
    repeat: s,
    repeatType: o,
    repeatDelay: a,
    from: l,
    elapsed: u,
    ...c
}) {
    return !!Object.keys(c).length;
}
const _u =
    (e, t, n, r = {}, i, s) =>
    (o) => {
        const a = ku(r, e) || {},
            l = a.delay || r.delay || 0;
        let { elapsed: u = 0 } = r;
        u = u - xt(l);
        let c = {
            keyframes: Array.isArray(n) ? n : [null, n],
            ease: 'easeOut',
            velocity: t.getVelocity(),
            ...a,
            delay: -u,
            onUpdate: (f) => {
                (t.set(f), a.onUpdate && a.onUpdate(f));
            },
            onComplete: () => {
                (o(), a.onComplete && a.onComplete());
            },
            name: e,
            motionValue: t,
            element: s ? void 0 : i,
        };
        (Fw(a) || (c = { ...c, ...Iw(e, c) }),
            c.duration && (c.duration = xt(c.duration)),
            c.repeatDelay && (c.repeatDelay = xt(c.repeatDelay)),
            c.from !== void 0 && (c.keyframes[0] = c.from));
        let d = !1;
        if (
            ((c.type === !1 || (c.duration === 0 && !c.repeatDelay)) &&
                ((c.duration = 0), c.delay === 0 && (d = !0)),
            d && !s && t.get() !== void 0)
        ) {
            const f = ao(c.keyframes, a);
            if (f !== void 0)
                return (
                    Y.update(() => {
                        (c.onUpdate(f), c.onComplete());
                    }),
                    new i1([])
                );
        }
        return !s && _d.supports(c) ? new _d(c) : new bu(c);
    };
function zw({ protectedKeys: e, needsAnimating: t }, n) {
    const r = e.hasOwnProperty(n) && t[n] !== !0;
    return ((t[n] = !1), r);
}
function ug(e, t, { delay: n = 0, transitionOverride: r, type: i } = {}) {
    var s;
    let { transition: o = e.getDefaultTransition(), transitionEnd: a, ...l } = t;
    r && (o = r);
    const u = [],
        c = i && e.animationState && e.animationState.getState()[i];
    for (const d in l) {
        const f = e.getValue(d, (s = e.latestValues[d]) !== null && s !== void 0 ? s : null),
            m = l[d];
        if (m === void 0 || (c && zw(c, d))) continue;
        const v = { delay: n, ...ku(o || {}, d) };
        let x = !1;
        if (window.MotionHandoffAnimation) {
            const p = Mm(e);
            if (p) {
                const h = window.MotionHandoffAnimation(p, d, Y);
                h !== null && ((v.startTime = h), (x = !0));
            }
        }
        (Za(e, d),
            f.start(_u(d, f, m, e.shouldReduceMotion && Am.has(d) ? { type: !1 } : v, e, x)));
        const k = f.animation;
        k && u.push(k);
    }
    return (
        a &&
            Promise.all(u).then(() => {
                Y.update(() => {
                    a && v1(e, a);
                });
            }),
        u
    );
}
function il(e, t, n = {}) {
    var r;
    const i = oo(
        e,
        t,
        n.type === 'exit'
            ? (r = e.presenceContext) === null || r === void 0
                ? void 0
                : r.custom
            : void 0,
    );
    let { transition: s = e.getDefaultTransition() || {} } = i || {};
    n.transitionOverride && (s = n.transitionOverride);
    const o = i ? () => Promise.all(ug(e, i, n)) : () => Promise.resolve(),
        a =
            e.variantChildren && e.variantChildren.size
                ? (u = 0) => {
                      const { delayChildren: c = 0, staggerChildren: d, staggerDirection: f } = s;
                      return Bw(e, t, c + u, d, f, n);
                  }
                : () => Promise.resolve(),
        { when: l } = s;
    if (l) {
        const [u, c] = l === 'beforeChildren' ? [o, a] : [a, o];
        return u().then(() => c());
    } else return Promise.all([o(), a(n.delay)]);
}
function Bw(e, t, n = 0, r = 0, i = 1, s) {
    const o = [],
        a = (e.variantChildren.size - 1) * r,
        l = i === 1 ? (u = 0) => u * r : (u = 0) => a - u * r;
    return (
        Array.from(e.variantChildren)
            .sort($w)
            .forEach((u, c) => {
                (u.notify('AnimationStart', t),
                    o.push(
                        il(u, t, { ...s, delay: n + l(c) }).then(() =>
                            u.notify('AnimationComplete', t),
                        ),
                    ));
            }),
        Promise.all(o)
    );
}
function $w(e, t) {
    return e.sortNodePosition(t);
}
function Uw(e, t, n = {}) {
    e.notify('AnimationStart', t);
    let r;
    if (Array.isArray(t)) {
        const i = t.map((s) => il(e, s, n));
        r = Promise.all(i);
    } else if (typeof t == 'string') r = il(e, t, n);
    else {
        const i = typeof t == 'function' ? oo(e, t, n.custom) : t;
        r = Promise.all(ug(e, i, n));
    }
    return r.then(() => {
        e.notify('AnimationComplete', t);
    });
}
const Hw = cu.length;
function cg(e) {
    if (!e) return;
    if (!e.isControllingVariants) {
        const n = e.parent ? cg(e.parent) || {} : {};
        return (e.props.initial !== void 0 && (n.initial = e.props.initial), n);
    }
    const t = {};
    for (let n = 0; n < Hw; n++) {
        const r = cu[n],
            i = e.props[r];
        (oi(i) || i === !1) && (t[r] = i);
    }
    return t;
}
const Ww = [...uu].reverse(),
    Kw = uu.length;
function Gw(e) {
    return (t) => Promise.all(t.map(({ animation: n, options: r }) => Uw(e, n, r)));
}
function Qw(e) {
    let t = Gw(e),
        n = Id(),
        r = !0;
    const i = (l) => (u, c) => {
        var d;
        const f = oo(
            e,
            c,
            l === 'exit'
                ? (d = e.presenceContext) === null || d === void 0
                    ? void 0
                    : d.custom
                : void 0,
        );
        if (f) {
            const { transition: m, transitionEnd: v, ...x } = f;
            u = { ...u, ...x, ...v };
        }
        return u;
    };
    function s(l) {
        t = l(e);
    }
    function o(l) {
        const { props: u } = e,
            c = cg(e.parent) || {},
            d = [],
            f = new Set();
        let m = {},
            v = 1 / 0;
        for (let k = 0; k < Kw; k++) {
            const p = Ww[k],
                h = n[p],
                y = u[p] !== void 0 ? u[p] : c[p],
                w = oi(y),
                S = p === l ? h.isActive : null;
            S === !1 && (v = k);
            let P = y === c[p] && y !== u[p] && w;
            if (
                (P && r && e.manuallyAnimateOnMount && (P = !1),
                (h.protectedKeys = { ...m }),
                (!h.isActive && S === null) ||
                    (!y && !h.prevProp) ||
                    io(y) ||
                    typeof y == 'boolean')
            )
                continue;
            const E = Yw(h.prevProp, y);
            let C = E || (p === l && h.isActive && !P && w) || (k > v && w),
                A = !1;
            const j = Array.isArray(y) ? y : [y];
            let Z = j.reduce(i(p), {});
            S === !1 && (Z = {});
            const { prevResolvedValues: z = {} } = h,
                b = { ...z, ...Z },
                I = (U) => {
                    ((C = !0), f.has(U) && ((A = !0), f.delete(U)), (h.needsAnimating[U] = !0));
                    const N = e.getValue(U);
                    N && (N.liveStyle = !1);
                };
            for (const U in b) {
                const N = Z[U],
                    D = z[U];
                if (m.hasOwnProperty(U)) continue;
                let V = !1;
                (Qa(N) && Qa(D) ? (V = !Cm(N, D)) : (V = N !== D),
                    V
                        ? N != null
                            ? I(U)
                            : f.add(U)
                        : N !== void 0 && f.has(U)
                          ? I(U)
                          : (h.protectedKeys[U] = !0));
            }
            ((h.prevProp = y),
                (h.prevResolvedValues = Z),
                h.isActive && (m = { ...m, ...Z }),
                r && e.blockInitialAnimation && (C = !1),
                C &&
                    (!(P && E) || A) &&
                    d.push(...j.map((U) => ({ animation: U, options: { type: p } }))));
        }
        if (f.size) {
            const k = {};
            (f.forEach((p) => {
                const h = e.getBaseTarget(p),
                    y = e.getValue(p);
                (y && (y.liveStyle = !0), (k[p] = h ?? null));
            }),
                d.push({ animation: k }));
        }
        let x = !!d.length;
        return (
            r &&
                (u.initial === !1 || u.initial === u.animate) &&
                !e.manuallyAnimateOnMount &&
                (x = !1),
            (r = !1),
            x ? t(d) : Promise.resolve()
        );
    }
    function a(l, u) {
        var c;
        if (n[l].isActive === u) return Promise.resolve();
        ((c = e.variantChildren) === null ||
            c === void 0 ||
            c.forEach((f) => {
                var m;
                return (m = f.animationState) === null || m === void 0 ? void 0 : m.setActive(l, u);
            }),
            (n[l].isActive = u));
        const d = o(l);
        for (const f in n) n[f].protectedKeys = {};
        return d;
    }
    return {
        animateChanges: o,
        setActive: a,
        setAnimateFunction: s,
        getState: () => n,
        reset: () => {
            ((n = Id()), (r = !0));
        },
    };
}
function Yw(e, t) {
    return typeof t == 'string' ? t !== e : Array.isArray(t) ? !Cm(t, e) : !1;
}
function qt(e = !1) {
    return { isActive: e, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
}
function Id() {
    return {
        animate: qt(!0),
        whileInView: qt(),
        whileHover: qt(),
        whileTap: qt(),
        whileDrag: qt(),
        whileFocus: qt(),
        exit: qt(),
    };
}
class Xt {
    constructor(t) {
        ((this.isMounted = !1), (this.node = t));
    }
    update() {}
}
class Xw extends Xt {
    constructor(t) {
        (super(t), t.animationState || (t.animationState = Qw(t)));
    }
    updateAnimationControlsSubscription() {
        const { animate: t } = this.node.getProps();
        io(t) && (this.unmountControls = t.subscribe(this.node));
    }
    mount() {
        this.updateAnimationControlsSubscription();
    }
    update() {
        const { animate: t } = this.node.getProps(),
            { animate: n } = this.node.prevProps || {};
        t !== n && this.updateAnimationControlsSubscription();
    }
    unmount() {
        var t;
        (this.node.animationState.reset(),
            (t = this.unmountControls) === null || t === void 0 || t.call(this));
    }
}
let Zw = 0;
class qw extends Xt {
    constructor() {
        (super(...arguments), (this.id = Zw++));
    }
    update() {
        if (!this.node.presenceContext) return;
        const { isPresent: t, onExitComplete: n } = this.node.presenceContext,
            { isPresent: r } = this.node.prevPresenceContext || {};
        if (!this.node.animationState || t === r) return;
        const i = this.node.animationState.setActive('exit', !t);
        n && !t && i.then(() => n(this.id));
    }
    mount() {
        const { register: t } = this.node.presenceContext || {};
        t && (this.unmount = t(this.id));
    }
    unmount() {}
}
const Jw = { animation: { Feature: Xw }, exit: { Feature: qw } };
function ci(e, t, n, r = { passive: !0 }) {
    return (e.addEventListener(t, n, r), () => e.removeEventListener(t, n));
}
function xi(e) {
    return { point: { x: e.pageX, y: e.pageY } };
}
const eS = (e) => (t) => Tu(t) && e(t, xi(t));
function Fr(e, t, n, r) {
    return ci(e, t, eS(n), r);
}
const Fd = (e, t) => Math.abs(e - t);
function tS(e, t) {
    const n = Fd(e.x, t.x),
        r = Fd(e.y, t.y);
    return Math.sqrt(n ** 2 + r ** 2);
}
class dg {
    constructor(t, n, { transformPagePoint: r, contextWindow: i, dragSnapToOrigin: s = !1 } = {}) {
        if (
            ((this.startEvent = null),
            (this.lastMoveEvent = null),
            (this.lastMoveEventInfo = null),
            (this.handlers = {}),
            (this.contextWindow = window),
            (this.updatePoint = () => {
                if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return;
                const d = Wo(this.lastMoveEventInfo, this.history),
                    f = this.startEvent !== null,
                    m = tS(d.offset, { x: 0, y: 0 }) >= 3;
                if (!f && !m) return;
                const { point: v } = d,
                    { timestamp: x } = me;
                this.history.push({ ...v, timestamp: x });
                const { onStart: k, onMove: p } = this.handlers;
                (f || (k && k(this.lastMoveEvent, d), (this.startEvent = this.lastMoveEvent)),
                    p && p(this.lastMoveEvent, d));
            }),
            (this.handlePointerMove = (d, f) => {
                ((this.lastMoveEvent = d),
                    (this.lastMoveEventInfo = Ho(f, this.transformPagePoint)),
                    Y.update(this.updatePoint, !0));
            }),
            (this.handlePointerUp = (d, f) => {
                this.end();
                const { onEnd: m, onSessionEnd: v, resumeAnimation: x } = this.handlers;
                if (
                    (this.dragSnapToOrigin && x && x(),
                    !(this.lastMoveEvent && this.lastMoveEventInfo))
                )
                    return;
                const k = Wo(
                    d.type === 'pointercancel'
                        ? this.lastMoveEventInfo
                        : Ho(f, this.transformPagePoint),
                    this.history,
                );
                (this.startEvent && m && m(d, k), v && v(d, k));
            }),
            !Tu(t))
        )
            return;
        ((this.dragSnapToOrigin = s),
            (this.handlers = n),
            (this.transformPagePoint = r),
            (this.contextWindow = i || window));
        const o = xi(t),
            a = Ho(o, this.transformPagePoint),
            { point: l } = a,
            { timestamp: u } = me;
        this.history = [{ ...l, timestamp: u }];
        const { onSessionStart: c } = n;
        (c && c(t, Wo(a, this.history)),
            (this.removeListeners = vi(
                Fr(this.contextWindow, 'pointermove', this.handlePointerMove),
                Fr(this.contextWindow, 'pointerup', this.handlePointerUp),
                Fr(this.contextWindow, 'pointercancel', this.handlePointerUp),
            )));
    }
    updateHandlers(t) {
        this.handlers = t;
    }
    end() {
        (this.removeListeners && this.removeListeners(), Wt(this.updatePoint));
    }
}
function Ho(e, t) {
    return t ? { point: t(e.point) } : e;
}
function zd(e, t) {
    return { x: e.x - t.x, y: e.y - t.y };
}
function Wo({ point: e }, t) {
    return { point: e, delta: zd(e, fg(t)), offset: zd(e, nS(t)), velocity: rS(t, 0.1) };
}
function nS(e) {
    return e[0];
}
function fg(e) {
    return e[e.length - 1];
}
function rS(e, t) {
    if (e.length < 2) return { x: 0, y: 0 };
    let n = e.length - 1,
        r = null;
    const i = fg(e);
    for (; n >= 0 && ((r = e[n]), !(i.timestamp - r.timestamp > xt(t))); ) n--;
    if (!r) return { x: 0, y: 0 };
    const s = wt(i.timestamp - r.timestamp);
    if (s === 0) return { x: 0, y: 0 };
    const o = { x: (i.x - r.x) / s, y: (i.y - r.y) / s };
    return (o.x === 1 / 0 && (o.x = 0), o.y === 1 / 0 && (o.y = 0), o);
}
const hg = 1e-4,
    iS = 1 - hg,
    sS = 1 + hg,
    pg = 0.01,
    oS = 0 - pg,
    aS = 0 + pg;
function Fe(e) {
    return e.max - e.min;
}
function lS(e, t, n) {
    return Math.abs(e - t) <= n;
}
function Bd(e, t, n, r = 0.5) {
    ((e.origin = r),
        (e.originPoint = ee(t.min, t.max, e.origin)),
        (e.scale = Fe(n) / Fe(t)),
        (e.translate = ee(n.min, n.max, e.origin) - e.originPoint),
        ((e.scale >= iS && e.scale <= sS) || isNaN(e.scale)) && (e.scale = 1),
        ((e.translate >= oS && e.translate <= aS) || isNaN(e.translate)) && (e.translate = 0));
}
function zr(e, t, n, r) {
    (Bd(e.x, t.x, n.x, r ? r.originX : void 0), Bd(e.y, t.y, n.y, r ? r.originY : void 0));
}
function $d(e, t, n) {
    ((e.min = n.min + t.min), (e.max = e.min + Fe(t)));
}
function uS(e, t, n) {
    ($d(e.x, t.x, n.x), $d(e.y, t.y, n.y));
}
function Ud(e, t, n) {
    ((e.min = t.min - n.min), (e.max = e.min + Fe(t)));
}
function Br(e, t, n) {
    (Ud(e.x, t.x, n.x), Ud(e.y, t.y, n.y));
}
function cS(e, { min: t, max: n }, r) {
    return (
        t !== void 0 && e < t
            ? (e = r ? ee(t, e, r.min) : Math.max(e, t))
            : n !== void 0 && e > n && (e = r ? ee(n, e, r.max) : Math.min(e, n)),
        e
    );
}
function Hd(e, t, n) {
    return {
        min: t !== void 0 ? e.min + t : void 0,
        max: n !== void 0 ? e.max + n - (e.max - e.min) : void 0,
    };
}
function dS(e, { top: t, left: n, bottom: r, right: i }) {
    return { x: Hd(e.x, n, i), y: Hd(e.y, t, r) };
}
function Wd(e, t) {
    let n = t.min - e.min,
        r = t.max - e.max;
    return (t.max - t.min < e.max - e.min && ([n, r] = [r, n]), { min: n, max: r });
}
function fS(e, t) {
    return { x: Wd(e.x, t.x), y: Wd(e.y, t.y) };
}
function hS(e, t) {
    let n = 0.5;
    const r = Fe(e),
        i = Fe(t);
    return (
        i > r ? (n = nr(t.min, t.max - r, e.min)) : r > i && (n = nr(e.min, e.max - i, t.min)),
        Tt(0, 1, n)
    );
}
function pS(e, t) {
    const n = {};
    return (
        t.min !== void 0 && (n.min = t.min - e.min),
        t.max !== void 0 && (n.max = t.max - e.min),
        n
    );
}
const sl = 0.35;
function mS(e = sl) {
    return (
        e === !1 ? (e = 0) : e === !0 && (e = sl),
        { x: Kd(e, 'left', 'right'), y: Kd(e, 'top', 'bottom') }
    );
}
function Kd(e, t, n) {
    return { min: Gd(e, t), max: Gd(e, n) };
}
function Gd(e, t) {
    return typeof e == 'number' ? e : e[t] || 0;
}
const Qd = () => ({ translate: 0, scale: 1, origin: 0, originPoint: 0 }),
    Fn = () => ({ x: Qd(), y: Qd() }),
    Yd = () => ({ min: 0, max: 0 }),
    oe = () => ({ x: Yd(), y: Yd() });
function Ue(e) {
    return [e('x'), e('y')];
}
function mg({ top: e, left: t, right: n, bottom: r }) {
    return { x: { min: t, max: n }, y: { min: e, max: r } };
}
function gS({ x: e, y: t }) {
    return { top: t.min, right: e.max, bottom: t.max, left: e.min };
}
function yS(e, t) {
    if (!t) return e;
    const n = t({ x: e.left, y: e.top }),
        r = t({ x: e.right, y: e.bottom });
    return { top: n.y, left: n.x, bottom: r.y, right: r.x };
}
function Ko(e) {
    return e === void 0 || e === 1;
}
function ol({ scale: e, scaleX: t, scaleY: n }) {
    return !Ko(e) || !Ko(t) || !Ko(n);
}
function tn(e) {
    return ol(e) || gg(e) || e.z || e.rotate || e.rotateX || e.rotateY || e.skewX || e.skewY;
}
function gg(e) {
    return Xd(e.x) || Xd(e.y);
}
function Xd(e) {
    return e && e !== '0%';
}
function _s(e, t, n) {
    const r = e - n,
        i = t * r;
    return n + i;
}
function Zd(e, t, n, r, i) {
    return (i !== void 0 && (e = _s(e, i, r)), _s(e, n, r) + t);
}
function al(e, t = 0, n = 1, r, i) {
    ((e.min = Zd(e.min, t, n, r, i)), (e.max = Zd(e.max, t, n, r, i)));
}
function yg(e, { x: t, y: n }) {
    (al(e.x, t.translate, t.scale, t.originPoint), al(e.y, n.translate, n.scale, n.originPoint));
}
const qd = 0.999999999999,
    Jd = 1.0000000000001;
function vS(e, t, n, r = !1) {
    const i = n.length;
    if (!i) return;
    t.x = t.y = 1;
    let s, o;
    for (let a = 0; a < i; a++) {
        ((s = n[a]), (o = s.projectionDelta));
        const { visualElement: l } = s.options;
        (l && l.props.style && l.props.style.display === 'contents') ||
            (r &&
                s.options.layoutScroll &&
                s.scroll &&
                s !== s.root &&
                Bn(e, { x: -s.scroll.offset.x, y: -s.scroll.offset.y }),
            o && ((t.x *= o.x.scale), (t.y *= o.y.scale), yg(e, o)),
            r && tn(s.latestValues) && Bn(e, s.latestValues));
    }
    (t.x < Jd && t.x > qd && (t.x = 1), t.y < Jd && t.y > qd && (t.y = 1));
}
function zn(e, t) {
    ((e.min = e.min + t), (e.max = e.max + t));
}
function ef(e, t, n, r, i = 0.5) {
    const s = ee(e.min, e.max, i);
    al(e, t, n, s, r);
}
function Bn(e, t) {
    (ef(e.x, t.x, t.scaleX, t.scale, t.originX), ef(e.y, t.y, t.scaleY, t.scale, t.originY));
}
function vg(e, t) {
    return mg(yS(e.getBoundingClientRect(), t));
}
function xS(e, t, n) {
    const r = vg(e, n),
        { scroll: i } = t;
    return (i && (zn(r.x, i.offset.x), zn(r.y, i.offset.y)), r);
}
const xg = ({ current: e }) => (e ? e.ownerDocument.defaultView : null),
    wS = new WeakMap();
class SS {
    constructor(t) {
        ((this.openDragLock = null),
            (this.isDragging = !1),
            (this.currentDirection = null),
            (this.originPoint = { x: 0, y: 0 }),
            (this.constraints = !1),
            (this.hasMutatedConstraints = !1),
            (this.elastic = oe()),
            (this.visualElement = t));
    }
    start(t, { snapToCursor: n = !1 } = {}) {
        const { presenceContext: r } = this.visualElement;
        if (r && r.isPresent === !1) return;
        const i = (c) => {
                const { dragSnapToOrigin: d } = this.getProps();
                (d ? this.pauseAnimation() : this.stopAnimation(),
                    n && this.snapToCursor(xi(c).point));
            },
            s = (c, d) => {
                const { drag: f, dragPropagation: m, onDragStart: v } = this.getProps();
                if (
                    f &&
                    !m &&
                    (this.openDragLock && this.openDragLock(),
                    (this.openDragLock = h1(f)),
                    !this.openDragLock)
                )
                    return;
                ((this.isDragging = !0),
                    (this.currentDirection = null),
                    this.resolveConstraints(),
                    this.visualElement.projection &&
                        ((this.visualElement.projection.isAnimationBlocked = !0),
                        (this.visualElement.projection.target = void 0)),
                    Ue((k) => {
                        let p = this.getAxisMotionValue(k).get() || 0;
                        if (ft.test(p)) {
                            const { projection: h } = this.visualElement;
                            if (h && h.layout) {
                                const y = h.layout.layoutBox[k];
                                y && (p = Fe(y) * (parseFloat(p) / 100));
                            }
                        }
                        this.originPoint[k] = p;
                    }),
                    v && Y.postRender(() => v(c, d)),
                    Za(this.visualElement, 'transform'));
                const { animationState: x } = this.visualElement;
                x && x.setActive('whileDrag', !0);
            },
            o = (c, d) => {
                const {
                    dragPropagation: f,
                    dragDirectionLock: m,
                    onDirectionLock: v,
                    onDrag: x,
                } = this.getProps();
                if (!f && !this.openDragLock) return;
                const { offset: k } = d;
                if (m && this.currentDirection === null) {
                    ((this.currentDirection = kS(k)),
                        this.currentDirection !== null && v && v(this.currentDirection));
                    return;
                }
                (this.updateAxis('x', d.point, k),
                    this.updateAxis('y', d.point, k),
                    this.visualElement.render(),
                    x && x(c, d));
            },
            a = (c, d) => this.stop(c, d),
            l = () =>
                Ue((c) => {
                    var d;
                    return (
                        this.getAnimationState(c) === 'paused' &&
                        ((d = this.getAxisMotionValue(c).animation) === null || d === void 0
                            ? void 0
                            : d.play())
                    );
                }),
            { dragSnapToOrigin: u } = this.getProps();
        this.panSession = new dg(
            t,
            { onSessionStart: i, onStart: s, onMove: o, onSessionEnd: a, resumeAnimation: l },
            {
                transformPagePoint: this.visualElement.getTransformPagePoint(),
                dragSnapToOrigin: u,
                contextWindow: xg(this.visualElement),
            },
        );
    }
    stop(t, n) {
        const r = this.isDragging;
        if ((this.cancel(), !r)) return;
        const { velocity: i } = n;
        this.startAnimation(i);
        const { onDragEnd: s } = this.getProps();
        s && Y.postRender(() => s(t, n));
    }
    cancel() {
        this.isDragging = !1;
        const { projection: t, animationState: n } = this.visualElement;
        (t && (t.isAnimationBlocked = !1),
            this.panSession && this.panSession.end(),
            (this.panSession = void 0));
        const { dragPropagation: r } = this.getProps();
        (!r && this.openDragLock && (this.openDragLock(), (this.openDragLock = null)),
            n && n.setActive('whileDrag', !1));
    }
    updateAxis(t, n, r) {
        const { drag: i } = this.getProps();
        if (!r || !$i(t, i, this.currentDirection)) return;
        const s = this.getAxisMotionValue(t);
        let o = this.originPoint[t] + r[t];
        (this.constraints &&
            this.constraints[t] &&
            (o = cS(o, this.constraints[t], this.elastic[t])),
            s.set(o));
    }
    resolveConstraints() {
        var t;
        const { dragConstraints: n, dragElastic: r } = this.getProps(),
            i =
                this.visualElement.projection && !this.visualElement.projection.layout
                    ? this.visualElement.projection.measure(!1)
                    : (t = this.visualElement.projection) === null || t === void 0
                      ? void 0
                      : t.layout,
            s = this.constraints;
        (n && _n(n)
            ? this.constraints || (this.constraints = this.resolveRefConstraints())
            : n && i
              ? (this.constraints = dS(i.layoutBox, n))
              : (this.constraints = !1),
            (this.elastic = mS(r)),
            s !== this.constraints &&
                i &&
                this.constraints &&
                !this.hasMutatedConstraints &&
                Ue((o) => {
                    this.constraints !== !1 &&
                        this.getAxisMotionValue(o) &&
                        (this.constraints[o] = pS(i.layoutBox[o], this.constraints[o]));
                }));
    }
    resolveRefConstraints() {
        const { dragConstraints: t, onMeasureDragConstraints: n } = this.getProps();
        if (!t || !_n(t)) return !1;
        const r = t.current,
            { projection: i } = this.visualElement;
        if (!i || !i.layout) return !1;
        const s = xS(r, i.root, this.visualElement.getTransformPagePoint());
        let o = fS(i.layout.layoutBox, s);
        if (n) {
            const a = n(gS(o));
            ((this.hasMutatedConstraints = !!a), a && (o = mg(a)));
        }
        return o;
    }
    startAnimation(t) {
        const {
                drag: n,
                dragMomentum: r,
                dragElastic: i,
                dragTransition: s,
                dragSnapToOrigin: o,
                onDragTransitionEnd: a,
            } = this.getProps(),
            l = this.constraints || {},
            u = Ue((c) => {
                if (!$i(c, n, this.currentDirection)) return;
                let d = (l && l[c]) || {};
                o && (d = { min: 0, max: 0 });
                const f = i ? 200 : 1e6,
                    m = i ? 40 : 1e7,
                    v = {
                        type: 'inertia',
                        velocity: r ? t[c] : 0,
                        bounceStiffness: f,
                        bounceDamping: m,
                        timeConstant: 750,
                        restDelta: 1,
                        restSpeed: 10,
                        ...s,
                        ...d,
                    };
                return this.startAxisValueAnimation(c, v);
            });
        return Promise.all(u).then(a);
    }
    startAxisValueAnimation(t, n) {
        const r = this.getAxisMotionValue(t);
        return (Za(this.visualElement, t), r.start(_u(t, r, 0, n, this.visualElement, !1)));
    }
    stopAnimation() {
        Ue((t) => this.getAxisMotionValue(t).stop());
    }
    pauseAnimation() {
        Ue((t) => {
            var n;
            return (n = this.getAxisMotionValue(t).animation) === null || n === void 0
                ? void 0
                : n.pause();
        });
    }
    getAnimationState(t) {
        var n;
        return (n = this.getAxisMotionValue(t).animation) === null || n === void 0
            ? void 0
            : n.state;
    }
    getAxisMotionValue(t) {
        const n = `_drag${t.toUpperCase()}`,
            r = this.visualElement.getProps(),
            i = r[n];
        return i || this.visualElement.getValue(t, (r.initial ? r.initial[t] : void 0) || 0);
    }
    snapToCursor(t) {
        Ue((n) => {
            const { drag: r } = this.getProps();
            if (!$i(n, r, this.currentDirection)) return;
            const { projection: i } = this.visualElement,
                s = this.getAxisMotionValue(n);
            if (i && i.layout) {
                const { min: o, max: a } = i.layout.layoutBox[n];
                s.set(t[n] - ee(o, a, 0.5));
            }
        });
    }
    scalePositionWithinConstraints() {
        if (!this.visualElement.current) return;
        const { drag: t, dragConstraints: n } = this.getProps(),
            { projection: r } = this.visualElement;
        if (!_n(n) || !r || !this.constraints) return;
        this.stopAnimation();
        const i = { x: 0, y: 0 };
        Ue((o) => {
            const a = this.getAxisMotionValue(o);
            if (a && this.constraints !== !1) {
                const l = a.get();
                i[o] = hS({ min: l, max: l }, this.constraints[o]);
            }
        });
        const { transformTemplate: s } = this.visualElement.getProps();
        ((this.visualElement.current.style.transform = s ? s({}, '') : 'none'),
            r.root && r.root.updateScroll(),
            r.updateLayout(),
            this.resolveConstraints(),
            Ue((o) => {
                if (!$i(o, t, null)) return;
                const a = this.getAxisMotionValue(o),
                    { min: l, max: u } = this.constraints[o];
                a.set(ee(l, u, i[o]));
            }));
    }
    addListeners() {
        if (!this.visualElement.current) return;
        wS.set(this.visualElement, this);
        const t = this.visualElement.current,
            n = Fr(t, 'pointerdown', (l) => {
                const { drag: u, dragListener: c = !0 } = this.getProps();
                u && c && this.start(l);
            }),
            r = () => {
                const { dragConstraints: l } = this.getProps();
                _n(l) && l.current && (this.constraints = this.resolveRefConstraints());
            },
            { projection: i } = this.visualElement,
            s = i.addEventListener('measure', r);
        (i && !i.layout && (i.root && i.root.updateScroll(), i.updateLayout()), Y.read(r));
        const o = ci(window, 'resize', () => this.scalePositionWithinConstraints()),
            a = i.addEventListener('didUpdate', ({ delta: l, hasLayoutChanged: u }) => {
                this.isDragging &&
                    u &&
                    (Ue((c) => {
                        const d = this.getAxisMotionValue(c);
                        d &&
                            ((this.originPoint[c] += l[c].translate),
                            d.set(d.get() + l[c].translate));
                    }),
                    this.visualElement.render());
            });
        return () => {
            (o(), n(), s(), a && a());
        };
    }
    getProps() {
        const t = this.visualElement.getProps(),
            {
                drag: n = !1,
                dragDirectionLock: r = !1,
                dragPropagation: i = !1,
                dragConstraints: s = !1,
                dragElastic: o = sl,
                dragMomentum: a = !0,
            } = t;
        return {
            ...t,
            drag: n,
            dragDirectionLock: r,
            dragPropagation: i,
            dragConstraints: s,
            dragElastic: o,
            dragMomentum: a,
        };
    }
}
function $i(e, t, n) {
    return (t === !0 || t === e) && (n === null || n === e);
}
function kS(e, t = 10) {
    let n = null;
    return (Math.abs(e.y) > t ? (n = 'y') : Math.abs(e.x) > t && (n = 'x'), n);
}
class CS extends Xt {
    constructor(t) {
        (super(t),
            (this.removeGroupControls = _e),
            (this.removeListeners = _e),
            (this.controls = new SS(t)));
    }
    mount() {
        const { dragControls: t } = this.node.getProps();
        (t && (this.removeGroupControls = t.subscribe(this.controls)),
            (this.removeListeners = this.controls.addListeners() || _e));
    }
    unmount() {
        (this.removeGroupControls(), this.removeListeners());
    }
}
const tf = (e) => (t, n) => {
    e && Y.postRender(() => e(t, n));
};
class PS extends Xt {
    constructor() {
        (super(...arguments), (this.removePointerDownListener = _e));
    }
    onPointerDown(t) {
        this.session = new dg(t, this.createPanHandlers(), {
            transformPagePoint: this.node.getTransformPagePoint(),
            contextWindow: xg(this.node),
        });
    }
    createPanHandlers() {
        const { onPanSessionStart: t, onPanStart: n, onPan: r, onPanEnd: i } = this.node.getProps();
        return {
            onSessionStart: tf(t),
            onStart: tf(n),
            onMove: r,
            onEnd: (s, o) => {
                (delete this.session, i && Y.postRender(() => i(s, o)));
            },
        };
    }
    mount() {
        this.removePointerDownListener = Fr(this.node.current, 'pointerdown', (t) =>
            this.onPointerDown(t),
        );
    }
    update() {
        this.session && this.session.updateHandlers(this.createPanHandlers());
    }
    unmount() {
        (this.removePointerDownListener(), this.session && this.session.end());
    }
}
const rs = { hasAnimatedSinceResize: !0, hasEverUpdated: !1 };
function nf(e, t) {
    return t.max === t.min ? 0 : (e / (t.max - t.min)) * 100;
}
const xr = {
        correct: (e, t) => {
            if (!t.target) return e;
            if (typeof e == 'string')
                if (M.test(e)) e = parseFloat(e);
                else return e;
            const n = nf(e, t.target.x),
                r = nf(e, t.target.y);
            return `${n}% ${r}%`;
        },
    },
    TS = {
        correct: (e, { treeScale: t, projectionDelta: n }) => {
            const r = e,
                i = Kt.parse(e);
            if (i.length > 5) return r;
            const s = Kt.createTransformer(e),
                o = typeof i[0] != 'number' ? 1 : 0,
                a = n.x.scale * t.x,
                l = n.y.scale * t.y;
            ((i[0 + o] /= a), (i[1 + o] /= l));
            const u = ee(a, l, 0.5);
            return (
                typeof i[2 + o] == 'number' && (i[2 + o] /= u),
                typeof i[3 + o] == 'number' && (i[3 + o] /= u),
                s(i)
            );
        },
    };
class ES extends L.Component {
    componentDidMount() {
        const { visualElement: t, layoutGroup: n, switchLayoutGroup: r, layoutId: i } = this.props,
            { projection: s } = t;
        (Kx(NS),
            s &&
                (n.group && n.group.add(s),
                r && r.register && i && r.register(s),
                s.root.didUpdate(),
                s.addEventListener('animationComplete', () => {
                    this.safeToRemove();
                }),
                s.setOptions({ ...s.options, onExitComplete: () => this.safeToRemove() })),
            (rs.hasEverUpdated = !0));
    }
    getSnapshotBeforeUpdate(t) {
        const { layoutDependency: n, visualElement: r, drag: i, isPresent: s } = this.props,
            o = r.projection;
        return (
            o &&
                ((o.isPresent = s),
                i || t.layoutDependency !== n || n === void 0
                    ? o.willUpdate()
                    : this.safeToRemove(),
                t.isPresent !== s &&
                    (s
                        ? o.promote()
                        : o.relegate() ||
                          Y.postRender(() => {
                              const a = o.getStack();
                              (!a || !a.members.length) && this.safeToRemove();
                          }))),
            null
        );
    }
    componentDidUpdate() {
        const { projection: t } = this.props.visualElement;
        t &&
            (t.root.didUpdate(),
            fu.postRender(() => {
                !t.currentAnimation && t.isLead() && this.safeToRemove();
            }));
    }
    componentWillUnmount() {
        const { visualElement: t, layoutGroup: n, switchLayoutGroup: r } = this.props,
            { projection: i } = t;
        i &&
            (i.scheduleCheckAfterUnmount(),
            n && n.group && n.group.remove(i),
            r && r.deregister && r.deregister(i));
    }
    safeToRemove() {
        const { safeToRemove: t } = this.props;
        t && t();
    }
    render() {
        return null;
    }
}
function wg(e) {
    const [t, n] = nm(),
        r = L.useContext(iu);
    return g.jsx(ES, {
        ...e,
        layoutGroup: r,
        switchLayoutGroup: L.useContext(cm),
        isPresent: t,
        safeToRemove: n,
    });
}
const NS = {
    borderRadius: {
        ...xr,
        applyTo: [
            'borderTopLeftRadius',
            'borderTopRightRadius',
            'borderBottomLeftRadius',
            'borderBottomRightRadius',
        ],
    },
    borderTopLeftRadius: xr,
    borderTopRightRadius: xr,
    borderBottomLeftRadius: xr,
    borderBottomRightRadius: xr,
    boxShadow: TS,
};
function LS(e, t, n) {
    const r = ke(e) ? e : li(e);
    return (r.start(_u('', r, t, n)), r.animation);
}
function jS(e) {
    return e instanceof SVGElement && e.tagName !== 'svg';
}
const RS = (e, t) => e.depth - t.depth;
class AS {
    constructor() {
        ((this.children = []), (this.isDirty = !1));
    }
    add(t) {
        (Eu(this.children, t), (this.isDirty = !0));
    }
    remove(t) {
        (Nu(this.children, t), (this.isDirty = !0));
    }
    forEach(t) {
        (this.isDirty && this.children.sort(RS), (this.isDirty = !1), this.children.forEach(t));
    }
}
function DS(e, t) {
    const n = ht.now(),
        r = ({ timestamp: i }) => {
            const s = i - n;
            s >= t && (Wt(r), e(s - t));
        };
    return (Y.read(r, !0), () => Wt(r));
}
const Sg = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'],
    MS = Sg.length,
    rf = (e) => (typeof e == 'string' ? parseFloat(e) : e),
    sf = (e) => typeof e == 'number' || M.test(e);
function OS(e, t, n, r, i, s) {
    i
        ? ((e.opacity = ee(0, n.opacity !== void 0 ? n.opacity : 1, VS(r))),
          (e.opacityExit = ee(t.opacity !== void 0 ? t.opacity : 1, 0, bS(r))))
        : s &&
          (e.opacity = ee(
              t.opacity !== void 0 ? t.opacity : 1,
              n.opacity !== void 0 ? n.opacity : 1,
              r,
          ));
    for (let o = 0; o < MS; o++) {
        const a = `border${Sg[o]}Radius`;
        let l = of(t, a),
            u = of(n, a);
        if (l === void 0 && u === void 0) continue;
        (l || (l = 0),
            u || (u = 0),
            l === 0 || u === 0 || sf(l) === sf(u)
                ? ((e[a] = Math.max(ee(rf(l), rf(u), r), 0)),
                  (ft.test(u) || ft.test(l)) && (e[a] += '%'))
                : (e[a] = u));
    }
    (t.rotate || n.rotate) && (e.rotate = ee(t.rotate || 0, n.rotate || 0, r));
}
function of(e, t) {
    return e[t] !== void 0 ? e[t] : e.borderRadius;
}
const VS = kg(0, 0.5, zm),
    bS = kg(0.5, 0.95, _e);
function kg(e, t, n) {
    return (r) => (r < e ? 0 : r > t ? 1 : n(nr(e, t, r)));
}
function af(e, t) {
    ((e.min = t.min), (e.max = t.max));
}
function $e(e, t) {
    (af(e.x, t.x), af(e.y, t.y));
}
function lf(e, t) {
    ((e.translate = t.translate),
        (e.scale = t.scale),
        (e.originPoint = t.originPoint),
        (e.origin = t.origin));
}
function uf(e, t, n, r, i) {
    return ((e -= t), (e = _s(e, 1 / n, r)), i !== void 0 && (e = _s(e, 1 / i, r)), e);
}
function _S(e, t = 0, n = 1, r = 0.5, i, s = e, o = e) {
    if (
        (ft.test(t) && ((t = parseFloat(t)), (t = ee(o.min, o.max, t / 100) - o.min)),
        typeof t != 'number')
    )
        return;
    let a = ee(s.min, s.max, r);
    (e === s && (a -= t), (e.min = uf(e.min, t, n, a, i)), (e.max = uf(e.max, t, n, a, i)));
}
function cf(e, t, [n, r, i], s, o) {
    _S(e, t[n], t[r], t[i], t.scale, s, o);
}
const IS = ['x', 'scaleX', 'originX'],
    FS = ['y', 'scaleY', 'originY'];
function df(e, t, n, r) {
    (cf(e.x, t, IS, n ? n.x : void 0, r ? r.x : void 0),
        cf(e.y, t, FS, n ? n.y : void 0, r ? r.y : void 0));
}
function ff(e) {
    return e.translate === 0 && e.scale === 1;
}
function Cg(e) {
    return ff(e.x) && ff(e.y);
}
function hf(e, t) {
    return e.min === t.min && e.max === t.max;
}
function zS(e, t) {
    return hf(e.x, t.x) && hf(e.y, t.y);
}
function pf(e, t) {
    return Math.round(e.min) === Math.round(t.min) && Math.round(e.max) === Math.round(t.max);
}
function Pg(e, t) {
    return pf(e.x, t.x) && pf(e.y, t.y);
}
function mf(e) {
    return Fe(e.x) / Fe(e.y);
}
function gf(e, t) {
    return e.translate === t.translate && e.scale === t.scale && e.originPoint === t.originPoint;
}
class BS {
    constructor() {
        this.members = [];
    }
    add(t) {
        (Eu(this.members, t), t.scheduleRender());
    }
    remove(t) {
        if (
            (Nu(this.members, t), t === this.prevLead && (this.prevLead = void 0), t === this.lead)
        ) {
            const n = this.members[this.members.length - 1];
            n && this.promote(n);
        }
    }
    relegate(t) {
        const n = this.members.findIndex((i) => t === i);
        if (n === 0) return !1;
        let r;
        for (let i = n; i >= 0; i--) {
            const s = this.members[i];
            if (s.isPresent !== !1) {
                r = s;
                break;
            }
        }
        return r ? (this.promote(r), !0) : !1;
    }
    promote(t, n) {
        const r = this.lead;
        if (t !== r && ((this.prevLead = r), (this.lead = t), t.show(), r)) {
            (r.instance && r.scheduleRender(),
                t.scheduleRender(),
                (t.resumeFrom = r),
                n && (t.resumeFrom.preserveOpacity = !0),
                r.snapshot &&
                    ((t.snapshot = r.snapshot),
                    (t.snapshot.latestValues = r.animationValues || r.latestValues)),
                t.root && t.root.isUpdating && (t.isLayoutDirty = !0));
            const { crossfade: i } = t.options;
            i === !1 && r.hide();
        }
    }
    exitAnimationComplete() {
        this.members.forEach((t) => {
            const { options: n, resumingFrom: r } = t;
            (n.onExitComplete && n.onExitComplete(),
                r && r.options.onExitComplete && r.options.onExitComplete());
        });
    }
    scheduleRender() {
        this.members.forEach((t) => {
            t.instance && t.scheduleRender(!1);
        });
    }
    removeLeadSnapshot() {
        this.lead && this.lead.snapshot && (this.lead.snapshot = void 0);
    }
}
function $S(e, t, n) {
    let r = '';
    const i = e.x.translate / t.x,
        s = e.y.translate / t.y,
        o = (n == null ? void 0 : n.z) || 0;
    if (
        ((i || s || o) && (r = `translate3d(${i}px, ${s}px, ${o}px) `),
        (t.x !== 1 || t.y !== 1) && (r += `scale(${1 / t.x}, ${1 / t.y}) `),
        n)
    ) {
        const {
            transformPerspective: u,
            rotate: c,
            rotateX: d,
            rotateY: f,
            skewX: m,
            skewY: v,
        } = n;
        (u && (r = `perspective(${u}px) ${r}`),
            c && (r += `rotate(${c}deg) `),
            d && (r += `rotateX(${d}deg) `),
            f && (r += `rotateY(${f}deg) `),
            m && (r += `skewX(${m}deg) `),
            v && (r += `skewY(${v}deg) `));
    }
    const a = e.x.scale * t.x,
        l = e.y.scale * t.y;
    return ((a !== 1 || l !== 1) && (r += `scale(${a}, ${l})`), r || 'none');
}
const nn = {
        type: 'projectionFrame',
        totalNodes: 0,
        resolvedTargetDeltas: 0,
        recalculatedProjection: 0,
    },
    Er = typeof window < 'u' && window.MotionDebug !== void 0,
    Go = ['', 'X', 'Y', 'Z'],
    US = { visibility: 'hidden' },
    yf = 1e3;
let HS = 0;
function Qo(e, t, n, r) {
    const { latestValues: i } = t;
    i[e] && ((n[e] = i[e]), t.setStaticValue(e, 0), r && (r[e] = 0));
}
function Tg(e) {
    if (((e.hasCheckedOptimisedAppear = !0), e.root === e)) return;
    const { visualElement: t } = e.options;
    if (!t) return;
    const n = Mm(t);
    if (window.MotionHasOptimisedAnimation(n, 'transform')) {
        const { layout: i, layoutId: s } = e.options;
        window.MotionCancelOptimisedAnimation(n, 'transform', Y, !(i || s));
    }
    const { parent: r } = e;
    r && !r.hasCheckedOptimisedAppear && Tg(r);
}
function Eg({
    attachResizeListener: e,
    defaultParent: t,
    measureScroll: n,
    checkIsScrollRoot: r,
    resetTransform: i,
}) {
    return class {
        constructor(o = {}, a = t == null ? void 0 : t()) {
            ((this.id = HS++),
                (this.animationId = 0),
                (this.children = new Set()),
                (this.options = {}),
                (this.isTreeAnimating = !1),
                (this.isAnimationBlocked = !1),
                (this.isLayoutDirty = !1),
                (this.isProjectionDirty = !1),
                (this.isSharedProjectionDirty = !1),
                (this.isTransformDirty = !1),
                (this.updateManuallyBlocked = !1),
                (this.updateBlockedByResize = !1),
                (this.isUpdating = !1),
                (this.isSVG = !1),
                (this.needsReset = !1),
                (this.shouldResetTransform = !1),
                (this.hasCheckedOptimisedAppear = !1),
                (this.treeScale = { x: 1, y: 1 }),
                (this.eventHandlers = new Map()),
                (this.hasTreeAnimated = !1),
                (this.updateScheduled = !1),
                (this.scheduleUpdate = () => this.update()),
                (this.projectionUpdateScheduled = !1),
                (this.checkUpdateFailed = () => {
                    this.isUpdating && ((this.isUpdating = !1), this.clearAllSnapshots());
                }),
                (this.updateProjection = () => {
                    ((this.projectionUpdateScheduled = !1),
                        Er &&
                            (nn.totalNodes =
                                nn.resolvedTargetDeltas =
                                nn.recalculatedProjection =
                                    0),
                        this.nodes.forEach(GS),
                        this.nodes.forEach(qS),
                        this.nodes.forEach(JS),
                        this.nodes.forEach(QS),
                        Er && window.MotionDebug.record(nn));
                }),
                (this.resolvedRelativeTargetAt = 0),
                (this.hasProjected = !1),
                (this.isVisible = !0),
                (this.animationProgress = 0),
                (this.sharedNodes = new Map()),
                (this.latestValues = o),
                (this.root = a ? a.root || a : this),
                (this.path = a ? [...a.path, a] : []),
                (this.parent = a),
                (this.depth = a ? a.depth + 1 : 0));
            for (let l = 0; l < this.path.length; l++) this.path[l].shouldResetTransform = !0;
            this.root === this && (this.nodes = new AS());
        }
        addEventListener(o, a) {
            return (
                this.eventHandlers.has(o) || this.eventHandlers.set(o, new Lu()),
                this.eventHandlers.get(o).add(a)
            );
        }
        notifyListeners(o, ...a) {
            const l = this.eventHandlers.get(o);
            l && l.notify(...a);
        }
        hasListeners(o) {
            return this.eventHandlers.has(o);
        }
        mount(o, a = this.root.hasTreeAnimated) {
            if (this.instance) return;
            ((this.isSVG = jS(o)), (this.instance = o));
            const { layoutId: l, layout: u, visualElement: c } = this.options;
            if (
                (c && !c.current && c.mount(o),
                this.root.nodes.add(this),
                this.parent && this.parent.children.add(this),
                a && (u || l) && (this.isLayoutDirty = !0),
                e)
            ) {
                let d;
                const f = () => (this.root.updateBlockedByResize = !1);
                e(o, () => {
                    ((this.root.updateBlockedByResize = !0),
                        d && d(),
                        (d = DS(f, 250)),
                        rs.hasAnimatedSinceResize &&
                            ((rs.hasAnimatedSinceResize = !1), this.nodes.forEach(xf)));
                });
            }
            (l && this.root.registerSharedNode(l, this),
                this.options.animate !== !1 &&
                    c &&
                    (l || u) &&
                    this.addEventListener(
                        'didUpdate',
                        ({
                            delta: d,
                            hasLayoutChanged: f,
                            hasRelativeTargetChanged: m,
                            layout: v,
                        }) => {
                            if (this.isTreeAnimationBlocked()) {
                                ((this.target = void 0), (this.relativeTarget = void 0));
                                return;
                            }
                            const x = this.options.transition || c.getDefaultTransition() || ik,
                                { onLayoutAnimationStart: k, onLayoutAnimationComplete: p } =
                                    c.getProps(),
                                h = !this.targetLayout || !Pg(this.targetLayout, v) || m,
                                y = !f && m;
                            if (
                                this.options.layoutRoot ||
                                (this.resumeFrom && this.resumeFrom.instance) ||
                                y ||
                                (f && (h || !this.currentAnimation))
                            ) {
                                (this.resumeFrom &&
                                    ((this.resumingFrom = this.resumeFrom),
                                    (this.resumingFrom.resumingFrom = void 0)),
                                    this.setAnimationOrigin(d, y));
                                const w = { ...ku(x, 'layout'), onPlay: k, onComplete: p };
                                ((c.shouldReduceMotion || this.options.layoutRoot) &&
                                    ((w.delay = 0), (w.type = !1)),
                                    this.startAnimation(w));
                            } else
                                (f || xf(this),
                                    this.isLead() &&
                                        this.options.onExitComplete &&
                                        this.options.onExitComplete());
                            this.targetLayout = v;
                        },
                    ));
        }
        unmount() {
            (this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this));
            const o = this.getStack();
            (o && o.remove(this),
                this.parent && this.parent.children.delete(this),
                (this.instance = void 0),
                Wt(this.updateProjection));
        }
        blockUpdate() {
            this.updateManuallyBlocked = !0;
        }
        unblockUpdate() {
            this.updateManuallyBlocked = !1;
        }
        isUpdateBlocked() {
            return this.updateManuallyBlocked || this.updateBlockedByResize;
        }
        isTreeAnimationBlocked() {
            return (
                this.isAnimationBlocked ||
                (this.parent && this.parent.isTreeAnimationBlocked()) ||
                !1
            );
        }
        startUpdate() {
            this.isUpdateBlocked() ||
                ((this.isUpdating = !0), this.nodes && this.nodes.forEach(ek), this.animationId++);
        }
        getTransformTemplate() {
            const { visualElement: o } = this.options;
            return o && o.getProps().transformTemplate;
        }
        willUpdate(o = !0) {
            if (((this.root.hasTreeAnimated = !0), this.root.isUpdateBlocked())) {
                this.options.onExitComplete && this.options.onExitComplete();
                return;
            }
            if (
                (window.MotionCancelOptimisedAnimation &&
                    !this.hasCheckedOptimisedAppear &&
                    Tg(this),
                !this.root.isUpdating && this.root.startUpdate(),
                this.isLayoutDirty)
            )
                return;
            this.isLayoutDirty = !0;
            for (let c = 0; c < this.path.length; c++) {
                const d = this.path[c];
                ((d.shouldResetTransform = !0),
                    d.updateScroll('snapshot'),
                    d.options.layoutRoot && d.willUpdate(!1));
            }
            const { layoutId: a, layout: l } = this.options;
            if (a === void 0 && !l) return;
            const u = this.getTransformTemplate();
            ((this.prevTransformTemplateValue = u ? u(this.latestValues, '') : void 0),
                this.updateSnapshot(),
                o && this.notifyListeners('willUpdate'));
        }
        update() {
            if (((this.updateScheduled = !1), this.isUpdateBlocked())) {
                (this.unblockUpdate(), this.clearAllSnapshots(), this.nodes.forEach(vf));
                return;
            }
            (this.isUpdating || this.nodes.forEach(XS),
                (this.isUpdating = !1),
                this.nodes.forEach(ZS),
                this.nodes.forEach(WS),
                this.nodes.forEach(KS),
                this.clearAllSnapshots());
            const a = ht.now();
            ((me.delta = Tt(0, 1e3 / 60, a - me.timestamp)),
                (me.timestamp = a),
                (me.isProcessing = !0),
                Io.update.process(me),
                Io.preRender.process(me),
                Io.render.process(me),
                (me.isProcessing = !1));
        }
        didUpdate() {
            this.updateScheduled || ((this.updateScheduled = !0), fu.read(this.scheduleUpdate));
        }
        clearAllSnapshots() {
            (this.nodes.forEach(YS), this.sharedNodes.forEach(tk));
        }
        scheduleUpdateProjection() {
            this.projectionUpdateScheduled ||
                ((this.projectionUpdateScheduled = !0), Y.preRender(this.updateProjection, !1, !0));
        }
        scheduleCheckAfterUnmount() {
            Y.postRender(() => {
                this.isLayoutDirty ? this.root.didUpdate() : this.root.checkUpdateFailed();
            });
        }
        updateSnapshot() {
            this.snapshot || !this.instance || (this.snapshot = this.measure());
        }
        updateLayout() {
            if (
                !this.instance ||
                (this.updateScroll(),
                !(this.options.alwaysMeasureLayout && this.isLead()) && !this.isLayoutDirty)
            )
                return;
            if (this.resumeFrom && !this.resumeFrom.instance)
                for (let l = 0; l < this.path.length; l++) this.path[l].updateScroll();
            const o = this.layout;
            ((this.layout = this.measure(!1)),
                (this.layoutCorrected = oe()),
                (this.isLayoutDirty = !1),
                (this.projectionDelta = void 0),
                this.notifyListeners('measure', this.layout.layoutBox));
            const { visualElement: a } = this.options;
            a && a.notify('LayoutMeasure', this.layout.layoutBox, o ? o.layoutBox : void 0);
        }
        updateScroll(o = 'measure') {
            let a = !!(this.options.layoutScroll && this.instance);
            if (
                (this.scroll &&
                    this.scroll.animationId === this.root.animationId &&
                    this.scroll.phase === o &&
                    (a = !1),
                a)
            ) {
                const l = r(this.instance);
                this.scroll = {
                    animationId: this.root.animationId,
                    phase: o,
                    isRoot: l,
                    offset: n(this.instance),
                    wasRoot: this.scroll ? this.scroll.isRoot : l,
                };
            }
        }
        resetTransform() {
            if (!i) return;
            const o =
                    this.isLayoutDirty ||
                    this.shouldResetTransform ||
                    this.options.alwaysMeasureLayout,
                a = this.projectionDelta && !Cg(this.projectionDelta),
                l = this.getTransformTemplate(),
                u = l ? l(this.latestValues, '') : void 0,
                c = u !== this.prevTransformTemplateValue;
            o &&
                (a || tn(this.latestValues) || c) &&
                (i(this.instance, u), (this.shouldResetTransform = !1), this.scheduleRender());
        }
        measure(o = !0) {
            const a = this.measurePageBox();
            let l = this.removeElementScroll(a);
            return (
                o && (l = this.removeTransform(l)),
                sk(l),
                {
                    animationId: this.root.animationId,
                    measuredBox: a,
                    layoutBox: l,
                    latestValues: {},
                    source: this.id,
                }
            );
        }
        measurePageBox() {
            var o;
            const { visualElement: a } = this.options;
            if (!a) return oe();
            const l = a.measureViewportBox();
            if (
                !(
                    ((o = this.scroll) === null || o === void 0 ? void 0 : o.wasRoot) ||
                    this.path.some(ok)
                )
            ) {
                const { scroll: c } = this.root;
                c && (zn(l.x, c.offset.x), zn(l.y, c.offset.y));
            }
            return l;
        }
        removeElementScroll(o) {
            var a;
            const l = oe();
            if (($e(l, o), !((a = this.scroll) === null || a === void 0) && a.wasRoot)) return l;
            for (let u = 0; u < this.path.length; u++) {
                const c = this.path[u],
                    { scroll: d, options: f } = c;
                c !== this.root &&
                    d &&
                    f.layoutScroll &&
                    (d.wasRoot && $e(l, o), zn(l.x, d.offset.x), zn(l.y, d.offset.y));
            }
            return l;
        }
        applyTransform(o, a = !1) {
            const l = oe();
            $e(l, o);
            for (let u = 0; u < this.path.length; u++) {
                const c = this.path[u];
                (!a &&
                    c.options.layoutScroll &&
                    c.scroll &&
                    c !== c.root &&
                    Bn(l, { x: -c.scroll.offset.x, y: -c.scroll.offset.y }),
                    tn(c.latestValues) && Bn(l, c.latestValues));
            }
            return (tn(this.latestValues) && Bn(l, this.latestValues), l);
        }
        removeTransform(o) {
            const a = oe();
            $e(a, o);
            for (let l = 0; l < this.path.length; l++) {
                const u = this.path[l];
                if (!u.instance || !tn(u.latestValues)) continue;
                ol(u.latestValues) && u.updateSnapshot();
                const c = oe(),
                    d = u.measurePageBox();
                ($e(c, d), df(a, u.latestValues, u.snapshot ? u.snapshot.layoutBox : void 0, c));
            }
            return (tn(this.latestValues) && df(a, this.latestValues), a);
        }
        setTargetDelta(o) {
            ((this.targetDelta = o),
                this.root.scheduleUpdateProjection(),
                (this.isProjectionDirty = !0));
        }
        setOptions(o) {
            this.options = {
                ...this.options,
                ...o,
                crossfade: o.crossfade !== void 0 ? o.crossfade : !0,
            };
        }
        clearMeasurements() {
            ((this.scroll = void 0),
                (this.layout = void 0),
                (this.snapshot = void 0),
                (this.prevTransformTemplateValue = void 0),
                (this.targetDelta = void 0),
                (this.target = void 0),
                (this.isLayoutDirty = !1));
        }
        forceRelativeParentToResolveTarget() {
            this.relativeParent &&
                this.relativeParent.resolvedRelativeTargetAt !== me.timestamp &&
                this.relativeParent.resolveTargetDelta(!0);
        }
        resolveTargetDelta(o = !1) {
            var a;
            const l = this.getLead();
            (this.isProjectionDirty || (this.isProjectionDirty = l.isProjectionDirty),
                this.isTransformDirty || (this.isTransformDirty = l.isTransformDirty),
                this.isSharedProjectionDirty ||
                    (this.isSharedProjectionDirty = l.isSharedProjectionDirty));
            const u = !!this.resumingFrom || this !== l;
            if (
                !(
                    o ||
                    (u && this.isSharedProjectionDirty) ||
                    this.isProjectionDirty ||
                    (!((a = this.parent) === null || a === void 0) && a.isProjectionDirty) ||
                    this.attemptToResolveRelativeTarget ||
                    this.root.updateBlockedByResize
                )
            )
                return;
            const { layout: d, layoutId: f } = this.options;
            if (!(!this.layout || !(d || f))) {
                if (
                    ((this.resolvedRelativeTargetAt = me.timestamp),
                    !this.targetDelta && !this.relativeTarget)
                ) {
                    const m = this.getClosestProjectingParent();
                    m && m.layout && this.animationProgress !== 1
                        ? ((this.relativeParent = m),
                          this.forceRelativeParentToResolveTarget(),
                          (this.relativeTarget = oe()),
                          (this.relativeTargetOrigin = oe()),
                          Br(this.relativeTargetOrigin, this.layout.layoutBox, m.layout.layoutBox),
                          $e(this.relativeTarget, this.relativeTargetOrigin))
                        : (this.relativeParent = this.relativeTarget = void 0);
                }
                if (!(!this.relativeTarget && !this.targetDelta)) {
                    if (
                        (this.target || ((this.target = oe()), (this.targetWithTransforms = oe())),
                        this.relativeTarget &&
                        this.relativeTargetOrigin &&
                        this.relativeParent &&
                        this.relativeParent.target
                            ? (this.forceRelativeParentToResolveTarget(),
                              uS(this.target, this.relativeTarget, this.relativeParent.target))
                            : this.targetDelta
                              ? (this.resumingFrom
                                    ? (this.target = this.applyTransform(this.layout.layoutBox))
                                    : $e(this.target, this.layout.layoutBox),
                                yg(this.target, this.targetDelta))
                              : $e(this.target, this.layout.layoutBox),
                        this.attemptToResolveRelativeTarget)
                    ) {
                        this.attemptToResolveRelativeTarget = !1;
                        const m = this.getClosestProjectingParent();
                        m &&
                        !!m.resumingFrom == !!this.resumingFrom &&
                        !m.options.layoutScroll &&
                        m.target &&
                        this.animationProgress !== 1
                            ? ((this.relativeParent = m),
                              this.forceRelativeParentToResolveTarget(),
                              (this.relativeTarget = oe()),
                              (this.relativeTargetOrigin = oe()),
                              Br(this.relativeTargetOrigin, this.target, m.target),
                              $e(this.relativeTarget, this.relativeTargetOrigin))
                            : (this.relativeParent = this.relativeTarget = void 0);
                    }
                    Er && nn.resolvedTargetDeltas++;
                }
            }
        }
        getClosestProjectingParent() {
            if (!(!this.parent || ol(this.parent.latestValues) || gg(this.parent.latestValues)))
                return this.parent.isProjecting()
                    ? this.parent
                    : this.parent.getClosestProjectingParent();
        }
        isProjecting() {
            return !!(
                (this.relativeTarget || this.targetDelta || this.options.layoutRoot) &&
                this.layout
            );
        }
        calcProjection() {
            var o;
            const a = this.getLead(),
                l = !!this.resumingFrom || this !== a;
            let u = !0;
            if (
                ((this.isProjectionDirty ||
                    (!((o = this.parent) === null || o === void 0) && o.isProjectionDirty)) &&
                    (u = !1),
                l && (this.isSharedProjectionDirty || this.isTransformDirty) && (u = !1),
                this.resolvedRelativeTargetAt === me.timestamp && (u = !1),
                u)
            )
                return;
            const { layout: c, layoutId: d } = this.options;
            if (
                ((this.isTreeAnimating = !!(
                    (this.parent && this.parent.isTreeAnimating) ||
                    this.currentAnimation ||
                    this.pendingAnimation
                )),
                this.isTreeAnimating || (this.targetDelta = this.relativeTarget = void 0),
                !this.layout || !(c || d))
            )
                return;
            $e(this.layoutCorrected, this.layout.layoutBox);
            const f = this.treeScale.x,
                m = this.treeScale.y;
            (vS(this.layoutCorrected, this.treeScale, this.path, l),
                a.layout &&
                    !a.target &&
                    (this.treeScale.x !== 1 || this.treeScale.y !== 1) &&
                    ((a.target = a.layout.layoutBox), (a.targetWithTransforms = oe())));
            const { target: v } = a;
            if (!v) {
                this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
                return;
            }
            (!this.projectionDelta || !this.prevProjectionDelta
                ? this.createProjectionDeltas()
                : (lf(this.prevProjectionDelta.x, this.projectionDelta.x),
                  lf(this.prevProjectionDelta.y, this.projectionDelta.y)),
                zr(this.projectionDelta, this.layoutCorrected, v, this.latestValues),
                (this.treeScale.x !== f ||
                    this.treeScale.y !== m ||
                    !gf(this.projectionDelta.x, this.prevProjectionDelta.x) ||
                    !gf(this.projectionDelta.y, this.prevProjectionDelta.y)) &&
                    ((this.hasProjected = !0),
                    this.scheduleRender(),
                    this.notifyListeners('projectionUpdate', v)),
                Er && nn.recalculatedProjection++);
        }
        hide() {
            this.isVisible = !1;
        }
        show() {
            this.isVisible = !0;
        }
        scheduleRender(o = !0) {
            var a;
            if (
                ((a = this.options.visualElement) === null || a === void 0 || a.scheduleRender(), o)
            ) {
                const l = this.getStack();
                l && l.scheduleRender();
            }
            this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = void 0);
        }
        createProjectionDeltas() {
            ((this.prevProjectionDelta = Fn()),
                (this.projectionDelta = Fn()),
                (this.projectionDeltaWithTransform = Fn()));
        }
        setAnimationOrigin(o, a = !1) {
            const l = this.snapshot,
                u = l ? l.latestValues : {},
                c = { ...this.latestValues },
                d = Fn();
            ((!this.relativeParent || !this.relativeParent.options.layoutRoot) &&
                (this.relativeTarget = this.relativeTargetOrigin = void 0),
                (this.attemptToResolveRelativeTarget = !a));
            const f = oe(),
                m = l ? l.source : void 0,
                v = this.layout ? this.layout.source : void 0,
                x = m !== v,
                k = this.getStack(),
                p = !k || k.members.length <= 1,
                h = !!(x && !p && this.options.crossfade === !0 && !this.path.some(rk));
            this.animationProgress = 0;
            let y;
            ((this.mixTargetDelta = (w) => {
                const S = w / 1e3;
                (wf(d.x, o.x, S),
                    wf(d.y, o.y, S),
                    this.setTargetDelta(d),
                    this.relativeTarget &&
                        this.relativeTargetOrigin &&
                        this.layout &&
                        this.relativeParent &&
                        this.relativeParent.layout &&
                        (Br(f, this.layout.layoutBox, this.relativeParent.layout.layoutBox),
                        nk(this.relativeTarget, this.relativeTargetOrigin, f, S),
                        y && zS(this.relativeTarget, y) && (this.isProjectionDirty = !1),
                        y || (y = oe()),
                        $e(y, this.relativeTarget)),
                    x && ((this.animationValues = c), OS(c, u, this.latestValues, S, h, p)),
                    this.root.scheduleUpdateProjection(),
                    this.scheduleRender(),
                    (this.animationProgress = S));
            }),
                this.mixTargetDelta(this.options.layoutRoot ? 1e3 : 0));
        }
        startAnimation(o) {
            (this.notifyListeners('animationStart'),
                this.currentAnimation && this.currentAnimation.stop(),
                this.resumingFrom &&
                    this.resumingFrom.currentAnimation &&
                    this.resumingFrom.currentAnimation.stop(),
                this.pendingAnimation &&
                    (Wt(this.pendingAnimation), (this.pendingAnimation = void 0)),
                (this.pendingAnimation = Y.update(() => {
                    ((rs.hasAnimatedSinceResize = !0),
                        (this.currentAnimation = LS(0, yf, {
                            ...o,
                            onUpdate: (a) => {
                                (this.mixTargetDelta(a), o.onUpdate && o.onUpdate(a));
                            },
                            onComplete: () => {
                                (o.onComplete && o.onComplete(), this.completeAnimation());
                            },
                        })),
                        this.resumingFrom &&
                            (this.resumingFrom.currentAnimation = this.currentAnimation),
                        (this.pendingAnimation = void 0));
                })));
        }
        completeAnimation() {
            this.resumingFrom &&
                ((this.resumingFrom.currentAnimation = void 0),
                (this.resumingFrom.preserveOpacity = void 0));
            const o = this.getStack();
            (o && o.exitAnimationComplete(),
                (this.resumingFrom = this.currentAnimation = this.animationValues = void 0),
                this.notifyListeners('animationComplete'));
        }
        finishAnimation() {
            (this.currentAnimation &&
                (this.mixTargetDelta && this.mixTargetDelta(yf), this.currentAnimation.stop()),
                this.completeAnimation());
        }
        applyTransformsToTarget() {
            const o = this.getLead();
            let { targetWithTransforms: a, target: l, layout: u, latestValues: c } = o;
            if (!(!a || !l || !u)) {
                if (
                    this !== o &&
                    this.layout &&
                    u &&
                    Ng(this.options.animationType, this.layout.layoutBox, u.layoutBox)
                ) {
                    l = this.target || oe();
                    const d = Fe(this.layout.layoutBox.x);
                    ((l.x.min = o.target.x.min), (l.x.max = l.x.min + d));
                    const f = Fe(this.layout.layoutBox.y);
                    ((l.y.min = o.target.y.min), (l.y.max = l.y.min + f));
                }
                ($e(a, l),
                    Bn(a, c),
                    zr(this.projectionDeltaWithTransform, this.layoutCorrected, a, c));
            }
        }
        registerSharedNode(o, a) {
            (this.sharedNodes.has(o) || this.sharedNodes.set(o, new BS()),
                this.sharedNodes.get(o).add(a));
            const u = a.options.initialPromotionConfig;
            a.promote({
                transition: u ? u.transition : void 0,
                preserveFollowOpacity:
                    u && u.shouldPreserveFollowOpacity ? u.shouldPreserveFollowOpacity(a) : void 0,
            });
        }
        isLead() {
            const o = this.getStack();
            return o ? o.lead === this : !0;
        }
        getLead() {
            var o;
            const { layoutId: a } = this.options;
            return a
                ? ((o = this.getStack()) === null || o === void 0 ? void 0 : o.lead) || this
                : this;
        }
        getPrevLead() {
            var o;
            const { layoutId: a } = this.options;
            return a
                ? (o = this.getStack()) === null || o === void 0
                    ? void 0
                    : o.prevLead
                : void 0;
        }
        getStack() {
            const { layoutId: o } = this.options;
            if (o) return this.root.sharedNodes.get(o);
        }
        promote({ needsReset: o, transition: a, preserveFollowOpacity: l } = {}) {
            const u = this.getStack();
            (u && u.promote(this, l),
                o && ((this.projectionDelta = void 0), (this.needsReset = !0)),
                a && this.setOptions({ transition: a }));
        }
        relegate() {
            const o = this.getStack();
            return o ? o.relegate(this) : !1;
        }
        resetSkewAndRotation() {
            const { visualElement: o } = this.options;
            if (!o) return;
            let a = !1;
            const { latestValues: l } = o;
            if (
                ((l.z || l.rotate || l.rotateX || l.rotateY || l.rotateZ || l.skewX || l.skewY) &&
                    (a = !0),
                !a)
            )
                return;
            const u = {};
            l.z && Qo('z', o, u, this.animationValues);
            for (let c = 0; c < Go.length; c++)
                (Qo(`rotate${Go[c]}`, o, u, this.animationValues),
                    Qo(`skew${Go[c]}`, o, u, this.animationValues));
            o.render();
            for (const c in u)
                (o.setStaticValue(c, u[c]),
                    this.animationValues && (this.animationValues[c] = u[c]));
            o.scheduleRender();
        }
        getProjectionStyles(o) {
            var a, l;
            if (!this.instance || this.isSVG) return;
            if (!this.isVisible) return US;
            const u = { visibility: '' },
                c = this.getTransformTemplate();
            if (this.needsReset)
                return (
                    (this.needsReset = !1),
                    (u.opacity = ''),
                    (u.pointerEvents = ts(o == null ? void 0 : o.pointerEvents) || ''),
                    (u.transform = c ? c(this.latestValues, '') : 'none'),
                    u
                );
            const d = this.getLead();
            if (!this.projectionDelta || !this.layout || !d.target) {
                const x = {};
                return (
                    this.options.layoutId &&
                        ((x.opacity =
                            this.latestValues.opacity !== void 0 ? this.latestValues.opacity : 1),
                        (x.pointerEvents = ts(o == null ? void 0 : o.pointerEvents) || '')),
                    this.hasProjected &&
                        !tn(this.latestValues) &&
                        ((x.transform = c ? c({}, '') : 'none'), (this.hasProjected = !1)),
                    x
                );
            }
            const f = d.animationValues || d.latestValues;
            (this.applyTransformsToTarget(),
                (u.transform = $S(this.projectionDeltaWithTransform, this.treeScale, f)),
                c && (u.transform = c(f, u.transform)));
            const { x: m, y: v } = this.projectionDelta;
            ((u.transformOrigin = `${m.origin * 100}% ${v.origin * 100}% 0`),
                d.animationValues
                    ? (u.opacity =
                          d === this
                              ? (l =
                                    (a = f.opacity) !== null && a !== void 0
                                        ? a
                                        : this.latestValues.opacity) !== null && l !== void 0
                                  ? l
                                  : 1
                              : this.preserveOpacity
                                ? this.latestValues.opacity
                                : f.opacityExit)
                    : (u.opacity =
                          d === this
                              ? f.opacity !== void 0
                                  ? f.opacity
                                  : ''
                              : f.opacityExit !== void 0
                                ? f.opacityExit
                                : 0));
            for (const x in Ds) {
                if (f[x] === void 0) continue;
                const { correct: k, applyTo: p } = Ds[x],
                    h = u.transform === 'none' ? f[x] : k(f[x], d);
                if (p) {
                    const y = p.length;
                    for (let w = 0; w < y; w++) u[p[w]] = h;
                } else u[x] = h;
            }
            return (
                this.options.layoutId &&
                    (u.pointerEvents =
                        d === this ? ts(o == null ? void 0 : o.pointerEvents) || '' : 'none'),
                u
            );
        }
        clearSnapshot() {
            this.resumeFrom = this.snapshot = void 0;
        }
        resetTree() {
            (this.root.nodes.forEach((o) => {
                var a;
                return (a = o.currentAnimation) === null || a === void 0 ? void 0 : a.stop();
            }),
                this.root.nodes.forEach(vf),
                this.root.sharedNodes.clear());
        }
    };
}
function WS(e) {
    e.updateLayout();
}
function KS(e) {
    var t;
    const n = ((t = e.resumeFrom) === null || t === void 0 ? void 0 : t.snapshot) || e.snapshot;
    if (e.isLead() && e.layout && n && e.hasListeners('didUpdate')) {
        const { layoutBox: r, measuredBox: i } = e.layout,
            { animationType: s } = e.options,
            o = n.source !== e.layout.source;
        s === 'size'
            ? Ue((d) => {
                  const f = o ? n.measuredBox[d] : n.layoutBox[d],
                      m = Fe(f);
                  ((f.min = r[d].min), (f.max = f.min + m));
              })
            : Ng(s, n.layoutBox, r) &&
              Ue((d) => {
                  const f = o ? n.measuredBox[d] : n.layoutBox[d],
                      m = Fe(r[d]);
                  ((f.max = f.min + m),
                      e.relativeTarget &&
                          !e.currentAnimation &&
                          ((e.isProjectionDirty = !0),
                          (e.relativeTarget[d].max = e.relativeTarget[d].min + m)));
              });
        const a = Fn();
        zr(a, r, n.layoutBox);
        const l = Fn();
        o ? zr(l, e.applyTransform(i, !0), n.measuredBox) : zr(l, r, n.layoutBox);
        const u = !Cg(a);
        let c = !1;
        if (!e.resumeFrom) {
            const d = e.getClosestProjectingParent();
            if (d && !d.resumeFrom) {
                const { snapshot: f, layout: m } = d;
                if (f && m) {
                    const v = oe();
                    Br(v, n.layoutBox, f.layoutBox);
                    const x = oe();
                    (Br(x, r, m.layoutBox),
                        Pg(v, x) || (c = !0),
                        d.options.layoutRoot &&
                            ((e.relativeTarget = x),
                            (e.relativeTargetOrigin = v),
                            (e.relativeParent = d)));
                }
            }
        }
        e.notifyListeners('didUpdate', {
            layout: r,
            snapshot: n,
            delta: l,
            layoutDelta: a,
            hasLayoutChanged: u,
            hasRelativeTargetChanged: c,
        });
    } else if (e.isLead()) {
        const { onExitComplete: r } = e.options;
        r && r();
    }
    e.options.transition = void 0;
}
function GS(e) {
    (Er && nn.totalNodes++,
        e.parent &&
            (e.isProjecting() || (e.isProjectionDirty = e.parent.isProjectionDirty),
            e.isSharedProjectionDirty ||
                (e.isSharedProjectionDirty = !!(
                    e.isProjectionDirty ||
                    e.parent.isProjectionDirty ||
                    e.parent.isSharedProjectionDirty
                )),
            e.isTransformDirty || (e.isTransformDirty = e.parent.isTransformDirty)));
}
function QS(e) {
    e.isProjectionDirty = e.isSharedProjectionDirty = e.isTransformDirty = !1;
}
function YS(e) {
    e.clearSnapshot();
}
function vf(e) {
    e.clearMeasurements();
}
function XS(e) {
    e.isLayoutDirty = !1;
}
function ZS(e) {
    const { visualElement: t } = e.options;
    (t && t.getProps().onBeforeLayoutMeasure && t.notify('BeforeLayoutMeasure'),
        e.resetTransform());
}
function xf(e) {
    (e.finishAnimation(),
        (e.targetDelta = e.relativeTarget = e.target = void 0),
        (e.isProjectionDirty = !0));
}
function qS(e) {
    e.resolveTargetDelta();
}
function JS(e) {
    e.calcProjection();
}
function ek(e) {
    e.resetSkewAndRotation();
}
function tk(e) {
    e.removeLeadSnapshot();
}
function wf(e, t, n) {
    ((e.translate = ee(t.translate, 0, n)),
        (e.scale = ee(t.scale, 1, n)),
        (e.origin = t.origin),
        (e.originPoint = t.originPoint));
}
function Sf(e, t, n, r) {
    ((e.min = ee(t.min, n.min, r)), (e.max = ee(t.max, n.max, r)));
}
function nk(e, t, n, r) {
    (Sf(e.x, t.x, n.x, r), Sf(e.y, t.y, n.y, r));
}
function rk(e) {
    return e.animationValues && e.animationValues.opacityExit !== void 0;
}
const ik = { duration: 0.45, ease: [0.4, 0, 0.1, 1] },
    kf = (e) =>
        typeof navigator < 'u' &&
        navigator.userAgent &&
        navigator.userAgent.toLowerCase().includes(e),
    Cf = kf('applewebkit/') && !kf('chrome/') ? Math.round : _e;
function Pf(e) {
    ((e.min = Cf(e.min)), (e.max = Cf(e.max)));
}
function sk(e) {
    (Pf(e.x), Pf(e.y));
}
function Ng(e, t, n) {
    return e === 'position' || (e === 'preserve-aspect' && !lS(mf(t), mf(n), 0.2));
}
function ok(e) {
    var t;
    return e !== e.root && ((t = e.scroll) === null || t === void 0 ? void 0 : t.wasRoot);
}
const ak = Eg({
        attachResizeListener: (e, t) => ci(e, 'resize', t),
        measureScroll: () => ({
            x: document.documentElement.scrollLeft || document.body.scrollLeft,
            y: document.documentElement.scrollTop || document.body.scrollTop,
        }),
        checkIsScrollRoot: () => !0,
    }),
    Yo = { current: void 0 },
    Lg = Eg({
        measureScroll: (e) => ({ x: e.scrollLeft, y: e.scrollTop }),
        defaultParent: () => {
            if (!Yo.current) {
                const e = new ak({});
                (e.mount(window), e.setOptions({ layoutScroll: !0 }), (Yo.current = e));
            }
            return Yo.current;
        },
        resetTransform: (e, t) => {
            e.style.transform = t !== void 0 ? t : 'none';
        },
        checkIsScrollRoot: (e) => window.getComputedStyle(e).position === 'fixed',
    }),
    lk = { pan: { Feature: PS }, drag: { Feature: CS, ProjectionNode: Lg, MeasureLayout: wg } };
function Tf(e, t, n) {
    const { props: r } = e;
    e.animationState && r.whileHover && e.animationState.setActive('whileHover', n === 'Start');
    const i = 'onHover' + n,
        s = r[i];
    s && Y.postRender(() => s(t, xi(t)));
}
class uk extends Xt {
    mount() {
        const { current: t } = this.node;
        t &&
            (this.unmount = l1(
                t,
                (n) => (Tf(this.node, n, 'Start'), (r) => Tf(this.node, r, 'End')),
            ));
    }
    unmount() {}
}
class ck extends Xt {
    constructor() {
        (super(...arguments), (this.isActive = !1));
    }
    onFocus() {
        let t = !1;
        try {
            t = this.node.current.matches(':focus-visible');
        } catch {
            t = !0;
        }
        !t ||
            !this.node.animationState ||
            (this.node.animationState.setActive('whileFocus', !0), (this.isActive = !0));
    }
    onBlur() {
        !this.isActive ||
            !this.node.animationState ||
            (this.node.animationState.setActive('whileFocus', !1), (this.isActive = !1));
    }
    mount() {
        this.unmount = vi(
            ci(this.node.current, 'focus', () => this.onFocus()),
            ci(this.node.current, 'blur', () => this.onBlur()),
        );
    }
    unmount() {}
}
function Ef(e, t, n) {
    const { props: r } = e;
    e.animationState && r.whileTap && e.animationState.setActive('whileTap', n === 'Start');
    const i = 'onTap' + (n === 'End' ? '' : n),
        s = r[i];
    s && Y.postRender(() => s(t, xi(t)));
}
class dk extends Xt {
    mount() {
        const { current: t } = this.node;
        t &&
            (this.unmount = f1(
                t,
                (n) => (
                    Ef(this.node, n, 'Start'),
                    (r, { success: i }) => Ef(this.node, r, i ? 'End' : 'Cancel')
                ),
                { useGlobalTarget: this.node.props.globalTapTarget },
            ));
    }
    unmount() {}
}
const ll = new WeakMap(),
    Xo = new WeakMap(),
    fk = (e) => {
        const t = ll.get(e.target);
        t && t(e);
    },
    hk = (e) => {
        e.forEach(fk);
    };
function pk({ root: e, ...t }) {
    const n = e || document;
    Xo.has(n) || Xo.set(n, {});
    const r = Xo.get(n),
        i = JSON.stringify(t);
    return (r[i] || (r[i] = new IntersectionObserver(hk, { root: e, ...t })), r[i]);
}
function mk(e, t, n) {
    const r = pk(t);
    return (
        ll.set(e, n),
        r.observe(e),
        () => {
            (ll.delete(e), r.unobserve(e));
        }
    );
}
const gk = { some: 0, all: 1 };
class yk extends Xt {
    constructor() {
        (super(...arguments), (this.hasEnteredView = !1), (this.isInView = !1));
    }
    startObserver() {
        this.unmount();
        const { viewport: t = {} } = this.node.getProps(),
            { root: n, margin: r, amount: i = 'some', once: s } = t,
            o = {
                root: n ? n.current : void 0,
                rootMargin: r,
                threshold: typeof i == 'number' ? i : gk[i],
            },
            a = (l) => {
                const { isIntersecting: u } = l;
                if (this.isInView === u || ((this.isInView = u), s && !u && this.hasEnteredView))
                    return;
                (u && (this.hasEnteredView = !0),
                    this.node.animationState &&
                        this.node.animationState.setActive('whileInView', u));
                const { onViewportEnter: c, onViewportLeave: d } = this.node.getProps(),
                    f = u ? c : d;
                f && f(l);
            };
        return mk(this.node.current, o, a);
    }
    mount() {
        this.startObserver();
    }
    update() {
        if (typeof IntersectionObserver > 'u') return;
        const { props: t, prevProps: n } = this.node;
        ['amount', 'margin', 'root'].some(vk(t, n)) && this.startObserver();
    }
    unmount() {}
}
function vk({ viewport: e = {} }, { viewport: t = {} } = {}) {
    return (n) => e[n] !== t[n];
}
const xk = {
        inView: { Feature: yk },
        tap: { Feature: dk },
        focus: { Feature: ck },
        hover: { Feature: uk },
    },
    wk = { layout: { ProjectionNode: Lg, MeasureLayout: wg } },
    ul = { current: null },
    jg = { current: !1 };
function Sk() {
    if (((jg.current = !0), !!au))
        if (window.matchMedia) {
            const e = window.matchMedia('(prefers-reduced-motion)'),
                t = () => (ul.current = e.matches);
            (e.addListener(t), t());
        } else ul.current = !1;
}
const kk = [...eg, we, Kt],
    Ck = (e) => kk.find(Jm(e)),
    Nf = new WeakMap();
function Pk(e, t, n) {
    for (const r in t) {
        const i = t[r],
            s = n[r];
        if (ke(i)) e.addValue(r, i);
        else if (ke(s)) e.addValue(r, li(i, { owner: e }));
        else if (s !== i)
            if (e.hasValue(r)) {
                const o = e.getValue(r);
                o.liveStyle === !0 ? o.jump(i) : o.hasAnimated || o.set(i);
            } else {
                const o = e.getStaticValue(r);
                e.addValue(r, li(o !== void 0 ? o : i, { owner: e }));
            }
    }
    for (const r in n) t[r] === void 0 && e.removeValue(r);
    return t;
}
const Lf = [
    'AnimationStart',
    'AnimationComplete',
    'Update',
    'BeforeLayoutMeasure',
    'LayoutMeasure',
    'LayoutAnimationStart',
    'LayoutAnimationComplete',
];
class Tk {
    scrapeMotionValuesFromProps(t, n, r) {
        return {};
    }
    constructor(
        {
            parent: t,
            props: n,
            presenceContext: r,
            reducedMotionConfig: i,
            blockInitialAnimation: s,
            visualState: o,
        },
        a = {},
    ) {
        ((this.current = null),
            (this.children = new Set()),
            (this.isVariantNode = !1),
            (this.isControllingVariants = !1),
            (this.shouldReduceMotion = null),
            (this.values = new Map()),
            (this.KeyframeResolver = Ou),
            (this.features = {}),
            (this.valueSubscriptions = new Map()),
            (this.prevMotionValues = {}),
            (this.events = {}),
            (this.propEventSubscriptions = {}),
            (this.notifyUpdate = () => this.notify('Update', this.latestValues)),
            (this.render = () => {
                this.current &&
                    (this.triggerBuild(),
                    this.renderInstance(
                        this.current,
                        this.renderState,
                        this.props.style,
                        this.projection,
                    ));
            }),
            (this.renderScheduledAt = 0),
            (this.scheduleRender = () => {
                const m = ht.now();
                this.renderScheduledAt < m &&
                    ((this.renderScheduledAt = m), Y.render(this.render, !1, !0));
            }));
        const { latestValues: l, renderState: u, onUpdate: c } = o;
        ((this.onUpdate = c),
            (this.latestValues = l),
            (this.baseTarget = { ...l }),
            (this.initialValues = n.initial ? { ...l } : {}),
            (this.renderState = u),
            (this.parent = t),
            (this.props = n),
            (this.presenceContext = r),
            (this.depth = t ? t.depth + 1 : 0),
            (this.reducedMotionConfig = i),
            (this.options = a),
            (this.blockInitialAnimation = !!s),
            (this.isControllingVariants = so(n)),
            (this.isVariantNode = lm(n)),
            this.isVariantNode && (this.variantChildren = new Set()),
            (this.manuallyAnimateOnMount = !!(t && t.current)));
        const { willChange: d, ...f } = this.scrapeMotionValuesFromProps(n, {}, this);
        for (const m in f) {
            const v = f[m];
            l[m] !== void 0 && ke(v) && v.set(l[m], !1);
        }
    }
    mount(t) {
        ((this.current = t),
            Nf.set(t, this),
            this.projection && !this.projection.instance && this.projection.mount(t),
            this.parent &&
                this.isVariantNode &&
                !this.isControllingVariants &&
                (this.removeFromVariantTree = this.parent.addVariantChild(this)),
            this.values.forEach((n, r) => this.bindToMotionValue(r, n)),
            jg.current || Sk(),
            (this.shouldReduceMotion =
                this.reducedMotionConfig === 'never'
                    ? !1
                    : this.reducedMotionConfig === 'always'
                      ? !0
                      : ul.current),
            this.parent && this.parent.children.add(this),
            this.update(this.props, this.presenceContext));
    }
    unmount() {
        (Nf.delete(this.current),
            this.projection && this.projection.unmount(),
            Wt(this.notifyUpdate),
            Wt(this.render),
            this.valueSubscriptions.forEach((t) => t()),
            this.valueSubscriptions.clear(),
            this.removeFromVariantTree && this.removeFromVariantTree(),
            this.parent && this.parent.children.delete(this));
        for (const t in this.events) this.events[t].clear();
        for (const t in this.features) {
            const n = this.features[t];
            n && (n.unmount(), (n.isMounted = !1));
        }
        this.current = null;
    }
    bindToMotionValue(t, n) {
        this.valueSubscriptions.has(t) && this.valueSubscriptions.get(t)();
        const r = xn.has(t),
            i = n.on('change', (a) => {
                ((this.latestValues[t] = a),
                    this.props.onUpdate && Y.preRender(this.notifyUpdate),
                    r && this.projection && (this.projection.isTransformDirty = !0));
            }),
            s = n.on('renderRequest', this.scheduleRender);
        let o;
        (window.MotionCheckAppearSync && (o = window.MotionCheckAppearSync(this, t, n)),
            this.valueSubscriptions.set(t, () => {
                (i(), s(), o && o(), n.owner && n.stop());
            }));
    }
    sortNodePosition(t) {
        return !this.current || !this.sortInstanceNodePosition || this.type !== t.type
            ? 0
            : this.sortInstanceNodePosition(this.current, t.current);
    }
    updateFeatures() {
        let t = 'animation';
        for (t in rr) {
            const n = rr[t];
            if (!n) continue;
            const { isEnabled: r, Feature: i } = n;
            if (
                (!this.features[t] && i && r(this.props) && (this.features[t] = new i(this)),
                this.features[t])
            ) {
                const s = this.features[t];
                s.isMounted ? s.update() : (s.mount(), (s.isMounted = !0));
            }
        }
    }
    triggerBuild() {
        this.build(this.renderState, this.latestValues, this.props);
    }
    measureViewportBox() {
        return this.current ? this.measureInstanceViewportBox(this.current, this.props) : oe();
    }
    getStaticValue(t) {
        return this.latestValues[t];
    }
    setStaticValue(t, n) {
        this.latestValues[t] = n;
    }
    update(t, n) {
        ((t.transformTemplate || this.props.transformTemplate) && this.scheduleRender(),
            (this.prevProps = this.props),
            (this.props = t),
            (this.prevPresenceContext = this.presenceContext),
            (this.presenceContext = n));
        for (let r = 0; r < Lf.length; r++) {
            const i = Lf[r];
            this.propEventSubscriptions[i] &&
                (this.propEventSubscriptions[i](), delete this.propEventSubscriptions[i]);
            const s = 'on' + i,
                o = t[s];
            o && (this.propEventSubscriptions[i] = this.on(i, o));
        }
        ((this.prevMotionValues = Pk(
            this,
            this.scrapeMotionValuesFromProps(t, this.prevProps, this),
            this.prevMotionValues,
        )),
            this.handleChildMotionValue && this.handleChildMotionValue(),
            this.onUpdate && this.onUpdate(this));
    }
    getProps() {
        return this.props;
    }
    getVariant(t) {
        return this.props.variants ? this.props.variants[t] : void 0;
    }
    getDefaultTransition() {
        return this.props.transition;
    }
    getTransformPagePoint() {
        return this.props.transformPagePoint;
    }
    getClosestVariantNode() {
        return this.isVariantNode
            ? this
            : this.parent
              ? this.parent.getClosestVariantNode()
              : void 0;
    }
    addVariantChild(t) {
        const n = this.getClosestVariantNode();
        if (n)
            return (
                n.variantChildren && n.variantChildren.add(t),
                () => n.variantChildren.delete(t)
            );
    }
    addValue(t, n) {
        const r = this.values.get(t);
        n !== r &&
            (r && this.removeValue(t),
            this.bindToMotionValue(t, n),
            this.values.set(t, n),
            (this.latestValues[t] = n.get()));
    }
    removeValue(t) {
        this.values.delete(t);
        const n = this.valueSubscriptions.get(t);
        (n && (n(), this.valueSubscriptions.delete(t)),
            delete this.latestValues[t],
            this.removeValueFromRenderState(t, this.renderState));
    }
    hasValue(t) {
        return this.values.has(t);
    }
    getValue(t, n) {
        if (this.props.values && this.props.values[t]) return this.props.values[t];
        let r = this.values.get(t);
        return (
            r === void 0 &&
                n !== void 0 &&
                ((r = li(n === null ? void 0 : n, { owner: this })), this.addValue(t, r)),
            r
        );
    }
    readValue(t, n) {
        var r;
        let i =
            this.latestValues[t] !== void 0 || !this.current
                ? this.latestValues[t]
                : (r = this.getBaseTargetFromProps(this.props, t)) !== null && r !== void 0
                  ? r
                  : this.readValueFromInstance(this.current, t, this.options);
        return (
            i != null &&
                (typeof i == 'string' && (Zm(i) || $m(i))
                    ? (i = parseFloat(i))
                    : !Ck(i) && Kt.test(n) && (i = Qm(t, n)),
                this.setBaseTarget(t, ke(i) ? i.get() : i)),
            ke(i) ? i.get() : i
        );
    }
    setBaseTarget(t, n) {
        this.baseTarget[t] = n;
    }
    getBaseTarget(t) {
        var n;
        const { initial: r } = this.props;
        let i;
        if (typeof r == 'string' || typeof r == 'object') {
            const o = pu(
                this.props,
                r,
                (n = this.presenceContext) === null || n === void 0 ? void 0 : n.custom,
            );
            o && (i = o[t]);
        }
        if (r && i !== void 0) return i;
        const s = this.getBaseTargetFromProps(this.props, t);
        return s !== void 0 && !ke(s)
            ? s
            : this.initialValues[t] !== void 0 && i === void 0
              ? void 0
              : this.baseTarget[t];
    }
    on(t, n) {
        return (this.events[t] || (this.events[t] = new Lu()), this.events[t].add(n));
    }
    notify(t, ...n) {
        this.events[t] && this.events[t].notify(...n);
    }
}
class Rg extends Tk {
    constructor() {
        (super(...arguments), (this.KeyframeResolver = tg));
    }
    sortInstanceNodePosition(t, n) {
        return t.compareDocumentPosition(n) & 2 ? 1 : -1;
    }
    getBaseTargetFromProps(t, n) {
        return t.style ? t.style[n] : void 0;
    }
    removeValueFromRenderState(t, { vars: n, style: r }) {
        (delete n[t], delete r[t]);
    }
    handleChildMotionValue() {
        this.childSubscription && (this.childSubscription(), delete this.childSubscription);
        const { children: t } = this.props;
        ke(t) &&
            (this.childSubscription = t.on('change', (n) => {
                this.current && (this.current.textContent = `${n}`);
            }));
    }
}
function Ek(e) {
    return window.getComputedStyle(e);
}
class Nk extends Rg {
    constructor() {
        (super(...arguments), (this.type = 'html'), (this.renderInstance = ym));
    }
    readValueFromInstance(t, n) {
        if (xn.has(n)) {
            const r = Mu(n);
            return (r && r.default) || 0;
        } else {
            const r = Ek(t),
                i = (pm(n) ? r.getPropertyValue(n) : r[n]) || 0;
            return typeof i == 'string' ? i.trim() : i;
        }
    }
    measureInstanceViewportBox(t, { transformPagePoint: n }) {
        return vg(t, n);
    }
    build(t, n, r) {
        yu(t, n, r.transformTemplate);
    }
    scrapeMotionValuesFromProps(t, n, r) {
        return Su(t, n, r);
    }
}
class Lk extends Rg {
    constructor() {
        (super(...arguments),
            (this.type = 'svg'),
            (this.isSVGTag = !1),
            (this.measureInstanceViewportBox = oe));
    }
    getBaseTargetFromProps(t, n) {
        return t[n];
    }
    readValueFromInstance(t, n) {
        if (xn.has(n)) {
            const r = Mu(n);
            return (r && r.default) || 0;
        }
        return ((n = vm.has(n) ? n : du(n)), t.getAttribute(n));
    }
    scrapeMotionValuesFromProps(t, n, r) {
        return Sm(t, n, r);
    }
    build(t, n, r) {
        vu(t, n, this.isSVGTag, r.transformTemplate);
    }
    renderInstance(t, n, r, i) {
        xm(t, n, r, i);
    }
    mount(t) {
        ((this.isSVGTag = wu(t.tagName)), super.mount(t));
    }
}
const jk = (e, t) => (hu(e) ? new Lk(t) : new Nk(t, { allowProjection: e !== L.Fragment })),
    Rk = t1({ ...Jw, ...xk, ...lk, ...wk }, jk),
    _ = gx(Rk);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var Ak = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Dk = (e) =>
        e
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase()
            .trim(),
    re = (e, t) => {
        const n = L.forwardRef(
            (
                {
                    color: r = 'currentColor',
                    size: i = 24,
                    strokeWidth: s = 2,
                    absoluteStrokeWidth: o,
                    className: a = '',
                    children: l,
                    ...u
                },
                c,
            ) =>
                L.createElement(
                    'svg',
                    {
                        ref: c,
                        ...Ak,
                        width: i,
                        height: i,
                        stroke: r,
                        strokeWidth: o ? (Number(s) * 24) / Number(i) : s,
                        className: ['lucide', `lucide-${Dk(e)}`, a].join(' '),
                        ...u,
                    },
                    [...t.map(([d, f]) => L.createElement(d, f)), ...(Array.isArray(l) ? l : [l])],
                ),
        );
        return ((n.displayName = `${e}`), n);
    };
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ag = re('ArrowRight', [
    ['path', { d: 'M5 12h14', key: '1ays0h' }],
    ['path', { d: 'm12 5 7 7-7 7', key: 'xquz4c' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Mk = re('CheckCircle2', [
    ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
    ['path', { d: 'm9 12 2 2 4-4', key: 'dzmm74' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Iu = re('Check', [['path', { d: 'M20 6 9 17l-5-5', key: '1gmf2c' }]]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ok = re('Copy', [
    ['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2', key: '17jyea' }],
    ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2', key: 'zix9uf' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Vk = re('Download', [
    ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', key: 'ih7n3h' }],
    ['polyline', { points: '7 10 12 15 17 10', key: '2ggqvy' }],
    ['line', { x1: '12', x2: '12', y1: '15', y2: '3', key: '1vk2je' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Dg = re('Gauge', [
    ['path', { d: 'm12 14 4-4', key: '9kzdfg' }],
    ['path', { d: 'M3.34 19a10 10 0 1 1 17.32 0', key: '19p75a' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const bk = re('GitBranch', [
    ['line', { x1: '6', x2: '6', y1: '3', y2: '15', key: '17qcm7' }],
    ['circle', { cx: '18', cy: '6', r: '3', key: '1h7g24' }],
    ['circle', { cx: '6', cy: '18', r: '3', key: 'fqmcym' }],
    ['path', { d: 'M18 9a9 9 0 0 1-9 9', key: 'n2h4wq' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const _k = re('Globe', [
    ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
    ['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', key: '13o1zl' }],
    ['path', { d: 'M2 12h20', key: '9i4pu4' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ik = re('Menu', [
    ['line', { x1: '4', x2: '20', y1: '12', y2: '12', key: '1e0a9i' }],
    ['line', { x1: '4', x2: '20', y1: '6', y2: '6', key: '1owob3' }],
    ['line', { x1: '4', x2: '20', y1: '18', y2: '18', key: 'yk5zj1' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Mg = re('Minus', [['path', { d: 'M5 12h14', key: '1ays0h' }]]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Fk = re('MousePointerClick', [
    ['path', { d: 'm9 9 5 12 1.8-5.2L21 14Z', key: '1b76lo' }],
    ['path', { d: 'M7.2 2.2 8 5.1', key: '1cfko1' }],
    ['path', { d: 'm5.1 8-2.9-.8', key: '1go3kf' }],
    ['path', { d: 'M14 4.1 12 6', key: 'ita8i4' }],
    ['path', { d: 'm6 12-1.9 2', key: 'mnht97' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const zk = re('Play', [['polygon', { points: '5 3 19 12 5 21 5 3', key: '191637' }]]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Bk = re('RefreshCw', [
    ['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', key: 'v9h5vc' }],
    ['path', { d: 'M21 3v5h-5', key: '1q7to0' }],
    ['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', key: '3uifl3' }],
    ['path', { d: 'M8 16H3v5', key: '1cv678' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const $k = re('Rocket', [
    [
        'path',
        {
            d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
            key: 'm3kijz',
        },
    ],
    [
        'path',
        {
            d: 'm12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
            key: '1fmvmk',
        },
    ],
    ['path', { d: 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0', key: '1f8sc4' }],
    ['path', { d: 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5', key: 'qeys4' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Uk = re('ShieldAlert', [
    ['path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10', key: '1irkt0' }],
    ['path', { d: 'M12 8v4', key: '1got3b' }],
    ['path', { d: 'M12 16h.01', key: '1drbdi' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Fu = re('ShieldCheck', [
    ['path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10', key: '1irkt0' }],
    ['path', { d: 'm9 12 2 2 4-4', key: 'dzmm74' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Og = re('Slack', [
    ['rect', { width: '3', height: '8', x: '13', y: '2', rx: '1.5', key: 'diqz80' }],
    ['path', { d: 'M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5', key: '183iwg' }],
    ['rect', { width: '3', height: '8', x: '8', y: '14', rx: '1.5', key: 'hqg7r1' }],
    ['path', { d: 'M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5', key: '76g71w' }],
    ['rect', { width: '8', height: '3', x: '14', y: '13', rx: '1.5', key: '1kmz0a' }],
    ['path', { d: 'M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5', key: 'jc4sz0' }],
    ['rect', { width: '8', height: '3', x: '2', y: '8', rx: '1.5', key: '1omvl4' }],
    ['path', { d: 'M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5', key: '16f3cl' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Hk = re('Terminal', [
    ['polyline', { points: '4 17 10 11 4 5', key: 'akl6gq' }],
    ['line', { x1: '12', x2: '20', y1: '19', y2: '19', key: 'q2wloq' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Wk = re('Upload', [
    ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', key: 'ih7n3h' }],
    ['polyline', { points: '17 8 12 3 7 8', key: 't8dd8p' }],
    ['line', { x1: '12', x2: '12', y1: '3', y2: '15', key: 'widbto' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Kk = re('UserCheck', [
    ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', key: '1yyitq' }],
    ['circle', { cx: '9', cy: '7', r: '4', key: 'nufk8' }],
    ['polyline', { points: '16 11 18 13 22 9', key: '1pwet4' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const zu = re('Wand2', [
    [
        'path',
        {
            d: 'm21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z',
            key: '1bcowg',
        },
    ],
    ['path', { d: 'm14 7 3 3', key: '1r5n42' }],
    ['path', { d: 'M5 6v4', key: 'ilb8ba' }],
    ['path', { d: 'M19 14v4', key: 'blhpug' }],
    ['path', { d: 'M10 2v2', key: '7u0qdc' }],
    ['path', { d: 'M7 8H3', key: 'zfb6yr' }],
    ['path', { d: 'M21 16h-4', key: '1cnmox' }],
    ['path', { d: 'M11 3H9', key: '1obp7u' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Vg = re('Workflow', [
    ['rect', { width: '8', height: '8', x: '3', y: '3', rx: '2', key: 'by2w9f' }],
    ['path', { d: 'M7 11v4a2 2 0 0 0 2 2h4', key: 'xkn7yn' }],
    ['rect', { width: '8', height: '8', x: '13', y: '13', rx: '2', key: '1cgmvn' }],
]);
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Bu = re('X', [
        ['path', { d: 'M18 6 6 18', key: '1bl5f8' }],
        ['path', { d: 'm6 6 12 12', key: 'd8bk6v' }],
    ]),
    jf = [
        { label: 'Platform', href: '#platform' },
        { label: 'Healing', href: '#healing' },
        { label: 'Interop', href: '#interop' },
        { label: 'Docs', href: 'https://deepwiki.com/andresguc1/hal-test', external: !0 },
        { label: 'Roadmap', href: 'https://github.com/users/andresguc1/projects/8', external: !0 },
    ];
function Gk() {
    const { t: e, i18n: t } = tm(),
        [n, r] = Fs.useState(!1),
        i = () => {
            const s = t.language.startsWith('es') ? 'en' : 'es';
            t.changeLanguage(s);
        };
    return g.jsxs('nav', {
        className:
            'fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-white/5',
        children: [
            g.jsxs(_.a, {
                href: '#top',
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.5 },
                className: 'flex items-center gap-3 cursor-pointer group no-underline',
                children: [
                    g.jsx('img', {
                        src: '/images/haltest_logo.jpeg',
                        alt: 'HAL-TEST',
                        className:
                            'w-8 h-8 rounded-md shadow-lg shadow-hal-primary-500/20 group-hover:scale-110 transition-transform',
                    }),
                    g.jsxs('div', {
                        className: 'text-xl font-bold tracking-widest flex gap-1',
                        children: [
                            g.jsx('span', { className: 'text-hal-primary-400', children: 'HAL' }),
                            g.jsx('span', { className: 'text-white/30', children: '-' }),
                            g.jsx('span', { className: 'text-hal-warning-500', children: 'TEST' }),
                        ],
                    }),
                ],
            }),
            g.jsx(_.div, {
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.5, delay: 0.1 },
                className:
                    'hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500',
                children: jf.map((s) =>
                    g.jsx(
                        'a',
                        {
                            href: s.href,
                            target: s.external ? '_blank' : void 0,
                            rel: s.external ? 'noopener noreferrer' : void 0,
                            className:
                                'hover:text-hal-primary-400 transition-colors no-underline text-slate-500',
                            children: s.label,
                        },
                        s.label,
                    ),
                ),
            }),
            g.jsxs(_.div, {
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.5, delay: 0.2 },
                className: 'flex items-center gap-6',
                children: [
                    g.jsx('button', {
                        onClick: i,
                        className:
                            'text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors',
                        children: t.language.startsWith('es') ? 'EN' : 'ES',
                    }),
                    g.jsx('a', {
                        href: '/app',
                        className:
                            'hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-hal-primary-500 hover:bg-hal-primary-400 text-white text-xs font-bold uppercase tracking-widest transition-colors no-underline',
                        children: e('cta.launch_app') || 'Launch App',
                    }),
                    g.jsx('button', {
                        onClick: () => r((s) => !s),
                        className: 'md:hidden text-white/70 hover:text-white transition-colors',
                        'aria-label': n ? 'Close menu' : 'Open menu',
                        'aria-expanded': n,
                        children: n ? g.jsx(Bu, { size: 22 }) : g.jsx(Ik, { size: 22 }),
                    }),
                ],
            }),
            g.jsx(lx, {
                children:
                    n &&
                    g.jsxs(_.div, {
                        initial: { opacity: 0, y: -10 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0, y: -10 },
                        transition: { duration: 0.2 },
                        className:
                            'md:hidden absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex flex-col p-6 gap-4',
                        children: [
                            jf.map((s) =>
                                g.jsx(
                                    'a',
                                    {
                                        href: s.href,
                                        target: s.external ? '_blank' : void 0,
                                        rel: s.external ? 'noopener noreferrer' : void 0,
                                        onClick: () => r(!1),
                                        className:
                                            'text-sm font-bold uppercase tracking-widest text-slate-300 hover:text-hal-primary-400 transition-colors no-underline',
                                        children: s.label,
                                    },
                                    s.label,
                                ),
                            ),
                            g.jsx('a', {
                                href: '/app',
                                onClick: () => r(!1),
                                className:
                                    'mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-hal-primary-500 hover:bg-hal-primary-400 text-white text-xs font-bold uppercase tracking-widest transition-colors no-underline',
                                children: e('cta.launch_app') || 'Launch App',
                            }),
                        ],
                    }),
            }),
        ],
    });
}
const Rf = [
    {
        icon: _k,
        title: 'Go to URL',
        sub: 'app.example.com/login',
        accent: 'text-hal-primary-400',
        ring: 'border-hal-primary-500/40',
    },
    {
        icon: Fk,
        title: 'Smart Click',
        sub: 'button[data-test="submit"]',
        accent: 'text-hal-warning-500',
        ring: 'border-hal-warning-500/40',
    },
    {
        icon: zu,
        title: 'AI Validate',
        sub: 'Dashboard is visible',
        accent: 'text-emerald-400',
        ring: 'border-emerald-500/40',
    },
    {
        icon: Mk,
        title: 'Assert',
        sub: 'status === 200',
        accent: 'text-hal-primary-400',
        ring: 'border-hal-primary-500/40',
    },
];
function Qk() {
    return g.jsxs('div', {
        className:
            'relative rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden',
        children: [
            g.jsxs('div', {
                className: 'flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5',
                children: [
                    g.jsx('span', { className: 'w-3 h-3 rounded-full bg-hal-error-500/70' }),
                    g.jsx('span', { className: 'w-3 h-3 rounded-full bg-hal-warning-500/70' }),
                    g.jsx('span', { className: 'w-3 h-3 rounded-full bg-emerald-500/70' }),
                    g.jsx('span', {
                        className:
                            'ml-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold',
                        children: 'haltest · studio',
                    }),
                    g.jsxs('span', {
                        className:
                            'ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 font-bold',
                        children: [g.jsx(zk, { size: 12 }), ' Running'],
                    }),
                ],
            }),
            g.jsxs('div', {
                className: 'relative p-8 md:p-12',
                style: {
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                },
                children: [
                    g.jsx('div', {
                        className:
                            'flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0',
                        children: Rf.map((e, t) =>
                            g.jsxs(
                                Fs.Fragment,
                                {
                                    children: [
                                        g.jsxs(_.div, {
                                            initial: { opacity: 0, y: 12 },
                                            whileInView: { opacity: 1, y: 0 },
                                            viewport: { once: !0 },
                                            transition: { delay: 0.1 * t },
                                            className: `flex-1 min-w-0 rounded-xl border ${e.ring} bg-slate-800/80 px-4 py-3 shadow-lg`,
                                            children: [
                                                g.jsxs('div', {
                                                    className: 'flex items-center gap-2 mb-1.5',
                                                    children: [
                                                        g.jsx(e.icon, {
                                                            size: 16,
                                                            className: e.accent,
                                                        }),
                                                        g.jsx('span', {
                                                            className:
                                                                'text-xs font-bold uppercase tracking-wider text-white truncate',
                                                            children: e.title,
                                                        }),
                                                    ],
                                                }),
                                                g.jsx('code', {
                                                    className:
                                                        'block text-[11px] text-slate-400 truncate',
                                                    children: e.sub,
                                                }),
                                            ],
                                        }),
                                        t < Rf.length - 1 &&
                                            g.jsxs('div', {
                                                className:
                                                    'flex md:flex-col items-center justify-center px-2 py-1 md:py-0',
                                                children: [
                                                    g.jsx('span', {
                                                        className:
                                                            'hidden md:block h-px w-6 bg-gradient-to-r from-hal-primary-500/60 to-hal-primary-400/60',
                                                    }),
                                                    g.jsx('span', {
                                                        className:
                                                            'md:hidden w-px h-4 bg-gradient-to-b from-hal-primary-500/60 to-hal-primary-400/60',
                                                    }),
                                                ],
                                            }),
                                    ],
                                },
                                e.title,
                            ),
                        ),
                    }),
                    g.jsxs(_.div, {
                        initial: { opacity: 0, scale: 0.9 },
                        whileInView: { opacity: 1, scale: 1 },
                        viewport: { once: !0 },
                        transition: { delay: 0.5 },
                        className:
                            'mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2',
                        children: [
                            g.jsx(zu, { size: 14, className: 'text-emerald-400' }),
                            g.jsx('span', {
                                className:
                                    'text-[11px] font-bold uppercase tracking-widest text-emerald-300',
                                children: 'Selector healed · 98% confidence · verified',
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}
const Yk = [
        { icon: Vg, label: 'Automation', color: 'text-hal-primary-400' },
        { icon: Dg, label: 'Performance', color: 'text-hal-warning-500' },
        { icon: Fu, label: 'Security', color: 'text-emerald-400' },
    ],
    Xk = [
        { value: '50+', label: 'Node Types' },
        { value: '3-in-1', label: 'Automation · Perf · Security' },
        { value: '10+', label: 'Frameworks In / Out' },
        { value: 'Playwright', label: 'Native Engine' },
    ];
function Zk() {
    const { t: e } = tm(),
        [t, n] = Fs.useState(!1),
        r = () => {
            (navigator.clipboard.writeText('npx haltest@latest'),
                n(!0),
                setTimeout(() => n(!1), 2e3));
        };
    return g.jsxs('section', {
        id: 'top',
        className:
            'relative z-10 flex flex-col items-center justify-center px-4 text-center pt-36 pb-24',
        children: [
            g.jsxs(_.div, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.5 },
                className:
                    'flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8',
                children: [
                    g.jsx('span', {
                        className: 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse',
                    }),
                    g.jsx('span', {
                        className:
                            'text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold',
                        children: 'Visual QA platform · Built on Playwright',
                    }),
                ],
            }),
            g.jsxs(_.h1, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.6, delay: 0.1 },
                className:
                    'text-5xl md:text-7xl font-bold uppercase tracking-tight mb-6 max-w-4xl text-balance',
                children: [
                    g.jsx('span', {
                        className:
                            'bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50',
                        children: 'The Missing Link',
                    }),
                    g.jsx('br', {}),
                    g.jsx('span', {
                        className: 'text-hal-primary-400',
                        children: 'in Browser Automation',
                    }),
                ],
            }),
            g.jsx(_.p, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.6, delay: 0.2 },
                className:
                    'text-lg md:text-xl text-slate-300 max-w-2xl mb-8 leading-relaxed text-pretty',
                children:
                    'Design browser tests visually, run them live on Playwright, and cover automation, performance, and security in one place — with AI that repairs broken selectors and exports to real code.',
            }),
            g.jsx(_.div, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.6, delay: 0.28 },
                className: 'flex flex-wrap items-center justify-center gap-3 mb-10',
                children: Yk.map(({ icon: i, label: s, color: o }) =>
                    g.jsxs(
                        'div',
                        {
                            className:
                                'flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md',
                            children: [
                                g.jsx(i, { size: 16, className: o }),
                                g.jsx('span', {
                                    className:
                                        'text-xs font-bold uppercase tracking-widest text-slate-200',
                                    children: s,
                                }),
                            ],
                        },
                        s,
                    ),
                ),
            }),
            g.jsxs(_.div, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.6, delay: 0.34 },
                className: 'flex flex-col sm:flex-row gap-4 items-center mb-10',
                children: [
                    g.jsxs(_.a, {
                        whileHover: { scale: 1.05 },
                        whileTap: { scale: 0.95 },
                        href: '/app',
                        className:
                            'group relative px-8 py-4 bg-hal-primary-500 hover:bg-hal-primary-400 text-white rounded-lg font-bold uppercase tracking-wider transition-all shadow-xl shadow-hal-primary-900/40 border border-hal-primary-400/30 no-underline flex items-center gap-2',
                        children: [
                            e('cta.launch_app') || 'Launch App',
                            g.jsxs('svg', {
                                xmlns: 'http://www.w3.org/2000/svg',
                                width: '16',
                                height: '16',
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: 'currentColor',
                                strokeWidth: '2.5',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                className:
                                    'transform group-hover:translate-x-1 transition-transform',
                                children: [
                                    g.jsx('path', { d: 'M5 12h14' }),
                                    g.jsx('path', { d: 'm12 5 7 7-7 7' }),
                                ],
                            }),
                        ],
                    }),
                    g.jsx(_.a, {
                        whileHover: { scale: 1.05 },
                        whileTap: { scale: 0.95 },
                        href: 'https://github.com/andresguc1/hal-test',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className:
                            'px-8 py-4 bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-lg font-bold uppercase tracking-wider transition-all backdrop-blur-md shadow-lg no-underline',
                        children: e('cta.star_github') || 'GitHub',
                    }),
                    g.jsxs(_.a, {
                        whileHover: { scale: 1.05 },
                        whileTap: { scale: 0.95 },
                        href: 'https://join.slack.com/t/haltest-talk/shared_invite/zt-3tzii9nxh-vgdIcI5A8bg~GCG8QF6MuA',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className:
                            'px-8 py-4 bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-lg font-bold uppercase tracking-wider transition-all backdrop-blur-md shadow-lg flex items-center gap-2 no-underline',
                        children: [
                            g.jsx(Og, { size: 18, className: 'text-[#E01E5A]' }),
                            e('cta.community') || 'Slack',
                        ],
                    }),
                ],
            }),
            g.jsxs(_.div, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.4 },
                className: 'mb-20 max-w-md w-full',
                children: [
                    g.jsxs('div', {
                        className:
                            'flex items-center justify-between bg-slate-800/80 border border-white/10 rounded-xl p-4 shadow-2xl shadow-hal-primary-900/40 backdrop-blur-xl',
                        children: [
                            g.jsxs('div', {
                                className: 'flex items-center gap-3',
                                children: [
                                    g.jsx('span', {
                                        className: 'text-hal-primary-400 font-bold',
                                        children: '$',
                                    }),
                                    g.jsx('code', {
                                        className: 'text-white font-mono text-sm tracking-tight',
                                        children: 'npx haltest@latest',
                                    }),
                                ],
                            }),
                            g.jsx('button', {
                                onClick: r,
                                className:
                                    'p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white relative border border-white/5',
                                title: 'Copy to clipboard',
                                'aria-label': 'Copy install command',
                                children: t
                                    ? g.jsx(Iu, { size: 18, className: 'text-emerald-400' })
                                    : g.jsx(Ok, { size: 18 }),
                            }),
                        ],
                    }),
                    g.jsxs('p', {
                        className:
                            'text-xs text-slate-500 mt-3 flex items-center justify-center gap-2',
                        children: [
                            g.jsx('span', { className: 'w-1.5 h-1.5 rounded-full bg-slate-500' }),
                            'Zero config. No cloning required.',
                        ],
                    }),
                ],
            }),
            g.jsx(_.div, {
                initial: { opacity: 0, y: 30 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.5 },
                className: 'w-full max-w-5xl mb-16',
                children: g.jsx(Qk, {}),
            }),
            g.jsx(_.div, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.55 },
                className:
                    'grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/5 pt-8 w-full max-w-4xl',
                children: Xk.map((i) =>
                    g.jsxs(
                        'div',
                        {
                            className: 'flex flex-col items-center',
                            children: [
                                g.jsx('span', {
                                    className: 'text-2xl font-bold text-white',
                                    children: i.value,
                                }),
                                g.jsx('span', {
                                    className:
                                        'text-[10px] uppercase tracking-widest text-slate-500 text-center mt-1',
                                    children: i.label,
                                }),
                            ],
                        },
                        i.label,
                    ),
                ),
            }),
        ],
    });
}
const qk = [
    {
        icon: Vg,
        accent: 'text-hal-primary-400',
        ring: 'hover:border-hal-primary-500/40',
        glow: 'bg-hal-primary-500/10',
        title: 'Automation',
        tagline: 'Design once, run on Playwright.',
        points: [
            '50+ visual nodes for DOM, flow control and data',
            'Smart element picker captures resilient selectors',
            'Live Playwright execution with step-by-step feedback',
            'Sessions, cookies and tokens managed for you',
        ],
    },
    {
        icon: Dg,
        accent: 'text-hal-warning-500',
        ring: 'hover:border-hal-warning-500/40',
        glow: 'bg-hal-warning-500/10',
        title: 'Performance',
        tagline: 'Know where it breaks before users do.',
        points: [
            'Load, soak and spike testing scenarios',
            'Automatic breaking-point detection',
            'Memory-leak and endurance analysis',
            'SLA evaluation with live telemetry dashboards',
        ],
    },
    {
        icon: Fu,
        accent: 'text-emerald-400',
        ring: 'hover:border-emerald-500/40',
        glow: 'bg-emerald-500/10',
        title: 'Security',
        tagline: 'Ship compliant, not exposed.',
        points: [
            'CSP, security headers and TLS validation',
            'Auth and session hardening checks',
            'Data-leak and DOM exposure detection',
            'Compliance reports wired into your pipeline',
        ],
    },
];
function Jk() {
    return g.jsxs('section', {
        id: 'platform',
        className: 'relative z-10 w-full max-w-6xl mx-auto px-4 py-24',
        children: [
            g.jsxs('div', {
                className: 'text-center mb-16',
                children: [
                    g.jsx(_.p, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        className:
                            'text-xs font-bold uppercase tracking-[0.3em] text-hal-primary-400 mb-4',
                        children: 'One platform · Three disciplines',
                    }),
                    g.jsxs(_.h2, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        transition: { delay: 0.05 },
                        className:
                            'text-4xl md:text-5xl font-bold uppercase tracking-tight text-balance',
                        children: [
                            'Automation, performance and security',
                            ' ',
                            g.jsx('span', {
                                className: 'text-hal-primary-400',
                                children: 'in one workflow',
                            }),
                        ],
                    }),
                    g.jsx(_.p, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        transition: { delay: 0.1 },
                        className: 'text-slate-400 max-w-2xl mx-auto mt-4 text-pretty',
                        children:
                            'Stop stitching together three different tools. Haltest runs functional checks, load tests and security audits from the same visual flows.',
                    }),
                ],
            }),
            g.jsx('div', {
                className: 'grid grid-cols-1 md:grid-cols-3 gap-6',
                children: qk.map((e, t) =>
                    g.jsxs(
                        _.div,
                        {
                            initial: { opacity: 0, y: 24 },
                            whileInView: { opacity: 1, y: 0 },
                            viewport: { once: !0 },
                            transition: { delay: t * 0.1 },
                            className: `relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors ${e.ring}`,
                            children: [
                                g.jsx('div', {
                                    className: `absolute inset-0 rounded-2xl ${e.glow} blur-2xl opacity-40 -z-10`,
                                }),
                                g.jsxs('div', {
                                    className: 'flex items-center gap-3 mb-2',
                                    children: [
                                        g.jsx('div', {
                                            className:
                                                'p-2.5 rounded-lg bg-white/5 border border-white/10',
                                            children: g.jsx(e.icon, {
                                                size: 22,
                                                className: e.accent,
                                            }),
                                        }),
                                        g.jsx('h3', {
                                            className:
                                                'text-xl font-bold uppercase tracking-widest text-white',
                                            children: e.title,
                                        }),
                                    ],
                                }),
                                g.jsx('p', {
                                    className: `text-sm font-bold mb-6 ${e.accent}`,
                                    children: e.tagline,
                                }),
                                g.jsx('ul', {
                                    className: 'space-y-3',
                                    children: e.points.map((n) =>
                                        g.jsxs(
                                            'li',
                                            {
                                                className:
                                                    'flex items-start gap-3 text-sm text-slate-300',
                                                children: [
                                                    g.jsx('span', {
                                                        className: `mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${e.accent.replace('text-', 'bg-')}`,
                                                    }),
                                                    g.jsx('span', {
                                                        className: 'leading-relaxed',
                                                        children: n,
                                                    }),
                                                ],
                                            },
                                            n,
                                        ),
                                    ),
                                }),
                            ],
                        },
                        e.title,
                    ),
                ),
            }),
        ],
    });
}
function e2() {
    return g.jsx('section', {
        id: 'healing',
        className: 'relative z-10 w-full max-w-6xl mx-auto px-4 py-24',
        children: g.jsxs('div', {
            className: 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center',
            children: [
                g.jsxs(_.div, {
                    initial: { opacity: 0, x: -24 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: !0 },
                    children: [
                        g.jsx('p', {
                            className:
                                'text-xs font-bold uppercase tracking-[0.3em] text-emerald-400 mb-4',
                            children: 'AI auto-healing',
                        }),
                        g.jsxs('h2', {
                            className:
                                'text-4xl md:text-5xl font-bold uppercase tracking-tight mb-6 text-balance',
                            children: [
                                'Tests that repair',
                                ' ',
                                g.jsx('span', {
                                    className: 'text-emerald-400',
                                    children: 'themselves',
                                }),
                            ],
                        }),
                        g.jsx('p', {
                            className: 'text-slate-300 leading-relaxed mb-6 text-pretty',
                            children:
                                'The biggest cost in QA is not writing tests — it is fixing them when the UI changes. When a selector breaks, Haltest proposes a resilient replacement, scores its confidence, verifies it against the live page, and logs every decision so you stay in control.',
                        }),
                        g.jsx('ul', {
                            className: 'space-y-3',
                            children: [
                                'Deterministic healing with confidence scoring',
                                'Every fix verified against the running page',
                                'Full audit trail: original, healed, reasoning',
                            ].map((e) =>
                                g.jsxs(
                                    'li',
                                    {
                                        className: 'flex items-start gap-3 text-sm text-slate-300',
                                        children: [
                                            g.jsx(Fu, {
                                                size: 18,
                                                className: 'text-emerald-400 shrink-0 mt-0.5',
                                            }),
                                            g.jsx('span', {
                                                className: 'leading-relaxed',
                                                children: e,
                                            }),
                                        ],
                                    },
                                    e,
                                ),
                            ),
                        }),
                    ],
                }),
                g.jsxs(_.div, {
                    initial: { opacity: 0, x: 24 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: !0 },
                    transition: { delay: 0.1 },
                    className:
                        'rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden',
                    children: [
                        g.jsxs('div', {
                            className:
                                'flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5',
                            children: [
                                g.jsx(zu, { size: 14, className: 'text-emerald-400' }),
                                g.jsx('span', {
                                    className:
                                        'text-[10px] uppercase tracking-widest text-slate-400 font-bold',
                                    children: 'healing log',
                                }),
                            ],
                        }),
                        g.jsxs('div', {
                            className: 'p-6 space-y-4 font-mono text-sm',
                            children: [
                                g.jsxs('div', {
                                    className:
                                        'rounded-lg border border-hal-error-500/30 bg-hal-error-500/10 p-3',
                                    children: [
                                        g.jsx('span', {
                                            className:
                                                'text-[10px] uppercase tracking-widest text-hal-error-500 font-bold block mb-1',
                                            children: 'Broken',
                                        }),
                                        g.jsx('code', {
                                            className: 'text-slate-300 break-all',
                                            children: 'button.btn-primary.submit-2024',
                                        }),
                                    ],
                                }),
                                g.jsxs('div', {
                                    className: 'flex items-center gap-2 text-slate-500 pl-2',
                                    children: [
                                        g.jsx(Ag, { size: 16, className: 'text-emerald-400' }),
                                        g.jsx('span', {
                                            className: 'text-[11px] uppercase tracking-widest',
                                            children: 'healed automatically',
                                        }),
                                    ],
                                }),
                                g.jsxs('div', {
                                    className:
                                        'rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3',
                                    children: [
                                        g.jsx('span', {
                                            className:
                                                'text-[10px] uppercase tracking-widest text-emerald-400 font-bold block mb-1',
                                            children: 'Applied',
                                        }),
                                        g.jsx('code', {
                                            className: 'text-emerald-200 break-all',
                                            children: '[data-test="submit"]',
                                        }),
                                    ],
                                }),
                                g.jsxs('div', {
                                    className:
                                        'flex items-center justify-between pt-2 border-t border-white/5 text-[11px] uppercase tracking-widest',
                                    children: [
                                        g.jsx('span', {
                                            className: 'text-slate-500',
                                            children: 'confidence',
                                        }),
                                        g.jsx('span', {
                                            className: 'text-emerald-400 font-bold',
                                            children: '98% · verified',
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    });
}
const t2 = [
        'Playwright',
        'Cypress',
        'Selenium',
        'Puppeteer',
        'WebdriverIO',
        'TestCafe',
        'Nightwatch',
        'Katalon',
        'TestRigor',
    ],
    n2 = [
        {
            icon: Wk,
            title: 'Import your suite',
            desc: 'Bring existing tests from 10+ frameworks into a visual flow in minutes.',
        },
        {
            icon: Vk,
            title: 'Export to real code',
            desc: 'Generate clean Playwright, Cypress or Selenium code you fully own.',
        },
        {
            icon: Hk,
            title: 'Run in CI/CD',
            desc: 'Drop haltest into GitHub Actions, Jenkins or any pipeline with one command.',
        },
    ];
function r2() {
    return g.jsxs('section', {
        id: 'interop',
        className: 'relative z-10 w-full max-w-6xl mx-auto px-4 py-24',
        children: [
            g.jsxs('div', {
                className: 'text-center mb-16',
                children: [
                    g.jsx(_.p, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        className:
                            'text-xs font-bold uppercase tracking-[0.3em] text-hal-warning-500 mb-4',
                        children: 'No lock-in',
                    }),
                    g.jsxs(_.h2, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        transition: { delay: 0.05 },
                        className:
                            'text-4xl md:text-5xl font-bold uppercase tracking-tight text-balance',
                        children: [
                            'Works with the tools',
                            ' ',
                            g.jsx('span', {
                                className: 'text-hal-warning-500',
                                children: 'you already use',
                            }),
                        ],
                    }),
                    g.jsx(_.p, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        transition: { delay: 0.1 },
                        className: 'text-slate-400 max-w-2xl mx-auto mt-4 text-pretty',
                        children:
                            'Haltest sits on top of Playwright and speaks the language of your stack. Import what you have, export what you build — the code is always yours.',
                    }),
                ],
            }),
            g.jsx('div', {
                className: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-14',
                children: n2.map((e, t) =>
                    g.jsxs(
                        _.div,
                        {
                            initial: { opacity: 0, y: 24 },
                            whileInView: { opacity: 1, y: 0 },
                            viewport: { once: !0 },
                            transition: { delay: t * 0.1 },
                            className:
                                'p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md',
                            children: [
                                g.jsx('div', {
                                    className:
                                        'p-2.5 rounded-lg bg-white/5 border border-white/10 w-fit mb-4',
                                    children: g.jsx(e.icon, {
                                        size: 20,
                                        className: 'text-hal-warning-500',
                                    }),
                                }),
                                g.jsx('h3', {
                                    className:
                                        'text-base font-bold uppercase tracking-widest text-white mb-2',
                                    children: e.title,
                                }),
                                g.jsx('p', {
                                    className: 'text-sm text-slate-400 leading-relaxed',
                                    children: e.desc,
                                }),
                            ],
                        },
                        e.title,
                    ),
                ),
            }),
            g.jsxs(_.div, {
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: !0 },
                className: 'flex flex-wrap items-center justify-center gap-3',
                children: [
                    g.jsxs('span', {
                        className:
                            'flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mr-2',
                        children: [g.jsx(bk, { size: 14 }), ' Interoperable with'],
                    }),
                    t2.map((e) =>
                        g.jsx(
                            'span',
                            {
                                className:
                                    'px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold tracking-wider text-slate-300',
                                children: e,
                            },
                            e,
                        ),
                    ),
                ],
            }),
        ],
    });
}
const i2 = [
    {
        icon: Kk,
        title: 'From manual QA to automation',
        desc: 'Manual testers build reliable flows visually — no boilerplate, no framework onboarding — and hand devs real code.',
    },
    {
        icon: Bk,
        title: 'Regression that maintains itself',
        desc: 'Auto-healing keeps selectors alive as the UI changes, so nightly regression suites stop failing on cosmetic edits.',
    },
    {
        icon: $k,
        title: 'Load testing before every release',
        desc: 'Run soak and spike scenarios against staging and catch the breaking point long before your users find it.',
    },
    {
        icon: Uk,
        title: 'A security gate in the pipeline',
        desc: 'Wire CSP, TLS and data-leak audits into CI so a non-compliant build never reaches production.',
    },
];
function s2() {
    return g.jsxs('section', {
        id: 'use-cases',
        className: 'relative z-10 w-full max-w-6xl mx-auto px-4 py-24',
        children: [
            g.jsxs('div', {
                className: 'text-center mb-16',
                children: [
                    g.jsx(_.p, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        className:
                            'text-xs font-bold uppercase tracking-[0.3em] text-hal-primary-400 mb-4',
                        children: 'Where teams use it',
                    }),
                    g.jsxs(_.h2, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        transition: { delay: 0.05 },
                        className:
                            'text-4xl md:text-5xl font-bold uppercase tracking-tight text-balance',
                        children: [
                            'Built for the way',
                            ' ',
                            g.jsx('span', {
                                className: 'text-hal-primary-400',
                                children: 'QA actually works',
                            }),
                        ],
                    }),
                ],
            }),
            g.jsx('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
                children: i2.map((e, t) =>
                    g.jsxs(
                        _.div,
                        {
                            initial: { opacity: 0, y: 24 },
                            whileInView: { opacity: 1, y: 0 },
                            viewport: { once: !0 },
                            transition: { delay: t * 0.08 },
                            className:
                                'flex gap-5 p-7 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:border-hal-primary-500/40 transition-colors',
                            children: [
                                g.jsx('div', {
                                    className: 'shrink-0',
                                    children: g.jsx('div', {
                                        className:
                                            'p-3 rounded-xl bg-white/5 border border-white/10',
                                        children: g.jsx(e.icon, {
                                            size: 22,
                                            className: 'text-hal-primary-400',
                                        }),
                                    }),
                                }),
                                g.jsxs('div', {
                                    children: [
                                        g.jsx('h3', {
                                            className:
                                                'text-base font-bold uppercase tracking-widest text-white mb-2',
                                            children: e.title,
                                        }),
                                        g.jsx('p', {
                                            className:
                                                'text-sm text-slate-400 leading-relaxed text-pretty',
                                            children: e.desc,
                                        }),
                                    ],
                                }),
                            ],
                        },
                        e.title,
                    ),
                ),
            }),
        ],
    });
}
const o2 = ['Haltest', 'Raw Playwright', 'SaaS test cloud'],
    a2 = [
        { label: 'Visual flow editor', values: [!0, !1, 'partial'] },
        { label: 'Smart element picker', values: [!0, !1, !0] },
        { label: 'Exports to real code you own', values: [!0, !0, !1] },
        { label: 'Imports existing suites', values: [!0, !1, 'partial'] },
        { label: 'Performance & load testing', values: [!0, !1, 'partial'] },
        { label: 'Security & compliance audits', values: [!0, !1, !1] },
        { label: 'Deterministic auto-healing', values: [!0, !1, 'partial'] },
        { label: 'Real-time collaboration', values: [!0, !1, !0] },
        { label: 'Runs in your own CI/CD', values: [!0, !0, 'partial'] },
    ];
function l2({ value: e }) {
    return e === !0
        ? g.jsx('span', {
              className:
                  'inline-flex items-center justify-center w-7 h-7 rounded-full bg-hal-primary-500/15',
              children: g.jsx(Iu, { size: 16, className: 'text-hal-primary-400', strokeWidth: 3 }),
          })
        : e === 'partial'
          ? g.jsx('span', {
                className:
                    'inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/5',
                children: g.jsx(Mg, { size: 16, className: 'text-slate-500', strokeWidth: 3 }),
            })
          : g.jsx('span', {
                className:
                    'inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/5',
                children: g.jsx(Bu, { size: 16, className: 'text-slate-600', strokeWidth: 3 }),
            });
}
function u2() {
    return g.jsxs('section', {
        id: 'compare',
        className: 'relative z-10 w-full max-w-5xl mx-auto px-4 py-24',
        children: [
            g.jsxs('div', {
                className: 'text-center mb-16',
                children: [
                    g.jsx(_.p, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        className:
                            'text-xs font-bold uppercase tracking-[0.3em] text-hal-primary-400 mb-4',
                        children: 'Why Haltest',
                    }),
                    g.jsxs(_.h2, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        transition: { delay: 0.05 },
                        className:
                            'text-4xl md:text-5xl font-bold uppercase tracking-tight text-balance',
                        children: [
                            'The whole picture,',
                            ' ',
                            g.jsx('span', {
                                className: 'text-hal-primary-400',
                                children: 'not a slice',
                            }),
                        ],
                    }),
                    g.jsx(_.p, {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: !0 },
                        transition: { delay: 0.1 },
                        className: 'text-slate-400 max-w-2xl mx-auto mt-4 text-pretty',
                        children:
                            'Code frameworks give you control but no coverage. Test clouds give you coverage but lock you in. Haltest gives you both.',
                    }),
                ],
            }),
            g.jsx(_.div, {
                initial: { opacity: 0, y: 24 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: !0 },
                className:
                    'overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md',
                children: g.jsxs('table', {
                    className: 'w-full min-w-[560px] border-collapse text-left',
                    children: [
                        g.jsx('thead', {
                            children: g.jsxs('tr', {
                                className: 'border-b border-white/10',
                                children: [
                                    g.jsx('th', {
                                        className:
                                            'p-5 text-xs font-bold uppercase tracking-widest text-slate-500',
                                        children: 'Capability',
                                    }),
                                    o2.map((e, t) =>
                                        g.jsx(
                                            'th',
                                            {
                                                className: `p-5 text-center text-xs font-bold uppercase tracking-widest ${t === 0 ? 'text-hal-primary-400' : 'text-slate-400'}`,
                                                children: e,
                                            },
                                            e,
                                        ),
                                    ),
                                ],
                            }),
                        }),
                        g.jsx('tbody', {
                            children: a2.map((e) =>
                                g.jsxs(
                                    'tr',
                                    {
                                        className:
                                            'border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors',
                                        children: [
                                            g.jsx('td', {
                                                className: 'p-5 text-sm text-slate-300 font-medium',
                                                children: e.label,
                                            }),
                                            e.values.map((t, n) =>
                                                g.jsx(
                                                    'td',
                                                    {
                                                        className: `p-5 text-center ${n === 0 ? 'bg-hal-primary-500/[0.04]' : ''}`,
                                                        children: g.jsx(l2, { value: t }),
                                                    },
                                                    `${e.label}-${n}`,
                                                ),
                                            ),
                                        ],
                                    },
                                    e.label,
                                ),
                            ),
                        }),
                    ],
                }),
            }),
            g.jsxs(_.div, {
                initial: { opacity: 0 },
                whileInView: { opacity: 1 },
                viewport: { once: !0 },
                className:
                    'flex flex-wrap items-center justify-center gap-6 mt-6 text-[11px] uppercase tracking-wider text-slate-500',
                children: [
                    g.jsxs('span', {
                        className: 'flex items-center gap-2',
                        children: [
                            g.jsx(Iu, {
                                size: 14,
                                className: 'text-hal-primary-400',
                                strokeWidth: 3,
                            }),
                            ' ',
                            'Full support',
                        ],
                    }),
                    g.jsxs('span', {
                        className: 'flex items-center gap-2',
                        children: [
                            g.jsx(Mg, { size: 14, className: 'text-slate-500', strokeWidth: 3 }),
                            ' Partial / add-on',
                        ],
                    }),
                    g.jsxs('span', {
                        className: 'flex items-center gap-2',
                        children: [
                            g.jsx(Bu, { size: 14, className: 'text-slate-600', strokeWidth: 3 }),
                            ' Not available',
                        ],
                    }),
                ],
            }),
        ],
    });
}
function c2() {
    return g.jsx('section', {
        className: 'relative z-10 w-full max-w-4xl mx-auto px-4 py-24',
        children: g.jsxs(_.div, {
            initial: { opacity: 0, y: 24 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: !0 },
            className:
                'relative rounded-3xl border border-white/10 bg-slate-800/50 backdrop-blur-xl p-10 md:p-16 text-center overflow-hidden',
            children: [
                g.jsx('div', {
                    className:
                        'absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_60%)] -z-10',
                }),
                g.jsxs('h2', {
                    className:
                        'text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4 text-balance',
                    children: [
                        'Ship browser tests that',
                        ' ',
                        g.jsx('span', {
                            className: 'text-hal-primary-400',
                            children: 'keep working',
                        }),
                    ],
                }),
                g.jsx('p', {
                    className: 'text-slate-300 max-w-xl mx-auto mb-8 text-pretty',
                    children:
                        'Spin up the studio in seconds and build your first self-healing flow.',
                }),
                g.jsx('div', {
                    className: 'mx-auto max-w-md mb-8',
                    children: g.jsxs('div', {
                        className:
                            'flex items-center justify-center gap-3 bg-slate-900/80 border border-white/10 rounded-xl p-4',
                        children: [
                            g.jsx('span', {
                                className: 'text-hal-primary-400 font-bold',
                                children: '$',
                            }),
                            g.jsx('code', {
                                className: 'text-white font-mono text-sm',
                                children: 'npx haltest@latest',
                            }),
                        ],
                    }),
                }),
                g.jsxs('div', {
                    className: 'flex flex-col sm:flex-row gap-4 items-center justify-center',
                    children: [
                        g.jsxs(_.a, {
                            whileHover: { scale: 1.05 },
                            whileTap: { scale: 0.95 },
                            href: '/app',
                            className:
                                'group px-8 py-4 bg-hal-primary-500 hover:bg-hal-primary-400 text-white rounded-lg font-bold uppercase tracking-wider transition-all shadow-xl shadow-hal-primary-900/40 no-underline flex items-center gap-2',
                            children: [
                                'Launch App',
                                g.jsx(Ag, {
                                    size: 16,
                                    className: 'group-hover:translate-x-1 transition-transform',
                                }),
                            ],
                        }),
                        g.jsxs(_.a, {
                            whileHover: { scale: 1.05 },
                            whileTap: { scale: 0.95 },
                            href: 'https://join.slack.com/t/haltest-talk/shared_invite/zt-3tzii9nxh-vgdIcI5A8bg~GCG8QF6MuA',
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className:
                                'px-8 py-4 bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2 no-underline',
                            children: [
                                g.jsx(Og, { size: 18, className: 'text-[#E01E5A]' }),
                                'Join the community',
                            ],
                        }),
                    ],
                }),
            ],
        }),
    });
}
const d2 = [
    {
        title: 'Product',
        links: [
            { label: 'Platform', href: '#platform' },
            { label: 'Auto-healing', href: '#healing' },
            { label: 'Interoperability', href: '#interop' },
            { label: 'Launch App', href: '/app' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'Docs', href: 'https://deepwiki.com/andresguc1/hal-test', external: !0 },
            {
                label: 'Roadmap',
                href: 'https://github.com/users/andresguc1/projects/8',
                external: !0,
            },
            { label: 'GitHub', href: 'https://github.com/andresguc1/hal-test', external: !0 },
        ],
    },
    {
        title: 'Community',
        links: [
            {
                label: 'Slack',
                href: 'https://join.slack.com/t/haltest-talk/shared_invite/zt-3tzii9nxh-vgdIcI5A8bg~GCG8QF6MuA',
                external: !0,
            },
        ],
    },
];
function f2() {
    return g.jsxs('footer', {
        className: 'relative z-10 border-t border-white/5 bg-slate-900/60 backdrop-blur-md',
        children: [
            g.jsxs('div', {
                className: 'max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10',
                children: [
                    g.jsxs('div', {
                        className: 'col-span-2 md:col-span-1',
                        children: [
                            g.jsxs('div', {
                                className: 'flex items-center gap-3 mb-4',
                                children: [
                                    g.jsx('img', {
                                        src: '/images/haltest_logo.jpeg',
                                        alt: 'HAL-TEST',
                                        className: 'w-8 h-8 rounded-md',
                                    }),
                                    g.jsxs('div', {
                                        className: 'text-lg font-bold tracking-widest flex gap-1',
                                        children: [
                                            g.jsx('span', {
                                                className: 'text-hal-primary-400',
                                                children: 'HAL',
                                            }),
                                            g.jsx('span', {
                                                className: 'text-white/30',
                                                children: '-',
                                            }),
                                            g.jsx('span', {
                                                className: 'text-hal-warning-500',
                                                children: 'TEST',
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            g.jsx('p', {
                                className: 'text-xs text-slate-500 leading-relaxed max-w-xs',
                                children:
                                    'The visual QA platform for automation, performance and security — built on Playwright.',
                            }),
                        ],
                    }),
                    d2.map((e) =>
                        g.jsxs(
                            'div',
                            {
                                children: [
                                    g.jsx('h4', {
                                        className:
                                            'text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4',
                                        children: e.title,
                                    }),
                                    g.jsx('ul', {
                                        className: 'space-y-3',
                                        children: e.links.map((t) =>
                                            g.jsx(
                                                'li',
                                                {
                                                    children: g.jsx('a', {
                                                        href: t.href,
                                                        target: t.external ? '_blank' : void 0,
                                                        rel: t.external
                                                            ? 'noopener noreferrer'
                                                            : void 0,
                                                        className:
                                                            'text-sm text-slate-400 hover:text-white transition-colors no-underline',
                                                        children: t.label,
                                                    }),
                                                },
                                                t.label,
                                            ),
                                        ),
                                    }),
                                ],
                            },
                            e.title,
                        ),
                    ),
                ],
            }),
            g.jsx('div', {
                className: 'border-t border-white/5',
                children: g.jsxs('div', {
                    className:
                        'max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3',
                    children: [
                        g.jsxs('span', {
                            className: 'text-[11px] uppercase tracking-widest text-slate-600',
                            children: ['© ', new Date().getFullYear(), ' Haltest'],
                        }),
                        g.jsx('span', {
                            className: 'text-[11px] uppercase tracking-widest text-slate-600',
                            children: 'The Missing Link in Browser Automation',
                        }),
                    ],
                }),
            }),
        ],
    });
}
function h2() {
    return g.jsxs('div', {
        className:
            'relative min-h-screen bg-slate-900 text-white overflow-x-hidden font-mono selection:bg-hal-primary-500/30',
        children: [
            g.jsx('style', {
                dangerouslySetInnerHTML: {
                    __html: `
        body { margin: 0; cursor: default; }
        html { scroll-behavior: smooth; }
        .font-mono { font-family: 'Geist Mono', monospace; }
      `,
                },
            }),
            g.jsx('div', {
                className:
                    'fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12)_0%,rgba(15,23,42,0)_45%),radial-gradient(circle_at_center,rgba(15,23,42,0.4)_0%,#0f172a_100%)] pointer-events-none',
            }),
            g.jsx('div', {
                className: 'fixed inset-0 z-0 opacity-10 pointer-events-none',
                style: {
                    backgroundImage:
                        'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                },
            }),
            g.jsx(Gk, {}),
            g.jsxs('main', {
                className: 'relative z-10',
                children: [
                    g.jsx(Zk, {}),
                    g.jsx(Jk, {}),
                    g.jsx(e2, {}),
                    g.jsx(r2, {}),
                    g.jsx(s2, {}),
                    g.jsx(u2, {}),
                    g.jsx(c2, {}),
                ],
            }),
            g.jsx(f2, {}),
        ],
    });
}
const { slice: p2, forEach: m2 } = [];
function g2(e) {
    return (
        m2.call(p2.call(arguments, 1), (t) => {
            if (t) for (const n in t) e[n] === void 0 && (e[n] = t[n]);
        }),
        e
    );
}
function y2(e) {
    return typeof e != 'string'
        ? !1
        : [
              /<\s*script.*?>/i,
              /<\s*\/\s*script\s*>/i,
              /<\s*img.*?on\w+\s*=/i,
              /<\s*\w+\s*on\w+\s*=.*?>/i,
              /javascript\s*:/i,
              /vbscript\s*:/i,
              /expression\s*\(/i,
              /eval\s*\(/i,
              /alert\s*\(/i,
              /document\.cookie/i,
              /document\.write\s*\(/i,
              /window\.location/i,
              /innerHTML/i,
          ].some((n) => n.test(e));
}
const Af = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/,
    v2 = function (e, t) {
        const r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : { path: '/' },
            i = encodeURIComponent(t);
        let s = `${e}=${i}`;
        if (r.maxAge > 0) {
            const o = r.maxAge - 0;
            if (Number.isNaN(o)) throw new Error('maxAge should be a Number');
            s += `; Max-Age=${Math.floor(o)}`;
        }
        if (r.domain) {
            if (!Af.test(r.domain)) throw new TypeError('option domain is invalid');
            s += `; Domain=${r.domain}`;
        }
        if (r.path) {
            if (!Af.test(r.path)) throw new TypeError('option path is invalid');
            s += `; Path=${r.path}`;
        }
        if (r.expires) {
            if (typeof r.expires.toUTCString != 'function')
                throw new TypeError('option expires is invalid');
            s += `; Expires=${r.expires.toUTCString()}`;
        }
        if ((r.httpOnly && (s += '; HttpOnly'), r.secure && (s += '; Secure'), r.sameSite))
            switch (typeof r.sameSite == 'string' ? r.sameSite.toLowerCase() : r.sameSite) {
                case !0:
                    s += '; SameSite=Strict';
                    break;
                case 'lax':
                    s += '; SameSite=Lax';
                    break;
                case 'strict':
                    s += '; SameSite=Strict';
                    break;
                case 'none':
                    s += '; SameSite=None';
                    break;
                default:
                    throw new TypeError('option sameSite is invalid');
            }
        return (r.partitioned && (s += '; Partitioned'), s);
    },
    Df = {
        create(e, t, n, r) {
            let i =
                arguments.length > 4 && arguments[4] !== void 0
                    ? arguments[4]
                    : { path: '/', sameSite: 'strict' };
            (n && ((i.expires = new Date()), i.expires.setTime(i.expires.getTime() + n * 60 * 1e3)),
                r && (i.domain = r),
                (document.cookie = v2(e, t, i)));
        },
        read(e) {
            const t = `${e}=`,
                n = document.cookie.split(';');
            for (let r = 0; r < n.length; r++) {
                let i = n[r];
                for (; i.charAt(0) === ' '; ) i = i.substring(1, i.length);
                if (i.indexOf(t) === 0) return i.substring(t.length, i.length);
            }
            return null;
        },
        remove(e, t) {
            this.create(e, '', -1, t);
        },
    };
var x2 = {
        name: 'cookie',
        lookup(e) {
            let { lookupCookie: t } = e;
            if (t && typeof document < 'u') return Df.read(t) || void 0;
        },
        cacheUserLanguage(e, t) {
            let { lookupCookie: n, cookieMinutes: r, cookieDomain: i, cookieOptions: s } = t;
            n && typeof document < 'u' && Df.create(n, e, r, i, s);
        },
    },
    w2 = {
        name: 'querystring',
        lookup(e) {
            var r;
            let { lookupQuerystring: t } = e,
                n;
            if (typeof window < 'u') {
                let { search: i } = window.location;
                !window.location.search &&
                    ((r = window.location.hash) == null ? void 0 : r.indexOf('?')) > -1 &&
                    (i = window.location.hash.substring(window.location.hash.indexOf('?')));
                const o = i.substring(1).split('&');
                for (let a = 0; a < o.length; a++) {
                    const l = o[a].indexOf('=');
                    l > 0 && o[a].substring(0, l) === t && (n = o[a].substring(l + 1));
                }
            }
            return n;
        },
    },
    S2 = {
        name: 'hash',
        lookup(e) {
            var i;
            let { lookupHash: t, lookupFromHashIndex: n } = e,
                r;
            if (typeof window < 'u') {
                const { hash: s } = window.location;
                if (s && s.length > 2) {
                    const o = s.substring(1);
                    if (t) {
                        const a = o.split('&');
                        for (let l = 0; l < a.length; l++) {
                            const u = a[l].indexOf('=');
                            u > 0 && a[l].substring(0, u) === t && (r = a[l].substring(u + 1));
                        }
                    }
                    if (r) return r;
                    if (!r && n > -1) {
                        const a = s.match(/\/([a-zA-Z-]*)/g);
                        return Array.isArray(a)
                            ? (i = a[typeof n == 'number' ? n : 0]) == null
                                ? void 0
                                : i.replace('/', '')
                            : void 0;
                    }
                }
            }
            return r;
        },
    };
let Cn = null;
const Mf = () => {
    if (Cn !== null) return Cn;
    try {
        if (((Cn = typeof window < 'u' && window.localStorage !== null), !Cn)) return !1;
        const e = 'i18next.translate.boo';
        (window.localStorage.setItem(e, 'foo'), window.localStorage.removeItem(e));
    } catch {
        Cn = !1;
    }
    return Cn;
};
var k2 = {
    name: 'localStorage',
    lookup(e) {
        let { lookupLocalStorage: t } = e;
        if (t && Mf()) return window.localStorage.getItem(t) || void 0;
    },
    cacheUserLanguage(e, t) {
        let { lookupLocalStorage: n } = t;
        n && Mf() && window.localStorage.setItem(n, e);
    },
};
let Pn = null;
const Of = () => {
    if (Pn !== null) return Pn;
    try {
        if (((Pn = typeof window < 'u' && window.sessionStorage !== null), !Pn)) return !1;
        const e = 'i18next.translate.boo';
        (window.sessionStorage.setItem(e, 'foo'), window.sessionStorage.removeItem(e));
    } catch {
        Pn = !1;
    }
    return Pn;
};
var C2 = {
        name: 'sessionStorage',
        lookup(e) {
            let { lookupSessionStorage: t } = e;
            if (t && Of()) return window.sessionStorage.getItem(t) || void 0;
        },
        cacheUserLanguage(e, t) {
            let { lookupSessionStorage: n } = t;
            n && Of() && window.sessionStorage.setItem(n, e);
        },
    },
    P2 = {
        name: 'navigator',
        lookup(e) {
            const t = [];
            if (typeof navigator < 'u') {
                const { languages: n, userLanguage: r, language: i } = navigator;
                if (n) for (let s = 0; s < n.length; s++) t.push(n[s]);
                (r && t.push(r), i && t.push(i));
            }
            return t.length > 0 ? t : void 0;
        },
    },
    T2 = {
        name: 'htmlTag',
        lookup(e) {
            let { htmlTag: t } = e,
                n;
            const r = t || (typeof document < 'u' ? document.documentElement : null);
            return (r && typeof r.getAttribute == 'function' && (n = r.getAttribute('lang')), n);
        },
    },
    E2 = {
        name: 'path',
        lookup(e) {
            var i;
            let { lookupFromPathIndex: t } = e;
            if (typeof window > 'u') return;
            const n = window.location.pathname.match(/\/([a-zA-Z-]*)/g);
            return Array.isArray(n)
                ? (i = n[typeof t == 'number' ? t : 0]) == null
                    ? void 0
                    : i.replace('/', '')
                : void 0;
        },
    },
    N2 = {
        name: 'subdomain',
        lookup(e) {
            var i, s;
            let { lookupFromSubdomainIndex: t } = e;
            const n = typeof t == 'number' ? t + 1 : 1,
                r =
                    typeof window < 'u' &&
                    ((s = (i = window.location) == null ? void 0 : i.hostname) == null
                        ? void 0
                        : s.match(/^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i));
            if (r) return r[n];
        },
    };
let bg = !1;
try {
    (document.cookie, (bg = !0));
} catch {}
const _g = ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'];
bg || _g.splice(1, 1);
const L2 = () => ({
    order: _g,
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    lookupSessionStorage: 'i18nextLng',
    caches: ['localStorage'],
    excludeCacheFor: ['cimode'],
    convertDetectedLanguage: (e) => e,
});
class Ig {
    constructor(t) {
        let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        ((this.type = 'languageDetector'), (this.detectors = {}), this.init(t, n));
    }
    init() {
        let t =
                arguments.length > 0 && arguments[0] !== void 0
                    ? arguments[0]
                    : { languageUtils: {} },
            n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
            r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        ((this.services = t),
            (this.options = g2(n, this.options || {}, L2())),
            typeof this.options.convertDetectedLanguage == 'string' &&
                this.options.convertDetectedLanguage.indexOf('15897') > -1 &&
                (this.options.convertDetectedLanguage = (i) => i.replace('-', '_')),
            this.options.lookupFromUrlIndex &&
                (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
            (this.i18nOptions = r),
            this.addDetector(x2),
            this.addDetector(w2),
            this.addDetector(k2),
            this.addDetector(C2),
            this.addDetector(P2),
            this.addDetector(T2),
            this.addDetector(E2),
            this.addDetector(N2),
            this.addDetector(S2));
    }
    addDetector(t) {
        return ((this.detectors[t.name] = t), this);
    }
    detect() {
        let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.options.order,
            n = [];
        return (
            t.forEach((r) => {
                if (this.detectors[r]) {
                    let i = this.detectors[r].lookup(this.options);
                    (i && typeof i == 'string' && (i = [i]), i && (n = n.concat(i)));
                }
            }),
            (n = n
                .filter((r) => r != null && !y2(r))
                .map((r) => this.options.convertDetectedLanguage(r))),
            this.services &&
            this.services.languageUtils &&
            this.services.languageUtils.getBestMatchFromCodes
                ? n
                : n.length > 0
                  ? n[0]
                  : null
        );
    }
    cacheUserLanguage(t) {
        let n =
            arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.options.caches;
        n &&
            ((this.options.excludeCacheFor && this.options.excludeCacheFor.indexOf(t) > -1) ||
                n.forEach((r) => {
                    this.detectors[r] && this.detectors[r].cacheUserLanguage(t, this.options);
                }));
    }
}
Ig.type = 'languageDetector';
const j2 = {
    en: {
        translation: {
            hero: {
                title_part1: 'hal',
                title_part2: 'Test',
                subtitle: 'Modern, visual automation framework.',
                headline_part1: 'The Missing Link',
                headline_part2: 'in Automation',
                desc1: 'No-code flow builder with AI-powered healing',
                desc2: 'and real-time Playwright execution.',
                zero_config: 'Zero config. No cloning required.',
            },
            features: {
                visual_editor: {
                    title: 'Visual Flow Editor',
                    description:
                        'Drag-and-drop orchestration with 50+ specialized nodes. No code required.',
                },
                advanced_control: {
                    title: 'Advanced Control',
                    description: 'Network interception, AI integration, and session management.',
                },
            },
            cta: {
                open_source: 'Open Source & Free',
                launch_app: 'Launch App',
                star_github: 'Star on GitHub',
                community: 'Community',
            },
            nav: { status: 'Status: Operating' },
            language: { en: 'English', es: 'Español' },
            stats: {
                flows: 'Flows Executed',
                nodes: 'Node Types',
                success: 'Success Rate',
                source: 'Open Source',
            },
            pricing: {
                title_part1: 'Unlock Your',
                title_part2: 'Full Potential',
                subtitle: 'Simple, scalable pricing for teams of all sizes.',
                enterprise_title: 'Looking for enterprise solutions?',
                enterprise_subtitle: 'Custom deployments & SLAs',
                tiers: {
                    starter: {
                        title: 'STARTER',
                        price: 'FREE',
                        desc: 'For hobbyists & solo devs',
                        features: [
                            '3 Active Projects',
                            '100 Runs/month',
                            'Basic Node Types',
                            'Community Support',
                        ],
                        btn: 'Get Started',
                    },
                    pro: {
                        title: 'PRO',
                        price: '$19',
                        desc: '/ editor / month',
                        features: [
                            'Unlimited Projects',
                            'AI Self-Healing Selectors',
                            'Parallel Execution (x5)',
                            'Email Support',
                        ],
                        btn: 'Get Started',
                    },
                    team: {
                        title: 'TEAM',
                        price: '$49',
                        desc: '/ editor / month',
                        features: [
                            'Unlimited Runs',
                            'Real-time Log Terminal',
                            'Dedicated Slack Channel',
                            '90-Day Data Retention',
                        ],
                        btn: 'Get Started',
                    },
                },
            },
            common: {
                back_home: 'Back to Home',
                copied: 'Copied!',
                copy_clipboard: 'Copy to clipboard',
            },
        },
    },
    es: {
        translation: {
            hero: {
                title_part1: 'hal',
                title_part2: 'Test',
                subtitle: 'Framework moderno de automatización visual.',
                headline_part1: 'El Eslabón Perdido',
                headline_part2: 'en la Automatización',
                desc1: 'Creador de flujos sin código con auto-recuperación por IA',
                desc2: 'y ejecución en tiempo real con Playwright.',
                zero_config: 'Cero configuración. Sin clonar repositorio.',
            },
            features: {
                visual_editor: {
                    title: 'Editor Visual de Flujos',
                    description:
                        'Orquestación "drag-and-drop" con más de 50 nodos especializados. Sin código.',
                },
                advanced_control: {
                    title: 'Control Avanzado',
                    description: 'Intercepción de red, integración con IA y gestión de sesiones.',
                },
            },
            cta: {
                open_source: 'Open Source y Gratis',
                launch_app: 'Lanzar App',
                star_github: 'Estrella en GitHub',
                community: 'Comunidad',
            },
            nav: { status: 'Estado: Operando' },
            language: { en: 'English', es: 'Español' },
            stats: {
                flows: 'Flujos Ejecutados',
                nodes: 'Tipos de Nodos',
                success: 'Tasa de Éxito',
                source: 'Código Abierto',
            },
            pricing: {
                title_part1: 'Desbloquea tu',
                title_part2: 'Máximo Potencial',
                subtitle: 'Precios simples y escalables para equipos de todo tamaño.',
                enterprise_title: '¿Buscas soluciones empresariales?',
                enterprise_subtitle: 'Despliegues a medida y acuerdos de nivel de servicio (SLA)',
                tiers: {
                    starter: {
                        title: 'INICIAL',
                        price: 'GRATIS',
                        desc: 'Para entusiastas y creadores independientes',
                        features: [
                            '3 Proyectos Activos',
                            '100 Ejecuciones/mes',
                            'Tipos de Nodos Básicos',
                            'Soporte de la Comunidad',
                        ],
                        btn: 'Comenzar',
                    },
                    pro: {
                        title: 'PRO',
                        price: '$19',
                        desc: '/ editor / mes',
                        features: [
                            'Proyectos Ilimitados',
                            'Selectores Auto-Recuperables IA',
                            'Ejecución en Paralelo (x5)',
                            'Soporte por Correo',
                        ],
                        btn: 'Comenzar',
                    },
                    team: {
                        title: 'EQUIPO',
                        price: '$49',
                        desc: '/ editor / mes',
                        features: [
                            'Ejecuciones Ilimitadas',
                            'Terminal de Registros en Tiempo Real',
                            'Canal Exclusivo de Slack',
                            'Retención de Datos por 90 Días',
                        ],
                        btn: 'Comenzar',
                    },
                },
            },
            common: {
                back_home: 'Volver al Inicio',
                copied: '¡Copiado!',
                copy_clipboard: 'Copiar al portapapeles',
            },
        },
    },
};
Le.use(Ig)
    .use($v)
    .init({
        resources: j2,
        fallbackLng: 'en',
        interpolation: { escapeValue: !1 },
        detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    });
Zo.createRoot(document.getElementById('root')).render(
    g.jsx(Fs.StrictMode, { children: g.jsx(h2, {}) }),
);
