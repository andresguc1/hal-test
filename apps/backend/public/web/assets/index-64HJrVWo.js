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
function qg(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
}
var Yd = { exports: {} },
    Gs = {},
    Xd = { exports: {} },
    I = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var gi = Symbol.for('react.element'),
    ey = Symbol.for('react.portal'),
    ty = Symbol.for('react.fragment'),
    ny = Symbol.for('react.strict_mode'),
    ry = Symbol.for('react.profiler'),
    iy = Symbol.for('react.provider'),
    sy = Symbol.for('react.context'),
    oy = Symbol.for('react.forward_ref'),
    ay = Symbol.for('react.suspense'),
    ly = Symbol.for('react.memo'),
    uy = Symbol.for('react.lazy'),
    Xu = Symbol.iterator;
function cy(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = (Xu && e[Xu]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var Zd = {
        isMounted: function () {
            return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
    },
    Jd = Object.assign,
    qd = {};
function ar(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = qd), (this.updater = n || Zd));
}
ar.prototype.isReactComponent = {};
ar.prototype.setState = function (e, t) {
    if (typeof e != 'object' && typeof e != 'function' && e != null)
        throw Error(
            'setState(...): takes an object of state variables to update or a function which returns an object of state variables.',
        );
    this.updater.enqueueSetState(this, e, t, 'setState');
};
ar.prototype.forceUpdate = function (e) {
    this.updater.enqueueForceUpdate(this, e, 'forceUpdate');
};
function eh() {}
eh.prototype = ar.prototype;
function kl(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = qd), (this.updater = n || Zd));
}
var Pl = (kl.prototype = new eh());
Pl.constructor = kl;
Jd(Pl, ar.prototype);
Pl.isPureReactComponent = !0;
var Zu = Array.isArray,
    th = Object.prototype.hasOwnProperty,
    Cl = { current: null },
    nh = { key: !0, ref: !0, __self: !0, __source: !0 };
function rh(e, t, n) {
    var r,
        i = {},
        s = null,
        o = null;
    if (t != null)
        for (r in (t.ref !== void 0 && (o = t.ref), t.key !== void 0 && (s = '' + t.key), t))
            th.call(t, r) && !nh.hasOwnProperty(r) && (i[r] = t[r]);
    var a = arguments.length - 2;
    if (a === 1) i.children = n;
    else if (1 < a) {
        for (var l = Array(a), u = 0; u < a; u++) l[u] = arguments[u + 2];
        i.children = l;
    }
    if (e && e.defaultProps) for (r in ((a = e.defaultProps), a)) i[r] === void 0 && (i[r] = a[r]);
    return { $$typeof: gi, type: e, key: s, ref: o, props: i, _owner: Cl.current };
}
function fy(e, t) {
    return { $$typeof: gi, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function Tl(e) {
    return typeof e == 'object' && e !== null && e.$$typeof === gi;
}
function dy(e) {
    var t = { '=': '=0', ':': '=2' };
    return (
        '$' +
        e.replace(/[=:]/g, function (n) {
            return t[n];
        })
    );
}
var Ju = /\/+/g;
function vo(e, t) {
    return typeof e == 'object' && e !== null && e.key != null ? dy('' + e.key) : t.toString(36);
}
function Xi(e, t, n, r, i) {
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
                    case gi:
                    case ey:
                        o = !0;
                }
        }
    if (o)
        return (
            (o = e),
            (i = i(o)),
            (e = r === '' ? '.' + vo(o, 0) : r),
            Zu(i)
                ? ((n = ''),
                  e != null && (n = e.replace(Ju, '$&/') + '/'),
                  Xi(i, t, n, '', function (u) {
                      return u;
                  }))
                : i != null &&
                  (Tl(i) &&
                      (i = fy(
                          i,
                          n +
                              (!i.key || (o && o.key === i.key)
                                  ? ''
                                  : ('' + i.key).replace(Ju, '$&/') + '/') +
                              e,
                      )),
                  t.push(i)),
            1
        );
    if (((o = 0), (r = r === '' ? '.' : r + ':'), Zu(e)))
        for (var a = 0; a < e.length; a++) {
            s = e[a];
            var l = r + vo(s, a);
            o += Xi(s, t, n, l, i);
        }
    else if (((l = cy(e)), typeof l == 'function'))
        for (e = l.call(e), a = 0; !(s = e.next()).done; )
            ((s = s.value), (l = r + vo(s, a++)), (o += Xi(s, t, n, l, i)));
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
function Ri(e, t, n) {
    if (e == null) return e;
    var r = [],
        i = 0;
    return (
        Xi(e, r, '', '', function (s) {
            return t.call(n, s, i++);
        }),
        r
    );
}
function hy(e) {
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
var Te = { current: null },
    Zi = { transition: null },
    py = { ReactCurrentDispatcher: Te, ReactCurrentBatchConfig: Zi, ReactCurrentOwner: Cl };
function ih() {
    throw Error('act(...) is not supported in production builds of React.');
}
I.Children = {
    map: Ri,
    forEach: function (e, t, n) {
        Ri(
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
            Ri(e, function () {
                t++;
            }),
            t
        );
    },
    toArray: function (e) {
        return (
            Ri(e, function (t) {
                return t;
            }) || []
        );
    },
    only: function (e) {
        if (!Tl(e))
            throw Error('React.Children.only expected to receive a single React element child.');
        return e;
    },
};
I.Component = ar;
I.Fragment = ty;
I.Profiler = ry;
I.PureComponent = kl;
I.StrictMode = ny;
I.Suspense = ay;
I.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = py;
I.act = ih;
I.cloneElement = function (e, t, n) {
    if (e == null)
        throw Error(
            'React.cloneElement(...): The argument must be a React element, but you passed ' +
                e +
                '.',
        );
    var r = Jd({}, e.props),
        i = e.key,
        s = e.ref,
        o = e._owner;
    if (t != null) {
        if (
            (t.ref !== void 0 && ((s = t.ref), (o = Cl.current)),
            t.key !== void 0 && (i = '' + t.key),
            e.type && e.type.defaultProps)
        )
            var a = e.type.defaultProps;
        for (l in t)
            th.call(t, l) &&
                !nh.hasOwnProperty(l) &&
                (r[l] = t[l] === void 0 && a !== void 0 ? a[l] : t[l]);
    }
    var l = arguments.length - 2;
    if (l === 1) r.children = n;
    else if (1 < l) {
        a = Array(l);
        for (var u = 0; u < l; u++) a[u] = arguments[u + 2];
        r.children = a;
    }
    return { $$typeof: gi, type: e.type, key: i, ref: s, props: r, _owner: o };
};
I.createContext = function (e) {
    return (
        (e = {
            $$typeof: sy,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
            _defaultValue: null,
            _globalName: null,
        }),
        (e.Provider = { $$typeof: iy, _context: e }),
        (e.Consumer = e)
    );
};
I.createElement = rh;
I.createFactory = function (e) {
    var t = rh.bind(null, e);
    return ((t.type = e), t);
};
I.createRef = function () {
    return { current: null };
};
I.forwardRef = function (e) {
    return { $$typeof: oy, render: e };
};
I.isValidElement = Tl;
I.lazy = function (e) {
    return { $$typeof: uy, _payload: { _status: -1, _result: e }, _init: hy };
};
I.memo = function (e, t) {
    return { $$typeof: ly, type: e, compare: t === void 0 ? null : t };
};
I.startTransition = function (e) {
    var t = Zi.transition;
    Zi.transition = {};
    try {
        e();
    } finally {
        Zi.transition = t;
    }
};
I.unstable_act = ih;
I.useCallback = function (e, t) {
    return Te.current.useCallback(e, t);
};
I.useContext = function (e) {
    return Te.current.useContext(e);
};
I.useDebugValue = function () {};
I.useDeferredValue = function (e) {
    return Te.current.useDeferredValue(e);
};
I.useEffect = function (e, t) {
    return Te.current.useEffect(e, t);
};
I.useId = function () {
    return Te.current.useId();
};
I.useImperativeHandle = function (e, t, n) {
    return Te.current.useImperativeHandle(e, t, n);
};
I.useInsertionEffect = function (e, t) {
    return Te.current.useInsertionEffect(e, t);
};
I.useLayoutEffect = function (e, t) {
    return Te.current.useLayoutEffect(e, t);
};
I.useMemo = function (e, t) {
    return Te.current.useMemo(e, t);
};
I.useReducer = function (e, t, n) {
    return Te.current.useReducer(e, t, n);
};
I.useRef = function (e) {
    return Te.current.useRef(e);
};
I.useState = function (e) {
    return Te.current.useState(e);
};
I.useSyncExternalStore = function (e, t, n) {
    return Te.current.useSyncExternalStore(e, t, n);
};
I.useTransition = function () {
    return Te.current.useTransition();
};
I.version = '18.3.1';
Xd.exports = I;
var C = Xd.exports;
const my = qg(C);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var gy = C,
    yy = Symbol.for('react.element'),
    vy = Symbol.for('react.fragment'),
    xy = Object.prototype.hasOwnProperty,
    wy = gy.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    Sy = { key: !0, ref: !0, __self: !0, __source: !0 };
function sh(e, t, n) {
    var r,
        i = {},
        s = null,
        o = null;
    (n !== void 0 && (s = '' + n),
        t.key !== void 0 && (s = '' + t.key),
        t.ref !== void 0 && (o = t.ref));
    for (r in t) xy.call(t, r) && !Sy.hasOwnProperty(r) && (i[r] = t[r]);
    if (e && e.defaultProps) for (r in ((t = e.defaultProps), t)) i[r] === void 0 && (i[r] = t[r]);
    return { $$typeof: yy, type: e, key: s, ref: o, props: i, _owner: wy.current };
}
Gs.Fragment = vy;
Gs.jsx = sh;
Gs.jsxs = sh;
Yd.exports = Gs;
var O = Yd.exports,
    la = {},
    oh = { exports: {} },
    Ie = {},
    ah = { exports: {} },
    lh = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
    function t(L, N) {
        var _ = L.length;
        L.push(N);
        e: for (; 0 < _; ) {
            var B = (_ - 1) >>> 1,
                K = L[B];
            if (0 < i(K, N)) ((L[B] = N), (L[_] = K), (_ = B));
            else break e;
        }
    }
    function n(L) {
        return L.length === 0 ? null : L[0];
    }
    function r(L) {
        if (L.length === 0) return null;
        var N = L[0],
            _ = L.pop();
        if (_ !== N) {
            L[0] = _;
            e: for (var B = 0, K = L.length, it = K >>> 1; B < it; ) {
                var st = 2 * (B + 1) - 1,
                    Pn = L[st],
                    Jt = st + 1,
                    Li = L[Jt];
                if (0 > i(Pn, _))
                    Jt < K && 0 > i(Li, Pn)
                        ? ((L[B] = Li), (L[Jt] = _), (B = Jt))
                        : ((L[B] = Pn), (L[st] = _), (B = st));
                else if (Jt < K && 0 > i(Li, _)) ((L[B] = Li), (L[Jt] = _), (B = Jt));
                else break e;
            }
        }
        return N;
    }
    function i(L, N) {
        var _ = L.sortIndex - N.sortIndex;
        return _ !== 0 ? _ : L.id - N.id;
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
        f = null,
        d = 3,
        m = !1,
        y = !1,
        v = !1,
        S = typeof setTimeout == 'function' ? setTimeout : null,
        p = typeof clearTimeout == 'function' ? clearTimeout : null,
        h = typeof setImmediate < 'u' ? setImmediate : null;
    typeof navigator < 'u' &&
        navigator.scheduling !== void 0 &&
        navigator.scheduling.isInputPending !== void 0 &&
        navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function g(L) {
        for (var N = n(u); N !== null; ) {
            if (N.callback === null) r(u);
            else if (N.startTime <= L) (r(u), (N.sortIndex = N.expirationTime), t(l, N));
            else break;
            N = n(u);
        }
    }
    function x(L) {
        if (((v = !1), g(L), !y))
            if (n(l) !== null) ((y = !0), oe(w));
            else {
                var N = n(u);
                N !== null && U(x, N.startTime - L);
            }
    }
    function w(L, N) {
        ((y = !1), v && ((v = !1), p(k), (k = -1)), (m = !0));
        var _ = d;
        try {
            for (g(N), f = n(l); f !== null && (!(f.expirationTime > N) || (L && !X())); ) {
                var B = f.callback;
                if (typeof B == 'function') {
                    ((f.callback = null), (d = f.priorityLevel));
                    var K = B(f.expirationTime <= N);
                    ((N = e.unstable_now()),
                        typeof K == 'function' ? (f.callback = K) : f === n(l) && r(l),
                        g(N));
                } else r(l);
                f = n(l);
            }
            if (f !== null) var it = !0;
            else {
                var st = n(u);
                (st !== null && U(x, st.startTime - N), (it = !1));
            }
            return it;
        } finally {
            ((f = null), (d = _), (m = !1));
        }
    }
    var P = !1,
        E = null,
        k = -1,
        D = 5,
        R = -1;
    function X() {
        return !(e.unstable_now() - R < D);
    }
    function z() {
        if (E !== null) {
            var L = e.unstable_now();
            R = L;
            var N = !0;
            try {
                N = E(!0, L);
            } finally {
                N ? j() : ((P = !1), (E = null));
            }
        } else P = !1;
    }
    var j;
    if (typeof h == 'function')
        j = function () {
            h(z);
        };
    else if (typeof MessageChannel < 'u') {
        var F = new MessageChannel(),
            Z = F.port2;
        ((F.port1.onmessage = z),
            (j = function () {
                Z.postMessage(null);
            }));
    } else
        j = function () {
            S(z, 0);
        };
    function oe(L) {
        ((E = L), P || ((P = !0), j()));
    }
    function U(L, N) {
        k = S(function () {
            L(e.unstable_now());
        }, N);
    }
    ((e.unstable_IdlePriority = 5),
        (e.unstable_ImmediatePriority = 1),
        (e.unstable_LowPriority = 4),
        (e.unstable_NormalPriority = 3),
        (e.unstable_Profiling = null),
        (e.unstable_UserBlockingPriority = 2),
        (e.unstable_cancelCallback = function (L) {
            L.callback = null;
        }),
        (e.unstable_continueExecution = function () {
            y || m || ((y = !0), oe(w));
        }),
        (e.unstable_forceFrameRate = function (L) {
            0 > L || 125 < L
                ? console.error(
                      'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported',
                  )
                : (D = 0 < L ? Math.floor(1e3 / L) : 5);
        }),
        (e.unstable_getCurrentPriorityLevel = function () {
            return d;
        }),
        (e.unstable_getFirstCallbackNode = function () {
            return n(l);
        }),
        (e.unstable_next = function (L) {
            switch (d) {
                case 1:
                case 2:
                case 3:
                    var N = 3;
                    break;
                default:
                    N = d;
            }
            var _ = d;
            d = N;
            try {
                return L();
            } finally {
                d = _;
            }
        }),
        (e.unstable_pauseExecution = function () {}),
        (e.unstable_requestPaint = function () {}),
        (e.unstable_runWithPriority = function (L, N) {
            switch (L) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    break;
                default:
                    L = 3;
            }
            var _ = d;
            d = L;
            try {
                return N();
            } finally {
                d = _;
            }
        }),
        (e.unstable_scheduleCallback = function (L, N, _) {
            var B = e.unstable_now();
            switch (
                (typeof _ == 'object' && _ !== null
                    ? ((_ = _.delay), (_ = typeof _ == 'number' && 0 < _ ? B + _ : B))
                    : (_ = B),
                L)
            ) {
                case 1:
                    var K = -1;
                    break;
                case 2:
                    K = 250;
                    break;
                case 5:
                    K = 1073741823;
                    break;
                case 4:
                    K = 1e4;
                    break;
                default:
                    K = 5e3;
            }
            return (
                (K = _ + K),
                (L = {
                    id: c++,
                    callback: N,
                    priorityLevel: L,
                    startTime: _,
                    expirationTime: K,
                    sortIndex: -1,
                }),
                _ > B
                    ? ((L.sortIndex = _),
                      t(u, L),
                      n(l) === null && L === n(u) && (v ? (p(k), (k = -1)) : (v = !0), U(x, _ - B)))
                    : ((L.sortIndex = K), t(l, L), y || m || ((y = !0), oe(w))),
                L
            );
        }),
        (e.unstable_shouldYield = X),
        (e.unstable_wrapCallback = function (L) {
            var N = d;
            return function () {
                var _ = d;
                d = N;
                try {
                    return L.apply(this, arguments);
                } finally {
                    d = _;
                }
            };
        }));
})(lh);
ah.exports = lh;
var ky = ah.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Py = C,
    je = ky;
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
var uh = new Set(),
    Qr = {};
function wn(e, t) {
    (Zn(e, t), Zn(e + 'Capture', t));
}
function Zn(e, t) {
    for (Qr[e] = t, e = 0; e < t.length; e++) uh.add(t[e]);
}
var Pt = !(
        typeof window > 'u' ||
        typeof window.document > 'u' ||
        typeof window.document.createElement > 'u'
    ),
    ua = Object.prototype.hasOwnProperty,
    Cy =
        /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
    qu = {},
    ec = {};
function Ty(e) {
    return ua.call(ec, e)
        ? !0
        : ua.call(qu, e)
          ? !1
          : Cy.test(e)
            ? (ec[e] = !0)
            : ((qu[e] = !0), !1);
}
function Ey(e, t, n, r) {
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
function Ly(e, t, n, r) {
    if (t === null || typeof t > 'u' || Ey(e, t, n, r)) return !0;
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
function Ee(e, t, n, r, i, s, o) {
    ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
        (this.attributeName = r),
        (this.attributeNamespace = i),
        (this.mustUseProperty = n),
        (this.propertyName = e),
        (this.type = t),
        (this.sanitizeURL = s),
        (this.removeEmptyString = o));
}
var ge = {};
'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
    .split(' ')
    .forEach(function (e) {
        ge[e] = new Ee(e, 0, !1, e, null, !1, !1);
    });
[
    ['acceptCharset', 'accept-charset'],
    ['className', 'class'],
    ['htmlFor', 'for'],
    ['httpEquiv', 'http-equiv'],
].forEach(function (e) {
    var t = e[0];
    ge[t] = new Ee(t, 1, !1, e[1], null, !1, !1);
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
    ge[e] = new Ee(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (e) {
    ge[e] = new Ee(e, 2, !1, e, null, !1, !1);
});
'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
    .split(' ')
    .forEach(function (e) {
        ge[e] = new Ee(e, 3, !1, e.toLowerCase(), null, !1, !1);
    });
['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
    ge[e] = new Ee(e, 3, !0, e, null, !1, !1);
});
['capture', 'download'].forEach(function (e) {
    ge[e] = new Ee(e, 4, !1, e, null, !1, !1);
});
['cols', 'rows', 'size', 'span'].forEach(function (e) {
    ge[e] = new Ee(e, 6, !1, e, null, !1, !1);
});
['rowSpan', 'start'].forEach(function (e) {
    ge[e] = new Ee(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var El = /[\-:]([a-z])/g;
function Ll(e) {
    return e[1].toUpperCase();
}
'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(El, Ll);
        ge[t] = new Ee(t, 1, !1, e, null, !1, !1);
    });
'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(El, Ll);
        ge[t] = new Ee(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
    });
['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
    var t = e.replace(El, Ll);
    ge[t] = new Ee(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
});
['tabIndex', 'crossOrigin'].forEach(function (e) {
    ge[e] = new Ee(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
ge.xlinkHref = new Ee('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1);
['src', 'href', 'action', 'formAction'].forEach(function (e) {
    ge[e] = new Ee(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Rl(e, t, n, r) {
    var i = ge.hasOwnProperty(t) ? ge[t] : null;
    (i !== null
        ? i.type !== 0
        : r ||
          !(2 < t.length) ||
          (t[0] !== 'o' && t[0] !== 'O') ||
          (t[1] !== 'n' && t[1] !== 'N')) &&
        (Ly(t, n, i, r) && (n = null),
        r || i === null
            ? Ty(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, '' + n))
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
var Lt = Py.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    Ai = Symbol.for('react.element'),
    Rn = Symbol.for('react.portal'),
    An = Symbol.for('react.fragment'),
    Al = Symbol.for('react.strict_mode'),
    ca = Symbol.for('react.profiler'),
    ch = Symbol.for('react.provider'),
    fh = Symbol.for('react.context'),
    Ol = Symbol.for('react.forward_ref'),
    fa = Symbol.for('react.suspense'),
    da = Symbol.for('react.suspense_list'),
    Dl = Symbol.for('react.memo'),
    Dt = Symbol.for('react.lazy'),
    dh = Symbol.for('react.offscreen'),
    tc = Symbol.iterator;
function hr(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = (tc && e[tc]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var te = Object.assign,
    xo;
function Cr(e) {
    if (xo === void 0)
        try {
            throw Error();
        } catch (n) {
            var t = n.stack.trim().match(/\n( *(at )?)/);
            xo = (t && t[1]) || '';
        }
    return (
        `
` +
        xo +
        e
    );
}
var wo = !1;
function So(e, t) {
    if (!e || wo) return '';
    wo = !0;
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
        ((wo = !1), (Error.prepareStackTrace = n));
    }
    return (e = e ? e.displayName || e.name : '') ? Cr(e) : '';
}
function Ry(e) {
    switch (e.tag) {
        case 5:
            return Cr(e.type);
        case 16:
            return Cr('Lazy');
        case 13:
            return Cr('Suspense');
        case 19:
            return Cr('SuspenseList');
        case 0:
        case 2:
        case 15:
            return ((e = So(e.type, !1)), e);
        case 11:
            return ((e = So(e.type.render, !1)), e);
        case 1:
            return ((e = So(e.type, !0)), e);
        default:
            return '';
    }
}
function ha(e) {
    if (e == null) return null;
    if (typeof e == 'function') return e.displayName || e.name || null;
    if (typeof e == 'string') return e;
    switch (e) {
        case An:
            return 'Fragment';
        case Rn:
            return 'Portal';
        case ca:
            return 'Profiler';
        case Al:
            return 'StrictMode';
        case fa:
            return 'Suspense';
        case da:
            return 'SuspenseList';
    }
    if (typeof e == 'object')
        switch (e.$$typeof) {
            case fh:
                return (e.displayName || 'Context') + '.Consumer';
            case ch:
                return (e._context.displayName || 'Context') + '.Provider';
            case Ol:
                var t = e.render;
                return (
                    (e = e.displayName),
                    e ||
                        ((e = t.displayName || t.name || ''),
                        (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
                    e
                );
            case Dl:
                return ((t = e.displayName || null), t !== null ? t : ha(e.type) || 'Memo');
            case Dt:
                ((t = e._payload), (e = e._init));
                try {
                    return ha(e(t));
                } catch {}
        }
    return null;
}
function Ay(e) {
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
            return ha(t);
        case 8:
            return t === Al ? 'StrictMode' : 'Mode';
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
function Kt(e) {
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
function hh(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio');
}
function Oy(e) {
    var t = hh(e) ? 'checked' : 'value',
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
function Oi(e) {
    e._valueTracker || (e._valueTracker = Oy(e));
}
function ph(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var n = t.getValue(),
        r = '';
    return (
        e && (r = hh(e) ? (e.checked ? 'true' : 'false') : e.value),
        (e = r),
        e !== n ? (t.setValue(e), !0) : !1
    );
}
function hs(e) {
    if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
    try {
        return e.activeElement || e.body;
    } catch {
        return e.body;
    }
}
function pa(e, t) {
    var n = t.checked;
    return te({}, t, {
        defaultChecked: void 0,
        defaultValue: void 0,
        value: void 0,
        checked: n ?? e._wrapperState.initialChecked,
    });
}
function nc(e, t) {
    var n = t.defaultValue == null ? '' : t.defaultValue,
        r = t.checked != null ? t.checked : t.defaultChecked;
    ((n = Kt(t.value != null ? t.value : n)),
        (e._wrapperState = {
            initialChecked: r,
            initialValue: n,
            controlled:
                t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
        }));
}
function mh(e, t) {
    ((t = t.checked), t != null && Rl(e, 'checked', t, !1));
}
function ma(e, t) {
    mh(e, t);
    var n = Kt(t.value),
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
        ? ga(e, t.type, n)
        : t.hasOwnProperty('defaultValue') && ga(e, t.type, Kt(t.defaultValue)),
        t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked));
}
function rc(e, t, n) {
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
function ga(e, t, n) {
    (t !== 'number' || hs(e.ownerDocument) !== e) &&
        (n == null
            ? (e.defaultValue = '' + e._wrapperState.initialValue)
            : e.defaultValue !== '' + n && (e.defaultValue = '' + n));
}
var Tr = Array.isArray;
function Kn(e, t, n, r) {
    if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t['$' + n[i]] = !0;
        for (n = 0; n < e.length; n++)
            ((i = t.hasOwnProperty('$' + e[n].value)),
                e[n].selected !== i && (e[n].selected = i),
                i && r && (e[n].defaultSelected = !0));
    } else {
        for (n = '' + Kt(n), t = null, i = 0; i < e.length; i++) {
            if (e[i].value === n) {
                ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
                return;
            }
            t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
    }
}
function ya(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(T(91));
    return te({}, t, {
        value: void 0,
        defaultValue: void 0,
        children: '' + e._wrapperState.initialValue,
    });
}
function ic(e, t) {
    var n = t.value;
    if (n == null) {
        if (((n = t.children), (t = t.defaultValue), n != null)) {
            if (t != null) throw Error(T(92));
            if (Tr(n)) {
                if (1 < n.length) throw Error(T(93));
                n = n[0];
            }
            t = n;
        }
        (t == null && (t = ''), (n = t));
    }
    e._wrapperState = { initialValue: Kt(n) };
}
function gh(e, t) {
    var n = Kt(t.value),
        r = Kt(t.defaultValue);
    (n != null &&
        ((n = '' + n),
        n !== e.value && (e.value = n),
        t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
        r != null && (e.defaultValue = '' + r));
}
function sc(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
}
function yh(e) {
    switch (e) {
        case 'svg':
            return 'http://www.w3.org/2000/svg';
        case 'math':
            return 'http://www.w3.org/1998/Math/MathML';
        default:
            return 'http://www.w3.org/1999/xhtml';
    }
}
function va(e, t) {
    return e == null || e === 'http://www.w3.org/1999/xhtml'
        ? yh(t)
        : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
          ? 'http://www.w3.org/1999/xhtml'
          : e;
}
var Di,
    vh = (function (e) {
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
                Di = Di || document.createElement('div'),
                    Di.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>',
                    t = Di.firstChild;
                e.firstChild;
            )
                e.removeChild(e.firstChild);
            for (; t.firstChild; ) e.appendChild(t.firstChild);
        }
    });
function Yr(e, t) {
    if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
            n.nodeValue = t;
            return;
        }
    }
    e.textContent = t;
}
var Dr = {
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
    Dy = ['Webkit', 'ms', 'Moz', 'O'];
Object.keys(Dr).forEach(function (e) {
    Dy.forEach(function (t) {
        ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Dr[t] = Dr[e]));
    });
});
function xh(e, t, n) {
    return t == null || typeof t == 'boolean' || t === ''
        ? ''
        : n || typeof t != 'number' || t === 0 || (Dr.hasOwnProperty(e) && Dr[e])
          ? ('' + t).trim()
          : t + 'px';
}
function wh(e, t) {
    e = e.style;
    for (var n in t)
        if (t.hasOwnProperty(n)) {
            var r = n.indexOf('--') === 0,
                i = xh(n, t[n], r);
            (n === 'float' && (n = 'cssFloat'), r ? e.setProperty(n, i) : (e[n] = i));
        }
}
var Ny = te(
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
function xa(e, t) {
    if (t) {
        if (Ny[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
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
function wa(e, t) {
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
var Sa = null;
function Nl(e) {
    return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    );
}
var ka = null,
    bn = null,
    Gn = null;
function oc(e) {
    if ((e = xi(e))) {
        if (typeof ka != 'function') throw Error(T(280));
        var t = e.stateNode;
        t && ((t = Js(t)), ka(e.stateNode, e.type, t));
    }
}
function Sh(e) {
    bn ? (Gn ? Gn.push(e) : (Gn = [e])) : (bn = e);
}
function kh() {
    if (bn) {
        var e = bn,
            t = Gn;
        if (((Gn = bn = null), oc(e), t)) for (e = 0; e < t.length; e++) oc(t[e]);
    }
}
function Ph(e, t) {
    return e(t);
}
function Ch() {}
var ko = !1;
function Th(e, t, n) {
    if (ko) return e(t, n);
    ko = !0;
    try {
        return Ph(e, t, n);
    } finally {
        ((ko = !1), (bn !== null || Gn !== null) && (Ch(), kh()));
    }
}
function Xr(e, t) {
    var n = e.stateNode;
    if (n === null) return null;
    var r = Js(n);
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
var Pa = !1;
if (Pt)
    try {
        var pr = {};
        (Object.defineProperty(pr, 'passive', {
            get: function () {
                Pa = !0;
            },
        }),
            window.addEventListener('test', pr, pr),
            window.removeEventListener('test', pr, pr));
    } catch {
        Pa = !1;
    }
function My(e, t, n, r, i, s, o, a, l) {
    var u = Array.prototype.slice.call(arguments, 3);
    try {
        t.apply(n, u);
    } catch (c) {
        this.onError(c);
    }
}
var Nr = !1,
    ps = null,
    ms = !1,
    Ca = null,
    Vy = {
        onError: function (e) {
            ((Nr = !0), (ps = e));
        },
    };
function _y(e, t, n, r, i, s, o, a, l) {
    ((Nr = !1), (ps = null), My.apply(Vy, arguments));
}
function jy(e, t, n, r, i, s, o, a, l) {
    if ((_y.apply(this, arguments), Nr)) {
        if (Nr) {
            var u = ps;
            ((Nr = !1), (ps = null));
        } else throw Error(T(198));
        ms || ((ms = !0), (Ca = u));
    }
}
function Sn(e) {
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
function Eh(e) {
    if (e.tag === 13) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
            return t.dehydrated;
    }
    return null;
}
function ac(e) {
    if (Sn(e) !== e) throw Error(T(188));
}
function Fy(e) {
    var t = e.alternate;
    if (!t) {
        if (((t = Sn(e)), t === null)) throw Error(T(188));
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
                if (s === n) return (ac(i), e);
                if (s === r) return (ac(i), t);
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
function Lh(e) {
    return ((e = Fy(e)), e !== null ? Rh(e) : null);
}
function Rh(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
        var t = Rh(e);
        if (t !== null) return t;
        e = e.sibling;
    }
    return null;
}
var Ah = je.unstable_scheduleCallback,
    lc = je.unstable_cancelCallback,
    Iy = je.unstable_shouldYield,
    zy = je.unstable_requestPaint,
    se = je.unstable_now,
    By = je.unstable_getCurrentPriorityLevel,
    Ml = je.unstable_ImmediatePriority,
    Oh = je.unstable_UserBlockingPriority,
    gs = je.unstable_NormalPriority,
    $y = je.unstable_LowPriority,
    Dh = je.unstable_IdlePriority,
    Qs = null,
    ft = null;
function Uy(e) {
    if (ft && typeof ft.onCommitFiberRoot == 'function')
        try {
            ft.onCommitFiberRoot(Qs, e, void 0, (e.current.flags & 128) === 128);
        } catch {}
}
var et = Math.clz32 ? Math.clz32 : Ky,
    Hy = Math.log,
    Wy = Math.LN2;
function Ky(e) {
    return ((e >>>= 0), e === 0 ? 32 : (31 - ((Hy(e) / Wy) | 0)) | 0);
}
var Ni = 64,
    Mi = 4194304;
function Er(e) {
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
function ys(e, t) {
    var n = e.pendingLanes;
    if (n === 0) return 0;
    var r = 0,
        i = e.suspendedLanes,
        s = e.pingedLanes,
        o = n & 268435455;
    if (o !== 0) {
        var a = o & ~i;
        a !== 0 ? (r = Er(a)) : ((s &= o), s !== 0 && (r = Er(s)));
    } else ((o = n & ~i), o !== 0 ? (r = Er(o)) : s !== 0 && (r = Er(s)));
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
            ((n = 31 - et(t)), (i = 1 << n), (r |= e[n]), (t &= ~i));
    return r;
}
function by(e, t) {
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
function Gy(e, t) {
    for (
        var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, s = e.pendingLanes;
        0 < s;
    ) {
        var o = 31 - et(s),
            a = 1 << o,
            l = i[o];
        (l === -1 ? (!(a & n) || a & r) && (i[o] = by(a, t)) : l <= t && (e.expiredLanes |= a),
            (s &= ~a));
    }
}
function Ta(e) {
    return ((e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0);
}
function Nh() {
    var e = Ni;
    return ((Ni <<= 1), !(Ni & 4194240) && (Ni = 64), e);
}
function Po(e) {
    for (var t = [], n = 0; 31 > n; n++) t.push(e);
    return t;
}
function yi(e, t, n) {
    ((e.pendingLanes |= t),
        t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
        (e = e.eventTimes),
        (t = 31 - et(t)),
        (e[t] = n));
}
function Qy(e, t) {
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
        var i = 31 - et(n),
            s = 1 << i;
        ((t[i] = 0), (r[i] = -1), (e[i] = -1), (n &= ~s));
    }
}
function Vl(e, t) {
    var n = (e.entangledLanes |= t);
    for (e = e.entanglements; n; ) {
        var r = 31 - et(n),
            i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
    }
}
var W = 0;
function Mh(e) {
    return ((e &= -e), 1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1);
}
var Vh,
    _l,
    _h,
    jh,
    Fh,
    Ea = !1,
    Vi = [],
    Ft = null,
    It = null,
    zt = null,
    Zr = new Map(),
    Jr = new Map(),
    Mt = [],
    Yy =
        'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
            ' ',
        );
function uc(e, t) {
    switch (e) {
        case 'focusin':
        case 'focusout':
            Ft = null;
            break;
        case 'dragenter':
        case 'dragleave':
            It = null;
            break;
        case 'mouseover':
        case 'mouseout':
            zt = null;
            break;
        case 'pointerover':
        case 'pointerout':
            Zr.delete(t.pointerId);
            break;
        case 'gotpointercapture':
        case 'lostpointercapture':
            Jr.delete(t.pointerId);
    }
}
function mr(e, t, n, r, i, s) {
    return e === null || e.nativeEvent !== s
        ? ((e = {
              blockedOn: t,
              domEventName: n,
              eventSystemFlags: r,
              nativeEvent: s,
              targetContainers: [i],
          }),
          t !== null && ((t = xi(t)), t !== null && _l(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
}
function Xy(e, t, n, r, i) {
    switch (t) {
        case 'focusin':
            return ((Ft = mr(Ft, e, t, n, r, i)), !0);
        case 'dragenter':
            return ((It = mr(It, e, t, n, r, i)), !0);
        case 'mouseover':
            return ((zt = mr(zt, e, t, n, r, i)), !0);
        case 'pointerover':
            var s = i.pointerId;
            return (Zr.set(s, mr(Zr.get(s) || null, e, t, n, r, i)), !0);
        case 'gotpointercapture':
            return ((s = i.pointerId), Jr.set(s, mr(Jr.get(s) || null, e, t, n, r, i)), !0);
    }
    return !1;
}
function Ih(e) {
    var t = sn(e.target);
    if (t !== null) {
        var n = Sn(t);
        if (n !== null) {
            if (((t = n.tag), t === 13)) {
                if (((t = Eh(n)), t !== null)) {
                    ((e.blockedOn = t),
                        Fh(e.priority, function () {
                            _h(n);
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
function Ji(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
        var n = La(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
        if (n === null) {
            n = e.nativeEvent;
            var r = new n.constructor(n.type, n);
            ((Sa = r), n.target.dispatchEvent(r), (Sa = null));
        } else return ((t = xi(n)), t !== null && _l(t), (e.blockedOn = n), !1);
        t.shift();
    }
    return !0;
}
function cc(e, t, n) {
    Ji(e) && n.delete(t);
}
function Zy() {
    ((Ea = !1),
        Ft !== null && Ji(Ft) && (Ft = null),
        It !== null && Ji(It) && (It = null),
        zt !== null && Ji(zt) && (zt = null),
        Zr.forEach(cc),
        Jr.forEach(cc));
}
function gr(e, t) {
    e.blockedOn === t &&
        ((e.blockedOn = null),
        Ea || ((Ea = !0), je.unstable_scheduleCallback(je.unstable_NormalPriority, Zy)));
}
function qr(e) {
    function t(i) {
        return gr(i, e);
    }
    if (0 < Vi.length) {
        gr(Vi[0], e);
        for (var n = 1; n < Vi.length; n++) {
            var r = Vi[n];
            r.blockedOn === e && (r.blockedOn = null);
        }
    }
    for (
        Ft !== null && gr(Ft, e),
            It !== null && gr(It, e),
            zt !== null && gr(zt, e),
            Zr.forEach(t),
            Jr.forEach(t),
            n = 0;
        n < Mt.length;
        n++
    )
        ((r = Mt[n]), r.blockedOn === e && (r.blockedOn = null));
    for (; 0 < Mt.length && ((n = Mt[0]), n.blockedOn === null); )
        (Ih(n), n.blockedOn === null && Mt.shift());
}
var Qn = Lt.ReactCurrentBatchConfig,
    vs = !0;
function Jy(e, t, n, r) {
    var i = W,
        s = Qn.transition;
    Qn.transition = null;
    try {
        ((W = 1), jl(e, t, n, r));
    } finally {
        ((W = i), (Qn.transition = s));
    }
}
function qy(e, t, n, r) {
    var i = W,
        s = Qn.transition;
    Qn.transition = null;
    try {
        ((W = 4), jl(e, t, n, r));
    } finally {
        ((W = i), (Qn.transition = s));
    }
}
function jl(e, t, n, r) {
    if (vs) {
        var i = La(e, t, n, r);
        if (i === null) (Mo(e, t, r, xs, n), uc(e, r));
        else if (Xy(i, e, t, n, r)) r.stopPropagation();
        else if ((uc(e, r), t & 4 && -1 < Yy.indexOf(e))) {
            for (; i !== null; ) {
                var s = xi(i);
                if (
                    (s !== null && Vh(s),
                    (s = La(e, t, n, r)),
                    s === null && Mo(e, t, r, xs, n),
                    s === i)
                )
                    break;
                i = s;
            }
            i !== null && r.stopPropagation();
        } else Mo(e, t, r, null, n);
    }
}
var xs = null;
function La(e, t, n, r) {
    if (((xs = null), (e = Nl(r)), (e = sn(e)), e !== null))
        if (((t = Sn(e)), t === null)) e = null;
        else if (((n = t.tag), n === 13)) {
            if (((e = Eh(t)), e !== null)) return e;
            e = null;
        } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
                return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
        } else t !== e && (e = null);
    return ((xs = e), null);
}
function zh(e) {
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
            switch (By()) {
                case Ml:
                    return 1;
                case Oh:
                    return 4;
                case gs:
                case $y:
                    return 16;
                case Dh:
                    return 536870912;
                default:
                    return 16;
            }
        default:
            return 16;
    }
}
var _t = null,
    Fl = null,
    qi = null;
function Bh() {
    if (qi) return qi;
    var e,
        t = Fl,
        n = t.length,
        r,
        i = 'value' in _t ? _t.value : _t.textContent,
        s = i.length;
    for (e = 0; e < n && t[e] === i[e]; e++);
    var o = n - e;
    for (r = 1; r <= o && t[n - r] === i[s - r]; r++);
    return (qi = i.slice(e, 1 < r ? 1 - r : void 0));
}
function es(e) {
    var t = e.keyCode;
    return (
        'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
    );
}
function _i() {
    return !0;
}
function fc() {
    return !1;
}
function ze(e) {
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
                ? _i
                : fc),
            (this.isPropagationStopped = fc),
            this
        );
    }
    return (
        te(t.prototype, {
            preventDefault: function () {
                this.defaultPrevented = !0;
                var n = this.nativeEvent;
                n &&
                    (n.preventDefault
                        ? n.preventDefault()
                        : typeof n.returnValue != 'unknown' && (n.returnValue = !1),
                    (this.isDefaultPrevented = _i));
            },
            stopPropagation: function () {
                var n = this.nativeEvent;
                n &&
                    (n.stopPropagation
                        ? n.stopPropagation()
                        : typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
                    (this.isPropagationStopped = _i));
            },
            persist: function () {},
            isPersistent: _i,
        }),
        t
    );
}
var lr = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
            return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
    },
    Il = ze(lr),
    vi = te({}, lr, { view: 0, detail: 0 }),
    ev = ze(vi),
    Co,
    To,
    yr,
    Ys = te({}, vi, {
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
        getModifierState: zl,
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
                : (e !== yr &&
                      (yr && e.type === 'mousemove'
                          ? ((Co = e.screenX - yr.screenX), (To = e.screenY - yr.screenY))
                          : (To = Co = 0),
                      (yr = e)),
                  Co);
        },
        movementY: function (e) {
            return 'movementY' in e ? e.movementY : To;
        },
    }),
    dc = ze(Ys),
    tv = te({}, Ys, { dataTransfer: 0 }),
    nv = ze(tv),
    rv = te({}, vi, { relatedTarget: 0 }),
    Eo = ze(rv),
    iv = te({}, lr, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    sv = ze(iv),
    ov = te({}, lr, {
        clipboardData: function (e) {
            return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
        },
    }),
    av = ze(ov),
    lv = te({}, lr, { data: 0 }),
    hc = ze(lv),
    uv = {
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
    cv = {
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
    fv = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
function dv(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = fv[e]) ? !!t[e] : !1;
}
function zl() {
    return dv;
}
var hv = te({}, vi, {
        key: function (e) {
            if (e.key) {
                var t = uv[e.key] || e.key;
                if (t !== 'Unidentified') return t;
            }
            return e.type === 'keypress'
                ? ((e = es(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
                : e.type === 'keydown' || e.type === 'keyup'
                  ? cv[e.keyCode] || 'Unidentified'
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
        getModifierState: zl,
        charCode: function (e) {
            return e.type === 'keypress' ? es(e) : 0;
        },
        keyCode: function (e) {
            return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
        },
        which: function (e) {
            return e.type === 'keypress'
                ? es(e)
                : e.type === 'keydown' || e.type === 'keyup'
                  ? e.keyCode
                  : 0;
        },
    }),
    pv = ze(hv),
    mv = te({}, Ys, {
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
    pc = ze(mv),
    gv = te({}, vi, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: zl,
    }),
    yv = ze(gv),
    vv = te({}, lr, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    xv = ze(vv),
    wv = te({}, Ys, {
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
    Sv = ze(wv),
    kv = [9, 13, 27, 32],
    Bl = Pt && 'CompositionEvent' in window,
    Mr = null;
Pt && 'documentMode' in document && (Mr = document.documentMode);
var Pv = Pt && 'TextEvent' in window && !Mr,
    $h = Pt && (!Bl || (Mr && 8 < Mr && 11 >= Mr)),
    mc = ' ',
    gc = !1;
function Uh(e, t) {
    switch (e) {
        case 'keyup':
            return kv.indexOf(t.keyCode) !== -1;
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
function Hh(e) {
    return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null);
}
var On = !1;
function Cv(e, t) {
    switch (e) {
        case 'compositionend':
            return Hh(t);
        case 'keypress':
            return t.which !== 32 ? null : ((gc = !0), mc);
        case 'textInput':
            return ((e = t.data), e === mc && gc ? null : e);
        default:
            return null;
    }
}
function Tv(e, t) {
    if (On)
        return e === 'compositionend' || (!Bl && Uh(e, t))
            ? ((e = Bh()), (qi = Fl = _t = null), (On = !1), e)
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
            return $h && t.locale !== 'ko' ? null : t.data;
        default:
            return null;
    }
}
var Ev = {
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
function yc(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === 'input' ? !!Ev[e.type] : t === 'textarea';
}
function Wh(e, t, n, r) {
    (Sh(r),
        (t = ws(t, 'onChange')),
        0 < t.length &&
            ((n = new Il('onChange', 'change', null, n, r)), e.push({ event: n, listeners: t })));
}
var Vr = null,
    ei = null;
function Lv(e) {
    tp(e, 0);
}
function Xs(e) {
    var t = Mn(e);
    if (ph(t)) return e;
}
function Rv(e, t) {
    if (e === 'change') return t;
}
var Kh = !1;
if (Pt) {
    var Lo;
    if (Pt) {
        var Ro = 'oninput' in document;
        if (!Ro) {
            var vc = document.createElement('div');
            (vc.setAttribute('oninput', 'return;'), (Ro = typeof vc.oninput == 'function'));
        }
        Lo = Ro;
    } else Lo = !1;
    Kh = Lo && (!document.documentMode || 9 < document.documentMode);
}
function xc() {
    Vr && (Vr.detachEvent('onpropertychange', bh), (ei = Vr = null));
}
function bh(e) {
    if (e.propertyName === 'value' && Xs(ei)) {
        var t = [];
        (Wh(t, ei, e, Nl(e)), Th(Lv, t));
    }
}
function Av(e, t, n) {
    e === 'focusin'
        ? (xc(), (Vr = t), (ei = n), Vr.attachEvent('onpropertychange', bh))
        : e === 'focusout' && xc();
}
function Ov(e) {
    if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return Xs(ei);
}
function Dv(e, t) {
    if (e === 'click') return Xs(t);
}
function Nv(e, t) {
    if (e === 'input' || e === 'change') return Xs(t);
}
function Mv(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var nt = typeof Object.is == 'function' ? Object.is : Mv;
function ti(e, t) {
    if (nt(e, t)) return !0;
    if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
    var n = Object.keys(e),
        r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!ua.call(t, i) || !nt(e[i], t[i])) return !1;
    }
    return !0;
}
function wc(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
}
function Sc(e, t) {
    var n = wc(e);
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
        n = wc(n);
    }
}
function Gh(e, t) {
    return e && t
        ? e === t
            ? !0
            : e && e.nodeType === 3
              ? !1
              : t && t.nodeType === 3
                ? Gh(e, t.parentNode)
                : 'contains' in e
                  ? e.contains(t)
                  : e.compareDocumentPosition
                    ? !!(e.compareDocumentPosition(t) & 16)
                    : !1
        : !1;
}
function Qh() {
    for (var e = window, t = hs(); t instanceof e.HTMLIFrameElement; ) {
        try {
            var n = typeof t.contentWindow.location.href == 'string';
        } catch {
            n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = hs(e.document);
    }
    return t;
}
function $l(e) {
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
function Vv(e) {
    var t = Qh(),
        n = e.focusedElem,
        r = e.selectionRange;
    if (t !== n && n && n.ownerDocument && Gh(n.ownerDocument.documentElement, n)) {
        if (r !== null && $l(n)) {
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
                    (i = Sc(n, s)));
                var o = Sc(n, r);
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
var _v = Pt && 'documentMode' in document && 11 >= document.documentMode,
    Dn = null,
    Ra = null,
    _r = null,
    Aa = !1;
function kc(e, t, n) {
    var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    Aa ||
        Dn == null ||
        Dn !== hs(r) ||
        ((r = Dn),
        'selectionStart' in r && $l(r)
            ? (r = { start: r.selectionStart, end: r.selectionEnd })
            : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
              (r = {
                  anchorNode: r.anchorNode,
                  anchorOffset: r.anchorOffset,
                  focusNode: r.focusNode,
                  focusOffset: r.focusOffset,
              })),
        (_r && ti(_r, r)) ||
            ((_r = r),
            (r = ws(Ra, 'onSelect')),
            0 < r.length &&
                ((t = new Il('onSelect', 'select', null, t, n)),
                e.push({ event: t, listeners: r }),
                (t.target = Dn))));
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
var Nn = {
        animationend: ji('Animation', 'AnimationEnd'),
        animationiteration: ji('Animation', 'AnimationIteration'),
        animationstart: ji('Animation', 'AnimationStart'),
        transitionend: ji('Transition', 'TransitionEnd'),
    },
    Ao = {},
    Yh = {};
Pt &&
    ((Yh = document.createElement('div').style),
    'AnimationEvent' in window ||
        (delete Nn.animationend.animation,
        delete Nn.animationiteration.animation,
        delete Nn.animationstart.animation),
    'TransitionEvent' in window || delete Nn.transitionend.transition);
function Zs(e) {
    if (Ao[e]) return Ao[e];
    if (!Nn[e]) return e;
    var t = Nn[e],
        n;
    for (n in t) if (t.hasOwnProperty(n) && n in Yh) return (Ao[e] = t[n]);
    return e;
}
var Xh = Zs('animationend'),
    Zh = Zs('animationiteration'),
    Jh = Zs('animationstart'),
    qh = Zs('transitionend'),
    ep = new Map(),
    Pc =
        'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
            ' ',
        );
function Qt(e, t) {
    (ep.set(e, t), wn(t, [e]));
}
for (var Oo = 0; Oo < Pc.length; Oo++) {
    var Do = Pc[Oo],
        jv = Do.toLowerCase(),
        Fv = Do[0].toUpperCase() + Do.slice(1);
    Qt(jv, 'on' + Fv);
}
Qt(Xh, 'onAnimationEnd');
Qt(Zh, 'onAnimationIteration');
Qt(Jh, 'onAnimationStart');
Qt('dblclick', 'onDoubleClick');
Qt('focusin', 'onFocus');
Qt('focusout', 'onBlur');
Qt(qh, 'onTransitionEnd');
Zn('onMouseEnter', ['mouseout', 'mouseover']);
Zn('onMouseLeave', ['mouseout', 'mouseover']);
Zn('onPointerEnter', ['pointerout', 'pointerover']);
Zn('onPointerLeave', ['pointerout', 'pointerover']);
wn('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '));
wn(
    'onSelect',
    'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(
        ' ',
    ),
);
wn('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']);
wn('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '));
wn('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '));
wn('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '));
var Lr =
        'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
            ' ',
        ),
    Iv = new Set('cancel close invalid load scroll toggle'.split(' ').concat(Lr));
function Cc(e, t, n) {
    var r = e.type || 'unknown-event';
    ((e.currentTarget = n), jy(r, t, void 0, e), (e.currentTarget = null));
}
function tp(e, t) {
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
                    (Cc(i, a, u), (s = l));
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
                    (Cc(i, a, u), (s = l));
                }
        }
    }
    if (ms) throw ((e = Ca), (ms = !1), (Ca = null), e);
}
function G(e, t) {
    var n = t[Va];
    n === void 0 && (n = t[Va] = new Set());
    var r = e + '__bubble';
    n.has(r) || (np(t, e, 2, !1), n.add(r));
}
function No(e, t, n) {
    var r = 0;
    (t && (r |= 4), np(n, e, r, t));
}
var Fi = '_reactListening' + Math.random().toString(36).slice(2);
function ni(e) {
    if (!e[Fi]) {
        ((e[Fi] = !0),
            uh.forEach(function (n) {
                n !== 'selectionchange' && (Iv.has(n) || No(n, !1, e), No(n, !0, e));
            }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[Fi] || ((t[Fi] = !0), No('selectionchange', !1, t));
    }
}
function np(e, t, n, r) {
    switch (zh(t)) {
        case 1:
            var i = Jy;
            break;
        case 4:
            i = qy;
            break;
        default:
            i = jl;
    }
    ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !Pa || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (i = !0),
        r
            ? i !== void 0
                ? e.addEventListener(t, n, { capture: !0, passive: i })
                : e.addEventListener(t, n, !0)
            : i !== void 0
              ? e.addEventListener(t, n, { passive: i })
              : e.addEventListener(t, n, !1));
}
function Mo(e, t, n, r, i) {
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
                    if (((o = sn(a)), o === null)) return;
                    if (((l = o.tag), l === 5 || l === 6)) {
                        r = s = o;
                        continue e;
                    }
                    a = a.parentNode;
                }
            }
            r = r.return;
        }
    Th(function () {
        var u = s,
            c = Nl(n),
            f = [];
        e: {
            var d = ep.get(e);
            if (d !== void 0) {
                var m = Il,
                    y = e;
                switch (e) {
                    case 'keypress':
                        if (es(n) === 0) break e;
                    case 'keydown':
                    case 'keyup':
                        m = pv;
                        break;
                    case 'focusin':
                        ((y = 'focus'), (m = Eo));
                        break;
                    case 'focusout':
                        ((y = 'blur'), (m = Eo));
                        break;
                    case 'beforeblur':
                    case 'afterblur':
                        m = Eo;
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
                        m = dc;
                        break;
                    case 'drag':
                    case 'dragend':
                    case 'dragenter':
                    case 'dragexit':
                    case 'dragleave':
                    case 'dragover':
                    case 'dragstart':
                    case 'drop':
                        m = nv;
                        break;
                    case 'touchcancel':
                    case 'touchend':
                    case 'touchmove':
                    case 'touchstart':
                        m = yv;
                        break;
                    case Xh:
                    case Zh:
                    case Jh:
                        m = sv;
                        break;
                    case qh:
                        m = xv;
                        break;
                    case 'scroll':
                        m = ev;
                        break;
                    case 'wheel':
                        m = Sv;
                        break;
                    case 'copy':
                    case 'cut':
                    case 'paste':
                        m = av;
                        break;
                    case 'gotpointercapture':
                    case 'lostpointercapture':
                    case 'pointercancel':
                    case 'pointerdown':
                    case 'pointermove':
                    case 'pointerout':
                    case 'pointerover':
                    case 'pointerup':
                        m = pc;
                }
                var v = (t & 4) !== 0,
                    S = !v && e === 'scroll',
                    p = v ? (d !== null ? d + 'Capture' : null) : d;
                v = [];
                for (var h = u, g; h !== null; ) {
                    g = h;
                    var x = g.stateNode;
                    if (
                        (g.tag === 5 &&
                            x !== null &&
                            ((g = x),
                            p !== null && ((x = Xr(h, p)), x != null && v.push(ri(h, x, g)))),
                        S)
                    )
                        break;
                    h = h.return;
                }
                0 < v.length && ((d = new m(d, y, null, n, c)), f.push({ event: d, listeners: v }));
            }
        }
        if (!(t & 7)) {
            e: {
                if (
                    ((d = e === 'mouseover' || e === 'pointerover'),
                    (m = e === 'mouseout' || e === 'pointerout'),
                    d && n !== Sa && (y = n.relatedTarget || n.fromElement) && (sn(y) || y[Ct]))
                )
                    break e;
                if (
                    (m || d) &&
                    ((d =
                        c.window === c
                            ? c
                            : (d = c.ownerDocument)
                              ? d.defaultView || d.parentWindow
                              : window),
                    m
                        ? ((y = n.relatedTarget || n.toElement),
                          (m = u),
                          (y = y ? sn(y) : null),
                          y !== null &&
                              ((S = Sn(y)), y !== S || (y.tag !== 5 && y.tag !== 6)) &&
                              (y = null))
                        : ((m = null), (y = u)),
                    m !== y)
                ) {
                    if (
                        ((v = dc),
                        (x = 'onMouseLeave'),
                        (p = 'onMouseEnter'),
                        (h = 'mouse'),
                        (e === 'pointerout' || e === 'pointerover') &&
                            ((v = pc),
                            (x = 'onPointerLeave'),
                            (p = 'onPointerEnter'),
                            (h = 'pointer')),
                        (S = m == null ? d : Mn(m)),
                        (g = y == null ? d : Mn(y)),
                        (d = new v(x, h + 'leave', m, n, c)),
                        (d.target = S),
                        (d.relatedTarget = g),
                        (x = null),
                        sn(c) === u &&
                            ((v = new v(p, h + 'enter', y, n, c)),
                            (v.target = g),
                            (v.relatedTarget = S),
                            (x = v)),
                        (S = x),
                        m && y)
                    )
                        t: {
                            for (v = m, p = y, h = 0, g = v; g; g = Cn(g)) h++;
                            for (g = 0, x = p; x; x = Cn(x)) g++;
                            for (; 0 < h - g; ) ((v = Cn(v)), h--);
                            for (; 0 < g - h; ) ((p = Cn(p)), g--);
                            for (; h--; ) {
                                if (v === p || (p !== null && v === p.alternate)) break t;
                                ((v = Cn(v)), (p = Cn(p)));
                            }
                            v = null;
                        }
                    else v = null;
                    (m !== null && Tc(f, d, m, v, !1),
                        y !== null && S !== null && Tc(f, S, y, v, !0));
                }
            }
            e: {
                if (
                    ((d = u ? Mn(u) : window),
                    (m = d.nodeName && d.nodeName.toLowerCase()),
                    m === 'select' || (m === 'input' && d.type === 'file'))
                )
                    var w = Rv;
                else if (yc(d))
                    if (Kh) w = Nv;
                    else {
                        w = Ov;
                        var P = Av;
                    }
                else
                    (m = d.nodeName) &&
                        m.toLowerCase() === 'input' &&
                        (d.type === 'checkbox' || d.type === 'radio') &&
                        (w = Dv);
                if (w && (w = w(e, u))) {
                    Wh(f, w, n, c);
                    break e;
                }
                (P && P(e, d, u),
                    e === 'focusout' &&
                        (P = d._wrapperState) &&
                        P.controlled &&
                        d.type === 'number' &&
                        ga(d, 'number', d.value));
            }
            switch (((P = u ? Mn(u) : window), e)) {
                case 'focusin':
                    (yc(P) || P.contentEditable === 'true') && ((Dn = P), (Ra = u), (_r = null));
                    break;
                case 'focusout':
                    _r = Ra = Dn = null;
                    break;
                case 'mousedown':
                    Aa = !0;
                    break;
                case 'contextmenu':
                case 'mouseup':
                case 'dragend':
                    ((Aa = !1), kc(f, n, c));
                    break;
                case 'selectionchange':
                    if (_v) break;
                case 'keydown':
                case 'keyup':
                    kc(f, n, c);
            }
            var E;
            if (Bl)
                e: {
                    switch (e) {
                        case 'compositionstart':
                            var k = 'onCompositionStart';
                            break e;
                        case 'compositionend':
                            k = 'onCompositionEnd';
                            break e;
                        case 'compositionupdate':
                            k = 'onCompositionUpdate';
                            break e;
                    }
                    k = void 0;
                }
            else
                On
                    ? Uh(e, n) && (k = 'onCompositionEnd')
                    : e === 'keydown' && n.keyCode === 229 && (k = 'onCompositionStart');
            (k &&
                ($h &&
                    n.locale !== 'ko' &&
                    (On || k !== 'onCompositionStart'
                        ? k === 'onCompositionEnd' && On && (E = Bh())
                        : ((_t = c), (Fl = 'value' in _t ? _t.value : _t.textContent), (On = !0))),
                (P = ws(u, k)),
                0 < P.length &&
                    ((k = new hc(k, e, null, n, c)),
                    f.push({ event: k, listeners: P }),
                    E ? (k.data = E) : ((E = Hh(n)), E !== null && (k.data = E)))),
                (E = Pv ? Cv(e, n) : Tv(e, n)) &&
                    ((u = ws(u, 'onBeforeInput')),
                    0 < u.length &&
                        ((c = new hc('onBeforeInput', 'beforeinput', null, n, c)),
                        f.push({ event: c, listeners: u }),
                        (c.data = E))));
        }
        tp(f, t);
    });
}
function ri(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
}
function ws(e, t) {
    for (var n = t + 'Capture', r = []; e !== null; ) {
        var i = e,
            s = i.stateNode;
        (i.tag === 5 &&
            s !== null &&
            ((i = s),
            (s = Xr(e, n)),
            s != null && r.unshift(ri(e, s, i)),
            (s = Xr(e, t)),
            s != null && r.push(ri(e, s, i))),
            (e = e.return));
    }
    return r;
}
function Cn(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5);
    return e || null;
}
function Tc(e, t, n, r, i) {
    for (var s = t._reactName, o = []; n !== null && n !== r; ) {
        var a = n,
            l = a.alternate,
            u = a.stateNode;
        if (l !== null && l === r) break;
        (a.tag === 5 &&
            u !== null &&
            ((a = u),
            i
                ? ((l = Xr(n, s)), l != null && o.unshift(ri(n, l, a)))
                : i || ((l = Xr(n, s)), l != null && o.push(ri(n, l, a)))),
            (n = n.return));
    }
    o.length !== 0 && e.push({ event: t, listeners: o });
}
var zv = /\r\n?/g,
    Bv = /\u0000|\uFFFD/g;
function Ec(e) {
    return (typeof e == 'string' ? e : '' + e)
        .replace(
            zv,
            `
`,
        )
        .replace(Bv, '');
}
function Ii(e, t, n) {
    if (((t = Ec(t)), Ec(e) !== t && n)) throw Error(T(425));
}
function Ss() {}
var Oa = null,
    Da = null;
function Na(e, t) {
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
var Ma = typeof setTimeout == 'function' ? setTimeout : void 0,
    $v = typeof clearTimeout == 'function' ? clearTimeout : void 0,
    Lc = typeof Promise == 'function' ? Promise : void 0,
    Uv =
        typeof queueMicrotask == 'function'
            ? queueMicrotask
            : typeof Lc < 'u'
              ? function (e) {
                    return Lc.resolve(null).then(e).catch(Hv);
                }
              : Ma;
function Hv(e) {
    setTimeout(function () {
        throw e;
    });
}
function Vo(e, t) {
    var n = t,
        r = 0;
    do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8))
            if (((n = i.data), n === '/$')) {
                if (r === 0) {
                    (e.removeChild(i), qr(t));
                    return;
                }
                r--;
            } else (n !== '$' && n !== '$?' && n !== '$!') || r++;
        n = i;
    } while (n);
    qr(t);
}
function Bt(e) {
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
function Rc(e) {
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
var ur = Math.random().toString(36).slice(2),
    lt = '__reactFiber$' + ur,
    ii = '__reactProps$' + ur,
    Ct = '__reactContainer$' + ur,
    Va = '__reactEvents$' + ur,
    Wv = '__reactListeners$' + ur,
    Kv = '__reactHandles$' + ur;
function sn(e) {
    var t = e[lt];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
        if ((t = n[Ct] || n[lt])) {
            if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
                for (e = Rc(e); e !== null; ) {
                    if ((n = e[lt])) return n;
                    e = Rc(e);
                }
            return t;
        }
        ((e = n), (n = e.parentNode));
    }
    return null;
}
function xi(e) {
    return (
        (e = e[lt] || e[Ct]),
        !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
    );
}
function Mn(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(T(33));
}
function Js(e) {
    return e[ii] || null;
}
var _a = [],
    Vn = -1;
function Yt(e) {
    return { current: e };
}
function Q(e) {
    0 > Vn || ((e.current = _a[Vn]), (_a[Vn] = null), Vn--);
}
function b(e, t) {
    (Vn++, (_a[Vn] = e.current), (e.current = t));
}
var bt = {},
    Se = Yt(bt),
    Oe = Yt(!1),
    hn = bt;
function Jn(e, t) {
    var n = e.type.contextTypes;
    if (!n) return bt;
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
function ks() {
    (Q(Oe), Q(Se));
}
function Ac(e, t, n) {
    if (Se.current !== bt) throw Error(T(168));
    (b(Se, t), b(Oe, n));
}
function rp(e, t, n) {
    var r = e.stateNode;
    if (((t = t.childContextTypes), typeof r.getChildContext != 'function')) return n;
    r = r.getChildContext();
    for (var i in r) if (!(i in t)) throw Error(T(108, Ay(e) || 'Unknown', i));
    return te({}, n, r);
}
function Ps(e) {
    return (
        (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || bt),
        (hn = Se.current),
        b(Se, e),
        b(Oe, Oe.current),
        !0
    );
}
function Oc(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(T(169));
    (n
        ? ((e = rp(e, t, hn)),
          (r.__reactInternalMemoizedMergedChildContext = e),
          Q(Oe),
          Q(Se),
          b(Se, e))
        : Q(Oe),
        b(Oe, n));
}
var yt = null,
    qs = !1,
    _o = !1;
function ip(e) {
    yt === null ? (yt = [e]) : yt.push(e);
}
function bv(e) {
    ((qs = !0), ip(e));
}
function Xt() {
    if (!_o && yt !== null) {
        _o = !0;
        var e = 0,
            t = W;
        try {
            var n = yt;
            for (W = 1; e < n.length; e++) {
                var r = n[e];
                do r = r(!0);
                while (r !== null);
            }
            ((yt = null), (qs = !1));
        } catch (i) {
            throw (yt !== null && (yt = yt.slice(e + 1)), Ah(Ml, Xt), i);
        } finally {
            ((W = t), (_o = !1));
        }
    }
    return null;
}
var _n = [],
    jn = 0,
    Cs = null,
    Ts = 0,
    Ue = [],
    He = 0,
    pn = null,
    vt = 1,
    xt = '';
function en(e, t) {
    ((_n[jn++] = Ts), (_n[jn++] = Cs), (Cs = e), (Ts = t));
}
function sp(e, t, n) {
    ((Ue[He++] = vt), (Ue[He++] = xt), (Ue[He++] = pn), (pn = e));
    var r = vt;
    e = xt;
    var i = 32 - et(r) - 1;
    ((r &= ~(1 << i)), (n += 1));
    var s = 32 - et(t) + i;
    if (30 < s) {
        var o = i - (i % 5);
        ((s = (r & ((1 << o) - 1)).toString(32)),
            (r >>= o),
            (i -= o),
            (vt = (1 << (32 - et(t) + i)) | (n << i) | r),
            (xt = s + e));
    } else ((vt = (1 << s) | (n << i) | r), (xt = e));
}
function Ul(e) {
    e.return !== null && (en(e, 1), sp(e, 1, 0));
}
function Hl(e) {
    for (; e === Cs; ) ((Cs = _n[--jn]), (_n[jn] = null), (Ts = _n[--jn]), (_n[jn] = null));
    for (; e === pn; )
        ((pn = Ue[--He]),
            (Ue[He] = null),
            (xt = Ue[--He]),
            (Ue[He] = null),
            (vt = Ue[--He]),
            (Ue[He] = null));
}
var _e = null,
    Ve = null,
    Y = !1,
    qe = null;
function op(e, t) {
    var n = Ke(5, null, null, 0);
    ((n.elementType = 'DELETED'),
        (n.stateNode = t),
        (n.return = e),
        (t = e.deletions),
        t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function Dc(e, t) {
    switch (e.tag) {
        case 5:
            var n = e.type;
            return (
                (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
                t !== null ? ((e.stateNode = t), (_e = e), (Ve = Bt(t.firstChild)), !0) : !1
            );
        case 6:
            return (
                (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
                t !== null ? ((e.stateNode = t), (_e = e), (Ve = null), !0) : !1
            );
        case 13:
            return (
                (t = t.nodeType !== 8 ? null : t),
                t !== null
                    ? ((n = pn !== null ? { id: vt, overflow: xt } : null),
                      (e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }),
                      (n = Ke(18, null, null, 0)),
                      (n.stateNode = t),
                      (n.return = e),
                      (e.child = n),
                      (_e = e),
                      (Ve = null),
                      !0)
                    : !1
            );
        default:
            return !1;
    }
}
function ja(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Fa(e) {
    if (Y) {
        var t = Ve;
        if (t) {
            var n = t;
            if (!Dc(e, t)) {
                if (ja(e)) throw Error(T(418));
                t = Bt(n.nextSibling);
                var r = _e;
                t && Dc(e, t) ? op(r, n) : ((e.flags = (e.flags & -4097) | 2), (Y = !1), (_e = e));
            }
        } else {
            if (ja(e)) throw Error(T(418));
            ((e.flags = (e.flags & -4097) | 2), (Y = !1), (_e = e));
        }
    }
}
function Nc(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    _e = e;
}
function zi(e) {
    if (e !== _e) return !1;
    if (!Y) return (Nc(e), (Y = !0), !1);
    var t;
    if (
        ((t = e.tag !== 3) &&
            !(t = e.tag !== 5) &&
            ((t = e.type), (t = t !== 'head' && t !== 'body' && !Na(e.type, e.memoizedProps))),
        t && (t = Ve))
    ) {
        if (ja(e)) throw (ap(), Error(T(418)));
        for (; t; ) (op(e, t), (t = Bt(t.nextSibling)));
    }
    if ((Nc(e), e.tag === 13)) {
        if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
            throw Error(T(317));
        e: {
            for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                    var n = e.data;
                    if (n === '/$') {
                        if (t === 0) {
                            Ve = Bt(e.nextSibling);
                            break e;
                        }
                        t--;
                    } else (n !== '$' && n !== '$!' && n !== '$?') || t++;
                }
                e = e.nextSibling;
            }
            Ve = null;
        }
    } else Ve = _e ? Bt(e.stateNode.nextSibling) : null;
    return !0;
}
function ap() {
    for (var e = Ve; e; ) e = Bt(e.nextSibling);
}
function qn() {
    ((Ve = _e = null), (Y = !1));
}
function Wl(e) {
    qe === null ? (qe = [e]) : qe.push(e);
}
var Gv = Lt.ReactCurrentBatchConfig;
function vr(e, t, n) {
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
function Bi(e, t) {
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
function Mc(e) {
    var t = e._init;
    return t(e._payload);
}
function lp(e) {
    function t(p, h) {
        if (e) {
            var g = p.deletions;
            g === null ? ((p.deletions = [h]), (p.flags |= 16)) : g.push(h);
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
        return ((p = Wt(p, h)), (p.index = 0), (p.sibling = null), p);
    }
    function s(p, h, g) {
        return (
            (p.index = g),
            e
                ? ((g = p.alternate),
                  g !== null
                      ? ((g = g.index), g < h ? ((p.flags |= 2), h) : g)
                      : ((p.flags |= 2), h))
                : ((p.flags |= 1048576), h)
        );
    }
    function o(p) {
        return (e && p.alternate === null && (p.flags |= 2), p);
    }
    function a(p, h, g, x) {
        return h === null || h.tag !== 6
            ? ((h = Uo(g, p.mode, x)), (h.return = p), h)
            : ((h = i(h, g)), (h.return = p), h);
    }
    function l(p, h, g, x) {
        var w = g.type;
        return w === An
            ? c(p, h, g.props.children, x, g.key)
            : h !== null &&
                (h.elementType === w ||
                    (typeof w == 'object' && w !== null && w.$$typeof === Dt && Mc(w) === h.type))
              ? ((x = i(h, g.props)), (x.ref = vr(p, h, g)), (x.return = p), x)
              : ((x = as(g.type, g.key, g.props, null, p.mode, x)),
                (x.ref = vr(p, h, g)),
                (x.return = p),
                x);
    }
    function u(p, h, g, x) {
        return h === null ||
            h.tag !== 4 ||
            h.stateNode.containerInfo !== g.containerInfo ||
            h.stateNode.implementation !== g.implementation
            ? ((h = Ho(g, p.mode, x)), (h.return = p), h)
            : ((h = i(h, g.children || [])), (h.return = p), h);
    }
    function c(p, h, g, x, w) {
        return h === null || h.tag !== 7
            ? ((h = fn(g, p.mode, x, w)), (h.return = p), h)
            : ((h = i(h, g)), (h.return = p), h);
    }
    function f(p, h, g) {
        if ((typeof h == 'string' && h !== '') || typeof h == 'number')
            return ((h = Uo('' + h, p.mode, g)), (h.return = p), h);
        if (typeof h == 'object' && h !== null) {
            switch (h.$$typeof) {
                case Ai:
                    return (
                        (g = as(h.type, h.key, h.props, null, p.mode, g)),
                        (g.ref = vr(p, null, h)),
                        (g.return = p),
                        g
                    );
                case Rn:
                    return ((h = Ho(h, p.mode, g)), (h.return = p), h);
                case Dt:
                    var x = h._init;
                    return f(p, x(h._payload), g);
            }
            if (Tr(h) || hr(h)) return ((h = fn(h, p.mode, g, null)), (h.return = p), h);
            Bi(p, h);
        }
        return null;
    }
    function d(p, h, g, x) {
        var w = h !== null ? h.key : null;
        if ((typeof g == 'string' && g !== '') || typeof g == 'number')
            return w !== null ? null : a(p, h, '' + g, x);
        if (typeof g == 'object' && g !== null) {
            switch (g.$$typeof) {
                case Ai:
                    return g.key === w ? l(p, h, g, x) : null;
                case Rn:
                    return g.key === w ? u(p, h, g, x) : null;
                case Dt:
                    return ((w = g._init), d(p, h, w(g._payload), x));
            }
            if (Tr(g) || hr(g)) return w !== null ? null : c(p, h, g, x, null);
            Bi(p, g);
        }
        return null;
    }
    function m(p, h, g, x, w) {
        if ((typeof x == 'string' && x !== '') || typeof x == 'number')
            return ((p = p.get(g) || null), a(h, p, '' + x, w));
        if (typeof x == 'object' && x !== null) {
            switch (x.$$typeof) {
                case Ai:
                    return ((p = p.get(x.key === null ? g : x.key) || null), l(h, p, x, w));
                case Rn:
                    return ((p = p.get(x.key === null ? g : x.key) || null), u(h, p, x, w));
                case Dt:
                    var P = x._init;
                    return m(p, h, g, P(x._payload), w);
            }
            if (Tr(x) || hr(x)) return ((p = p.get(g) || null), c(h, p, x, w, null));
            Bi(h, x);
        }
        return null;
    }
    function y(p, h, g, x) {
        for (
            var w = null, P = null, E = h, k = (h = 0), D = null;
            E !== null && k < g.length;
            k++
        ) {
            E.index > k ? ((D = E), (E = null)) : (D = E.sibling);
            var R = d(p, E, g[k], x);
            if (R === null) {
                E === null && (E = D);
                break;
            }
            (e && E && R.alternate === null && t(p, E),
                (h = s(R, h, k)),
                P === null ? (w = R) : (P.sibling = R),
                (P = R),
                (E = D));
        }
        if (k === g.length) return (n(p, E), Y && en(p, k), w);
        if (E === null) {
            for (; k < g.length; k++)
                ((E = f(p, g[k], x)),
                    E !== null &&
                        ((h = s(E, h, k)), P === null ? (w = E) : (P.sibling = E), (P = E)));
            return (Y && en(p, k), w);
        }
        for (E = r(p, E); k < g.length; k++)
            ((D = m(E, p, k, g[k], x)),
                D !== null &&
                    (e && D.alternate !== null && E.delete(D.key === null ? k : D.key),
                    (h = s(D, h, k)),
                    P === null ? (w = D) : (P.sibling = D),
                    (P = D)));
        return (
            e &&
                E.forEach(function (X) {
                    return t(p, X);
                }),
            Y && en(p, k),
            w
        );
    }
    function v(p, h, g, x) {
        var w = hr(g);
        if (typeof w != 'function') throw Error(T(150));
        if (((g = w.call(g)), g == null)) throw Error(T(151));
        for (
            var P = (w = null), E = h, k = (h = 0), D = null, R = g.next();
            E !== null && !R.done;
            k++, R = g.next()
        ) {
            E.index > k ? ((D = E), (E = null)) : (D = E.sibling);
            var X = d(p, E, R.value, x);
            if (X === null) {
                E === null && (E = D);
                break;
            }
            (e && E && X.alternate === null && t(p, E),
                (h = s(X, h, k)),
                P === null ? (w = X) : (P.sibling = X),
                (P = X),
                (E = D));
        }
        if (R.done) return (n(p, E), Y && en(p, k), w);
        if (E === null) {
            for (; !R.done; k++, R = g.next())
                ((R = f(p, R.value, x)),
                    R !== null &&
                        ((h = s(R, h, k)), P === null ? (w = R) : (P.sibling = R), (P = R)));
            return (Y && en(p, k), w);
        }
        for (E = r(p, E); !R.done; k++, R = g.next())
            ((R = m(E, p, k, R.value, x)),
                R !== null &&
                    (e && R.alternate !== null && E.delete(R.key === null ? k : R.key),
                    (h = s(R, h, k)),
                    P === null ? (w = R) : (P.sibling = R),
                    (P = R)));
        return (
            e &&
                E.forEach(function (z) {
                    return t(p, z);
                }),
            Y && en(p, k),
            w
        );
    }
    function S(p, h, g, x) {
        if (
            (typeof g == 'object' &&
                g !== null &&
                g.type === An &&
                g.key === null &&
                (g = g.props.children),
            typeof g == 'object' && g !== null)
        ) {
            switch (g.$$typeof) {
                case Ai:
                    e: {
                        for (var w = g.key, P = h; P !== null; ) {
                            if (P.key === w) {
                                if (((w = g.type), w === An)) {
                                    if (P.tag === 7) {
                                        (n(p, P.sibling),
                                            (h = i(P, g.props.children)),
                                            (h.return = p),
                                            (p = h));
                                        break e;
                                    }
                                } else if (
                                    P.elementType === w ||
                                    (typeof w == 'object' &&
                                        w !== null &&
                                        w.$$typeof === Dt &&
                                        Mc(w) === P.type)
                                ) {
                                    (n(p, P.sibling),
                                        (h = i(P, g.props)),
                                        (h.ref = vr(p, P, g)),
                                        (h.return = p),
                                        (p = h));
                                    break e;
                                }
                                n(p, P);
                                break;
                            } else t(p, P);
                            P = P.sibling;
                        }
                        g.type === An
                            ? ((h = fn(g.props.children, p.mode, x, g.key)),
                              (h.return = p),
                              (p = h))
                            : ((x = as(g.type, g.key, g.props, null, p.mode, x)),
                              (x.ref = vr(p, h, g)),
                              (x.return = p),
                              (p = x));
                    }
                    return o(p);
                case Rn:
                    e: {
                        for (P = g.key; h !== null; ) {
                            if (h.key === P)
                                if (
                                    h.tag === 4 &&
                                    h.stateNode.containerInfo === g.containerInfo &&
                                    h.stateNode.implementation === g.implementation
                                ) {
                                    (n(p, h.sibling),
                                        (h = i(h, g.children || [])),
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
                        ((h = Ho(g, p.mode, x)), (h.return = p), (p = h));
                    }
                    return o(p);
                case Dt:
                    return ((P = g._init), S(p, h, P(g._payload), x));
            }
            if (Tr(g)) return y(p, h, g, x);
            if (hr(g)) return v(p, h, g, x);
            Bi(p, g);
        }
        return (typeof g == 'string' && g !== '') || typeof g == 'number'
            ? ((g = '' + g),
              h !== null && h.tag === 6
                  ? (n(p, h.sibling), (h = i(h, g)), (h.return = p), (p = h))
                  : (n(p, h), (h = Uo(g, p.mode, x)), (h.return = p), (p = h)),
              o(p))
            : n(p, h);
    }
    return S;
}
var er = lp(!0),
    up = lp(!1),
    Es = Yt(null),
    Ls = null,
    Fn = null,
    Kl = null;
function bl() {
    Kl = Fn = Ls = null;
}
function Gl(e) {
    var t = Es.current;
    (Q(Es), (e._currentValue = t));
}
function Ia(e, t, n) {
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
function Yn(e, t) {
    ((Ls = e),
        (Kl = Fn = null),
        (e = e.dependencies),
        e !== null &&
            e.firstContext !== null &&
            (e.lanes & t && (Ae = !0), (e.firstContext = null)));
}
function Ge(e) {
    var t = e._currentValue;
    if (Kl !== e)
        if (((e = { context: e, memoizedValue: t, next: null }), Fn === null)) {
            if (Ls === null) throw Error(T(308));
            ((Fn = e), (Ls.dependencies = { lanes: 0, firstContext: e }));
        } else Fn = Fn.next = e;
    return t;
}
var on = null;
function Ql(e) {
    on === null ? (on = [e]) : on.push(e);
}
function cp(e, t, n, r) {
    var i = t.interleaved;
    return (
        i === null ? ((n.next = n), Ql(t)) : ((n.next = i.next), (i.next = n)),
        (t.interleaved = n),
        Tt(e, r)
    );
}
function Tt(e, t) {
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
var Nt = !1;
function Yl(e) {
    e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, interleaved: null, lanes: 0 },
        effects: null,
    };
}
function fp(e, t) {
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
function wt(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function $t(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (((r = r.shared), $ & 2)) {
        var i = r.pending;
        return (
            i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
            (r.pending = t),
            Tt(e, n)
        );
    }
    return (
        (i = r.interleaved),
        i === null ? ((t.next = t), Ql(r)) : ((t.next = i.next), (i.next = t)),
        (r.interleaved = t),
        Tt(e, n)
    );
}
function ts(e, t, n) {
    if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), Vl(e, n));
    }
}
function Vc(e, t) {
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
function Rs(e, t, n, r) {
    var i = e.updateQueue;
    Nt = !1;
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
        var f = i.baseState;
        ((o = 0), (c = u = l = null), (a = s));
        do {
            var d = a.lane,
                m = a.eventTime;
            if ((r & d) === d) {
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
                    var y = e,
                        v = a;
                    switch (((d = t), (m = n), v.tag)) {
                        case 1:
                            if (((y = v.payload), typeof y == 'function')) {
                                f = y.call(m, f, d);
                                break e;
                            }
                            f = y;
                            break e;
                        case 3:
                            y.flags = (y.flags & -65537) | 128;
                        case 0:
                            if (
                                ((y = v.payload),
                                (d = typeof y == 'function' ? y.call(m, f, d) : y),
                                d == null)
                            )
                                break e;
                            f = te({}, f, d);
                            break e;
                        case 2:
                            Nt = !0;
                    }
                }
                a.callback !== null &&
                    a.lane !== 0 &&
                    ((e.flags |= 64), (d = i.effects), d === null ? (i.effects = [a]) : d.push(a));
            } else
                ((m = {
                    eventTime: m,
                    lane: d,
                    tag: a.tag,
                    payload: a.payload,
                    callback: a.callback,
                    next: null,
                }),
                    c === null ? ((u = c = m), (l = f)) : (c = c.next = m),
                    (o |= d));
            if (((a = a.next), a === null)) {
                if (((a = i.shared.pending), a === null)) break;
                ((d = a),
                    (a = d.next),
                    (d.next = null),
                    (i.lastBaseUpdate = d),
                    (i.shared.pending = null));
            }
        } while (!0);
        if (
            (c === null && (l = f),
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
        ((gn |= o), (e.lanes = o), (e.memoizedState = f));
    }
}
function _c(e, t, n) {
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
var wi = {},
    dt = Yt(wi),
    si = Yt(wi),
    oi = Yt(wi);
function an(e) {
    if (e === wi) throw Error(T(174));
    return e;
}
function Xl(e, t) {
    switch ((b(oi, t), b(si, e), b(dt, wi), (e = t.nodeType), e)) {
        case 9:
        case 11:
            t = (t = t.documentElement) ? t.namespaceURI : va(null, '');
            break;
        default:
            ((e = e === 8 ? t.parentNode : t),
                (t = e.namespaceURI || null),
                (e = e.tagName),
                (t = va(t, e)));
    }
    (Q(dt), b(dt, t));
}
function tr() {
    (Q(dt), Q(si), Q(oi));
}
function dp(e) {
    an(oi.current);
    var t = an(dt.current),
        n = va(t, e.type);
    t !== n && (b(si, e), b(dt, n));
}
function Zl(e) {
    si.current === e && (Q(dt), Q(si));
}
var J = Yt(0);
function As(e) {
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
var jo = [];
function Jl() {
    for (var e = 0; e < jo.length; e++) jo[e]._workInProgressVersionPrimary = null;
    jo.length = 0;
}
var ns = Lt.ReactCurrentDispatcher,
    Fo = Lt.ReactCurrentBatchConfig,
    mn = 0,
    ee = null,
    ue = null,
    fe = null,
    Os = !1,
    jr = !1,
    ai = 0,
    Qv = 0;
function ye() {
    throw Error(T(321));
}
function ql(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++) if (!nt(e[n], t[n])) return !1;
    return !0;
}
function eu(e, t, n, r, i, s) {
    if (
        ((mn = s),
        (ee = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (ns.current = e === null || e.memoizedState === null ? Jv : qv),
        (e = n(r, i)),
        jr)
    ) {
        s = 0;
        do {
            if (((jr = !1), (ai = 0), 25 <= s)) throw Error(T(301));
            ((s += 1), (fe = ue = null), (t.updateQueue = null), (ns.current = e0), (e = n(r, i)));
        } while (jr);
    }
    if (
        ((ns.current = Ds),
        (t = ue !== null && ue.next !== null),
        (mn = 0),
        (fe = ue = ee = null),
        (Os = !1),
        t)
    )
        throw Error(T(300));
    return e;
}
function tu() {
    var e = ai !== 0;
    return ((ai = 0), e);
}
function at() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return (fe === null ? (ee.memoizedState = fe = e) : (fe = fe.next = e), fe);
}
function Qe() {
    if (ue === null) {
        var e = ee.alternate;
        e = e !== null ? e.memoizedState : null;
    } else e = ue.next;
    var t = fe === null ? ee.memoizedState : fe.next;
    if (t !== null) ((fe = t), (ue = e));
    else {
        if (e === null) throw Error(T(310));
        ((ue = e),
            (e = {
                memoizedState: ue.memoizedState,
                baseState: ue.baseState,
                baseQueue: ue.baseQueue,
                queue: ue.queue,
                next: null,
            }),
            fe === null ? (ee.memoizedState = fe = e) : (fe = fe.next = e));
    }
    return fe;
}
function li(e, t) {
    return typeof t == 'function' ? t(e) : t;
}
function Io(e) {
    var t = Qe(),
        n = t.queue;
    if (n === null) throw Error(T(311));
    n.lastRenderedReducer = e;
    var r = ue,
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
            if ((mn & c) === c)
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
                var f = {
                    lane: c,
                    action: u.action,
                    hasEagerState: u.hasEagerState,
                    eagerState: u.eagerState,
                    next: null,
                };
                (l === null ? ((a = l = f), (o = r)) : (l = l.next = f),
                    (ee.lanes |= c),
                    (gn |= c));
            }
            u = u.next;
        } while (u !== null && u !== s);
        (l === null ? (o = r) : (l.next = a),
            nt(r, t.memoizedState) || (Ae = !0),
            (t.memoizedState = r),
            (t.baseState = o),
            (t.baseQueue = l),
            (n.lastRenderedState = r));
    }
    if (((e = n.interleaved), e !== null)) {
        i = e;
        do ((s = i.lane), (ee.lanes |= s), (gn |= s), (i = i.next));
        while (i !== e);
    } else i === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
}
function zo(e) {
    var t = Qe(),
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
        (nt(s, t.memoizedState) || (Ae = !0),
            (t.memoizedState = s),
            t.baseQueue === null && (t.baseState = s),
            (n.lastRenderedState = s));
    }
    return [s, r];
}
function hp() {}
function pp(e, t) {
    var n = ee,
        r = Qe(),
        i = t(),
        s = !nt(r.memoizedState, i);
    if (
        (s && ((r.memoizedState = i), (Ae = !0)),
        (r = r.queue),
        nu(yp.bind(null, n, r, e), [e]),
        r.getSnapshot !== t || s || (fe !== null && fe.memoizedState.tag & 1))
    ) {
        if (((n.flags |= 2048), ui(9, gp.bind(null, n, r, i, t), void 0, null), he === null))
            throw Error(T(349));
        mn & 30 || mp(n, t, i);
    }
    return i;
}
function mp(e, t, n) {
    ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = ee.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }), (ee.updateQueue = t), (t.stores = [e]))
            : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function gp(e, t, n, r) {
    ((t.value = n), (t.getSnapshot = r), vp(t) && xp(e));
}
function yp(e, t, n) {
    return n(function () {
        vp(t) && xp(e);
    });
}
function vp(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !nt(e, n);
    } catch {
        return !0;
    }
}
function xp(e) {
    var t = Tt(e, 1);
    t !== null && tt(t, e, 1, -1);
}
function jc(e) {
    var t = at();
    return (
        typeof e == 'function' && (e = e()),
        (t.memoizedState = t.baseState = e),
        (e = {
            pending: null,
            interleaved: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: li,
            lastRenderedState: e,
        }),
        (t.queue = e),
        (e = e.dispatch = Zv.bind(null, ee, e)),
        [t.memoizedState, e]
    );
}
function ui(e, t, n, r) {
    return (
        (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
        (t = ee.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }),
              (ee.updateQueue = t),
              (t.lastEffect = e.next = e))
            : ((n = t.lastEffect),
              n === null
                  ? (t.lastEffect = e.next = e)
                  : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
        e
    );
}
function wp() {
    return Qe().memoizedState;
}
function rs(e, t, n, r) {
    var i = at();
    ((ee.flags |= e), (i.memoizedState = ui(1 | t, n, void 0, r === void 0 ? null : r)));
}
function eo(e, t, n, r) {
    var i = Qe();
    r = r === void 0 ? null : r;
    var s = void 0;
    if (ue !== null) {
        var o = ue.memoizedState;
        if (((s = o.destroy), r !== null && ql(r, o.deps))) {
            i.memoizedState = ui(t, n, s, r);
            return;
        }
    }
    ((ee.flags |= e), (i.memoizedState = ui(1 | t, n, s, r)));
}
function Fc(e, t) {
    return rs(8390656, 8, e, t);
}
function nu(e, t) {
    return eo(2048, 8, e, t);
}
function Sp(e, t) {
    return eo(4, 2, e, t);
}
function kp(e, t) {
    return eo(4, 4, e, t);
}
function Pp(e, t) {
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
function Cp(e, t, n) {
    return ((n = n != null ? n.concat([e]) : null), eo(4, 4, Pp.bind(null, t, e), n));
}
function ru() {}
function Tp(e, t) {
    var n = Qe();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && ql(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
}
function Ep(e, t) {
    var n = Qe();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && ql(t, r[1])
        ? r[0]
        : ((e = e()), (n.memoizedState = [e, t]), e);
}
function Lp(e, t, n) {
    return mn & 21
        ? (nt(n, t) || ((n = Nh()), (ee.lanes |= n), (gn |= n), (e.baseState = !0)), t)
        : (e.baseState && ((e.baseState = !1), (Ae = !0)), (e.memoizedState = n));
}
function Yv(e, t) {
    var n = W;
    ((W = n !== 0 && 4 > n ? n : 4), e(!0));
    var r = Fo.transition;
    Fo.transition = {};
    try {
        (e(!1), t());
    } finally {
        ((W = n), (Fo.transition = r));
    }
}
function Rp() {
    return Qe().memoizedState;
}
function Xv(e, t, n) {
    var r = Ht(e);
    if (((n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }), Ap(e)))
        Op(t, n);
    else if (((n = cp(e, t, n, r)), n !== null)) {
        var i = Pe();
        (tt(n, e, r, i), Dp(n, t, r));
    }
}
function Zv(e, t, n) {
    var r = Ht(e),
        i = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
    if (Ap(e)) Op(t, i);
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
                if (((i.hasEagerState = !0), (i.eagerState = a), nt(a, o))) {
                    var l = t.interleaved;
                    (l === null ? ((i.next = i), Ql(t)) : ((i.next = l.next), (l.next = i)),
                        (t.interleaved = i));
                    return;
                }
            } catch {
            } finally {
            }
        ((n = cp(e, t, i, r)), n !== null && ((i = Pe()), tt(n, e, r, i), Dp(n, t, r)));
    }
}
function Ap(e) {
    var t = e.alternate;
    return e === ee || (t !== null && t === ee);
}
function Op(e, t) {
    jr = Os = !0;
    var n = e.pending;
    (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t));
}
function Dp(e, t, n) {
    if (n & 4194240) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), Vl(e, n));
    }
}
var Ds = {
        readContext: Ge,
        useCallback: ye,
        useContext: ye,
        useEffect: ye,
        useImperativeHandle: ye,
        useInsertionEffect: ye,
        useLayoutEffect: ye,
        useMemo: ye,
        useReducer: ye,
        useRef: ye,
        useState: ye,
        useDebugValue: ye,
        useDeferredValue: ye,
        useTransition: ye,
        useMutableSource: ye,
        useSyncExternalStore: ye,
        useId: ye,
        unstable_isNewReconciler: !1,
    },
    Jv = {
        readContext: Ge,
        useCallback: function (e, t) {
            return ((at().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: Ge,
        useEffect: Fc,
        useImperativeHandle: function (e, t, n) {
            return ((n = n != null ? n.concat([e]) : null), rs(4194308, 4, Pp.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
            return rs(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
            return rs(4, 2, e, t);
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
                (e = e.dispatch = Xv.bind(null, ee, e)),
                [r.memoizedState, e]
            );
        },
        useRef: function (e) {
            var t = at();
            return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: jc,
        useDebugValue: ru,
        useDeferredValue: function (e) {
            return (at().memoizedState = e);
        },
        useTransition: function () {
            var e = jc(!1),
                t = e[0];
            return ((e = Yv.bind(null, e[1])), (at().memoizedState = e), [t, e]);
        },
        useMutableSource: function () {},
        useSyncExternalStore: function (e, t, n) {
            var r = ee,
                i = at();
            if (Y) {
                if (n === void 0) throw Error(T(407));
                n = n();
            } else {
                if (((n = t()), he === null)) throw Error(T(349));
                mn & 30 || mp(r, t, n);
            }
            i.memoizedState = n;
            var s = { value: n, getSnapshot: t };
            return (
                (i.queue = s),
                Fc(yp.bind(null, r, s, e), [e]),
                (r.flags |= 2048),
                ui(9, gp.bind(null, r, s, n, t), void 0, null),
                n
            );
        },
        useId: function () {
            var e = at(),
                t = he.identifierPrefix;
            if (Y) {
                var n = xt,
                    r = vt;
                ((n = (r & ~(1 << (32 - et(r) - 1))).toString(32) + n),
                    (t = ':' + t + 'R' + n),
                    (n = ai++),
                    0 < n && (t += 'H' + n.toString(32)),
                    (t += ':'));
            } else ((n = Qv++), (t = ':' + t + 'r' + n.toString(32) + ':'));
            return (e.memoizedState = t);
        },
        unstable_isNewReconciler: !1,
    },
    qv = {
        readContext: Ge,
        useCallback: Tp,
        useContext: Ge,
        useEffect: nu,
        useImperativeHandle: Cp,
        useInsertionEffect: Sp,
        useLayoutEffect: kp,
        useMemo: Ep,
        useReducer: Io,
        useRef: wp,
        useState: function () {
            return Io(li);
        },
        useDebugValue: ru,
        useDeferredValue: function (e) {
            var t = Qe();
            return Lp(t, ue.memoizedState, e);
        },
        useTransition: function () {
            var e = Io(li)[0],
                t = Qe().memoizedState;
            return [e, t];
        },
        useMutableSource: hp,
        useSyncExternalStore: pp,
        useId: Rp,
        unstable_isNewReconciler: !1,
    },
    e0 = {
        readContext: Ge,
        useCallback: Tp,
        useContext: Ge,
        useEffect: nu,
        useImperativeHandle: Cp,
        useInsertionEffect: Sp,
        useLayoutEffect: kp,
        useMemo: Ep,
        useReducer: zo,
        useRef: wp,
        useState: function () {
            return zo(li);
        },
        useDebugValue: ru,
        useDeferredValue: function (e) {
            var t = Qe();
            return ue === null ? (t.memoizedState = e) : Lp(t, ue.memoizedState, e);
        },
        useTransition: function () {
            var e = zo(li)[0],
                t = Qe().memoizedState;
            return [e, t];
        },
        useMutableSource: hp,
        useSyncExternalStore: pp,
        useId: Rp,
        unstable_isNewReconciler: !1,
    };
function Ze(e, t) {
    if (e && e.defaultProps) {
        ((t = te({}, t)), (e = e.defaultProps));
        for (var n in e) t[n] === void 0 && (t[n] = e[n]);
        return t;
    }
    return t;
}
function za(e, t, n, r) {
    ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : te({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
}
var to = {
    isMounted: function (e) {
        return (e = e._reactInternals) ? Sn(e) === e : !1;
    },
    enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = Pe(),
            i = Ht(e),
            s = wt(r, i);
        ((s.payload = t),
            n != null && (s.callback = n),
            (t = $t(e, s, i)),
            t !== null && (tt(t, e, i, r), ts(t, e, i)));
    },
    enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = Pe(),
            i = Ht(e),
            s = wt(r, i);
        ((s.tag = 1),
            (s.payload = t),
            n != null && (s.callback = n),
            (t = $t(e, s, i)),
            t !== null && (tt(t, e, i, r), ts(t, e, i)));
    },
    enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = Pe(),
            r = Ht(e),
            i = wt(n, r);
        ((i.tag = 2),
            t != null && (i.callback = t),
            (t = $t(e, i, r)),
            t !== null && (tt(t, e, r, n), ts(t, e, r)));
    },
};
function Ic(e, t, n, r, i, s, o) {
    return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == 'function'
            ? e.shouldComponentUpdate(r, s, o)
            : t.prototype && t.prototype.isPureReactComponent
              ? !ti(n, r) || !ti(i, s)
              : !0
    );
}
function Np(e, t, n) {
    var r = !1,
        i = bt,
        s = t.contextType;
    return (
        typeof s == 'object' && s !== null
            ? (s = Ge(s))
            : ((i = De(t) ? hn : Se.current),
              (r = t.contextTypes),
              (s = (r = r != null) ? Jn(e, i) : bt)),
        (t = new t(n, s)),
        (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
        (t.updater = to),
        (e.stateNode = t),
        (t._reactInternals = e),
        r &&
            ((e = e.stateNode),
            (e.__reactInternalMemoizedUnmaskedChildContext = i),
            (e.__reactInternalMemoizedMaskedChildContext = s)),
        t
    );
}
function zc(e, t, n, r) {
    ((e = t.state),
        typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
            t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && to.enqueueReplaceState(t, t.state, null));
}
function Ba(e, t, n, r) {
    var i = e.stateNode;
    ((i.props = n), (i.state = e.memoizedState), (i.refs = {}), Yl(e));
    var s = t.contextType;
    (typeof s == 'object' && s !== null
        ? (i.context = Ge(s))
        : ((s = De(t) ? hn : Se.current), (i.context = Jn(e, s))),
        (i.state = e.memoizedState),
        (s = t.getDerivedStateFromProps),
        typeof s == 'function' && (za(e, t, s, n), (i.state = e.memoizedState)),
        typeof t.getDerivedStateFromProps == 'function' ||
            typeof i.getSnapshotBeforeUpdate == 'function' ||
            (typeof i.UNSAFE_componentWillMount != 'function' &&
                typeof i.componentWillMount != 'function') ||
            ((t = i.state),
            typeof i.componentWillMount == 'function' && i.componentWillMount(),
            typeof i.UNSAFE_componentWillMount == 'function' && i.UNSAFE_componentWillMount(),
            t !== i.state && to.enqueueReplaceState(i, i.state, null),
            Rs(e, n, i, r),
            (i.state = e.memoizedState)),
        typeof i.componentDidMount == 'function' && (e.flags |= 4194308));
}
function nr(e, t) {
    try {
        var n = '',
            r = t;
        do ((n += Ry(r)), (r = r.return));
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
function Bo(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function $a(e, t) {
    try {
        console.error(t.value);
    } catch (n) {
        setTimeout(function () {
            throw n;
        });
    }
}
var t0 = typeof WeakMap == 'function' ? WeakMap : Map;
function Mp(e, t, n) {
    ((n = wt(-1, n)), (n.tag = 3), (n.payload = { element: null }));
    var r = t.value;
    return (
        (n.callback = function () {
            (Ms || ((Ms = !0), (Za = r)), $a(e, t));
        }),
        n
    );
}
function Vp(e, t, n) {
    ((n = wt(-1, n)), (n.tag = 3));
    var r = e.type.getDerivedStateFromError;
    if (typeof r == 'function') {
        var i = t.value;
        ((n.payload = function () {
            return r(i);
        }),
            (n.callback = function () {
                $a(e, t);
            }));
    }
    var s = e.stateNode;
    return (
        s !== null &&
            typeof s.componentDidCatch == 'function' &&
            (n.callback = function () {
                ($a(e, t),
                    typeof r != 'function' &&
                        (Ut === null ? (Ut = new Set([this])) : Ut.add(this)));
                var o = t.stack;
                this.componentDidCatch(t.value, { componentStack: o !== null ? o : '' });
            }),
        n
    );
}
function Bc(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
        r = e.pingCache = new t0();
        var i = new Set();
        r.set(t, i);
    } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
    i.has(n) || (i.add(n), (e = m0.bind(null, e, t, n)), t.then(e, e));
}
function $c(e) {
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
function Uc(e, t, n, r, i) {
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
                        : ((t = wt(-1, 1)), (t.tag = 2), $t(n, t, 1))),
                (n.lanes |= 1)),
          e);
}
var n0 = Lt.ReactCurrentOwner,
    Ae = !1;
function ke(e, t, n, r) {
    t.child = e === null ? up(t, null, n, r) : er(t, e.child, n, r);
}
function Hc(e, t, n, r, i) {
    n = n.render;
    var s = t.ref;
    return (
        Yn(t, i),
        (r = eu(e, t, n, r, s, i)),
        (n = tu()),
        e !== null && !Ae
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), Et(e, t, i))
            : (Y && n && Ul(t), (t.flags |= 1), ke(e, t, r, i), t.child)
    );
}
function Wc(e, t, n, r, i) {
    if (e === null) {
        var s = n.type;
        return typeof s == 'function' &&
            !fu(s) &&
            s.defaultProps === void 0 &&
            n.compare === null &&
            n.defaultProps === void 0
            ? ((t.tag = 15), (t.type = s), _p(e, t, s, r, i))
            : ((e = as(n.type, null, r, t, t.mode, i)),
              (e.ref = t.ref),
              (e.return = t),
              (t.child = e));
    }
    if (((s = e.child), !(e.lanes & i))) {
        var o = s.memoizedProps;
        if (((n = n.compare), (n = n !== null ? n : ti), n(o, r) && e.ref === t.ref))
            return Et(e, t, i);
    }
    return ((t.flags |= 1), (e = Wt(s, r)), (e.ref = t.ref), (e.return = t), (t.child = e));
}
function _p(e, t, n, r, i) {
    if (e !== null) {
        var s = e.memoizedProps;
        if (ti(s, r) && e.ref === t.ref)
            if (((Ae = !1), (t.pendingProps = r = s), (e.lanes & i) !== 0))
                e.flags & 131072 && (Ae = !0);
            else return ((t.lanes = e.lanes), Et(e, t, i));
    }
    return Ua(e, t, n, r, i);
}
function jp(e, t, n) {
    var r = t.pendingProps,
        i = r.children,
        s = e !== null ? e.memoizedState : null;
    if (r.mode === 'hidden')
        if (!(t.mode & 1))
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                b(zn, Me),
                (Me |= n));
        else {
            if (!(n & 1073741824))
                return (
                    (e = s !== null ? s.baseLanes | n : n),
                    (t.lanes = t.childLanes = 1073741824),
                    (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
                    (t.updateQueue = null),
                    b(zn, Me),
                    (Me |= e),
                    null
                );
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                (r = s !== null ? s.baseLanes : n),
                b(zn, Me),
                (Me |= r));
        }
    else
        (s !== null ? ((r = s.baseLanes | n), (t.memoizedState = null)) : (r = n),
            b(zn, Me),
            (Me |= r));
    return (ke(e, t, i, n), t.child);
}
function Fp(e, t) {
    var n = t.ref;
    ((e === null && n !== null) || (e !== null && e.ref !== n)) &&
        ((t.flags |= 512), (t.flags |= 2097152));
}
function Ua(e, t, n, r, i) {
    var s = De(n) ? hn : Se.current;
    return (
        (s = Jn(t, s)),
        Yn(t, i),
        (n = eu(e, t, n, r, s, i)),
        (r = tu()),
        e !== null && !Ae
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), Et(e, t, i))
            : (Y && r && Ul(t), (t.flags |= 1), ke(e, t, n, i), t.child)
    );
}
function Kc(e, t, n, r, i) {
    if (De(n)) {
        var s = !0;
        Ps(t);
    } else s = !1;
    if ((Yn(t, i), t.stateNode === null)) (is(e, t), Np(t, n, r), Ba(t, n, r, i), (r = !0));
    else if (e === null) {
        var o = t.stateNode,
            a = t.memoizedProps;
        o.props = a;
        var l = o.context,
            u = n.contextType;
        typeof u == 'object' && u !== null
            ? (u = Ge(u))
            : ((u = De(n) ? hn : Se.current), (u = Jn(t, u)));
        var c = n.getDerivedStateFromProps,
            f = typeof c == 'function' || typeof o.getSnapshotBeforeUpdate == 'function';
        (f ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((a !== r || l !== u) && zc(t, o, r, u)),
            (Nt = !1));
        var d = t.memoizedState;
        ((o.state = d),
            Rs(t, r, o, i),
            (l = t.memoizedState),
            a !== r || d !== l || Oe.current || Nt
                ? (typeof c == 'function' && (za(t, n, c, r), (l = t.memoizedState)),
                  (a = Nt || Ic(t, n, a, r, d, l, u))
                      ? (f ||
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
            fp(e, t),
            (a = t.memoizedProps),
            (u = t.type === t.elementType ? a : Ze(t.type, a)),
            (o.props = u),
            (f = t.pendingProps),
            (d = o.context),
            (l = n.contextType),
            typeof l == 'object' && l !== null
                ? (l = Ge(l))
                : ((l = De(n) ? hn : Se.current), (l = Jn(t, l))));
        var m = n.getDerivedStateFromProps;
        ((c = typeof m == 'function' || typeof o.getSnapshotBeforeUpdate == 'function') ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((a !== f || d !== l) && zc(t, o, r, l)),
            (Nt = !1),
            (d = t.memoizedState),
            (o.state = d),
            Rs(t, r, o, i));
        var y = t.memoizedState;
        a !== f || d !== y || Oe.current || Nt
            ? (typeof m == 'function' && (za(t, n, m, r), (y = t.memoizedState)),
              (u = Nt || Ic(t, n, u, r, d, y, l) || !1)
                  ? (c ||
                        (typeof o.UNSAFE_componentWillUpdate != 'function' &&
                            typeof o.componentWillUpdate != 'function') ||
                        (typeof o.componentWillUpdate == 'function' &&
                            o.componentWillUpdate(r, y, l),
                        typeof o.UNSAFE_componentWillUpdate == 'function' &&
                            o.UNSAFE_componentWillUpdate(r, y, l)),
                    typeof o.componentDidUpdate == 'function' && (t.flags |= 4),
                    typeof o.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
                  : (typeof o.componentDidUpdate != 'function' ||
                        (a === e.memoizedProps && d === e.memoizedState) ||
                        (t.flags |= 4),
                    typeof o.getSnapshotBeforeUpdate != 'function' ||
                        (a === e.memoizedProps && d === e.memoizedState) ||
                        (t.flags |= 1024),
                    (t.memoizedProps = r),
                    (t.memoizedState = y)),
              (o.props = r),
              (o.state = y),
              (o.context = l),
              (r = u))
            : (typeof o.componentDidUpdate != 'function' ||
                  (a === e.memoizedProps && d === e.memoizedState) ||
                  (t.flags |= 4),
              typeof o.getSnapshotBeforeUpdate != 'function' ||
                  (a === e.memoizedProps && d === e.memoizedState) ||
                  (t.flags |= 1024),
              (r = !1));
    }
    return Ha(e, t, n, r, s, i);
}
function Ha(e, t, n, r, i, s) {
    Fp(e, t);
    var o = (t.flags & 128) !== 0;
    if (!r && !o) return (i && Oc(t, n, !1), Et(e, t, s));
    ((r = t.stateNode), (n0.current = t));
    var a = o && typeof n.getDerivedStateFromError != 'function' ? null : r.render();
    return (
        (t.flags |= 1),
        e !== null && o
            ? ((t.child = er(t, e.child, null, s)), (t.child = er(t, null, a, s)))
            : ke(e, t, a, s),
        (t.memoizedState = r.state),
        i && Oc(t, n, !0),
        t.child
    );
}
function Ip(e) {
    var t = e.stateNode;
    (t.pendingContext
        ? Ac(e, t.pendingContext, t.pendingContext !== t.context)
        : t.context && Ac(e, t.context, !1),
        Xl(e, t.containerInfo));
}
function bc(e, t, n, r, i) {
    return (qn(), Wl(i), (t.flags |= 256), ke(e, t, n, r), t.child);
}
var Wa = { dehydrated: null, treeContext: null, retryLane: 0 };
function Ka(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
}
function zp(e, t, n) {
    var r = t.pendingProps,
        i = J.current,
        s = !1,
        o = (t.flags & 128) !== 0,
        a;
    if (
        ((a = o) || (a = e !== null && e.memoizedState === null ? !1 : (i & 2) !== 0),
        a ? ((s = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (i |= 1),
        b(J, i & 1),
        e === null)
    )
        return (
            Fa(t),
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
                            : (s = io(o, r, 0, null)),
                        (e = fn(e, r, n, null)),
                        (s.return = t),
                        (e.return = t),
                        (s.sibling = e),
                        (t.child = s),
                        (t.child.memoizedState = Ka(n)),
                        (t.memoizedState = Wa),
                        e)
                      : iu(t, o))
        );
    if (((i = e.memoizedState), i !== null && ((a = i.dehydrated), a !== null)))
        return r0(e, t, o, r, a, i, n);
    if (s) {
        ((s = r.fallback), (o = t.mode), (i = e.child), (a = i.sibling));
        var l = { mode: 'hidden', children: r.children };
        return (
            !(o & 1) && t.child !== i
                ? ((r = t.child), (r.childLanes = 0), (r.pendingProps = l), (t.deletions = null))
                : ((r = Wt(i, l)), (r.subtreeFlags = i.subtreeFlags & 14680064)),
            a !== null ? (s = Wt(a, s)) : ((s = fn(s, o, n, null)), (s.flags |= 2)),
            (s.return = t),
            (r.return = t),
            (r.sibling = s),
            (t.child = r),
            (r = s),
            (s = t.child),
            (o = e.child.memoizedState),
            (o =
                o === null
                    ? Ka(n)
                    : { baseLanes: o.baseLanes | n, cachePool: null, transitions: o.transitions }),
            (s.memoizedState = o),
            (s.childLanes = e.childLanes & ~n),
            (t.memoizedState = Wa),
            r
        );
    }
    return (
        (s = e.child),
        (e = s.sibling),
        (r = Wt(s, { mode: 'visible', children: r.children })),
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
function iu(e, t) {
    return (
        (t = io({ mode: 'visible', children: t }, e.mode, 0, null)),
        (t.return = e),
        (e.child = t)
    );
}
function $i(e, t, n, r) {
    return (
        r !== null && Wl(r),
        er(t, e.child, null, n),
        (e = iu(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
    );
}
function r0(e, t, n, r, i, s, o) {
    if (n)
        return t.flags & 256
            ? ((t.flags &= -257), (r = Bo(Error(T(422)))), $i(e, t, o, r))
            : t.memoizedState !== null
              ? ((t.child = e.child), (t.flags |= 128), null)
              : ((s = r.fallback),
                (i = t.mode),
                (r = io({ mode: 'visible', children: r.children }, i, 0, null)),
                (s = fn(s, i, o, null)),
                (s.flags |= 2),
                (r.return = t),
                (s.return = t),
                (r.sibling = s),
                (t.child = r),
                t.mode & 1 && er(t, e.child, null, o),
                (t.child.memoizedState = Ka(o)),
                (t.memoizedState = Wa),
                s);
    if (!(t.mode & 1)) return $i(e, t, o, null);
    if (i.data === '$!') {
        if (((r = i.nextSibling && i.nextSibling.dataset), r)) var a = r.dgst;
        return ((r = a), (s = Error(T(419))), (r = Bo(s, r, void 0)), $i(e, t, o, r));
    }
    if (((a = (o & e.childLanes) !== 0), Ae || a)) {
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
                i !== 0 && i !== s.retryLane && ((s.retryLane = i), Tt(e, i), tt(r, e, i, -1)));
        }
        return (cu(), (r = Bo(Error(T(421)))), $i(e, t, o, r));
    }
    return i.data === '$?'
        ? ((t.flags |= 128), (t.child = e.child), (t = g0.bind(null, e)), (i._reactRetry = t), null)
        : ((e = s.treeContext),
          (Ve = Bt(i.nextSibling)),
          (_e = t),
          (Y = !0),
          (qe = null),
          e !== null &&
              ((Ue[He++] = vt),
              (Ue[He++] = xt),
              (Ue[He++] = pn),
              (vt = e.id),
              (xt = e.overflow),
              (pn = t)),
          (t = iu(t, r.children)),
          (t.flags |= 4096),
          t);
}
function Gc(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    (r !== null && (r.lanes |= t), Ia(e.return, t, n));
}
function $o(e, t, n, r, i) {
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
function Bp(e, t, n) {
    var r = t.pendingProps,
        i = r.revealOrder,
        s = r.tail;
    if ((ke(e, t, r.children, n), (r = J.current), r & 2)) ((r = (r & 1) | 2), (t.flags |= 128));
    else {
        if (e !== null && e.flags & 128)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13) e.memoizedState !== null && Gc(e, n, t);
                else if (e.tag === 19) Gc(e, n, t);
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
    if ((b(J, r), !(t.mode & 1))) t.memoizedState = null;
    else
        switch (i) {
            case 'forwards':
                for (n = t.child, i = null; n !== null; )
                    ((e = n.alternate), e !== null && As(e) === null && (i = n), (n = n.sibling));
                ((n = i),
                    n === null
                        ? ((i = t.child), (t.child = null))
                        : ((i = n.sibling), (n.sibling = null)),
                    $o(t, !1, i, n, s));
                break;
            case 'backwards':
                for (n = null, i = t.child, t.child = null; i !== null; ) {
                    if (((e = i.alternate), e !== null && As(e) === null)) {
                        t.child = i;
                        break;
                    }
                    ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
                }
                $o(t, !0, n, null, s);
                break;
            case 'together':
                $o(t, !1, null, null, void 0);
                break;
            default:
                t.memoizedState = null;
        }
    return t.child;
}
function is(e, t) {
    !(t.mode & 1) && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function Et(e, t, n) {
    if ((e !== null && (t.dependencies = e.dependencies), (gn |= t.lanes), !(n & t.childLanes)))
        return null;
    if (e !== null && t.child !== e.child) throw Error(T(153));
    if (t.child !== null) {
        for (
            e = t.child, n = Wt(e, e.pendingProps), t.child = n, n.return = t;
            e.sibling !== null;
        )
            ((e = e.sibling), (n = n.sibling = Wt(e, e.pendingProps)), (n.return = t));
        n.sibling = null;
    }
    return t.child;
}
function i0(e, t, n) {
    switch (t.tag) {
        case 3:
            (Ip(t), qn());
            break;
        case 5:
            dp(t);
            break;
        case 1:
            De(t.type) && Ps(t);
            break;
        case 4:
            Xl(t, t.stateNode.containerInfo);
            break;
        case 10:
            var r = t.type._context,
                i = t.memoizedProps.value;
            (b(Es, r._currentValue), (r._currentValue = i));
            break;
        case 13:
            if (((r = t.memoizedState), r !== null))
                return r.dehydrated !== null
                    ? (b(J, J.current & 1), (t.flags |= 128), null)
                    : n & t.child.childLanes
                      ? zp(e, t, n)
                      : (b(J, J.current & 1), (e = Et(e, t, n)), e !== null ? e.sibling : null);
            b(J, J.current & 1);
            break;
        case 19:
            if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
                if (r) return Bp(e, t, n);
                t.flags |= 128;
            }
            if (
                ((i = t.memoizedState),
                i !== null && ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
                b(J, J.current),
                r)
            )
                break;
            return null;
        case 22:
        case 23:
            return ((t.lanes = 0), jp(e, t, n));
    }
    return Et(e, t, n);
}
var $p, ba, Up, Hp;
$p = function (e, t) {
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
ba = function () {};
Up = function (e, t, n, r) {
    var i = e.memoizedProps;
    if (i !== r) {
        ((e = t.stateNode), an(dt.current));
        var s = null;
        switch (n) {
            case 'input':
                ((i = pa(e, i)), (r = pa(e, r)), (s = []));
                break;
            case 'select':
                ((i = te({}, i, { value: void 0 })), (r = te({}, r, { value: void 0 })), (s = []));
                break;
            case 'textarea':
                ((i = ya(e, i)), (r = ya(e, r)), (s = []));
                break;
            default:
                typeof i.onClick != 'function' &&
                    typeof r.onClick == 'function' &&
                    (e.onclick = Ss);
        }
        xa(n, r);
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
                        (Qr.hasOwnProperty(u) ? s || (s = []) : (s = s || []).push(u, null));
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
                            (Qr.hasOwnProperty(u)
                                ? (l != null && u === 'onScroll' && G('scroll', e),
                                  s || a === l || (s = []))
                                : (s = s || []).push(u, l));
        }
        n && (s = s || []).push('style', n);
        var u = s;
        (t.updateQueue = u) && (t.flags |= 4);
    }
};
Hp = function (e, t, n, r) {
    n !== r && (t.flags |= 4);
};
function xr(e, t) {
    if (!Y)
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
function ve(e) {
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
function s0(e, t, n) {
    var r = t.pendingProps;
    switch ((Hl(t), t.tag)) {
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
            return (ve(t), null);
        case 1:
            return (De(t.type) && ks(), ve(t), null);
        case 3:
            return (
                (r = t.stateNode),
                tr(),
                Q(Oe),
                Q(Se),
                Jl(),
                r.pendingContext && ((r.context = r.pendingContext), (r.pendingContext = null)),
                (e === null || e.child === null) &&
                    (zi(t)
                        ? (t.flags |= 4)
                        : e === null ||
                          (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                          ((t.flags |= 1024), qe !== null && (el(qe), (qe = null)))),
                ba(e, t),
                ve(t),
                null
            );
        case 5:
            Zl(t);
            var i = an(oi.current);
            if (((n = t.type), e !== null && t.stateNode != null))
                (Up(e, t, n, r, i), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
            else {
                if (!r) {
                    if (t.stateNode === null) throw Error(T(166));
                    return (ve(t), null);
                }
                if (((e = an(dt.current)), zi(t))) {
                    ((r = t.stateNode), (n = t.type));
                    var s = t.memoizedProps;
                    switch (((r[lt] = t), (r[ii] = s), (e = (t.mode & 1) !== 0), n)) {
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
                            for (i = 0; i < Lr.length; i++) G(Lr[i], r);
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
                            (nc(r, s), G('invalid', r));
                            break;
                        case 'select':
                            ((r._wrapperState = { wasMultiple: !!s.multiple }), G('invalid', r));
                            break;
                        case 'textarea':
                            (ic(r, s), G('invalid', r));
                    }
                    (xa(n, s), (i = null));
                    for (var o in s)
                        if (s.hasOwnProperty(o)) {
                            var a = s[o];
                            o === 'children'
                                ? typeof a == 'string'
                                    ? r.textContent !== a &&
                                      (s.suppressHydrationWarning !== !0 && Ii(r.textContent, a, e),
                                      (i = ['children', a]))
                                    : typeof a == 'number' &&
                                      r.textContent !== '' + a &&
                                      (s.suppressHydrationWarning !== !0 && Ii(r.textContent, a, e),
                                      (i = ['children', '' + a]))
                                : Qr.hasOwnProperty(o) &&
                                  a != null &&
                                  o === 'onScroll' &&
                                  G('scroll', r);
                        }
                    switch (n) {
                        case 'input':
                            (Oi(r), rc(r, s, !0));
                            break;
                        case 'textarea':
                            (Oi(r), sc(r));
                            break;
                        case 'select':
                        case 'option':
                            break;
                        default:
                            typeof s.onClick == 'function' && (r.onclick = Ss);
                    }
                    ((r = i), (t.updateQueue = r), r !== null && (t.flags |= 4));
                } else {
                    ((o = i.nodeType === 9 ? i : i.ownerDocument),
                        e === 'http://www.w3.org/1999/xhtml' && (e = yh(n)),
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
                        (e[ii] = r),
                        $p(e, t, !1, !1),
                        (t.stateNode = e));
                    e: {
                        switch (((o = wa(n, r)), n)) {
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
                                for (i = 0; i < Lr.length; i++) G(Lr[i], e);
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
                                (nc(e, r), (i = pa(e, r)), G('invalid', e));
                                break;
                            case 'option':
                                i = r;
                                break;
                            case 'select':
                                ((e._wrapperState = { wasMultiple: !!r.multiple }),
                                    (i = te({}, r, { value: void 0 })),
                                    G('invalid', e));
                                break;
                            case 'textarea':
                                (ic(e, r), (i = ya(e, r)), G('invalid', e));
                                break;
                            default:
                                i = r;
                        }
                        (xa(n, i), (a = i));
                        for (s in a)
                            if (a.hasOwnProperty(s)) {
                                var l = a[s];
                                s === 'style'
                                    ? wh(e, l)
                                    : s === 'dangerouslySetInnerHTML'
                                      ? ((l = l ? l.__html : void 0), l != null && vh(e, l))
                                      : s === 'children'
                                        ? typeof l == 'string'
                                            ? (n !== 'textarea' || l !== '') && Yr(e, l)
                                            : typeof l == 'number' && Yr(e, '' + l)
                                        : s !== 'suppressContentEditableWarning' &&
                                          s !== 'suppressHydrationWarning' &&
                                          s !== 'autoFocus' &&
                                          (Qr.hasOwnProperty(s)
                                              ? l != null && s === 'onScroll' && G('scroll', e)
                                              : l != null && Rl(e, s, l, o));
                            }
                        switch (n) {
                            case 'input':
                                (Oi(e), rc(e, r, !1));
                                break;
                            case 'textarea':
                                (Oi(e), sc(e));
                                break;
                            case 'option':
                                r.value != null && e.setAttribute('value', '' + Kt(r.value));
                                break;
                            case 'select':
                                ((e.multiple = !!r.multiple),
                                    (s = r.value),
                                    s != null
                                        ? Kn(e, !!r.multiple, s, !1)
                                        : r.defaultValue != null &&
                                          Kn(e, !!r.multiple, r.defaultValue, !0));
                                break;
                            default:
                                typeof i.onClick == 'function' && (e.onclick = Ss);
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
            return (ve(t), null);
        case 6:
            if (e && t.stateNode != null) Hp(e, t, e.memoizedProps, r);
            else {
                if (typeof r != 'string' && t.stateNode === null) throw Error(T(166));
                if (((n = an(oi.current)), an(dt.current), zi(t))) {
                    if (
                        ((r = t.stateNode),
                        (n = t.memoizedProps),
                        (r[lt] = t),
                        (s = r.nodeValue !== n) && ((e = _e), e !== null))
                    )
                        switch (e.tag) {
                            case 3:
                                Ii(r.nodeValue, n, (e.mode & 1) !== 0);
                                break;
                            case 5:
                                e.memoizedProps.suppressHydrationWarning !== !0 &&
                                    Ii(r.nodeValue, n, (e.mode & 1) !== 0);
                        }
                    s && (t.flags |= 4);
                } else
                    ((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)),
                        (r[lt] = t),
                        (t.stateNode = r));
            }
            return (ve(t), null);
        case 13:
            if (
                (Q(J),
                (r = t.memoizedState),
                e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
            ) {
                if (Y && Ve !== null && t.mode & 1 && !(t.flags & 128))
                    (ap(), qn(), (t.flags |= 98560), (s = !1));
                else if (((s = zi(t)), r !== null && r.dehydrated !== null)) {
                    if (e === null) {
                        if (!s) throw Error(T(318));
                        if (((s = t.memoizedState), (s = s !== null ? s.dehydrated : null), !s))
                            throw Error(T(317));
                        s[lt] = t;
                    } else (qn(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
                    (ve(t), (s = !1));
                } else (qe !== null && (el(qe), (qe = null)), (s = !0));
                if (!s) return t.flags & 65536 ? t : null;
            }
            return t.flags & 128
                ? ((t.lanes = n), t)
                : ((r = r !== null),
                  r !== (e !== null && e.memoizedState !== null) &&
                      r &&
                      ((t.child.flags |= 8192),
                      t.mode & 1 && (e === null || J.current & 1 ? ce === 0 && (ce = 3) : cu())),
                  t.updateQueue !== null && (t.flags |= 4),
                  ve(t),
                  null);
        case 4:
            return (tr(), ba(e, t), e === null && ni(t.stateNode.containerInfo), ve(t), null);
        case 10:
            return (Gl(t.type._context), ve(t), null);
        case 17:
            return (De(t.type) && ks(), ve(t), null);
        case 19:
            if ((Q(J), (s = t.memoizedState), s === null)) return (ve(t), null);
            if (((r = (t.flags & 128) !== 0), (o = s.rendering), o === null))
                if (r) xr(s, !1);
                else {
                    if (ce !== 0 || (e !== null && e.flags & 128))
                        for (e = t.child; e !== null; ) {
                            if (((o = As(e)), o !== null)) {
                                for (
                                    t.flags |= 128,
                                        xr(s, !1),
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
                                return (b(J, (J.current & 1) | 2), t.child);
                            }
                            e = e.sibling;
                        }
                    s.tail !== null &&
                        se() > rr &&
                        ((t.flags |= 128), (r = !0), xr(s, !1), (t.lanes = 4194304));
                }
            else {
                if (!r)
                    if (((e = As(o)), e !== null)) {
                        if (
                            ((t.flags |= 128),
                            (r = !0),
                            (n = e.updateQueue),
                            n !== null && ((t.updateQueue = n), (t.flags |= 4)),
                            xr(s, !0),
                            s.tail === null && s.tailMode === 'hidden' && !o.alternate && !Y)
                        )
                            return (ve(t), null);
                    } else
                        2 * se() - s.renderingStartTime > rr &&
                            n !== 1073741824 &&
                            ((t.flags |= 128), (r = !0), xr(s, !1), (t.lanes = 4194304));
                s.isBackwards
                    ? ((o.sibling = t.child), (t.child = o))
                    : ((n = s.last), n !== null ? (n.sibling = o) : (t.child = o), (s.last = o));
            }
            return s.tail !== null
                ? ((t = s.tail),
                  (s.rendering = t),
                  (s.tail = t.sibling),
                  (s.renderingStartTime = se()),
                  (t.sibling = null),
                  (n = J.current),
                  b(J, r ? (n & 1) | 2 : n & 1),
                  t)
                : (ve(t), null);
        case 22:
        case 23:
            return (
                uu(),
                (r = t.memoizedState !== null),
                e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
                r && t.mode & 1
                    ? Me & 1073741824 && (ve(t), t.subtreeFlags & 6 && (t.flags |= 8192))
                    : ve(t),
                null
            );
        case 24:
            return null;
        case 25:
            return null;
    }
    throw Error(T(156, t.tag));
}
function o0(e, t) {
    switch ((Hl(t), t.tag)) {
        case 1:
            return (
                De(t.type) && ks(),
                (e = t.flags),
                e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 3:
            return (
                tr(),
                Q(Oe),
                Q(Se),
                Jl(),
                (e = t.flags),
                e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 5:
            return (Zl(t), null);
        case 13:
            if ((Q(J), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
                if (t.alternate === null) throw Error(T(340));
                qn();
            }
            return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 19:
            return (Q(J), null);
        case 4:
            return (tr(), null);
        case 10:
            return (Gl(t.type._context), null);
        case 22:
        case 23:
            return (uu(), null);
        case 24:
            return null;
        default:
            return null;
    }
}
var Ui = !1,
    we = !1,
    a0 = typeof WeakSet == 'function' ? WeakSet : Set,
    A = null;
function In(e, t) {
    var n = e.ref;
    if (n !== null)
        if (typeof n == 'function')
            try {
                n(null);
            } catch (r) {
                re(e, t, r);
            }
        else n.current = null;
}
function Ga(e, t, n) {
    try {
        n();
    } catch (r) {
        re(e, t, r);
    }
}
var Qc = !1;
function l0(e, t) {
    if (((Oa = vs), (e = Qh()), $l(e))) {
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
                        f = e,
                        d = null;
                    t: for (;;) {
                        for (
                            var m;
                            f !== n || (i !== 0 && f.nodeType !== 3) || (a = o + i),
                                f !== s || (r !== 0 && f.nodeType !== 3) || (l = o + r),
                                f.nodeType === 3 && (o += f.nodeValue.length),
                                (m = f.firstChild) !== null;
                        )
                            ((d = f), (f = m));
                        for (;;) {
                            if (f === e) break t;
                            if (
                                (d === n && ++u === i && (a = o),
                                d === s && ++c === r && (l = o),
                                (m = f.nextSibling) !== null)
                            )
                                break;
                            ((f = d), (d = f.parentNode));
                        }
                        f = m;
                    }
                    n = a === -1 || l === -1 ? null : { start: a, end: l };
                } else n = null;
            }
        n = n || { start: 0, end: 0 };
    } else n = null;
    for (Da = { focusedElem: e, selectionRange: n }, vs = !1, A = t; A !== null; )
        if (((t = A), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
            ((e.return = t), (A = e));
        else
            for (; A !== null; ) {
                t = A;
                try {
                    var y = t.alternate;
                    if (t.flags & 1024)
                        switch (t.tag) {
                            case 0:
                            case 11:
                            case 15:
                                break;
                            case 1:
                                if (y !== null) {
                                    var v = y.memoizedProps,
                                        S = y.memoizedState,
                                        p = t.stateNode,
                                        h = p.getSnapshotBeforeUpdate(
                                            t.elementType === t.type ? v : Ze(t.type, v),
                                            S,
                                        );
                                    p.__reactInternalSnapshotBeforeUpdate = h;
                                }
                                break;
                            case 3:
                                var g = t.stateNode.containerInfo;
                                g.nodeType === 1
                                    ? (g.textContent = '')
                                    : g.nodeType === 9 &&
                                      g.documentElement &&
                                      g.removeChild(g.documentElement);
                                break;
                            case 5:
                            case 6:
                            case 4:
                            case 17:
                                break;
                            default:
                                throw Error(T(163));
                        }
                } catch (x) {
                    re(t, t.return, x);
                }
                if (((e = t.sibling), e !== null)) {
                    ((e.return = t.return), (A = e));
                    break;
                }
                A = t.return;
            }
    return ((y = Qc), (Qc = !1), y);
}
function Fr(e, t, n) {
    var r = t.updateQueue;
    if (((r = r !== null ? r.lastEffect : null), r !== null)) {
        var i = (r = r.next);
        do {
            if ((i.tag & e) === e) {
                var s = i.destroy;
                ((i.destroy = void 0), s !== void 0 && Ga(t, n, s));
            }
            i = i.next;
        } while (i !== r);
    }
}
function no(e, t) {
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
function Qa(e) {
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
function Wp(e) {
    var t = e.alternate;
    (t !== null && ((e.alternate = null), Wp(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 &&
            ((t = e.stateNode),
            t !== null && (delete t[lt], delete t[ii], delete t[Va], delete t[Wv], delete t[Kv])),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
}
function Kp(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Yc(e) {
    e: for (;;) {
        for (; e.sibling === null; ) {
            if (e.return === null || Kp(e.return)) return null;
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
function Ya(e, t, n) {
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
                  n != null || t.onclick !== null || (t.onclick = Ss)));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (Ya(e, t, n), e = e.sibling; e !== null; ) (Ya(e, t, n), (e = e.sibling));
}
function Xa(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (Xa(e, t, n), e = e.sibling; e !== null; ) (Xa(e, t, n), (e = e.sibling));
}
var pe = null,
    Je = !1;
function Rt(e, t, n) {
    for (n = n.child; n !== null; ) (bp(e, t, n), (n = n.sibling));
}
function bp(e, t, n) {
    if (ft && typeof ft.onCommitFiberUnmount == 'function')
        try {
            ft.onCommitFiberUnmount(Qs, n);
        } catch {}
    switch (n.tag) {
        case 5:
            we || In(n, t);
        case 6:
            var r = pe,
                i = Je;
            ((pe = null),
                Rt(e, t, n),
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
                      e.nodeType === 8 ? Vo(e.parentNode, n) : e.nodeType === 1 && Vo(e, n),
                      qr(e))
                    : Vo(pe, n.stateNode));
            break;
        case 4:
            ((r = pe),
                (i = Je),
                (pe = n.stateNode.containerInfo),
                (Je = !0),
                Rt(e, t, n),
                (pe = r),
                (Je = i));
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            if (!we && ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))) {
                i = r = r.next;
                do {
                    var s = i,
                        o = s.destroy;
                    ((s = s.tag), o !== void 0 && (s & 2 || s & 4) && Ga(n, t, o), (i = i.next));
                } while (i !== r);
            }
            Rt(e, t, n);
            break;
        case 1:
            if (!we && (In(n, t), (r = n.stateNode), typeof r.componentWillUnmount == 'function'))
                try {
                    ((r.props = n.memoizedProps),
                        (r.state = n.memoizedState),
                        r.componentWillUnmount());
                } catch (a) {
                    re(n, t, a);
                }
            Rt(e, t, n);
            break;
        case 21:
            Rt(e, t, n);
            break;
        case 22:
            n.mode & 1
                ? ((we = (r = we) || n.memoizedState !== null), Rt(e, t, n), (we = r))
                : Rt(e, t, n);
            break;
        default:
            Rt(e, t, n);
    }
}
function Xc(e) {
    var t = e.updateQueue;
    if (t !== null) {
        e.updateQueue = null;
        var n = e.stateNode;
        (n === null && (n = e.stateNode = new a0()),
            t.forEach(function (r) {
                var i = y0.bind(null, e, r);
                n.has(r) || (n.add(r), r.then(i, i));
            }));
    }
}
function Ye(e, t) {
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
                (bp(s, o, i), (pe = null), (Je = !1));
                var l = i.alternate;
                (l !== null && (l.return = null), (i.return = null));
            } catch (u) {
                re(i, t, u);
            }
        }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) (Gp(t, e), (t = t.sibling));
}
function Gp(e, t) {
    var n = e.alternate,
        r = e.flags;
    switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            if ((Ye(t, e), ot(e), r & 4)) {
                try {
                    (Fr(3, e, e.return), no(3, e));
                } catch (v) {
                    re(e, e.return, v);
                }
                try {
                    Fr(5, e, e.return);
                } catch (v) {
                    re(e, e.return, v);
                }
            }
            break;
        case 1:
            (Ye(t, e), ot(e), r & 512 && n !== null && In(n, n.return));
            break;
        case 5:
            if ((Ye(t, e), ot(e), r & 512 && n !== null && In(n, n.return), e.flags & 32)) {
                var i = e.stateNode;
                try {
                    Yr(i, '');
                } catch (v) {
                    re(e, e.return, v);
                }
            }
            if (r & 4 && ((i = e.stateNode), i != null)) {
                var s = e.memoizedProps,
                    o = n !== null ? n.memoizedProps : s,
                    a = e.type,
                    l = e.updateQueue;
                if (((e.updateQueue = null), l !== null))
                    try {
                        (a === 'input' && s.type === 'radio' && s.name != null && mh(i, s),
                            wa(a, o));
                        var u = wa(a, s);
                        for (o = 0; o < l.length; o += 2) {
                            var c = l[o],
                                f = l[o + 1];
                            c === 'style'
                                ? wh(i, f)
                                : c === 'dangerouslySetInnerHTML'
                                  ? vh(i, f)
                                  : c === 'children'
                                    ? Yr(i, f)
                                    : Rl(i, c, f, u);
                        }
                        switch (a) {
                            case 'input':
                                ma(i, s);
                                break;
                            case 'textarea':
                                gh(i, s);
                                break;
                            case 'select':
                                var d = i._wrapperState.wasMultiple;
                                i._wrapperState.wasMultiple = !!s.multiple;
                                var m = s.value;
                                m != null
                                    ? Kn(i, !!s.multiple, m, !1)
                                    : d !== !!s.multiple &&
                                      (s.defaultValue != null
                                          ? Kn(i, !!s.multiple, s.defaultValue, !0)
                                          : Kn(i, !!s.multiple, s.multiple ? [] : '', !1));
                        }
                        i[ii] = s;
                    } catch (v) {
                        re(e, e.return, v);
                    }
            }
            break;
        case 6:
            if ((Ye(t, e), ot(e), r & 4)) {
                if (e.stateNode === null) throw Error(T(162));
                ((i = e.stateNode), (s = e.memoizedProps));
                try {
                    i.nodeValue = s;
                } catch (v) {
                    re(e, e.return, v);
                }
            }
            break;
        case 3:
            if ((Ye(t, e), ot(e), r & 4 && n !== null && n.memoizedState.isDehydrated))
                try {
                    qr(t.containerInfo);
                } catch (v) {
                    re(e, e.return, v);
                }
            break;
        case 4:
            (Ye(t, e), ot(e));
            break;
        case 13:
            (Ye(t, e),
                ot(e),
                (i = e.child),
                i.flags & 8192 &&
                    ((s = i.memoizedState !== null),
                    (i.stateNode.isHidden = s),
                    !s ||
                        (i.alternate !== null && i.alternate.memoizedState !== null) ||
                        (au = se())),
                r & 4 && Xc(e));
            break;
        case 22:
            if (
                ((c = n !== null && n.memoizedState !== null),
                e.mode & 1 ? ((we = (u = we) || c), Ye(t, e), (we = u)) : Ye(t, e),
                ot(e),
                r & 8192)
            ) {
                if (
                    ((u = e.memoizedState !== null), (e.stateNode.isHidden = u) && !c && e.mode & 1)
                )
                    for (A = e, c = e.child; c !== null; ) {
                        for (f = A = c; A !== null; ) {
                            switch (((d = A), (m = d.child), d.tag)) {
                                case 0:
                                case 11:
                                case 14:
                                case 15:
                                    Fr(4, d, d.return);
                                    break;
                                case 1:
                                    In(d, d.return);
                                    var y = d.stateNode;
                                    if (typeof y.componentWillUnmount == 'function') {
                                        ((r = d), (n = d.return));
                                        try {
                                            ((t = r),
                                                (y.props = t.memoizedProps),
                                                (y.state = t.memoizedState),
                                                y.componentWillUnmount());
                                        } catch (v) {
                                            re(r, n, v);
                                        }
                                    }
                                    break;
                                case 5:
                                    In(d, d.return);
                                    break;
                                case 22:
                                    if (d.memoizedState !== null) {
                                        Jc(f);
                                        continue;
                                    }
                            }
                            m !== null ? ((m.return = d), (A = m)) : Jc(f);
                        }
                        c = c.sibling;
                    }
                e: for (c = null, f = e; ; ) {
                    if (f.tag === 5) {
                        if (c === null) {
                            c = f;
                            try {
                                ((i = f.stateNode),
                                    u
                                        ? ((s = i.style),
                                          typeof s.setProperty == 'function'
                                              ? s.setProperty('display', 'none', 'important')
                                              : (s.display = 'none'))
                                        : ((a = f.stateNode),
                                          (l = f.memoizedProps.style),
                                          (o =
                                              l != null && l.hasOwnProperty('display')
                                                  ? l.display
                                                  : null),
                                          (a.style.display = xh('display', o))));
                            } catch (v) {
                                re(e, e.return, v);
                            }
                        }
                    } else if (f.tag === 6) {
                        if (c === null)
                            try {
                                f.stateNode.nodeValue = u ? '' : f.memoizedProps;
                            } catch (v) {
                                re(e, e.return, v);
                            }
                    } else if (
                        ((f.tag !== 22 && f.tag !== 23) || f.memoizedState === null || f === e) &&
                        f.child !== null
                    ) {
                        ((f.child.return = f), (f = f.child));
                        continue;
                    }
                    if (f === e) break e;
                    for (; f.sibling === null; ) {
                        if (f.return === null || f.return === e) break e;
                        (c === f && (c = null), (f = f.return));
                    }
                    (c === f && (c = null), (f.sibling.return = f.return), (f = f.sibling));
                }
            }
            break;
        case 19:
            (Ye(t, e), ot(e), r & 4 && Xc(e));
            break;
        case 21:
            break;
        default:
            (Ye(t, e), ot(e));
    }
}
function ot(e) {
    var t = e.flags;
    if (t & 2) {
        try {
            e: {
                for (var n = e.return; n !== null; ) {
                    if (Kp(n)) {
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
                    r.flags & 32 && (Yr(i, ''), (r.flags &= -33));
                    var s = Yc(e);
                    Xa(e, s, i);
                    break;
                case 3:
                case 4:
                    var o = r.stateNode.containerInfo,
                        a = Yc(e);
                    Ya(e, a, o);
                    break;
                default:
                    throw Error(T(161));
            }
        } catch (l) {
            re(e, e.return, l);
        }
        e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
}
function u0(e, t, n) {
    ((A = e), Qp(e));
}
function Qp(e, t, n) {
    for (var r = (e.mode & 1) !== 0; A !== null; ) {
        var i = A,
            s = i.child;
        if (i.tag === 22 && r) {
            var o = i.memoizedState !== null || Ui;
            if (!o) {
                var a = i.alternate,
                    l = (a !== null && a.memoizedState !== null) || we;
                a = Ui;
                var u = we;
                if (((Ui = o), (we = l) && !u))
                    for (A = i; A !== null; )
                        ((o = A),
                            (l = o.child),
                            o.tag === 22 && o.memoizedState !== null
                                ? qc(i)
                                : l !== null
                                  ? ((l.return = o), (A = l))
                                  : qc(i));
                for (; s !== null; ) ((A = s), Qp(s), (s = s.sibling));
                ((A = i), (Ui = a), (we = u));
            }
            Zc(e);
        } else i.subtreeFlags & 8772 && s !== null ? ((s.return = i), (A = s)) : Zc(e);
    }
}
function Zc(e) {
    for (; A !== null; ) {
        var t = A;
        if (t.flags & 8772) {
            var n = t.alternate;
            try {
                if (t.flags & 8772)
                    switch (t.tag) {
                        case 0:
                        case 11:
                        case 15:
                            we || no(5, t);
                            break;
                        case 1:
                            var r = t.stateNode;
                            if (t.flags & 4 && !we)
                                if (n === null) r.componentDidMount();
                                else {
                                    var i =
                                        t.elementType === t.type
                                            ? n.memoizedProps
                                            : Ze(t.type, n.memoizedProps);
                                    r.componentDidUpdate(
                                        i,
                                        n.memoizedState,
                                        r.__reactInternalSnapshotBeforeUpdate,
                                    );
                                }
                            var s = t.updateQueue;
                            s !== null && _c(t, s, r);
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
                                _c(t, o, n);
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
                                        var f = c.dehydrated;
                                        f !== null && qr(f);
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
                we || (t.flags & 512 && Qa(t));
            } catch (d) {
                re(t, t.return, d);
            }
        }
        if (t === e) {
            A = null;
            break;
        }
        if (((n = t.sibling), n !== null)) {
            ((n.return = t.return), (A = n));
            break;
        }
        A = t.return;
    }
}
function Jc(e) {
    for (; A !== null; ) {
        var t = A;
        if (t === e) {
            A = null;
            break;
        }
        var n = t.sibling;
        if (n !== null) {
            ((n.return = t.return), (A = n));
            break;
        }
        A = t.return;
    }
}
function qc(e) {
    for (; A !== null; ) {
        var t = A;
        try {
            switch (t.tag) {
                case 0:
                case 11:
                case 15:
                    var n = t.return;
                    try {
                        no(4, t);
                    } catch (l) {
                        re(t, n, l);
                    }
                    break;
                case 1:
                    var r = t.stateNode;
                    if (typeof r.componentDidMount == 'function') {
                        var i = t.return;
                        try {
                            r.componentDidMount();
                        } catch (l) {
                            re(t, i, l);
                        }
                    }
                    var s = t.return;
                    try {
                        Qa(t);
                    } catch (l) {
                        re(t, s, l);
                    }
                    break;
                case 5:
                    var o = t.return;
                    try {
                        Qa(t);
                    } catch (l) {
                        re(t, o, l);
                    }
            }
        } catch (l) {
            re(t, t.return, l);
        }
        if (t === e) {
            A = null;
            break;
        }
        var a = t.sibling;
        if (a !== null) {
            ((a.return = t.return), (A = a));
            break;
        }
        A = t.return;
    }
}
var c0 = Math.ceil,
    Ns = Lt.ReactCurrentDispatcher,
    su = Lt.ReactCurrentOwner,
    be = Lt.ReactCurrentBatchConfig,
    $ = 0,
    he = null,
    ae = null,
    me = 0,
    Me = 0,
    zn = Yt(0),
    ce = 0,
    ci = null,
    gn = 0,
    ro = 0,
    ou = 0,
    Ir = null,
    Re = null,
    au = 0,
    rr = 1 / 0,
    gt = null,
    Ms = !1,
    Za = null,
    Ut = null,
    Hi = !1,
    jt = null,
    Vs = 0,
    zr = 0,
    Ja = null,
    ss = -1,
    os = 0;
function Pe() {
    return $ & 6 ? se() : ss !== -1 ? ss : (ss = se());
}
function Ht(e) {
    return e.mode & 1
        ? $ & 2 && me !== 0
            ? me & -me
            : Gv.transition !== null
              ? (os === 0 && (os = Nh()), os)
              : ((e = W), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : zh(e.type))), e)
        : 1;
}
function tt(e, t, n, r) {
    if (50 < zr) throw ((zr = 0), (Ja = null), Error(T(185)));
    (yi(e, n, r),
        (!($ & 2) || e !== he) &&
            (e === he && (!($ & 2) && (ro |= n), ce === 4 && Vt(e, me)),
            Ne(e, r),
            n === 1 && $ === 0 && !(t.mode & 1) && ((rr = se() + 500), qs && Xt())));
}
function Ne(e, t) {
    var n = e.callbackNode;
    Gy(e, t);
    var r = ys(e, e === he ? me : 0);
    if (r === 0) (n !== null && lc(n), (e.callbackNode = null), (e.callbackPriority = 0));
    else if (((t = r & -r), e.callbackPriority !== t)) {
        if ((n != null && lc(n), t === 1))
            (e.tag === 0 ? bv(ef.bind(null, e)) : ip(ef.bind(null, e)),
                Uv(function () {
                    !($ & 6) && Xt();
                }),
                (n = null));
        else {
            switch (Mh(r)) {
                case 1:
                    n = Ml;
                    break;
                case 4:
                    n = Oh;
                    break;
                case 16:
                    n = gs;
                    break;
                case 536870912:
                    n = Dh;
                    break;
                default:
                    n = gs;
            }
            n = nm(n, Yp.bind(null, e));
        }
        ((e.callbackPriority = t), (e.callbackNode = n));
    }
}
function Yp(e, t) {
    if (((ss = -1), (os = 0), $ & 6)) throw Error(T(327));
    var n = e.callbackNode;
    if (Xn() && e.callbackNode !== n) return null;
    var r = ys(e, e === he ? me : 0);
    if (r === 0) return null;
    if (r & 30 || r & e.expiredLanes || t) t = _s(e, r);
    else {
        t = r;
        var i = $;
        $ |= 2;
        var s = Zp();
        (he !== e || me !== t) && ((gt = null), (rr = se() + 500), cn(e, t));
        do
            try {
                h0();
                break;
            } catch (a) {
                Xp(e, a);
            }
        while (!0);
        (bl(),
            (Ns.current = s),
            ($ = i),
            ae !== null ? (t = 0) : ((he = null), (me = 0), (t = ce)));
    }
    if (t !== 0) {
        if ((t === 2 && ((i = Ta(e)), i !== 0 && ((r = i), (t = qa(e, i)))), t === 1))
            throw ((n = ci), cn(e, 0), Vt(e, r), Ne(e, se()), n);
        if (t === 6) Vt(e, r);
        else {
            if (
                ((i = e.current.alternate),
                !(r & 30) &&
                    !f0(i) &&
                    ((t = _s(e, r)),
                    t === 2 && ((s = Ta(e)), s !== 0 && ((r = s), (t = qa(e, s)))),
                    t === 1))
            )
                throw ((n = ci), cn(e, 0), Vt(e, r), Ne(e, se()), n);
            switch (((e.finishedWork = i), (e.finishedLanes = r), t)) {
                case 0:
                case 1:
                    throw Error(T(345));
                case 2:
                    tn(e, Re, gt);
                    break;
                case 3:
                    if ((Vt(e, r), (r & 130023424) === r && ((t = au + 500 - se()), 10 < t))) {
                        if (ys(e, 0) !== 0) break;
                        if (((i = e.suspendedLanes), (i & r) !== r)) {
                            (Pe(), (e.pingedLanes |= e.suspendedLanes & i));
                            break;
                        }
                        e.timeoutHandle = Ma(tn.bind(null, e, Re, gt), t);
                        break;
                    }
                    tn(e, Re, gt);
                    break;
                case 4:
                    if ((Vt(e, r), (r & 4194240) === r)) break;
                    for (t = e.eventTimes, i = -1; 0 < r; ) {
                        var o = 31 - et(r);
                        ((s = 1 << o), (o = t[o]), o > i && (i = o), (r &= ~s));
                    }
                    if (
                        ((r = i),
                        (r = se() - r),
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
                                          : 1960 * c0(r / 1960)) - r),
                        10 < r)
                    ) {
                        e.timeoutHandle = Ma(tn.bind(null, e, Re, gt), r);
                        break;
                    }
                    tn(e, Re, gt);
                    break;
                case 5:
                    tn(e, Re, gt);
                    break;
                default:
                    throw Error(T(329));
            }
        }
    }
    return (Ne(e, se()), e.callbackNode === n ? Yp.bind(null, e) : null);
}
function qa(e, t) {
    var n = Ir;
    return (
        e.current.memoizedState.isDehydrated && (cn(e, t).flags |= 256),
        (e = _s(e, t)),
        e !== 2 && ((t = Re), (Re = n), t !== null && el(t)),
        e
    );
}
function el(e) {
    Re === null ? (Re = e) : Re.push.apply(Re, e);
}
function f0(e) {
    for (var t = e; ; ) {
        if (t.flags & 16384) {
            var n = t.updateQueue;
            if (n !== null && ((n = n.stores), n !== null))
                for (var r = 0; r < n.length; r++) {
                    var i = n[r],
                        s = i.getSnapshot;
                    i = i.value;
                    try {
                        if (!nt(s(), i)) return !1;
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
function Vt(e, t) {
    for (
        t &= ~ou, t &= ~ro, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes;
        0 < t;
    ) {
        var n = 31 - et(t),
            r = 1 << n;
        ((e[n] = -1), (t &= ~r));
    }
}
function ef(e) {
    if ($ & 6) throw Error(T(327));
    Xn();
    var t = ys(e, 0);
    if (!(t & 1)) return (Ne(e, se()), null);
    var n = _s(e, t);
    if (e.tag !== 0 && n === 2) {
        var r = Ta(e);
        r !== 0 && ((t = r), (n = qa(e, r)));
    }
    if (n === 1) throw ((n = ci), cn(e, 0), Vt(e, t), Ne(e, se()), n);
    if (n === 6) throw Error(T(345));
    return (
        (e.finishedWork = e.current.alternate),
        (e.finishedLanes = t),
        tn(e, Re, gt),
        Ne(e, se()),
        null
    );
}
function lu(e, t) {
    var n = $;
    $ |= 1;
    try {
        return e(t);
    } finally {
        (($ = n), $ === 0 && ((rr = se() + 500), qs && Xt()));
    }
}
function yn(e) {
    jt !== null && jt.tag === 0 && !($ & 6) && Xn();
    var t = $;
    $ |= 1;
    var n = be.transition,
        r = W;
    try {
        if (((be.transition = null), (W = 1), e)) return e();
    } finally {
        ((W = r), (be.transition = n), ($ = t), !($ & 6) && Xt());
    }
}
function uu() {
    ((Me = zn.current), Q(zn));
}
function cn(e, t) {
    ((e.finishedWork = null), (e.finishedLanes = 0));
    var n = e.timeoutHandle;
    if ((n !== -1 && ((e.timeoutHandle = -1), $v(n)), ae !== null))
        for (n = ae.return; n !== null; ) {
            var r = n;
            switch ((Hl(r), r.tag)) {
                case 1:
                    ((r = r.type.childContextTypes), r != null && ks());
                    break;
                case 3:
                    (tr(), Q(Oe), Q(Se), Jl());
                    break;
                case 5:
                    Zl(r);
                    break;
                case 4:
                    tr();
                    break;
                case 13:
                    Q(J);
                    break;
                case 19:
                    Q(J);
                    break;
                case 10:
                    Gl(r.type._context);
                    break;
                case 22:
                case 23:
                    uu();
            }
            n = n.return;
        }
    if (
        ((he = e),
        (ae = e = Wt(e.current, null)),
        (me = Me = t),
        (ce = 0),
        (ci = null),
        (ou = ro = gn = 0),
        (Re = Ir = null),
        on !== null)
    ) {
        for (t = 0; t < on.length; t++)
            if (((n = on[t]), (r = n.interleaved), r !== null)) {
                n.interleaved = null;
                var i = r.next,
                    s = n.pending;
                if (s !== null) {
                    var o = s.next;
                    ((s.next = i), (r.next = o));
                }
                n.pending = r;
            }
        on = null;
    }
    return e;
}
function Xp(e, t) {
    do {
        var n = ae;
        try {
            if ((bl(), (ns.current = Ds), Os)) {
                for (var r = ee.memoizedState; r !== null; ) {
                    var i = r.queue;
                    (i !== null && (i.pending = null), (r = r.next));
                }
                Os = !1;
            }
            if (
                ((mn = 0),
                (fe = ue = ee = null),
                (jr = !1),
                (ai = 0),
                (su.current = null),
                n === null || n.return === null)
            ) {
                ((ce = 1), (ci = t), (ae = null));
                break;
            }
            e: {
                var s = e,
                    o = n.return,
                    a = n,
                    l = t;
                if (
                    ((t = me),
                    (a.flags |= 32768),
                    l !== null && typeof l == 'object' && typeof l.then == 'function')
                ) {
                    var u = l,
                        c = a,
                        f = c.tag;
                    if (!(c.mode & 1) && (f === 0 || f === 11 || f === 15)) {
                        var d = c.alternate;
                        d
                            ? ((c.updateQueue = d.updateQueue),
                              (c.memoizedState = d.memoizedState),
                              (c.lanes = d.lanes))
                            : ((c.updateQueue = null), (c.memoizedState = null));
                    }
                    var m = $c(o);
                    if (m !== null) {
                        ((m.flags &= -257),
                            Uc(m, o, a, s, t),
                            m.mode & 1 && Bc(s, u, t),
                            (t = m),
                            (l = u));
                        var y = t.updateQueue;
                        if (y === null) {
                            var v = new Set();
                            (v.add(l), (t.updateQueue = v));
                        } else y.add(l);
                        break e;
                    } else {
                        if (!(t & 1)) {
                            (Bc(s, u, t), cu());
                            break e;
                        }
                        l = Error(T(426));
                    }
                } else if (Y && a.mode & 1) {
                    var S = $c(o);
                    if (S !== null) {
                        (!(S.flags & 65536) && (S.flags |= 256), Uc(S, o, a, s, t), Wl(nr(l, a)));
                        break e;
                    }
                }
                ((s = l = nr(l, a)),
                    ce !== 4 && (ce = 2),
                    Ir === null ? (Ir = [s]) : Ir.push(s),
                    (s = o));
                do {
                    switch (s.tag) {
                        case 3:
                            ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
                            var p = Mp(s, l, t);
                            Vc(s, p);
                            break e;
                        case 1:
                            a = l;
                            var h = s.type,
                                g = s.stateNode;
                            if (
                                !(s.flags & 128) &&
                                (typeof h.getDerivedStateFromError == 'function' ||
                                    (g !== null &&
                                        typeof g.componentDidCatch == 'function' &&
                                        (Ut === null || !Ut.has(g))))
                            ) {
                                ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
                                var x = Vp(s, a, t);
                                Vc(s, x);
                                break e;
                            }
                    }
                    s = s.return;
                } while (s !== null);
            }
            qp(n);
        } catch (w) {
            ((t = w), ae === n && n !== null && (ae = n = n.return));
            continue;
        }
        break;
    } while (!0);
}
function Zp() {
    var e = Ns.current;
    return ((Ns.current = Ds), e === null ? Ds : e);
}
function cu() {
    ((ce === 0 || ce === 3 || ce === 2) && (ce = 4),
        he === null || (!(gn & 268435455) && !(ro & 268435455)) || Vt(he, me));
}
function _s(e, t) {
    var n = $;
    $ |= 2;
    var r = Zp();
    (he !== e || me !== t) && ((gt = null), cn(e, t));
    do
        try {
            d0();
            break;
        } catch (i) {
            Xp(e, i);
        }
    while (!0);
    if ((bl(), ($ = n), (Ns.current = r), ae !== null)) throw Error(T(261));
    return ((he = null), (me = 0), ce);
}
function d0() {
    for (; ae !== null; ) Jp(ae);
}
function h0() {
    for (; ae !== null && !Iy(); ) Jp(ae);
}
function Jp(e) {
    var t = tm(e.alternate, e, Me);
    ((e.memoizedProps = e.pendingProps), t === null ? qp(e) : (ae = t), (su.current = null));
}
function qp(e) {
    var t = e;
    do {
        var n = t.alternate;
        if (((e = t.return), t.flags & 32768)) {
            if (((n = o0(n, t)), n !== null)) {
                ((n.flags &= 32767), (ae = n));
                return;
            }
            if (e !== null) ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
            else {
                ((ce = 6), (ae = null));
                return;
            }
        } else if (((n = s0(n, t, Me)), n !== null)) {
            ae = n;
            return;
        }
        if (((t = t.sibling), t !== null)) {
            ae = t;
            return;
        }
        ae = t = e;
    } while (t !== null);
    ce === 0 && (ce = 5);
}
function tn(e, t, n) {
    var r = W,
        i = be.transition;
    try {
        ((be.transition = null), (W = 1), p0(e, t, n, r));
    } finally {
        ((be.transition = i), (W = r));
    }
    return null;
}
function p0(e, t, n, r) {
    do Xn();
    while (jt !== null);
    if ($ & 6) throw Error(T(327));
    n = e.finishedWork;
    var i = e.finishedLanes;
    if (n === null) return null;
    if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current)) throw Error(T(177));
    ((e.callbackNode = null), (e.callbackPriority = 0));
    var s = n.lanes | n.childLanes;
    if (
        (Qy(e, s),
        e === he && ((ae = he = null), (me = 0)),
        (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
            Hi ||
            ((Hi = !0),
            nm(gs, function () {
                return (Xn(), null);
            })),
        (s = (n.flags & 15990) !== 0),
        n.subtreeFlags & 15990 || s)
    ) {
        ((s = be.transition), (be.transition = null));
        var o = W;
        W = 1;
        var a = $;
        (($ |= 4),
            (su.current = null),
            l0(e, n),
            Gp(n, e),
            Vv(Da),
            (vs = !!Oa),
            (Da = Oa = null),
            (e.current = n),
            u0(n),
            zy(),
            ($ = a),
            (W = o),
            (be.transition = s));
    } else e.current = n;
    if (
        (Hi && ((Hi = !1), (jt = e), (Vs = i)),
        (s = e.pendingLanes),
        s === 0 && (Ut = null),
        Uy(n.stateNode),
        Ne(e, se()),
        t !== null)
    )
        for (r = e.onRecoverableError, n = 0; n < t.length; n++)
            ((i = t[n]), r(i.value, { componentStack: i.stack, digest: i.digest }));
    if (Ms) throw ((Ms = !1), (e = Za), (Za = null), e);
    return (
        Vs & 1 && e.tag !== 0 && Xn(),
        (s = e.pendingLanes),
        s & 1 ? (e === Ja ? zr++ : ((zr = 0), (Ja = e))) : (zr = 0),
        Xt(),
        null
    );
}
function Xn() {
    if (jt !== null) {
        var e = Mh(Vs),
            t = be.transition,
            n = W;
        try {
            if (((be.transition = null), (W = 16 > e ? 16 : e), jt === null)) var r = !1;
            else {
                if (((e = jt), (jt = null), (Vs = 0), $ & 6)) throw Error(T(331));
                var i = $;
                for ($ |= 4, A = e.current; A !== null; ) {
                    var s = A,
                        o = s.child;
                    if (A.flags & 16) {
                        var a = s.deletions;
                        if (a !== null) {
                            for (var l = 0; l < a.length; l++) {
                                var u = a[l];
                                for (A = u; A !== null; ) {
                                    var c = A;
                                    switch (c.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            Fr(8, c, s);
                                    }
                                    var f = c.child;
                                    if (f !== null) ((f.return = c), (A = f));
                                    else
                                        for (; A !== null; ) {
                                            c = A;
                                            var d = c.sibling,
                                                m = c.return;
                                            if ((Wp(c), c === u)) {
                                                A = null;
                                                break;
                                            }
                                            if (d !== null) {
                                                ((d.return = m), (A = d));
                                                break;
                                            }
                                            A = m;
                                        }
                                }
                            }
                            var y = s.alternate;
                            if (y !== null) {
                                var v = y.child;
                                if (v !== null) {
                                    y.child = null;
                                    do {
                                        var S = v.sibling;
                                        ((v.sibling = null), (v = S));
                                    } while (v !== null);
                                }
                            }
                            A = s;
                        }
                    }
                    if (s.subtreeFlags & 2064 && o !== null) ((o.return = s), (A = o));
                    else
                        e: for (; A !== null; ) {
                            if (((s = A), s.flags & 2048))
                                switch (s.tag) {
                                    case 0:
                                    case 11:
                                    case 15:
                                        Fr(9, s, s.return);
                                }
                            var p = s.sibling;
                            if (p !== null) {
                                ((p.return = s.return), (A = p));
                                break e;
                            }
                            A = s.return;
                        }
                }
                var h = e.current;
                for (A = h; A !== null; ) {
                    o = A;
                    var g = o.child;
                    if (o.subtreeFlags & 2064 && g !== null) ((g.return = o), (A = g));
                    else
                        e: for (o = h; A !== null; ) {
                            if (((a = A), a.flags & 2048))
                                try {
                                    switch (a.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            no(9, a);
                                    }
                                } catch (w) {
                                    re(a, a.return, w);
                                }
                            if (a === o) {
                                A = null;
                                break e;
                            }
                            var x = a.sibling;
                            if (x !== null) {
                                ((x.return = a.return), (A = x));
                                break e;
                            }
                            A = a.return;
                        }
                }
                if ((($ = i), Xt(), ft && typeof ft.onPostCommitFiberRoot == 'function'))
                    try {
                        ft.onPostCommitFiberRoot(Qs, e);
                    } catch {}
                r = !0;
            }
            return r;
        } finally {
            ((W = n), (be.transition = t));
        }
    }
    return !1;
}
function tf(e, t, n) {
    ((t = nr(n, t)),
        (t = Mp(e, t, 1)),
        (e = $t(e, t, 1)),
        (t = Pe()),
        e !== null && (yi(e, 1, t), Ne(e, t)));
}
function re(e, t, n) {
    if (e.tag === 3) tf(e, e, n);
    else
        for (; t !== null; ) {
            if (t.tag === 3) {
                tf(t, e, n);
                break;
            } else if (t.tag === 1) {
                var r = t.stateNode;
                if (
                    typeof t.type.getDerivedStateFromError == 'function' ||
                    (typeof r.componentDidCatch == 'function' && (Ut === null || !Ut.has(r)))
                ) {
                    ((e = nr(n, e)),
                        (e = Vp(t, e, 1)),
                        (t = $t(t, e, 1)),
                        (e = Pe()),
                        t !== null && (yi(t, 1, e), Ne(t, e)));
                    break;
                }
            }
            t = t.return;
        }
}
function m0(e, t, n) {
    var r = e.pingCache;
    (r !== null && r.delete(t),
        (t = Pe()),
        (e.pingedLanes |= e.suspendedLanes & n),
        he === e &&
            (me & n) === n &&
            (ce === 4 || (ce === 3 && (me & 130023424) === me && 500 > se() - au)
                ? cn(e, 0)
                : (ou |= n)),
        Ne(e, t));
}
function em(e, t) {
    t === 0 && (e.mode & 1 ? ((t = Mi), (Mi <<= 1), !(Mi & 130023424) && (Mi = 4194304)) : (t = 1));
    var n = Pe();
    ((e = Tt(e, t)), e !== null && (yi(e, t, n), Ne(e, n)));
}
function g0(e) {
    var t = e.memoizedState,
        n = 0;
    (t !== null && (n = t.retryLane), em(e, n));
}
function y0(e, t) {
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
    (r !== null && r.delete(t), em(e, n));
}
var tm;
tm = function (e, t, n) {
    if (e !== null)
        if (e.memoizedProps !== t.pendingProps || Oe.current) Ae = !0;
        else {
            if (!(e.lanes & n) && !(t.flags & 128)) return ((Ae = !1), i0(e, t, n));
            Ae = !!(e.flags & 131072);
        }
    else ((Ae = !1), Y && t.flags & 1048576 && sp(t, Ts, t.index));
    switch (((t.lanes = 0), t.tag)) {
        case 2:
            var r = t.type;
            (is(e, t), (e = t.pendingProps));
            var i = Jn(t, Se.current);
            (Yn(t, n), (i = eu(null, t, r, e, i, n)));
            var s = tu();
            return (
                (t.flags |= 1),
                typeof i == 'object' &&
                i !== null &&
                typeof i.render == 'function' &&
                i.$$typeof === void 0
                    ? ((t.tag = 1),
                      (t.memoizedState = null),
                      (t.updateQueue = null),
                      De(r) ? ((s = !0), Ps(t)) : (s = !1),
                      (t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null),
                      Yl(t),
                      (i.updater = to),
                      (t.stateNode = i),
                      (i._reactInternals = t),
                      Ba(t, r, e, n),
                      (t = Ha(null, t, r, !0, s, n)))
                    : ((t.tag = 0), Y && s && Ul(t), ke(null, t, i, n), (t = t.child)),
                t
            );
        case 16:
            r = t.elementType;
            e: {
                switch (
                    (is(e, t),
                    (e = t.pendingProps),
                    (i = r._init),
                    (r = i(r._payload)),
                    (t.type = r),
                    (i = t.tag = x0(r)),
                    (e = Ze(r, e)),
                    i)
                ) {
                    case 0:
                        t = Ua(null, t, r, e, n);
                        break e;
                    case 1:
                        t = Kc(null, t, r, e, n);
                        break e;
                    case 11:
                        t = Hc(null, t, r, e, n);
                        break e;
                    case 14:
                        t = Wc(null, t, r, Ze(r.type, e), n);
                        break e;
                }
                throw Error(T(306, r, ''));
            }
            return t;
        case 0:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Ze(r, i)),
                Ua(e, t, r, i, n)
            );
        case 1:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Ze(r, i)),
                Kc(e, t, r, i, n)
            );
        case 3:
            e: {
                if ((Ip(t), e === null)) throw Error(T(387));
                ((r = t.pendingProps),
                    (s = t.memoizedState),
                    (i = s.element),
                    fp(e, t),
                    Rs(t, r, null, n));
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
                        ((i = nr(Error(T(423)), t)), (t = bc(e, t, r, n, i)));
                        break e;
                    } else if (r !== i) {
                        ((i = nr(Error(T(424)), t)), (t = bc(e, t, r, n, i)));
                        break e;
                    } else
                        for (
                            Ve = Bt(t.stateNode.containerInfo.firstChild),
                                _e = t,
                                Y = !0,
                                qe = null,
                                n = up(t, null, r, n),
                                t.child = n;
                            n;
                        )
                            ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
                else {
                    if ((qn(), r === i)) {
                        t = Et(e, t, n);
                        break e;
                    }
                    ke(e, t, r, n);
                }
                t = t.child;
            }
            return t;
        case 5:
            return (
                dp(t),
                e === null && Fa(t),
                (r = t.type),
                (i = t.pendingProps),
                (s = e !== null ? e.memoizedProps : null),
                (o = i.children),
                Na(r, i) ? (o = null) : s !== null && Na(r, s) && (t.flags |= 32),
                Fp(e, t),
                ke(e, t, o, n),
                t.child
            );
        case 6:
            return (e === null && Fa(t), null);
        case 13:
            return zp(e, t, n);
        case 4:
            return (
                Xl(t, t.stateNode.containerInfo),
                (r = t.pendingProps),
                e === null ? (t.child = er(t, null, r, n)) : ke(e, t, r, n),
                t.child
            );
        case 11:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Ze(r, i)),
                Hc(e, t, r, i, n)
            );
        case 7:
            return (ke(e, t, t.pendingProps, n), t.child);
        case 8:
            return (ke(e, t, t.pendingProps.children, n), t.child);
        case 12:
            return (ke(e, t, t.pendingProps.children, n), t.child);
        case 10:
            e: {
                if (
                    ((r = t.type._context),
                    (i = t.pendingProps),
                    (s = t.memoizedProps),
                    (o = i.value),
                    b(Es, r._currentValue),
                    (r._currentValue = o),
                    s !== null)
                )
                    if (nt(s.value, o)) {
                        if (s.children === i.children && !Oe.current) {
                            t = Et(e, t, n);
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
                                            ((l = wt(-1, n & -n)), (l.tag = 2));
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
                                            Ia(s.return, n, t),
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
                                    Ia(o, n, t),
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
                (ke(e, t, i.children, n), (t = t.child));
            }
            return t;
        case 9:
            return (
                (i = t.type),
                (r = t.pendingProps.children),
                Yn(t, n),
                (i = Ge(i)),
                (r = r(i)),
                (t.flags |= 1),
                ke(e, t, r, n),
                t.child
            );
        case 14:
            return (
                (r = t.type),
                (i = Ze(r, t.pendingProps)),
                (i = Ze(r.type, i)),
                Wc(e, t, r, i, n)
            );
        case 15:
            return _p(e, t, t.type, t.pendingProps, n);
        case 17:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Ze(r, i)),
                is(e, t),
                (t.tag = 1),
                De(r) ? ((e = !0), Ps(t)) : (e = !1),
                Yn(t, n),
                Np(t, r, i),
                Ba(t, r, i, n),
                Ha(null, t, r, !0, e, n)
            );
        case 19:
            return Bp(e, t, n);
        case 22:
            return jp(e, t, n);
    }
    throw Error(T(156, t.tag));
};
function nm(e, t) {
    return Ah(e, t);
}
function v0(e, t, n, r) {
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
    return new v0(e, t, n, r);
}
function fu(e) {
    return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function x0(e) {
    if (typeof e == 'function') return fu(e) ? 1 : 0;
    if (e != null) {
        if (((e = e.$$typeof), e === Ol)) return 11;
        if (e === Dl) return 14;
    }
    return 2;
}
function Wt(e, t) {
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
function as(e, t, n, r, i, s) {
    var o = 2;
    if (((r = e), typeof e == 'function')) fu(e) && (o = 1);
    else if (typeof e == 'string') o = 5;
    else
        e: switch (e) {
            case An:
                return fn(n.children, i, s, t);
            case Al:
                ((o = 8), (i |= 8));
                break;
            case ca:
                return ((e = Ke(12, n, t, i | 2)), (e.elementType = ca), (e.lanes = s), e);
            case fa:
                return ((e = Ke(13, n, t, i)), (e.elementType = fa), (e.lanes = s), e);
            case da:
                return ((e = Ke(19, n, t, i)), (e.elementType = da), (e.lanes = s), e);
            case dh:
                return io(n, i, s, t);
            default:
                if (typeof e == 'object' && e !== null)
                    switch (e.$$typeof) {
                        case ch:
                            o = 10;
                            break e;
                        case fh:
                            o = 9;
                            break e;
                        case Ol:
                            o = 11;
                            break e;
                        case Dl:
                            o = 14;
                            break e;
                        case Dt:
                            ((o = 16), (r = null));
                            break e;
                    }
                throw Error(T(130, e == null ? e : typeof e, ''));
        }
    return ((t = Ke(o, n, t, i)), (t.elementType = e), (t.type = r), (t.lanes = s), t);
}
function fn(e, t, n, r) {
    return ((e = Ke(7, e, r, t)), (e.lanes = n), e);
}
function io(e, t, n, r) {
    return (
        (e = Ke(22, e, r, t)),
        (e.elementType = dh),
        (e.lanes = n),
        (e.stateNode = { isHidden: !1 }),
        e
    );
}
function Uo(e, t, n) {
    return ((e = Ke(6, e, null, t)), (e.lanes = n), e);
}
function Ho(e, t, n) {
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
function w0(e, t, n, r, i) {
    ((this.tag = t),
        (this.containerInfo = e),
        (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode = this.pendingContext = this.context = null),
        (this.callbackPriority = 0),
        (this.eventTimes = Po(0)),
        (this.expirationTimes = Po(-1)),
        (this.entangledLanes =
            this.finishedLanes =
            this.mutableReadLanes =
            this.expiredLanes =
            this.pingedLanes =
            this.suspendedLanes =
            this.pendingLanes =
                0),
        (this.entanglements = Po(0)),
        (this.identifierPrefix = r),
        (this.onRecoverableError = i),
        (this.mutableSourceEagerHydrationData = null));
}
function du(e, t, n, r, i, s, o, a, l) {
    return (
        (e = new w0(e, t, n, a, l)),
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
        Yl(s),
        e
    );
}
function S0(e, t, n) {
    var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
        $$typeof: Rn,
        key: r == null ? null : '' + r,
        children: e,
        containerInfo: t,
        implementation: n,
    };
}
function rm(e) {
    if (!e) return bt;
    e = e._reactInternals;
    e: {
        if (Sn(e) !== e || e.tag !== 1) throw Error(T(170));
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
        if (De(n)) return rp(e, n, t);
    }
    return t;
}
function im(e, t, n, r, i, s, o, a, l) {
    return (
        (e = du(n, r, !0, e, i, s, o, a, l)),
        (e.context = rm(null)),
        (n = e.current),
        (r = Pe()),
        (i = Ht(n)),
        (s = wt(r, i)),
        (s.callback = t ?? null),
        $t(n, s, i),
        (e.current.lanes = i),
        yi(e, i, r),
        Ne(e, r),
        e
    );
}
function so(e, t, n, r) {
    var i = t.current,
        s = Pe(),
        o = Ht(i);
    return (
        (n = rm(n)),
        t.context === null ? (t.context = n) : (t.pendingContext = n),
        (t = wt(s, o)),
        (t.payload = { element: e }),
        (r = r === void 0 ? null : r),
        r !== null && (t.callback = r),
        (e = $t(i, t, o)),
        e !== null && (tt(e, i, o, s), ts(e, i, o)),
        o
    );
}
function js(e) {
    if (((e = e.current), !e.child)) return null;
    switch (e.child.tag) {
        case 5:
            return e.child.stateNode;
        default:
            return e.child.stateNode;
    }
}
function nf(e, t) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
    }
}
function hu(e, t) {
    (nf(e, t), (e = e.alternate) && nf(e, t));
}
function k0() {
    return null;
}
var sm =
    typeof reportError == 'function'
        ? reportError
        : function (e) {
              console.error(e);
          };
function pu(e) {
    this._internalRoot = e;
}
oo.prototype.render = pu.prototype.render = function (e) {
    var t = this._internalRoot;
    if (t === null) throw Error(T(409));
    so(e, t, null, null);
};
oo.prototype.unmount = pu.prototype.unmount = function () {
    var e = this._internalRoot;
    if (e !== null) {
        this._internalRoot = null;
        var t = e.containerInfo;
        (yn(function () {
            so(null, e, null, null);
        }),
            (t[Ct] = null));
    }
};
function oo(e) {
    this._internalRoot = e;
}
oo.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
        var t = jh();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < Mt.length && t !== 0 && t < Mt[n].priority; n++);
        (Mt.splice(n, 0, e), n === 0 && Ih(e));
    }
};
function mu(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function ao(e) {
    return !(
        !e ||
        (e.nodeType !== 1 &&
            e.nodeType !== 9 &&
            e.nodeType !== 11 &&
            (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
    );
}
function rf() {}
function P0(e, t, n, r, i) {
    if (i) {
        if (typeof r == 'function') {
            var s = r;
            r = function () {
                var u = js(o);
                s.call(u);
            };
        }
        var o = im(t, r, e, 0, null, !1, !1, '', rf);
        return (
            (e._reactRootContainer = o),
            (e[Ct] = o.current),
            ni(e.nodeType === 8 ? e.parentNode : e),
            yn(),
            o
        );
    }
    for (; (i = e.lastChild); ) e.removeChild(i);
    if (typeof r == 'function') {
        var a = r;
        r = function () {
            var u = js(l);
            a.call(u);
        };
    }
    var l = du(e, 0, !1, null, null, !1, !1, '', rf);
    return (
        (e._reactRootContainer = l),
        (e[Ct] = l.current),
        ni(e.nodeType === 8 ? e.parentNode : e),
        yn(function () {
            so(t, l, n, r);
        }),
        l
    );
}
function lo(e, t, n, r, i) {
    var s = n._reactRootContainer;
    if (s) {
        var o = s;
        if (typeof i == 'function') {
            var a = i;
            i = function () {
                var l = js(o);
                a.call(l);
            };
        }
        so(t, o, e, i);
    } else o = P0(n, t, e, i, r);
    return js(o);
}
Vh = function (e) {
    switch (e.tag) {
        case 3:
            var t = e.stateNode;
            if (t.current.memoizedState.isDehydrated) {
                var n = Er(t.pendingLanes);
                n !== 0 && (Vl(t, n | 1), Ne(t, se()), !($ & 6) && ((rr = se() + 500), Xt()));
            }
            break;
        case 13:
            (yn(function () {
                var r = Tt(e, 1);
                if (r !== null) {
                    var i = Pe();
                    tt(r, e, 1, i);
                }
            }),
                hu(e, 1));
    }
};
_l = function (e) {
    if (e.tag === 13) {
        var t = Tt(e, 134217728);
        if (t !== null) {
            var n = Pe();
            tt(t, e, 134217728, n);
        }
        hu(e, 134217728);
    }
};
_h = function (e) {
    if (e.tag === 13) {
        var t = Ht(e),
            n = Tt(e, t);
        if (n !== null) {
            var r = Pe();
            tt(n, e, t, r);
        }
        hu(e, t);
    }
};
jh = function () {
    return W;
};
Fh = function (e, t) {
    var n = W;
    try {
        return ((W = e), t());
    } finally {
        W = n;
    }
};
ka = function (e, t, n) {
    switch (t) {
        case 'input':
            if ((ma(e, n), (t = n.name), n.type === 'radio' && t != null)) {
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
                        var i = Js(r);
                        if (!i) throw Error(T(90));
                        (ph(r), ma(r, i));
                    }
                }
            }
            break;
        case 'textarea':
            gh(e, n);
            break;
        case 'select':
            ((t = n.value), t != null && Kn(e, !!n.multiple, t, !1));
    }
};
Ph = lu;
Ch = yn;
var C0 = { usingClientEntryPoint: !1, Events: [xi, Mn, Js, Sh, kh, lu] },
    wr = {
        findFiberByHostInstance: sn,
        bundleType: 0,
        version: '18.3.1',
        rendererPackageName: 'react-dom',
    },
    T0 = {
        bundleType: wr.bundleType,
        version: wr.version,
        rendererPackageName: wr.rendererPackageName,
        rendererConfig: wr.rendererConfig,
        overrideHookState: null,
        overrideHookStateDeletePath: null,
        overrideHookStateRenamePath: null,
        overrideProps: null,
        overridePropsDeletePath: null,
        overridePropsRenamePath: null,
        setErrorHandler: null,
        setSuspenseHandler: null,
        scheduleUpdate: null,
        currentDispatcherRef: Lt.ReactCurrentDispatcher,
        findHostInstanceByFiber: function (e) {
            return ((e = Lh(e)), e === null ? null : e.stateNode);
        },
        findFiberByHostInstance: wr.findFiberByHostInstance || k0,
        findHostInstancesForRefresh: null,
        scheduleRefresh: null,
        scheduleRoot: null,
        setRefreshHandler: null,
        getCurrentFiber: null,
        reconcilerVersion: '18.3.1-next-f1338f8080-20240426',
    };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
    var Wi = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Wi.isDisabled && Wi.supportsFiber)
        try {
            ((Qs = Wi.inject(T0)), (ft = Wi));
        } catch {}
}
Ie.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = C0;
Ie.createPortal = function (e, t) {
    var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!mu(t)) throw Error(T(200));
    return S0(e, t, null, n);
};
Ie.createRoot = function (e, t) {
    if (!mu(e)) throw Error(T(299));
    var n = !1,
        r = '',
        i = sm;
    return (
        t != null &&
            (t.unstable_strictMode === !0 && (n = !0),
            t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
            t.onRecoverableError !== void 0 && (i = t.onRecoverableError)),
        (t = du(e, 1, !1, null, null, n, !1, r, i)),
        (e[Ct] = t.current),
        ni(e.nodeType === 8 ? e.parentNode : e),
        new pu(t)
    );
};
Ie.findDOMNode = function (e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
        throw typeof e.render == 'function'
            ? Error(T(188))
            : ((e = Object.keys(e).join(',')), Error(T(268, e)));
    return ((e = Lh(t)), (e = e === null ? null : e.stateNode), e);
};
Ie.flushSync = function (e) {
    return yn(e);
};
Ie.hydrate = function (e, t, n) {
    if (!ao(t)) throw Error(T(200));
    return lo(null, e, t, !0, n);
};
Ie.hydrateRoot = function (e, t, n) {
    if (!mu(e)) throw Error(T(405));
    var r = (n != null && n.hydratedSources) || null,
        i = !1,
        s = '',
        o = sm;
    if (
        (n != null &&
            (n.unstable_strictMode === !0 && (i = !0),
            n.identifierPrefix !== void 0 && (s = n.identifierPrefix),
            n.onRecoverableError !== void 0 && (o = n.onRecoverableError)),
        (t = im(t, null, e, 1, n ?? null, i, !1, s, o)),
        (e[Ct] = t.current),
        ni(e),
        r)
    )
        for (e = 0; e < r.length; e++)
            ((n = r[e]),
                (i = n._getVersion),
                (i = i(n._source)),
                t.mutableSourceEagerHydrationData == null
                    ? (t.mutableSourceEagerHydrationData = [n, i])
                    : t.mutableSourceEagerHydrationData.push(n, i));
    return new oo(t);
};
Ie.render = function (e, t, n) {
    if (!ao(t)) throw Error(T(200));
    return lo(null, e, t, !1, n);
};
Ie.unmountComponentAtNode = function (e) {
    if (!ao(e)) throw Error(T(40));
    return e._reactRootContainer
        ? (yn(function () {
              lo(null, null, e, !1, function () {
                  ((e._reactRootContainer = null), (e[Ct] = null));
              });
          }),
          !0)
        : !1;
};
Ie.unstable_batchedUpdates = lu;
Ie.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
    if (!ao(n)) throw Error(T(200));
    if (e == null || e._reactInternals === void 0) throw Error(T(38));
    return lo(e, t, n, !1, r);
};
Ie.version = '18.3.1-next-f1338f8080-20240426';
function om() {
    if (
        !(
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
        )
    )
        try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(om);
        } catch (e) {
            console.error(e);
        }
}
(om(), (oh.exports = Ie));
var E0 = oh.exports,
    sf = E0;
((la.createRoot = sf.createRoot), (la.hydrateRoot = sf.hydrateRoot));
const gu = C.createContext({});
function cr(e) {
    const t = C.useRef(null);
    return (t.current === null && (t.current = e()), t.current);
}
const uo = C.createContext(null),
    Si = C.createContext({ transformPagePoint: (e) => e, isStatic: !1, reducedMotion: 'never' });
class L0 extends C.Component {
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
function R0({ children: e, isPresent: t }) {
    const n = C.useId(),
        r = C.useRef(null),
        i = C.useRef({ width: 0, height: 0, top: 0, left: 0 }),
        { nonce: s } = C.useContext(Si);
    return (
        C.useInsertionEffect(() => {
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
        O.jsx(L0, {
            isPresent: t,
            childRef: r,
            sizeRef: i,
            children: C.cloneElement(e, { ref: r }),
        })
    );
}
const A0 = ({
    children: e,
    initial: t,
    isPresent: n,
    onExitComplete: r,
    custom: i,
    presenceAffectsLayout: s,
    mode: o,
}) => {
    const a = cr(O0),
        l = C.useId(),
        u = C.useCallback(
            (f) => {
                a.set(f, !0);
                for (const d of a.values()) if (!d) return;
                r && r();
            },
            [a, r],
        ),
        c = C.useMemo(
            () => ({
                id: l,
                initial: t,
                isPresent: n,
                custom: i,
                onExitComplete: u,
                register: (f) => (a.set(f, !1), () => a.delete(f)),
            }),
            s ? [Math.random(), u] : [n, u],
        );
    return (
        C.useMemo(() => {
            a.forEach((f, d) => a.set(d, !1));
        }, [n]),
        C.useEffect(() => {
            !n && !a.size && r && r();
        }, [n]),
        o === 'popLayout' && (e = O.jsx(R0, { isPresent: n, children: e })),
        O.jsx(uo.Provider, { value: c, children: e })
    );
};
function O0() {
    return new Map();
}
function am(e = !0) {
    const t = C.useContext(uo);
    if (t === null) return [!0, null];
    const { isPresent: n, onExitComplete: r, register: i } = t,
        s = C.useId();
    C.useEffect(() => {
        e && i(s);
    }, [e]);
    const o = C.useCallback(() => e && r && r(s), [s, r, e]);
    return !n && r ? [!1, o] : [!0];
}
const Ki = (e) => e.key || '';
function of(e) {
    const t = [];
    return (
        C.Children.forEach(e, (n) => {
            C.isValidElement(n) && t.push(n);
        }),
        t
    );
}
const yu = typeof window < 'u',
    ki = yu ? C.useLayoutEffect : C.useEffect,
    D0 = ({
        children: e,
        custom: t,
        initial: n = !0,
        onExitComplete: r,
        presenceAffectsLayout: i = !0,
        mode: s = 'sync',
        propagate: o = !1,
    }) => {
        const [a, l] = am(o),
            u = C.useMemo(() => of(e), [e]),
            c = o && !a ? [] : u.map(Ki),
            f = C.useRef(!0),
            d = C.useRef(u),
            m = cr(() => new Map()),
            [y, v] = C.useState(u),
            [S, p] = C.useState(u);
        ki(() => {
            ((f.current = !1), (d.current = u));
            for (let x = 0; x < S.length; x++) {
                const w = Ki(S[x]);
                c.includes(w) ? m.delete(w) : m.get(w) !== !0 && m.set(w, !1);
            }
        }, [S, c.length, c.join('-')]);
        const h = [];
        if (u !== y) {
            let x = [...u];
            for (let w = 0; w < S.length; w++) {
                const P = S[w],
                    E = Ki(P);
                c.includes(E) || (x.splice(w, 0, P), h.push(P));
            }
            (s === 'wait' && h.length && (x = h), p(of(x)), v(u));
            return;
        }
        const { forceRender: g } = C.useContext(gu);
        return O.jsx(O.Fragment, {
            children: S.map((x) => {
                const w = Ki(x),
                    P = o && !a ? !1 : u === S || c.includes(w),
                    E = () => {
                        if (m.has(w)) m.set(w, !0);
                        else return;
                        let k = !0;
                        (m.forEach((D) => {
                            D || (k = !1);
                        }),
                            k &&
                                (g == null || g(),
                                p(d.current),
                                o && (l == null || l()),
                                r && r()));
                    };
                return O.jsx(
                    A0,
                    {
                        isPresent: P,
                        initial: !f.current || n ? void 0 : !1,
                        custom: P ? void 0 : t,
                        presenceAffectsLayout: i,
                        mode: s,
                        onExitComplete: P ? void 0 : E,
                        children: x,
                    },
                    w,
                );
            }),
        });
    },
    Ce = (e) => e;
let N0 = Ce,
    lm = Ce;
function vu(e) {
    let t;
    return () => (t === void 0 && (t = e()), t);
}
const vn = (e, t, n) => {
        const r = t - e;
        return r === 0 ? 1 : (n - e) / r;
    },
    St = (e) => e * 1e3,
    kt = (e) => e / 1e3,
    M0 = { useManualTiming: !1 };
function V0(e) {
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
        schedule: (u, c = !1, f = !1) => {
            const m = f && r ? t : n;
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
const bi = ['read', 'resolveKeyframes', 'update', 'preRender', 'render', 'postRender'],
    _0 = 40;
function um(e, t) {
    let n = !1,
        r = !0;
    const i = { delta: 0, timestamp: 0, isProcessing: !1 },
        s = () => (n = !0),
        o = bi.reduce((p, h) => ((p[h] = V0(s)), p), {}),
        { read: a, resolveKeyframes: l, update: u, preRender: c, render: f, postRender: d } = o,
        m = () => {
            const p = performance.now();
            ((n = !1),
                (i.delta = r ? 1e3 / 60 : Math.max(Math.min(p - i.timestamp, _0), 1)),
                (i.timestamp = p),
                (i.isProcessing = !0),
                a.process(i),
                l.process(i),
                u.process(i),
                c.process(i),
                f.process(i),
                d.process(i),
                (i.isProcessing = !1),
                n && t && ((r = !1), e(m)));
        },
        y = () => {
            ((n = !0), (r = !0), i.isProcessing || e(m));
        };
    return {
        schedule: bi.reduce((p, h) => {
            const g = o[h];
            return ((p[h] = (x, w = !1, P = !1) => (n || y(), g.schedule(x, w, P))), p);
        }, {}),
        cancel: (p) => {
            for (let h = 0; h < bi.length; h++) o[bi[h]].cancel(p);
        },
        state: i,
        steps: o,
    };
}
const {
        schedule: H,
        cancel: rt,
        state: le,
        steps: Wo,
    } = um(typeof requestAnimationFrame < 'u' ? requestAnimationFrame : Ce, !0),
    cm = C.createContext({ strict: !1 }),
    af = {
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
    ir = {};
for (const e in af) ir[e] = { isEnabled: (t) => af[e].some((n) => !!t[n]) };
function j0(e) {
    for (const t in e) ir[t] = { ...ir[t], ...e[t] };
}
const F0 = new Set([
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
function Fs(e) {
    return (
        e.startsWith('while') ||
        (e.startsWith('drag') && e !== 'draggable') ||
        e.startsWith('layout') ||
        e.startsWith('onTap') ||
        e.startsWith('onPan') ||
        e.startsWith('onLayout') ||
        F0.has(e)
    );
}
let fm = (e) => !Fs(e);
function I0(e) {
    e && (fm = (t) => (t.startsWith('on') ? !Fs(t) : e(t)));
}
try {
    I0(require('@emotion/is-prop-valid').default);
} catch {}
function z0(e, t, n) {
    const r = {};
    for (const i in e)
        (i === 'values' && typeof e.values == 'object') ||
            ((fm(i) ||
                (n === !0 && Fs(i)) ||
                (!t && !Fs(i)) ||
                (e.draggable && i.startsWith('onDrag'))) &&
                (r[i] = e[i]));
    return r;
}
function B0(e) {
    if (typeof Proxy > 'u') return e;
    const t = new Map(),
        n = (...r) => e(...r);
    return new Proxy(n, {
        get: (r, i) => (i === 'create' ? e : (t.has(i) || t.set(i, e(i)), t.get(i))),
    });
}
const co = C.createContext({});
function fi(e) {
    return typeof e == 'string' || Array.isArray(e);
}
function fo(e) {
    return e !== null && typeof e == 'object' && typeof e.start == 'function';
}
const xu = ['animate', 'whileInView', 'whileFocus', 'whileHover', 'whileTap', 'whileDrag', 'exit'],
    wu = ['initial', ...xu];
function ho(e) {
    return fo(e.animate) || wu.some((t) => fi(e[t]));
}
function dm(e) {
    return !!(ho(e) || e.variants);
}
function $0(e, t) {
    if (ho(e)) {
        const { initial: n, animate: r } = e;
        return { initial: n === !1 || fi(n) ? n : void 0, animate: fi(r) ? r : void 0 };
    }
    return e.inherit !== !1 ? t : {};
}
function U0(e) {
    const { initial: t, animate: n } = $0(e, C.useContext(co));
    return C.useMemo(() => ({ initial: t, animate: n }), [lf(t), lf(n)]);
}
function lf(e) {
    return Array.isArray(e) ? e.join(' ') : e;
}
const H0 = Symbol.for('motionComponentSymbol');
function Bn(e) {
    return e && typeof e == 'object' && Object.prototype.hasOwnProperty.call(e, 'current');
}
function W0(e, t, n) {
    return C.useCallback(
        (r) => {
            (r && e.onMount && e.onMount(r),
                t && (r ? t.mount(r) : t.unmount()),
                n && (typeof n == 'function' ? n(r) : Bn(n) && (n.current = r)));
        },
        [t],
    );
}
const Su = (e) => e.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase(),
    K0 = 'framerAppearId',
    hm = 'data-' + Su(K0),
    { schedule: ku } = um(queueMicrotask, !1),
    pm = C.createContext({});
function b0(e, t, n, r, i) {
    var s, o;
    const { visualElement: a } = C.useContext(co),
        l = C.useContext(cm),
        u = C.useContext(uo),
        c = C.useContext(Si).reducedMotion,
        f = C.useRef(null);
    ((r = r || l.renderer),
        !f.current &&
            r &&
            (f.current = r(e, {
                visualState: t,
                parent: a,
                props: n,
                presenceContext: u,
                blockInitialAnimation: u ? u.initial === !1 : !1,
                reducedMotionConfig: c,
            })));
    const d = f.current,
        m = C.useContext(pm);
    d && !d.projection && i && (d.type === 'html' || d.type === 'svg') && G0(f.current, n, i, m);
    const y = C.useRef(!1);
    C.useInsertionEffect(() => {
        d && y.current && d.update(n, u);
    });
    const v = n[hm],
        S = C.useRef(
            !!v &&
                !(
                    !((s = window.MotionHandoffIsComplete) === null || s === void 0) &&
                    s.call(window, v)
                ) &&
                ((o = window.MotionHasOptimisedAnimation) === null || o === void 0
                    ? void 0
                    : o.call(window, v)),
        );
    return (
        ki(() => {
            d &&
                ((y.current = !0),
                (window.MotionIsMounted = !0),
                d.updateFeatures(),
                ku.render(d.render),
                S.current && d.animationState && d.animationState.animateChanges());
        }),
        C.useEffect(() => {
            d &&
                (!S.current && d.animationState && d.animationState.animateChanges(),
                S.current &&
                    (queueMicrotask(() => {
                        var p;
                        (p = window.MotionHandoffMarkAsComplete) === null ||
                            p === void 0 ||
                            p.call(window, v);
                    }),
                    (S.current = !1)));
        }),
        d
    );
}
function G0(e, t, n, r) {
    const {
        layoutId: i,
        layout: s,
        drag: o,
        dragConstraints: a,
        layoutScroll: l,
        layoutRoot: u,
    } = t;
    ((e.projection = new n(e.latestValues, t['data-framer-portal-id'] ? void 0 : mm(e.parent))),
        e.projection.setOptions({
            layoutId: i,
            layout: s,
            alwaysMeasureLayout: !!o || (a && Bn(a)),
            visualElement: e,
            animationType: typeof s == 'string' ? s : 'both',
            initialPromotionConfig: r,
            layoutScroll: l,
            layoutRoot: u,
        }));
}
function mm(e) {
    if (e) return e.options.allowProjection !== !1 ? e.projection : mm(e.parent);
}
function Q0({
    preloadedFeatures: e,
    createVisualElement: t,
    useRender: n,
    useVisualState: r,
    Component: i,
}) {
    var s, o;
    e && j0(e);
    function a(u, c) {
        let f;
        const d = { ...C.useContext(Si), ...u, layoutId: Y0(u) },
            { isStatic: m } = d,
            y = U0(u),
            v = r(u, m);
        if (!m && yu) {
            X0();
            const S = Z0(d);
            ((f = S.MeasureLayout), (y.visualElement = b0(i, v, d, t, S.ProjectionNode)));
        }
        return O.jsxs(co.Provider, {
            value: y,
            children: [
                f && y.visualElement ? O.jsx(f, { visualElement: y.visualElement, ...d }) : null,
                n(i, u, W0(v, y.visualElement, c), v, m, y.visualElement),
            ],
        });
    }
    a.displayName = `motion.${typeof i == 'string' ? i : `create(${(o = (s = i.displayName) !== null && s !== void 0 ? s : i.name) !== null && o !== void 0 ? o : ''})`}`;
    const l = C.forwardRef(a);
    return ((l[H0] = i), l);
}
function Y0({ layoutId: e }) {
    const t = C.useContext(gu).id;
    return t && e !== void 0 ? t + '-' + e : e;
}
function X0(e, t) {
    C.useContext(cm).strict;
}
function Z0(e) {
    const { drag: t, layout: n } = ir;
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
const J0 = [
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
function Pu(e) {
    return typeof e != 'string' || e.includes('-')
        ? !1
        : !!(J0.indexOf(e) > -1 || /[A-Z]/u.test(e));
}
function uf(e) {
    const t = [{}, {}];
    return (
        e == null ||
            e.values.forEach((n, r) => {
                ((t[0][r] = n.get()), (t[1][r] = n.getVelocity()));
            }),
        t
    );
}
function Cu(e, t, n, r) {
    if (typeof t == 'function') {
        const [i, s] = uf(r);
        t = t(n !== void 0 ? n : e.custom, i, s);
    }
    if ((typeof t == 'string' && (t = e.variants && e.variants[t]), typeof t == 'function')) {
        const [i, s] = uf(r);
        t = t(n !== void 0 ? n : e.custom, i, s);
    }
    return t;
}
const tl = (e) => Array.isArray(e),
    q0 = (e) => !!(e && typeof e == 'object' && e.mix && e.toValue),
    ex = (e) => (tl(e) ? e[e.length - 1] || 0 : e),
    de = (e) => !!(e && e.getVelocity);
function ls(e) {
    const t = de(e) ? e.get() : e;
    return q0(t) ? t.toValue() : t;
}
function tx({ scrapeMotionValuesFromProps: e, createRenderState: t, onUpdate: n }, r, i, s) {
    const o = { latestValues: nx(r, i, s, e), renderState: t() };
    return (
        n && ((o.onMount = (a) => n({ props: r, current: a, ...o })), (o.onUpdate = (a) => n(a))),
        o
    );
}
const gm = (e) => (t, n) => {
    const r = C.useContext(co),
        i = C.useContext(uo),
        s = () => tx(e, t, r, i);
    return n ? s() : cr(s);
};
function nx(e, t, n, r) {
    const i = {},
        s = r(e, {});
    for (const d in s) i[d] = ls(s[d]);
    let { initial: o, animate: a } = e;
    const l = ho(e),
        u = dm(e);
    t &&
        u &&
        !l &&
        e.inherit !== !1 &&
        (o === void 0 && (o = t.initial), a === void 0 && (a = t.animate));
    let c = n ? n.initial === !1 : !1;
    c = c || o === !1;
    const f = c ? a : o;
    if (f && typeof f != 'boolean' && !fo(f)) {
        const d = Array.isArray(f) ? f : [f];
        for (let m = 0; m < d.length; m++) {
            const y = Cu(e, d[m]);
            if (y) {
                const { transitionEnd: v, transition: S, ...p } = y;
                for (const h in p) {
                    let g = p[h];
                    if (Array.isArray(g)) {
                        const x = c ? g.length - 1 : 0;
                        g = g[x];
                    }
                    g !== null && (i[h] = g);
                }
                for (const h in v) i[h] = v[h];
            }
        }
    }
    return i;
}
const fr = [
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
    kn = new Set(fr),
    ym = (e) => (t) => typeof t == 'string' && t.startsWith(e),
    vm = ym('--'),
    rx = ym('var(--'),
    Tu = (e) => (rx(e) ? ix.test(e.split('/*')[0].trim()) : !1),
    ix = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu,
    xm = (e, t) => (t && typeof e == 'number' ? t.transform(e) : e),
    mt = (e, t, n) => (n > t ? t : n < e ? e : n),
    dr = { test: (e) => typeof e == 'number', parse: parseFloat, transform: (e) => e },
    di = { ...dr, transform: (e) => mt(0, 1, e) },
    Gi = { ...dr, default: 1 },
    Pi = (e) => ({
        test: (t) => typeof t == 'string' && t.endsWith(e) && t.split(' ').length === 1,
        parse: parseFloat,
        transform: (t) => `${t}${e}`,
    }),
    At = Pi('deg'),
    ht = Pi('%'),
    M = Pi('px'),
    sx = Pi('vh'),
    ox = Pi('vw'),
    cf = { ...ht, parse: (e) => ht.parse(e) / 100, transform: (e) => ht.transform(e * 100) },
    ax = {
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
    lx = {
        rotate: At,
        rotateX: At,
        rotateY: At,
        rotateZ: At,
        scale: Gi,
        scaleX: Gi,
        scaleY: Gi,
        scaleZ: Gi,
        skew: At,
        skewX: At,
        skewY: At,
        distance: M,
        translateX: M,
        translateY: M,
        translateZ: M,
        x: M,
        y: M,
        z: M,
        perspective: M,
        transformPerspective: M,
        opacity: di,
        originX: cf,
        originY: cf,
        originZ: M,
    },
    ff = { ...dr, transform: Math.round },
    Eu = { ...ax, ...lx, zIndex: ff, size: M, fillOpacity: di, strokeOpacity: di, numOctaves: ff },
    ux = { x: 'translateX', y: 'translateY', z: 'translateZ', transformPerspective: 'perspective' },
    cx = fr.length;
function fx(e, t, n) {
    let r = '',
        i = !0;
    for (let s = 0; s < cx; s++) {
        const o = fr[s],
            a = e[o];
        if (a === void 0) continue;
        let l = !0;
        if (
            (typeof a == 'number'
                ? (l = a === (o.startsWith('scale') ? 1 : 0))
                : (l = parseFloat(a) === 0),
            !l || n)
        ) {
            const u = xm(a, Eu[o]);
            if (!l) {
                i = !1;
                const c = ux[o] || o;
                r += `${c}(${u}) `;
            }
            n && (t[o] = u);
        }
    }
    return ((r = r.trim()), n ? (r = n(t, i ? '' : r)) : i && (r = 'none'), r);
}
function Lu(e, t, n) {
    const { style: r, vars: i, transformOrigin: s } = e;
    let o = !1,
        a = !1;
    for (const l in t) {
        const u = t[l];
        if (kn.has(l)) {
            o = !0;
            continue;
        } else if (vm(l)) {
            i[l] = u;
            continue;
        } else {
            const c = xm(u, Eu[l]);
            l.startsWith('origin') ? ((a = !0), (s[l] = c)) : (r[l] = c);
        }
    }
    if (
        (t.transform ||
            (o || n
                ? (r.transform = fx(t, e.transform, n))
                : r.transform && (r.transform = 'none')),
        a)
    ) {
        const { originX: l = '50%', originY: u = '50%', originZ: c = 0 } = s;
        r.transformOrigin = `${l} ${u} ${c}`;
    }
}
const dx = { offset: 'stroke-dashoffset', array: 'stroke-dasharray' },
    hx = { offset: 'strokeDashoffset', array: 'strokeDasharray' };
function px(e, t, n = 1, r = 0, i = !0) {
    e.pathLength = 1;
    const s = i ? dx : hx;
    e[s.offset] = M.transform(-r);
    const o = M.transform(t),
        a = M.transform(n);
    e[s.array] = `${o} ${a}`;
}
function df(e, t, n) {
    return typeof e == 'string' ? e : M.transform(t + n * e);
}
function mx(e, t, n) {
    const r = df(t, e.x, e.width),
        i = df(n, e.y, e.height);
    return `${r} ${i}`;
}
function Ru(
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
    f,
) {
    if ((Lu(e, u, f), c)) {
        e.style.viewBox && (e.attrs.viewBox = e.style.viewBox);
        return;
    }
    ((e.attrs = e.style), (e.style = {}));
    const { attrs: d, style: m, dimensions: y } = e;
    (d.transform && (y && (m.transform = d.transform), delete d.transform),
        y &&
            (i !== void 0 || s !== void 0 || m.transform) &&
            (m.transformOrigin = mx(y, i !== void 0 ? i : 0.5, s !== void 0 ? s : 0.5)),
        t !== void 0 && (d.x = t),
        n !== void 0 && (d.y = n),
        r !== void 0 && (d.scale = r),
        o !== void 0 && px(d, o, a, l, !1));
}
const Au = () => ({ style: {}, transform: {}, transformOrigin: {}, vars: {} }),
    wm = () => ({ ...Au(), attrs: {} }),
    Ou = (e) => typeof e == 'string' && e.toLowerCase() === 'svg';
function Sm(e, { style: t, vars: n }, r, i) {
    Object.assign(e.style, t, i && i.getProjectionStyles(r));
    for (const s in n) e.style.setProperty(s, n[s]);
}
const km = new Set([
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
function Pm(e, t, n, r) {
    Sm(e, t, void 0, r);
    for (const i in t.attrs) e.setAttribute(km.has(i) ? i : Su(i), t.attrs[i]);
}
const Is = {};
function gx(e) {
    Object.assign(Is, e);
}
function Cm(e, { layout: t, layoutId: n }) {
    return (
        kn.has(e) || e.startsWith('origin') || ((t || n !== void 0) && (!!Is[e] || e === 'opacity'))
    );
}
function Du(e, t, n) {
    var r;
    const { style: i } = e,
        s = {};
    for (const o in i)
        (de(i[o]) ||
            (t.style && de(t.style[o])) ||
            Cm(o, e) ||
            ((r = n == null ? void 0 : n.getValue(o)) === null || r === void 0
                ? void 0
                : r.liveStyle) !== void 0) &&
            (s[o] = i[o]);
    return s;
}
function Tm(e, t, n) {
    const r = Du(e, t, n);
    for (const i in e)
        if (de(e[i]) || de(t[i])) {
            const s =
                fr.indexOf(i) !== -1 ? 'attr' + i.charAt(0).toUpperCase() + i.substring(1) : i;
            r[s] = e[i];
        }
    return r;
}
function yx(e, t) {
    try {
        t.dimensions = typeof e.getBBox == 'function' ? e.getBBox() : e.getBoundingClientRect();
    } catch {
        t.dimensions = { x: 0, y: 0, width: 0, height: 0 };
    }
}
const hf = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r'],
    vx = {
        useVisualState: gm({
            scrapeMotionValuesFromProps: Tm,
            createRenderState: wm,
            onUpdate: ({ props: e, prevProps: t, current: n, renderState: r, latestValues: i }) => {
                if (!n) return;
                let s = !!e.drag;
                if (!s) {
                    for (const a in i)
                        if (kn.has(a)) {
                            s = !0;
                            break;
                        }
                }
                if (!s) return;
                let o = !t;
                if (t)
                    for (let a = 0; a < hf.length; a++) {
                        const l = hf[a];
                        e[l] !== t[l] && (o = !0);
                    }
                o &&
                    H.read(() => {
                        (yx(n, r),
                            H.render(() => {
                                (Ru(r, i, Ou(n.tagName), e.transformTemplate), Pm(n, r));
                            }));
                    });
            },
        }),
    },
    xx = { useVisualState: gm({ scrapeMotionValuesFromProps: Du, createRenderState: Au }) };
function Em(e, t, n) {
    for (const r in t) !de(t[r]) && !Cm(r, n) && (e[r] = t[r]);
}
function wx({ transformTemplate: e }, t) {
    return C.useMemo(() => {
        const n = Au();
        return (Lu(n, t, e), Object.assign({}, n.vars, n.style));
    }, [t]);
}
function Sx(e, t) {
    const n = e.style || {},
        r = {};
    return (Em(r, n, e), Object.assign(r, wx(e, t)), r);
}
function kx(e, t) {
    const n = {},
        r = Sx(e, t);
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
function Px(e, t, n, r) {
    const i = C.useMemo(() => {
        const s = wm();
        return (Ru(s, t, Ou(r), e.transformTemplate), { ...s.attrs, style: { ...s.style } });
    }, [t]);
    if (e.style) {
        const s = {};
        (Em(s, e.style, e), (i.style = { ...s, ...i.style }));
    }
    return i;
}
function Cx(e = !1) {
    return (n, r, i, { latestValues: s }, o) => {
        const l = (Pu(n) ? Px : kx)(r, s, o, n),
            u = z0(r, typeof n == 'string', e),
            c = n !== C.Fragment ? { ...u, ...l, ref: i } : {},
            { children: f } = r,
            d = C.useMemo(() => (de(f) ? f.get() : f), [f]);
        return C.createElement(n, { ...c, children: d });
    };
}
function Tx(e, t) {
    return function (r, { forwardMotionProps: i } = { forwardMotionProps: !1 }) {
        const o = {
            ...(Pu(r) ? vx : xx),
            preloadedFeatures: e,
            useRender: Cx(i),
            createVisualElement: t,
            Component: r,
        };
        return Q0(o);
    };
}
function Lm(e, t) {
    if (!Array.isArray(t)) return !1;
    const n = t.length;
    if (n !== e.length) return !1;
    for (let r = 0; r < n; r++) if (t[r] !== e[r]) return !1;
    return !0;
}
function po(e, t, n) {
    const r = e.getProps();
    return Cu(r, t, n !== void 0 ? n : r.custom, e);
}
const Rm = vu(() => window.ScrollTimeline !== void 0);
class Ex {
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
            if (Rm() && i.attachTimeline) return i.attachTimeline(t);
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
class Lx extends Ex {
    then(t, n) {
        return Promise.all(this.animations).then(t).catch(n);
    }
}
function Nu(e, t) {
    return e ? e[t] || e.default || e : void 0;
}
const nl = 2e4;
function Am(e) {
    let t = 0;
    const n = 50;
    let r = e.next(t);
    for (; !r.done && t < nl; ) ((t += n), (r = e.next(t)));
    return t >= nl ? 1 / 0 : t;
}
function Mu(e) {
    return typeof e == 'function';
}
function pf(e, t) {
    ((e.timeline = t), (e.onfinish = null));
}
const Vu = (e) => Array.isArray(e) && typeof e[0] == 'number',
    Rx = { linearEasing: void 0 };
function Ax(e, t) {
    const n = vu(e);
    return () => {
        var r;
        return (r = Rx[t]) !== null && r !== void 0 ? r : n();
    };
}
const zs = Ax(() => {
        try {
            document.createElement('div').animate({ opacity: 0 }, { easing: 'linear(0, 1)' });
        } catch {
            return !1;
        }
        return !0;
    }, 'linearEasing'),
    Om = (e, t, n = 10) => {
        let r = '';
        const i = Math.max(Math.round(t / n), 2);
        for (let s = 0; s < i; s++) r += e(vn(0, i - 1, s)) + ', ';
        return `linear(${r.substring(0, r.length - 2)})`;
    };
function Dm(e) {
    return !!(
        (typeof e == 'function' && zs()) ||
        !e ||
        (typeof e == 'string' && (e in rl || zs())) ||
        Vu(e) ||
        (Array.isArray(e) && e.every(Dm))
    );
}
const Rr = ([e, t, n, r]) => `cubic-bezier(${e}, ${t}, ${n}, ${r})`,
    rl = {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        circIn: Rr([0, 0.65, 0.55, 1]),
        circOut: Rr([0.55, 0, 1, 0.45]),
        backIn: Rr([0.31, 0.01, 0.66, -0.59]),
        backOut: Rr([0.33, 1.53, 0.69, 0.99]),
    };
function Nm(e, t) {
    if (e)
        return typeof e == 'function' && zs()
            ? Om(e, t)
            : Vu(e)
              ? Rr(e)
              : Array.isArray(e)
                ? e.map((n) => Nm(n, t) || rl.easeOut)
                : rl[e];
}
const Xe = { x: !1, y: !1 };
function Mm() {
    return Xe.x || Xe.y;
}
function Vm(e, t, n) {
    var r;
    if (e instanceof Element) return [e];
    if (typeof e == 'string') {
        let i = document;
        const s = (r = void 0) !== null && r !== void 0 ? r : i.querySelectorAll(e);
        return s ? Array.from(s) : [];
    }
    return Array.from(e);
}
function _m(e, t) {
    const n = Vm(e),
        r = new AbortController(),
        i = { passive: !0, ...t, signal: r.signal };
    return [n, i, () => r.abort()];
}
function mf(e) {
    return (t) => {
        t.pointerType === 'touch' || Mm() || e(t);
    };
}
function Ox(e, t, n = {}) {
    const [r, i, s] = _m(e, n),
        o = mf((a) => {
            const { target: l } = a,
                u = t(a);
            if (typeof u != 'function' || !l) return;
            const c = mf((f) => {
                (u(f), l.removeEventListener('pointerleave', c));
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
const jm = (e, t) => (t ? (e === t ? !0 : jm(e, t.parentElement)) : !1),
    _u = (e) =>
        e.pointerType === 'mouse'
            ? typeof e.button != 'number' || e.button <= 0
            : e.isPrimary !== !1,
    Dx = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']);
function Nx(e) {
    return Dx.has(e.tagName) || e.tabIndex !== -1;
}
const Ar = new WeakSet();
function gf(e) {
    return (t) => {
        t.key === 'Enter' && e(t);
    };
}
function Ko(e, t) {
    e.dispatchEvent(new PointerEvent('pointer' + t, { isPrimary: !0, bubbles: !0 }));
}
const Mx = (e, t) => {
    const n = e.currentTarget;
    if (!n) return;
    const r = gf(() => {
        if (Ar.has(n)) return;
        Ko(n, 'down');
        const i = gf(() => {
                Ko(n, 'up');
            }),
            s = () => Ko(n, 'cancel');
        (n.addEventListener('keyup', i, t), n.addEventListener('blur', s, t));
    });
    (n.addEventListener('keydown', r, t),
        n.addEventListener('blur', () => n.removeEventListener('keydown', r), t));
};
function yf(e) {
    return _u(e) && !Mm();
}
function Vx(e, t, n = {}) {
    const [r, i, s] = _m(e, n),
        o = (a) => {
            const l = a.currentTarget;
            if (!yf(a) || Ar.has(l)) return;
            Ar.add(l);
            const u = t(a),
                c = (m, y) => {
                    (window.removeEventListener('pointerup', f),
                        window.removeEventListener('pointercancel', d),
                        !(!yf(m) || !Ar.has(l)) &&
                            (Ar.delete(l), typeof u == 'function' && u(m, { success: y })));
                },
                f = (m) => {
                    c(m, n.useGlobalTarget || jm(l, m.target));
                },
                d = (m) => {
                    c(m, !1);
                };
            (window.addEventListener('pointerup', f, i),
                window.addEventListener('pointercancel', d, i));
        };
    return (
        r.forEach((a) => {
            (!Nx(a) && a.getAttribute('tabindex') === null && (a.tabIndex = 0),
                (n.useGlobalTarget ? window : a).addEventListener('pointerdown', o, i),
                a.addEventListener('focus', (u) => Mx(u, i), i));
        }),
        s
    );
}
function _x(e) {
    return e === 'x' || e === 'y'
        ? Xe[e]
            ? null
            : ((Xe[e] = !0),
              () => {
                  Xe[e] = !1;
              })
        : Xe.x || Xe.y
          ? null
          : ((Xe.x = Xe.y = !0),
            () => {
                Xe.x = Xe.y = !1;
            });
}
const Fm = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', ...fr]);
let us;
function jx() {
    us = void 0;
}
const pt = {
    now: () => (
        us === void 0 &&
            pt.set(le.isProcessing || M0.useManualTiming ? le.timestamp : performance.now()),
        us
    ),
    set: (e) => {
        ((us = e), queueMicrotask(jx));
    },
};
function ju(e, t) {
    e.indexOf(t) === -1 && e.push(t);
}
function Fu(e, t) {
    const n = e.indexOf(t);
    n > -1 && e.splice(n, 1);
}
class Iu {
    constructor() {
        this.subscriptions = [];
    }
    add(t) {
        return (ju(this.subscriptions, t), () => Fu(this.subscriptions, t));
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
function zu(e, t) {
    return t ? e * (1e3 / t) : 0;
}
const vf = 30,
    Fx = (e) => !isNaN(parseFloat(e)),
    Br = { current: void 0 };
class Ix {
    constructor(t, n = {}) {
        ((this.version = '11.18.2'),
            (this.canTrackVelocity = null),
            (this.events = {}),
            (this.updateAndNotify = (r, i = !0) => {
                const s = pt.now();
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
            (this.updatedAt = pt.now()),
            this.canTrackVelocity === null &&
                t !== void 0 &&
                (this.canTrackVelocity = Fx(this.current)));
    }
    setPrevFrameValue(t = this.current) {
        ((this.prevFrameValue = t), (this.prevUpdatedAt = this.updatedAt));
    }
    onChange(t) {
        return this.on('change', t);
    }
    on(t, n) {
        this.events[t] || (this.events[t] = new Iu());
        const r = this.events[t].add(n);
        return t === 'change'
            ? () => {
                  (r(),
                      H.read(() => {
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
        return (Br.current && Br.current.push(this), this.current);
    }
    getPrevious() {
        return this.prev;
    }
    getVelocity() {
        const t = pt.now();
        if (!this.canTrackVelocity || this.prevFrameValue === void 0 || t - this.updatedAt > vf)
            return 0;
        const n = Math.min(this.updatedAt - this.prevUpdatedAt, vf);
        return zu(parseFloat(this.current) - parseFloat(this.prevFrameValue), n);
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
function ut(e, t) {
    return new Ix(e, t);
}
function zx(e, t, n) {
    e.hasValue(t) ? e.getValue(t).set(n) : e.addValue(t, ut(n));
}
function Bx(e, t) {
    const n = po(e, t);
    let { transitionEnd: r = {}, transition: i = {}, ...s } = n || {};
    s = { ...s, ...r };
    for (const o in s) {
        const a = ex(s[o]);
        zx(e, o, a);
    }
}
function $x(e) {
    return !!(de(e) && e.add);
}
function il(e, t) {
    const n = e.getValue('willChange');
    if ($x(n)) return n.add(t);
}
function Im(e) {
    return e.props[hm];
}
const zm = (e, t, n) => (((1 - 3 * n + 3 * t) * e + (3 * n - 6 * t)) * e + 3 * t) * e,
    Ux = 1e-7,
    Hx = 12;
function Wx(e, t, n, r, i) {
    let s,
        o,
        a = 0;
    do ((o = t + (n - t) / 2), (s = zm(o, r, i) - e), s > 0 ? (n = o) : (t = o));
    while (Math.abs(s) > Ux && ++a < Hx);
    return o;
}
function Ci(e, t, n, r) {
    if (e === t && n === r) return Ce;
    const i = (s) => Wx(s, 0, 1, e, n);
    return (s) => (s === 0 || s === 1 ? s : zm(i(s), t, r));
}
const Bm = (e) => (t) => (t <= 0.5 ? e(2 * t) / 2 : (2 - e(2 * (1 - t))) / 2),
    $m = (e) => (t) => 1 - e(1 - t),
    Um = Ci(0.33, 1.53, 0.69, 0.99),
    Bu = $m(Um),
    Hm = Bm(Bu),
    Wm = (e) => ((e *= 2) < 1 ? 0.5 * Bu(e) : 0.5 * (2 - Math.pow(2, -10 * (e - 1)))),
    $u = (e) => 1 - Math.sin(Math.acos(e)),
    Km = $m($u),
    bm = Bm($u),
    Gm = (e) => /^0[^.\s]+$/u.test(e);
function Kx(e) {
    return typeof e == 'number' ? e === 0 : e !== null ? e === 'none' || e === '0' || Gm(e) : !0;
}
const $r = (e) => Math.round(e * 1e5) / 1e5,
    Uu = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function bx(e) {
    return e == null;
}
const Gx =
        /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu,
    Hu = (e, t) => (n) =>
        !!(
            (typeof n == 'string' && Gx.test(n) && n.startsWith(e)) ||
            (t && !bx(n) && Object.prototype.hasOwnProperty.call(n, t))
        ),
    Qm = (e, t, n) => (r) => {
        if (typeof r != 'string') return r;
        const [i, s, o, a] = r.match(Uu);
        return {
            [e]: parseFloat(i),
            [t]: parseFloat(s),
            [n]: parseFloat(o),
            alpha: a !== void 0 ? parseFloat(a) : 1,
        };
    },
    Qx = (e) => mt(0, 255, e),
    bo = { ...dr, transform: (e) => Math.round(Qx(e)) },
    ln = {
        test: Hu('rgb', 'red'),
        parse: Qm('red', 'green', 'blue'),
        transform: ({ red: e, green: t, blue: n, alpha: r = 1 }) =>
            'rgba(' +
            bo.transform(e) +
            ', ' +
            bo.transform(t) +
            ', ' +
            bo.transform(n) +
            ', ' +
            $r(di.transform(r)) +
            ')',
    };
function Yx(e) {
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
const sl = { test: Hu('#'), parse: Yx, transform: ln.transform },
    $n = {
        test: Hu('hsl', 'hue'),
        parse: Qm('hue', 'saturation', 'lightness'),
        transform: ({ hue: e, saturation: t, lightness: n, alpha: r = 1 }) =>
            'hsla(' +
            Math.round(e) +
            ', ' +
            ht.transform($r(t)) +
            ', ' +
            ht.transform($r(n)) +
            ', ' +
            $r(di.transform(r)) +
            ')',
    },
    xe = {
        test: (e) => ln.test(e) || sl.test(e) || $n.test(e),
        parse: (e) => (ln.test(e) ? ln.parse(e) : $n.test(e) ? $n.parse(e) : sl.parse(e)),
        transform: (e) =>
            typeof e == 'string' ? e : e.hasOwnProperty('red') ? ln.transform(e) : $n.transform(e),
    },
    Xx =
        /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
function Zx(e) {
    var t, n;
    return (
        isNaN(e) &&
        typeof e == 'string' &&
        (((t = e.match(Uu)) === null || t === void 0 ? void 0 : t.length) || 0) +
            (((n = e.match(Xx)) === null || n === void 0 ? void 0 : n.length) || 0) >
            0
    );
}
const Ym = 'number',
    Xm = 'color',
    Jx = 'var',
    qx = 'var(',
    xf = '${}',
    ew =
        /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function hi(e) {
    const t = e.toString(),
        n = [],
        r = { color: [], number: [], var: [] },
        i = [];
    let s = 0;
    const a = t
        .replace(
            ew,
            (l) => (
                xe.test(l)
                    ? (r.color.push(s), i.push(Xm), n.push(xe.parse(l)))
                    : l.startsWith(qx)
                      ? (r.var.push(s), i.push(Jx), n.push(l))
                      : (r.number.push(s), i.push(Ym), n.push(parseFloat(l))),
                ++s,
                xf
            ),
        )
        .split(xf);
    return { values: n, split: a, indexes: r, types: i };
}
function Zm(e) {
    return hi(e).values;
}
function Jm(e) {
    const { split: t, types: n } = hi(e),
        r = t.length;
    return (i) => {
        let s = '';
        for (let o = 0; o < r; o++)
            if (((s += t[o]), i[o] !== void 0)) {
                const a = n[o];
                a === Ym ? (s += $r(i[o])) : a === Xm ? (s += xe.transform(i[o])) : (s += i[o]);
            }
        return s;
    };
}
const tw = (e) => (typeof e == 'number' ? 0 : e);
function nw(e) {
    const t = Zm(e);
    return Jm(e)(t.map(tw));
}
const Gt = { test: Zx, parse: Zm, createTransformer: Jm, getAnimatableNone: nw },
    rw = new Set(['brightness', 'contrast', 'saturate', 'opacity']);
function iw(e) {
    const [t, n] = e.slice(0, -1).split('(');
    if (t === 'drop-shadow') return e;
    const [r] = n.match(Uu) || [];
    if (!r) return e;
    const i = n.replace(r, '');
    let s = rw.has(t) ? 1 : 0;
    return (r !== n && (s *= 100), t + '(' + s + i + ')');
}
const sw = /\b([a-z-]*)\(.*?\)/gu,
    ol = {
        ...Gt,
        getAnimatableNone: (e) => {
            const t = e.match(sw);
            return t ? t.map(iw).join(' ') : e;
        },
    },
    ow = {
        ...Eu,
        color: xe,
        backgroundColor: xe,
        outlineColor: xe,
        fill: xe,
        stroke: xe,
        borderColor: xe,
        borderTopColor: xe,
        borderRightColor: xe,
        borderBottomColor: xe,
        borderLeftColor: xe,
        filter: ol,
        WebkitFilter: ol,
    },
    Wu = (e) => ow[e];
function qm(e, t) {
    let n = Wu(e);
    return (n !== ol && (n = Gt), n.getAnimatableNone ? n.getAnimatableNone(t) : void 0);
}
const aw = new Set(['auto', 'none', '0']);
function lw(e, t, n) {
    let r = 0,
        i;
    for (; r < e.length && !i; ) {
        const s = e[r];
        (typeof s == 'string' && !aw.has(s) && hi(s).values.length && (i = e[r]), r++);
    }
    if (i && n) for (const s of t) e[s] = qm(n, i);
}
const wf = (e) => e === dr || e === M,
    Sf = (e, t) => parseFloat(e.split(', ')[t]),
    kf =
        (e, t) =>
        (n, { transform: r }) => {
            if (r === 'none' || !r) return 0;
            const i = r.match(/^matrix3d\((.+)\)$/u);
            if (i) return Sf(i[1], t);
            {
                const s = r.match(/^matrix\((.+)\)$/u);
                return s ? Sf(s[1], e) : 0;
            }
        },
    uw = new Set(['x', 'y', 'z']),
    cw = fr.filter((e) => !uw.has(e));
function fw(e) {
    const t = [];
    return (
        cw.forEach((n) => {
            const r = e.getValue(n);
            r !== void 0 && (t.push([n, r.get()]), r.set(n.startsWith('scale') ? 1 : 0));
        }),
        t
    );
}
const sr = {
    width: ({ x: e }, { paddingLeft: t = '0', paddingRight: n = '0' }) =>
        e.max - e.min - parseFloat(t) - parseFloat(n),
    height: ({ y: e }, { paddingTop: t = '0', paddingBottom: n = '0' }) =>
        e.max - e.min - parseFloat(t) - parseFloat(n),
    top: (e, { top: t }) => parseFloat(t),
    left: (e, { left: t }) => parseFloat(t),
    bottom: ({ y: e }, { top: t }) => parseFloat(t) + (e.max - e.min),
    right: ({ x: e }, { left: t }) => parseFloat(t) + (e.max - e.min),
    x: kf(4, 13),
    y: kf(5, 14),
};
sr.translateX = sr.x;
sr.translateY = sr.y;
const dn = new Set();
let al = !1,
    ll = !1;
function eg() {
    if (ll) {
        const e = Array.from(dn).filter((r) => r.needsMeasurement),
            t = new Set(e.map((r) => r.element)),
            n = new Map();
        (t.forEach((r) => {
            const i = fw(r);
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
    ((ll = !1), (al = !1), dn.forEach((e) => e.complete()), dn.clear());
}
function tg() {
    dn.forEach((e) => {
        (e.readKeyframes(), e.needsMeasurement && (ll = !0));
    });
}
function dw() {
    (tg(), eg());
}
class Ku {
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
                ? (dn.add(this), al || ((al = !0), H.read(tg), H.resolveKeyframes(eg)))
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
            dn.delete(this));
    }
    cancel() {
        this.isComplete || ((this.isScheduled = !1), dn.delete(this));
    }
    resume() {
        this.isComplete || this.scheduleResolve();
    }
}
const ng = (e) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(e),
    hw = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function pw(e) {
    const t = hw.exec(e);
    if (!t) return [,];
    const [, n, r, i] = t;
    return [`--${n ?? r}`, i];
}
function rg(e, t, n = 1) {
    const [r, i] = pw(e);
    if (!r) return;
    const s = window.getComputedStyle(t).getPropertyValue(r);
    if (s) {
        const o = s.trim();
        return ng(o) ? parseFloat(o) : o;
    }
    return Tu(i) ? rg(i, t, n + 1) : i;
}
const ig = (e) => (t) => t.test(e),
    mw = { test: (e) => e === 'auto', parse: (e) => e },
    sg = [dr, M, ht, At, ox, sx, mw],
    Pf = (e) => sg.find(ig(e));
class og extends Ku {
    constructor(t, n, r, i, s) {
        super(t, n, r, i, s, !0);
    }
    readKeyframes() {
        const { unresolvedKeyframes: t, element: n, name: r } = this;
        if (!n || !n.current) return;
        super.readKeyframes();
        for (let l = 0; l < t.length; l++) {
            let u = t[l];
            if (typeof u == 'string' && ((u = u.trim()), Tu(u))) {
                const c = rg(u, n.current);
                (c !== void 0 && (t[l] = c), l === t.length - 1 && (this.finalKeyframe = u));
            }
        }
        if ((this.resolveNoneKeyframes(), !Fm.has(r) || t.length !== 2)) return;
        const [i, s] = t,
            o = Pf(i),
            a = Pf(s);
        if (o !== a)
            if (wf(o) && wf(a))
                for (let l = 0; l < t.length; l++) {
                    const u = t[l];
                    typeof u == 'string' && (t[l] = parseFloat(u));
                }
            else this.needsMeasurement = !0;
    }
    resolveNoneKeyframes() {
        const { unresolvedKeyframes: t, name: n } = this,
            r = [];
        for (let i = 0; i < t.length; i++) Kx(t[i]) && r.push(i);
        r.length && lw(t, r, n);
    }
    measureInitialState() {
        const { element: t, unresolvedKeyframes: n, name: r } = this;
        if (!t || !t.current) return;
        (r === 'height' && (this.suspendedScrollY = window.pageYOffset),
            (this.measuredOrigin = sr[r](
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
        ((i[o] = sr[r](n.measureViewportBox(), window.getComputedStyle(n.current))),
            a !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = a),
            !((t = this.removedTransforms) === null || t === void 0) &&
                t.length &&
                this.removedTransforms.forEach(([l, u]) => {
                    n.getValue(l).set(u);
                }),
            this.resolveNoneKeyframes());
    }
}
const Cf = (e, t) =>
    t === 'zIndex'
        ? !1
        : !!(
              typeof e == 'number' ||
              Array.isArray(e) ||
              (typeof e == 'string' && (Gt.test(e) || e === '0') && !e.startsWith('url('))
          );
function gw(e) {
    const t = e[0];
    if (e.length === 1) return !0;
    for (let n = 0; n < e.length; n++) if (e[n] !== t) return !0;
}
function yw(e, t, n, r) {
    const i = e[0];
    if (i === null) return !1;
    if (t === 'display' || t === 'visibility') return !0;
    const s = e[e.length - 1],
        o = Cf(i, t),
        a = Cf(s, t);
    return !o || !a ? !1 : gw(e) || ((n === 'spring' || Mu(n)) && r);
}
const vw = (e) => e !== null;
function mo(e, { repeat: t, repeatType: n = 'loop' }, r) {
    const i = e.filter(vw),
        s = t && n !== 'loop' && t % 2 === 1 ? 0 : i.length - 1;
    return !s || r === void 0 ? i[s] : r;
}
const xw = 40;
class ag {
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
            (this.createdAt = pt.now()),
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
            ? this.resolvedAt - this.createdAt > xw
                ? this.resolvedAt
                : this.createdAt
            : this.createdAt;
    }
    get resolved() {
        return (!this._resolved && !this.hasAttemptedResolve && dw(), this._resolved);
    }
    onKeyframesResolved(t, n) {
        ((this.resolvedAt = pt.now()), (this.hasAttemptedResolve = !0));
        const {
            name: r,
            type: i,
            velocity: s,
            delay: o,
            onComplete: a,
            onUpdate: l,
            isGenerator: u,
        } = this.options;
        if (!u && !yw(t, r, i, s))
            if (o) this.options.duration = 0;
            else {
                (l && l(mo(t, this.options, n)), a && a(), this.resolveFinishedPromise());
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
const q = (e, t, n) => e + (t - e) * n;
function Go(e, t, n) {
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
function ww({ hue: e, saturation: t, lightness: n, alpha: r }) {
    ((e /= 360), (t /= 100), (n /= 100));
    let i = 0,
        s = 0,
        o = 0;
    if (!t) i = s = o = n;
    else {
        const a = n < 0.5 ? n * (1 + t) : n + t - n * t,
            l = 2 * n - a;
        ((i = Go(l, a, e + 1 / 3)), (s = Go(l, a, e)), (o = Go(l, a, e - 1 / 3)));
    }
    return {
        red: Math.round(i * 255),
        green: Math.round(s * 255),
        blue: Math.round(o * 255),
        alpha: r,
    };
}
function Bs(e, t) {
    return (n) => (n > 0 ? t : e);
}
const Qo = (e, t, n) => {
        const r = e * e,
            i = n * (t * t - r) + r;
        return i < 0 ? 0 : Math.sqrt(i);
    },
    Sw = [sl, ln, $n],
    kw = (e) => Sw.find((t) => t.test(e));
function Tf(e) {
    const t = kw(e);
    if (!t) return !1;
    let n = t.parse(e);
    return (t === $n && (n = ww(n)), n);
}
const Ef = (e, t) => {
        const n = Tf(e),
            r = Tf(t);
        if (!n || !r) return Bs(e, t);
        const i = { ...n };
        return (s) => (
            (i.red = Qo(n.red, r.red, s)),
            (i.green = Qo(n.green, r.green, s)),
            (i.blue = Qo(n.blue, r.blue, s)),
            (i.alpha = q(n.alpha, r.alpha, s)),
            ln.transform(i)
        );
    },
    Pw = (e, t) => (n) => t(e(n)),
    Ti = (...e) => e.reduce(Pw),
    ul = new Set(['none', 'hidden']);
function Cw(e, t) {
    return ul.has(e) ? (n) => (n <= 0 ? e : t) : (n) => (n >= 1 ? t : e);
}
function Tw(e, t) {
    return (n) => q(e, t, n);
}
function bu(e) {
    return typeof e == 'number'
        ? Tw
        : typeof e == 'string'
          ? Tu(e)
              ? Bs
              : xe.test(e)
                ? Ef
                : Rw
          : Array.isArray(e)
            ? lg
            : typeof e == 'object'
              ? xe.test(e)
                  ? Ef
                  : Ew
              : Bs;
}
function lg(e, t) {
    const n = [...e],
        r = n.length,
        i = e.map((s, o) => bu(s)(s, t[o]));
    return (s) => {
        for (let o = 0; o < r; o++) n[o] = i[o](s);
        return n;
    };
}
function Ew(e, t) {
    const n = { ...e, ...t },
        r = {};
    for (const i in n) e[i] !== void 0 && t[i] !== void 0 && (r[i] = bu(e[i])(e[i], t[i]));
    return (i) => {
        for (const s in r) n[s] = r[s](i);
        return n;
    };
}
function Lw(e, t) {
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
const Rw = (e, t) => {
    const n = Gt.createTransformer(t),
        r = hi(e),
        i = hi(t);
    return r.indexes.var.length === i.indexes.var.length &&
        r.indexes.color.length === i.indexes.color.length &&
        r.indexes.number.length >= i.indexes.number.length
        ? (ul.has(e) && !i.values.length) || (ul.has(t) && !r.values.length)
            ? Cw(e, t)
            : Ti(lg(Lw(r, i), i.values), n)
        : Bs(e, t);
};
function ug(e, t, n) {
    return typeof e == 'number' && typeof t == 'number' && typeof n == 'number'
        ? q(e, t, n)
        : bu(e)(e, t);
}
const Aw = 5;
function cg(e, t, n) {
    const r = Math.max(t - Aw, 0);
    return zu(n - e(r), t - r);
}
const ne = {
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
    Yo = 0.001;
function Ow({
    duration: e = ne.duration,
    bounce: t = ne.bounce,
    velocity: n = ne.velocity,
    mass: r = ne.mass,
}) {
    let i,
        s,
        o = 1 - t;
    ((o = mt(ne.minDamping, ne.maxDamping, o)),
        (e = mt(ne.minDuration, ne.maxDuration, kt(e))),
        o < 1
            ? ((i = (u) => {
                  const c = u * o,
                      f = c * e,
                      d = c - n,
                      m = cl(u, o),
                      y = Math.exp(-f);
                  return Yo - (d / m) * y;
              }),
              (s = (u) => {
                  const f = u * o * e,
                      d = f * n + n,
                      m = Math.pow(o, 2) * Math.pow(u, 2) * e,
                      y = Math.exp(-f),
                      v = cl(Math.pow(u, 2), o);
                  return ((-i(u) + Yo > 0 ? -1 : 1) * ((d - m) * y)) / v;
              }))
            : ((i = (u) => {
                  const c = Math.exp(-u * e),
                      f = (u - n) * e + 1;
                  return -Yo + c * f;
              }),
              (s = (u) => {
                  const c = Math.exp(-u * e),
                      f = (n - u) * (e * e);
                  return c * f;
              })));
    const a = 5 / e,
        l = Nw(i, s, a);
    if (((e = St(e)), isNaN(l)))
        return { stiffness: ne.stiffness, damping: ne.damping, duration: e };
    {
        const u = Math.pow(l, 2) * r;
        return { stiffness: u, damping: o * 2 * Math.sqrt(r * u), duration: e };
    }
}
const Dw = 12;
function Nw(e, t, n) {
    let r = n;
    for (let i = 1; i < Dw; i++) r = r - e(r) / t(r);
    return r;
}
function cl(e, t) {
    return e * Math.sqrt(1 - t * t);
}
const Mw = ['duration', 'bounce'],
    Vw = ['stiffness', 'damping', 'mass'];
function Lf(e, t) {
    return t.some((n) => e[n] !== void 0);
}
function _w(e) {
    let t = {
        velocity: ne.velocity,
        stiffness: ne.stiffness,
        damping: ne.damping,
        mass: ne.mass,
        isResolvedFromDuration: !1,
        ...e,
    };
    if (!Lf(e, Vw) && Lf(e, Mw))
        if (e.visualDuration) {
            const n = e.visualDuration,
                r = (2 * Math.PI) / (n * 1.2),
                i = r * r,
                s = 2 * mt(0.05, 1, 1 - (e.bounce || 0)) * Math.sqrt(i);
            t = { ...t, mass: ne.mass, stiffness: i, damping: s };
        } else {
            const n = Ow(e);
            ((t = { ...t, ...n, mass: ne.mass }), (t.isResolvedFromDuration = !0));
        }
    return t;
}
function fg(e = ne.visualDuration, t = ne.bounce) {
    const n = typeof e != 'object' ? { visualDuration: e, keyframes: [0, 1], bounce: t } : e;
    let { restSpeed: r, restDelta: i } = n;
    const s = n.keyframes[0],
        o = n.keyframes[n.keyframes.length - 1],
        a = { done: !1, value: s },
        {
            stiffness: l,
            damping: u,
            mass: c,
            duration: f,
            velocity: d,
            isResolvedFromDuration: m,
        } = _w({ ...n, velocity: -kt(n.velocity || 0) }),
        y = d || 0,
        v = u / (2 * Math.sqrt(l * c)),
        S = o - s,
        p = kt(Math.sqrt(l / c)),
        h = Math.abs(S) < 5;
    (r || (r = h ? ne.restSpeed.granular : ne.restSpeed.default),
        i || (i = h ? ne.restDelta.granular : ne.restDelta.default));
    let g;
    if (v < 1) {
        const w = cl(p, v);
        g = (P) => {
            const E = Math.exp(-v * p * P);
            return o - E * (((y + v * p * S) / w) * Math.sin(w * P) + S * Math.cos(w * P));
        };
    } else if (v === 1) g = (w) => o - Math.exp(-p * w) * (S + (y + p * S) * w);
    else {
        const w = p * Math.sqrt(v * v - 1);
        g = (P) => {
            const E = Math.exp(-v * p * P),
                k = Math.min(w * P, 300);
            return o - (E * ((y + v * p * S) * Math.sinh(k) + w * S * Math.cosh(k))) / w;
        };
    }
    const x = {
        calculatedDuration: (m && f) || null,
        next: (w) => {
            const P = g(w);
            if (m) a.done = w >= f;
            else {
                let E = 0;
                v < 1 && (E = w === 0 ? St(y) : cg(g, w, P));
                const k = Math.abs(E) <= r,
                    D = Math.abs(o - P) <= i;
                a.done = k && D;
            }
            return ((a.value = a.done ? o : P), a);
        },
        toString: () => {
            const w = Math.min(Am(x), nl),
                P = Om((E) => x.next(w * E).value, w, 30);
            return w + 'ms ' + P;
        },
    };
    return x;
}
function Rf({
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
    const f = e[0],
        d = { done: !1, value: f },
        m = (k) => (a !== void 0 && k < a) || (l !== void 0 && k > l),
        y = (k) => (a === void 0 ? l : l === void 0 || Math.abs(a - k) < Math.abs(l - k) ? a : l);
    let v = n * t;
    const S = f + v,
        p = o === void 0 ? S : o(S);
    p !== S && (v = p - f);
    const h = (k) => -v * Math.exp(-k / r),
        g = (k) => p + h(k),
        x = (k) => {
            const D = h(k),
                R = g(k);
            ((d.done = Math.abs(D) <= u), (d.value = d.done ? p : R));
        };
    let w, P;
    const E = (k) => {
        m(d.value) &&
            ((w = k),
            (P = fg({
                keyframes: [d.value, y(d.value)],
                velocity: cg(g, k, d.value),
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
            next: (k) => {
                let D = !1;
                return (
                    !P && w === void 0 && ((D = !0), x(k), E(k)),
                    w !== void 0 && k >= w ? P.next(k - w) : (!D && x(k), d)
                );
            },
        }
    );
}
const jw = Ci(0.42, 0, 1, 1),
    Fw = Ci(0, 0, 0.58, 1),
    dg = Ci(0.42, 0, 0.58, 1),
    Iw = (e) => Array.isArray(e) && typeof e[0] != 'number',
    zw = {
        linear: Ce,
        easeIn: jw,
        easeInOut: dg,
        easeOut: Fw,
        circIn: $u,
        circInOut: bm,
        circOut: Km,
        backIn: Bu,
        backInOut: Hm,
        backOut: Um,
        anticipate: Wm,
    },
    Af = (e) => {
        if (Vu(e)) {
            lm(e.length === 4);
            const [t, n, r, i] = e;
            return Ci(t, n, r, i);
        } else if (typeof e == 'string') return zw[e];
        return e;
    };
function Bw(e, t, n) {
    const r = [],
        i = n || ug,
        s = e.length - 1;
    for (let o = 0; o < s; o++) {
        let a = i(e[o], e[o + 1]);
        if (t) {
            const l = Array.isArray(t) ? t[o] || Ce : t;
            a = Ti(l, a);
        }
        r.push(a);
    }
    return r;
}
function Gu(e, t, { clamp: n = !0, ease: r, mixer: i } = {}) {
    const s = e.length;
    if ((lm(s === t.length), s === 1)) return () => t[0];
    if (s === 2 && t[0] === t[1]) return () => t[1];
    const o = e[0] === e[1];
    e[0] > e[s - 1] && ((e = [...e].reverse()), (t = [...t].reverse()));
    const a = Bw(t, r, i),
        l = a.length,
        u = (c) => {
            if (o && c < e[0]) return t[0];
            let f = 0;
            if (l > 1) for (; f < e.length - 2 && !(c < e[f + 1]); f++);
            const d = vn(e[f], e[f + 1], c);
            return a[f](d);
        };
    return n ? (c) => u(mt(e[0], e[s - 1], c)) : u;
}
function $w(e, t) {
    const n = e[e.length - 1];
    for (let r = 1; r <= t; r++) {
        const i = vn(0, t, r);
        e.push(q(n, 1, i));
    }
}
function hg(e) {
    const t = [0];
    return ($w(t, e.length - 1), t);
}
function Uw(e, t) {
    return e.map((n) => n * t);
}
function Hw(e, t) {
    return e.map(() => t || dg).splice(0, e.length - 1);
}
function $s({ duration: e = 300, keyframes: t, times: n, ease: r = 'easeInOut' }) {
    const i = Iw(r) ? r.map(Af) : Af(r),
        s = { done: !1, value: t[0] },
        o = Uw(n && n.length === t.length ? n : hg(t), e),
        a = Gu(o, t, { ease: Array.isArray(i) ? i : Hw(t, i) });
    return { calculatedDuration: e, next: (l) => ((s.value = a(l)), (s.done = l >= e), s) };
}
const Ww = (e) => {
        const t = ({ timestamp: n }) => e(n);
        return {
            start: () => H.update(t, !0),
            stop: () => rt(t),
            now: () => (le.isProcessing ? le.timestamp : pt.now()),
        };
    },
    Kw = { decay: Rf, inertia: Rf, tween: $s, keyframes: $s, spring: fg },
    bw = (e) => e / 100;
class go extends ag {
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
            o = (i == null ? void 0 : i.KeyframeResolver) || Ku,
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
            a = Mu(n) ? n : Kw[n] || $s;
        let l, u;
        a !== $s && typeof t[0] != 'number' && ((l = Ti(bw, ug(t[0], t[1]))), (t = [0, 100]));
        const c = a({ ...this.options, keyframes: t });
        (s === 'mirror' && (u = a({ ...this.options, keyframes: [...t].reverse(), velocity: -o })),
            c.calculatedDuration === null && (c.calculatedDuration = Am(c)));
        const { calculatedDuration: f } = c,
            d = f + i,
            m = d * (r + 1) - i;
        return {
            generator: c,
            mirroredGenerator: u,
            mapPercentToKeyframes: l,
            calculatedDuration: f,
            resolvedDuration: d,
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
            const { keyframes: k } = this.options;
            return { done: !0, value: k[k.length - 1] };
        }
        const {
            finalKeyframe: i,
            generator: s,
            mirroredGenerator: o,
            mapPercentToKeyframes: a,
            keyframes: l,
            calculatedDuration: u,
            totalDuration: c,
            resolvedDuration: f,
        } = r;
        if (this.startTime === null) return s.next(0);
        const { delay: d, repeat: m, repeatType: y, repeatDelay: v, onUpdate: S } = this.options;
        (this.speed > 0
            ? (this.startTime = Math.min(this.startTime, t))
            : this.speed < 0 && (this.startTime = Math.min(t - c / this.speed, this.startTime)),
            n
                ? (this.currentTime = t)
                : this.holdTime !== null
                  ? (this.currentTime = this.holdTime)
                  : (this.currentTime = Math.round(t - this.startTime) * this.speed));
        const p = this.currentTime - d * (this.speed >= 0 ? 1 : -1),
            h = this.speed >= 0 ? p < 0 : p > c;
        ((this.currentTime = Math.max(p, 0)),
            this.state === 'finished' && this.holdTime === null && (this.currentTime = c));
        let g = this.currentTime,
            x = s;
        if (m) {
            const k = Math.min(this.currentTime, c) / f;
            let D = Math.floor(k),
                R = k % 1;
            (!R && k >= 1 && (R = 1),
                R === 1 && D--,
                (D = Math.min(D, m + 1)),
                !!(D % 2) &&
                    (y === 'reverse'
                        ? ((R = 1 - R), v && (R -= v / f))
                        : y === 'mirror' && (x = o)),
                (g = mt(0, 1, R) * f));
        }
        const w = h ? { done: !1, value: l[0] } : x.next(g);
        a && (w.value = a(w.value));
        let { done: P } = w;
        !h && u !== null && (P = this.speed >= 0 ? this.currentTime >= c : this.currentTime <= 0);
        const E =
            this.holdTime === null &&
            (this.state === 'finished' || (this.state === 'running' && P));
        return (
            E && i !== void 0 && (w.value = mo(l, this.options, i)),
            S && S(w.value),
            E && this.finish(),
            w
        );
    }
    get duration() {
        const { resolved: t } = this;
        return t ? kt(t.calculatedDuration) : 0;
    }
    get time() {
        return kt(this.currentTime);
    }
    set time(t) {
        ((t = St(t)),
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
        ((this.playbackSpeed = t), n && (this.time = kt(this.currentTime)));
    }
    play() {
        if ((this.resolver.isScheduled || this.resolver.resume(), !this._resolved)) {
            this.pendingPlayState = 'running';
            return;
        }
        if (this.isStopped) return;
        const { driver: t = Ww, onPlay: n, startTime: r } = this.options;
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
function Gw(e) {
    return new go(e);
}
const Qw = new Set(['opacity', 'clipPath', 'filter', 'transform']);
function Yw(
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
const Xw = vu(() => Object.hasOwnProperty.call(Element.prototype, 'animate')),
    Us = 10,
    Zw = 2e4;
function Jw(e) {
    return Mu(e.type) || e.type === 'spring' || !Dm(e.ease);
}
function qw(e, t) {
    const n = new go({ ...t, keyframes: e, repeat: 0, delay: 0, isGenerator: !0 });
    let r = { done: !1, value: e[0] };
    const i = [];
    let s = 0;
    for (; !r.done && s < Zw; ) ((r = n.sample(s)), i.push(r.value), (s += Us));
    return { times: void 0, keyframes: i, duration: s - Us, ease: 'linear' };
}
const pg = { anticipate: Wm, backInOut: Hm, circInOut: bm };
function e1(e) {
    return e in pg;
}
class Of extends ag {
    constructor(t) {
        super(t);
        const { name: n, motionValue: r, element: i, keyframes: s } = this.options;
        ((this.resolver = new og(s, (o, a) => this.onKeyframesResolved(o, a), n, r, i)),
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
        if ((typeof s == 'string' && zs() && e1(s) && (s = pg[s]), Jw(this.options))) {
            const { onComplete: f, onUpdate: d, motionValue: m, element: y, ...v } = this.options,
                S = qw(t, v);
            ((t = S.keyframes),
                t.length === 1 && (t[1] = t[0]),
                (r = S.duration),
                (i = S.times),
                (s = S.ease),
                (o = 'keyframes'));
        }
        const c = Yw(a.owner.current, l, t, { ...this.options, duration: r, times: i, ease: s });
        return (
            (c.startTime = u ?? this.calcStartTime()),
            this.pendingTimeline
                ? (pf(c, this.pendingTimeline), (this.pendingTimeline = void 0))
                : (c.onfinish = () => {
                      const { onComplete: f } = this.options;
                      (a.set(mo(t, this.options, n)),
                          f && f(),
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
        return kt(n);
    }
    get time() {
        const { resolved: t } = this;
        if (!t) return 0;
        const { animation: n } = t;
        return kt(n.currentTime || 0);
    }
    set time(t) {
        const { resolved: n } = this;
        if (!n) return;
        const { animation: r } = n;
        r.currentTime = St(t);
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
            if (!n) return Ce;
            const { animation: r } = n;
            pf(r, t);
        }
        return Ce;
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
            const { motionValue: u, onUpdate: c, onComplete: f, element: d, ...m } = this.options,
                y = new go({
                    ...m,
                    keyframes: r,
                    duration: i,
                    type: s,
                    ease: o,
                    times: a,
                    isGenerator: !0,
                }),
                v = St(this.time);
            u.setWithVelocity(y.sample(v - Us).value, y.sample(v).value, Us);
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
            Xw() && r && Qw.has(r) && !l && !u && !i && s !== 'mirror' && o !== 0 && a !== 'inertia'
        );
    }
}
const t1 = { type: 'spring', stiffness: 500, damping: 25, restSpeed: 10 },
    n1 = (e) => ({
        type: 'spring',
        stiffness: 550,
        damping: e === 0 ? 2 * Math.sqrt(550) : 30,
        restSpeed: 10,
    }),
    r1 = { type: 'keyframes', duration: 0.8 },
    i1 = { type: 'keyframes', ease: [0.25, 0.1, 0.35, 1], duration: 0.3 },
    s1 = (e, { keyframes: t }) =>
        t.length > 2 ? r1 : kn.has(e) ? (e.startsWith('scale') ? n1(t[1]) : t1) : i1;
function o1({
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
const Qu =
    (e, t, n, r = {}, i, s) =>
    (o) => {
        const a = Nu(r, e) || {},
            l = a.delay || r.delay || 0;
        let { elapsed: u = 0 } = r;
        u = u - St(l);
        let c = {
            keyframes: Array.isArray(n) ? n : [null, n],
            ease: 'easeOut',
            velocity: t.getVelocity(),
            ...a,
            delay: -u,
            onUpdate: (d) => {
                (t.set(d), a.onUpdate && a.onUpdate(d));
            },
            onComplete: () => {
                (o(), a.onComplete && a.onComplete());
            },
            name: e,
            motionValue: t,
            element: s ? void 0 : i,
        };
        (o1(a) || (c = { ...c, ...s1(e, c) }),
            c.duration && (c.duration = St(c.duration)),
            c.repeatDelay && (c.repeatDelay = St(c.repeatDelay)),
            c.from !== void 0 && (c.keyframes[0] = c.from));
        let f = !1;
        if (
            ((c.type === !1 || (c.duration === 0 && !c.repeatDelay)) &&
                ((c.duration = 0), c.delay === 0 && (f = !0)),
            f && !s && t.get() !== void 0)
        ) {
            const d = mo(c.keyframes, a);
            if (d !== void 0)
                return (
                    H.update(() => {
                        (c.onUpdate(d), c.onComplete());
                    }),
                    new Lx([])
                );
        }
        return !s && Of.supports(c) ? new Of(c) : new go(c);
    };
function a1({ protectedKeys: e, needsAnimating: t }, n) {
    const r = e.hasOwnProperty(n) && t[n] !== !0;
    return ((t[n] = !1), r);
}
function mg(e, t, { delay: n = 0, transitionOverride: r, type: i } = {}) {
    var s;
    let { transition: o = e.getDefaultTransition(), transitionEnd: a, ...l } = t;
    r && (o = r);
    const u = [],
        c = i && e.animationState && e.animationState.getState()[i];
    for (const f in l) {
        const d = e.getValue(f, (s = e.latestValues[f]) !== null && s !== void 0 ? s : null),
            m = l[f];
        if (m === void 0 || (c && a1(c, f))) continue;
        const y = { delay: n, ...Nu(o || {}, f) };
        let v = !1;
        if (window.MotionHandoffAnimation) {
            const p = Im(e);
            if (p) {
                const h = window.MotionHandoffAnimation(p, f, H);
                h !== null && ((y.startTime = h), (v = !0));
            }
        }
        (il(e, f),
            d.start(Qu(f, d, m, e.shouldReduceMotion && Fm.has(f) ? { type: !1 } : y, e, v)));
        const S = d.animation;
        S && u.push(S);
    }
    return (
        a &&
            Promise.all(u).then(() => {
                H.update(() => {
                    a && Bx(e, a);
                });
            }),
        u
    );
}
function fl(e, t, n = {}) {
    var r;
    const i = po(
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
    const o = i ? () => Promise.all(mg(e, i, n)) : () => Promise.resolve(),
        a =
            e.variantChildren && e.variantChildren.size
                ? (u = 0) => {
                      const { delayChildren: c = 0, staggerChildren: f, staggerDirection: d } = s;
                      return l1(e, t, c + u, f, d, n);
                  }
                : () => Promise.resolve(),
        { when: l } = s;
    if (l) {
        const [u, c] = l === 'beforeChildren' ? [o, a] : [a, o];
        return u().then(() => c());
    } else return Promise.all([o(), a(n.delay)]);
}
function l1(e, t, n = 0, r = 0, i = 1, s) {
    const o = [],
        a = (e.variantChildren.size - 1) * r,
        l = i === 1 ? (u = 0) => u * r : (u = 0) => a - u * r;
    return (
        Array.from(e.variantChildren)
            .sort(u1)
            .forEach((u, c) => {
                (u.notify('AnimationStart', t),
                    o.push(
                        fl(u, t, { ...s, delay: n + l(c) }).then(() =>
                            u.notify('AnimationComplete', t),
                        ),
                    ));
            }),
        Promise.all(o)
    );
}
function u1(e, t) {
    return e.sortNodePosition(t);
}
function c1(e, t, n = {}) {
    e.notify('AnimationStart', t);
    let r;
    if (Array.isArray(t)) {
        const i = t.map((s) => fl(e, s, n));
        r = Promise.all(i);
    } else if (typeof t == 'string') r = fl(e, t, n);
    else {
        const i = typeof t == 'function' ? po(e, t, n.custom) : t;
        r = Promise.all(mg(e, i, n));
    }
    return r.then(() => {
        e.notify('AnimationComplete', t);
    });
}
const f1 = wu.length;
function gg(e) {
    if (!e) return;
    if (!e.isControllingVariants) {
        const n = e.parent ? gg(e.parent) || {} : {};
        return (e.props.initial !== void 0 && (n.initial = e.props.initial), n);
    }
    const t = {};
    for (let n = 0; n < f1; n++) {
        const r = wu[n],
            i = e.props[r];
        (fi(i) || i === !1) && (t[r] = i);
    }
    return t;
}
const d1 = [...xu].reverse(),
    h1 = xu.length;
function p1(e) {
    return (t) => Promise.all(t.map(({ animation: n, options: r }) => c1(e, n, r)));
}
function m1(e) {
    let t = p1(e),
        n = Df(),
        r = !0;
    const i = (l) => (u, c) => {
        var f;
        const d = po(
            e,
            c,
            l === 'exit'
                ? (f = e.presenceContext) === null || f === void 0
                    ? void 0
                    : f.custom
                : void 0,
        );
        if (d) {
            const { transition: m, transitionEnd: y, ...v } = d;
            u = { ...u, ...v, ...y };
        }
        return u;
    };
    function s(l) {
        t = l(e);
    }
    function o(l) {
        const { props: u } = e,
            c = gg(e.parent) || {},
            f = [],
            d = new Set();
        let m = {},
            y = 1 / 0;
        for (let S = 0; S < h1; S++) {
            const p = d1[S],
                h = n[p],
                g = u[p] !== void 0 ? u[p] : c[p],
                x = fi(g),
                w = p === l ? h.isActive : null;
            w === !1 && (y = S);
            let P = g === c[p] && g !== u[p] && x;
            if (
                (P && r && e.manuallyAnimateOnMount && (P = !1),
                (h.protectedKeys = { ...m }),
                (!h.isActive && w === null) ||
                    (!g && !h.prevProp) ||
                    fo(g) ||
                    typeof g == 'boolean')
            )
                continue;
            const E = g1(h.prevProp, g);
            let k = E || (p === l && h.isActive && !P && x) || (S > y && x),
                D = !1;
            const R = Array.isArray(g) ? g : [g];
            let X = R.reduce(i(p), {});
            w === !1 && (X = {});
            const { prevResolvedValues: z = {} } = h,
                j = { ...z, ...X },
                F = (U) => {
                    ((k = !0), d.has(U) && ((D = !0), d.delete(U)), (h.needsAnimating[U] = !0));
                    const L = e.getValue(U);
                    L && (L.liveStyle = !1);
                };
            for (const U in j) {
                const L = X[U],
                    N = z[U];
                if (m.hasOwnProperty(U)) continue;
                let _ = !1;
                (tl(L) && tl(N) ? (_ = !Lm(L, N)) : (_ = L !== N),
                    _
                        ? L != null
                            ? F(U)
                            : d.add(U)
                        : L !== void 0 && d.has(U)
                          ? F(U)
                          : (h.protectedKeys[U] = !0));
            }
            ((h.prevProp = g),
                (h.prevResolvedValues = X),
                h.isActive && (m = { ...m, ...X }),
                r && e.blockInitialAnimation && (k = !1),
                k &&
                    (!(P && E) || D) &&
                    f.push(...R.map((U) => ({ animation: U, options: { type: p } }))));
        }
        if (d.size) {
            const S = {};
            (d.forEach((p) => {
                const h = e.getBaseTarget(p),
                    g = e.getValue(p);
                (g && (g.liveStyle = !0), (S[p] = h ?? null));
            }),
                f.push({ animation: S }));
        }
        let v = !!f.length;
        return (
            r &&
                (u.initial === !1 || u.initial === u.animate) &&
                !e.manuallyAnimateOnMount &&
                (v = !1),
            (r = !1),
            v ? t(f) : Promise.resolve()
        );
    }
    function a(l, u) {
        var c;
        if (n[l].isActive === u) return Promise.resolve();
        ((c = e.variantChildren) === null ||
            c === void 0 ||
            c.forEach((d) => {
                var m;
                return (m = d.animationState) === null || m === void 0 ? void 0 : m.setActive(l, u);
            }),
            (n[l].isActive = u));
        const f = o(l);
        for (const d in n) n[d].protectedKeys = {};
        return f;
    }
    return {
        animateChanges: o,
        setActive: a,
        setAnimateFunction: s,
        getState: () => n,
        reset: () => {
            ((n = Df()), (r = !0));
        },
    };
}
function g1(e, t) {
    return typeof t == 'string' ? t !== e : Array.isArray(t) ? !Lm(t, e) : !1;
}
function qt(e = !1) {
    return { isActive: e, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
}
function Df() {
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
class Zt {
    constructor(t) {
        ((this.isMounted = !1), (this.node = t));
    }
    update() {}
}
class y1 extends Zt {
    constructor(t) {
        (super(t), t.animationState || (t.animationState = m1(t)));
    }
    updateAnimationControlsSubscription() {
        const { animate: t } = this.node.getProps();
        fo(t) && (this.unmountControls = t.subscribe(this.node));
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
let v1 = 0;
class x1 extends Zt {
    constructor() {
        (super(...arguments), (this.id = v1++));
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
const w1 = { animation: { Feature: y1 }, exit: { Feature: x1 } };
function pi(e, t, n, r = { passive: !0 }) {
    return (e.addEventListener(t, n, r), () => e.removeEventListener(t, n));
}
function Ei(e) {
    return { point: { x: e.pageX, y: e.pageY } };
}
const S1 = (e) => (t) => _u(t) && e(t, Ei(t));
function Ur(e, t, n, r) {
    return pi(e, t, S1(n), r);
}
const Nf = (e, t) => Math.abs(e - t);
function k1(e, t) {
    const n = Nf(e.x, t.x),
        r = Nf(e.y, t.y);
    return Math.sqrt(n ** 2 + r ** 2);
}
class yg {
    constructor(t, n, { transformPagePoint: r, contextWindow: i, dragSnapToOrigin: s = !1 } = {}) {
        if (
            ((this.startEvent = null),
            (this.lastMoveEvent = null),
            (this.lastMoveEventInfo = null),
            (this.handlers = {}),
            (this.contextWindow = window),
            (this.updatePoint = () => {
                if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return;
                const f = Zo(this.lastMoveEventInfo, this.history),
                    d = this.startEvent !== null,
                    m = k1(f.offset, { x: 0, y: 0 }) >= 3;
                if (!d && !m) return;
                const { point: y } = f,
                    { timestamp: v } = le;
                this.history.push({ ...y, timestamp: v });
                const { onStart: S, onMove: p } = this.handlers;
                (d || (S && S(this.lastMoveEvent, f), (this.startEvent = this.lastMoveEvent)),
                    p && p(this.lastMoveEvent, f));
            }),
            (this.handlePointerMove = (f, d) => {
                ((this.lastMoveEvent = f),
                    (this.lastMoveEventInfo = Xo(d, this.transformPagePoint)),
                    H.update(this.updatePoint, !0));
            }),
            (this.handlePointerUp = (f, d) => {
                this.end();
                const { onEnd: m, onSessionEnd: y, resumeAnimation: v } = this.handlers;
                if (
                    (this.dragSnapToOrigin && v && v(),
                    !(this.lastMoveEvent && this.lastMoveEventInfo))
                )
                    return;
                const S = Zo(
                    f.type === 'pointercancel'
                        ? this.lastMoveEventInfo
                        : Xo(d, this.transformPagePoint),
                    this.history,
                );
                (this.startEvent && m && m(f, S), y && y(f, S));
            }),
            !_u(t))
        )
            return;
        ((this.dragSnapToOrigin = s),
            (this.handlers = n),
            (this.transformPagePoint = r),
            (this.contextWindow = i || window));
        const o = Ei(t),
            a = Xo(o, this.transformPagePoint),
            { point: l } = a,
            { timestamp: u } = le;
        this.history = [{ ...l, timestamp: u }];
        const { onSessionStart: c } = n;
        (c && c(t, Zo(a, this.history)),
            (this.removeListeners = Ti(
                Ur(this.contextWindow, 'pointermove', this.handlePointerMove),
                Ur(this.contextWindow, 'pointerup', this.handlePointerUp),
                Ur(this.contextWindow, 'pointercancel', this.handlePointerUp),
            )));
    }
    updateHandlers(t) {
        this.handlers = t;
    }
    end() {
        (this.removeListeners && this.removeListeners(), rt(this.updatePoint));
    }
}
function Xo(e, t) {
    return t ? { point: t(e.point) } : e;
}
function Mf(e, t) {
    return { x: e.x - t.x, y: e.y - t.y };
}
function Zo({ point: e }, t) {
    return { point: e, delta: Mf(e, vg(t)), offset: Mf(e, P1(t)), velocity: C1(t, 0.1) };
}
function P1(e) {
    return e[0];
}
function vg(e) {
    return e[e.length - 1];
}
function C1(e, t) {
    if (e.length < 2) return { x: 0, y: 0 };
    let n = e.length - 1,
        r = null;
    const i = vg(e);
    for (; n >= 0 && ((r = e[n]), !(i.timestamp - r.timestamp > St(t))); ) n--;
    if (!r) return { x: 0, y: 0 };
    const s = kt(i.timestamp - r.timestamp);
    if (s === 0) return { x: 0, y: 0 };
    const o = { x: (i.x - r.x) / s, y: (i.y - r.y) / s };
    return (o.x === 1 / 0 && (o.x = 0), o.y === 1 / 0 && (o.y = 0), o);
}
const xg = 1e-4,
    T1 = 1 - xg,
    E1 = 1 + xg,
    wg = 0.01,
    L1 = 0 - wg,
    R1 = 0 + wg;
function Fe(e) {
    return e.max - e.min;
}
function A1(e, t, n) {
    return Math.abs(e - t) <= n;
}
function Vf(e, t, n, r = 0.5) {
    ((e.origin = r),
        (e.originPoint = q(t.min, t.max, e.origin)),
        (e.scale = Fe(n) / Fe(t)),
        (e.translate = q(n.min, n.max, e.origin) - e.originPoint),
        ((e.scale >= T1 && e.scale <= E1) || isNaN(e.scale)) && (e.scale = 1),
        ((e.translate >= L1 && e.translate <= R1) || isNaN(e.translate)) && (e.translate = 0));
}
function Hr(e, t, n, r) {
    (Vf(e.x, t.x, n.x, r ? r.originX : void 0), Vf(e.y, t.y, n.y, r ? r.originY : void 0));
}
function _f(e, t, n) {
    ((e.min = n.min + t.min), (e.max = e.min + Fe(t)));
}
function O1(e, t, n) {
    (_f(e.x, t.x, n.x), _f(e.y, t.y, n.y));
}
function jf(e, t, n) {
    ((e.min = t.min - n.min), (e.max = e.min + Fe(t)));
}
function Wr(e, t, n) {
    (jf(e.x, t.x, n.x), jf(e.y, t.y, n.y));
}
function D1(e, { min: t, max: n }, r) {
    return (
        t !== void 0 && e < t
            ? (e = r ? q(t, e, r.min) : Math.max(e, t))
            : n !== void 0 && e > n && (e = r ? q(n, e, r.max) : Math.min(e, n)),
        e
    );
}
function Ff(e, t, n) {
    return {
        min: t !== void 0 ? e.min + t : void 0,
        max: n !== void 0 ? e.max + n - (e.max - e.min) : void 0,
    };
}
function N1(e, { top: t, left: n, bottom: r, right: i }) {
    return { x: Ff(e.x, n, i), y: Ff(e.y, t, r) };
}
function If(e, t) {
    let n = t.min - e.min,
        r = t.max - e.max;
    return (t.max - t.min < e.max - e.min && ([n, r] = [r, n]), { min: n, max: r });
}
function M1(e, t) {
    return { x: If(e.x, t.x), y: If(e.y, t.y) };
}
function V1(e, t) {
    let n = 0.5;
    const r = Fe(e),
        i = Fe(t);
    return (
        i > r ? (n = vn(t.min, t.max - r, e.min)) : r > i && (n = vn(e.min, e.max - i, t.min)),
        mt(0, 1, n)
    );
}
function _1(e, t) {
    const n = {};
    return (
        t.min !== void 0 && (n.min = t.min - e.min),
        t.max !== void 0 && (n.max = t.max - e.min),
        n
    );
}
const dl = 0.35;
function j1(e = dl) {
    return (
        e === !1 ? (e = 0) : e === !0 && (e = dl),
        { x: zf(e, 'left', 'right'), y: zf(e, 'top', 'bottom') }
    );
}
function zf(e, t, n) {
    return { min: Bf(e, t), max: Bf(e, n) };
}
function Bf(e, t) {
    return typeof e == 'number' ? e : e[t] || 0;
}
const $f = () => ({ translate: 0, scale: 1, origin: 0, originPoint: 0 }),
    Un = () => ({ x: $f(), y: $f() }),
    Uf = () => ({ min: 0, max: 0 }),
    ie = () => ({ x: Uf(), y: Uf() });
function $e(e) {
    return [e('x'), e('y')];
}
function Sg({ top: e, left: t, right: n, bottom: r }) {
    return { x: { min: t, max: n }, y: { min: e, max: r } };
}
function F1({ x: e, y: t }) {
    return { top: t.min, right: e.max, bottom: t.max, left: e.min };
}
function I1(e, t) {
    if (!t) return e;
    const n = t({ x: e.left, y: e.top }),
        r = t({ x: e.right, y: e.bottom });
    return { top: n.y, left: n.x, bottom: r.y, right: r.x };
}
function Jo(e) {
    return e === void 0 || e === 1;
}
function hl({ scale: e, scaleX: t, scaleY: n }) {
    return !Jo(e) || !Jo(t) || !Jo(n);
}
function nn(e) {
    return hl(e) || kg(e) || e.z || e.rotate || e.rotateX || e.rotateY || e.skewX || e.skewY;
}
function kg(e) {
    return Hf(e.x) || Hf(e.y);
}
function Hf(e) {
    return e && e !== '0%';
}
function Hs(e, t, n) {
    const r = e - n,
        i = t * r;
    return n + i;
}
function Wf(e, t, n, r, i) {
    return (i !== void 0 && (e = Hs(e, i, r)), Hs(e, n, r) + t);
}
function pl(e, t = 0, n = 1, r, i) {
    ((e.min = Wf(e.min, t, n, r, i)), (e.max = Wf(e.max, t, n, r, i)));
}
function Pg(e, { x: t, y: n }) {
    (pl(e.x, t.translate, t.scale, t.originPoint), pl(e.y, n.translate, n.scale, n.originPoint));
}
const Kf = 0.999999999999,
    bf = 1.0000000000001;
function z1(e, t, n, r = !1) {
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
                Wn(e, { x: -s.scroll.offset.x, y: -s.scroll.offset.y }),
            o && ((t.x *= o.x.scale), (t.y *= o.y.scale), Pg(e, o)),
            r && nn(s.latestValues) && Wn(e, s.latestValues));
    }
    (t.x < bf && t.x > Kf && (t.x = 1), t.y < bf && t.y > Kf && (t.y = 1));
}
function Hn(e, t) {
    ((e.min = e.min + t), (e.max = e.max + t));
}
function Gf(e, t, n, r, i = 0.5) {
    const s = q(e.min, e.max, i);
    pl(e, t, n, s, r);
}
function Wn(e, t) {
    (Gf(e.x, t.x, t.scaleX, t.scale, t.originX), Gf(e.y, t.y, t.scaleY, t.scale, t.originY));
}
function Cg(e, t) {
    return Sg(I1(e.getBoundingClientRect(), t));
}
function B1(e, t, n) {
    const r = Cg(e, n),
        { scroll: i } = t;
    return (i && (Hn(r.x, i.offset.x), Hn(r.y, i.offset.y)), r);
}
const Tg = ({ current: e }) => (e ? e.ownerDocument.defaultView : null),
    $1 = new WeakMap();
class U1 {
    constructor(t) {
        ((this.openDragLock = null),
            (this.isDragging = !1),
            (this.currentDirection = null),
            (this.originPoint = { x: 0, y: 0 }),
            (this.constraints = !1),
            (this.hasMutatedConstraints = !1),
            (this.elastic = ie()),
            (this.visualElement = t));
    }
    start(t, { snapToCursor: n = !1 } = {}) {
        const { presenceContext: r } = this.visualElement;
        if (r && r.isPresent === !1) return;
        const i = (c) => {
                const { dragSnapToOrigin: f } = this.getProps();
                (f ? this.pauseAnimation() : this.stopAnimation(),
                    n && this.snapToCursor(Ei(c).point));
            },
            s = (c, f) => {
                const { drag: d, dragPropagation: m, onDragStart: y } = this.getProps();
                if (
                    d &&
                    !m &&
                    (this.openDragLock && this.openDragLock(),
                    (this.openDragLock = _x(d)),
                    !this.openDragLock)
                )
                    return;
                ((this.isDragging = !0),
                    (this.currentDirection = null),
                    this.resolveConstraints(),
                    this.visualElement.projection &&
                        ((this.visualElement.projection.isAnimationBlocked = !0),
                        (this.visualElement.projection.target = void 0)),
                    $e((S) => {
                        let p = this.getAxisMotionValue(S).get() || 0;
                        if (ht.test(p)) {
                            const { projection: h } = this.visualElement;
                            if (h && h.layout) {
                                const g = h.layout.layoutBox[S];
                                g && (p = Fe(g) * (parseFloat(p) / 100));
                            }
                        }
                        this.originPoint[S] = p;
                    }),
                    y && H.postRender(() => y(c, f)),
                    il(this.visualElement, 'transform'));
                const { animationState: v } = this.visualElement;
                v && v.setActive('whileDrag', !0);
            },
            o = (c, f) => {
                const {
                    dragPropagation: d,
                    dragDirectionLock: m,
                    onDirectionLock: y,
                    onDrag: v,
                } = this.getProps();
                if (!d && !this.openDragLock) return;
                const { offset: S } = f;
                if (m && this.currentDirection === null) {
                    ((this.currentDirection = H1(S)),
                        this.currentDirection !== null && y && y(this.currentDirection));
                    return;
                }
                (this.updateAxis('x', f.point, S),
                    this.updateAxis('y', f.point, S),
                    this.visualElement.render(),
                    v && v(c, f));
            },
            a = (c, f) => this.stop(c, f),
            l = () =>
                $e((c) => {
                    var f;
                    return (
                        this.getAnimationState(c) === 'paused' &&
                        ((f = this.getAxisMotionValue(c).animation) === null || f === void 0
                            ? void 0
                            : f.play())
                    );
                }),
            { dragSnapToOrigin: u } = this.getProps();
        this.panSession = new yg(
            t,
            { onSessionStart: i, onStart: s, onMove: o, onSessionEnd: a, resumeAnimation: l },
            {
                transformPagePoint: this.visualElement.getTransformPagePoint(),
                dragSnapToOrigin: u,
                contextWindow: Tg(this.visualElement),
            },
        );
    }
    stop(t, n) {
        const r = this.isDragging;
        if ((this.cancel(), !r)) return;
        const { velocity: i } = n;
        this.startAnimation(i);
        const { onDragEnd: s } = this.getProps();
        s && H.postRender(() => s(t, n));
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
        if (!r || !Qi(t, i, this.currentDirection)) return;
        const s = this.getAxisMotionValue(t);
        let o = this.originPoint[t] + r[t];
        (this.constraints &&
            this.constraints[t] &&
            (o = D1(o, this.constraints[t], this.elastic[t])),
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
        (n && Bn(n)
            ? this.constraints || (this.constraints = this.resolveRefConstraints())
            : n && i
              ? (this.constraints = N1(i.layoutBox, n))
              : (this.constraints = !1),
            (this.elastic = j1(r)),
            s !== this.constraints &&
                i &&
                this.constraints &&
                !this.hasMutatedConstraints &&
                $e((o) => {
                    this.constraints !== !1 &&
                        this.getAxisMotionValue(o) &&
                        (this.constraints[o] = _1(i.layoutBox[o], this.constraints[o]));
                }));
    }
    resolveRefConstraints() {
        const { dragConstraints: t, onMeasureDragConstraints: n } = this.getProps();
        if (!t || !Bn(t)) return !1;
        const r = t.current,
            { projection: i } = this.visualElement;
        if (!i || !i.layout) return !1;
        const s = B1(r, i.root, this.visualElement.getTransformPagePoint());
        let o = M1(i.layout.layoutBox, s);
        if (n) {
            const a = n(F1(o));
            ((this.hasMutatedConstraints = !!a), a && (o = Sg(a)));
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
            u = $e((c) => {
                if (!Qi(c, n, this.currentDirection)) return;
                let f = (l && l[c]) || {};
                o && (f = { min: 0, max: 0 });
                const d = i ? 200 : 1e6,
                    m = i ? 40 : 1e7,
                    y = {
                        type: 'inertia',
                        velocity: r ? t[c] : 0,
                        bounceStiffness: d,
                        bounceDamping: m,
                        timeConstant: 750,
                        restDelta: 1,
                        restSpeed: 10,
                        ...s,
                        ...f,
                    };
                return this.startAxisValueAnimation(c, y);
            });
        return Promise.all(u).then(a);
    }
    startAxisValueAnimation(t, n) {
        const r = this.getAxisMotionValue(t);
        return (il(this.visualElement, t), r.start(Qu(t, r, 0, n, this.visualElement, !1)));
    }
    stopAnimation() {
        $e((t) => this.getAxisMotionValue(t).stop());
    }
    pauseAnimation() {
        $e((t) => {
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
        $e((n) => {
            const { drag: r } = this.getProps();
            if (!Qi(n, r, this.currentDirection)) return;
            const { projection: i } = this.visualElement,
                s = this.getAxisMotionValue(n);
            if (i && i.layout) {
                const { min: o, max: a } = i.layout.layoutBox[n];
                s.set(t[n] - q(o, a, 0.5));
            }
        });
    }
    scalePositionWithinConstraints() {
        if (!this.visualElement.current) return;
        const { drag: t, dragConstraints: n } = this.getProps(),
            { projection: r } = this.visualElement;
        if (!Bn(n) || !r || !this.constraints) return;
        this.stopAnimation();
        const i = { x: 0, y: 0 };
        $e((o) => {
            const a = this.getAxisMotionValue(o);
            if (a && this.constraints !== !1) {
                const l = a.get();
                i[o] = V1({ min: l, max: l }, this.constraints[o]);
            }
        });
        const { transformTemplate: s } = this.visualElement.getProps();
        ((this.visualElement.current.style.transform = s ? s({}, '') : 'none'),
            r.root && r.root.updateScroll(),
            r.updateLayout(),
            this.resolveConstraints(),
            $e((o) => {
                if (!Qi(o, t, null)) return;
                const a = this.getAxisMotionValue(o),
                    { min: l, max: u } = this.constraints[o];
                a.set(q(l, u, i[o]));
            }));
    }
    addListeners() {
        if (!this.visualElement.current) return;
        $1.set(this.visualElement, this);
        const t = this.visualElement.current,
            n = Ur(t, 'pointerdown', (l) => {
                const { drag: u, dragListener: c = !0 } = this.getProps();
                u && c && this.start(l);
            }),
            r = () => {
                const { dragConstraints: l } = this.getProps();
                Bn(l) && l.current && (this.constraints = this.resolveRefConstraints());
            },
            { projection: i } = this.visualElement,
            s = i.addEventListener('measure', r);
        (i && !i.layout && (i.root && i.root.updateScroll(), i.updateLayout()), H.read(r));
        const o = pi(window, 'resize', () => this.scalePositionWithinConstraints()),
            a = i.addEventListener('didUpdate', ({ delta: l, hasLayoutChanged: u }) => {
                this.isDragging &&
                    u &&
                    ($e((c) => {
                        const f = this.getAxisMotionValue(c);
                        f &&
                            ((this.originPoint[c] += l[c].translate),
                            f.set(f.get() + l[c].translate));
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
                dragElastic: o = dl,
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
function Qi(e, t, n) {
    return (t === !0 || t === e) && (n === null || n === e);
}
function H1(e, t = 10) {
    let n = null;
    return (Math.abs(e.y) > t ? (n = 'y') : Math.abs(e.x) > t && (n = 'x'), n);
}
class W1 extends Zt {
    constructor(t) {
        (super(t),
            (this.removeGroupControls = Ce),
            (this.removeListeners = Ce),
            (this.controls = new U1(t)));
    }
    mount() {
        const { dragControls: t } = this.node.getProps();
        (t && (this.removeGroupControls = t.subscribe(this.controls)),
            (this.removeListeners = this.controls.addListeners() || Ce));
    }
    unmount() {
        (this.removeGroupControls(), this.removeListeners());
    }
}
const Qf = (e) => (t, n) => {
    e && H.postRender(() => e(t, n));
};
class K1 extends Zt {
    constructor() {
        (super(...arguments), (this.removePointerDownListener = Ce));
    }
    onPointerDown(t) {
        this.session = new yg(t, this.createPanHandlers(), {
            transformPagePoint: this.node.getTransformPagePoint(),
            contextWindow: Tg(this.node),
        });
    }
    createPanHandlers() {
        const { onPanSessionStart: t, onPanStart: n, onPan: r, onPanEnd: i } = this.node.getProps();
        return {
            onSessionStart: Qf(t),
            onStart: Qf(n),
            onMove: r,
            onEnd: (s, o) => {
                (delete this.session, i && H.postRender(() => i(s, o)));
            },
        };
    }
    mount() {
        this.removePointerDownListener = Ur(this.node.current, 'pointerdown', (t) =>
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
const cs = { hasAnimatedSinceResize: !0, hasEverUpdated: !1 };
function Yf(e, t) {
    return t.max === t.min ? 0 : (e / (t.max - t.min)) * 100;
}
const Sr = {
        correct: (e, t) => {
            if (!t.target) return e;
            if (typeof e == 'string')
                if (M.test(e)) e = parseFloat(e);
                else return e;
            const n = Yf(e, t.target.x),
                r = Yf(e, t.target.y);
            return `${n}% ${r}%`;
        },
    },
    b1 = {
        correct: (e, { treeScale: t, projectionDelta: n }) => {
            const r = e,
                i = Gt.parse(e);
            if (i.length > 5) return r;
            const s = Gt.createTransformer(e),
                o = typeof i[0] != 'number' ? 1 : 0,
                a = n.x.scale * t.x,
                l = n.y.scale * t.y;
            ((i[0 + o] /= a), (i[1 + o] /= l));
            const u = q(a, l, 0.5);
            return (
                typeof i[2 + o] == 'number' && (i[2 + o] /= u),
                typeof i[3 + o] == 'number' && (i[3 + o] /= u),
                s(i)
            );
        },
    };
class G1 extends C.Component {
    componentDidMount() {
        const { visualElement: t, layoutGroup: n, switchLayoutGroup: r, layoutId: i } = this.props,
            { projection: s } = t;
        (gx(Q1),
            s &&
                (n.group && n.group.add(s),
                r && r.register && i && r.register(s),
                s.root.didUpdate(),
                s.addEventListener('animationComplete', () => {
                    this.safeToRemove();
                }),
                s.setOptions({ ...s.options, onExitComplete: () => this.safeToRemove() })),
            (cs.hasEverUpdated = !0));
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
                          H.postRender(() => {
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
            ku.postRender(() => {
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
function Eg(e) {
    const [t, n] = am(),
        r = C.useContext(gu);
    return O.jsx(G1, {
        ...e,
        layoutGroup: r,
        switchLayoutGroup: C.useContext(pm),
        isPresent: t,
        safeToRemove: n,
    });
}
const Q1 = {
    borderRadius: {
        ...Sr,
        applyTo: [
            'borderTopLeftRadius',
            'borderTopRightRadius',
            'borderBottomLeftRadius',
            'borderBottomRightRadius',
        ],
    },
    borderTopLeftRadius: Sr,
    borderTopRightRadius: Sr,
    borderBottomLeftRadius: Sr,
    borderBottomRightRadius: Sr,
    boxShadow: b1,
};
function Y1(e, t, n) {
    const r = de(e) ? e : ut(e);
    return (r.start(Qu('', r, t, n)), r.animation);
}
function X1(e) {
    return e instanceof SVGElement && e.tagName !== 'svg';
}
const Z1 = (e, t) => e.depth - t.depth;
class J1 {
    constructor() {
        ((this.children = []), (this.isDirty = !1));
    }
    add(t) {
        (ju(this.children, t), (this.isDirty = !0));
    }
    remove(t) {
        (Fu(this.children, t), (this.isDirty = !0));
    }
    forEach(t) {
        (this.isDirty && this.children.sort(Z1), (this.isDirty = !1), this.children.forEach(t));
    }
}
function q1(e, t) {
    const n = pt.now(),
        r = ({ timestamp: i }) => {
            const s = i - n;
            s >= t && (rt(r), e(s - t));
        };
    return (H.read(r, !0), () => rt(r));
}
const Lg = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'],
    eS = Lg.length,
    Xf = (e) => (typeof e == 'string' ? parseFloat(e) : e),
    Zf = (e) => typeof e == 'number' || M.test(e);
function tS(e, t, n, r, i, s) {
    i
        ? ((e.opacity = q(0, n.opacity !== void 0 ? n.opacity : 1, nS(r))),
          (e.opacityExit = q(t.opacity !== void 0 ? t.opacity : 1, 0, rS(r))))
        : s &&
          (e.opacity = q(
              t.opacity !== void 0 ? t.opacity : 1,
              n.opacity !== void 0 ? n.opacity : 1,
              r,
          ));
    for (let o = 0; o < eS; o++) {
        const a = `border${Lg[o]}Radius`;
        let l = Jf(t, a),
            u = Jf(n, a);
        if (l === void 0 && u === void 0) continue;
        (l || (l = 0),
            u || (u = 0),
            l === 0 || u === 0 || Zf(l) === Zf(u)
                ? ((e[a] = Math.max(q(Xf(l), Xf(u), r), 0)),
                  (ht.test(u) || ht.test(l)) && (e[a] += '%'))
                : (e[a] = u));
    }
    (t.rotate || n.rotate) && (e.rotate = q(t.rotate || 0, n.rotate || 0, r));
}
function Jf(e, t) {
    return e[t] !== void 0 ? e[t] : e.borderRadius;
}
const nS = Rg(0, 0.5, Km),
    rS = Rg(0.5, 0.95, Ce);
function Rg(e, t, n) {
    return (r) => (r < e ? 0 : r > t ? 1 : n(vn(e, t, r)));
}
function qf(e, t) {
    ((e.min = t.min), (e.max = t.max));
}
function Be(e, t) {
    (qf(e.x, t.x), qf(e.y, t.y));
}
function ed(e, t) {
    ((e.translate = t.translate),
        (e.scale = t.scale),
        (e.originPoint = t.originPoint),
        (e.origin = t.origin));
}
function td(e, t, n, r, i) {
    return ((e -= t), (e = Hs(e, 1 / n, r)), i !== void 0 && (e = Hs(e, 1 / i, r)), e);
}
function iS(e, t = 0, n = 1, r = 0.5, i, s = e, o = e) {
    if (
        (ht.test(t) && ((t = parseFloat(t)), (t = q(o.min, o.max, t / 100) - o.min)),
        typeof t != 'number')
    )
        return;
    let a = q(s.min, s.max, r);
    (e === s && (a -= t), (e.min = td(e.min, t, n, a, i)), (e.max = td(e.max, t, n, a, i)));
}
function nd(e, t, [n, r, i], s, o) {
    iS(e, t[n], t[r], t[i], t.scale, s, o);
}
const sS = ['x', 'scaleX', 'originX'],
    oS = ['y', 'scaleY', 'originY'];
function rd(e, t, n, r) {
    (nd(e.x, t, sS, n ? n.x : void 0, r ? r.x : void 0),
        nd(e.y, t, oS, n ? n.y : void 0, r ? r.y : void 0));
}
function id(e) {
    return e.translate === 0 && e.scale === 1;
}
function Ag(e) {
    return id(e.x) && id(e.y);
}
function sd(e, t) {
    return e.min === t.min && e.max === t.max;
}
function aS(e, t) {
    return sd(e.x, t.x) && sd(e.y, t.y);
}
function od(e, t) {
    return Math.round(e.min) === Math.round(t.min) && Math.round(e.max) === Math.round(t.max);
}
function Og(e, t) {
    return od(e.x, t.x) && od(e.y, t.y);
}
function ad(e) {
    return Fe(e.x) / Fe(e.y);
}
function ld(e, t) {
    return e.translate === t.translate && e.scale === t.scale && e.originPoint === t.originPoint;
}
class lS {
    constructor() {
        this.members = [];
    }
    add(t) {
        (ju(this.members, t), t.scheduleRender());
    }
    remove(t) {
        if (
            (Fu(this.members, t), t === this.prevLead && (this.prevLead = void 0), t === this.lead)
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
function uS(e, t, n) {
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
            rotateX: f,
            rotateY: d,
            skewX: m,
            skewY: y,
        } = n;
        (u && (r = `perspective(${u}px) ${r}`),
            c && (r += `rotate(${c}deg) `),
            f && (r += `rotateX(${f}deg) `),
            d && (r += `rotateY(${d}deg) `),
            m && (r += `skewX(${m}deg) `),
            y && (r += `skewY(${y}deg) `));
    }
    const a = e.x.scale * t.x,
        l = e.y.scale * t.y;
    return ((a !== 1 || l !== 1) && (r += `scale(${a}, ${l})`), r || 'none');
}
const rn = {
        type: 'projectionFrame',
        totalNodes: 0,
        resolvedTargetDeltas: 0,
        recalculatedProjection: 0,
    },
    Or = typeof window < 'u' && window.MotionDebug !== void 0,
    qo = ['', 'X', 'Y', 'Z'],
    cS = { visibility: 'hidden' },
    ud = 1e3;
let fS = 0;
function ea(e, t, n, r) {
    const { latestValues: i } = t;
    i[e] && ((n[e] = i[e]), t.setStaticValue(e, 0), r && (r[e] = 0));
}
function Dg(e) {
    if (((e.hasCheckedOptimisedAppear = !0), e.root === e)) return;
    const { visualElement: t } = e.options;
    if (!t) return;
    const n = Im(t);
    if (window.MotionHasOptimisedAnimation(n, 'transform')) {
        const { layout: i, layoutId: s } = e.options;
        window.MotionCancelOptimisedAnimation(n, 'transform', H, !(i || s));
    }
    const { parent: r } = e;
    r && !r.hasCheckedOptimisedAppear && Dg(r);
}
function Ng({
    attachResizeListener: e,
    defaultParent: t,
    measureScroll: n,
    checkIsScrollRoot: r,
    resetTransform: i,
}) {
    return class {
        constructor(o = {}, a = t == null ? void 0 : t()) {
            ((this.id = fS++),
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
                        Or &&
                            (rn.totalNodes =
                                rn.resolvedTargetDeltas =
                                rn.recalculatedProjection =
                                    0),
                        this.nodes.forEach(pS),
                        this.nodes.forEach(xS),
                        this.nodes.forEach(wS),
                        this.nodes.forEach(mS),
                        Or && window.MotionDebug.record(rn));
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
            this.root === this && (this.nodes = new J1());
        }
        addEventListener(o, a) {
            return (
                this.eventHandlers.has(o) || this.eventHandlers.set(o, new Iu()),
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
            ((this.isSVG = X1(o)), (this.instance = o));
            const { layoutId: l, layout: u, visualElement: c } = this.options;
            if (
                (c && !c.current && c.mount(o),
                this.root.nodes.add(this),
                this.parent && this.parent.children.add(this),
                a && (u || l) && (this.isLayoutDirty = !0),
                e)
            ) {
                let f;
                const d = () => (this.root.updateBlockedByResize = !1);
                e(o, () => {
                    ((this.root.updateBlockedByResize = !0),
                        f && f(),
                        (f = q1(d, 250)),
                        cs.hasAnimatedSinceResize &&
                            ((cs.hasAnimatedSinceResize = !1), this.nodes.forEach(fd)));
                });
            }
            (l && this.root.registerSharedNode(l, this),
                this.options.animate !== !1 &&
                    c &&
                    (l || u) &&
                    this.addEventListener(
                        'didUpdate',
                        ({
                            delta: f,
                            hasLayoutChanged: d,
                            hasRelativeTargetChanged: m,
                            layout: y,
                        }) => {
                            if (this.isTreeAnimationBlocked()) {
                                ((this.target = void 0), (this.relativeTarget = void 0));
                                return;
                            }
                            const v = this.options.transition || c.getDefaultTransition() || TS,
                                { onLayoutAnimationStart: S, onLayoutAnimationComplete: p } =
                                    c.getProps(),
                                h = !this.targetLayout || !Og(this.targetLayout, y) || m,
                                g = !d && m;
                            if (
                                this.options.layoutRoot ||
                                (this.resumeFrom && this.resumeFrom.instance) ||
                                g ||
                                (d && (h || !this.currentAnimation))
                            ) {
                                (this.resumeFrom &&
                                    ((this.resumingFrom = this.resumeFrom),
                                    (this.resumingFrom.resumingFrom = void 0)),
                                    this.setAnimationOrigin(f, g));
                                const x = { ...Nu(v, 'layout'), onPlay: S, onComplete: p };
                                ((c.shouldReduceMotion || this.options.layoutRoot) &&
                                    ((x.delay = 0), (x.type = !1)),
                                    this.startAnimation(x));
                            } else
                                (d || fd(this),
                                    this.isLead() &&
                                        this.options.onExitComplete &&
                                        this.options.onExitComplete());
                            this.targetLayout = y;
                        },
                    ));
        }
        unmount() {
            (this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this));
            const o = this.getStack();
            (o && o.remove(this),
                this.parent && this.parent.children.delete(this),
                (this.instance = void 0),
                rt(this.updateProjection));
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
                ((this.isUpdating = !0), this.nodes && this.nodes.forEach(SS), this.animationId++);
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
                    Dg(this),
                !this.root.isUpdating && this.root.startUpdate(),
                this.isLayoutDirty)
            )
                return;
            this.isLayoutDirty = !0;
            for (let c = 0; c < this.path.length; c++) {
                const f = this.path[c];
                ((f.shouldResetTransform = !0),
                    f.updateScroll('snapshot'),
                    f.options.layoutRoot && f.willUpdate(!1));
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
                (this.unblockUpdate(), this.clearAllSnapshots(), this.nodes.forEach(cd));
                return;
            }
            (this.isUpdating || this.nodes.forEach(yS),
                (this.isUpdating = !1),
                this.nodes.forEach(vS),
                this.nodes.forEach(dS),
                this.nodes.forEach(hS),
                this.clearAllSnapshots());
            const a = pt.now();
            ((le.delta = mt(0, 1e3 / 60, a - le.timestamp)),
                (le.timestamp = a),
                (le.isProcessing = !0),
                Wo.update.process(le),
                Wo.preRender.process(le),
                Wo.render.process(le),
                (le.isProcessing = !1));
        }
        didUpdate() {
            this.updateScheduled || ((this.updateScheduled = !0), ku.read(this.scheduleUpdate));
        }
        clearAllSnapshots() {
            (this.nodes.forEach(gS), this.sharedNodes.forEach(kS));
        }
        scheduleUpdateProjection() {
            this.projectionUpdateScheduled ||
                ((this.projectionUpdateScheduled = !0), H.preRender(this.updateProjection, !1, !0));
        }
        scheduleCheckAfterUnmount() {
            H.postRender(() => {
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
                (this.layoutCorrected = ie()),
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
                a = this.projectionDelta && !Ag(this.projectionDelta),
                l = this.getTransformTemplate(),
                u = l ? l(this.latestValues, '') : void 0,
                c = u !== this.prevTransformTemplateValue;
            o &&
                (a || nn(this.latestValues) || c) &&
                (i(this.instance, u), (this.shouldResetTransform = !1), this.scheduleRender());
        }
        measure(o = !0) {
            const a = this.measurePageBox();
            let l = this.removeElementScroll(a);
            return (
                o && (l = this.removeTransform(l)),
                ES(l),
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
            if (!a) return ie();
            const l = a.measureViewportBox();
            if (
                !(
                    ((o = this.scroll) === null || o === void 0 ? void 0 : o.wasRoot) ||
                    this.path.some(LS)
                )
            ) {
                const { scroll: c } = this.root;
                c && (Hn(l.x, c.offset.x), Hn(l.y, c.offset.y));
            }
            return l;
        }
        removeElementScroll(o) {
            var a;
            const l = ie();
            if ((Be(l, o), !((a = this.scroll) === null || a === void 0) && a.wasRoot)) return l;
            for (let u = 0; u < this.path.length; u++) {
                const c = this.path[u],
                    { scroll: f, options: d } = c;
                c !== this.root &&
                    f &&
                    d.layoutScroll &&
                    (f.wasRoot && Be(l, o), Hn(l.x, f.offset.x), Hn(l.y, f.offset.y));
            }
            return l;
        }
        applyTransform(o, a = !1) {
            const l = ie();
            Be(l, o);
            for (let u = 0; u < this.path.length; u++) {
                const c = this.path[u];
                (!a &&
                    c.options.layoutScroll &&
                    c.scroll &&
                    c !== c.root &&
                    Wn(l, { x: -c.scroll.offset.x, y: -c.scroll.offset.y }),
                    nn(c.latestValues) && Wn(l, c.latestValues));
            }
            return (nn(this.latestValues) && Wn(l, this.latestValues), l);
        }
        removeTransform(o) {
            const a = ie();
            Be(a, o);
            for (let l = 0; l < this.path.length; l++) {
                const u = this.path[l];
                if (!u.instance || !nn(u.latestValues)) continue;
                hl(u.latestValues) && u.updateSnapshot();
                const c = ie(),
                    f = u.measurePageBox();
                (Be(c, f), rd(a, u.latestValues, u.snapshot ? u.snapshot.layoutBox : void 0, c));
            }
            return (nn(this.latestValues) && rd(a, this.latestValues), a);
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
                this.relativeParent.resolvedRelativeTargetAt !== le.timestamp &&
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
            const { layout: f, layoutId: d } = this.options;
            if (!(!this.layout || !(f || d))) {
                if (
                    ((this.resolvedRelativeTargetAt = le.timestamp),
                    !this.targetDelta && !this.relativeTarget)
                ) {
                    const m = this.getClosestProjectingParent();
                    m && m.layout && this.animationProgress !== 1
                        ? ((this.relativeParent = m),
                          this.forceRelativeParentToResolveTarget(),
                          (this.relativeTarget = ie()),
                          (this.relativeTargetOrigin = ie()),
                          Wr(this.relativeTargetOrigin, this.layout.layoutBox, m.layout.layoutBox),
                          Be(this.relativeTarget, this.relativeTargetOrigin))
                        : (this.relativeParent = this.relativeTarget = void 0);
                }
                if (!(!this.relativeTarget && !this.targetDelta)) {
                    if (
                        (this.target || ((this.target = ie()), (this.targetWithTransforms = ie())),
                        this.relativeTarget &&
                        this.relativeTargetOrigin &&
                        this.relativeParent &&
                        this.relativeParent.target
                            ? (this.forceRelativeParentToResolveTarget(),
                              O1(this.target, this.relativeTarget, this.relativeParent.target))
                            : this.targetDelta
                              ? (this.resumingFrom
                                    ? (this.target = this.applyTransform(this.layout.layoutBox))
                                    : Be(this.target, this.layout.layoutBox),
                                Pg(this.target, this.targetDelta))
                              : Be(this.target, this.layout.layoutBox),
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
                              (this.relativeTarget = ie()),
                              (this.relativeTargetOrigin = ie()),
                              Wr(this.relativeTargetOrigin, this.target, m.target),
                              Be(this.relativeTarget, this.relativeTargetOrigin))
                            : (this.relativeParent = this.relativeTarget = void 0);
                    }
                    Or && rn.resolvedTargetDeltas++;
                }
            }
        }
        getClosestProjectingParent() {
            if (!(!this.parent || hl(this.parent.latestValues) || kg(this.parent.latestValues)))
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
                this.resolvedRelativeTargetAt === le.timestamp && (u = !1),
                u)
            )
                return;
            const { layout: c, layoutId: f } = this.options;
            if (
                ((this.isTreeAnimating = !!(
                    (this.parent && this.parent.isTreeAnimating) ||
                    this.currentAnimation ||
                    this.pendingAnimation
                )),
                this.isTreeAnimating || (this.targetDelta = this.relativeTarget = void 0),
                !this.layout || !(c || f))
            )
                return;
            Be(this.layoutCorrected, this.layout.layoutBox);
            const d = this.treeScale.x,
                m = this.treeScale.y;
            (z1(this.layoutCorrected, this.treeScale, this.path, l),
                a.layout &&
                    !a.target &&
                    (this.treeScale.x !== 1 || this.treeScale.y !== 1) &&
                    ((a.target = a.layout.layoutBox), (a.targetWithTransforms = ie())));
            const { target: y } = a;
            if (!y) {
                this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
                return;
            }
            (!this.projectionDelta || !this.prevProjectionDelta
                ? this.createProjectionDeltas()
                : (ed(this.prevProjectionDelta.x, this.projectionDelta.x),
                  ed(this.prevProjectionDelta.y, this.projectionDelta.y)),
                Hr(this.projectionDelta, this.layoutCorrected, y, this.latestValues),
                (this.treeScale.x !== d ||
                    this.treeScale.y !== m ||
                    !ld(this.projectionDelta.x, this.prevProjectionDelta.x) ||
                    !ld(this.projectionDelta.y, this.prevProjectionDelta.y)) &&
                    ((this.hasProjected = !0),
                    this.scheduleRender(),
                    this.notifyListeners('projectionUpdate', y)),
                Or && rn.recalculatedProjection++);
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
            ((this.prevProjectionDelta = Un()),
                (this.projectionDelta = Un()),
                (this.projectionDeltaWithTransform = Un()));
        }
        setAnimationOrigin(o, a = !1) {
            const l = this.snapshot,
                u = l ? l.latestValues : {},
                c = { ...this.latestValues },
                f = Un();
            ((!this.relativeParent || !this.relativeParent.options.layoutRoot) &&
                (this.relativeTarget = this.relativeTargetOrigin = void 0),
                (this.attemptToResolveRelativeTarget = !a));
            const d = ie(),
                m = l ? l.source : void 0,
                y = this.layout ? this.layout.source : void 0,
                v = m !== y,
                S = this.getStack(),
                p = !S || S.members.length <= 1,
                h = !!(v && !p && this.options.crossfade === !0 && !this.path.some(CS));
            this.animationProgress = 0;
            let g;
            ((this.mixTargetDelta = (x) => {
                const w = x / 1e3;
                (dd(f.x, o.x, w),
                    dd(f.y, o.y, w),
                    this.setTargetDelta(f),
                    this.relativeTarget &&
                        this.relativeTargetOrigin &&
                        this.layout &&
                        this.relativeParent &&
                        this.relativeParent.layout &&
                        (Wr(d, this.layout.layoutBox, this.relativeParent.layout.layoutBox),
                        PS(this.relativeTarget, this.relativeTargetOrigin, d, w),
                        g && aS(this.relativeTarget, g) && (this.isProjectionDirty = !1),
                        g || (g = ie()),
                        Be(g, this.relativeTarget)),
                    v && ((this.animationValues = c), tS(c, u, this.latestValues, w, h, p)),
                    this.root.scheduleUpdateProjection(),
                    this.scheduleRender(),
                    (this.animationProgress = w));
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
                    (rt(this.pendingAnimation), (this.pendingAnimation = void 0)),
                (this.pendingAnimation = H.update(() => {
                    ((cs.hasAnimatedSinceResize = !0),
                        (this.currentAnimation = Y1(0, ud, {
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
                (this.mixTargetDelta && this.mixTargetDelta(ud), this.currentAnimation.stop()),
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
                    Mg(this.options.animationType, this.layout.layoutBox, u.layoutBox)
                ) {
                    l = this.target || ie();
                    const f = Fe(this.layout.layoutBox.x);
                    ((l.x.min = o.target.x.min), (l.x.max = l.x.min + f));
                    const d = Fe(this.layout.layoutBox.y);
                    ((l.y.min = o.target.y.min), (l.y.max = l.y.min + d));
                }
                (Be(a, l),
                    Wn(a, c),
                    Hr(this.projectionDeltaWithTransform, this.layoutCorrected, a, c));
            }
        }
        registerSharedNode(o, a) {
            (this.sharedNodes.has(o) || this.sharedNodes.set(o, new lS()),
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
            l.z && ea('z', o, u, this.animationValues);
            for (let c = 0; c < qo.length; c++)
                (ea(`rotate${qo[c]}`, o, u, this.animationValues),
                    ea(`skew${qo[c]}`, o, u, this.animationValues));
            o.render();
            for (const c in u)
                (o.setStaticValue(c, u[c]),
                    this.animationValues && (this.animationValues[c] = u[c]));
            o.scheduleRender();
        }
        getProjectionStyles(o) {
            var a, l;
            if (!this.instance || this.isSVG) return;
            if (!this.isVisible) return cS;
            const u = { visibility: '' },
                c = this.getTransformTemplate();
            if (this.needsReset)
                return (
                    (this.needsReset = !1),
                    (u.opacity = ''),
                    (u.pointerEvents = ls(o == null ? void 0 : o.pointerEvents) || ''),
                    (u.transform = c ? c(this.latestValues, '') : 'none'),
                    u
                );
            const f = this.getLead();
            if (!this.projectionDelta || !this.layout || !f.target) {
                const v = {};
                return (
                    this.options.layoutId &&
                        ((v.opacity =
                            this.latestValues.opacity !== void 0 ? this.latestValues.opacity : 1),
                        (v.pointerEvents = ls(o == null ? void 0 : o.pointerEvents) || '')),
                    this.hasProjected &&
                        !nn(this.latestValues) &&
                        ((v.transform = c ? c({}, '') : 'none'), (this.hasProjected = !1)),
                    v
                );
            }
            const d = f.animationValues || f.latestValues;
            (this.applyTransformsToTarget(),
                (u.transform = uS(this.projectionDeltaWithTransform, this.treeScale, d)),
                c && (u.transform = c(d, u.transform)));
            const { x: m, y } = this.projectionDelta;
            ((u.transformOrigin = `${m.origin * 100}% ${y.origin * 100}% 0`),
                f.animationValues
                    ? (u.opacity =
                          f === this
                              ? (l =
                                    (a = d.opacity) !== null && a !== void 0
                                        ? a
                                        : this.latestValues.opacity) !== null && l !== void 0
                                  ? l
                                  : 1
                              : this.preserveOpacity
                                ? this.latestValues.opacity
                                : d.opacityExit)
                    : (u.opacity =
                          f === this
                              ? d.opacity !== void 0
                                  ? d.opacity
                                  : ''
                              : d.opacityExit !== void 0
                                ? d.opacityExit
                                : 0));
            for (const v in Is) {
                if (d[v] === void 0) continue;
                const { correct: S, applyTo: p } = Is[v],
                    h = u.transform === 'none' ? d[v] : S(d[v], f);
                if (p) {
                    const g = p.length;
                    for (let x = 0; x < g; x++) u[p[x]] = h;
                } else u[v] = h;
            }
            return (
                this.options.layoutId &&
                    (u.pointerEvents =
                        f === this ? ls(o == null ? void 0 : o.pointerEvents) || '' : 'none'),
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
                this.root.nodes.forEach(cd),
                this.root.sharedNodes.clear());
        }
    };
}
function dS(e) {
    e.updateLayout();
}
function hS(e) {
    var t;
    const n = ((t = e.resumeFrom) === null || t === void 0 ? void 0 : t.snapshot) || e.snapshot;
    if (e.isLead() && e.layout && n && e.hasListeners('didUpdate')) {
        const { layoutBox: r, measuredBox: i } = e.layout,
            { animationType: s } = e.options,
            o = n.source !== e.layout.source;
        s === 'size'
            ? $e((f) => {
                  const d = o ? n.measuredBox[f] : n.layoutBox[f],
                      m = Fe(d);
                  ((d.min = r[f].min), (d.max = d.min + m));
              })
            : Mg(s, n.layoutBox, r) &&
              $e((f) => {
                  const d = o ? n.measuredBox[f] : n.layoutBox[f],
                      m = Fe(r[f]);
                  ((d.max = d.min + m),
                      e.relativeTarget &&
                          !e.currentAnimation &&
                          ((e.isProjectionDirty = !0),
                          (e.relativeTarget[f].max = e.relativeTarget[f].min + m)));
              });
        const a = Un();
        Hr(a, r, n.layoutBox);
        const l = Un();
        o ? Hr(l, e.applyTransform(i, !0), n.measuredBox) : Hr(l, r, n.layoutBox);
        const u = !Ag(a);
        let c = !1;
        if (!e.resumeFrom) {
            const f = e.getClosestProjectingParent();
            if (f && !f.resumeFrom) {
                const { snapshot: d, layout: m } = f;
                if (d && m) {
                    const y = ie();
                    Wr(y, n.layoutBox, d.layoutBox);
                    const v = ie();
                    (Wr(v, r, m.layoutBox),
                        Og(y, v) || (c = !0),
                        f.options.layoutRoot &&
                            ((e.relativeTarget = v),
                            (e.relativeTargetOrigin = y),
                            (e.relativeParent = f)));
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
function pS(e) {
    (Or && rn.totalNodes++,
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
function mS(e) {
    e.isProjectionDirty = e.isSharedProjectionDirty = e.isTransformDirty = !1;
}
function gS(e) {
    e.clearSnapshot();
}
function cd(e) {
    e.clearMeasurements();
}
function yS(e) {
    e.isLayoutDirty = !1;
}
function vS(e) {
    const { visualElement: t } = e.options;
    (t && t.getProps().onBeforeLayoutMeasure && t.notify('BeforeLayoutMeasure'),
        e.resetTransform());
}
function fd(e) {
    (e.finishAnimation(),
        (e.targetDelta = e.relativeTarget = e.target = void 0),
        (e.isProjectionDirty = !0));
}
function xS(e) {
    e.resolveTargetDelta();
}
function wS(e) {
    e.calcProjection();
}
function SS(e) {
    e.resetSkewAndRotation();
}
function kS(e) {
    e.removeLeadSnapshot();
}
function dd(e, t, n) {
    ((e.translate = q(t.translate, 0, n)),
        (e.scale = q(t.scale, 1, n)),
        (e.origin = t.origin),
        (e.originPoint = t.originPoint));
}
function hd(e, t, n, r) {
    ((e.min = q(t.min, n.min, r)), (e.max = q(t.max, n.max, r)));
}
function PS(e, t, n, r) {
    (hd(e.x, t.x, n.x, r), hd(e.y, t.y, n.y, r));
}
function CS(e) {
    return e.animationValues && e.animationValues.opacityExit !== void 0;
}
const TS = { duration: 0.45, ease: [0.4, 0, 0.1, 1] },
    pd = (e) =>
        typeof navigator < 'u' &&
        navigator.userAgent &&
        navigator.userAgent.toLowerCase().includes(e),
    md = pd('applewebkit/') && !pd('chrome/') ? Math.round : Ce;
function gd(e) {
    ((e.min = md(e.min)), (e.max = md(e.max)));
}
function ES(e) {
    (gd(e.x), gd(e.y));
}
function Mg(e, t, n) {
    return e === 'position' || (e === 'preserve-aspect' && !A1(ad(t), ad(n), 0.2));
}
function LS(e) {
    var t;
    return e !== e.root && ((t = e.scroll) === null || t === void 0 ? void 0 : t.wasRoot);
}
const RS = Ng({
        attachResizeListener: (e, t) => pi(e, 'resize', t),
        measureScroll: () => ({
            x: document.documentElement.scrollLeft || document.body.scrollLeft,
            y: document.documentElement.scrollTop || document.body.scrollTop,
        }),
        checkIsScrollRoot: () => !0,
    }),
    ta = { current: void 0 },
    Vg = Ng({
        measureScroll: (e) => ({ x: e.scrollLeft, y: e.scrollTop }),
        defaultParent: () => {
            if (!ta.current) {
                const e = new RS({});
                (e.mount(window), e.setOptions({ layoutScroll: !0 }), (ta.current = e));
            }
            return ta.current;
        },
        resetTransform: (e, t) => {
            e.style.transform = t !== void 0 ? t : 'none';
        },
        checkIsScrollRoot: (e) => window.getComputedStyle(e).position === 'fixed',
    }),
    AS = { pan: { Feature: K1 }, drag: { Feature: W1, ProjectionNode: Vg, MeasureLayout: Eg } };
function yd(e, t, n) {
    const { props: r } = e;
    e.animationState && r.whileHover && e.animationState.setActive('whileHover', n === 'Start');
    const i = 'onHover' + n,
        s = r[i];
    s && H.postRender(() => s(t, Ei(t)));
}
class OS extends Zt {
    mount() {
        const { current: t } = this.node;
        t &&
            (this.unmount = Ox(
                t,
                (n) => (yd(this.node, n, 'Start'), (r) => yd(this.node, r, 'End')),
            ));
    }
    unmount() {}
}
class DS extends Zt {
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
        this.unmount = Ti(
            pi(this.node.current, 'focus', () => this.onFocus()),
            pi(this.node.current, 'blur', () => this.onBlur()),
        );
    }
    unmount() {}
}
function vd(e, t, n) {
    const { props: r } = e;
    e.animationState && r.whileTap && e.animationState.setActive('whileTap', n === 'Start');
    const i = 'onTap' + (n === 'End' ? '' : n),
        s = r[i];
    s && H.postRender(() => s(t, Ei(t)));
}
class NS extends Zt {
    mount() {
        const { current: t } = this.node;
        t &&
            (this.unmount = Vx(
                t,
                (n) => (
                    vd(this.node, n, 'Start'),
                    (r, { success: i }) => vd(this.node, r, i ? 'End' : 'Cancel')
                ),
                { useGlobalTarget: this.node.props.globalTapTarget },
            ));
    }
    unmount() {}
}
const ml = new WeakMap(),
    na = new WeakMap(),
    MS = (e) => {
        const t = ml.get(e.target);
        t && t(e);
    },
    VS = (e) => {
        e.forEach(MS);
    };
function _S({ root: e, ...t }) {
    const n = e || document;
    na.has(n) || na.set(n, {});
    const r = na.get(n),
        i = JSON.stringify(t);
    return (r[i] || (r[i] = new IntersectionObserver(VS, { root: e, ...t })), r[i]);
}
function jS(e, t, n) {
    const r = _S(t);
    return (
        ml.set(e, n),
        r.observe(e),
        () => {
            (ml.delete(e), r.unobserve(e));
        }
    );
}
const FS = { some: 0, all: 1 };
class IS extends Zt {
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
                threshold: typeof i == 'number' ? i : FS[i],
            },
            a = (l) => {
                const { isIntersecting: u } = l;
                if (this.isInView === u || ((this.isInView = u), s && !u && this.hasEnteredView))
                    return;
                (u && (this.hasEnteredView = !0),
                    this.node.animationState &&
                        this.node.animationState.setActive('whileInView', u));
                const { onViewportEnter: c, onViewportLeave: f } = this.node.getProps(),
                    d = u ? c : f;
                d && d(l);
            };
        return jS(this.node.current, o, a);
    }
    mount() {
        this.startObserver();
    }
    update() {
        if (typeof IntersectionObserver > 'u') return;
        const { props: t, prevProps: n } = this.node;
        ['amount', 'margin', 'root'].some(zS(t, n)) && this.startObserver();
    }
    unmount() {}
}
function zS({ viewport: e = {} }, { viewport: t = {} } = {}) {
    return (n) => e[n] !== t[n];
}
const BS = {
        inView: { Feature: IS },
        tap: { Feature: NS },
        focus: { Feature: DS },
        hover: { Feature: OS },
    },
    $S = { layout: { ProjectionNode: Vg, MeasureLayout: Eg } },
    gl = { current: null },
    _g = { current: !1 };
function US() {
    if (((_g.current = !0), !!yu))
        if (window.matchMedia) {
            const e = window.matchMedia('(prefers-reduced-motion)'),
                t = () => (gl.current = e.matches);
            (e.addListener(t), t());
        } else gl.current = !1;
}
const HS = [...sg, xe, Gt],
    WS = (e) => HS.find(ig(e)),
    xd = new WeakMap();
function KS(e, t, n) {
    for (const r in t) {
        const i = t[r],
            s = n[r];
        if (de(i)) e.addValue(r, i);
        else if (de(s)) e.addValue(r, ut(i, { owner: e }));
        else if (s !== i)
            if (e.hasValue(r)) {
                const o = e.getValue(r);
                o.liveStyle === !0 ? o.jump(i) : o.hasAnimated || o.set(i);
            } else {
                const o = e.getStaticValue(r);
                e.addValue(r, ut(o !== void 0 ? o : i, { owner: e }));
            }
    }
    for (const r in n) t[r] === void 0 && e.removeValue(r);
    return t;
}
const wd = [
    'AnimationStart',
    'AnimationComplete',
    'Update',
    'BeforeLayoutMeasure',
    'LayoutMeasure',
    'LayoutAnimationStart',
    'LayoutAnimationComplete',
];
class bS {
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
            (this.KeyframeResolver = Ku),
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
                const m = pt.now();
                this.renderScheduledAt < m &&
                    ((this.renderScheduledAt = m), H.render(this.render, !1, !0));
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
            (this.isControllingVariants = ho(n)),
            (this.isVariantNode = dm(n)),
            this.isVariantNode && (this.variantChildren = new Set()),
            (this.manuallyAnimateOnMount = !!(t && t.current)));
        const { willChange: f, ...d } = this.scrapeMotionValuesFromProps(n, {}, this);
        for (const m in d) {
            const y = d[m];
            l[m] !== void 0 && de(y) && y.set(l[m], !1);
        }
    }
    mount(t) {
        ((this.current = t),
            xd.set(t, this),
            this.projection && !this.projection.instance && this.projection.mount(t),
            this.parent &&
                this.isVariantNode &&
                !this.isControllingVariants &&
                (this.removeFromVariantTree = this.parent.addVariantChild(this)),
            this.values.forEach((n, r) => this.bindToMotionValue(r, n)),
            _g.current || US(),
            (this.shouldReduceMotion =
                this.reducedMotionConfig === 'never'
                    ? !1
                    : this.reducedMotionConfig === 'always'
                      ? !0
                      : gl.current),
            this.parent && this.parent.children.add(this),
            this.update(this.props, this.presenceContext));
    }
    unmount() {
        (xd.delete(this.current),
            this.projection && this.projection.unmount(),
            rt(this.notifyUpdate),
            rt(this.render),
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
        const r = kn.has(t),
            i = n.on('change', (a) => {
                ((this.latestValues[t] = a),
                    this.props.onUpdate && H.preRender(this.notifyUpdate),
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
        for (t in ir) {
            const n = ir[t];
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
        return this.current ? this.measureInstanceViewportBox(this.current, this.props) : ie();
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
        for (let r = 0; r < wd.length; r++) {
            const i = wd[r];
            this.propEventSubscriptions[i] &&
                (this.propEventSubscriptions[i](), delete this.propEventSubscriptions[i]);
            const s = 'on' + i,
                o = t[s];
            o && (this.propEventSubscriptions[i] = this.on(i, o));
        }
        ((this.prevMotionValues = KS(
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
                ((r = ut(n === null ? void 0 : n, { owner: this })), this.addValue(t, r)),
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
                (typeof i == 'string' && (ng(i) || Gm(i))
                    ? (i = parseFloat(i))
                    : !WS(i) && Gt.test(n) && (i = qm(t, n)),
                this.setBaseTarget(t, de(i) ? i.get() : i)),
            de(i) ? i.get() : i
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
            const o = Cu(
                this.props,
                r,
                (n = this.presenceContext) === null || n === void 0 ? void 0 : n.custom,
            );
            o && (i = o[t]);
        }
        if (r && i !== void 0) return i;
        const s = this.getBaseTargetFromProps(this.props, t);
        return s !== void 0 && !de(s)
            ? s
            : this.initialValues[t] !== void 0 && i === void 0
              ? void 0
              : this.baseTarget[t];
    }
    on(t, n) {
        return (this.events[t] || (this.events[t] = new Iu()), this.events[t].add(n));
    }
    notify(t, ...n) {
        this.events[t] && this.events[t].notify(...n);
    }
}
class jg extends bS {
    constructor() {
        (super(...arguments), (this.KeyframeResolver = og));
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
        de(t) &&
            (this.childSubscription = t.on('change', (n) => {
                this.current && (this.current.textContent = `${n}`);
            }));
    }
}
function GS(e) {
    return window.getComputedStyle(e);
}
class QS extends jg {
    constructor() {
        (super(...arguments), (this.type = 'html'), (this.renderInstance = Sm));
    }
    readValueFromInstance(t, n) {
        if (kn.has(n)) {
            const r = Wu(n);
            return (r && r.default) || 0;
        } else {
            const r = GS(t),
                i = (vm(n) ? r.getPropertyValue(n) : r[n]) || 0;
            return typeof i == 'string' ? i.trim() : i;
        }
    }
    measureInstanceViewportBox(t, { transformPagePoint: n }) {
        return Cg(t, n);
    }
    build(t, n, r) {
        Lu(t, n, r.transformTemplate);
    }
    scrapeMotionValuesFromProps(t, n, r) {
        return Du(t, n, r);
    }
}
class YS extends jg {
    constructor() {
        (super(...arguments),
            (this.type = 'svg'),
            (this.isSVGTag = !1),
            (this.measureInstanceViewportBox = ie));
    }
    getBaseTargetFromProps(t, n) {
        return t[n];
    }
    readValueFromInstance(t, n) {
        if (kn.has(n)) {
            const r = Wu(n);
            return (r && r.default) || 0;
        }
        return ((n = km.has(n) ? n : Su(n)), t.getAttribute(n));
    }
    scrapeMotionValuesFromProps(t, n, r) {
        return Tm(t, n, r);
    }
    build(t, n, r) {
        Ru(t, n, this.isSVGTag, r.transformTemplate);
    }
    renderInstance(t, n, r, i) {
        Pm(t, n, r, i);
    }
    mount(t) {
        ((this.isSVGTag = Ou(t.tagName)), super.mount(t));
    }
}
const XS = (e, t) => (Pu(e) ? new YS(t) : new QS(t, { allowProjection: e !== C.Fragment })),
    ZS = Tx({ ...w1, ...BS, ...AS, ...$S }, XS),
    We = B0(ZS);
function Fg(e, t) {
    let n;
    const r = () => {
        const { currentTime: i } = t,
            o = (i === null ? 0 : i.value) / 100;
        (n !== o && e(o), (n = o));
    };
    return (H.update(r, !0), () => rt(r));
}
const fs = new WeakMap();
let Ot;
function JS(e, t) {
    if (t) {
        const { inlineSize: n, blockSize: r } = t[0];
        return { width: n, height: r };
    } else
        return e instanceof SVGElement && 'getBBox' in e
            ? e.getBBox()
            : { width: e.offsetWidth, height: e.offsetHeight };
}
function qS({ target: e, contentRect: t, borderBoxSize: n }) {
    var r;
    (r = fs.get(e)) === null ||
        r === void 0 ||
        r.forEach((i) => {
            i({
                target: e,
                contentSize: t,
                get size() {
                    return JS(e, n);
                },
            });
        });
}
function ek(e) {
    e.forEach(qS);
}
function tk() {
    typeof ResizeObserver > 'u' || (Ot = new ResizeObserver(ek));
}
function nk(e, t) {
    Ot || tk();
    const n = Vm(e);
    return (
        n.forEach((r) => {
            let i = fs.get(r);
            (i || ((i = new Set()), fs.set(r, i)), i.add(t), Ot == null || Ot.observe(r));
        }),
        () => {
            n.forEach((r) => {
                const i = fs.get(r);
                (i == null || i.delete(t), (i != null && i.size) || Ot == null || Ot.unobserve(r));
            });
        }
    );
}
const ds = new Set();
let Kr;
function rk() {
    ((Kr = () => {
        const e = { width: window.innerWidth, height: window.innerHeight },
            t = { target: window, size: e, contentSize: e };
        ds.forEach((n) => n(t));
    }),
        window.addEventListener('resize', Kr));
}
function ik(e) {
    return (
        ds.add(e),
        Kr || rk(),
        () => {
            (ds.delete(e), !ds.size && Kr && (Kr = void 0));
        }
    );
}
function sk(e, t) {
    return typeof e == 'function' ? ik(e) : nk(e, t);
}
const ok = 50,
    Sd = () => ({
        current: 0,
        offset: [],
        progress: 0,
        scrollLength: 0,
        targetOffset: 0,
        targetLength: 0,
        containerLength: 0,
        velocity: 0,
    }),
    ak = () => ({ time: 0, x: Sd(), y: Sd() }),
    lk = { x: { length: 'Width', position: 'Left' }, y: { length: 'Height', position: 'Top' } };
function kd(e, t, n, r) {
    const i = n[t],
        { length: s, position: o } = lk[t],
        a = i.current,
        l = n.time;
    ((i.current = e[`scroll${o}`]),
        (i.scrollLength = e[`scroll${s}`] - e[`client${s}`]),
        (i.offset.length = 0),
        (i.offset[0] = 0),
        (i.offset[1] = i.scrollLength),
        (i.progress = vn(0, i.scrollLength, i.current)));
    const u = r - l;
    i.velocity = u > ok ? 0 : zu(i.current - a, u);
}
function uk(e, t, n) {
    (kd(e, 'x', t, n), kd(e, 'y', t, n), (t.time = n));
}
function ck(e, t) {
    const n = { x: 0, y: 0 };
    let r = e;
    for (; r && r !== t; )
        if (r instanceof HTMLElement)
            ((n.x += r.offsetLeft), (n.y += r.offsetTop), (r = r.offsetParent));
        else if (r.tagName === 'svg') {
            const i = r.getBoundingClientRect();
            r = r.parentElement;
            const s = r.getBoundingClientRect();
            ((n.x += i.left - s.left), (n.y += i.top - s.top));
        } else if (r instanceof SVGGraphicsElement) {
            const { x: i, y: s } = r.getBBox();
            ((n.x += i), (n.y += s));
            let o = null,
                a = r.parentNode;
            for (; !o; ) (a.tagName === 'svg' && (o = a), (a = r.parentNode));
            r = o;
        } else break;
    return n;
}
const yl = { start: 0, center: 0.5, end: 1 };
function Pd(e, t, n = 0) {
    let r = 0;
    if ((e in yl && (e = yl[e]), typeof e == 'string')) {
        const i = parseFloat(e);
        e.endsWith('px')
            ? (r = i)
            : e.endsWith('%')
              ? (e = i / 100)
              : e.endsWith('vw')
                ? (r = (i / 100) * document.documentElement.clientWidth)
                : e.endsWith('vh')
                  ? (r = (i / 100) * document.documentElement.clientHeight)
                  : (e = i);
    }
    return (typeof e == 'number' && (r = t * e), n + r);
}
const fk = [0, 0];
function dk(e, t, n, r) {
    let i = Array.isArray(e) ? e : fk,
        s = 0,
        o = 0;
    return (
        typeof e == 'number'
            ? (i = [e, e])
            : typeof e == 'string' &&
              ((e = e.trim()), e.includes(' ') ? (i = e.split(' ')) : (i = [e, yl[e] ? e : '0'])),
        (s = Pd(i[0], n, r)),
        (o = Pd(i[1], t)),
        s - o
    );
}
const hk = {
        All: [
            [0, 0],
            [1, 1],
        ],
    },
    pk = { x: 0, y: 0 };
function mk(e) {
    return 'getBBox' in e && e.tagName !== 'svg'
        ? e.getBBox()
        : { width: e.clientWidth, height: e.clientHeight };
}
function gk(e, t, n) {
    const { offset: r = hk.All } = n,
        { target: i = e, axis: s = 'y' } = n,
        o = s === 'y' ? 'height' : 'width',
        a = i !== e ? ck(i, e) : pk,
        l = i === e ? { width: e.scrollWidth, height: e.scrollHeight } : mk(i),
        u = { width: e.clientWidth, height: e.clientHeight };
    t[s].offset.length = 0;
    let c = !t[s].interpolate;
    const f = r.length;
    for (let d = 0; d < f; d++) {
        const m = dk(r[d], u[o], l[o], a[s]);
        (!c && m !== t[s].interpolatorOffsets[d] && (c = !0), (t[s].offset[d] = m));
    }
    (c &&
        ((t[s].interpolate = Gu(t[s].offset, hg(r), { clamp: !1 })),
        (t[s].interpolatorOffsets = [...t[s].offset])),
        (t[s].progress = mt(0, 1, t[s].interpolate(t[s].current))));
}
function yk(e, t = e, n) {
    if (((n.x.targetOffset = 0), (n.y.targetOffset = 0), t !== e)) {
        let r = t;
        for (; r && r !== e; )
            ((n.x.targetOffset += r.offsetLeft),
                (n.y.targetOffset += r.offsetTop),
                (r = r.offsetParent));
    }
    ((n.x.targetLength = t === e ? t.scrollWidth : t.clientWidth),
        (n.y.targetLength = t === e ? t.scrollHeight : t.clientHeight),
        (n.x.containerLength = e.clientWidth),
        (n.y.containerLength = e.clientHeight));
}
function vk(e, t, n, r = {}) {
    return {
        measure: () => yk(e, r.target, n),
        update: (i) => {
            (uk(e, n, i), (r.offset || r.target) && gk(e, n, r));
        },
        notify: () => t(n),
    };
}
const kr = new WeakMap(),
    Cd = new WeakMap(),
    ra = new WeakMap(),
    Td = (e) => (e === document.documentElement ? window : e);
function Yu(e, { container: t = document.documentElement, ...n } = {}) {
    let r = ra.get(t);
    r || ((r = new Set()), ra.set(t, r));
    const i = ak(),
        s = vk(t, e, i, n);
    if ((r.add(s), !kr.has(t))) {
        const a = () => {
                for (const d of r) d.measure();
            },
            l = () => {
                for (const d of r) d.update(le.timestamp);
            },
            u = () => {
                for (const d of r) d.notify();
            },
            c = () => {
                (H.read(a, !1, !0), H.read(l, !1, !0), H.update(u, !1, !0));
            };
        kr.set(t, c);
        const f = Td(t);
        (window.addEventListener('resize', c, { passive: !0 }),
            t !== document.documentElement && Cd.set(t, sk(t, c)),
            f.addEventListener('scroll', c, { passive: !0 }));
    }
    const o = kr.get(t);
    return (
        H.read(o, !1, !0),
        () => {
            var a;
            rt(o);
            const l = ra.get(t);
            if (!l || (l.delete(s), l.size)) return;
            const u = kr.get(t);
            (kr.delete(t),
                u &&
                    (Td(t).removeEventListener('scroll', u),
                    (a = Cd.get(t)) === null || a === void 0 || a(),
                    window.removeEventListener('resize', u)));
        }
    );
}
function xk({ source: e, container: t, axis: n = 'y' }) {
    e && (t = e);
    const r = { value: 0 },
        i = Yu(
            (s) => {
                r.value = s[n].progress * 100;
            },
            { container: t, axis: n },
        );
    return { currentTime: r, cancel: i };
}
const ia = new Map();
function Ig({ source: e, container: t = document.documentElement, axis: n = 'y' } = {}) {
    (e && (t = e), ia.has(t) || ia.set(t, {}));
    const r = ia.get(t);
    return (
        r[n] ||
            (r[n] = Rm() ? new ScrollTimeline({ source: t, axis: n }) : xk({ source: t, axis: n })),
        r[n]
    );
}
function wk(e) {
    return e.length === 2;
}
function zg(e) {
    return e && (e.target || e.offset);
}
function Sk(e, t) {
    return wk(e) || zg(t)
        ? Yu((n) => {
              e(n[t.axis].progress, n);
          }, t)
        : Fg(e, Ig(t));
}
function kk(e, t) {
    if ((e.flatten(), zg(t)))
        return (
            e.pause(),
            Yu((n) => {
                e.time = e.duration * n[t.axis].progress;
            }, t)
        );
    {
        const n = Ig(t);
        return e.attachTimeline
            ? e.attachTimeline(
                  n,
                  (r) => (
                      r.pause(),
                      Fg((i) => {
                          r.time = r.duration * i;
                      }, n)
                  ),
              )
            : Ce;
    }
}
function Pk(e, { axis: t = 'y', ...n } = {}) {
    const r = { axis: t, ...n };
    return typeof e == 'function' ? Sk(e, r) : kk(e, r);
}
function Ed(e, t) {
    N0(!!(!t || t.current));
}
const Ck = () => ({
    scrollX: ut(0),
    scrollY: ut(0),
    scrollXProgress: ut(0),
    scrollYProgress: ut(0),
});
function Tk({ container: e, target: t, layoutEffect: n = !0, ...r } = {}) {
    const i = cr(Ck);
    return (
        (n ? ki : C.useEffect)(
            () => (
                Ed('target', t),
                Ed('container', e),
                Pk(
                    (o, { x: a, y: l }) => {
                        (i.scrollX.set(a.current),
                            i.scrollXProgress.set(a.progress),
                            i.scrollY.set(l.current),
                            i.scrollYProgress.set(l.progress));
                    },
                    {
                        ...r,
                        container: (e == null ? void 0 : e.current) || void 0,
                        target: (t == null ? void 0 : t.current) || void 0,
                    },
                )
            ),
            [e, t, JSON.stringify(r.offset)],
        ),
        i
    );
}
function Bg(e) {
    const t = cr(() => ut(e)),
        { isStatic: n } = C.useContext(Si);
    if (n) {
        const [, r] = C.useState(e);
        C.useEffect(() => t.on('change', r), []);
    }
    return t;
}
function $g(e, t) {
    const n = Bg(t()),
        r = () => n.set(t());
    return (
        r(),
        ki(() => {
            const i = () => H.preRender(r, !1, !0),
                s = e.map((o) => o.on('change', i));
            return () => {
                (s.forEach((o) => o()), rt(r));
            };
        }),
        n
    );
}
function Ld(e) {
    return typeof e == 'number' ? e : parseFloat(e);
}
function Ek(e, t = {}) {
    const { isStatic: n } = C.useContext(Si),
        r = C.useRef(null),
        i = Bg(de(e) ? Ld(e.get()) : e),
        s = C.useRef(i.get()),
        o = C.useRef(() => {}),
        a = () => {
            const u = r.current;
            (u && u.time === 0 && u.sample(le.delta),
                l(),
                (r.current = Gw({
                    keyframes: [i.get(), s.current],
                    velocity: i.getVelocity(),
                    type: 'spring',
                    restDelta: 0.001,
                    restSpeed: 0.01,
                    ...t,
                    onUpdate: o.current,
                })));
        },
        l = () => {
            r.current && r.current.stop();
        };
    return (
        C.useInsertionEffect(
            () =>
                i.attach(
                    (u, c) => (n ? c(u) : ((s.current = u), (o.current = c), H.update(a), i.get())),
                    l,
                ),
            [JSON.stringify(t)],
        ),
        ki(() => {
            if (de(e)) return e.on('change', (u) => i.set(Ld(u)));
        }, [i]),
        i
    );
}
const Lk = (e) => e && typeof e == 'object' && e.mix,
    Rk = (e) => (Lk(e) ? e.mix : void 0);
function Ak(...e) {
    const t = !Array.isArray(e[0]),
        n = t ? 0 : -1,
        r = e[0 + n],
        i = e[1 + n],
        s = e[2 + n],
        o = e[3 + n],
        a = Gu(i, s, { mixer: Rk(s[0]), ...o });
    return t ? a(r) : a;
}
function Ok(e) {
    ((Br.current = []), e());
    const t = $g(Br.current, e);
    return ((Br.current = void 0), t);
}
function un(e, t, n, r) {
    if (typeof e == 'function') return Ok(e);
    const i = typeof t == 'function' ? t : Ak(t, n, r);
    return Array.isArray(e) ? Rd(e, i) : Rd([e], ([s]) => i(s));
}
function Rd(e, t) {
    const n = cr(() => []);
    return $g(e, () => {
        n.length = 0;
        const r = e.length;
        for (let i = 0; i < r; i++) n[i] = e[i].get();
        return t(n);
    });
}
const V = (e) => typeof e == 'string',
    Pr = () => {
        let e, t;
        const n = new Promise((r, i) => {
            ((e = r), (t = i));
        });
        return ((n.resolve = e), (n.reject = t), n);
    },
    Ad = (e) => (e == null ? '' : '' + e),
    Dk = (e, t, n) => {
        e.forEach((r) => {
            t[r] && (n[r] = t[r]);
        });
    },
    Nk = /###/g,
    Od = (e) => (e && e.indexOf('###') > -1 ? e.replace(Nk, '.') : e),
    Dd = (e) => !e || V(e),
    br = (e, t, n) => {
        const r = V(t) ? t.split('.') : t;
        let i = 0;
        for (; i < r.length - 1; ) {
            if (Dd(e)) return {};
            const s = Od(r[i]);
            (!e[s] && n && (e[s] = new n()),
                Object.prototype.hasOwnProperty.call(e, s) ? (e = e[s]) : (e = {}),
                ++i);
        }
        return Dd(e) ? {} : { obj: e, k: Od(r[i]) };
    },
    Nd = (e, t, n) => {
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
    Mk = (e, t, n, r) => {
        const { obj: i, k: s } = br(e, t, Object);
        ((i[s] = i[s] || []), i[s].push(n));
    },
    Ws = (e, t) => {
        const { obj: n, k: r } = br(e, t);
        if (n && Object.prototype.hasOwnProperty.call(n, r)) return n[r];
    },
    Vk = (e, t, n) => {
        const r = Ws(e, n);
        return r !== void 0 ? r : Ws(t, n);
    },
    Ug = (e, t, n) => {
        for (const r in t)
            r !== '__proto__' &&
                r !== 'constructor' &&
                (r in e
                    ? V(e[r]) || e[r] instanceof String || V(t[r]) || t[r] instanceof String
                        ? n && (e[r] = t[r])
                        : Ug(e[r], t[r], n)
                    : (e[r] = t[r]));
        return e;
    },
    Tn = (e) => e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
var _k = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;' };
const jk = (e) => (V(e) ? e.replace(/[&<>"'\/]/g, (t) => _k[t]) : e);
class Fk {
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
const Ik = [' ', ',', '?', '!', ';'],
    zk = new Fk(20),
    Bk = (e, t, n) => {
        ((t = t || ''), (n = n || ''));
        const r = Ik.filter((o) => t.indexOf(o) < 0 && n.indexOf(o) < 0);
        if (r.length === 0) return !0;
        const i = zk.getRegExp(`(${r.map((o) => (o === '?' ? '\\?' : o)).join('|')})`);
        let s = !i.test(e);
        if (!s) {
            const o = e.indexOf(n);
            o > 0 && !i.test(e.substring(0, o)) && (s = !0);
        }
        return s;
    },
    vl = (e, t, n = '.') => {
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
    mi = (e) => (e == null ? void 0 : e.replace('_', '-')),
    $k = {
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
class Ks {
    constructor(t, n = {}) {
        this.init(t, n);
    }
    init(t, n = {}) {
        ((this.prefix = n.prefix || 'i18next:'),
            (this.logger = t || $k),
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
            : (V(t[0]) && (t[0] = `${r}${this.prefix} ${t[0]}`), this.logger[n](t));
    }
    create(t) {
        return new Ks(this.logger, { prefix: `${this.prefix}:${t}:`, ...this.options });
    }
    clone(t) {
        return (
            (t = t || this.options),
            (t.prefix = t.prefix || this.prefix),
            new Ks(this.logger, t)
        );
    }
}
var ct = new Ks();
class yo {
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
class Md extends yo {
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
                      : V(r) && s
                        ? a.push(...r.split(s))
                        : a.push(r)));
        const l = Ws(this.data, a);
        return (
            !l &&
                !n &&
                !r &&
                t.indexOf('.') > -1 &&
                ((t = a[0]), (n = a[1]), (r = a.slice(2).join('.'))),
            l || !o || !V(r)
                ? l
                : vl((c = (u = this.data) == null ? void 0 : u[t]) == null ? void 0 : c[n], r, s)
        );
    }
    addResource(t, n, r, i, s = { silent: !1 }) {
        const o = s.keySeparator !== void 0 ? s.keySeparator : this.options.keySeparator;
        let a = [t, n];
        (r && (a = a.concat(o ? r.split(o) : r)),
            t.indexOf('.') > -1 && ((a = t.split('.')), (i = n), (n = a[1])),
            this.addNamespaces(n),
            Nd(this.data, a, i),
            s.silent || this.emit('added', t, n, r, i));
    }
    addResources(t, n, r, i = { silent: !1 }) {
        for (const s in r)
            (V(r[s]) || Array.isArray(r[s])) && this.addResource(t, n, s, r[s], { silent: !0 });
        i.silent || this.emit('added', t, n, r);
    }
    addResourceBundle(t, n, r, i, s, o = { silent: !1, skipCopy: !1 }) {
        let a = [t, n];
        (t.indexOf('.') > -1 && ((a = t.split('.')), (i = r), (r = n), (n = a[1])),
            this.addNamespaces(n));
        let l = Ws(this.data, a) || {};
        (o.skipCopy || (r = JSON.parse(JSON.stringify(r))),
            i ? Ug(l, r, s) : (l = { ...l, ...r }),
            Nd(this.data, a, l),
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
var Hg = {
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
const Wg = Symbol('i18next/PATH_KEY');
function Uk() {
    const e = [],
        t = Object.create(null);
    let n;
    return (
        (t.get = (r, i) => {
            var s;
            return (
                (s = n == null ? void 0 : n.revoke) == null || s.call(n),
                i === Wg ? e : (e.push(i), (n = Proxy.revocable(r, t)), n.proxy)
            );
        }),
        Proxy.revocable(Object.create(null), t).proxy
    );
}
function xl(e, t) {
    const { [Wg]: n } = e(Uk());
    return n.join((t == null ? void 0 : t.keySeparator) ?? '.');
}
const Vd = {},
    sa = (e) => !V(e) && typeof e != 'boolean' && typeof e != 'number';
class bs extends yo {
    constructor(t, n = {}) {
        (super(),
            Dk(
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
            (this.logger = ct.create('translator')));
    }
    changeLanguage(t) {
        t && (this.language = t);
    }
    exists(t, n = { interpolation: {} }) {
        const r = { ...n };
        if (t == null) return !1;
        const i = this.resolve(t, r);
        if ((i == null ? void 0 : i.res) === void 0) return !1;
        const s = sa(i.res);
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
                !Bk(t, r, i);
        if (o && !a) {
            const l = t.match(this.interpolator.nestingRegexp);
            if (l && l.length > 0) return { key: t, namespaces: V(s) ? [s] : s };
            const u = t.split(r);
            ((r !== i || (r === i && this.options.ns.indexOf(u[0]) > -1)) && (s = u.shift()),
                (t = u.join(i)));
        }
        return { key: t, namespaces: V(s) ? [s] : s };
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
        (typeof t == 'function' && (t = xl(t, { ...this.options, ...i })),
            Array.isArray(t) || (t = [String(t)]));
        const s = i.returnDetails !== void 0 ? i.returnDetails : this.options.returnDetails,
            o = i.keySeparator !== void 0 ? i.keySeparator : this.options.keySeparator,
            { key: a, namespaces: l } = this.extractFromKey(t[t.length - 1], i),
            u = l[l.length - 1];
        let c = i.nsSeparator !== void 0 ? i.nsSeparator : this.options.nsSeparator;
        c === void 0 && (c = ':');
        const f = i.lng || this.language,
            d = i.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
        if ((f == null ? void 0 : f.toLowerCase()) === 'cimode')
            return d
                ? s
                    ? {
                          res: `${u}${c}${a}`,
                          usedKey: a,
                          exactUsedKey: a,
                          usedLng: f,
                          usedNS: u,
                          usedParams: this.getUsedParamsDetails(i),
                      }
                    : `${u}${c}${a}`
                : s
                  ? {
                        res: a,
                        usedKey: a,
                        exactUsedKey: a,
                        usedLng: f,
                        usedNS: u,
                        usedParams: this.getUsedParamsDetails(i),
                    }
                  : a;
        const m = this.resolve(t, i);
        let y = m == null ? void 0 : m.res;
        const v = (m == null ? void 0 : m.usedKey) || a,
            S = (m == null ? void 0 : m.exactUsedKey) || a,
            p = ['[object Number]', '[object Function]', '[object RegExp]'],
            h = i.joinArrays !== void 0 ? i.joinArrays : this.options.joinArrays,
            g = !this.i18nFormat || this.i18nFormat.handleAsObject,
            x = i.count !== void 0 && !V(i.count),
            w = bs.hasDefaultValue(i),
            P = x ? this.pluralResolver.getSuffix(f, i.count, i) : '',
            E = i.ordinal && x ? this.pluralResolver.getSuffix(f, i.count, { ordinal: !1 }) : '',
            k = x && !i.ordinal && i.count === 0,
            D =
                (k && i[`defaultValue${this.options.pluralSeparator}zero`]) ||
                i[`defaultValue${P}`] ||
                i[`defaultValue${E}`] ||
                i.defaultValue;
        let R = y;
        g && !y && w && (R = D);
        const X = sa(R),
            z = Object.prototype.toString.apply(R);
        if (g && R && X && p.indexOf(z) < 0 && !(V(h) && Array.isArray(R))) {
            if (!i.returnObjects && !this.options.returnObjects) {
                this.options.returnedObjectHandler ||
                    this.logger.warn(
                        'accessing an object - but returnObjects options is not enabled!',
                    );
                const j = this.options.returnedObjectHandler
                    ? this.options.returnedObjectHandler(v, R, { ...i, ns: l })
                    : `key '${a} (${this.language})' returned an object instead of string.`;
                return s ? ((m.res = j), (m.usedParams = this.getUsedParamsDetails(i)), m) : j;
            }
            if (o) {
                const j = Array.isArray(R),
                    F = j ? [] : {},
                    Z = j ? S : v;
                for (const oe in R)
                    if (Object.prototype.hasOwnProperty.call(R, oe)) {
                        const U = `${Z}${o}${oe}`;
                        (w && !y
                            ? (F[oe] = this.translate(U, {
                                  ...i,
                                  defaultValue: sa(D) ? D[oe] : void 0,
                                  joinArrays: !1,
                                  ns: l,
                              }))
                            : (F[oe] = this.translate(U, { ...i, joinArrays: !1, ns: l })),
                            F[oe] === U && (F[oe] = R[oe]));
                    }
                y = F;
            }
        } else if (g && V(h) && Array.isArray(y))
            ((y = y.join(h)), y && (y = this.extendTranslation(y, t, i, r)));
        else {
            let j = !1,
                F = !1;
            (!this.isValidLookup(y) && w && ((j = !0), (y = D)),
                this.isValidLookup(y) || ((F = !0), (y = a)));
            const oe =
                    (i.missingKeyNoValueFallbackToKey ||
                        this.options.missingKeyNoValueFallbackToKey) &&
                    F
                        ? void 0
                        : y,
                U = w && D !== y && this.options.updateMissing;
            if (F || j || U) {
                if ((this.logger.log(U ? 'updateKey' : 'missingKey', f, u, a, U ? D : y), o)) {
                    const B = this.resolve(a, { ...i, keySeparator: !1 });
                    B &&
                        B.res &&
                        this.logger.warn(
                            'Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.',
                        );
                }
                let L = [];
                const N = this.languageUtils.getFallbackCodes(
                    this.options.fallbackLng,
                    i.lng || this.language,
                );
                if (this.options.saveMissingTo === 'fallback' && N && N[0])
                    for (let B = 0; B < N.length; B++) L.push(N[B]);
                else
                    this.options.saveMissingTo === 'all'
                        ? (L = this.languageUtils.toResolveHierarchy(i.lng || this.language))
                        : L.push(i.lng || this.language);
                const _ = (B, K, it) => {
                    var Pn;
                    const st = w && it !== y ? it : oe;
                    (this.options.missingKeyHandler
                        ? this.options.missingKeyHandler(B, u, K, st, U, i)
                        : (Pn = this.backendConnector) != null &&
                          Pn.saveMissing &&
                          this.backendConnector.saveMissing(B, u, K, st, U, i),
                        this.emit('missingKey', B, u, K, y));
                };
                this.options.saveMissing &&
                    (this.options.saveMissingPlurals && x
                        ? L.forEach((B) => {
                              const K = this.pluralResolver.getSuffixes(B, i);
                              (k &&
                                  i[`defaultValue${this.options.pluralSeparator}zero`] &&
                                  K.indexOf(`${this.options.pluralSeparator}zero`) < 0 &&
                                  K.push(`${this.options.pluralSeparator}zero`),
                                  K.forEach((it) => {
                                      _([B], a + it, i[`defaultValue${it}`] || D);
                                  }));
                          })
                        : _(L, a, D));
            }
            ((y = this.extendTranslation(y, t, i, m, r)),
                F && y === a && this.options.appendNamespaceToMissingKey && (y = `${u}${c}${a}`),
                (F || j) &&
                    this.options.parseMissingKeyHandler &&
                    (y = this.options.parseMissingKeyHandler(
                        this.options.appendNamespaceToMissingKey ? `${u}${c}${a}` : a,
                        j ? y : void 0,
                        i,
                    )));
        }
        return s ? ((m.res = y), (m.usedParams = this.getUsedParamsDetails(i)), m) : y;
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
                V(t) &&
                (((u = r == null ? void 0 : r.interpolation) == null
                    ? void 0
                    : u.skipOnVariables) !== void 0
                    ? r.interpolation.skipOnVariables
                    : this.options.interpolation.skipOnVariables);
            let f;
            if (c) {
                const m = t.match(this.interpolator.nestingRegexp);
                f = m && m.length;
            }
            let d = r.replace && !V(r.replace) ? r.replace : r;
            if (
                (this.options.interpolation.defaultVariables &&
                    (d = { ...this.options.interpolation.defaultVariables, ...d }),
                (t = this.interpolator.interpolate(t, d, r.lng || this.language || i.usedLng, r)),
                c)
            ) {
                const m = t.match(this.interpolator.nestingRegexp),
                    y = m && m.length;
                f < y && (r.nest = !1);
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
            a = V(o) ? [o] : o;
        return (
            t != null &&
                a != null &&
                a.length &&
                r.applyPostProcessor !== !1 &&
                (t = Hg.handle(
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
            V(t) && (t = [t]),
            t.forEach((l) => {
                if (this.isValidLookup(r)) return;
                const u = this.extractFromKey(l, n),
                    c = u.key;
                i = c;
                let f = u.namespaces;
                this.options.fallbackNS && (f = f.concat(this.options.fallbackNS));
                const d = n.count !== void 0 && !V(n.count),
                    m = d && !n.ordinal && n.count === 0,
                    y =
                        n.context !== void 0 &&
                        (V(n.context) || typeof n.context == 'number') &&
                        n.context !== '',
                    v = n.lngs
                        ? n.lngs
                        : this.languageUtils.toResolveHierarchy(
                              n.lng || this.language,
                              n.fallbackLng,
                          );
                f.forEach((S) => {
                    var p, h;
                    this.isValidLookup(r) ||
                        ((a = S),
                        !Vd[`${v[0]}-${S}`] &&
                            (p = this.utils) != null &&
                            p.hasLoadedNamespace &&
                            !((h = this.utils) != null && h.hasLoadedNamespace(a)) &&
                            ((Vd[`${v[0]}-${S}`] = !0),
                            this.logger.warn(
                                `key "${i}" for languages "${v.join(', ')}" won't get resolved as namespace "${a}" was not yet loaded`,
                                'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!',
                            )),
                        v.forEach((g) => {
                            var P;
                            if (this.isValidLookup(r)) return;
                            o = g;
                            const x = [c];
                            if ((P = this.i18nFormat) != null && P.addLookupKeys)
                                this.i18nFormat.addLookupKeys(x, c, g, S, n);
                            else {
                                let E;
                                d && (E = this.pluralResolver.getSuffix(g, n.count, n));
                                const k = `${this.options.pluralSeparator}zero`,
                                    D = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                                if (
                                    (d &&
                                        (n.ordinal &&
                                            E.indexOf(D) === 0 &&
                                            x.push(c + E.replace(D, this.options.pluralSeparator)),
                                        x.push(c + E),
                                        m && x.push(c + k)),
                                    y)
                                ) {
                                    const R = `${c}${this.options.contextSeparator || '_'}${n.context}`;
                                    (x.push(R),
                                        d &&
                                            (n.ordinal &&
                                                E.indexOf(D) === 0 &&
                                                x.push(
                                                    R + E.replace(D, this.options.pluralSeparator),
                                                ),
                                            x.push(R + E),
                                            m && x.push(R + k)));
                                }
                            }
                            let w;
                            for (; (w = x.pop()); )
                                this.isValidLookup(r) ||
                                    ((s = w), (r = this.getResource(g, S, w, n)));
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
            r = t.replace && !V(t.replace);
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
class _d {
    constructor(t) {
        ((this.options = t),
            (this.supportedLngs = this.options.supportedLngs || !1),
            (this.logger = ct.create('languageUtils')));
    }
    getScriptPartFromCode(t) {
        if (((t = mi(t)), !t || t.indexOf('-') < 0)) return null;
        const n = t.split('-');
        return n.length === 2 || (n.pop(), n[n.length - 1].toLowerCase() === 'x')
            ? null
            : this.formatLanguageCode(n.join('-'));
    }
    getLanguagePartFromCode(t) {
        if (((t = mi(t)), !t || t.indexOf('-') < 0)) return t;
        const n = t.split('-');
        return this.formatLanguageCode(n[0]);
    }
    formatLanguageCode(t) {
        if (V(t) && t.indexOf('-') > -1) {
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
        if ((typeof t == 'function' && (t = t(n)), V(t) && (t = [t]), Array.isArray(t))) return t;
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
            V(t) && (t.indexOf('-') > -1 || t.indexOf('_') > -1)
                ? (this.options.load !== 'languageOnly' && s(this.formatLanguageCode(t)),
                  this.options.load !== 'languageOnly' &&
                      this.options.load !== 'currentOnly' &&
                      s(this.getScriptPartFromCode(t)),
                  this.options.load !== 'currentOnly' && s(this.getLanguagePartFromCode(t)))
                : V(t) && s(this.formatLanguageCode(t)),
            r.forEach((o) => {
                i.indexOf(o) < 0 && s(this.formatLanguageCode(o));
            }),
            i
        );
    }
}
const jd = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 },
    Fd = {
        select: (e) => (e === 1 ? 'one' : 'other'),
        resolvedOptions: () => ({ pluralCategories: ['one', 'other'] }),
    };
class Hk {
    constructor(t, n = {}) {
        ((this.languageUtils = t),
            (this.options = n),
            (this.logger = ct.create('pluralResolver')),
            (this.pluralRulesCache = {}));
    }
    addRule(t, n) {
        this.rules[t] = n;
    }
    clearCache() {
        this.pluralRulesCache = {};
    }
    getRule(t, n = {}) {
        const r = mi(t === 'dev' ? 'en' : t),
            i = n.ordinal ? 'ordinal' : 'cardinal',
            s = JSON.stringify({ cleanedCode: r, type: i });
        if (s in this.pluralRulesCache) return this.pluralRulesCache[s];
        let o;
        try {
            o = new Intl.PluralRules(r, { type: i });
        } catch {
            if (!Intl)
                return (this.logger.error('No Intl support, please use an Intl polyfill!'), Fd);
            if (!t.match(/-|_/)) return Fd;
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
                      .pluralCategories.sort((i, s) => jd[i] - jd[s])
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
const Id = (e, t, n, r = '.', i = !0) => {
        let s = Vk(e, t, n);
        return (!s && i && V(n) && ((s = vl(e, n, r)), s === void 0 && (s = vl(t, n, r))), s);
    },
    oa = (e) => e.replace(/\$/g, '$$$$');
class zd {
    constructor(t = {}) {
        var n;
        ((this.logger = ct.create('interpolator')),
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
            unescapePrefix: f,
            nestingPrefix: d,
            nestingPrefixEscaped: m,
            nestingSuffix: y,
            nestingSuffixEscaped: v,
            nestingOptionsSeparator: S,
            maxReplaces: p,
            alwaysFormat: h,
        } = t.interpolation;
        ((this.escape = n !== void 0 ? n : jk),
            (this.escapeValue = r !== void 0 ? r : !0),
            (this.useRawValueToEscape = i !== void 0 ? i : !1),
            (this.prefix = s ? Tn(s) : o || '{{'),
            (this.suffix = a ? Tn(a) : l || '}}'),
            (this.formatSeparator = u || ','),
            (this.unescapePrefix = c ? '' : f || '-'),
            (this.unescapeSuffix = this.unescapePrefix ? '' : c || ''),
            (this.nestingPrefix = d ? Tn(d) : m || Tn('$t(')),
            (this.nestingSuffix = y ? Tn(y) : v || Tn(')')),
            (this.nestingOptionsSeparator = S || ','),
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
            u = (y) => {
                if (y.indexOf(this.formatSeparator) < 0) {
                    const h = Id(
                        n,
                        l,
                        y,
                        this.options.keySeparator,
                        this.options.ignoreJSONStructure,
                    );
                    return this.alwaysFormat
                        ? this.format(h, void 0, r, { ...i, ...n, interpolationkey: y })
                        : h;
                }
                const v = y.split(this.formatSeparator),
                    S = v.shift().trim(),
                    p = v.join(this.formatSeparator).trim();
                return this.format(
                    Id(n, l, S, this.options.keySeparator, this.options.ignoreJSONStructure),
                    p,
                    r,
                    { ...i, ...n, interpolationkey: S },
                );
            };
        this.resetRegExp();
        const c =
                (i == null ? void 0 : i.missingInterpolationHandler) ||
                this.options.missingInterpolationHandler,
            f =
                ((m = i == null ? void 0 : i.interpolation) == null
                    ? void 0
                    : m.skipOnVariables) !== void 0
                    ? i.interpolation.skipOnVariables
                    : this.options.interpolation.skipOnVariables;
        return (
            [
                { regex: this.regexpUnescape, safeValue: (y) => oa(y) },
                {
                    regex: this.regexp,
                    safeValue: (y) => (this.escapeValue ? oa(this.escape(y)) : oa(y)),
                },
            ].forEach((y) => {
                for (a = 0; (s = y.regex.exec(t)); ) {
                    const v = s[1].trim();
                    if (((o = u(v)), o === void 0))
                        if (typeof c == 'function') {
                            const p = c(t, s, i);
                            o = V(p) ? p : '';
                        } else if (i && Object.prototype.hasOwnProperty.call(i, v)) o = '';
                        else if (f) {
                            o = s[0];
                            continue;
                        } else
                            (this.logger.warn(
                                `missed to pass in variable ${v} for interpolating ${t}`,
                            ),
                                (o = ''));
                    else !V(o) && !this.useRawValueToEscape && (o = Ad(o));
                    const S = y.safeValue(o);
                    if (
                        ((t = t.replace(s[0], S)),
                        f
                            ? ((y.regex.lastIndex += o.length), (y.regex.lastIndex -= s[0].length))
                            : (y.regex.lastIndex = 0),
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
            const f = l.split(new RegExp(`${c}[ ]*{`));
            let d = `{${f[1]}`;
            ((l = f[0]), (d = this.interpolate(d, o)));
            const m = d.match(/'/g),
                y = d.match(/"/g);
            ((((m == null ? void 0 : m.length) ?? 0) % 2 === 0 && !y) || y.length % 2 !== 0) &&
                (d = d.replace(/'/g, '"'));
            try {
                ((o = JSON.parse(d)), u && (o = { ...u, ...o }));
            } catch (v) {
                return (
                    this.logger.warn(`failed parsing options string in nesting for key ${l}`, v),
                    `${l}${c}${d}`
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
                (o = o.replace && !V(o.replace) ? o.replace : o),
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
                s && i[0] === t && !V(s))
            )
                return s;
            (V(s) || (s = Ad(s)),
                s || (this.logger.warn(`missed to resolve ${i[1]} for nesting ${t}`), (s = '')),
                l.length &&
                    (s = l.reduce(
                        (c, f) => this.format(c, f, r.lng, { ...r, interpolationkey: i[1].trim() }),
                        s.trim(),
                    )),
                (t = t.replace(i[0], s)),
                (this.regexp.lastIndex = 0));
        }
        return t;
    }
}
const Wk = (e) => {
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
    Bd = (e) => {
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
            return (a || ((a = e(mi(r), i)), (t[o] = a)), a(n));
        };
    },
    Kk = (e) => (t, n, r) => e(mi(n), r)(t);
class bk {
    constructor(t = {}) {
        ((this.logger = ct.create('formatter')), (this.options = t), this.init(t));
    }
    init(t, n = { interpolation: {} }) {
        this.formatSeparator = n.interpolation.formatSeparator || ',';
        const r = n.cacheInBuiltFormats ? Bd : Kk;
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
        this.formats[t.toLowerCase().trim()] = Bd(n);
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
            var f;
            const { formatName: u, formatOptions: c } = Wk(l);
            if (this.formats[u]) {
                let d = a;
                try {
                    const m =
                            ((f = i == null ? void 0 : i.formatParams) == null
                                ? void 0
                                : f[i.interpolationkey]) || {},
                        y = m.locale || m.lng || i.locale || i.lng || r;
                    d = this.formats[u](a, y, { ...c, ...i, ...m });
                } catch (m) {
                    this.logger.warn(m);
                }
                return d;
            } else this.logger.warn(`there was no format function for ${u}`);
            return a;
        }, t);
    }
}
const Gk = (e, t) => {
    e.pending[t] !== void 0 && (delete e.pending[t], e.pendingCount--);
};
class Qk extends yo {
    constructor(t, n, r, i = {}) {
        var s, o;
        (super(),
            (this.backend = t),
            (this.store = n),
            (this.services = r),
            (this.languageUtils = r.languageUtils),
            (this.options = i),
            (this.logger = ct.create('backendConnector')),
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
                (n.forEach((f) => {
                    const d = `${u}|${f}`;
                    !r.reload && this.store.hasResourceBundle(u, f)
                        ? (this.state[d] = 2)
                        : this.state[d] < 0 ||
                          (this.state[d] === 1
                              ? o[d] === void 0 && (o[d] = !0)
                              : ((this.state[d] = 1),
                                (c = !1),
                                o[d] === void 0 && (o[d] = !0),
                                s[d] === void 0 && (s[d] = !0),
                                l[f] === void 0 && (l[f] = !0)));
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
            (Mk(l.loaded, [s], o),
                Gk(l, t),
                n && l.errors.push(n),
                l.pendingCount === 0 &&
                    !l.done &&
                    (Object.keys(l.loaded).forEach((u) => {
                        a[u] || (a[u] = {});
                        const c = l.loaded[u];
                        c.length &&
                            c.forEach((f) => {
                                a[u][f] === void 0 && (a[u][f] = !0);
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
                    const f = this.waitingReads.shift();
                    this.read(f.lng, f.ns, f.fcName, f.tried, f.wait, f.callback);
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
        (V(t) && (t = this.languageUtils.toResolveHierarchy(t)), V(n) && (n = [n]));
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
        var l, u, c, f, d;
        if (
            (u = (l = this.services) == null ? void 0 : l.utils) != null &&
            u.hasLoadedNamespace &&
            !(
                (f = (c = this.services) == null ? void 0 : c.utils) != null &&
                f.hasLoadedNamespace(n)
            )
        ) {
            this.logger.warn(
                `did not save key "${r}" as the namespace "${n}" was not yet loaded`,
                'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!',
            );
            return;
        }
        if (!(r == null || r === '')) {
            if ((d = this.backend) != null && d.create) {
                const m = { ...o, isUpdate: s },
                    y = this.backend.create.bind(this.backend);
                if (y.length < 6)
                    try {
                        let v;
                        (y.length === 5 ? (v = y(t, n, r, i, m)) : (v = y(t, n, r, i)),
                            v && typeof v.then == 'function'
                                ? v.then((S) => a(null, S)).catch(a)
                                : a(null, v));
                    } catch (v) {
                        a(v);
                    }
                else y(t, n, r, i, a, m);
            }
            !t || !t[0] || this.store.addResource(t[0], n, r, i);
        }
    }
}
const $d = () => ({
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
                V(e[1]) && (t.defaultValue = e[1]),
                V(e[2]) && (t.tDescription = e[2]),
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
    Ud = (e) => {
        var t, n;
        return (
            V(e.ns) && (e.ns = [e.ns]),
            V(e.fallbackLng) && (e.fallbackLng = [e.fallbackLng]),
            V(e.fallbackNS) && (e.fallbackNS = [e.fallbackNS]),
            ((n = (t = e.supportedLngs) == null ? void 0 : t.indexOf) == null
                ? void 0
                : n.call(t, 'cimode')) < 0 &&
                (e.supportedLngs = e.supportedLngs.concat(['cimode'])),
            typeof e.initImmediate == 'boolean' && (e.initAsync = e.initImmediate),
            e
        );
    },
    Yi = () => {},
    Yk = (e) => {
        Object.getOwnPropertyNames(Object.getPrototypeOf(e)).forEach((n) => {
            typeof e[n] == 'function' && (e[n] = e[n].bind(e));
        });
    };
class Gr extends yo {
    constructor(t = {}, n) {
        if (
            (super(),
            (this.options = Ud(t)),
            (this.services = {}),
            (this.logger = ct),
            (this.modules = { external: [] }),
            Yk(this),
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
                (V(t.ns)
                    ? (t.defaultNS = t.ns)
                    : t.ns.indexOf('translation') < 0 && (t.defaultNS = t.ns[0])));
        const r = $d();
        ((this.options = { ...r, ...this.options, ...Ud(t) }),
            (this.options.interpolation = { ...r.interpolation, ...this.options.interpolation }),
            t.keySeparator !== void 0 && (this.options.userDefinedKeySeparator = t.keySeparator),
            t.nsSeparator !== void 0 && (this.options.userDefinedNsSeparator = t.nsSeparator),
            typeof this.options.overloadTranslationOptionHandler != 'function' &&
                (this.options.overloadTranslationOptionHandler =
                    r.overloadTranslationOptionHandler));
        const i = (u) => (u ? (typeof u == 'function' ? new u() : u) : null);
        if (!this.options.isClone) {
            this.modules.logger
                ? ct.init(i(this.modules.logger), this.options)
                : ct.init(null, this.options);
            let u;
            this.modules.formatter ? (u = this.modules.formatter) : (u = bk);
            const c = new _d(this.options);
            this.store = new Md(this.options.resources, this.options);
            const f = this.services;
            ((f.logger = ct),
                (f.resourceStore = this.store),
                (f.languageUtils = c),
                (f.pluralResolver = new Hk(c, {
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
                    ((f.formatter = i(u)),
                    f.formatter.init && f.formatter.init(f, this.options),
                    (this.options.interpolation.format = f.formatter.format.bind(f.formatter))),
                (f.interpolator = new zd(this.options)),
                (f.utils = { hasLoadedNamespace: this.hasLoadedNamespace.bind(this) }),
                (f.backendConnector = new Qk(
                    i(this.modules.backend),
                    f.resourceStore,
                    f,
                    this.options,
                )),
                f.backendConnector.on('*', (m, ...y) => {
                    this.emit(m, ...y);
                }),
                this.modules.languageDetector &&
                    ((f.languageDetector = i(this.modules.languageDetector)),
                    f.languageDetector.init &&
                        f.languageDetector.init(f, this.options.detection, this.options)),
                this.modules.i18nFormat &&
                    ((f.i18nFormat = i(this.modules.i18nFormat)),
                    f.i18nFormat.init && f.i18nFormat.init(this)),
                (this.translator = new bs(this.services, this.options)),
                this.translator.on('*', (m, ...y) => {
                    this.emit(m, ...y);
                }),
                this.modules.external.forEach((m) => {
                    m.init && m.init(this);
                }));
        }
        if (
            ((this.format = this.options.interpolation.format),
            n || (n = Yi),
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
        const a = Pr(),
            l = () => {
                const u = (c, f) => {
                    ((this.isInitializing = !1),
                        this.isInitialized &&
                            !this.initializedStoreOnce &&
                            this.logger.warn(
                                'init: i18next is already initialized. You should call init just once!',
                            ),
                        (this.isInitialized = !0),
                        this.options.isClone || this.logger.log('initialized', this.options),
                        this.emit('initialized', this.options),
                        a.resolve(f),
                        n(c, f));
                };
                if (this.languages && !this.isInitialized) return u(null, this.t.bind(this));
                this.changeLanguage(this.options.lng, u);
            };
        return (this.options.resources || !this.options.initAsync ? l() : setTimeout(l, 0), a);
    }
    loadResources(t, n = Yi) {
        var s, o;
        let r = n;
        const i = V(t) ? t : this.language;
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
                    this.services.languageUtils.toResolveHierarchy(u).forEach((f) => {
                        f !== 'cimode' && a.indexOf(f) < 0 && a.push(f);
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
        const i = Pr();
        return (
            typeof t == 'function' && ((r = t), (t = void 0)),
            typeof n == 'function' && ((r = n), (n = void 0)),
            t || (t = this.languages),
            n || (n = this.options.ns),
            r || (r = Yi),
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
            t.type === 'postProcessor' && Hg.addPostProcessor(t),
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
        const r = Pr();
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
                var c, f;
                !t && !a && this.services.languageDetector && (a = []);
                const l = V(a) ? a : a && a[0],
                    u = this.store.hasLanguageSomeTranslations(l)
                        ? l
                        : this.services.languageUtils.getBestMatchFromCodes(V(a) ? [a] : a);
                (u &&
                    (this.language || i(u),
                    this.translator.language || this.translator.changeLanguage(u),
                    (f =
                        (c = this.services.languageDetector) == null
                            ? void 0
                            : c.cacheUserLanguage) == null || f.call(c, u)),
                    this.loadResources(u, (d) => {
                        s(d, u);
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
                          (f) => (
                              typeof f == 'function' && (f = xl(f, { ...this.options, ...o })),
                              `${l.keyPrefix}${u}${f}`
                          ),
                      ))
                    : (typeof s == 'function' && (s = xl(s, { ...this.options, ...o })),
                      (c = l.keyPrefix ? `${l.keyPrefix}${u}${s}` : s)),
                this.t(c, l)
            );
        };
        return (V(t) ? (i.lng = t) : (i.lngs = t), (i.ns = n), (i.keyPrefix = r), i);
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
        const r = Pr();
        return this.options.ns
            ? (V(t) && (t = [t]),
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
        const r = Pr();
        V(t) && (t = [t]);
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
            r = ((s = this.services) == null ? void 0 : s.languageUtils) || new _d($d());
        return t.toLowerCase().indexOf('-latn') > 1
            ? 'ltr'
            : n.indexOf(r.getLanguagePartFromCode(t)) > -1 || t.toLowerCase().indexOf('-arab') > 1
              ? 'rtl'
              : 'ltr';
    }
    static createInstance(t = {}, n) {
        const r = new Gr(t, n);
        return ((r.createInstance = Gr.createInstance), r);
    }
    cloneInstance(t = {}, n = Yi) {
        const r = t.forkResourceStore;
        r && delete t.forkResourceStore;
        const i = { ...this.options, ...t, isClone: !0 },
            s = new Gr(i);
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
                    (l[u] = Object.keys(l[u]).reduce((c, f) => ((c[f] = { ...l[u][f] }), c), l[u])),
                    l
                ),
                {},
            );
            ((s.store = new Md(a, i)), (s.services.resourceStore = s.store));
        }
        return (
            t.interpolation && (s.services.interpolator = new zd(i)),
            (s.translator = new bs(s.services, i)),
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
const Le = Gr.createInstance();
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
const Xk = (e, t, n, r) => {
        var s, o, a, l;
        const i = [n, { code: t, ...(r || {}) }];
        if (
            (o = (s = e == null ? void 0 : e.services) == null ? void 0 : s.logger) != null &&
            o.forward
        )
            return e.services.logger.forward(i, 'warn', 'react-i18next::', !0);
        (xn(i[0]) && (i[0] = `react-i18next:: ${i[0]}`),
            (l = (a = e == null ? void 0 : e.services) == null ? void 0 : a.logger) != null &&
            l.warn
                ? e.services.logger.warn(...i)
                : console != null && console.warn && console.warn(...i));
    },
    Hd = {},
    Kg = (e, t, n, r) => {
        (xn(n) && Hd[n]) || (xn(n) && (Hd[n] = new Date()), Xk(e, t, n, r));
    },
    bg = (e, t) => () => {
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
    wl = (e, t, n) => {
        e.loadNamespaces(t, bg(e, n));
    },
    Wd = (e, t, n, r) => {
        if ((xn(n) && (n = [n]), e.options.preload && e.options.preload.indexOf(t) > -1))
            return wl(e, n, r);
        (n.forEach((i) => {
            e.options.ns.indexOf(i) < 0 && e.options.ns.push(i);
        }),
            e.loadLanguages(t, bg(e, r)));
    },
    Zk = (e, t, n = {}) =>
        !t.languages || !t.languages.length
            ? (Kg(t, 'NO_LANGUAGES', 'i18n.languages were undefined or empty', {
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
    xn = (e) => typeof e == 'string',
    Jk = (e) => typeof e == 'object' && e !== null,
    qk =
        /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g,
    eP = {
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
    tP = (e) => eP[e],
    nP = (e) => e.replace(qk, tP);
let Sl = {
    bindI18n: 'languageChanged',
    bindI18nStore: '',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: !0,
    transWrapTextNodes: '',
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    useSuspense: !0,
    unescape: nP,
    transDefaultProps: void 0,
};
const rP = (e = {}) => {
        Sl = { ...Sl, ...e };
    },
    iP = () => Sl;
let Gg;
const sP = (e) => {
        Gg = e;
    },
    oP = () => Gg,
    aP = {
        type: '3rdParty',
        init(e) {
            (rP(e.options.react), sP(e));
        },
    },
    lP = C.createContext();
class uP {
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
var Qg = { exports: {} },
    Yg = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var or = C;
function cP(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var fP = typeof Object.is == 'function' ? Object.is : cP,
    dP = or.useState,
    hP = or.useEffect,
    pP = or.useLayoutEffect,
    mP = or.useDebugValue;
function gP(e, t) {
    var n = t(),
        r = dP({ inst: { value: n, getSnapshot: t } }),
        i = r[0].inst,
        s = r[1];
    return (
        pP(
            function () {
                ((i.value = n), (i.getSnapshot = t), aa(i) && s({ inst: i }));
            },
            [e, n, t],
        ),
        hP(
            function () {
                return (
                    aa(i) && s({ inst: i }),
                    e(function () {
                        aa(i) && s({ inst: i });
                    })
                );
            },
            [e],
        ),
        mP(n),
        n
    );
}
function aa(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !fP(e, n);
    } catch {
        return !0;
    }
}
function yP(e, t) {
    return t();
}
var vP =
    typeof window > 'u' ||
    typeof window.document > 'u' ||
    typeof window.document.createElement > 'u'
        ? yP
        : gP;
Yg.useSyncExternalStore = or.useSyncExternalStore !== void 0 ? or.useSyncExternalStore : vP;
Qg.exports = Yg;
var xP = Qg.exports;
const wP = (e, t) =>
        xn(t)
            ? t
            : Jk(t) && xn(t.defaultValue)
              ? t.defaultValue
              : Array.isArray(e)
                ? e[e.length - 1]
                : e,
    SP = { t: wP, ready: !1 },
    kP = () => () => {},
    PP = (e, t = {}) => {
        var D, R, X;
        const { i18n: n } = t,
            { i18n: r, defaultNS: i } = C.useContext(lP) || {},
            s = n || r || oP();
        (s && !s.reportNamespaces && (s.reportNamespaces = new uP()),
            s ||
                Kg(
                    s,
                    'NO_I18NEXT_INSTANCE',
                    'useTranslation: You will need to pass in an i18next instance by using initReactI18next',
                ));
        const o = C.useMemo(() => {
                var z;
                return {
                    ...iP(),
                    ...((z = s == null ? void 0 : s.options) == null ? void 0 : z.react),
                    ...t,
                };
            }, [s, t]),
            { useSuspense: a, keyPrefix: l } = o,
            u = i || ((D = s == null ? void 0 : s.options) == null ? void 0 : D.defaultNS),
            c = xn(u) ? [u] : u || ['translation'],
            f = C.useMemo(() => c, c);
        (X =
            (R = s == null ? void 0 : s.reportNamespaces) == null ? void 0 : R.addUsedNamespaces) ==
            null || X.call(R, f);
        const d = C.useRef(0),
            m = C.useCallback(
                (z) => {
                    if (!s) return kP;
                    const { bindI18n: j, bindI18nStore: F } = o,
                        Z = () => {
                            ((d.current += 1), z());
                        };
                    return (
                        j && s.on(j, Z),
                        F && s.store.on(F, Z),
                        () => {
                            (j && j.split(' ').forEach((oe) => s.off(oe, Z)),
                                F && F.split(' ').forEach((oe) => s.store.off(oe, Z)));
                        }
                    );
                },
                [s, o],
            ),
            y = C.useRef(),
            v = C.useCallback(() => {
                if (!s) return SP;
                const z =
                        !!(s.isInitialized || s.initializedStoreOnce) &&
                        f.every((L) => Zk(L, s, o)),
                    j = t.lng || s.language,
                    F = d.current,
                    Z = y.current;
                if (Z && Z.ready === z && Z.lng === j && Z.keyPrefix === l && Z.revision === F)
                    return Z;
                const U = {
                    t: s.getFixedT(j, o.nsMode === 'fallback' ? f : f[0], l),
                    ready: z,
                    lng: j,
                    keyPrefix: l,
                    revision: F,
                };
                return ((y.current = U), U);
            }, [s, f, l, o, t.lng]),
            [S, p] = C.useState(0),
            { t: h, ready: g } = xP.useSyncExternalStore(m, v, v);
        C.useEffect(() => {
            if (s && !g && !a) {
                const z = () => p((j) => j + 1);
                t.lng ? Wd(s, t.lng, f, z) : wl(s, f, z);
            }
        }, [s, t.lng, f, g, a, S]);
        const x = s || {},
            w = C.useRef(null),
            P = C.useRef(),
            E = (z) => {
                const j = Object.getOwnPropertyDescriptors(z);
                j.__original && delete j.__original;
                const F = Object.create(Object.getPrototypeOf(z), j);
                if (!Object.prototype.hasOwnProperty.call(F, '__original'))
                    try {
                        Object.defineProperty(F, '__original', {
                            value: z,
                            writable: !1,
                            enumerable: !1,
                            configurable: !1,
                        });
                    } catch {}
                return F;
            },
            k = C.useMemo(() => {
                const z = x,
                    j = z == null ? void 0 : z.language;
                let F = z;
                z &&
                    (w.current && w.current.__original === z
                        ? P.current !== j
                            ? ((F = E(z)), (w.current = F), (P.current = j))
                            : (F = w.current)
                        : ((F = E(z)), (w.current = F), (P.current = j)));
                const Z = [h, F, g];
                return ((Z.t = h), (Z.i18n = F), (Z.ready = g), Z);
            }, [h, x, g, x.resolvedLanguage, x.language, x.languages]);
        if (s && a && !g)
            throw new Promise((z) => {
                const j = () => z();
                t.lng ? Wd(s, t.lng, f, j) : wl(s, f, j);
            });
        return k;
    },
    CP = ({ scrollProgress: e }) => {
        const t = C.useRef(null),
            [n, r] = C.useState([]),
            [i, s] = C.useState(!1),
            [o, a] = C.useState(0),
            l = 120,
            u = un(e, [0, 1], [1, l]),
            c = Ek(u, { stiffness: 300, damping: 30, restDelta: 0.001 });
        return (
            C.useEffect(() => {
                let f = 0;
                const d = [];
                (() => {
                    for (let y = 1; y <= l; y++) {
                        const v = new Image(),
                            S = y.toString().padStart(4, '0');
                        ((v.src = `/frames/hal-Test_frame_${S}.webp`),
                            (v.onload = () => {
                                (f++, a(Math.floor((f / l) * 100)), f === l && s(!0));
                            }),
                            (v.onerror = () => {
                                (f++, f === l && s(!0));
                            }),
                            (d[y] = v));
                    }
                    r(d);
                })();
            }, []),
            C.useEffect(() => {
                if (!i || !t.current) return;
                const f = t.current.getContext('2d'),
                    d = () => {
                        const v = Math.floor(c.get()),
                            S = n[v];
                        if (S && S.complete) {
                            const p = t.current;
                            f.clearRect(0, 0, p.width, p.height);
                            const h = Math.min(p.width / S.width, p.height / S.height),
                                g = p.width / 2 - (S.width / 2) * h,
                                x = p.height / 2 - (S.height / 2) * h;
                            f.drawImage(S, g, x, S.width * h, S.height * h);
                        }
                        requestAnimationFrame(d);
                    },
                    m = () => {
                        t.current &&
                            ((t.current.width = window.innerWidth),
                            (t.current.height = window.innerHeight));
                    };
                (window.addEventListener('resize', m), m());
                const y = requestAnimationFrame(d);
                return () => {
                    (cancelAnimationFrame(y), window.removeEventListener('resize', m));
                };
            }, [i, n, c]),
            O.jsxs('div', {
                className: 'fixed inset-0 z-0 flex items-center justify-center bg-transparent',
                children: [
                    O.jsx('canvas', { ref: t, className: 'w-full h-full object-contain' }),
                    O.jsx(D0, {
                        children:
                            !i &&
                            O.jsxs(We.div, {
                                exit: { opacity: 0 },
                                className:
                                    'absolute inset-0 z-50 flex flex-col items-center justify-center bg-background font-mono',
                                children: [
                                    O.jsx('div', {
                                        className: 'text-white text-xl mb-4 tracking-tighter',
                                        children: 'INITIALIZING HAL_SYSTEM',
                                    }),
                                    O.jsx('div', {
                                        className: 'w-64 h-[2px] bg-white/10 overflow-hidden',
                                        children: O.jsx(We.div, {
                                            className: 'h-full bg-white',
                                            initial: { width: 0 },
                                            animate: { width: `${o}%` },
                                        }),
                                    }),
                                    O.jsxs('div', {
                                        className: 'mt-2 text-white/40 text-xs',
                                        children: [o, '%'],
                                    }),
                                ],
                            }),
                    }),
                ],
            })
        );
    },
    TP = ({ scrollProgress: e, t }) => {
        const n = un(e, [0, 0.15], [1, 0]),
            r = un(e, [0.2, 0.3, 0.4], [0, 1, 0]),
            i = un(e, [0.5, 0.6, 0.7], [0, 1, 0]),
            s = un(e, [0.85, 0.95], [0, 1]),
            o = 'text-white font-mono tracking-tight text-center px-6 max-w-4xl select-none';
        return O.jsxs('div', {
            className: 'fixed inset-0 z-10 pointer-events-none flex items-center justify-center',
            children: [
                O.jsxs(We.div, {
                    style: { opacity: n },
                    className: o,
                    children: [
                        O.jsxs('h1', {
                            className: 'text-5xl md:text-8xl font-bold uppercase mb-4',
                            children: [
                                O.jsx('span', {
                                    className: 'text-hal-primary-500',
                                    children: 'hal',
                                }),
                                O.jsx('span', { className: 'text-white', children: '-' }),
                                O.jsx('span', {
                                    className: 'text-hal-warning-500',
                                    children: 'Test',
                                }),
                            ],
                        }),
                        O.jsx('p', {
                            className: 'text-lg md:text-xl text-white/60',
                            children: t('hero.subtitle'),
                        }),
                    ],
                }),
                O.jsxs(We.div, {
                    style: { opacity: r },
                    className: o,
                    children: [
                        O.jsx('h2', {
                            className: 'text-3xl md:text-5xl font-bold uppercase mb-4',
                            children: t('features.visual_editor.title'),
                        }),
                        O.jsx('p', {
                            className: 'text-lg md:text-xl text-white/60',
                            children: t('features.visual_editor.description'),
                        }),
                    ],
                }),
                O.jsxs(We.div, {
                    style: { opacity: i },
                    className: o,
                    children: [
                        O.jsx('h2', {
                            className: 'text-3xl md:text-5xl font-bold uppercase mb-4',
                            children: t('features.advanced_control.title'),
                        }),
                        O.jsx('p', {
                            className: 'text-lg md:text-xl text-white/60',
                            children: t('features.advanced_control.description'),
                        }),
                    ],
                }),
                O.jsxs(We.div, {
                    style: { opacity: s },
                    className: `${o} pointer-events-auto`,
                    children: [
                        O.jsx('h2', {
                            className: 'text-4xl md:text-7xl font-bold uppercase mb-8',
                            children: t('cta.open_source'),
                        }),
                        O.jsxs('div', {
                            className:
                                'flex flex-col md:flex-row gap-4 justify-center items-center',
                            children: [
                                O.jsx(We.button, {
                                    whileHover: {
                                        scale: 1.05,
                                        backgroundColor: 'var(--hal-primary-500)',
                                        borderColor: 'var(--hal-primary-500)',
                                    },
                                    whileTap: { scale: 0.95 },
                                    onClick: () => window.open('/app', '_blank'),
                                    className:
                                        'border border-white/20 bg-hal-primary-500/20 text-white px-12 py-4 rounded-full text-lg uppercase font-bold transition-colors backdrop-blur-md hover:bg-hal-primary-500',
                                    children: t('cta.launch_app'),
                                }),
                                O.jsxs(We.button, {
                                    whileHover: {
                                        scale: 1.05,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                    },
                                    whileTap: { scale: 0.95 },
                                    onClick: () =>
                                        window.open(
                                            'https://github.com/andresguc1/hal-test',
                                            '_blank',
                                        ),
                                    className:
                                        'flex items-center gap-2 border border-white/20 bg-black/20 text-white px-8 py-4 rounded-full text-lg uppercase font-bold transition-colors backdrop-blur-md',
                                    children: [
                                        O.jsx('span', { children: '★' }),
                                        ' ',
                                        t('cta.star_github'),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });
    };
function EP() {
    const e = C.useRef(null),
        { t, i18n: n } = PP(),
        { scrollYProgress: r } = Tk({ target: e, offset: ['start start', 'end end'] }),
        i = un(r, [0, 1], [0, 360]),
        s = () => {
            const o = n.language.startsWith('es') ? 'en' : 'es';
            n.changeLanguage(o);
        };
    return O.jsxs('div', {
        className: 'bg-background min-h-screen text-white',
        children: [
            O.jsx('style', {
                dangerouslySetInnerHTML: {
                    __html: `
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');
        body { background: #0f172a; margin: 0; cursor: crosshair; }
        ::-webkit-scrollbar { display: none; }
        .font-mono { font-family: 'Geist Mono', monospace; }
      `,
                },
            }),
            O.jsxs('nav', {
                className:
                    'fixed top-0 left-0 w-full p-8 z-50 flex justify-between items-center mix-blend-difference font-mono',
                children: [
                    O.jsxs('div', {
                        className: 'text-xl font-bold tracking-wider flex items-center gap-3',
                        children: [
                            O.jsx(We.img, {
                                style: { rotate: i },
                                src: '/images/haltest_logo.jpeg',
                                alt: 'Hal-Test Logo',
                                className: 'w-8 h-8 rounded-lg',
                            }),
                            O.jsxs('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                    O.jsx('span', {
                                        className: 'text-hal-primary-500',
                                        children: 'HAL',
                                    }),
                                    O.jsx('span', { className: 'text-white/50', children: '-' }),
                                    O.jsx('span', {
                                        className: 'text-hal-warning-500',
                                        children: 'TEST',
                                    }),
                                ],
                            }),
                        ],
                    }),
                    O.jsxs('div', {
                        className: 'flex items-center gap-4',
                        children: [
                            O.jsx('button', {
                                onClick: s,
                                className:
                                    'text-white/60 hover:text-white text-[10px] uppercase tracking-wider transition-colors cursor-pointer',
                                children: n.language.startsWith('es') ? 'EN' : 'ES',
                            }),
                            O.jsx('div', {
                                className: 'text-white/40 text-[10px] uppercase',
                                children: t('nav.status'),
                            }),
                        ],
                    }),
                ],
            }),
            O.jsxs('div', {
                ref: e,
                className: 'relative h-[400vh]',
                children: [
                    O.jsxs('div', {
                        className: 'fixed inset-0 z-0 opacity-20 pointer-events-none',
                        children: [
                            O.jsx('img', {
                                src: '/video/base1.gif',
                                alt: 'Background Animation',
                                className: 'w-full h-full object-cover',
                            }),
                            O.jsx('div', {
                                className:
                                    'absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f172a_100%)]',
                            }),
                        ],
                    }),
                    O.jsx('div', {
                        className:
                            'fixed inset-0 z-0 flex items-center justify-center pointer-events-none',
                        children: O.jsx(We.img, {
                            style: { rotate: i, opacity: 0.1 },
                            src: '/images/haltest_logo.jpeg',
                            alt: 'Hal-Test Logo Watermark',
                            className:
                                'w-[50vmin] h-[50vmin] rounded-full mix-blend-overlay blur-sm',
                        }),
                    }),
                    O.jsx(CP, { scrollProgress: r }),
                    O.jsx(TP, { scrollProgress: r, t }),
                ],
            }),
            O.jsx('div', {
                className: 'fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50',
                children: [0, 1, 2, 3].map((o) =>
                    O.jsx(
                        We.div,
                        {
                            className: 'w-1 h-8 bg-white/10 rounded-full overflow-hidden',
                            children: O.jsx(We.div, {
                                className: 'w-full bg-white h-full origin-top',
                                style: { scaleY: un(r, [o * 0.25, (o + 1) * 0.25], [0, 1]) },
                            }),
                        },
                        o,
                    ),
                ),
            }),
        ],
    });
}
const { slice: LP, forEach: RP } = [];
function AP(e) {
    return (
        RP.call(LP.call(arguments, 1), (t) => {
            if (t) for (const n in t) e[n] === void 0 && (e[n] = t[n]);
        }),
        e
    );
}
function OP(e) {
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
const Kd = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/,
    DP = function (e, t) {
        const r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : { path: '/' },
            i = encodeURIComponent(t);
        let s = `${e}=${i}`;
        if (r.maxAge > 0) {
            const o = r.maxAge - 0;
            if (Number.isNaN(o)) throw new Error('maxAge should be a Number');
            s += `; Max-Age=${Math.floor(o)}`;
        }
        if (r.domain) {
            if (!Kd.test(r.domain)) throw new TypeError('option domain is invalid');
            s += `; Domain=${r.domain}`;
        }
        if (r.path) {
            if (!Kd.test(r.path)) throw new TypeError('option path is invalid');
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
    bd = {
        create(e, t, n, r) {
            let i =
                arguments.length > 4 && arguments[4] !== void 0
                    ? arguments[4]
                    : { path: '/', sameSite: 'strict' };
            (n && ((i.expires = new Date()), i.expires.setTime(i.expires.getTime() + n * 60 * 1e3)),
                r && (i.domain = r),
                (document.cookie = DP(e, t, i)));
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
var NP = {
        name: 'cookie',
        lookup(e) {
            let { lookupCookie: t } = e;
            if (t && typeof document < 'u') return bd.read(t) || void 0;
        },
        cacheUserLanguage(e, t) {
            let { lookupCookie: n, cookieMinutes: r, cookieDomain: i, cookieOptions: s } = t;
            n && typeof document < 'u' && bd.create(n, e, r, i, s);
        },
    },
    MP = {
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
    VP = {
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
let En = null;
const Gd = () => {
    if (En !== null) return En;
    try {
        if (((En = typeof window < 'u' && window.localStorage !== null), !En)) return !1;
        const e = 'i18next.translate.boo';
        (window.localStorage.setItem(e, 'foo'), window.localStorage.removeItem(e));
    } catch {
        En = !1;
    }
    return En;
};
var _P = {
    name: 'localStorage',
    lookup(e) {
        let { lookupLocalStorage: t } = e;
        if (t && Gd()) return window.localStorage.getItem(t) || void 0;
    },
    cacheUserLanguage(e, t) {
        let { lookupLocalStorage: n } = t;
        n && Gd() && window.localStorage.setItem(n, e);
    },
};
let Ln = null;
const Qd = () => {
    if (Ln !== null) return Ln;
    try {
        if (((Ln = typeof window < 'u' && window.sessionStorage !== null), !Ln)) return !1;
        const e = 'i18next.translate.boo';
        (window.sessionStorage.setItem(e, 'foo'), window.sessionStorage.removeItem(e));
    } catch {
        Ln = !1;
    }
    return Ln;
};
var jP = {
        name: 'sessionStorage',
        lookup(e) {
            let { lookupSessionStorage: t } = e;
            if (t && Qd()) return window.sessionStorage.getItem(t) || void 0;
        },
        cacheUserLanguage(e, t) {
            let { lookupSessionStorage: n } = t;
            n && Qd() && window.sessionStorage.setItem(n, e);
        },
    },
    FP = {
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
    IP = {
        name: 'htmlTag',
        lookup(e) {
            let { htmlTag: t } = e,
                n;
            const r = t || (typeof document < 'u' ? document.documentElement : null);
            return (r && typeof r.getAttribute == 'function' && (n = r.getAttribute('lang')), n);
        },
    },
    zP = {
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
    BP = {
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
let Xg = !1;
try {
    (document.cookie, (Xg = !0));
} catch {}
const Zg = ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'];
Xg || Zg.splice(1, 1);
const $P = () => ({
    order: Zg,
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    lookupSessionStorage: 'i18nextLng',
    caches: ['localStorage'],
    excludeCacheFor: ['cimode'],
    convertDetectedLanguage: (e) => e,
});
class Jg {
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
            (this.options = AP(n, this.options || {}, $P())),
            typeof this.options.convertDetectedLanguage == 'string' &&
                this.options.convertDetectedLanguage.indexOf('15897') > -1 &&
                (this.options.convertDetectedLanguage = (i) => i.replace('-', '_')),
            this.options.lookupFromUrlIndex &&
                (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
            (this.i18nOptions = r),
            this.addDetector(NP),
            this.addDetector(MP),
            this.addDetector(_P),
            this.addDetector(jP),
            this.addDetector(FP),
            this.addDetector(IP),
            this.addDetector(zP),
            this.addDetector(BP),
            this.addDetector(VP));
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
                .filter((r) => r != null && !OP(r))
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
Jg.type = 'languageDetector';
const UP = {
    en: {
        translation: {
            hero: {
                title_part1: 'hal',
                title_part2: 'Test',
                subtitle: 'Modern, visual automation framework.',
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
            },
            nav: { status: 'Status: Operating' },
            language: { en: 'English', es: 'Español' },
        },
    },
    es: {
        translation: {
            hero: {
                title_part1: 'hal',
                title_part2: 'Test',
                subtitle: 'Framework moderno de automatización visual.',
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
            },
            nav: { status: 'Estado: Operando' },
            language: { en: 'English', es: 'Español' },
        },
    },
};
Le.use(Jg)
    .use(aP)
    .init({
        resources: UP,
        fallbackLng: 'en',
        interpolation: { escapeValue: !1 },
        detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    });
la.createRoot(document.getElementById('root')).render(
    O.jsx(my.StrictMode, { children: O.jsx(EP, {}) }),
);
