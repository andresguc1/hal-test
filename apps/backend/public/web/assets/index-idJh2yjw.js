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
function Jm(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
}
var sd = { exports: {} },
    Rs = {},
    od = { exports: {} },
    j = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var ei = Symbol.for('react.element'),
    bm = Symbol.for('react.portal'),
    eg = Symbol.for('react.fragment'),
    tg = Symbol.for('react.strict_mode'),
    ng = Symbol.for('react.profiler'),
    rg = Symbol.for('react.provider'),
    ig = Symbol.for('react.context'),
    sg = Symbol.for('react.forward_ref'),
    og = Symbol.for('react.suspense'),
    lg = Symbol.for('react.memo'),
    ag = Symbol.for('react.lazy'),
    Eu = Symbol.iterator;
function ug(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = (Eu && e[Eu]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var ld = {
        isMounted: function () {
            return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
    },
    ad = Object.assign,
    ud = {};
function Yn(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = ud), (this.updater = n || ld));
}
Yn.prototype.isReactComponent = {};
Yn.prototype.setState = function (e, t) {
    if (typeof e != 'object' && typeof e != 'function' && e != null)
        throw Error(
            'setState(...): takes an object of state variables to update or a function which returns an object of state variables.',
        );
    this.updater.enqueueSetState(this, e, t, 'setState');
};
Yn.prototype.forceUpdate = function (e) {
    this.updater.enqueueForceUpdate(this, e, 'forceUpdate');
};
function cd() {}
cd.prototype = Yn.prototype;
function ql(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = ud), (this.updater = n || ld));
}
var Jl = (ql.prototype = new cd());
Jl.constructor = ql;
ad(Jl, Yn.prototype);
Jl.isPureReactComponent = !0;
var Au = Array.isArray,
    fd = Object.prototype.hasOwnProperty,
    bl = { current: null },
    dd = { key: !0, ref: !0, __self: !0, __source: !0 };
function hd(e, t, n) {
    var r,
        i = {},
        s = null,
        o = null;
    if (t != null)
        for (r in (t.ref !== void 0 && (o = t.ref), t.key !== void 0 && (s = '' + t.key), t))
            fd.call(t, r) && !dd.hasOwnProperty(r) && (i[r] = t[r]);
    var l = arguments.length - 2;
    if (l === 1) i.children = n;
    else if (1 < l) {
        for (var a = Array(l), u = 0; u < l; u++) a[u] = arguments[u + 2];
        i.children = a;
    }
    if (e && e.defaultProps) for (r in ((l = e.defaultProps), l)) i[r] === void 0 && (i[r] = l[r]);
    return { $$typeof: ei, type: e, key: s, ref: o, props: i, _owner: bl.current };
}
function cg(e, t) {
    return { $$typeof: ei, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function ea(e) {
    return typeof e == 'object' && e !== null && e.$$typeof === ei;
}
function fg(e) {
    var t = { '=': '=0', ':': '=2' };
    return (
        '$' +
        e.replace(/[=:]/g, function (n) {
            return t[n];
        })
    );
}
var Mu = /\/+/g;
function bs(e, t) {
    return typeof e == 'object' && e !== null && e.key != null ? fg('' + e.key) : t.toString(36);
}
function ji(e, t, n, r, i) {
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
                    case ei:
                    case bm:
                        o = !0;
                }
        }
    if (o)
        return (
            (o = e),
            (i = i(o)),
            (e = r === '' ? '.' + bs(o, 0) : r),
            Au(i)
                ? ((n = ''),
                  e != null && (n = e.replace(Mu, '$&/') + '/'),
                  ji(i, t, n, '', function (u) {
                      return u;
                  }))
                : i != null &&
                  (ea(i) &&
                      (i = cg(
                          i,
                          n +
                              (!i.key || (o && o.key === i.key)
                                  ? ''
                                  : ('' + i.key).replace(Mu, '$&/') + '/') +
                              e,
                      )),
                  t.push(i)),
            1
        );
    if (((o = 0), (r = r === '' ? '.' : r + ':'), Au(e)))
        for (var l = 0; l < e.length; l++) {
            s = e[l];
            var a = r + bs(s, l);
            o += ji(s, t, n, a, i);
        }
    else if (((a = ug(e)), typeof a == 'function'))
        for (e = a.call(e), l = 0; !(s = e.next()).done; )
            ((s = s.value), (a = r + bs(s, l++)), (o += ji(s, t, n, a, i)));
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
function pi(e, t, n) {
    if (e == null) return e;
    var r = [],
        i = 0;
    return (
        ji(e, r, '', '', function (s) {
            return t.call(n, s, i++);
        }),
        r
    );
}
function dg(e) {
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
var we = { current: null },
    Oi = { transition: null },
    hg = { ReactCurrentDispatcher: we, ReactCurrentBatchConfig: Oi, ReactCurrentOwner: bl };
function pd() {
    throw Error('act(...) is not supported in production builds of React.');
}
j.Children = {
    map: pi,
    forEach: function (e, t, n) {
        pi(
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
            pi(e, function () {
                t++;
            }),
            t
        );
    },
    toArray: function (e) {
        return (
            pi(e, function (t) {
                return t;
            }) || []
        );
    },
    only: function (e) {
        if (!ea(e))
            throw Error('React.Children.only expected to receive a single React element child.');
        return e;
    },
};
j.Component = Yn;
j.Fragment = eg;
j.Profiler = ng;
j.PureComponent = ql;
j.StrictMode = tg;
j.Suspense = og;
j.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = hg;
j.act = pd;
j.cloneElement = function (e, t, n) {
    if (e == null)
        throw Error(
            'React.cloneElement(...): The argument must be a React element, but you passed ' +
                e +
                '.',
        );
    var r = ad({}, e.props),
        i = e.key,
        s = e.ref,
        o = e._owner;
    if (t != null) {
        if (
            (t.ref !== void 0 && ((s = t.ref), (o = bl.current)),
            t.key !== void 0 && (i = '' + t.key),
            e.type && e.type.defaultProps)
        )
            var l = e.type.defaultProps;
        for (a in t)
            fd.call(t, a) &&
                !dd.hasOwnProperty(a) &&
                (r[a] = t[a] === void 0 && l !== void 0 ? l[a] : t[a]);
    }
    var a = arguments.length - 2;
    if (a === 1) r.children = n;
    else if (1 < a) {
        l = Array(a);
        for (var u = 0; u < a; u++) l[u] = arguments[u + 2];
        r.children = l;
    }
    return { $$typeof: ei, type: e.type, key: i, ref: s, props: r, _owner: o };
};
j.createContext = function (e) {
    return (
        (e = {
            $$typeof: ig,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
            _defaultValue: null,
            _globalName: null,
        }),
        (e.Provider = { $$typeof: rg, _context: e }),
        (e.Consumer = e)
    );
};
j.createElement = hd;
j.createFactory = function (e) {
    var t = hd.bind(null, e);
    return ((t.type = e), t);
};
j.createRef = function () {
    return { current: null };
};
j.forwardRef = function (e) {
    return { $$typeof: sg, render: e };
};
j.isValidElement = ea;
j.lazy = function (e) {
    return { $$typeof: ag, _payload: { _status: -1, _result: e }, _init: dg };
};
j.memo = function (e, t) {
    return { $$typeof: lg, type: e, compare: t === void 0 ? null : t };
};
j.startTransition = function (e) {
    var t = Oi.transition;
    Oi.transition = {};
    try {
        e();
    } finally {
        Oi.transition = t;
    }
};
j.unstable_act = pd;
j.useCallback = function (e, t) {
    return we.current.useCallback(e, t);
};
j.useContext = function (e) {
    return we.current.useContext(e);
};
j.useDebugValue = function () {};
j.useDeferredValue = function (e) {
    return we.current.useDeferredValue(e);
};
j.useEffect = function (e, t) {
    return we.current.useEffect(e, t);
};
j.useId = function () {
    return we.current.useId();
};
j.useImperativeHandle = function (e, t, n) {
    return we.current.useImperativeHandle(e, t, n);
};
j.useInsertionEffect = function (e, t) {
    return we.current.useInsertionEffect(e, t);
};
j.useLayoutEffect = function (e, t) {
    return we.current.useLayoutEffect(e, t);
};
j.useMemo = function (e, t) {
    return we.current.useMemo(e, t);
};
j.useReducer = function (e, t, n) {
    return we.current.useReducer(e, t, n);
};
j.useRef = function (e) {
    return we.current.useRef(e);
};
j.useState = function (e) {
    return we.current.useState(e);
};
j.useSyncExternalStore = function (e, t, n) {
    return we.current.useSyncExternalStore(e, t, n);
};
j.useTransition = function () {
    return we.current.useTransition();
};
j.version = '18.3.1';
od.exports = j;
var C = od.exports;
const pg = Jm(C);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var mg = C,
    gg = Symbol.for('react.element'),
    yg = Symbol.for('react.fragment'),
    vg = Object.prototype.hasOwnProperty,
    wg = mg.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    xg = { key: !0, ref: !0, __self: !0, __source: !0 };
function md(e, t, n) {
    var r,
        i = {},
        s = null,
        o = null;
    (n !== void 0 && (s = '' + n),
        t.key !== void 0 && (s = '' + t.key),
        t.ref !== void 0 && (o = t.ref));
    for (r in t) vg.call(t, r) && !xg.hasOwnProperty(r) && (i[r] = t[r]);
    if (e && e.defaultProps) for (r in ((t = e.defaultProps), t)) i[r] === void 0 && (i[r] = t[r]);
    return { $$typeof: gg, type: e, key: s, ref: o, props: i, _owner: wg.current };
}
Rs.Fragment = yg;
Rs.jsx = md;
Rs.jsxs = md;
sd.exports = Rs;
var R = sd.exports,
    Uo = {},
    gd = { exports: {} },
    Le = {},
    yd = { exports: {} },
    vd = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
    function t(A, V) {
        var _ = A.length;
        A.push(V);
        e: for (; 0 < _; ) {
            var X = (_ - 1) >>> 1,
                ie = A[X];
            if (0 < i(ie, V)) ((A[X] = V), (A[_] = ie), (_ = X));
            else break e;
        }
    }
    function n(A) {
        return A.length === 0 ? null : A[0];
    }
    function r(A) {
        if (A.length === 0) return null;
        var V = A[0],
            _ = A.pop();
        if (_ !== V) {
            A[0] = _;
            e: for (var X = 0, ie = A.length, di = ie >>> 1; X < di; ) {
                var Ht = 2 * (X + 1) - 1,
                    Js = A[Ht],
                    Kt = Ht + 1,
                    hi = A[Kt];
                if (0 > i(Js, _))
                    Kt < ie && 0 > i(hi, Js)
                        ? ((A[X] = hi), (A[Kt] = _), (X = Kt))
                        : ((A[X] = Js), (A[Ht] = _), (X = Ht));
                else if (Kt < ie && 0 > i(hi, _)) ((A[X] = hi), (A[Kt] = _), (X = Kt));
                else break e;
            }
        }
        return V;
    }
    function i(A, V) {
        var _ = A.sortIndex - V.sortIndex;
        return _ !== 0 ? _ : A.id - V.id;
    }
    if (typeof performance == 'object' && typeof performance.now == 'function') {
        var s = performance;
        e.unstable_now = function () {
            return s.now();
        };
    } else {
        var o = Date,
            l = o.now();
        e.unstable_now = function () {
            return o.now() - l;
        };
    }
    var a = [],
        u = [],
        c = 1,
        f = null,
        d = 3,
        g = !1,
        y = !1,
        v = !1,
        S = typeof setTimeout == 'function' ? setTimeout : null,
        p = typeof clearTimeout == 'function' ? clearTimeout : null,
        h = typeof setImmediate < 'u' ? setImmediate : null;
    typeof navigator < 'u' &&
        navigator.scheduling !== void 0 &&
        navigator.scheduling.isInputPending !== void 0 &&
        navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function m(A) {
        for (var V = n(u); V !== null; ) {
            if (V.callback === null) r(u);
            else if (V.startTime <= A) (r(u), (V.sortIndex = V.expirationTime), t(a, V));
            else break;
            V = n(u);
        }
    }
    function w(A) {
        if (((v = !1), m(A), !y))
            if (n(a) !== null) ((y = !0), fi(x));
            else {
                var V = n(u);
                V !== null && b(w, V.startTime - A);
            }
    }
    function x(A, V) {
        ((y = !1), v && ((v = !1), p(T), (T = -1)), (g = !0));
        var _ = d;
        try {
            for (m(V), f = n(a); f !== null && (!(f.expirationTime > V) || (A && !re())); ) {
                var X = f.callback;
                if (typeof X == 'function') {
                    ((f.callback = null), (d = f.priorityLevel));
                    var ie = X(f.expirationTime <= V);
                    ((V = e.unstable_now()),
                        typeof ie == 'function' ? (f.callback = ie) : f === n(a) && r(a),
                        m(V));
                } else r(a);
                f = n(a);
            }
            if (f !== null) var di = !0;
            else {
                var Ht = n(u);
                (Ht !== null && b(w, Ht.startTime - V), (di = !1));
            }
            return di;
        } finally {
            ((f = null), (d = _), (g = !1));
        }
    }
    var k = !1,
        E = null,
        T = -1,
        N = 5,
        L = -1;
    function re() {
        return !(e.unstable_now() - L < N);
    }
    function vt() {
        if (E !== null) {
            var A = e.unstable_now();
            L = A;
            var V = !0;
            try {
                V = E(!0, A);
            } finally {
                V ? $t() : ((k = !1), (E = null));
            }
        } else k = !1;
    }
    var $t;
    if (typeof h == 'function')
        $t = function () {
            h(vt);
        };
    else if (typeof MessageChannel < 'u') {
        var er = new MessageChannel(),
            Cu = er.port2;
        ((er.port1.onmessage = vt),
            ($t = function () {
                Cu.postMessage(null);
            }));
    } else
        $t = function () {
            S(vt, 0);
        };
    function fi(A) {
        ((E = A), k || ((k = !0), $t()));
    }
    function b(A, V) {
        T = S(function () {
            A(e.unstable_now());
        }, V);
    }
    ((e.unstable_IdlePriority = 5),
        (e.unstable_ImmediatePriority = 1),
        (e.unstable_LowPriority = 4),
        (e.unstable_NormalPriority = 3),
        (e.unstable_Profiling = null),
        (e.unstable_UserBlockingPriority = 2),
        (e.unstable_cancelCallback = function (A) {
            A.callback = null;
        }),
        (e.unstable_continueExecution = function () {
            y || g || ((y = !0), fi(x));
        }),
        (e.unstable_forceFrameRate = function (A) {
            0 > A || 125 < A
                ? console.error(
                      'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported',
                  )
                : (N = 0 < A ? Math.floor(1e3 / A) : 5);
        }),
        (e.unstable_getCurrentPriorityLevel = function () {
            return d;
        }),
        (e.unstable_getFirstCallbackNode = function () {
            return n(a);
        }),
        (e.unstable_next = function (A) {
            switch (d) {
                case 1:
                case 2:
                case 3:
                    var V = 3;
                    break;
                default:
                    V = d;
            }
            var _ = d;
            d = V;
            try {
                return A();
            } finally {
                d = _;
            }
        }),
        (e.unstable_pauseExecution = function () {}),
        (e.unstable_requestPaint = function () {}),
        (e.unstable_runWithPriority = function (A, V) {
            switch (A) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    break;
                default:
                    A = 3;
            }
            var _ = d;
            d = A;
            try {
                return V();
            } finally {
                d = _;
            }
        }),
        (e.unstable_scheduleCallback = function (A, V, _) {
            var X = e.unstable_now();
            switch (
                (typeof _ == 'object' && _ !== null
                    ? ((_ = _.delay), (_ = typeof _ == 'number' && 0 < _ ? X + _ : X))
                    : (_ = X),
                A)
            ) {
                case 1:
                    var ie = -1;
                    break;
                case 2:
                    ie = 250;
                    break;
                case 5:
                    ie = 1073741823;
                    break;
                case 4:
                    ie = 1e4;
                    break;
                default:
                    ie = 5e3;
            }
            return (
                (ie = _ + ie),
                (A = {
                    id: c++,
                    callback: V,
                    priorityLevel: A,
                    startTime: _,
                    expirationTime: ie,
                    sortIndex: -1,
                }),
                _ > X
                    ? ((A.sortIndex = _),
                      t(u, A),
                      n(a) === null && A === n(u) && (v ? (p(T), (T = -1)) : (v = !0), b(w, _ - X)))
                    : ((A.sortIndex = ie), t(a, A), y || g || ((y = !0), fi(x))),
                A
            );
        }),
        (e.unstable_shouldYield = re),
        (e.unstable_wrapCallback = function (A) {
            var V = d;
            return function () {
                var _ = d;
                d = V;
                try {
                    return A.apply(this, arguments);
                } finally {
                    d = _;
                }
            };
        }));
})(vd);
yd.exports = vd;
var Sg = yd.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Tg = C,
    Re = Sg;
function P(e) {
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
var wd = new Set(),
    _r = {};
function dn(e, t) {
    (zn(e, t), zn(e + 'Capture', t));
}
function zn(e, t) {
    for (_r[e] = t, e = 0; e < t.length; e++) wd.add(t[e]);
}
var ht = !(
        typeof window > 'u' ||
        typeof window.document > 'u' ||
        typeof window.document.createElement > 'u'
    ),
    Wo = Object.prototype.hasOwnProperty,
    Pg =
        /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
    Ru = {},
    Du = {};
function kg(e) {
    return Wo.call(Du, e)
        ? !0
        : Wo.call(Ru, e)
          ? !1
          : Pg.test(e)
            ? (Du[e] = !0)
            : ((Ru[e] = !0), !1);
}
function Cg(e, t, n, r) {
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
function Eg(e, t, n, r) {
    if (t === null || typeof t > 'u' || Cg(e, t, n, r)) return !0;
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
function xe(e, t, n, r, i, s, o) {
    ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
        (this.attributeName = r),
        (this.attributeNamespace = i),
        (this.mustUseProperty = n),
        (this.propertyName = e),
        (this.type = t),
        (this.sanitizeURL = s),
        (this.removeEmptyString = o));
}
var ce = {};
'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
    .split(' ')
    .forEach(function (e) {
        ce[e] = new xe(e, 0, !1, e, null, !1, !1);
    });
[
    ['acceptCharset', 'accept-charset'],
    ['className', 'class'],
    ['htmlFor', 'for'],
    ['httpEquiv', 'http-equiv'],
].forEach(function (e) {
    var t = e[0];
    ce[t] = new xe(t, 1, !1, e[1], null, !1, !1);
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
    ce[e] = new xe(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (e) {
    ce[e] = new xe(e, 2, !1, e, null, !1, !1);
});
'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
    .split(' ')
    .forEach(function (e) {
        ce[e] = new xe(e, 3, !1, e.toLowerCase(), null, !1, !1);
    });
['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
    ce[e] = new xe(e, 3, !0, e, null, !1, !1);
});
['capture', 'download'].forEach(function (e) {
    ce[e] = new xe(e, 4, !1, e, null, !1, !1);
});
['cols', 'rows', 'size', 'span'].forEach(function (e) {
    ce[e] = new xe(e, 6, !1, e, null, !1, !1);
});
['rowSpan', 'start'].forEach(function (e) {
    ce[e] = new xe(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var ta = /[\-:]([a-z])/g;
function na(e) {
    return e[1].toUpperCase();
}
'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(ta, na);
        ce[t] = new xe(t, 1, !1, e, null, !1, !1);
    });
'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(ta, na);
        ce[t] = new xe(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
    });
['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
    var t = e.replace(ta, na);
    ce[t] = new xe(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
});
['tabIndex', 'crossOrigin'].forEach(function (e) {
    ce[e] = new xe(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
ce.xlinkHref = new xe('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1);
['src', 'href', 'action', 'formAction'].forEach(function (e) {
    ce[e] = new xe(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function ra(e, t, n, r) {
    var i = ce.hasOwnProperty(t) ? ce[t] : null;
    (i !== null
        ? i.type !== 0
        : r ||
          !(2 < t.length) ||
          (t[0] !== 'o' && t[0] !== 'O') ||
          (t[1] !== 'n' && t[1] !== 'N')) &&
        (Eg(t, n, i, r) && (n = null),
        r || i === null
            ? kg(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, '' + n))
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
var yt = Tg.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    mi = Symbol.for('react.element'),
    gn = Symbol.for('react.portal'),
    yn = Symbol.for('react.fragment'),
    ia = Symbol.for('react.strict_mode'),
    $o = Symbol.for('react.profiler'),
    xd = Symbol.for('react.provider'),
    Sd = Symbol.for('react.context'),
    sa = Symbol.for('react.forward_ref'),
    Ho = Symbol.for('react.suspense'),
    Ko = Symbol.for('react.suspense_list'),
    oa = Symbol.for('react.memo'),
    Tt = Symbol.for('react.lazy'),
    Td = Symbol.for('react.offscreen'),
    Lu = Symbol.iterator;
function tr(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = (Lu && e[Lu]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var G = Object.assign,
    eo;
function fr(e) {
    if (eo === void 0)
        try {
            throw Error();
        } catch (n) {
            var t = n.stack.trim().match(/\n( *(at )?)/);
            eo = (t && t[1]) || '';
        }
    return (
        `
` +
        eo +
        e
    );
}
var to = !1;
function no(e, t) {
    if (!e || to) return '';
    to = !0;
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
                    l = s.length - 1;
                1 <= o && 0 <= l && i[o] !== s[l];
            )
                l--;
            for (; 1 <= o && 0 <= l; o--, l--)
                if (i[o] !== s[l]) {
                    if (o !== 1 || l !== 1)
                        do
                            if ((o--, l--, 0 > l || i[o] !== s[l])) {
                                var a =
                                    `
` + i[o].replace(' at new ', ' at ');
                                return (
                                    e.displayName &&
                                        a.includes('<anonymous>') &&
                                        (a = a.replace('<anonymous>', e.displayName)),
                                    a
                                );
                            }
                        while (1 <= o && 0 <= l);
                    break;
                }
        }
    } finally {
        ((to = !1), (Error.prepareStackTrace = n));
    }
    return (e = e ? e.displayName || e.name : '') ? fr(e) : '';
}
function Ag(e) {
    switch (e.tag) {
        case 5:
            return fr(e.type);
        case 16:
            return fr('Lazy');
        case 13:
            return fr('Suspense');
        case 19:
            return fr('SuspenseList');
        case 0:
        case 2:
        case 15:
            return ((e = no(e.type, !1)), e);
        case 11:
            return ((e = no(e.type.render, !1)), e);
        case 1:
            return ((e = no(e.type, !0)), e);
        default:
            return '';
    }
}
function Go(e) {
    if (e == null) return null;
    if (typeof e == 'function') return e.displayName || e.name || null;
    if (typeof e == 'string') return e;
    switch (e) {
        case yn:
            return 'Fragment';
        case gn:
            return 'Portal';
        case $o:
            return 'Profiler';
        case ia:
            return 'StrictMode';
        case Ho:
            return 'Suspense';
        case Ko:
            return 'SuspenseList';
    }
    if (typeof e == 'object')
        switch (e.$$typeof) {
            case Sd:
                return (e.displayName || 'Context') + '.Consumer';
            case xd:
                return (e._context.displayName || 'Context') + '.Provider';
            case sa:
                var t = e.render;
                return (
                    (e = e.displayName),
                    e ||
                        ((e = t.displayName || t.name || ''),
                        (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
                    e
                );
            case oa:
                return ((t = e.displayName || null), t !== null ? t : Go(e.type) || 'Memo');
            case Tt:
                ((t = e._payload), (e = e._init));
                try {
                    return Go(e(t));
                } catch {}
        }
    return null;
}
function Mg(e) {
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
            return Go(t);
        case 8:
            return t === ia ? 'StrictMode' : 'Mode';
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
function Ot(e) {
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
function Pd(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio');
}
function Rg(e) {
    var t = Pd(e) ? 'checked' : 'value',
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
function gi(e) {
    e._valueTracker || (e._valueTracker = Rg(e));
}
function kd(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var n = t.getValue(),
        r = '';
    return (
        e && (r = Pd(e) ? (e.checked ? 'true' : 'false') : e.value),
        (e = r),
        e !== n ? (t.setValue(e), !0) : !1
    );
}
function Ji(e) {
    if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
    try {
        return e.activeElement || e.body;
    } catch {
        return e.body;
    }
}
function Qo(e, t) {
    var n = t.checked;
    return G({}, t, {
        defaultChecked: void 0,
        defaultValue: void 0,
        value: void 0,
        checked: n ?? e._wrapperState.initialChecked,
    });
}
function Vu(e, t) {
    var n = t.defaultValue == null ? '' : t.defaultValue,
        r = t.checked != null ? t.checked : t.defaultChecked;
    ((n = Ot(t.value != null ? t.value : n)),
        (e._wrapperState = {
            initialChecked: r,
            initialValue: n,
            controlled:
                t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
        }));
}
function Cd(e, t) {
    ((t = t.checked), t != null && ra(e, 'checked', t, !1));
}
function Yo(e, t) {
    Cd(e, t);
    var n = Ot(t.value),
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
        ? Xo(e, t.type, n)
        : t.hasOwnProperty('defaultValue') && Xo(e, t.type, Ot(t.defaultValue)),
        t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked));
}
function _u(e, t, n) {
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
function Xo(e, t, n) {
    (t !== 'number' || Ji(e.ownerDocument) !== e) &&
        (n == null
            ? (e.defaultValue = '' + e._wrapperState.initialValue)
            : e.defaultValue !== '' + n && (e.defaultValue = '' + n));
}
var dr = Array.isArray;
function _n(e, t, n, r) {
    if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t['$' + n[i]] = !0;
        for (n = 0; n < e.length; n++)
            ((i = t.hasOwnProperty('$' + e[n].value)),
                e[n].selected !== i && (e[n].selected = i),
                i && r && (e[n].defaultSelected = !0));
    } else {
        for (n = '' + Ot(n), t = null, i = 0; i < e.length; i++) {
            if (e[i].value === n) {
                ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
                return;
            }
            t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
    }
}
function Zo(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(P(91));
    return G({}, t, {
        value: void 0,
        defaultValue: void 0,
        children: '' + e._wrapperState.initialValue,
    });
}
function Nu(e, t) {
    var n = t.value;
    if (n == null) {
        if (((n = t.children), (t = t.defaultValue), n != null)) {
            if (t != null) throw Error(P(92));
            if (dr(n)) {
                if (1 < n.length) throw Error(P(93));
                n = n[0];
            }
            t = n;
        }
        (t == null && (t = ''), (n = t));
    }
    e._wrapperState = { initialValue: Ot(n) };
}
function Ed(e, t) {
    var n = Ot(t.value),
        r = Ot(t.defaultValue);
    (n != null &&
        ((n = '' + n),
        n !== e.value && (e.value = n),
        t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
        r != null && (e.defaultValue = '' + r));
}
function ju(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
}
function Ad(e) {
    switch (e) {
        case 'svg':
            return 'http://www.w3.org/2000/svg';
        case 'math':
            return 'http://www.w3.org/1998/Math/MathML';
        default:
            return 'http://www.w3.org/1999/xhtml';
    }
}
function qo(e, t) {
    return e == null || e === 'http://www.w3.org/1999/xhtml'
        ? Ad(t)
        : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
          ? 'http://www.w3.org/1999/xhtml'
          : e;
}
var yi,
    Md = (function (e) {
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
                yi = yi || document.createElement('div'),
                    yi.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>',
                    t = yi.firstChild;
                e.firstChild;
            )
                e.removeChild(e.firstChild);
            for (; t.firstChild; ) e.appendChild(t.firstChild);
        }
    });
function Nr(e, t) {
    if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
            n.nodeValue = t;
            return;
        }
    }
    e.textContent = t;
}
var vr = {
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
    Dg = ['Webkit', 'ms', 'Moz', 'O'];
Object.keys(vr).forEach(function (e) {
    Dg.forEach(function (t) {
        ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (vr[t] = vr[e]));
    });
});
function Rd(e, t, n) {
    return t == null || typeof t == 'boolean' || t === ''
        ? ''
        : n || typeof t != 'number' || t === 0 || (vr.hasOwnProperty(e) && vr[e])
          ? ('' + t).trim()
          : t + 'px';
}
function Dd(e, t) {
    e = e.style;
    for (var n in t)
        if (t.hasOwnProperty(n)) {
            var r = n.indexOf('--') === 0,
                i = Rd(n, t[n], r);
            (n === 'float' && (n = 'cssFloat'), r ? e.setProperty(n, i) : (e[n] = i));
        }
}
var Lg = G(
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
function Jo(e, t) {
    if (t) {
        if (Lg[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
            throw Error(P(137, e));
        if (t.dangerouslySetInnerHTML != null) {
            if (t.children != null) throw Error(P(60));
            if (
                typeof t.dangerouslySetInnerHTML != 'object' ||
                !('__html' in t.dangerouslySetInnerHTML)
            )
                throw Error(P(61));
        }
        if (t.style != null && typeof t.style != 'object') throw Error(P(62));
    }
}
function bo(e, t) {
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
var el = null;
function la(e) {
    return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    );
}
var tl = null,
    Nn = null,
    jn = null;
function Ou(e) {
    if ((e = ri(e))) {
        if (typeof tl != 'function') throw Error(P(280));
        var t = e.stateNode;
        t && ((t = Ns(t)), tl(e.stateNode, e.type, t));
    }
}
function Ld(e) {
    Nn ? (jn ? jn.push(e) : (jn = [e])) : (Nn = e);
}
function Vd() {
    if (Nn) {
        var e = Nn,
            t = jn;
        if (((jn = Nn = null), Ou(e), t)) for (e = 0; e < t.length; e++) Ou(t[e]);
    }
}
function _d(e, t) {
    return e(t);
}
function Nd() {}
var ro = !1;
function jd(e, t, n) {
    if (ro) return e(t, n);
    ro = !0;
    try {
        return _d(e, t, n);
    } finally {
        ((ro = !1), (Nn !== null || jn !== null) && (Nd(), Vd()));
    }
}
function jr(e, t) {
    var n = e.stateNode;
    if (n === null) return null;
    var r = Ns(n);
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
    if (n && typeof n != 'function') throw Error(P(231, t, typeof n));
    return n;
}
var nl = !1;
if (ht)
    try {
        var nr = {};
        (Object.defineProperty(nr, 'passive', {
            get: function () {
                nl = !0;
            },
        }),
            window.addEventListener('test', nr, nr),
            window.removeEventListener('test', nr, nr));
    } catch {
        nl = !1;
    }
function Vg(e, t, n, r, i, s, o, l, a) {
    var u = Array.prototype.slice.call(arguments, 3);
    try {
        t.apply(n, u);
    } catch (c) {
        this.onError(c);
    }
}
var wr = !1,
    bi = null,
    es = !1,
    rl = null,
    _g = {
        onError: function (e) {
            ((wr = !0), (bi = e));
        },
    };
function Ng(e, t, n, r, i, s, o, l, a) {
    ((wr = !1), (bi = null), Vg.apply(_g, arguments));
}
function jg(e, t, n, r, i, s, o, l, a) {
    if ((Ng.apply(this, arguments), wr)) {
        if (wr) {
            var u = bi;
            ((wr = !1), (bi = null));
        } else throw Error(P(198));
        es || ((es = !0), (rl = u));
    }
}
function hn(e) {
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
function Od(e) {
    if (e.tag === 13) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
            return t.dehydrated;
    }
    return null;
}
function Fu(e) {
    if (hn(e) !== e) throw Error(P(188));
}
function Og(e) {
    var t = e.alternate;
    if (!t) {
        if (((t = hn(e)), t === null)) throw Error(P(188));
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
                if (s === n) return (Fu(i), e);
                if (s === r) return (Fu(i), t);
                s = s.sibling;
            }
            throw Error(P(188));
        }
        if (n.return !== r.return) ((n = i), (r = s));
        else {
            for (var o = !1, l = i.child; l; ) {
                if (l === n) {
                    ((o = !0), (n = i), (r = s));
                    break;
                }
                if (l === r) {
                    ((o = !0), (r = i), (n = s));
                    break;
                }
                l = l.sibling;
            }
            if (!o) {
                for (l = s.child; l; ) {
                    if (l === n) {
                        ((o = !0), (n = s), (r = i));
                        break;
                    }
                    if (l === r) {
                        ((o = !0), (r = s), (n = i));
                        break;
                    }
                    l = l.sibling;
                }
                if (!o) throw Error(P(189));
            }
        }
        if (n.alternate !== r) throw Error(P(190));
    }
    if (n.tag !== 3) throw Error(P(188));
    return n.stateNode.current === n ? e : t;
}
function Fd(e) {
    return ((e = Og(e)), e !== null ? Id(e) : null);
}
function Id(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
        var t = Id(e);
        if (t !== null) return t;
        e = e.sibling;
    }
    return null;
}
var zd = Re.unstable_scheduleCallback,
    Iu = Re.unstable_cancelCallback,
    Fg = Re.unstable_shouldYield,
    Ig = Re.unstable_requestPaint,
    q = Re.unstable_now,
    zg = Re.unstable_getCurrentPriorityLevel,
    aa = Re.unstable_ImmediatePriority,
    Bd = Re.unstable_UserBlockingPriority,
    ts = Re.unstable_NormalPriority,
    Bg = Re.unstable_LowPriority,
    Ud = Re.unstable_IdlePriority,
    Ds = null,
    tt = null;
function Ug(e) {
    if (tt && typeof tt.onCommitFiberRoot == 'function')
        try {
            tt.onCommitFiberRoot(Ds, e, void 0, (e.current.flags & 128) === 128);
        } catch {}
}
var Qe = Math.clz32 ? Math.clz32 : Hg,
    Wg = Math.log,
    $g = Math.LN2;
function Hg(e) {
    return ((e >>>= 0), e === 0 ? 32 : (31 - ((Wg(e) / $g) | 0)) | 0);
}
var vi = 64,
    wi = 4194304;
function hr(e) {
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
function ns(e, t) {
    var n = e.pendingLanes;
    if (n === 0) return 0;
    var r = 0,
        i = e.suspendedLanes,
        s = e.pingedLanes,
        o = n & 268435455;
    if (o !== 0) {
        var l = o & ~i;
        l !== 0 ? (r = hr(l)) : ((s &= o), s !== 0 && (r = hr(s)));
    } else ((o = n & ~i), o !== 0 ? (r = hr(o)) : s !== 0 && (r = hr(s)));
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
            ((n = 31 - Qe(t)), (i = 1 << n), (r |= e[n]), (t &= ~i));
    return r;
}
function Kg(e, t) {
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
function Gg(e, t) {
    for (
        var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, s = e.pendingLanes;
        0 < s;
    ) {
        var o = 31 - Qe(s),
            l = 1 << o,
            a = i[o];
        (a === -1 ? (!(l & n) || l & r) && (i[o] = Kg(l, t)) : a <= t && (e.expiredLanes |= l),
            (s &= ~l));
    }
}
function il(e) {
    return ((e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0);
}
function Wd() {
    var e = vi;
    return ((vi <<= 1), !(vi & 4194240) && (vi = 64), e);
}
function io(e) {
    for (var t = [], n = 0; 31 > n; n++) t.push(e);
    return t;
}
function ti(e, t, n) {
    ((e.pendingLanes |= t),
        t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
        (e = e.eventTimes),
        (t = 31 - Qe(t)),
        (e[t] = n));
}
function Qg(e, t) {
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
        var i = 31 - Qe(n),
            s = 1 << i;
        ((t[i] = 0), (r[i] = -1), (e[i] = -1), (n &= ~s));
    }
}
function ua(e, t) {
    var n = (e.entangledLanes |= t);
    for (e = e.entanglements; n; ) {
        var r = 31 - Qe(n),
            i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
    }
}
var I = 0;
function $d(e) {
    return ((e &= -e), 1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1);
}
var Hd,
    ca,
    Kd,
    Gd,
    Qd,
    sl = !1,
    xi = [],
    Mt = null,
    Rt = null,
    Dt = null,
    Or = new Map(),
    Fr = new Map(),
    kt = [],
    Yg =
        'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
            ' ',
        );
function zu(e, t) {
    switch (e) {
        case 'focusin':
        case 'focusout':
            Mt = null;
            break;
        case 'dragenter':
        case 'dragleave':
            Rt = null;
            break;
        case 'mouseover':
        case 'mouseout':
            Dt = null;
            break;
        case 'pointerover':
        case 'pointerout':
            Or.delete(t.pointerId);
            break;
        case 'gotpointercapture':
        case 'lostpointercapture':
            Fr.delete(t.pointerId);
    }
}
function rr(e, t, n, r, i, s) {
    return e === null || e.nativeEvent !== s
        ? ((e = {
              blockedOn: t,
              domEventName: n,
              eventSystemFlags: r,
              nativeEvent: s,
              targetContainers: [i],
          }),
          t !== null && ((t = ri(t)), t !== null && ca(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
}
function Xg(e, t, n, r, i) {
    switch (t) {
        case 'focusin':
            return ((Mt = rr(Mt, e, t, n, r, i)), !0);
        case 'dragenter':
            return ((Rt = rr(Rt, e, t, n, r, i)), !0);
        case 'mouseover':
            return ((Dt = rr(Dt, e, t, n, r, i)), !0);
        case 'pointerover':
            var s = i.pointerId;
            return (Or.set(s, rr(Or.get(s) || null, e, t, n, r, i)), !0);
        case 'gotpointercapture':
            return ((s = i.pointerId), Fr.set(s, rr(Fr.get(s) || null, e, t, n, r, i)), !0);
    }
    return !1;
}
function Yd(e) {
    var t = qt(e.target);
    if (t !== null) {
        var n = hn(t);
        if (n !== null) {
            if (((t = n.tag), t === 13)) {
                if (((t = Od(n)), t !== null)) {
                    ((e.blockedOn = t),
                        Qd(e.priority, function () {
                            Kd(n);
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
function Fi(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
        var n = ol(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
        if (n === null) {
            n = e.nativeEvent;
            var r = new n.constructor(n.type, n);
            ((el = r), n.target.dispatchEvent(r), (el = null));
        } else return ((t = ri(n)), t !== null && ca(t), (e.blockedOn = n), !1);
        t.shift();
    }
    return !0;
}
function Bu(e, t, n) {
    Fi(e) && n.delete(t);
}
function Zg() {
    ((sl = !1),
        Mt !== null && Fi(Mt) && (Mt = null),
        Rt !== null && Fi(Rt) && (Rt = null),
        Dt !== null && Fi(Dt) && (Dt = null),
        Or.forEach(Bu),
        Fr.forEach(Bu));
}
function ir(e, t) {
    e.blockedOn === t &&
        ((e.blockedOn = null),
        sl || ((sl = !0), Re.unstable_scheduleCallback(Re.unstable_NormalPriority, Zg)));
}
function Ir(e) {
    function t(i) {
        return ir(i, e);
    }
    if (0 < xi.length) {
        ir(xi[0], e);
        for (var n = 1; n < xi.length; n++) {
            var r = xi[n];
            r.blockedOn === e && (r.blockedOn = null);
        }
    }
    for (
        Mt !== null && ir(Mt, e),
            Rt !== null && ir(Rt, e),
            Dt !== null && ir(Dt, e),
            Or.forEach(t),
            Fr.forEach(t),
            n = 0;
        n < kt.length;
        n++
    )
        ((r = kt[n]), r.blockedOn === e && (r.blockedOn = null));
    for (; 0 < kt.length && ((n = kt[0]), n.blockedOn === null); )
        (Yd(n), n.blockedOn === null && kt.shift());
}
var On = yt.ReactCurrentBatchConfig,
    rs = !0;
function qg(e, t, n, r) {
    var i = I,
        s = On.transition;
    On.transition = null;
    try {
        ((I = 1), fa(e, t, n, r));
    } finally {
        ((I = i), (On.transition = s));
    }
}
function Jg(e, t, n, r) {
    var i = I,
        s = On.transition;
    On.transition = null;
    try {
        ((I = 4), fa(e, t, n, r));
    } finally {
        ((I = i), (On.transition = s));
    }
}
function fa(e, t, n, r) {
    if (rs) {
        var i = ol(e, t, n, r);
        if (i === null) (mo(e, t, r, is, n), zu(e, r));
        else if (Xg(i, e, t, n, r)) r.stopPropagation();
        else if ((zu(e, r), t & 4 && -1 < Yg.indexOf(e))) {
            for (; i !== null; ) {
                var s = ri(i);
                if (
                    (s !== null && Hd(s),
                    (s = ol(e, t, n, r)),
                    s === null && mo(e, t, r, is, n),
                    s === i)
                )
                    break;
                i = s;
            }
            i !== null && r.stopPropagation();
        } else mo(e, t, r, null, n);
    }
}
var is = null;
function ol(e, t, n, r) {
    if (((is = null), (e = la(r)), (e = qt(e)), e !== null))
        if (((t = hn(e)), t === null)) e = null;
        else if (((n = t.tag), n === 13)) {
            if (((e = Od(t)), e !== null)) return e;
            e = null;
        } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
                return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
        } else t !== e && (e = null);
    return ((is = e), null);
}
function Xd(e) {
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
            switch (zg()) {
                case aa:
                    return 1;
                case Bd:
                    return 4;
                case ts:
                case Bg:
                    return 16;
                case Ud:
                    return 536870912;
                default:
                    return 16;
            }
        default:
            return 16;
    }
}
var Et = null,
    da = null,
    Ii = null;
function Zd() {
    if (Ii) return Ii;
    var e,
        t = da,
        n = t.length,
        r,
        i = 'value' in Et ? Et.value : Et.textContent,
        s = i.length;
    for (e = 0; e < n && t[e] === i[e]; e++);
    var o = n - e;
    for (r = 1; r <= o && t[n - r] === i[s - r]; r++);
    return (Ii = i.slice(e, 1 < r ? 1 - r : void 0));
}
function zi(e) {
    var t = e.keyCode;
    return (
        'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
    );
}
function Si() {
    return !0;
}
function Uu() {
    return !1;
}
function Ve(e) {
    function t(n, r, i, s, o) {
        ((this._reactName = n),
            (this._targetInst = i),
            (this.type = r),
            (this.nativeEvent = s),
            (this.target = o),
            (this.currentTarget = null));
        for (var l in e) e.hasOwnProperty(l) && ((n = e[l]), (this[l] = n ? n(s) : s[l]));
        return (
            (this.isDefaultPrevented = (
                s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1
            )
                ? Si
                : Uu),
            (this.isPropagationStopped = Uu),
            this
        );
    }
    return (
        G(t.prototype, {
            preventDefault: function () {
                this.defaultPrevented = !0;
                var n = this.nativeEvent;
                n &&
                    (n.preventDefault
                        ? n.preventDefault()
                        : typeof n.returnValue != 'unknown' && (n.returnValue = !1),
                    (this.isDefaultPrevented = Si));
            },
            stopPropagation: function () {
                var n = this.nativeEvent;
                n &&
                    (n.stopPropagation
                        ? n.stopPropagation()
                        : typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
                    (this.isPropagationStopped = Si));
            },
            persist: function () {},
            isPersistent: Si,
        }),
        t
    );
}
var Xn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
            return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
    },
    ha = Ve(Xn),
    ni = G({}, Xn, { view: 0, detail: 0 }),
    bg = Ve(ni),
    so,
    oo,
    sr,
    Ls = G({}, ni, {
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
        getModifierState: pa,
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
                : (e !== sr &&
                      (sr && e.type === 'mousemove'
                          ? ((so = e.screenX - sr.screenX), (oo = e.screenY - sr.screenY))
                          : (oo = so = 0),
                      (sr = e)),
                  so);
        },
        movementY: function (e) {
            return 'movementY' in e ? e.movementY : oo;
        },
    }),
    Wu = Ve(Ls),
    ey = G({}, Ls, { dataTransfer: 0 }),
    ty = Ve(ey),
    ny = G({}, ni, { relatedTarget: 0 }),
    lo = Ve(ny),
    ry = G({}, Xn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    iy = Ve(ry),
    sy = G({}, Xn, {
        clipboardData: function (e) {
            return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
        },
    }),
    oy = Ve(sy),
    ly = G({}, Xn, { data: 0 }),
    $u = Ve(ly),
    ay = {
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
    uy = {
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
    cy = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
function fy(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = cy[e]) ? !!t[e] : !1;
}
function pa() {
    return fy;
}
var dy = G({}, ni, {
        key: function (e) {
            if (e.key) {
                var t = ay[e.key] || e.key;
                if (t !== 'Unidentified') return t;
            }
            return e.type === 'keypress'
                ? ((e = zi(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
                : e.type === 'keydown' || e.type === 'keyup'
                  ? uy[e.keyCode] || 'Unidentified'
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
        getModifierState: pa,
        charCode: function (e) {
            return e.type === 'keypress' ? zi(e) : 0;
        },
        keyCode: function (e) {
            return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
        },
        which: function (e) {
            return e.type === 'keypress'
                ? zi(e)
                : e.type === 'keydown' || e.type === 'keyup'
                  ? e.keyCode
                  : 0;
        },
    }),
    hy = Ve(dy),
    py = G({}, Ls, {
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
    Hu = Ve(py),
    my = G({}, ni, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: pa,
    }),
    gy = Ve(my),
    yy = G({}, Xn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    vy = Ve(yy),
    wy = G({}, Ls, {
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
    xy = Ve(wy),
    Sy = [9, 13, 27, 32],
    ma = ht && 'CompositionEvent' in window,
    xr = null;
ht && 'documentMode' in document && (xr = document.documentMode);
var Ty = ht && 'TextEvent' in window && !xr,
    qd = ht && (!ma || (xr && 8 < xr && 11 >= xr)),
    Ku = ' ',
    Gu = !1;
function Jd(e, t) {
    switch (e) {
        case 'keyup':
            return Sy.indexOf(t.keyCode) !== -1;
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
function bd(e) {
    return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null);
}
var vn = !1;
function Py(e, t) {
    switch (e) {
        case 'compositionend':
            return bd(t);
        case 'keypress':
            return t.which !== 32 ? null : ((Gu = !0), Ku);
        case 'textInput':
            return ((e = t.data), e === Ku && Gu ? null : e);
        default:
            return null;
    }
}
function ky(e, t) {
    if (vn)
        return e === 'compositionend' || (!ma && Jd(e, t))
            ? ((e = Zd()), (Ii = da = Et = null), (vn = !1), e)
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
            return qd && t.locale !== 'ko' ? null : t.data;
        default:
            return null;
    }
}
var Cy = {
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
function Qu(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === 'input' ? !!Cy[e.type] : t === 'textarea';
}
function eh(e, t, n, r) {
    (Ld(r),
        (t = ss(t, 'onChange')),
        0 < t.length &&
            ((n = new ha('onChange', 'change', null, n, r)), e.push({ event: n, listeners: t })));
}
var Sr = null,
    zr = null;
function Ey(e) {
    fh(e, 0);
}
function Vs(e) {
    var t = Sn(e);
    if (kd(t)) return e;
}
function Ay(e, t) {
    if (e === 'change') return t;
}
var th = !1;
if (ht) {
    var ao;
    if (ht) {
        var uo = 'oninput' in document;
        if (!uo) {
            var Yu = document.createElement('div');
            (Yu.setAttribute('oninput', 'return;'), (uo = typeof Yu.oninput == 'function'));
        }
        ao = uo;
    } else ao = !1;
    th = ao && (!document.documentMode || 9 < document.documentMode);
}
function Xu() {
    Sr && (Sr.detachEvent('onpropertychange', nh), (zr = Sr = null));
}
function nh(e) {
    if (e.propertyName === 'value' && Vs(zr)) {
        var t = [];
        (eh(t, zr, e, la(e)), jd(Ey, t));
    }
}
function My(e, t, n) {
    e === 'focusin'
        ? (Xu(), (Sr = t), (zr = n), Sr.attachEvent('onpropertychange', nh))
        : e === 'focusout' && Xu();
}
function Ry(e) {
    if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return Vs(zr);
}
function Dy(e, t) {
    if (e === 'click') return Vs(t);
}
function Ly(e, t) {
    if (e === 'input' || e === 'change') return Vs(t);
}
function Vy(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var Xe = typeof Object.is == 'function' ? Object.is : Vy;
function Br(e, t) {
    if (Xe(e, t)) return !0;
    if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
    var n = Object.keys(e),
        r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!Wo.call(t, i) || !Xe(e[i], t[i])) return !1;
    }
    return !0;
}
function Zu(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
}
function qu(e, t) {
    var n = Zu(e);
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
        n = Zu(n);
    }
}
function rh(e, t) {
    return e && t
        ? e === t
            ? !0
            : e && e.nodeType === 3
              ? !1
              : t && t.nodeType === 3
                ? rh(e, t.parentNode)
                : 'contains' in e
                  ? e.contains(t)
                  : e.compareDocumentPosition
                    ? !!(e.compareDocumentPosition(t) & 16)
                    : !1
        : !1;
}
function ih() {
    for (var e = window, t = Ji(); t instanceof e.HTMLIFrameElement; ) {
        try {
            var n = typeof t.contentWindow.location.href == 'string';
        } catch {
            n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = Ji(e.document);
    }
    return t;
}
function ga(e) {
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
function _y(e) {
    var t = ih(),
        n = e.focusedElem,
        r = e.selectionRange;
    if (t !== n && n && n.ownerDocument && rh(n.ownerDocument.documentElement, n)) {
        if (r !== null && ga(n)) {
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
                    (i = qu(n, s)));
                var o = qu(n, r);
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
var Ny = ht && 'documentMode' in document && 11 >= document.documentMode,
    wn = null,
    ll = null,
    Tr = null,
    al = !1;
function Ju(e, t, n) {
    var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    al ||
        wn == null ||
        wn !== Ji(r) ||
        ((r = wn),
        'selectionStart' in r && ga(r)
            ? (r = { start: r.selectionStart, end: r.selectionEnd })
            : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
              (r = {
                  anchorNode: r.anchorNode,
                  anchorOffset: r.anchorOffset,
                  focusNode: r.focusNode,
                  focusOffset: r.focusOffset,
              })),
        (Tr && Br(Tr, r)) ||
            ((Tr = r),
            (r = ss(ll, 'onSelect')),
            0 < r.length &&
                ((t = new ha('onSelect', 'select', null, t, n)),
                e.push({ event: t, listeners: r }),
                (t.target = wn))));
}
function Ti(e, t) {
    var n = {};
    return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n['Webkit' + e] = 'webkit' + t),
        (n['Moz' + e] = 'moz' + t),
        n
    );
}
var xn = {
        animationend: Ti('Animation', 'AnimationEnd'),
        animationiteration: Ti('Animation', 'AnimationIteration'),
        animationstart: Ti('Animation', 'AnimationStart'),
        transitionend: Ti('Transition', 'TransitionEnd'),
    },
    co = {},
    sh = {};
ht &&
    ((sh = document.createElement('div').style),
    'AnimationEvent' in window ||
        (delete xn.animationend.animation,
        delete xn.animationiteration.animation,
        delete xn.animationstart.animation),
    'TransitionEvent' in window || delete xn.transitionend.transition);
function _s(e) {
    if (co[e]) return co[e];
    if (!xn[e]) return e;
    var t = xn[e],
        n;
    for (n in t) if (t.hasOwnProperty(n) && n in sh) return (co[e] = t[n]);
    return e;
}
var oh = _s('animationend'),
    lh = _s('animationiteration'),
    ah = _s('animationstart'),
    uh = _s('transitionend'),
    ch = new Map(),
    bu =
        'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
            ' ',
        );
function zt(e, t) {
    (ch.set(e, t), dn(t, [e]));
}
for (var fo = 0; fo < bu.length; fo++) {
    var ho = bu[fo],
        jy = ho.toLowerCase(),
        Oy = ho[0].toUpperCase() + ho.slice(1);
    zt(jy, 'on' + Oy);
}
zt(oh, 'onAnimationEnd');
zt(lh, 'onAnimationIteration');
zt(ah, 'onAnimationStart');
zt('dblclick', 'onDoubleClick');
zt('focusin', 'onFocus');
zt('focusout', 'onBlur');
zt(uh, 'onTransitionEnd');
zn('onMouseEnter', ['mouseout', 'mouseover']);
zn('onMouseLeave', ['mouseout', 'mouseover']);
zn('onPointerEnter', ['pointerout', 'pointerover']);
zn('onPointerLeave', ['pointerout', 'pointerover']);
dn('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '));
dn(
    'onSelect',
    'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(
        ' ',
    ),
);
dn('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']);
dn('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '));
dn('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '));
dn('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '));
var pr =
        'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
            ' ',
        ),
    Fy = new Set('cancel close invalid load scroll toggle'.split(' ').concat(pr));
function ec(e, t, n) {
    var r = e.type || 'unknown-event';
    ((e.currentTarget = n), jg(r, t, void 0, e), (e.currentTarget = null));
}
function fh(e, t) {
    t = (t & 4) !== 0;
    for (var n = 0; n < e.length; n++) {
        var r = e[n],
            i = r.event;
        r = r.listeners;
        e: {
            var s = void 0;
            if (t)
                for (var o = r.length - 1; 0 <= o; o--) {
                    var l = r[o],
                        a = l.instance,
                        u = l.currentTarget;
                    if (((l = l.listener), a !== s && i.isPropagationStopped())) break e;
                    (ec(i, l, u), (s = a));
                }
            else
                for (o = 0; o < r.length; o++) {
                    if (
                        ((l = r[o]),
                        (a = l.instance),
                        (u = l.currentTarget),
                        (l = l.listener),
                        a !== s && i.isPropagationStopped())
                    )
                        break e;
                    (ec(i, l, u), (s = a));
                }
        }
    }
    if (es) throw ((e = rl), (es = !1), (rl = null), e);
}
function B(e, t) {
    var n = t[hl];
    n === void 0 && (n = t[hl] = new Set());
    var r = e + '__bubble';
    n.has(r) || (dh(t, e, 2, !1), n.add(r));
}
function po(e, t, n) {
    var r = 0;
    (t && (r |= 4), dh(n, e, r, t));
}
var Pi = '_reactListening' + Math.random().toString(36).slice(2);
function Ur(e) {
    if (!e[Pi]) {
        ((e[Pi] = !0),
            wd.forEach(function (n) {
                n !== 'selectionchange' && (Fy.has(n) || po(n, !1, e), po(n, !0, e));
            }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[Pi] || ((t[Pi] = !0), po('selectionchange', !1, t));
    }
}
function dh(e, t, n, r) {
    switch (Xd(t)) {
        case 1:
            var i = qg;
            break;
        case 4:
            i = Jg;
            break;
        default:
            i = fa;
    }
    ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !nl || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (i = !0),
        r
            ? i !== void 0
                ? e.addEventListener(t, n, { capture: !0, passive: i })
                : e.addEventListener(t, n, !0)
            : i !== void 0
              ? e.addEventListener(t, n, { passive: i })
              : e.addEventListener(t, n, !1));
}
function mo(e, t, n, r, i) {
    var s = r;
    if (!(t & 1) && !(t & 2) && r !== null)
        e: for (;;) {
            if (r === null) return;
            var o = r.tag;
            if (o === 3 || o === 4) {
                var l = r.stateNode.containerInfo;
                if (l === i || (l.nodeType === 8 && l.parentNode === i)) break;
                if (o === 4)
                    for (o = r.return; o !== null; ) {
                        var a = o.tag;
                        if (
                            (a === 3 || a === 4) &&
                            ((a = o.stateNode.containerInfo),
                            a === i || (a.nodeType === 8 && a.parentNode === i))
                        )
                            return;
                        o = o.return;
                    }
                for (; l !== null; ) {
                    if (((o = qt(l)), o === null)) return;
                    if (((a = o.tag), a === 5 || a === 6)) {
                        r = s = o;
                        continue e;
                    }
                    l = l.parentNode;
                }
            }
            r = r.return;
        }
    jd(function () {
        var u = s,
            c = la(n),
            f = [];
        e: {
            var d = ch.get(e);
            if (d !== void 0) {
                var g = ha,
                    y = e;
                switch (e) {
                    case 'keypress':
                        if (zi(n) === 0) break e;
                    case 'keydown':
                    case 'keyup':
                        g = hy;
                        break;
                    case 'focusin':
                        ((y = 'focus'), (g = lo));
                        break;
                    case 'focusout':
                        ((y = 'blur'), (g = lo));
                        break;
                    case 'beforeblur':
                    case 'afterblur':
                        g = lo;
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
                        g = Wu;
                        break;
                    case 'drag':
                    case 'dragend':
                    case 'dragenter':
                    case 'dragexit':
                    case 'dragleave':
                    case 'dragover':
                    case 'dragstart':
                    case 'drop':
                        g = ty;
                        break;
                    case 'touchcancel':
                    case 'touchend':
                    case 'touchmove':
                    case 'touchstart':
                        g = gy;
                        break;
                    case oh:
                    case lh:
                    case ah:
                        g = iy;
                        break;
                    case uh:
                        g = vy;
                        break;
                    case 'scroll':
                        g = bg;
                        break;
                    case 'wheel':
                        g = xy;
                        break;
                    case 'copy':
                    case 'cut':
                    case 'paste':
                        g = oy;
                        break;
                    case 'gotpointercapture':
                    case 'lostpointercapture':
                    case 'pointercancel':
                    case 'pointerdown':
                    case 'pointermove':
                    case 'pointerout':
                    case 'pointerover':
                    case 'pointerup':
                        g = Hu;
                }
                var v = (t & 4) !== 0,
                    S = !v && e === 'scroll',
                    p = v ? (d !== null ? d + 'Capture' : null) : d;
                v = [];
                for (var h = u, m; h !== null; ) {
                    m = h;
                    var w = m.stateNode;
                    if (
                        (m.tag === 5 &&
                            w !== null &&
                            ((m = w),
                            p !== null && ((w = jr(h, p)), w != null && v.push(Wr(h, w, m)))),
                        S)
                    )
                        break;
                    h = h.return;
                }
                0 < v.length && ((d = new g(d, y, null, n, c)), f.push({ event: d, listeners: v }));
            }
        }
        if (!(t & 7)) {
            e: {
                if (
                    ((d = e === 'mouseover' || e === 'pointerover'),
                    (g = e === 'mouseout' || e === 'pointerout'),
                    d && n !== el && (y = n.relatedTarget || n.fromElement) && (qt(y) || y[pt]))
                )
                    break e;
                if (
                    (g || d) &&
                    ((d =
                        c.window === c
                            ? c
                            : (d = c.ownerDocument)
                              ? d.defaultView || d.parentWindow
                              : window),
                    g
                        ? ((y = n.relatedTarget || n.toElement),
                          (g = u),
                          (y = y ? qt(y) : null),
                          y !== null &&
                              ((S = hn(y)), y !== S || (y.tag !== 5 && y.tag !== 6)) &&
                              (y = null))
                        : ((g = null), (y = u)),
                    g !== y)
                ) {
                    if (
                        ((v = Wu),
                        (w = 'onMouseLeave'),
                        (p = 'onMouseEnter'),
                        (h = 'mouse'),
                        (e === 'pointerout' || e === 'pointerover') &&
                            ((v = Hu),
                            (w = 'onPointerLeave'),
                            (p = 'onPointerEnter'),
                            (h = 'pointer')),
                        (S = g == null ? d : Sn(g)),
                        (m = y == null ? d : Sn(y)),
                        (d = new v(w, h + 'leave', g, n, c)),
                        (d.target = S),
                        (d.relatedTarget = m),
                        (w = null),
                        qt(c) === u &&
                            ((v = new v(p, h + 'enter', y, n, c)),
                            (v.target = m),
                            (v.relatedTarget = S),
                            (w = v)),
                        (S = w),
                        g && y)
                    )
                        t: {
                            for (v = g, p = y, h = 0, m = v; m; m = mn(m)) h++;
                            for (m = 0, w = p; w; w = mn(w)) m++;
                            for (; 0 < h - m; ) ((v = mn(v)), h--);
                            for (; 0 < m - h; ) ((p = mn(p)), m--);
                            for (; h--; ) {
                                if (v === p || (p !== null && v === p.alternate)) break t;
                                ((v = mn(v)), (p = mn(p)));
                            }
                            v = null;
                        }
                    else v = null;
                    (g !== null && tc(f, d, g, v, !1),
                        y !== null && S !== null && tc(f, S, y, v, !0));
                }
            }
            e: {
                if (
                    ((d = u ? Sn(u) : window),
                    (g = d.nodeName && d.nodeName.toLowerCase()),
                    g === 'select' || (g === 'input' && d.type === 'file'))
                )
                    var x = Ay;
                else if (Qu(d))
                    if (th) x = Ly;
                    else {
                        x = Ry;
                        var k = My;
                    }
                else
                    (g = d.nodeName) &&
                        g.toLowerCase() === 'input' &&
                        (d.type === 'checkbox' || d.type === 'radio') &&
                        (x = Dy);
                if (x && (x = x(e, u))) {
                    eh(f, x, n, c);
                    break e;
                }
                (k && k(e, d, u),
                    e === 'focusout' &&
                        (k = d._wrapperState) &&
                        k.controlled &&
                        d.type === 'number' &&
                        Xo(d, 'number', d.value));
            }
            switch (((k = u ? Sn(u) : window), e)) {
                case 'focusin':
                    (Qu(k) || k.contentEditable === 'true') && ((wn = k), (ll = u), (Tr = null));
                    break;
                case 'focusout':
                    Tr = ll = wn = null;
                    break;
                case 'mousedown':
                    al = !0;
                    break;
                case 'contextmenu':
                case 'mouseup':
                case 'dragend':
                    ((al = !1), Ju(f, n, c));
                    break;
                case 'selectionchange':
                    if (Ny) break;
                case 'keydown':
                case 'keyup':
                    Ju(f, n, c);
            }
            var E;
            if (ma)
                e: {
                    switch (e) {
                        case 'compositionstart':
                            var T = 'onCompositionStart';
                            break e;
                        case 'compositionend':
                            T = 'onCompositionEnd';
                            break e;
                        case 'compositionupdate':
                            T = 'onCompositionUpdate';
                            break e;
                    }
                    T = void 0;
                }
            else
                vn
                    ? Jd(e, n) && (T = 'onCompositionEnd')
                    : e === 'keydown' && n.keyCode === 229 && (T = 'onCompositionStart');
            (T &&
                (qd &&
                    n.locale !== 'ko' &&
                    (vn || T !== 'onCompositionStart'
                        ? T === 'onCompositionEnd' && vn && (E = Zd())
                        : ((Et = c), (da = 'value' in Et ? Et.value : Et.textContent), (vn = !0))),
                (k = ss(u, T)),
                0 < k.length &&
                    ((T = new $u(T, e, null, n, c)),
                    f.push({ event: T, listeners: k }),
                    E ? (T.data = E) : ((E = bd(n)), E !== null && (T.data = E)))),
                (E = Ty ? Py(e, n) : ky(e, n)) &&
                    ((u = ss(u, 'onBeforeInput')),
                    0 < u.length &&
                        ((c = new $u('onBeforeInput', 'beforeinput', null, n, c)),
                        f.push({ event: c, listeners: u }),
                        (c.data = E))));
        }
        fh(f, t);
    });
}
function Wr(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
}
function ss(e, t) {
    for (var n = t + 'Capture', r = []; e !== null; ) {
        var i = e,
            s = i.stateNode;
        (i.tag === 5 &&
            s !== null &&
            ((i = s),
            (s = jr(e, n)),
            s != null && r.unshift(Wr(e, s, i)),
            (s = jr(e, t)),
            s != null && r.push(Wr(e, s, i))),
            (e = e.return));
    }
    return r;
}
function mn(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5);
    return e || null;
}
function tc(e, t, n, r, i) {
    for (var s = t._reactName, o = []; n !== null && n !== r; ) {
        var l = n,
            a = l.alternate,
            u = l.stateNode;
        if (a !== null && a === r) break;
        (l.tag === 5 &&
            u !== null &&
            ((l = u),
            i
                ? ((a = jr(n, s)), a != null && o.unshift(Wr(n, a, l)))
                : i || ((a = jr(n, s)), a != null && o.push(Wr(n, a, l)))),
            (n = n.return));
    }
    o.length !== 0 && e.push({ event: t, listeners: o });
}
var Iy = /\r\n?/g,
    zy = /\u0000|\uFFFD/g;
function nc(e) {
    return (typeof e == 'string' ? e : '' + e)
        .replace(
            Iy,
            `
`,
        )
        .replace(zy, '');
}
function ki(e, t, n) {
    if (((t = nc(t)), nc(e) !== t && n)) throw Error(P(425));
}
function os() {}
var ul = null,
    cl = null;
function fl(e, t) {
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
var dl = typeof setTimeout == 'function' ? setTimeout : void 0,
    By = typeof clearTimeout == 'function' ? clearTimeout : void 0,
    rc = typeof Promise == 'function' ? Promise : void 0,
    Uy =
        typeof queueMicrotask == 'function'
            ? queueMicrotask
            : typeof rc < 'u'
              ? function (e) {
                    return rc.resolve(null).then(e).catch(Wy);
                }
              : dl;
function Wy(e) {
    setTimeout(function () {
        throw e;
    });
}
function go(e, t) {
    var n = t,
        r = 0;
    do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8))
            if (((n = i.data), n === '/$')) {
                if (r === 0) {
                    (e.removeChild(i), Ir(t));
                    return;
                }
                r--;
            } else (n !== '$' && n !== '$?' && n !== '$!') || r++;
        n = i;
    } while (n);
    Ir(t);
}
function Lt(e) {
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
function ic(e) {
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
var Zn = Math.random().toString(36).slice(2),
    be = '__reactFiber$' + Zn,
    $r = '__reactProps$' + Zn,
    pt = '__reactContainer$' + Zn,
    hl = '__reactEvents$' + Zn,
    $y = '__reactListeners$' + Zn,
    Hy = '__reactHandles$' + Zn;
function qt(e) {
    var t = e[be];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
        if ((t = n[pt] || n[be])) {
            if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
                for (e = ic(e); e !== null; ) {
                    if ((n = e[be])) return n;
                    e = ic(e);
                }
            return t;
        }
        ((e = n), (n = e.parentNode));
    }
    return null;
}
function ri(e) {
    return (
        (e = e[be] || e[pt]),
        !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
    );
}
function Sn(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(P(33));
}
function Ns(e) {
    return e[$r] || null;
}
var pl = [],
    Tn = -1;
function Bt(e) {
    return { current: e };
}
function U(e) {
    0 > Tn || ((e.current = pl[Tn]), (pl[Tn] = null), Tn--);
}
function z(e, t) {
    (Tn++, (pl[Tn] = e.current), (e.current = t));
}
var Ft = {},
    me = Bt(Ft),
    Pe = Bt(!1),
    on = Ft;
function Bn(e, t) {
    var n = e.type.contextTypes;
    if (!n) return Ft;
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
function ke(e) {
    return ((e = e.childContextTypes), e != null);
}
function ls() {
    (U(Pe), U(me));
}
function sc(e, t, n) {
    if (me.current !== Ft) throw Error(P(168));
    (z(me, t), z(Pe, n));
}
function hh(e, t, n) {
    var r = e.stateNode;
    if (((t = t.childContextTypes), typeof r.getChildContext != 'function')) return n;
    r = r.getChildContext();
    for (var i in r) if (!(i in t)) throw Error(P(108, Mg(e) || 'Unknown', i));
    return G({}, n, r);
}
function as(e) {
    return (
        (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || Ft),
        (on = me.current),
        z(me, e),
        z(Pe, Pe.current),
        !0
    );
}
function oc(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(P(169));
    (n
        ? ((e = hh(e, t, on)),
          (r.__reactInternalMemoizedMergedChildContext = e),
          U(Pe),
          U(me),
          z(me, e))
        : U(Pe),
        z(Pe, n));
}
var lt = null,
    js = !1,
    yo = !1;
function ph(e) {
    lt === null ? (lt = [e]) : lt.push(e);
}
function Ky(e) {
    ((js = !0), ph(e));
}
function Ut() {
    if (!yo && lt !== null) {
        yo = !0;
        var e = 0,
            t = I;
        try {
            var n = lt;
            for (I = 1; e < n.length; e++) {
                var r = n[e];
                do r = r(!0);
                while (r !== null);
            }
            ((lt = null), (js = !1));
        } catch (i) {
            throw (lt !== null && (lt = lt.slice(e + 1)), zd(aa, Ut), i);
        } finally {
            ((I = t), (yo = !1));
        }
    }
    return null;
}
var Pn = [],
    kn = 0,
    us = null,
    cs = 0,
    je = [],
    Oe = 0,
    ln = null,
    at = 1,
    ut = '';
function Qt(e, t) {
    ((Pn[kn++] = cs), (Pn[kn++] = us), (us = e), (cs = t));
}
function mh(e, t, n) {
    ((je[Oe++] = at), (je[Oe++] = ut), (je[Oe++] = ln), (ln = e));
    var r = at;
    e = ut;
    var i = 32 - Qe(r) - 1;
    ((r &= ~(1 << i)), (n += 1));
    var s = 32 - Qe(t) + i;
    if (30 < s) {
        var o = i - (i % 5);
        ((s = (r & ((1 << o) - 1)).toString(32)),
            (r >>= o),
            (i -= o),
            (at = (1 << (32 - Qe(t) + i)) | (n << i) | r),
            (ut = s + e));
    } else ((at = (1 << s) | (n << i) | r), (ut = e));
}
function ya(e) {
    e.return !== null && (Qt(e, 1), mh(e, 1, 0));
}
function va(e) {
    for (; e === us; ) ((us = Pn[--kn]), (Pn[kn] = null), (cs = Pn[--kn]), (Pn[kn] = null));
    for (; e === ln; )
        ((ln = je[--Oe]),
            (je[Oe] = null),
            (ut = je[--Oe]),
            (je[Oe] = null),
            (at = je[--Oe]),
            (je[Oe] = null));
}
var Me = null,
    Ae = null,
    W = !1,
    Ge = null;
function gh(e, t) {
    var n = Ie(5, null, null, 0);
    ((n.elementType = 'DELETED'),
        (n.stateNode = t),
        (n.return = e),
        (t = e.deletions),
        t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function lc(e, t) {
    switch (e.tag) {
        case 5:
            var n = e.type;
            return (
                (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
                t !== null ? ((e.stateNode = t), (Me = e), (Ae = Lt(t.firstChild)), !0) : !1
            );
        case 6:
            return (
                (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
                t !== null ? ((e.stateNode = t), (Me = e), (Ae = null), !0) : !1
            );
        case 13:
            return (
                (t = t.nodeType !== 8 ? null : t),
                t !== null
                    ? ((n = ln !== null ? { id: at, overflow: ut } : null),
                      (e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }),
                      (n = Ie(18, null, null, 0)),
                      (n.stateNode = t),
                      (n.return = e),
                      (e.child = n),
                      (Me = e),
                      (Ae = null),
                      !0)
                    : !1
            );
        default:
            return !1;
    }
}
function ml(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function gl(e) {
    if (W) {
        var t = Ae;
        if (t) {
            var n = t;
            if (!lc(e, t)) {
                if (ml(e)) throw Error(P(418));
                t = Lt(n.nextSibling);
                var r = Me;
                t && lc(e, t) ? gh(r, n) : ((e.flags = (e.flags & -4097) | 2), (W = !1), (Me = e));
            }
        } else {
            if (ml(e)) throw Error(P(418));
            ((e.flags = (e.flags & -4097) | 2), (W = !1), (Me = e));
        }
    }
}
function ac(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    Me = e;
}
function Ci(e) {
    if (e !== Me) return !1;
    if (!W) return (ac(e), (W = !0), !1);
    var t;
    if (
        ((t = e.tag !== 3) &&
            !(t = e.tag !== 5) &&
            ((t = e.type), (t = t !== 'head' && t !== 'body' && !fl(e.type, e.memoizedProps))),
        t && (t = Ae))
    ) {
        if (ml(e)) throw (yh(), Error(P(418)));
        for (; t; ) (gh(e, t), (t = Lt(t.nextSibling)));
    }
    if ((ac(e), e.tag === 13)) {
        if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
            throw Error(P(317));
        e: {
            for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                    var n = e.data;
                    if (n === '/$') {
                        if (t === 0) {
                            Ae = Lt(e.nextSibling);
                            break e;
                        }
                        t--;
                    } else (n !== '$' && n !== '$!' && n !== '$?') || t++;
                }
                e = e.nextSibling;
            }
            Ae = null;
        }
    } else Ae = Me ? Lt(e.stateNode.nextSibling) : null;
    return !0;
}
function yh() {
    for (var e = Ae; e; ) e = Lt(e.nextSibling);
}
function Un() {
    ((Ae = Me = null), (W = !1));
}
function wa(e) {
    Ge === null ? (Ge = [e]) : Ge.push(e);
}
var Gy = yt.ReactCurrentBatchConfig;
function or(e, t, n) {
    if (((e = n.ref), e !== null && typeof e != 'function' && typeof e != 'object')) {
        if (n._owner) {
            if (((n = n._owner), n)) {
                if (n.tag !== 1) throw Error(P(309));
                var r = n.stateNode;
            }
            if (!r) throw Error(P(147, e));
            var i = r,
                s = '' + e;
            return t !== null &&
                t.ref !== null &&
                typeof t.ref == 'function' &&
                t.ref._stringRef === s
                ? t.ref
                : ((t = function (o) {
                      var l = i.refs;
                      o === null ? delete l[s] : (l[s] = o);
                  }),
                  (t._stringRef = s),
                  t);
        }
        if (typeof e != 'string') throw Error(P(284));
        if (!n._owner) throw Error(P(290, e));
    }
    return e;
}
function Ei(e, t) {
    throw (
        (e = Object.prototype.toString.call(t)),
        Error(
            P(
                31,
                e === '[object Object]'
                    ? 'object with keys {' + Object.keys(t).join(', ') + '}'
                    : e,
            ),
        )
    );
}
function uc(e) {
    var t = e._init;
    return t(e._payload);
}
function vh(e) {
    function t(p, h) {
        if (e) {
            var m = p.deletions;
            m === null ? ((p.deletions = [h]), (p.flags |= 16)) : m.push(h);
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
        return ((p = jt(p, h)), (p.index = 0), (p.sibling = null), p);
    }
    function s(p, h, m) {
        return (
            (p.index = m),
            e
                ? ((m = p.alternate),
                  m !== null
                      ? ((m = m.index), m < h ? ((p.flags |= 2), h) : m)
                      : ((p.flags |= 2), h))
                : ((p.flags |= 1048576), h)
        );
    }
    function o(p) {
        return (e && p.alternate === null && (p.flags |= 2), p);
    }
    function l(p, h, m, w) {
        return h === null || h.tag !== 6
            ? ((h = ko(m, p.mode, w)), (h.return = p), h)
            : ((h = i(h, m)), (h.return = p), h);
    }
    function a(p, h, m, w) {
        var x = m.type;
        return x === yn
            ? c(p, h, m.props.children, w, m.key)
            : h !== null &&
                (h.elementType === x ||
                    (typeof x == 'object' && x !== null && x.$$typeof === Tt && uc(x) === h.type))
              ? ((w = i(h, m.props)), (w.ref = or(p, h, m)), (w.return = p), w)
              : ((w = Gi(m.type, m.key, m.props, null, p.mode, w)),
                (w.ref = or(p, h, m)),
                (w.return = p),
                w);
    }
    function u(p, h, m, w) {
        return h === null ||
            h.tag !== 4 ||
            h.stateNode.containerInfo !== m.containerInfo ||
            h.stateNode.implementation !== m.implementation
            ? ((h = Co(m, p.mode, w)), (h.return = p), h)
            : ((h = i(h, m.children || [])), (h.return = p), h);
    }
    function c(p, h, m, w, x) {
        return h === null || h.tag !== 7
            ? ((h = rn(m, p.mode, w, x)), (h.return = p), h)
            : ((h = i(h, m)), (h.return = p), h);
    }
    function f(p, h, m) {
        if ((typeof h == 'string' && h !== '') || typeof h == 'number')
            return ((h = ko('' + h, p.mode, m)), (h.return = p), h);
        if (typeof h == 'object' && h !== null) {
            switch (h.$$typeof) {
                case mi:
                    return (
                        (m = Gi(h.type, h.key, h.props, null, p.mode, m)),
                        (m.ref = or(p, null, h)),
                        (m.return = p),
                        m
                    );
                case gn:
                    return ((h = Co(h, p.mode, m)), (h.return = p), h);
                case Tt:
                    var w = h._init;
                    return f(p, w(h._payload), m);
            }
            if (dr(h) || tr(h)) return ((h = rn(h, p.mode, m, null)), (h.return = p), h);
            Ei(p, h);
        }
        return null;
    }
    function d(p, h, m, w) {
        var x = h !== null ? h.key : null;
        if ((typeof m == 'string' && m !== '') || typeof m == 'number')
            return x !== null ? null : l(p, h, '' + m, w);
        if (typeof m == 'object' && m !== null) {
            switch (m.$$typeof) {
                case mi:
                    return m.key === x ? a(p, h, m, w) : null;
                case gn:
                    return m.key === x ? u(p, h, m, w) : null;
                case Tt:
                    return ((x = m._init), d(p, h, x(m._payload), w));
            }
            if (dr(m) || tr(m)) return x !== null ? null : c(p, h, m, w, null);
            Ei(p, m);
        }
        return null;
    }
    function g(p, h, m, w, x) {
        if ((typeof w == 'string' && w !== '') || typeof w == 'number')
            return ((p = p.get(m) || null), l(h, p, '' + w, x));
        if (typeof w == 'object' && w !== null) {
            switch (w.$$typeof) {
                case mi:
                    return ((p = p.get(w.key === null ? m : w.key) || null), a(h, p, w, x));
                case gn:
                    return ((p = p.get(w.key === null ? m : w.key) || null), u(h, p, w, x));
                case Tt:
                    var k = w._init;
                    return g(p, h, m, k(w._payload), x);
            }
            if (dr(w) || tr(w)) return ((p = p.get(m) || null), c(h, p, w, x, null));
            Ei(h, w);
        }
        return null;
    }
    function y(p, h, m, w) {
        for (
            var x = null, k = null, E = h, T = (h = 0), N = null;
            E !== null && T < m.length;
            T++
        ) {
            E.index > T ? ((N = E), (E = null)) : (N = E.sibling);
            var L = d(p, E, m[T], w);
            if (L === null) {
                E === null && (E = N);
                break;
            }
            (e && E && L.alternate === null && t(p, E),
                (h = s(L, h, T)),
                k === null ? (x = L) : (k.sibling = L),
                (k = L),
                (E = N));
        }
        if (T === m.length) return (n(p, E), W && Qt(p, T), x);
        if (E === null) {
            for (; T < m.length; T++)
                ((E = f(p, m[T], w)),
                    E !== null &&
                        ((h = s(E, h, T)), k === null ? (x = E) : (k.sibling = E), (k = E)));
            return (W && Qt(p, T), x);
        }
        for (E = r(p, E); T < m.length; T++)
            ((N = g(E, p, T, m[T], w)),
                N !== null &&
                    (e && N.alternate !== null && E.delete(N.key === null ? T : N.key),
                    (h = s(N, h, T)),
                    k === null ? (x = N) : (k.sibling = N),
                    (k = N)));
        return (
            e &&
                E.forEach(function (re) {
                    return t(p, re);
                }),
            W && Qt(p, T),
            x
        );
    }
    function v(p, h, m, w) {
        var x = tr(m);
        if (typeof x != 'function') throw Error(P(150));
        if (((m = x.call(m)), m == null)) throw Error(P(151));
        for (
            var k = (x = null), E = h, T = (h = 0), N = null, L = m.next();
            E !== null && !L.done;
            T++, L = m.next()
        ) {
            E.index > T ? ((N = E), (E = null)) : (N = E.sibling);
            var re = d(p, E, L.value, w);
            if (re === null) {
                E === null && (E = N);
                break;
            }
            (e && E && re.alternate === null && t(p, E),
                (h = s(re, h, T)),
                k === null ? (x = re) : (k.sibling = re),
                (k = re),
                (E = N));
        }
        if (L.done) return (n(p, E), W && Qt(p, T), x);
        if (E === null) {
            for (; !L.done; T++, L = m.next())
                ((L = f(p, L.value, w)),
                    L !== null &&
                        ((h = s(L, h, T)), k === null ? (x = L) : (k.sibling = L), (k = L)));
            return (W && Qt(p, T), x);
        }
        for (E = r(p, E); !L.done; T++, L = m.next())
            ((L = g(E, p, T, L.value, w)),
                L !== null &&
                    (e && L.alternate !== null && E.delete(L.key === null ? T : L.key),
                    (h = s(L, h, T)),
                    k === null ? (x = L) : (k.sibling = L),
                    (k = L)));
        return (
            e &&
                E.forEach(function (vt) {
                    return t(p, vt);
                }),
            W && Qt(p, T),
            x
        );
    }
    function S(p, h, m, w) {
        if (
            (typeof m == 'object' &&
                m !== null &&
                m.type === yn &&
                m.key === null &&
                (m = m.props.children),
            typeof m == 'object' && m !== null)
        ) {
            switch (m.$$typeof) {
                case mi:
                    e: {
                        for (var x = m.key, k = h; k !== null; ) {
                            if (k.key === x) {
                                if (((x = m.type), x === yn)) {
                                    if (k.tag === 7) {
                                        (n(p, k.sibling),
                                            (h = i(k, m.props.children)),
                                            (h.return = p),
                                            (p = h));
                                        break e;
                                    }
                                } else if (
                                    k.elementType === x ||
                                    (typeof x == 'object' &&
                                        x !== null &&
                                        x.$$typeof === Tt &&
                                        uc(x) === k.type)
                                ) {
                                    (n(p, k.sibling),
                                        (h = i(k, m.props)),
                                        (h.ref = or(p, k, m)),
                                        (h.return = p),
                                        (p = h));
                                    break e;
                                }
                                n(p, k);
                                break;
                            } else t(p, k);
                            k = k.sibling;
                        }
                        m.type === yn
                            ? ((h = rn(m.props.children, p.mode, w, m.key)),
                              (h.return = p),
                              (p = h))
                            : ((w = Gi(m.type, m.key, m.props, null, p.mode, w)),
                              (w.ref = or(p, h, m)),
                              (w.return = p),
                              (p = w));
                    }
                    return o(p);
                case gn:
                    e: {
                        for (k = m.key; h !== null; ) {
                            if (h.key === k)
                                if (
                                    h.tag === 4 &&
                                    h.stateNode.containerInfo === m.containerInfo &&
                                    h.stateNode.implementation === m.implementation
                                ) {
                                    (n(p, h.sibling),
                                        (h = i(h, m.children || [])),
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
                        ((h = Co(m, p.mode, w)), (h.return = p), (p = h));
                    }
                    return o(p);
                case Tt:
                    return ((k = m._init), S(p, h, k(m._payload), w));
            }
            if (dr(m)) return y(p, h, m, w);
            if (tr(m)) return v(p, h, m, w);
            Ei(p, m);
        }
        return (typeof m == 'string' && m !== '') || typeof m == 'number'
            ? ((m = '' + m),
              h !== null && h.tag === 6
                  ? (n(p, h.sibling), (h = i(h, m)), (h.return = p), (p = h))
                  : (n(p, h), (h = ko(m, p.mode, w)), (h.return = p), (p = h)),
              o(p))
            : n(p, h);
    }
    return S;
}
var Wn = vh(!0),
    wh = vh(!1),
    fs = Bt(null),
    ds = null,
    Cn = null,
    xa = null;
function Sa() {
    xa = Cn = ds = null;
}
function Ta(e) {
    var t = fs.current;
    (U(fs), (e._currentValue = t));
}
function yl(e, t, n) {
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
function Fn(e, t) {
    ((ds = e),
        (xa = Cn = null),
        (e = e.dependencies),
        e !== null &&
            e.firstContext !== null &&
            (e.lanes & t && (Te = !0), (e.firstContext = null)));
}
function Be(e) {
    var t = e._currentValue;
    if (xa !== e)
        if (((e = { context: e, memoizedValue: t, next: null }), Cn === null)) {
            if (ds === null) throw Error(P(308));
            ((Cn = e), (ds.dependencies = { lanes: 0, firstContext: e }));
        } else Cn = Cn.next = e;
    return t;
}
var Jt = null;
function Pa(e) {
    Jt === null ? (Jt = [e]) : Jt.push(e);
}
function xh(e, t, n, r) {
    var i = t.interleaved;
    return (
        i === null ? ((n.next = n), Pa(t)) : ((n.next = i.next), (i.next = n)),
        (t.interleaved = n),
        mt(e, r)
    );
}
function mt(e, t) {
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
var Pt = !1;
function ka(e) {
    e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, interleaved: null, lanes: 0 },
        effects: null,
    };
}
function Sh(e, t) {
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
function ct(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function Vt(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (((r = r.shared), O & 2)) {
        var i = r.pending;
        return (
            i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
            (r.pending = t),
            mt(e, n)
        );
    }
    return (
        (i = r.interleaved),
        i === null ? ((t.next = t), Pa(r)) : ((t.next = i.next), (i.next = t)),
        (r.interleaved = t),
        mt(e, n)
    );
}
function Bi(e, t, n) {
    if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), ua(e, n));
    }
}
function cc(e, t) {
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
function hs(e, t, n, r) {
    var i = e.updateQueue;
    Pt = !1;
    var s = i.firstBaseUpdate,
        o = i.lastBaseUpdate,
        l = i.shared.pending;
    if (l !== null) {
        i.shared.pending = null;
        var a = l,
            u = a.next;
        ((a.next = null), o === null ? (s = u) : (o.next = u), (o = a));
        var c = e.alternate;
        c !== null &&
            ((c = c.updateQueue),
            (l = c.lastBaseUpdate),
            l !== o &&
                (l === null ? (c.firstBaseUpdate = u) : (l.next = u), (c.lastBaseUpdate = a)));
    }
    if (s !== null) {
        var f = i.baseState;
        ((o = 0), (c = u = a = null), (l = s));
        do {
            var d = l.lane,
                g = l.eventTime;
            if ((r & d) === d) {
                c !== null &&
                    (c = c.next =
                        {
                            eventTime: g,
                            lane: 0,
                            tag: l.tag,
                            payload: l.payload,
                            callback: l.callback,
                            next: null,
                        });
                e: {
                    var y = e,
                        v = l;
                    switch (((d = t), (g = n), v.tag)) {
                        case 1:
                            if (((y = v.payload), typeof y == 'function')) {
                                f = y.call(g, f, d);
                                break e;
                            }
                            f = y;
                            break e;
                        case 3:
                            y.flags = (y.flags & -65537) | 128;
                        case 0:
                            if (
                                ((y = v.payload),
                                (d = typeof y == 'function' ? y.call(g, f, d) : y),
                                d == null)
                            )
                                break e;
                            f = G({}, f, d);
                            break e;
                        case 2:
                            Pt = !0;
                    }
                }
                l.callback !== null &&
                    l.lane !== 0 &&
                    ((e.flags |= 64), (d = i.effects), d === null ? (i.effects = [l]) : d.push(l));
            } else
                ((g = {
                    eventTime: g,
                    lane: d,
                    tag: l.tag,
                    payload: l.payload,
                    callback: l.callback,
                    next: null,
                }),
                    c === null ? ((u = c = g), (a = f)) : (c = c.next = g),
                    (o |= d));
            if (((l = l.next), l === null)) {
                if (((l = i.shared.pending), l === null)) break;
                ((d = l),
                    (l = d.next),
                    (d.next = null),
                    (i.lastBaseUpdate = d),
                    (i.shared.pending = null));
            }
        } while (!0);
        if (
            (c === null && (a = f),
            (i.baseState = a),
            (i.firstBaseUpdate = u),
            (i.lastBaseUpdate = c),
            (t = i.shared.interleaved),
            t !== null)
        ) {
            i = t;
            do ((o |= i.lane), (i = i.next));
            while (i !== t);
        } else s === null && (i.shared.lanes = 0);
        ((un |= o), (e.lanes = o), (e.memoizedState = f));
    }
}
function fc(e, t, n) {
    if (((e = t.effects), (t.effects = null), e !== null))
        for (t = 0; t < e.length; t++) {
            var r = e[t],
                i = r.callback;
            if (i !== null) {
                if (((r.callback = null), (r = n), typeof i != 'function')) throw Error(P(191, i));
                i.call(r);
            }
        }
}
var ii = {},
    nt = Bt(ii),
    Hr = Bt(ii),
    Kr = Bt(ii);
function bt(e) {
    if (e === ii) throw Error(P(174));
    return e;
}
function Ca(e, t) {
    switch ((z(Kr, t), z(Hr, e), z(nt, ii), (e = t.nodeType), e)) {
        case 9:
        case 11:
            t = (t = t.documentElement) ? t.namespaceURI : qo(null, '');
            break;
        default:
            ((e = e === 8 ? t.parentNode : t),
                (t = e.namespaceURI || null),
                (e = e.tagName),
                (t = qo(t, e)));
    }
    (U(nt), z(nt, t));
}
function $n() {
    (U(nt), U(Hr), U(Kr));
}
function Th(e) {
    bt(Kr.current);
    var t = bt(nt.current),
        n = qo(t, e.type);
    t !== n && (z(Hr, e), z(nt, n));
}
function Ea(e) {
    Hr.current === e && (U(nt), U(Hr));
}
var $ = Bt(0);
function ps(e) {
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
var vo = [];
function Aa() {
    for (var e = 0; e < vo.length; e++) vo[e]._workInProgressVersionPrimary = null;
    vo.length = 0;
}
var Ui = yt.ReactCurrentDispatcher,
    wo = yt.ReactCurrentBatchConfig,
    an = 0,
    K = null,
    te = null,
    se = null,
    ms = !1,
    Pr = !1,
    Gr = 0,
    Qy = 0;
function fe() {
    throw Error(P(321));
}
function Ma(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++) if (!Xe(e[n], t[n])) return !1;
    return !0;
}
function Ra(e, t, n, r, i, s) {
    if (
        ((an = s),
        (K = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (Ui.current = e === null || e.memoizedState === null ? qy : Jy),
        (e = n(r, i)),
        Pr)
    ) {
        s = 0;
        do {
            if (((Pr = !1), (Gr = 0), 25 <= s)) throw Error(P(301));
            ((s += 1), (se = te = null), (t.updateQueue = null), (Ui.current = by), (e = n(r, i)));
        } while (Pr);
    }
    if (
        ((Ui.current = gs),
        (t = te !== null && te.next !== null),
        (an = 0),
        (se = te = K = null),
        (ms = !1),
        t)
    )
        throw Error(P(300));
    return e;
}
function Da() {
    var e = Gr !== 0;
    return ((Gr = 0), e);
}
function Je() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return (se === null ? (K.memoizedState = se = e) : (se = se.next = e), se);
}
function Ue() {
    if (te === null) {
        var e = K.alternate;
        e = e !== null ? e.memoizedState : null;
    } else e = te.next;
    var t = se === null ? K.memoizedState : se.next;
    if (t !== null) ((se = t), (te = e));
    else {
        if (e === null) throw Error(P(310));
        ((te = e),
            (e = {
                memoizedState: te.memoizedState,
                baseState: te.baseState,
                baseQueue: te.baseQueue,
                queue: te.queue,
                next: null,
            }),
            se === null ? (K.memoizedState = se = e) : (se = se.next = e));
    }
    return se;
}
function Qr(e, t) {
    return typeof t == 'function' ? t(e) : t;
}
function xo(e) {
    var t = Ue(),
        n = t.queue;
    if (n === null) throw Error(P(311));
    n.lastRenderedReducer = e;
    var r = te,
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
        var l = (o = null),
            a = null,
            u = s;
        do {
            var c = u.lane;
            if ((an & c) === c)
                (a !== null &&
                    (a = a.next =
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
                (a === null ? ((l = a = f), (o = r)) : (a = a.next = f), (K.lanes |= c), (un |= c));
            }
            u = u.next;
        } while (u !== null && u !== s);
        (a === null ? (o = r) : (a.next = l),
            Xe(r, t.memoizedState) || (Te = !0),
            (t.memoizedState = r),
            (t.baseState = o),
            (t.baseQueue = a),
            (n.lastRenderedState = r));
    }
    if (((e = n.interleaved), e !== null)) {
        i = e;
        do ((s = i.lane), (K.lanes |= s), (un |= s), (i = i.next));
        while (i !== e);
    } else i === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
}
function So(e) {
    var t = Ue(),
        n = t.queue;
    if (n === null) throw Error(P(311));
    n.lastRenderedReducer = e;
    var r = n.dispatch,
        i = n.pending,
        s = t.memoizedState;
    if (i !== null) {
        n.pending = null;
        var o = (i = i.next);
        do ((s = e(s, o.action)), (o = o.next));
        while (o !== i);
        (Xe(s, t.memoizedState) || (Te = !0),
            (t.memoizedState = s),
            t.baseQueue === null && (t.baseState = s),
            (n.lastRenderedState = s));
    }
    return [s, r];
}
function Ph() {}
function kh(e, t) {
    var n = K,
        r = Ue(),
        i = t(),
        s = !Xe(r.memoizedState, i);
    if (
        (s && ((r.memoizedState = i), (Te = !0)),
        (r = r.queue),
        La(Ah.bind(null, n, r, e), [e]),
        r.getSnapshot !== t || s || (se !== null && se.memoizedState.tag & 1))
    ) {
        if (((n.flags |= 2048), Yr(9, Eh.bind(null, n, r, i, t), void 0, null), le === null))
            throw Error(P(349));
        an & 30 || Ch(n, t, i);
    }
    return i;
}
function Ch(e, t, n) {
    ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = K.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }), (K.updateQueue = t), (t.stores = [e]))
            : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function Eh(e, t, n, r) {
    ((t.value = n), (t.getSnapshot = r), Mh(t) && Rh(e));
}
function Ah(e, t, n) {
    return n(function () {
        Mh(t) && Rh(e);
    });
}
function Mh(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !Xe(e, n);
    } catch {
        return !0;
    }
}
function Rh(e) {
    var t = mt(e, 1);
    t !== null && Ye(t, e, 1, -1);
}
function dc(e) {
    var t = Je();
    return (
        typeof e == 'function' && (e = e()),
        (t.memoizedState = t.baseState = e),
        (e = {
            pending: null,
            interleaved: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Qr,
            lastRenderedState: e,
        }),
        (t.queue = e),
        (e = e.dispatch = Zy.bind(null, K, e)),
        [t.memoizedState, e]
    );
}
function Yr(e, t, n, r) {
    return (
        (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
        (t = K.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }),
              (K.updateQueue = t),
              (t.lastEffect = e.next = e))
            : ((n = t.lastEffect),
              n === null
                  ? (t.lastEffect = e.next = e)
                  : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
        e
    );
}
function Dh() {
    return Ue().memoizedState;
}
function Wi(e, t, n, r) {
    var i = Je();
    ((K.flags |= e), (i.memoizedState = Yr(1 | t, n, void 0, r === void 0 ? null : r)));
}
function Os(e, t, n, r) {
    var i = Ue();
    r = r === void 0 ? null : r;
    var s = void 0;
    if (te !== null) {
        var o = te.memoizedState;
        if (((s = o.destroy), r !== null && Ma(r, o.deps))) {
            i.memoizedState = Yr(t, n, s, r);
            return;
        }
    }
    ((K.flags |= e), (i.memoizedState = Yr(1 | t, n, s, r)));
}
function hc(e, t) {
    return Wi(8390656, 8, e, t);
}
function La(e, t) {
    return Os(2048, 8, e, t);
}
function Lh(e, t) {
    return Os(4, 2, e, t);
}
function Vh(e, t) {
    return Os(4, 4, e, t);
}
function _h(e, t) {
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
function Nh(e, t, n) {
    return ((n = n != null ? n.concat([e]) : null), Os(4, 4, _h.bind(null, t, e), n));
}
function Va() {}
function jh(e, t) {
    var n = Ue();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Ma(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
}
function Oh(e, t) {
    var n = Ue();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Ma(t, r[1])
        ? r[0]
        : ((e = e()), (n.memoizedState = [e, t]), e);
}
function Fh(e, t, n) {
    return an & 21
        ? (Xe(n, t) || ((n = Wd()), (K.lanes |= n), (un |= n), (e.baseState = !0)), t)
        : (e.baseState && ((e.baseState = !1), (Te = !0)), (e.memoizedState = n));
}
function Yy(e, t) {
    var n = I;
    ((I = n !== 0 && 4 > n ? n : 4), e(!0));
    var r = wo.transition;
    wo.transition = {};
    try {
        (e(!1), t());
    } finally {
        ((I = n), (wo.transition = r));
    }
}
function Ih() {
    return Ue().memoizedState;
}
function Xy(e, t, n) {
    var r = Nt(e);
    if (((n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }), zh(e)))
        Bh(t, n);
    else if (((n = xh(e, t, n, r)), n !== null)) {
        var i = ye();
        (Ye(n, e, r, i), Uh(n, t, r));
    }
}
function Zy(e, t, n) {
    var r = Nt(e),
        i = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
    if (zh(e)) Bh(t, i);
    else {
        var s = e.alternate;
        if (
            e.lanes === 0 &&
            (s === null || s.lanes === 0) &&
            ((s = t.lastRenderedReducer), s !== null)
        )
            try {
                var o = t.lastRenderedState,
                    l = s(o, n);
                if (((i.hasEagerState = !0), (i.eagerState = l), Xe(l, o))) {
                    var a = t.interleaved;
                    (a === null ? ((i.next = i), Pa(t)) : ((i.next = a.next), (a.next = i)),
                        (t.interleaved = i));
                    return;
                }
            } catch {
            } finally {
            }
        ((n = xh(e, t, i, r)), n !== null && ((i = ye()), Ye(n, e, r, i), Uh(n, t, r)));
    }
}
function zh(e) {
    var t = e.alternate;
    return e === K || (t !== null && t === K);
}
function Bh(e, t) {
    Pr = ms = !0;
    var n = e.pending;
    (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t));
}
function Uh(e, t, n) {
    if (n & 4194240) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), ua(e, n));
    }
}
var gs = {
        readContext: Be,
        useCallback: fe,
        useContext: fe,
        useEffect: fe,
        useImperativeHandle: fe,
        useInsertionEffect: fe,
        useLayoutEffect: fe,
        useMemo: fe,
        useReducer: fe,
        useRef: fe,
        useState: fe,
        useDebugValue: fe,
        useDeferredValue: fe,
        useTransition: fe,
        useMutableSource: fe,
        useSyncExternalStore: fe,
        useId: fe,
        unstable_isNewReconciler: !1,
    },
    qy = {
        readContext: Be,
        useCallback: function (e, t) {
            return ((Je().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: Be,
        useEffect: hc,
        useImperativeHandle: function (e, t, n) {
            return ((n = n != null ? n.concat([e]) : null), Wi(4194308, 4, _h.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
            return Wi(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
            return Wi(4, 2, e, t);
        },
        useMemo: function (e, t) {
            var n = Je();
            return ((t = t === void 0 ? null : t), (e = e()), (n.memoizedState = [e, t]), e);
        },
        useReducer: function (e, t, n) {
            var r = Je();
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
                (e = e.dispatch = Xy.bind(null, K, e)),
                [r.memoizedState, e]
            );
        },
        useRef: function (e) {
            var t = Je();
            return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: dc,
        useDebugValue: Va,
        useDeferredValue: function (e) {
            return (Je().memoizedState = e);
        },
        useTransition: function () {
            var e = dc(!1),
                t = e[0];
            return ((e = Yy.bind(null, e[1])), (Je().memoizedState = e), [t, e]);
        },
        useMutableSource: function () {},
        useSyncExternalStore: function (e, t, n) {
            var r = K,
                i = Je();
            if (W) {
                if (n === void 0) throw Error(P(407));
                n = n();
            } else {
                if (((n = t()), le === null)) throw Error(P(349));
                an & 30 || Ch(r, t, n);
            }
            i.memoizedState = n;
            var s = { value: n, getSnapshot: t };
            return (
                (i.queue = s),
                hc(Ah.bind(null, r, s, e), [e]),
                (r.flags |= 2048),
                Yr(9, Eh.bind(null, r, s, n, t), void 0, null),
                n
            );
        },
        useId: function () {
            var e = Je(),
                t = le.identifierPrefix;
            if (W) {
                var n = ut,
                    r = at;
                ((n = (r & ~(1 << (32 - Qe(r) - 1))).toString(32) + n),
                    (t = ':' + t + 'R' + n),
                    (n = Gr++),
                    0 < n && (t += 'H' + n.toString(32)),
                    (t += ':'));
            } else ((n = Qy++), (t = ':' + t + 'r' + n.toString(32) + ':'));
            return (e.memoizedState = t);
        },
        unstable_isNewReconciler: !1,
    },
    Jy = {
        readContext: Be,
        useCallback: jh,
        useContext: Be,
        useEffect: La,
        useImperativeHandle: Nh,
        useInsertionEffect: Lh,
        useLayoutEffect: Vh,
        useMemo: Oh,
        useReducer: xo,
        useRef: Dh,
        useState: function () {
            return xo(Qr);
        },
        useDebugValue: Va,
        useDeferredValue: function (e) {
            var t = Ue();
            return Fh(t, te.memoizedState, e);
        },
        useTransition: function () {
            var e = xo(Qr)[0],
                t = Ue().memoizedState;
            return [e, t];
        },
        useMutableSource: Ph,
        useSyncExternalStore: kh,
        useId: Ih,
        unstable_isNewReconciler: !1,
    },
    by = {
        readContext: Be,
        useCallback: jh,
        useContext: Be,
        useEffect: La,
        useImperativeHandle: Nh,
        useInsertionEffect: Lh,
        useLayoutEffect: Vh,
        useMemo: Oh,
        useReducer: So,
        useRef: Dh,
        useState: function () {
            return So(Qr);
        },
        useDebugValue: Va,
        useDeferredValue: function (e) {
            var t = Ue();
            return te === null ? (t.memoizedState = e) : Fh(t, te.memoizedState, e);
        },
        useTransition: function () {
            var e = So(Qr)[0],
                t = Ue().memoizedState;
            return [e, t];
        },
        useMutableSource: Ph,
        useSyncExternalStore: kh,
        useId: Ih,
        unstable_isNewReconciler: !1,
    };
function He(e, t) {
    if (e && e.defaultProps) {
        ((t = G({}, t)), (e = e.defaultProps));
        for (var n in e) t[n] === void 0 && (t[n] = e[n]);
        return t;
    }
    return t;
}
function vl(e, t, n, r) {
    ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : G({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
}
var Fs = {
    isMounted: function (e) {
        return (e = e._reactInternals) ? hn(e) === e : !1;
    },
    enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = ye(),
            i = Nt(e),
            s = ct(r, i);
        ((s.payload = t),
            n != null && (s.callback = n),
            (t = Vt(e, s, i)),
            t !== null && (Ye(t, e, i, r), Bi(t, e, i)));
    },
    enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = ye(),
            i = Nt(e),
            s = ct(r, i);
        ((s.tag = 1),
            (s.payload = t),
            n != null && (s.callback = n),
            (t = Vt(e, s, i)),
            t !== null && (Ye(t, e, i, r), Bi(t, e, i)));
    },
    enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = ye(),
            r = Nt(e),
            i = ct(n, r);
        ((i.tag = 2),
            t != null && (i.callback = t),
            (t = Vt(e, i, r)),
            t !== null && (Ye(t, e, r, n), Bi(t, e, r)));
    },
};
function pc(e, t, n, r, i, s, o) {
    return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == 'function'
            ? e.shouldComponentUpdate(r, s, o)
            : t.prototype && t.prototype.isPureReactComponent
              ? !Br(n, r) || !Br(i, s)
              : !0
    );
}
function Wh(e, t, n) {
    var r = !1,
        i = Ft,
        s = t.contextType;
    return (
        typeof s == 'object' && s !== null
            ? (s = Be(s))
            : ((i = ke(t) ? on : me.current),
              (r = t.contextTypes),
              (s = (r = r != null) ? Bn(e, i) : Ft)),
        (t = new t(n, s)),
        (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
        (t.updater = Fs),
        (e.stateNode = t),
        (t._reactInternals = e),
        r &&
            ((e = e.stateNode),
            (e.__reactInternalMemoizedUnmaskedChildContext = i),
            (e.__reactInternalMemoizedMaskedChildContext = s)),
        t
    );
}
function mc(e, t, n, r) {
    ((e = t.state),
        typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
            t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && Fs.enqueueReplaceState(t, t.state, null));
}
function wl(e, t, n, r) {
    var i = e.stateNode;
    ((i.props = n), (i.state = e.memoizedState), (i.refs = {}), ka(e));
    var s = t.contextType;
    (typeof s == 'object' && s !== null
        ? (i.context = Be(s))
        : ((s = ke(t) ? on : me.current), (i.context = Bn(e, s))),
        (i.state = e.memoizedState),
        (s = t.getDerivedStateFromProps),
        typeof s == 'function' && (vl(e, t, s, n), (i.state = e.memoizedState)),
        typeof t.getDerivedStateFromProps == 'function' ||
            typeof i.getSnapshotBeforeUpdate == 'function' ||
            (typeof i.UNSAFE_componentWillMount != 'function' &&
                typeof i.componentWillMount != 'function') ||
            ((t = i.state),
            typeof i.componentWillMount == 'function' && i.componentWillMount(),
            typeof i.UNSAFE_componentWillMount == 'function' && i.UNSAFE_componentWillMount(),
            t !== i.state && Fs.enqueueReplaceState(i, i.state, null),
            hs(e, n, i, r),
            (i.state = e.memoizedState)),
        typeof i.componentDidMount == 'function' && (e.flags |= 4194308));
}
function Hn(e, t) {
    try {
        var n = '',
            r = t;
        do ((n += Ag(r)), (r = r.return));
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
function To(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function xl(e, t) {
    try {
        console.error(t.value);
    } catch (n) {
        setTimeout(function () {
            throw n;
        });
    }
}
var ev = typeof WeakMap == 'function' ? WeakMap : Map;
function $h(e, t, n) {
    ((n = ct(-1, n)), (n.tag = 3), (n.payload = { element: null }));
    var r = t.value;
    return (
        (n.callback = function () {
            (vs || ((vs = !0), (Dl = r)), xl(e, t));
        }),
        n
    );
}
function Hh(e, t, n) {
    ((n = ct(-1, n)), (n.tag = 3));
    var r = e.type.getDerivedStateFromError;
    if (typeof r == 'function') {
        var i = t.value;
        ((n.payload = function () {
            return r(i);
        }),
            (n.callback = function () {
                xl(e, t);
            }));
    }
    var s = e.stateNode;
    return (
        s !== null &&
            typeof s.componentDidCatch == 'function' &&
            (n.callback = function () {
                (xl(e, t),
                    typeof r != 'function' &&
                        (_t === null ? (_t = new Set([this])) : _t.add(this)));
                var o = t.stack;
                this.componentDidCatch(t.value, { componentStack: o !== null ? o : '' });
            }),
        n
    );
}
function gc(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
        r = e.pingCache = new ev();
        var i = new Set();
        r.set(t, i);
    } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
    i.has(n) || (i.add(n), (e = pv.bind(null, e, t, n)), t.then(e, e));
}
function yc(e) {
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
function vc(e, t, n, r, i) {
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
                        : ((t = ct(-1, 1)), (t.tag = 2), Vt(n, t, 1))),
                (n.lanes |= 1)),
          e);
}
var tv = yt.ReactCurrentOwner,
    Te = !1;
function ge(e, t, n, r) {
    t.child = e === null ? wh(t, null, n, r) : Wn(t, e.child, n, r);
}
function wc(e, t, n, r, i) {
    n = n.render;
    var s = t.ref;
    return (
        Fn(t, i),
        (r = Ra(e, t, n, r, s, i)),
        (n = Da()),
        e !== null && !Te
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), gt(e, t, i))
            : (W && n && ya(t), (t.flags |= 1), ge(e, t, r, i), t.child)
    );
}
function xc(e, t, n, r, i) {
    if (e === null) {
        var s = n.type;
        return typeof s == 'function' &&
            !Ba(s) &&
            s.defaultProps === void 0 &&
            n.compare === null &&
            n.defaultProps === void 0
            ? ((t.tag = 15), (t.type = s), Kh(e, t, s, r, i))
            : ((e = Gi(n.type, null, r, t, t.mode, i)),
              (e.ref = t.ref),
              (e.return = t),
              (t.child = e));
    }
    if (((s = e.child), !(e.lanes & i))) {
        var o = s.memoizedProps;
        if (((n = n.compare), (n = n !== null ? n : Br), n(o, r) && e.ref === t.ref))
            return gt(e, t, i);
    }
    return ((t.flags |= 1), (e = jt(s, r)), (e.ref = t.ref), (e.return = t), (t.child = e));
}
function Kh(e, t, n, r, i) {
    if (e !== null) {
        var s = e.memoizedProps;
        if (Br(s, r) && e.ref === t.ref)
            if (((Te = !1), (t.pendingProps = r = s), (e.lanes & i) !== 0))
                e.flags & 131072 && (Te = !0);
            else return ((t.lanes = e.lanes), gt(e, t, i));
    }
    return Sl(e, t, n, r, i);
}
function Gh(e, t, n) {
    var r = t.pendingProps,
        i = r.children,
        s = e !== null ? e.memoizedState : null;
    if (r.mode === 'hidden')
        if (!(t.mode & 1))
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                z(An, Ee),
                (Ee |= n));
        else {
            if (!(n & 1073741824))
                return (
                    (e = s !== null ? s.baseLanes | n : n),
                    (t.lanes = t.childLanes = 1073741824),
                    (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
                    (t.updateQueue = null),
                    z(An, Ee),
                    (Ee |= e),
                    null
                );
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                (r = s !== null ? s.baseLanes : n),
                z(An, Ee),
                (Ee |= r));
        }
    else
        (s !== null ? ((r = s.baseLanes | n), (t.memoizedState = null)) : (r = n),
            z(An, Ee),
            (Ee |= r));
    return (ge(e, t, i, n), t.child);
}
function Qh(e, t) {
    var n = t.ref;
    ((e === null && n !== null) || (e !== null && e.ref !== n)) &&
        ((t.flags |= 512), (t.flags |= 2097152));
}
function Sl(e, t, n, r, i) {
    var s = ke(n) ? on : me.current;
    return (
        (s = Bn(t, s)),
        Fn(t, i),
        (n = Ra(e, t, n, r, s, i)),
        (r = Da()),
        e !== null && !Te
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), gt(e, t, i))
            : (W && r && ya(t), (t.flags |= 1), ge(e, t, n, i), t.child)
    );
}
function Sc(e, t, n, r, i) {
    if (ke(n)) {
        var s = !0;
        as(t);
    } else s = !1;
    if ((Fn(t, i), t.stateNode === null)) ($i(e, t), Wh(t, n, r), wl(t, n, r, i), (r = !0));
    else if (e === null) {
        var o = t.stateNode,
            l = t.memoizedProps;
        o.props = l;
        var a = o.context,
            u = n.contextType;
        typeof u == 'object' && u !== null
            ? (u = Be(u))
            : ((u = ke(n) ? on : me.current), (u = Bn(t, u)));
        var c = n.getDerivedStateFromProps,
            f = typeof c == 'function' || typeof o.getSnapshotBeforeUpdate == 'function';
        (f ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((l !== r || a !== u) && mc(t, o, r, u)),
            (Pt = !1));
        var d = t.memoizedState;
        ((o.state = d),
            hs(t, r, o, i),
            (a = t.memoizedState),
            l !== r || d !== a || Pe.current || Pt
                ? (typeof c == 'function' && (vl(t, n, c, r), (a = t.memoizedState)),
                  (l = Pt || pc(t, n, l, r, d, a, u))
                      ? (f ||
                            (typeof o.UNSAFE_componentWillMount != 'function' &&
                                typeof o.componentWillMount != 'function') ||
                            (typeof o.componentWillMount == 'function' && o.componentWillMount(),
                            typeof o.UNSAFE_componentWillMount == 'function' &&
                                o.UNSAFE_componentWillMount()),
                        typeof o.componentDidMount == 'function' && (t.flags |= 4194308))
                      : (typeof o.componentDidMount == 'function' && (t.flags |= 4194308),
                        (t.memoizedProps = r),
                        (t.memoizedState = a)),
                  (o.props = r),
                  (o.state = a),
                  (o.context = u),
                  (r = l))
                : (typeof o.componentDidMount == 'function' && (t.flags |= 4194308), (r = !1)));
    } else {
        ((o = t.stateNode),
            Sh(e, t),
            (l = t.memoizedProps),
            (u = t.type === t.elementType ? l : He(t.type, l)),
            (o.props = u),
            (f = t.pendingProps),
            (d = o.context),
            (a = n.contextType),
            typeof a == 'object' && a !== null
                ? (a = Be(a))
                : ((a = ke(n) ? on : me.current), (a = Bn(t, a))));
        var g = n.getDerivedStateFromProps;
        ((c = typeof g == 'function' || typeof o.getSnapshotBeforeUpdate == 'function') ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((l !== f || d !== a) && mc(t, o, r, a)),
            (Pt = !1),
            (d = t.memoizedState),
            (o.state = d),
            hs(t, r, o, i));
        var y = t.memoizedState;
        l !== f || d !== y || Pe.current || Pt
            ? (typeof g == 'function' && (vl(t, n, g, r), (y = t.memoizedState)),
              (u = Pt || pc(t, n, u, r, d, y, a) || !1)
                  ? (c ||
                        (typeof o.UNSAFE_componentWillUpdate != 'function' &&
                            typeof o.componentWillUpdate != 'function') ||
                        (typeof o.componentWillUpdate == 'function' &&
                            o.componentWillUpdate(r, y, a),
                        typeof o.UNSAFE_componentWillUpdate == 'function' &&
                            o.UNSAFE_componentWillUpdate(r, y, a)),
                    typeof o.componentDidUpdate == 'function' && (t.flags |= 4),
                    typeof o.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
                  : (typeof o.componentDidUpdate != 'function' ||
                        (l === e.memoizedProps && d === e.memoizedState) ||
                        (t.flags |= 4),
                    typeof o.getSnapshotBeforeUpdate != 'function' ||
                        (l === e.memoizedProps && d === e.memoizedState) ||
                        (t.flags |= 1024),
                    (t.memoizedProps = r),
                    (t.memoizedState = y)),
              (o.props = r),
              (o.state = y),
              (o.context = a),
              (r = u))
            : (typeof o.componentDidUpdate != 'function' ||
                  (l === e.memoizedProps && d === e.memoizedState) ||
                  (t.flags |= 4),
              typeof o.getSnapshotBeforeUpdate != 'function' ||
                  (l === e.memoizedProps && d === e.memoizedState) ||
                  (t.flags |= 1024),
              (r = !1));
    }
    return Tl(e, t, n, r, s, i);
}
function Tl(e, t, n, r, i, s) {
    Qh(e, t);
    var o = (t.flags & 128) !== 0;
    if (!r && !o) return (i && oc(t, n, !1), gt(e, t, s));
    ((r = t.stateNode), (tv.current = t));
    var l = o && typeof n.getDerivedStateFromError != 'function' ? null : r.render();
    return (
        (t.flags |= 1),
        e !== null && o
            ? ((t.child = Wn(t, e.child, null, s)), (t.child = Wn(t, null, l, s)))
            : ge(e, t, l, s),
        (t.memoizedState = r.state),
        i && oc(t, n, !0),
        t.child
    );
}
function Yh(e) {
    var t = e.stateNode;
    (t.pendingContext
        ? sc(e, t.pendingContext, t.pendingContext !== t.context)
        : t.context && sc(e, t.context, !1),
        Ca(e, t.containerInfo));
}
function Tc(e, t, n, r, i) {
    return (Un(), wa(i), (t.flags |= 256), ge(e, t, n, r), t.child);
}
var Pl = { dehydrated: null, treeContext: null, retryLane: 0 };
function kl(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
}
function Xh(e, t, n) {
    var r = t.pendingProps,
        i = $.current,
        s = !1,
        o = (t.flags & 128) !== 0,
        l;
    if (
        ((l = o) || (l = e !== null && e.memoizedState === null ? !1 : (i & 2) !== 0),
        l ? ((s = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (i |= 1),
        z($, i & 1),
        e === null)
    )
        return (
            gl(t),
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
                            : (s = Bs(o, r, 0, null)),
                        (e = rn(e, r, n, null)),
                        (s.return = t),
                        (e.return = t),
                        (s.sibling = e),
                        (t.child = s),
                        (t.child.memoizedState = kl(n)),
                        (t.memoizedState = Pl),
                        e)
                      : _a(t, o))
        );
    if (((i = e.memoizedState), i !== null && ((l = i.dehydrated), l !== null)))
        return nv(e, t, o, r, l, i, n);
    if (s) {
        ((s = r.fallback), (o = t.mode), (i = e.child), (l = i.sibling));
        var a = { mode: 'hidden', children: r.children };
        return (
            !(o & 1) && t.child !== i
                ? ((r = t.child), (r.childLanes = 0), (r.pendingProps = a), (t.deletions = null))
                : ((r = jt(i, a)), (r.subtreeFlags = i.subtreeFlags & 14680064)),
            l !== null ? (s = jt(l, s)) : ((s = rn(s, o, n, null)), (s.flags |= 2)),
            (s.return = t),
            (r.return = t),
            (r.sibling = s),
            (t.child = r),
            (r = s),
            (s = t.child),
            (o = e.child.memoizedState),
            (o =
                o === null
                    ? kl(n)
                    : { baseLanes: o.baseLanes | n, cachePool: null, transitions: o.transitions }),
            (s.memoizedState = o),
            (s.childLanes = e.childLanes & ~n),
            (t.memoizedState = Pl),
            r
        );
    }
    return (
        (s = e.child),
        (e = s.sibling),
        (r = jt(s, { mode: 'visible', children: r.children })),
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
function _a(e, t) {
    return (
        (t = Bs({ mode: 'visible', children: t }, e.mode, 0, null)),
        (t.return = e),
        (e.child = t)
    );
}
function Ai(e, t, n, r) {
    return (
        r !== null && wa(r),
        Wn(t, e.child, null, n),
        (e = _a(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
    );
}
function nv(e, t, n, r, i, s, o) {
    if (n)
        return t.flags & 256
            ? ((t.flags &= -257), (r = To(Error(P(422)))), Ai(e, t, o, r))
            : t.memoizedState !== null
              ? ((t.child = e.child), (t.flags |= 128), null)
              : ((s = r.fallback),
                (i = t.mode),
                (r = Bs({ mode: 'visible', children: r.children }, i, 0, null)),
                (s = rn(s, i, o, null)),
                (s.flags |= 2),
                (r.return = t),
                (s.return = t),
                (r.sibling = s),
                (t.child = r),
                t.mode & 1 && Wn(t, e.child, null, o),
                (t.child.memoizedState = kl(o)),
                (t.memoizedState = Pl),
                s);
    if (!(t.mode & 1)) return Ai(e, t, o, null);
    if (i.data === '$!') {
        if (((r = i.nextSibling && i.nextSibling.dataset), r)) var l = r.dgst;
        return ((r = l), (s = Error(P(419))), (r = To(s, r, void 0)), Ai(e, t, o, r));
    }
    if (((l = (o & e.childLanes) !== 0), Te || l)) {
        if (((r = le), r !== null)) {
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
                i !== 0 && i !== s.retryLane && ((s.retryLane = i), mt(e, i), Ye(r, e, i, -1)));
        }
        return (za(), (r = To(Error(P(421)))), Ai(e, t, o, r));
    }
    return i.data === '$?'
        ? ((t.flags |= 128), (t.child = e.child), (t = mv.bind(null, e)), (i._reactRetry = t), null)
        : ((e = s.treeContext),
          (Ae = Lt(i.nextSibling)),
          (Me = t),
          (W = !0),
          (Ge = null),
          e !== null &&
              ((je[Oe++] = at),
              (je[Oe++] = ut),
              (je[Oe++] = ln),
              (at = e.id),
              (ut = e.overflow),
              (ln = t)),
          (t = _a(t, r.children)),
          (t.flags |= 4096),
          t);
}
function Pc(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    (r !== null && (r.lanes |= t), yl(e.return, t, n));
}
function Po(e, t, n, r, i) {
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
function Zh(e, t, n) {
    var r = t.pendingProps,
        i = r.revealOrder,
        s = r.tail;
    if ((ge(e, t, r.children, n), (r = $.current), r & 2)) ((r = (r & 1) | 2), (t.flags |= 128));
    else {
        if (e !== null && e.flags & 128)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13) e.memoizedState !== null && Pc(e, n, t);
                else if (e.tag === 19) Pc(e, n, t);
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
    if ((z($, r), !(t.mode & 1))) t.memoizedState = null;
    else
        switch (i) {
            case 'forwards':
                for (n = t.child, i = null; n !== null; )
                    ((e = n.alternate), e !== null && ps(e) === null && (i = n), (n = n.sibling));
                ((n = i),
                    n === null
                        ? ((i = t.child), (t.child = null))
                        : ((i = n.sibling), (n.sibling = null)),
                    Po(t, !1, i, n, s));
                break;
            case 'backwards':
                for (n = null, i = t.child, t.child = null; i !== null; ) {
                    if (((e = i.alternate), e !== null && ps(e) === null)) {
                        t.child = i;
                        break;
                    }
                    ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
                }
                Po(t, !0, n, null, s);
                break;
            case 'together':
                Po(t, !1, null, null, void 0);
                break;
            default:
                t.memoizedState = null;
        }
    return t.child;
}
function $i(e, t) {
    !(t.mode & 1) && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function gt(e, t, n) {
    if ((e !== null && (t.dependencies = e.dependencies), (un |= t.lanes), !(n & t.childLanes)))
        return null;
    if (e !== null && t.child !== e.child) throw Error(P(153));
    if (t.child !== null) {
        for (
            e = t.child, n = jt(e, e.pendingProps), t.child = n, n.return = t;
            e.sibling !== null;
        )
            ((e = e.sibling), (n = n.sibling = jt(e, e.pendingProps)), (n.return = t));
        n.sibling = null;
    }
    return t.child;
}
function rv(e, t, n) {
    switch (t.tag) {
        case 3:
            (Yh(t), Un());
            break;
        case 5:
            Th(t);
            break;
        case 1:
            ke(t.type) && as(t);
            break;
        case 4:
            Ca(t, t.stateNode.containerInfo);
            break;
        case 10:
            var r = t.type._context,
                i = t.memoizedProps.value;
            (z(fs, r._currentValue), (r._currentValue = i));
            break;
        case 13:
            if (((r = t.memoizedState), r !== null))
                return r.dehydrated !== null
                    ? (z($, $.current & 1), (t.flags |= 128), null)
                    : n & t.child.childLanes
                      ? Xh(e, t, n)
                      : (z($, $.current & 1), (e = gt(e, t, n)), e !== null ? e.sibling : null);
            z($, $.current & 1);
            break;
        case 19:
            if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
                if (r) return Zh(e, t, n);
                t.flags |= 128;
            }
            if (
                ((i = t.memoizedState),
                i !== null && ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
                z($, $.current),
                r)
            )
                break;
            return null;
        case 22:
        case 23:
            return ((t.lanes = 0), Gh(e, t, n));
    }
    return gt(e, t, n);
}
var qh, Cl, Jh, bh;
qh = function (e, t) {
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
Cl = function () {};
Jh = function (e, t, n, r) {
    var i = e.memoizedProps;
    if (i !== r) {
        ((e = t.stateNode), bt(nt.current));
        var s = null;
        switch (n) {
            case 'input':
                ((i = Qo(e, i)), (r = Qo(e, r)), (s = []));
                break;
            case 'select':
                ((i = G({}, i, { value: void 0 })), (r = G({}, r, { value: void 0 })), (s = []));
                break;
            case 'textarea':
                ((i = Zo(e, i)), (r = Zo(e, r)), (s = []));
                break;
            default:
                typeof i.onClick != 'function' &&
                    typeof r.onClick == 'function' &&
                    (e.onclick = os);
        }
        Jo(n, r);
        var o;
        n = null;
        for (u in i)
            if (!r.hasOwnProperty(u) && i.hasOwnProperty(u) && i[u] != null)
                if (u === 'style') {
                    var l = i[u];
                    for (o in l) l.hasOwnProperty(o) && (n || (n = {}), (n[o] = ''));
                } else
                    u !== 'dangerouslySetInnerHTML' &&
                        u !== 'children' &&
                        u !== 'suppressContentEditableWarning' &&
                        u !== 'suppressHydrationWarning' &&
                        u !== 'autoFocus' &&
                        (_r.hasOwnProperty(u) ? s || (s = []) : (s = s || []).push(u, null));
        for (u in r) {
            var a = r[u];
            if (
                ((l = i != null ? i[u] : void 0),
                r.hasOwnProperty(u) && a !== l && (a != null || l != null))
            )
                if (u === 'style')
                    if (l) {
                        for (o in l)
                            !l.hasOwnProperty(o) ||
                                (a && a.hasOwnProperty(o)) ||
                                (n || (n = {}), (n[o] = ''));
                        for (o in a)
                            a.hasOwnProperty(o) && l[o] !== a[o] && (n || (n = {}), (n[o] = a[o]));
                    } else (n || (s || (s = []), s.push(u, n)), (n = a));
                else
                    u === 'dangerouslySetInnerHTML'
                        ? ((a = a ? a.__html : void 0),
                          (l = l ? l.__html : void 0),
                          a != null && l !== a && (s = s || []).push(u, a))
                        : u === 'children'
                          ? (typeof a != 'string' && typeof a != 'number') ||
                            (s = s || []).push(u, '' + a)
                          : u !== 'suppressContentEditableWarning' &&
                            u !== 'suppressHydrationWarning' &&
                            (_r.hasOwnProperty(u)
                                ? (a != null && u === 'onScroll' && B('scroll', e),
                                  s || l === a || (s = []))
                                : (s = s || []).push(u, a));
        }
        n && (s = s || []).push('style', n);
        var u = s;
        (t.updateQueue = u) && (t.flags |= 4);
    }
};
bh = function (e, t, n, r) {
    n !== r && (t.flags |= 4);
};
function lr(e, t) {
    if (!W)
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
function de(e) {
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
function iv(e, t, n) {
    var r = t.pendingProps;
    switch ((va(t), t.tag)) {
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
            return (de(t), null);
        case 1:
            return (ke(t.type) && ls(), de(t), null);
        case 3:
            return (
                (r = t.stateNode),
                $n(),
                U(Pe),
                U(me),
                Aa(),
                r.pendingContext && ((r.context = r.pendingContext), (r.pendingContext = null)),
                (e === null || e.child === null) &&
                    (Ci(t)
                        ? (t.flags |= 4)
                        : e === null ||
                          (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                          ((t.flags |= 1024), Ge !== null && (_l(Ge), (Ge = null)))),
                Cl(e, t),
                de(t),
                null
            );
        case 5:
            Ea(t);
            var i = bt(Kr.current);
            if (((n = t.type), e !== null && t.stateNode != null))
                (Jh(e, t, n, r, i), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
            else {
                if (!r) {
                    if (t.stateNode === null) throw Error(P(166));
                    return (de(t), null);
                }
                if (((e = bt(nt.current)), Ci(t))) {
                    ((r = t.stateNode), (n = t.type));
                    var s = t.memoizedProps;
                    switch (((r[be] = t), (r[$r] = s), (e = (t.mode & 1) !== 0), n)) {
                        case 'dialog':
                            (B('cancel', r), B('close', r));
                            break;
                        case 'iframe':
                        case 'object':
                        case 'embed':
                            B('load', r);
                            break;
                        case 'video':
                        case 'audio':
                            for (i = 0; i < pr.length; i++) B(pr[i], r);
                            break;
                        case 'source':
                            B('error', r);
                            break;
                        case 'img':
                        case 'image':
                        case 'link':
                            (B('error', r), B('load', r));
                            break;
                        case 'details':
                            B('toggle', r);
                            break;
                        case 'input':
                            (Vu(r, s), B('invalid', r));
                            break;
                        case 'select':
                            ((r._wrapperState = { wasMultiple: !!s.multiple }), B('invalid', r));
                            break;
                        case 'textarea':
                            (Nu(r, s), B('invalid', r));
                    }
                    (Jo(n, s), (i = null));
                    for (var o in s)
                        if (s.hasOwnProperty(o)) {
                            var l = s[o];
                            o === 'children'
                                ? typeof l == 'string'
                                    ? r.textContent !== l &&
                                      (s.suppressHydrationWarning !== !0 && ki(r.textContent, l, e),
                                      (i = ['children', l]))
                                    : typeof l == 'number' &&
                                      r.textContent !== '' + l &&
                                      (s.suppressHydrationWarning !== !0 && ki(r.textContent, l, e),
                                      (i = ['children', '' + l]))
                                : _r.hasOwnProperty(o) &&
                                  l != null &&
                                  o === 'onScroll' &&
                                  B('scroll', r);
                        }
                    switch (n) {
                        case 'input':
                            (gi(r), _u(r, s, !0));
                            break;
                        case 'textarea':
                            (gi(r), ju(r));
                            break;
                        case 'select':
                        case 'option':
                            break;
                        default:
                            typeof s.onClick == 'function' && (r.onclick = os);
                    }
                    ((r = i), (t.updateQueue = r), r !== null && (t.flags |= 4));
                } else {
                    ((o = i.nodeType === 9 ? i : i.ownerDocument),
                        e === 'http://www.w3.org/1999/xhtml' && (e = Ad(n)),
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
                        (e[be] = t),
                        (e[$r] = r),
                        qh(e, t, !1, !1),
                        (t.stateNode = e));
                    e: {
                        switch (((o = bo(n, r)), n)) {
                            case 'dialog':
                                (B('cancel', e), B('close', e), (i = r));
                                break;
                            case 'iframe':
                            case 'object':
                            case 'embed':
                                (B('load', e), (i = r));
                                break;
                            case 'video':
                            case 'audio':
                                for (i = 0; i < pr.length; i++) B(pr[i], e);
                                i = r;
                                break;
                            case 'source':
                                (B('error', e), (i = r));
                                break;
                            case 'img':
                            case 'image':
                            case 'link':
                                (B('error', e), B('load', e), (i = r));
                                break;
                            case 'details':
                                (B('toggle', e), (i = r));
                                break;
                            case 'input':
                                (Vu(e, r), (i = Qo(e, r)), B('invalid', e));
                                break;
                            case 'option':
                                i = r;
                                break;
                            case 'select':
                                ((e._wrapperState = { wasMultiple: !!r.multiple }),
                                    (i = G({}, r, { value: void 0 })),
                                    B('invalid', e));
                                break;
                            case 'textarea':
                                (Nu(e, r), (i = Zo(e, r)), B('invalid', e));
                                break;
                            default:
                                i = r;
                        }
                        (Jo(n, i), (l = i));
                        for (s in l)
                            if (l.hasOwnProperty(s)) {
                                var a = l[s];
                                s === 'style'
                                    ? Dd(e, a)
                                    : s === 'dangerouslySetInnerHTML'
                                      ? ((a = a ? a.__html : void 0), a != null && Md(e, a))
                                      : s === 'children'
                                        ? typeof a == 'string'
                                            ? (n !== 'textarea' || a !== '') && Nr(e, a)
                                            : typeof a == 'number' && Nr(e, '' + a)
                                        : s !== 'suppressContentEditableWarning' &&
                                          s !== 'suppressHydrationWarning' &&
                                          s !== 'autoFocus' &&
                                          (_r.hasOwnProperty(s)
                                              ? a != null && s === 'onScroll' && B('scroll', e)
                                              : a != null && ra(e, s, a, o));
                            }
                        switch (n) {
                            case 'input':
                                (gi(e), _u(e, r, !1));
                                break;
                            case 'textarea':
                                (gi(e), ju(e));
                                break;
                            case 'option':
                                r.value != null && e.setAttribute('value', '' + Ot(r.value));
                                break;
                            case 'select':
                                ((e.multiple = !!r.multiple),
                                    (s = r.value),
                                    s != null
                                        ? _n(e, !!r.multiple, s, !1)
                                        : r.defaultValue != null &&
                                          _n(e, !!r.multiple, r.defaultValue, !0));
                                break;
                            default:
                                typeof i.onClick == 'function' && (e.onclick = os);
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
            return (de(t), null);
        case 6:
            if (e && t.stateNode != null) bh(e, t, e.memoizedProps, r);
            else {
                if (typeof r != 'string' && t.stateNode === null) throw Error(P(166));
                if (((n = bt(Kr.current)), bt(nt.current), Ci(t))) {
                    if (
                        ((r = t.stateNode),
                        (n = t.memoizedProps),
                        (r[be] = t),
                        (s = r.nodeValue !== n) && ((e = Me), e !== null))
                    )
                        switch (e.tag) {
                            case 3:
                                ki(r.nodeValue, n, (e.mode & 1) !== 0);
                                break;
                            case 5:
                                e.memoizedProps.suppressHydrationWarning !== !0 &&
                                    ki(r.nodeValue, n, (e.mode & 1) !== 0);
                        }
                    s && (t.flags |= 4);
                } else
                    ((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)),
                        (r[be] = t),
                        (t.stateNode = r));
            }
            return (de(t), null);
        case 13:
            if (
                (U($),
                (r = t.memoizedState),
                e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
            ) {
                if (W && Ae !== null && t.mode & 1 && !(t.flags & 128))
                    (yh(), Un(), (t.flags |= 98560), (s = !1));
                else if (((s = Ci(t)), r !== null && r.dehydrated !== null)) {
                    if (e === null) {
                        if (!s) throw Error(P(318));
                        if (((s = t.memoizedState), (s = s !== null ? s.dehydrated : null), !s))
                            throw Error(P(317));
                        s[be] = t;
                    } else (Un(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
                    (de(t), (s = !1));
                } else (Ge !== null && (_l(Ge), (Ge = null)), (s = !0));
                if (!s) return t.flags & 65536 ? t : null;
            }
            return t.flags & 128
                ? ((t.lanes = n), t)
                : ((r = r !== null),
                  r !== (e !== null && e.memoizedState !== null) &&
                      r &&
                      ((t.child.flags |= 8192),
                      t.mode & 1 && (e === null || $.current & 1 ? ne === 0 && (ne = 3) : za())),
                  t.updateQueue !== null && (t.flags |= 4),
                  de(t),
                  null);
        case 4:
            return ($n(), Cl(e, t), e === null && Ur(t.stateNode.containerInfo), de(t), null);
        case 10:
            return (Ta(t.type._context), de(t), null);
        case 17:
            return (ke(t.type) && ls(), de(t), null);
        case 19:
            if ((U($), (s = t.memoizedState), s === null)) return (de(t), null);
            if (((r = (t.flags & 128) !== 0), (o = s.rendering), o === null))
                if (r) lr(s, !1);
                else {
                    if (ne !== 0 || (e !== null && e.flags & 128))
                        for (e = t.child; e !== null; ) {
                            if (((o = ps(e)), o !== null)) {
                                for (
                                    t.flags |= 128,
                                        lr(s, !1),
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
                                return (z($, ($.current & 1) | 2), t.child);
                            }
                            e = e.sibling;
                        }
                    s.tail !== null &&
                        q() > Kn &&
                        ((t.flags |= 128), (r = !0), lr(s, !1), (t.lanes = 4194304));
                }
            else {
                if (!r)
                    if (((e = ps(o)), e !== null)) {
                        if (
                            ((t.flags |= 128),
                            (r = !0),
                            (n = e.updateQueue),
                            n !== null && ((t.updateQueue = n), (t.flags |= 4)),
                            lr(s, !0),
                            s.tail === null && s.tailMode === 'hidden' && !o.alternate && !W)
                        )
                            return (de(t), null);
                    } else
                        2 * q() - s.renderingStartTime > Kn &&
                            n !== 1073741824 &&
                            ((t.flags |= 128), (r = !0), lr(s, !1), (t.lanes = 4194304));
                s.isBackwards
                    ? ((o.sibling = t.child), (t.child = o))
                    : ((n = s.last), n !== null ? (n.sibling = o) : (t.child = o), (s.last = o));
            }
            return s.tail !== null
                ? ((t = s.tail),
                  (s.rendering = t),
                  (s.tail = t.sibling),
                  (s.renderingStartTime = q()),
                  (t.sibling = null),
                  (n = $.current),
                  z($, r ? (n & 1) | 2 : n & 1),
                  t)
                : (de(t), null);
        case 22:
        case 23:
            return (
                Ia(),
                (r = t.memoizedState !== null),
                e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
                r && t.mode & 1
                    ? Ee & 1073741824 && (de(t), t.subtreeFlags & 6 && (t.flags |= 8192))
                    : de(t),
                null
            );
        case 24:
            return null;
        case 25:
            return null;
    }
    throw Error(P(156, t.tag));
}
function sv(e, t) {
    switch ((va(t), t.tag)) {
        case 1:
            return (
                ke(t.type) && ls(),
                (e = t.flags),
                e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 3:
            return (
                $n(),
                U(Pe),
                U(me),
                Aa(),
                (e = t.flags),
                e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 5:
            return (Ea(t), null);
        case 13:
            if ((U($), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
                if (t.alternate === null) throw Error(P(340));
                Un();
            }
            return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 19:
            return (U($), null);
        case 4:
            return ($n(), null);
        case 10:
            return (Ta(t.type._context), null);
        case 22:
        case 23:
            return (Ia(), null);
        case 24:
            return null;
        default:
            return null;
    }
}
var Mi = !1,
    pe = !1,
    ov = typeof WeakSet == 'function' ? WeakSet : Set,
    M = null;
function En(e, t) {
    var n = e.ref;
    if (n !== null)
        if (typeof n == 'function')
            try {
                n(null);
            } catch (r) {
                Y(e, t, r);
            }
        else n.current = null;
}
function El(e, t, n) {
    try {
        n();
    } catch (r) {
        Y(e, t, r);
    }
}
var kc = !1;
function lv(e, t) {
    if (((ul = rs), (e = ih()), ga(e))) {
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
                        l = -1,
                        a = -1,
                        u = 0,
                        c = 0,
                        f = e,
                        d = null;
                    t: for (;;) {
                        for (
                            var g;
                            f !== n || (i !== 0 && f.nodeType !== 3) || (l = o + i),
                                f !== s || (r !== 0 && f.nodeType !== 3) || (a = o + r),
                                f.nodeType === 3 && (o += f.nodeValue.length),
                                (g = f.firstChild) !== null;
                        )
                            ((d = f), (f = g));
                        for (;;) {
                            if (f === e) break t;
                            if (
                                (d === n && ++u === i && (l = o),
                                d === s && ++c === r && (a = o),
                                (g = f.nextSibling) !== null)
                            )
                                break;
                            ((f = d), (d = f.parentNode));
                        }
                        f = g;
                    }
                    n = l === -1 || a === -1 ? null : { start: l, end: a };
                } else n = null;
            }
        n = n || { start: 0, end: 0 };
    } else n = null;
    for (cl = { focusedElem: e, selectionRange: n }, rs = !1, M = t; M !== null; )
        if (((t = M), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
            ((e.return = t), (M = e));
        else
            for (; M !== null; ) {
                t = M;
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
                                            t.elementType === t.type ? v : He(t.type, v),
                                            S,
                                        );
                                    p.__reactInternalSnapshotBeforeUpdate = h;
                                }
                                break;
                            case 3:
                                var m = t.stateNode.containerInfo;
                                m.nodeType === 1
                                    ? (m.textContent = '')
                                    : m.nodeType === 9 &&
                                      m.documentElement &&
                                      m.removeChild(m.documentElement);
                                break;
                            case 5:
                            case 6:
                            case 4:
                            case 17:
                                break;
                            default:
                                throw Error(P(163));
                        }
                } catch (w) {
                    Y(t, t.return, w);
                }
                if (((e = t.sibling), e !== null)) {
                    ((e.return = t.return), (M = e));
                    break;
                }
                M = t.return;
            }
    return ((y = kc), (kc = !1), y);
}
function kr(e, t, n) {
    var r = t.updateQueue;
    if (((r = r !== null ? r.lastEffect : null), r !== null)) {
        var i = (r = r.next);
        do {
            if ((i.tag & e) === e) {
                var s = i.destroy;
                ((i.destroy = void 0), s !== void 0 && El(t, n, s));
            }
            i = i.next;
        } while (i !== r);
    }
}
function Is(e, t) {
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
function Al(e) {
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
function ep(e) {
    var t = e.alternate;
    (t !== null && ((e.alternate = null), ep(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 &&
            ((t = e.stateNode),
            t !== null && (delete t[be], delete t[$r], delete t[hl], delete t[$y], delete t[Hy])),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
}
function tp(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Cc(e) {
    e: for (;;) {
        for (; e.sibling === null; ) {
            if (e.return === null || tp(e.return)) return null;
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
function Ml(e, t, n) {
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
                  n != null || t.onclick !== null || (t.onclick = os)));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (Ml(e, t, n), e = e.sibling; e !== null; ) (Ml(e, t, n), (e = e.sibling));
}
function Rl(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (Rl(e, t, n), e = e.sibling; e !== null; ) (Rl(e, t, n), (e = e.sibling));
}
var ae = null,
    Ke = !1;
function wt(e, t, n) {
    for (n = n.child; n !== null; ) (np(e, t, n), (n = n.sibling));
}
function np(e, t, n) {
    if (tt && typeof tt.onCommitFiberUnmount == 'function')
        try {
            tt.onCommitFiberUnmount(Ds, n);
        } catch {}
    switch (n.tag) {
        case 5:
            pe || En(n, t);
        case 6:
            var r = ae,
                i = Ke;
            ((ae = null),
                wt(e, t, n),
                (ae = r),
                (Ke = i),
                ae !== null &&
                    (Ke
                        ? ((e = ae),
                          (n = n.stateNode),
                          e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
                        : ae.removeChild(n.stateNode)));
            break;
        case 18:
            ae !== null &&
                (Ke
                    ? ((e = ae),
                      (n = n.stateNode),
                      e.nodeType === 8 ? go(e.parentNode, n) : e.nodeType === 1 && go(e, n),
                      Ir(e))
                    : go(ae, n.stateNode));
            break;
        case 4:
            ((r = ae),
                (i = Ke),
                (ae = n.stateNode.containerInfo),
                (Ke = !0),
                wt(e, t, n),
                (ae = r),
                (Ke = i));
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            if (!pe && ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))) {
                i = r = r.next;
                do {
                    var s = i,
                        o = s.destroy;
                    ((s = s.tag), o !== void 0 && (s & 2 || s & 4) && El(n, t, o), (i = i.next));
                } while (i !== r);
            }
            wt(e, t, n);
            break;
        case 1:
            if (!pe && (En(n, t), (r = n.stateNode), typeof r.componentWillUnmount == 'function'))
                try {
                    ((r.props = n.memoizedProps),
                        (r.state = n.memoizedState),
                        r.componentWillUnmount());
                } catch (l) {
                    Y(n, t, l);
                }
            wt(e, t, n);
            break;
        case 21:
            wt(e, t, n);
            break;
        case 22:
            n.mode & 1
                ? ((pe = (r = pe) || n.memoizedState !== null), wt(e, t, n), (pe = r))
                : wt(e, t, n);
            break;
        default:
            wt(e, t, n);
    }
}
function Ec(e) {
    var t = e.updateQueue;
    if (t !== null) {
        e.updateQueue = null;
        var n = e.stateNode;
        (n === null && (n = e.stateNode = new ov()),
            t.forEach(function (r) {
                var i = gv.bind(null, e, r);
                n.has(r) || (n.add(r), r.then(i, i));
            }));
    }
}
function We(e, t) {
    var n = t.deletions;
    if (n !== null)
        for (var r = 0; r < n.length; r++) {
            var i = n[r];
            try {
                var s = e,
                    o = t,
                    l = o;
                e: for (; l !== null; ) {
                    switch (l.tag) {
                        case 5:
                            ((ae = l.stateNode), (Ke = !1));
                            break e;
                        case 3:
                            ((ae = l.stateNode.containerInfo), (Ke = !0));
                            break e;
                        case 4:
                            ((ae = l.stateNode.containerInfo), (Ke = !0));
                            break e;
                    }
                    l = l.return;
                }
                if (ae === null) throw Error(P(160));
                (np(s, o, i), (ae = null), (Ke = !1));
                var a = i.alternate;
                (a !== null && (a.return = null), (i.return = null));
            } catch (u) {
                Y(i, t, u);
            }
        }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) (rp(t, e), (t = t.sibling));
}
function rp(e, t) {
    var n = e.alternate,
        r = e.flags;
    switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            if ((We(t, e), qe(e), r & 4)) {
                try {
                    (kr(3, e, e.return), Is(3, e));
                } catch (v) {
                    Y(e, e.return, v);
                }
                try {
                    kr(5, e, e.return);
                } catch (v) {
                    Y(e, e.return, v);
                }
            }
            break;
        case 1:
            (We(t, e), qe(e), r & 512 && n !== null && En(n, n.return));
            break;
        case 5:
            if ((We(t, e), qe(e), r & 512 && n !== null && En(n, n.return), e.flags & 32)) {
                var i = e.stateNode;
                try {
                    Nr(i, '');
                } catch (v) {
                    Y(e, e.return, v);
                }
            }
            if (r & 4 && ((i = e.stateNode), i != null)) {
                var s = e.memoizedProps,
                    o = n !== null ? n.memoizedProps : s,
                    l = e.type,
                    a = e.updateQueue;
                if (((e.updateQueue = null), a !== null))
                    try {
                        (l === 'input' && s.type === 'radio' && s.name != null && Cd(i, s),
                            bo(l, o));
                        var u = bo(l, s);
                        for (o = 0; o < a.length; o += 2) {
                            var c = a[o],
                                f = a[o + 1];
                            c === 'style'
                                ? Dd(i, f)
                                : c === 'dangerouslySetInnerHTML'
                                  ? Md(i, f)
                                  : c === 'children'
                                    ? Nr(i, f)
                                    : ra(i, c, f, u);
                        }
                        switch (l) {
                            case 'input':
                                Yo(i, s);
                                break;
                            case 'textarea':
                                Ed(i, s);
                                break;
                            case 'select':
                                var d = i._wrapperState.wasMultiple;
                                i._wrapperState.wasMultiple = !!s.multiple;
                                var g = s.value;
                                g != null
                                    ? _n(i, !!s.multiple, g, !1)
                                    : d !== !!s.multiple &&
                                      (s.defaultValue != null
                                          ? _n(i, !!s.multiple, s.defaultValue, !0)
                                          : _n(i, !!s.multiple, s.multiple ? [] : '', !1));
                        }
                        i[$r] = s;
                    } catch (v) {
                        Y(e, e.return, v);
                    }
            }
            break;
        case 6:
            if ((We(t, e), qe(e), r & 4)) {
                if (e.stateNode === null) throw Error(P(162));
                ((i = e.stateNode), (s = e.memoizedProps));
                try {
                    i.nodeValue = s;
                } catch (v) {
                    Y(e, e.return, v);
                }
            }
            break;
        case 3:
            if ((We(t, e), qe(e), r & 4 && n !== null && n.memoizedState.isDehydrated))
                try {
                    Ir(t.containerInfo);
                } catch (v) {
                    Y(e, e.return, v);
                }
            break;
        case 4:
            (We(t, e), qe(e));
            break;
        case 13:
            (We(t, e),
                qe(e),
                (i = e.child),
                i.flags & 8192 &&
                    ((s = i.memoizedState !== null),
                    (i.stateNode.isHidden = s),
                    !s ||
                        (i.alternate !== null && i.alternate.memoizedState !== null) ||
                        (Oa = q())),
                r & 4 && Ec(e));
            break;
        case 22:
            if (
                ((c = n !== null && n.memoizedState !== null),
                e.mode & 1 ? ((pe = (u = pe) || c), We(t, e), (pe = u)) : We(t, e),
                qe(e),
                r & 8192)
            ) {
                if (
                    ((u = e.memoizedState !== null), (e.stateNode.isHidden = u) && !c && e.mode & 1)
                )
                    for (M = e, c = e.child; c !== null; ) {
                        for (f = M = c; M !== null; ) {
                            switch (((d = M), (g = d.child), d.tag)) {
                                case 0:
                                case 11:
                                case 14:
                                case 15:
                                    kr(4, d, d.return);
                                    break;
                                case 1:
                                    En(d, d.return);
                                    var y = d.stateNode;
                                    if (typeof y.componentWillUnmount == 'function') {
                                        ((r = d), (n = d.return));
                                        try {
                                            ((t = r),
                                                (y.props = t.memoizedProps),
                                                (y.state = t.memoizedState),
                                                y.componentWillUnmount());
                                        } catch (v) {
                                            Y(r, n, v);
                                        }
                                    }
                                    break;
                                case 5:
                                    En(d, d.return);
                                    break;
                                case 22:
                                    if (d.memoizedState !== null) {
                                        Mc(f);
                                        continue;
                                    }
                            }
                            g !== null ? ((g.return = d), (M = g)) : Mc(f);
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
                                        : ((l = f.stateNode),
                                          (a = f.memoizedProps.style),
                                          (o =
                                              a != null && a.hasOwnProperty('display')
                                                  ? a.display
                                                  : null),
                                          (l.style.display = Rd('display', o))));
                            } catch (v) {
                                Y(e, e.return, v);
                            }
                        }
                    } else if (f.tag === 6) {
                        if (c === null)
                            try {
                                f.stateNode.nodeValue = u ? '' : f.memoizedProps;
                            } catch (v) {
                                Y(e, e.return, v);
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
            (We(t, e), qe(e), r & 4 && Ec(e));
            break;
        case 21:
            break;
        default:
            (We(t, e), qe(e));
    }
}
function qe(e) {
    var t = e.flags;
    if (t & 2) {
        try {
            e: {
                for (var n = e.return; n !== null; ) {
                    if (tp(n)) {
                        var r = n;
                        break e;
                    }
                    n = n.return;
                }
                throw Error(P(160));
            }
            switch (r.tag) {
                case 5:
                    var i = r.stateNode;
                    r.flags & 32 && (Nr(i, ''), (r.flags &= -33));
                    var s = Cc(e);
                    Rl(e, s, i);
                    break;
                case 3:
                case 4:
                    var o = r.stateNode.containerInfo,
                        l = Cc(e);
                    Ml(e, l, o);
                    break;
                default:
                    throw Error(P(161));
            }
        } catch (a) {
            Y(e, e.return, a);
        }
        e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
}
function av(e, t, n) {
    ((M = e), ip(e));
}
function ip(e, t, n) {
    for (var r = (e.mode & 1) !== 0; M !== null; ) {
        var i = M,
            s = i.child;
        if (i.tag === 22 && r) {
            var o = i.memoizedState !== null || Mi;
            if (!o) {
                var l = i.alternate,
                    a = (l !== null && l.memoizedState !== null) || pe;
                l = Mi;
                var u = pe;
                if (((Mi = o), (pe = a) && !u))
                    for (M = i; M !== null; )
                        ((o = M),
                            (a = o.child),
                            o.tag === 22 && o.memoizedState !== null
                                ? Rc(i)
                                : a !== null
                                  ? ((a.return = o), (M = a))
                                  : Rc(i));
                for (; s !== null; ) ((M = s), ip(s), (s = s.sibling));
                ((M = i), (Mi = l), (pe = u));
            }
            Ac(e);
        } else i.subtreeFlags & 8772 && s !== null ? ((s.return = i), (M = s)) : Ac(e);
    }
}
function Ac(e) {
    for (; M !== null; ) {
        var t = M;
        if (t.flags & 8772) {
            var n = t.alternate;
            try {
                if (t.flags & 8772)
                    switch (t.tag) {
                        case 0:
                        case 11:
                        case 15:
                            pe || Is(5, t);
                            break;
                        case 1:
                            var r = t.stateNode;
                            if (t.flags & 4 && !pe)
                                if (n === null) r.componentDidMount();
                                else {
                                    var i =
                                        t.elementType === t.type
                                            ? n.memoizedProps
                                            : He(t.type, n.memoizedProps);
                                    r.componentDidUpdate(
                                        i,
                                        n.memoizedState,
                                        r.__reactInternalSnapshotBeforeUpdate,
                                    );
                                }
                            var s = t.updateQueue;
                            s !== null && fc(t, s, r);
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
                                fc(t, o, n);
                            }
                            break;
                        case 5:
                            var l = t.stateNode;
                            if (n === null && t.flags & 4) {
                                n = l;
                                var a = t.memoizedProps;
                                switch (t.type) {
                                    case 'button':
                                    case 'input':
                                    case 'select':
                                    case 'textarea':
                                        a.autoFocus && n.focus();
                                        break;
                                    case 'img':
                                        a.src && (n.src = a.src);
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
                                        f !== null && Ir(f);
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
                            throw Error(P(163));
                    }
                pe || (t.flags & 512 && Al(t));
            } catch (d) {
                Y(t, t.return, d);
            }
        }
        if (t === e) {
            M = null;
            break;
        }
        if (((n = t.sibling), n !== null)) {
            ((n.return = t.return), (M = n));
            break;
        }
        M = t.return;
    }
}
function Mc(e) {
    for (; M !== null; ) {
        var t = M;
        if (t === e) {
            M = null;
            break;
        }
        var n = t.sibling;
        if (n !== null) {
            ((n.return = t.return), (M = n));
            break;
        }
        M = t.return;
    }
}
function Rc(e) {
    for (; M !== null; ) {
        var t = M;
        try {
            switch (t.tag) {
                case 0:
                case 11:
                case 15:
                    var n = t.return;
                    try {
                        Is(4, t);
                    } catch (a) {
                        Y(t, n, a);
                    }
                    break;
                case 1:
                    var r = t.stateNode;
                    if (typeof r.componentDidMount == 'function') {
                        var i = t.return;
                        try {
                            r.componentDidMount();
                        } catch (a) {
                            Y(t, i, a);
                        }
                    }
                    var s = t.return;
                    try {
                        Al(t);
                    } catch (a) {
                        Y(t, s, a);
                    }
                    break;
                case 5:
                    var o = t.return;
                    try {
                        Al(t);
                    } catch (a) {
                        Y(t, o, a);
                    }
            }
        } catch (a) {
            Y(t, t.return, a);
        }
        if (t === e) {
            M = null;
            break;
        }
        var l = t.sibling;
        if (l !== null) {
            ((l.return = t.return), (M = l));
            break;
        }
        M = t.return;
    }
}
var uv = Math.ceil,
    ys = yt.ReactCurrentDispatcher,
    Na = yt.ReactCurrentOwner,
    ze = yt.ReactCurrentBatchConfig,
    O = 0,
    le = null,
    J = null,
    ue = 0,
    Ee = 0,
    An = Bt(0),
    ne = 0,
    Xr = null,
    un = 0,
    zs = 0,
    ja = 0,
    Cr = null,
    Se = null,
    Oa = 0,
    Kn = 1 / 0,
    ot = null,
    vs = !1,
    Dl = null,
    _t = null,
    Ri = !1,
    At = null,
    ws = 0,
    Er = 0,
    Ll = null,
    Hi = -1,
    Ki = 0;
function ye() {
    return O & 6 ? q() : Hi !== -1 ? Hi : (Hi = q());
}
function Nt(e) {
    return e.mode & 1
        ? O & 2 && ue !== 0
            ? ue & -ue
            : Gy.transition !== null
              ? (Ki === 0 && (Ki = Wd()), Ki)
              : ((e = I), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : Xd(e.type))), e)
        : 1;
}
function Ye(e, t, n, r) {
    if (50 < Er) throw ((Er = 0), (Ll = null), Error(P(185)));
    (ti(e, n, r),
        (!(O & 2) || e !== le) &&
            (e === le && (!(O & 2) && (zs |= n), ne === 4 && Ct(e, ue)),
            Ce(e, r),
            n === 1 && O === 0 && !(t.mode & 1) && ((Kn = q() + 500), js && Ut())));
}
function Ce(e, t) {
    var n = e.callbackNode;
    Gg(e, t);
    var r = ns(e, e === le ? ue : 0);
    if (r === 0) (n !== null && Iu(n), (e.callbackNode = null), (e.callbackPriority = 0));
    else if (((t = r & -r), e.callbackPriority !== t)) {
        if ((n != null && Iu(n), t === 1))
            (e.tag === 0 ? Ky(Dc.bind(null, e)) : ph(Dc.bind(null, e)),
                Uy(function () {
                    !(O & 6) && Ut();
                }),
                (n = null));
        else {
            switch ($d(r)) {
                case 1:
                    n = aa;
                    break;
                case 4:
                    n = Bd;
                    break;
                case 16:
                    n = ts;
                    break;
                case 536870912:
                    n = Ud;
                    break;
                default:
                    n = ts;
            }
            n = dp(n, sp.bind(null, e));
        }
        ((e.callbackPriority = t), (e.callbackNode = n));
    }
}
function sp(e, t) {
    if (((Hi = -1), (Ki = 0), O & 6)) throw Error(P(327));
    var n = e.callbackNode;
    if (In() && e.callbackNode !== n) return null;
    var r = ns(e, e === le ? ue : 0);
    if (r === 0) return null;
    if (r & 30 || r & e.expiredLanes || t) t = xs(e, r);
    else {
        t = r;
        var i = O;
        O |= 2;
        var s = lp();
        (le !== e || ue !== t) && ((ot = null), (Kn = q() + 500), nn(e, t));
        do
            try {
                dv();
                break;
            } catch (l) {
                op(e, l);
            }
        while (!0);
        (Sa(), (ys.current = s), (O = i), J !== null ? (t = 0) : ((le = null), (ue = 0), (t = ne)));
    }
    if (t !== 0) {
        if ((t === 2 && ((i = il(e)), i !== 0 && ((r = i), (t = Vl(e, i)))), t === 1))
            throw ((n = Xr), nn(e, 0), Ct(e, r), Ce(e, q()), n);
        if (t === 6) Ct(e, r);
        else {
            if (
                ((i = e.current.alternate),
                !(r & 30) &&
                    !cv(i) &&
                    ((t = xs(e, r)),
                    t === 2 && ((s = il(e)), s !== 0 && ((r = s), (t = Vl(e, s)))),
                    t === 1))
            )
                throw ((n = Xr), nn(e, 0), Ct(e, r), Ce(e, q()), n);
            switch (((e.finishedWork = i), (e.finishedLanes = r), t)) {
                case 0:
                case 1:
                    throw Error(P(345));
                case 2:
                    Yt(e, Se, ot);
                    break;
                case 3:
                    if ((Ct(e, r), (r & 130023424) === r && ((t = Oa + 500 - q()), 10 < t))) {
                        if (ns(e, 0) !== 0) break;
                        if (((i = e.suspendedLanes), (i & r) !== r)) {
                            (ye(), (e.pingedLanes |= e.suspendedLanes & i));
                            break;
                        }
                        e.timeoutHandle = dl(Yt.bind(null, e, Se, ot), t);
                        break;
                    }
                    Yt(e, Se, ot);
                    break;
                case 4:
                    if ((Ct(e, r), (r & 4194240) === r)) break;
                    for (t = e.eventTimes, i = -1; 0 < r; ) {
                        var o = 31 - Qe(r);
                        ((s = 1 << o), (o = t[o]), o > i && (i = o), (r &= ~s));
                    }
                    if (
                        ((r = i),
                        (r = q() - r),
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
                                          : 1960 * uv(r / 1960)) - r),
                        10 < r)
                    ) {
                        e.timeoutHandle = dl(Yt.bind(null, e, Se, ot), r);
                        break;
                    }
                    Yt(e, Se, ot);
                    break;
                case 5:
                    Yt(e, Se, ot);
                    break;
                default:
                    throw Error(P(329));
            }
        }
    }
    return (Ce(e, q()), e.callbackNode === n ? sp.bind(null, e) : null);
}
function Vl(e, t) {
    var n = Cr;
    return (
        e.current.memoizedState.isDehydrated && (nn(e, t).flags |= 256),
        (e = xs(e, t)),
        e !== 2 && ((t = Se), (Se = n), t !== null && _l(t)),
        e
    );
}
function _l(e) {
    Se === null ? (Se = e) : Se.push.apply(Se, e);
}
function cv(e) {
    for (var t = e; ; ) {
        if (t.flags & 16384) {
            var n = t.updateQueue;
            if (n !== null && ((n = n.stores), n !== null))
                for (var r = 0; r < n.length; r++) {
                    var i = n[r],
                        s = i.getSnapshot;
                    i = i.value;
                    try {
                        if (!Xe(s(), i)) return !1;
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
function Ct(e, t) {
    for (
        t &= ~ja, t &= ~zs, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes;
        0 < t;
    ) {
        var n = 31 - Qe(t),
            r = 1 << n;
        ((e[n] = -1), (t &= ~r));
    }
}
function Dc(e) {
    if (O & 6) throw Error(P(327));
    In();
    var t = ns(e, 0);
    if (!(t & 1)) return (Ce(e, q()), null);
    var n = xs(e, t);
    if (e.tag !== 0 && n === 2) {
        var r = il(e);
        r !== 0 && ((t = r), (n = Vl(e, r)));
    }
    if (n === 1) throw ((n = Xr), nn(e, 0), Ct(e, t), Ce(e, q()), n);
    if (n === 6) throw Error(P(345));
    return (
        (e.finishedWork = e.current.alternate),
        (e.finishedLanes = t),
        Yt(e, Se, ot),
        Ce(e, q()),
        null
    );
}
function Fa(e, t) {
    var n = O;
    O |= 1;
    try {
        return e(t);
    } finally {
        ((O = n), O === 0 && ((Kn = q() + 500), js && Ut()));
    }
}
function cn(e) {
    At !== null && At.tag === 0 && !(O & 6) && In();
    var t = O;
    O |= 1;
    var n = ze.transition,
        r = I;
    try {
        if (((ze.transition = null), (I = 1), e)) return e();
    } finally {
        ((I = r), (ze.transition = n), (O = t), !(O & 6) && Ut());
    }
}
function Ia() {
    ((Ee = An.current), U(An));
}
function nn(e, t) {
    ((e.finishedWork = null), (e.finishedLanes = 0));
    var n = e.timeoutHandle;
    if ((n !== -1 && ((e.timeoutHandle = -1), By(n)), J !== null))
        for (n = J.return; n !== null; ) {
            var r = n;
            switch ((va(r), r.tag)) {
                case 1:
                    ((r = r.type.childContextTypes), r != null && ls());
                    break;
                case 3:
                    ($n(), U(Pe), U(me), Aa());
                    break;
                case 5:
                    Ea(r);
                    break;
                case 4:
                    $n();
                    break;
                case 13:
                    U($);
                    break;
                case 19:
                    U($);
                    break;
                case 10:
                    Ta(r.type._context);
                    break;
                case 22:
                case 23:
                    Ia();
            }
            n = n.return;
        }
    if (
        ((le = e),
        (J = e = jt(e.current, null)),
        (ue = Ee = t),
        (ne = 0),
        (Xr = null),
        (ja = zs = un = 0),
        (Se = Cr = null),
        Jt !== null)
    ) {
        for (t = 0; t < Jt.length; t++)
            if (((n = Jt[t]), (r = n.interleaved), r !== null)) {
                n.interleaved = null;
                var i = r.next,
                    s = n.pending;
                if (s !== null) {
                    var o = s.next;
                    ((s.next = i), (r.next = o));
                }
                n.pending = r;
            }
        Jt = null;
    }
    return e;
}
function op(e, t) {
    do {
        var n = J;
        try {
            if ((Sa(), (Ui.current = gs), ms)) {
                for (var r = K.memoizedState; r !== null; ) {
                    var i = r.queue;
                    (i !== null && (i.pending = null), (r = r.next));
                }
                ms = !1;
            }
            if (
                ((an = 0),
                (se = te = K = null),
                (Pr = !1),
                (Gr = 0),
                (Na.current = null),
                n === null || n.return === null)
            ) {
                ((ne = 1), (Xr = t), (J = null));
                break;
            }
            e: {
                var s = e,
                    o = n.return,
                    l = n,
                    a = t;
                if (
                    ((t = ue),
                    (l.flags |= 32768),
                    a !== null && typeof a == 'object' && typeof a.then == 'function')
                ) {
                    var u = a,
                        c = l,
                        f = c.tag;
                    if (!(c.mode & 1) && (f === 0 || f === 11 || f === 15)) {
                        var d = c.alternate;
                        d
                            ? ((c.updateQueue = d.updateQueue),
                              (c.memoizedState = d.memoizedState),
                              (c.lanes = d.lanes))
                            : ((c.updateQueue = null), (c.memoizedState = null));
                    }
                    var g = yc(o);
                    if (g !== null) {
                        ((g.flags &= -257),
                            vc(g, o, l, s, t),
                            g.mode & 1 && gc(s, u, t),
                            (t = g),
                            (a = u));
                        var y = t.updateQueue;
                        if (y === null) {
                            var v = new Set();
                            (v.add(a), (t.updateQueue = v));
                        } else y.add(a);
                        break e;
                    } else {
                        if (!(t & 1)) {
                            (gc(s, u, t), za());
                            break e;
                        }
                        a = Error(P(426));
                    }
                } else if (W && l.mode & 1) {
                    var S = yc(o);
                    if (S !== null) {
                        (!(S.flags & 65536) && (S.flags |= 256), vc(S, o, l, s, t), wa(Hn(a, l)));
                        break e;
                    }
                }
                ((s = a = Hn(a, l)),
                    ne !== 4 && (ne = 2),
                    Cr === null ? (Cr = [s]) : Cr.push(s),
                    (s = o));
                do {
                    switch (s.tag) {
                        case 3:
                            ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
                            var p = $h(s, a, t);
                            cc(s, p);
                            break e;
                        case 1:
                            l = a;
                            var h = s.type,
                                m = s.stateNode;
                            if (
                                !(s.flags & 128) &&
                                (typeof h.getDerivedStateFromError == 'function' ||
                                    (m !== null &&
                                        typeof m.componentDidCatch == 'function' &&
                                        (_t === null || !_t.has(m))))
                            ) {
                                ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
                                var w = Hh(s, l, t);
                                cc(s, w);
                                break e;
                            }
                    }
                    s = s.return;
                } while (s !== null);
            }
            up(n);
        } catch (x) {
            ((t = x), J === n && n !== null && (J = n = n.return));
            continue;
        }
        break;
    } while (!0);
}
function lp() {
    var e = ys.current;
    return ((ys.current = gs), e === null ? gs : e);
}
function za() {
    ((ne === 0 || ne === 3 || ne === 2) && (ne = 4),
        le === null || (!(un & 268435455) && !(zs & 268435455)) || Ct(le, ue));
}
function xs(e, t) {
    var n = O;
    O |= 2;
    var r = lp();
    (le !== e || ue !== t) && ((ot = null), nn(e, t));
    do
        try {
            fv();
            break;
        } catch (i) {
            op(e, i);
        }
    while (!0);
    if ((Sa(), (O = n), (ys.current = r), J !== null)) throw Error(P(261));
    return ((le = null), (ue = 0), ne);
}
function fv() {
    for (; J !== null; ) ap(J);
}
function dv() {
    for (; J !== null && !Fg(); ) ap(J);
}
function ap(e) {
    var t = fp(e.alternate, e, Ee);
    ((e.memoizedProps = e.pendingProps), t === null ? up(e) : (J = t), (Na.current = null));
}
function up(e) {
    var t = e;
    do {
        var n = t.alternate;
        if (((e = t.return), t.flags & 32768)) {
            if (((n = sv(n, t)), n !== null)) {
                ((n.flags &= 32767), (J = n));
                return;
            }
            if (e !== null) ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
            else {
                ((ne = 6), (J = null));
                return;
            }
        } else if (((n = iv(n, t, Ee)), n !== null)) {
            J = n;
            return;
        }
        if (((t = t.sibling), t !== null)) {
            J = t;
            return;
        }
        J = t = e;
    } while (t !== null);
    ne === 0 && (ne = 5);
}
function Yt(e, t, n) {
    var r = I,
        i = ze.transition;
    try {
        ((ze.transition = null), (I = 1), hv(e, t, n, r));
    } finally {
        ((ze.transition = i), (I = r));
    }
    return null;
}
function hv(e, t, n, r) {
    do In();
    while (At !== null);
    if (O & 6) throw Error(P(327));
    n = e.finishedWork;
    var i = e.finishedLanes;
    if (n === null) return null;
    if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current)) throw Error(P(177));
    ((e.callbackNode = null), (e.callbackPriority = 0));
    var s = n.lanes | n.childLanes;
    if (
        (Qg(e, s),
        e === le && ((J = le = null), (ue = 0)),
        (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
            Ri ||
            ((Ri = !0),
            dp(ts, function () {
                return (In(), null);
            })),
        (s = (n.flags & 15990) !== 0),
        n.subtreeFlags & 15990 || s)
    ) {
        ((s = ze.transition), (ze.transition = null));
        var o = I;
        I = 1;
        var l = O;
        ((O |= 4),
            (Na.current = null),
            lv(e, n),
            rp(n, e),
            _y(cl),
            (rs = !!ul),
            (cl = ul = null),
            (e.current = n),
            av(n),
            Ig(),
            (O = l),
            (I = o),
            (ze.transition = s));
    } else e.current = n;
    if (
        (Ri && ((Ri = !1), (At = e), (ws = i)),
        (s = e.pendingLanes),
        s === 0 && (_t = null),
        Ug(n.stateNode),
        Ce(e, q()),
        t !== null)
    )
        for (r = e.onRecoverableError, n = 0; n < t.length; n++)
            ((i = t[n]), r(i.value, { componentStack: i.stack, digest: i.digest }));
    if (vs) throw ((vs = !1), (e = Dl), (Dl = null), e);
    return (
        ws & 1 && e.tag !== 0 && In(),
        (s = e.pendingLanes),
        s & 1 ? (e === Ll ? Er++ : ((Er = 0), (Ll = e))) : (Er = 0),
        Ut(),
        null
    );
}
function In() {
    if (At !== null) {
        var e = $d(ws),
            t = ze.transition,
            n = I;
        try {
            if (((ze.transition = null), (I = 16 > e ? 16 : e), At === null)) var r = !1;
            else {
                if (((e = At), (At = null), (ws = 0), O & 6)) throw Error(P(331));
                var i = O;
                for (O |= 4, M = e.current; M !== null; ) {
                    var s = M,
                        o = s.child;
                    if (M.flags & 16) {
                        var l = s.deletions;
                        if (l !== null) {
                            for (var a = 0; a < l.length; a++) {
                                var u = l[a];
                                for (M = u; M !== null; ) {
                                    var c = M;
                                    switch (c.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            kr(8, c, s);
                                    }
                                    var f = c.child;
                                    if (f !== null) ((f.return = c), (M = f));
                                    else
                                        for (; M !== null; ) {
                                            c = M;
                                            var d = c.sibling,
                                                g = c.return;
                                            if ((ep(c), c === u)) {
                                                M = null;
                                                break;
                                            }
                                            if (d !== null) {
                                                ((d.return = g), (M = d));
                                                break;
                                            }
                                            M = g;
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
                            M = s;
                        }
                    }
                    if (s.subtreeFlags & 2064 && o !== null) ((o.return = s), (M = o));
                    else
                        e: for (; M !== null; ) {
                            if (((s = M), s.flags & 2048))
                                switch (s.tag) {
                                    case 0:
                                    case 11:
                                    case 15:
                                        kr(9, s, s.return);
                                }
                            var p = s.sibling;
                            if (p !== null) {
                                ((p.return = s.return), (M = p));
                                break e;
                            }
                            M = s.return;
                        }
                }
                var h = e.current;
                for (M = h; M !== null; ) {
                    o = M;
                    var m = o.child;
                    if (o.subtreeFlags & 2064 && m !== null) ((m.return = o), (M = m));
                    else
                        e: for (o = h; M !== null; ) {
                            if (((l = M), l.flags & 2048))
                                try {
                                    switch (l.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            Is(9, l);
                                    }
                                } catch (x) {
                                    Y(l, l.return, x);
                                }
                            if (l === o) {
                                M = null;
                                break e;
                            }
                            var w = l.sibling;
                            if (w !== null) {
                                ((w.return = l.return), (M = w));
                                break e;
                            }
                            M = l.return;
                        }
                }
                if (((O = i), Ut(), tt && typeof tt.onPostCommitFiberRoot == 'function'))
                    try {
                        tt.onPostCommitFiberRoot(Ds, e);
                    } catch {}
                r = !0;
            }
            return r;
        } finally {
            ((I = n), (ze.transition = t));
        }
    }
    return !1;
}
function Lc(e, t, n) {
    ((t = Hn(n, t)),
        (t = $h(e, t, 1)),
        (e = Vt(e, t, 1)),
        (t = ye()),
        e !== null && (ti(e, 1, t), Ce(e, t)));
}
function Y(e, t, n) {
    if (e.tag === 3) Lc(e, e, n);
    else
        for (; t !== null; ) {
            if (t.tag === 3) {
                Lc(t, e, n);
                break;
            } else if (t.tag === 1) {
                var r = t.stateNode;
                if (
                    typeof t.type.getDerivedStateFromError == 'function' ||
                    (typeof r.componentDidCatch == 'function' && (_t === null || !_t.has(r)))
                ) {
                    ((e = Hn(n, e)),
                        (e = Hh(t, e, 1)),
                        (t = Vt(t, e, 1)),
                        (e = ye()),
                        t !== null && (ti(t, 1, e), Ce(t, e)));
                    break;
                }
            }
            t = t.return;
        }
}
function pv(e, t, n) {
    var r = e.pingCache;
    (r !== null && r.delete(t),
        (t = ye()),
        (e.pingedLanes |= e.suspendedLanes & n),
        le === e &&
            (ue & n) === n &&
            (ne === 4 || (ne === 3 && (ue & 130023424) === ue && 500 > q() - Oa)
                ? nn(e, 0)
                : (ja |= n)),
        Ce(e, t));
}
function cp(e, t) {
    t === 0 && (e.mode & 1 ? ((t = wi), (wi <<= 1), !(wi & 130023424) && (wi = 4194304)) : (t = 1));
    var n = ye();
    ((e = mt(e, t)), e !== null && (ti(e, t, n), Ce(e, n)));
}
function mv(e) {
    var t = e.memoizedState,
        n = 0;
    (t !== null && (n = t.retryLane), cp(e, n));
}
function gv(e, t) {
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
            throw Error(P(314));
    }
    (r !== null && r.delete(t), cp(e, n));
}
var fp;
fp = function (e, t, n) {
    if (e !== null)
        if (e.memoizedProps !== t.pendingProps || Pe.current) Te = !0;
        else {
            if (!(e.lanes & n) && !(t.flags & 128)) return ((Te = !1), rv(e, t, n));
            Te = !!(e.flags & 131072);
        }
    else ((Te = !1), W && t.flags & 1048576 && mh(t, cs, t.index));
    switch (((t.lanes = 0), t.tag)) {
        case 2:
            var r = t.type;
            ($i(e, t), (e = t.pendingProps));
            var i = Bn(t, me.current);
            (Fn(t, n), (i = Ra(null, t, r, e, i, n)));
            var s = Da();
            return (
                (t.flags |= 1),
                typeof i == 'object' &&
                i !== null &&
                typeof i.render == 'function' &&
                i.$$typeof === void 0
                    ? ((t.tag = 1),
                      (t.memoizedState = null),
                      (t.updateQueue = null),
                      ke(r) ? ((s = !0), as(t)) : (s = !1),
                      (t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null),
                      ka(t),
                      (i.updater = Fs),
                      (t.stateNode = i),
                      (i._reactInternals = t),
                      wl(t, r, e, n),
                      (t = Tl(null, t, r, !0, s, n)))
                    : ((t.tag = 0), W && s && ya(t), ge(null, t, i, n), (t = t.child)),
                t
            );
        case 16:
            r = t.elementType;
            e: {
                switch (
                    ($i(e, t),
                    (e = t.pendingProps),
                    (i = r._init),
                    (r = i(r._payload)),
                    (t.type = r),
                    (i = t.tag = vv(r)),
                    (e = He(r, e)),
                    i)
                ) {
                    case 0:
                        t = Sl(null, t, r, e, n);
                        break e;
                    case 1:
                        t = Sc(null, t, r, e, n);
                        break e;
                    case 11:
                        t = wc(null, t, r, e, n);
                        break e;
                    case 14:
                        t = xc(null, t, r, He(r.type, e), n);
                        break e;
                }
                throw Error(P(306, r, ''));
            }
            return t;
        case 0:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : He(r, i)),
                Sl(e, t, r, i, n)
            );
        case 1:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : He(r, i)),
                Sc(e, t, r, i, n)
            );
        case 3:
            e: {
                if ((Yh(t), e === null)) throw Error(P(387));
                ((r = t.pendingProps),
                    (s = t.memoizedState),
                    (i = s.element),
                    Sh(e, t),
                    hs(t, r, null, n));
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
                        ((i = Hn(Error(P(423)), t)), (t = Tc(e, t, r, n, i)));
                        break e;
                    } else if (r !== i) {
                        ((i = Hn(Error(P(424)), t)), (t = Tc(e, t, r, n, i)));
                        break e;
                    } else
                        for (
                            Ae = Lt(t.stateNode.containerInfo.firstChild),
                                Me = t,
                                W = !0,
                                Ge = null,
                                n = wh(t, null, r, n),
                                t.child = n;
                            n;
                        )
                            ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
                else {
                    if ((Un(), r === i)) {
                        t = gt(e, t, n);
                        break e;
                    }
                    ge(e, t, r, n);
                }
                t = t.child;
            }
            return t;
        case 5:
            return (
                Th(t),
                e === null && gl(t),
                (r = t.type),
                (i = t.pendingProps),
                (s = e !== null ? e.memoizedProps : null),
                (o = i.children),
                fl(r, i) ? (o = null) : s !== null && fl(r, s) && (t.flags |= 32),
                Qh(e, t),
                ge(e, t, o, n),
                t.child
            );
        case 6:
            return (e === null && gl(t), null);
        case 13:
            return Xh(e, t, n);
        case 4:
            return (
                Ca(t, t.stateNode.containerInfo),
                (r = t.pendingProps),
                e === null ? (t.child = Wn(t, null, r, n)) : ge(e, t, r, n),
                t.child
            );
        case 11:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : He(r, i)),
                wc(e, t, r, i, n)
            );
        case 7:
            return (ge(e, t, t.pendingProps, n), t.child);
        case 8:
            return (ge(e, t, t.pendingProps.children, n), t.child);
        case 12:
            return (ge(e, t, t.pendingProps.children, n), t.child);
        case 10:
            e: {
                if (
                    ((r = t.type._context),
                    (i = t.pendingProps),
                    (s = t.memoizedProps),
                    (o = i.value),
                    z(fs, r._currentValue),
                    (r._currentValue = o),
                    s !== null)
                )
                    if (Xe(s.value, o)) {
                        if (s.children === i.children && !Pe.current) {
                            t = gt(e, t, n);
                            break e;
                        }
                    } else
                        for (s = t.child, s !== null && (s.return = t); s !== null; ) {
                            var l = s.dependencies;
                            if (l !== null) {
                                o = s.child;
                                for (var a = l.firstContext; a !== null; ) {
                                    if (a.context === r) {
                                        if (s.tag === 1) {
                                            ((a = ct(-1, n & -n)), (a.tag = 2));
                                            var u = s.updateQueue;
                                            if (u !== null) {
                                                u = u.shared;
                                                var c = u.pending;
                                                (c === null
                                                    ? (a.next = a)
                                                    : ((a.next = c.next), (c.next = a)),
                                                    (u.pending = a));
                                            }
                                        }
                                        ((s.lanes |= n),
                                            (a = s.alternate),
                                            a !== null && (a.lanes |= n),
                                            yl(s.return, n, t),
                                            (l.lanes |= n));
                                        break;
                                    }
                                    a = a.next;
                                }
                            } else if (s.tag === 10) o = s.type === t.type ? null : s.child;
                            else if (s.tag === 18) {
                                if (((o = s.return), o === null)) throw Error(P(341));
                                ((o.lanes |= n),
                                    (l = o.alternate),
                                    l !== null && (l.lanes |= n),
                                    yl(o, n, t),
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
                (ge(e, t, i.children, n), (t = t.child));
            }
            return t;
        case 9:
            return (
                (i = t.type),
                (r = t.pendingProps.children),
                Fn(t, n),
                (i = Be(i)),
                (r = r(i)),
                (t.flags |= 1),
                ge(e, t, r, n),
                t.child
            );
        case 14:
            return (
                (r = t.type),
                (i = He(r, t.pendingProps)),
                (i = He(r.type, i)),
                xc(e, t, r, i, n)
            );
        case 15:
            return Kh(e, t, t.type, t.pendingProps, n);
        case 17:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : He(r, i)),
                $i(e, t),
                (t.tag = 1),
                ke(r) ? ((e = !0), as(t)) : (e = !1),
                Fn(t, n),
                Wh(t, r, i),
                wl(t, r, i, n),
                Tl(null, t, r, !0, e, n)
            );
        case 19:
            return Zh(e, t, n);
        case 22:
            return Gh(e, t, n);
    }
    throw Error(P(156, t.tag));
};
function dp(e, t) {
    return zd(e, t);
}
function yv(e, t, n, r) {
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
function Ie(e, t, n, r) {
    return new yv(e, t, n, r);
}
function Ba(e) {
    return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function vv(e) {
    if (typeof e == 'function') return Ba(e) ? 1 : 0;
    if (e != null) {
        if (((e = e.$$typeof), e === sa)) return 11;
        if (e === oa) return 14;
    }
    return 2;
}
function jt(e, t) {
    var n = e.alternate;
    return (
        n === null
            ? ((n = Ie(e.tag, t, e.key, e.mode)),
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
function Gi(e, t, n, r, i, s) {
    var o = 2;
    if (((r = e), typeof e == 'function')) Ba(e) && (o = 1);
    else if (typeof e == 'string') o = 5;
    else
        e: switch (e) {
            case yn:
                return rn(n.children, i, s, t);
            case ia:
                ((o = 8), (i |= 8));
                break;
            case $o:
                return ((e = Ie(12, n, t, i | 2)), (e.elementType = $o), (e.lanes = s), e);
            case Ho:
                return ((e = Ie(13, n, t, i)), (e.elementType = Ho), (e.lanes = s), e);
            case Ko:
                return ((e = Ie(19, n, t, i)), (e.elementType = Ko), (e.lanes = s), e);
            case Td:
                return Bs(n, i, s, t);
            default:
                if (typeof e == 'object' && e !== null)
                    switch (e.$$typeof) {
                        case xd:
                            o = 10;
                            break e;
                        case Sd:
                            o = 9;
                            break e;
                        case sa:
                            o = 11;
                            break e;
                        case oa:
                            o = 14;
                            break e;
                        case Tt:
                            ((o = 16), (r = null));
                            break e;
                    }
                throw Error(P(130, e == null ? e : typeof e, ''));
        }
    return ((t = Ie(o, n, t, i)), (t.elementType = e), (t.type = r), (t.lanes = s), t);
}
function rn(e, t, n, r) {
    return ((e = Ie(7, e, r, t)), (e.lanes = n), e);
}
function Bs(e, t, n, r) {
    return (
        (e = Ie(22, e, r, t)),
        (e.elementType = Td),
        (e.lanes = n),
        (e.stateNode = { isHidden: !1 }),
        e
    );
}
function ko(e, t, n) {
    return ((e = Ie(6, e, null, t)), (e.lanes = n), e);
}
function Co(e, t, n) {
    return (
        (t = Ie(4, e.children !== null ? e.children : [], e.key, t)),
        (t.lanes = n),
        (t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation,
        }),
        t
    );
}
function wv(e, t, n, r, i) {
    ((this.tag = t),
        (this.containerInfo = e),
        (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode = this.pendingContext = this.context = null),
        (this.callbackPriority = 0),
        (this.eventTimes = io(0)),
        (this.expirationTimes = io(-1)),
        (this.entangledLanes =
            this.finishedLanes =
            this.mutableReadLanes =
            this.expiredLanes =
            this.pingedLanes =
            this.suspendedLanes =
            this.pendingLanes =
                0),
        (this.entanglements = io(0)),
        (this.identifierPrefix = r),
        (this.onRecoverableError = i),
        (this.mutableSourceEagerHydrationData = null));
}
function Ua(e, t, n, r, i, s, o, l, a) {
    return (
        (e = new wv(e, t, n, l, a)),
        t === 1 ? ((t = 1), s === !0 && (t |= 8)) : (t = 0),
        (s = Ie(3, null, null, t)),
        (e.current = s),
        (s.stateNode = e),
        (s.memoizedState = {
            element: r,
            isDehydrated: n,
            cache: null,
            transitions: null,
            pendingSuspenseBoundaries: null,
        }),
        ka(s),
        e
    );
}
function xv(e, t, n) {
    var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
        $$typeof: gn,
        key: r == null ? null : '' + r,
        children: e,
        containerInfo: t,
        implementation: n,
    };
}
function hp(e) {
    if (!e) return Ft;
    e = e._reactInternals;
    e: {
        if (hn(e) !== e || e.tag !== 1) throw Error(P(170));
        var t = e;
        do {
            switch (t.tag) {
                case 3:
                    t = t.stateNode.context;
                    break e;
                case 1:
                    if (ke(t.type)) {
                        t = t.stateNode.__reactInternalMemoizedMergedChildContext;
                        break e;
                    }
            }
            t = t.return;
        } while (t !== null);
        throw Error(P(171));
    }
    if (e.tag === 1) {
        var n = e.type;
        if (ke(n)) return hh(e, n, t);
    }
    return t;
}
function pp(e, t, n, r, i, s, o, l, a) {
    return (
        (e = Ua(n, r, !0, e, i, s, o, l, a)),
        (e.context = hp(null)),
        (n = e.current),
        (r = ye()),
        (i = Nt(n)),
        (s = ct(r, i)),
        (s.callback = t ?? null),
        Vt(n, s, i),
        (e.current.lanes = i),
        ti(e, i, r),
        Ce(e, r),
        e
    );
}
function Us(e, t, n, r) {
    var i = t.current,
        s = ye(),
        o = Nt(i);
    return (
        (n = hp(n)),
        t.context === null ? (t.context = n) : (t.pendingContext = n),
        (t = ct(s, o)),
        (t.payload = { element: e }),
        (r = r === void 0 ? null : r),
        r !== null && (t.callback = r),
        (e = Vt(i, t, o)),
        e !== null && (Ye(e, i, o, s), Bi(e, i, o)),
        o
    );
}
function Ss(e) {
    if (((e = e.current), !e.child)) return null;
    switch (e.child.tag) {
        case 5:
            return e.child.stateNode;
        default:
            return e.child.stateNode;
    }
}
function Vc(e, t) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
    }
}
function Wa(e, t) {
    (Vc(e, t), (e = e.alternate) && Vc(e, t));
}
function Sv() {
    return null;
}
var mp =
    typeof reportError == 'function'
        ? reportError
        : function (e) {
              console.error(e);
          };
function $a(e) {
    this._internalRoot = e;
}
Ws.prototype.render = $a.prototype.render = function (e) {
    var t = this._internalRoot;
    if (t === null) throw Error(P(409));
    Us(e, t, null, null);
};
Ws.prototype.unmount = $a.prototype.unmount = function () {
    var e = this._internalRoot;
    if (e !== null) {
        this._internalRoot = null;
        var t = e.containerInfo;
        (cn(function () {
            Us(null, e, null, null);
        }),
            (t[pt] = null));
    }
};
function Ws(e) {
    this._internalRoot = e;
}
Ws.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
        var t = Gd();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < kt.length && t !== 0 && t < kt[n].priority; n++);
        (kt.splice(n, 0, e), n === 0 && Yd(e));
    }
};
function Ha(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function $s(e) {
    return !(
        !e ||
        (e.nodeType !== 1 &&
            e.nodeType !== 9 &&
            e.nodeType !== 11 &&
            (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
    );
}
function _c() {}
function Tv(e, t, n, r, i) {
    if (i) {
        if (typeof r == 'function') {
            var s = r;
            r = function () {
                var u = Ss(o);
                s.call(u);
            };
        }
        var o = pp(t, r, e, 0, null, !1, !1, '', _c);
        return (
            (e._reactRootContainer = o),
            (e[pt] = o.current),
            Ur(e.nodeType === 8 ? e.parentNode : e),
            cn(),
            o
        );
    }
    for (; (i = e.lastChild); ) e.removeChild(i);
    if (typeof r == 'function') {
        var l = r;
        r = function () {
            var u = Ss(a);
            l.call(u);
        };
    }
    var a = Ua(e, 0, !1, null, null, !1, !1, '', _c);
    return (
        (e._reactRootContainer = a),
        (e[pt] = a.current),
        Ur(e.nodeType === 8 ? e.parentNode : e),
        cn(function () {
            Us(t, a, n, r);
        }),
        a
    );
}
function Hs(e, t, n, r, i) {
    var s = n._reactRootContainer;
    if (s) {
        var o = s;
        if (typeof i == 'function') {
            var l = i;
            i = function () {
                var a = Ss(o);
                l.call(a);
            };
        }
        Us(t, o, e, i);
    } else o = Tv(n, t, e, i, r);
    return Ss(o);
}
Hd = function (e) {
    switch (e.tag) {
        case 3:
            var t = e.stateNode;
            if (t.current.memoizedState.isDehydrated) {
                var n = hr(t.pendingLanes);
                n !== 0 && (ua(t, n | 1), Ce(t, q()), !(O & 6) && ((Kn = q() + 500), Ut()));
            }
            break;
        case 13:
            (cn(function () {
                var r = mt(e, 1);
                if (r !== null) {
                    var i = ye();
                    Ye(r, e, 1, i);
                }
            }),
                Wa(e, 1));
    }
};
ca = function (e) {
    if (e.tag === 13) {
        var t = mt(e, 134217728);
        if (t !== null) {
            var n = ye();
            Ye(t, e, 134217728, n);
        }
        Wa(e, 134217728);
    }
};
Kd = function (e) {
    if (e.tag === 13) {
        var t = Nt(e),
            n = mt(e, t);
        if (n !== null) {
            var r = ye();
            Ye(n, e, t, r);
        }
        Wa(e, t);
    }
};
Gd = function () {
    return I;
};
Qd = function (e, t) {
    var n = I;
    try {
        return ((I = e), t());
    } finally {
        I = n;
    }
};
tl = function (e, t, n) {
    switch (t) {
        case 'input':
            if ((Yo(e, n), (t = n.name), n.type === 'radio' && t != null)) {
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
                        var i = Ns(r);
                        if (!i) throw Error(P(90));
                        (kd(r), Yo(r, i));
                    }
                }
            }
            break;
        case 'textarea':
            Ed(e, n);
            break;
        case 'select':
            ((t = n.value), t != null && _n(e, !!n.multiple, t, !1));
    }
};
_d = Fa;
Nd = cn;
var Pv = { usingClientEntryPoint: !1, Events: [ri, Sn, Ns, Ld, Vd, Fa] },
    ar = {
        findFiberByHostInstance: qt,
        bundleType: 0,
        version: '18.3.1',
        rendererPackageName: 'react-dom',
    },
    kv = {
        bundleType: ar.bundleType,
        version: ar.version,
        rendererPackageName: ar.rendererPackageName,
        rendererConfig: ar.rendererConfig,
        overrideHookState: null,
        overrideHookStateDeletePath: null,
        overrideHookStateRenamePath: null,
        overrideProps: null,
        overridePropsDeletePath: null,
        overridePropsRenamePath: null,
        setErrorHandler: null,
        setSuspenseHandler: null,
        scheduleUpdate: null,
        currentDispatcherRef: yt.ReactCurrentDispatcher,
        findHostInstanceByFiber: function (e) {
            return ((e = Fd(e)), e === null ? null : e.stateNode);
        },
        findFiberByHostInstance: ar.findFiberByHostInstance || Sv,
        findHostInstancesForRefresh: null,
        scheduleRefresh: null,
        scheduleRoot: null,
        setRefreshHandler: null,
        getCurrentFiber: null,
        reconcilerVersion: '18.3.1-next-f1338f8080-20240426',
    };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
    var Di = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Di.isDisabled && Di.supportsFiber)
        try {
            ((Ds = Di.inject(kv)), (tt = Di));
        } catch {}
}
Le.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Pv;
Le.createPortal = function (e, t) {
    var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!Ha(t)) throw Error(P(200));
    return xv(e, t, null, n);
};
Le.createRoot = function (e, t) {
    if (!Ha(e)) throw Error(P(299));
    var n = !1,
        r = '',
        i = mp;
    return (
        t != null &&
            (t.unstable_strictMode === !0 && (n = !0),
            t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
            t.onRecoverableError !== void 0 && (i = t.onRecoverableError)),
        (t = Ua(e, 1, !1, null, null, n, !1, r, i)),
        (e[pt] = t.current),
        Ur(e.nodeType === 8 ? e.parentNode : e),
        new $a(t)
    );
};
Le.findDOMNode = function (e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
        throw typeof e.render == 'function'
            ? Error(P(188))
            : ((e = Object.keys(e).join(',')), Error(P(268, e)));
    return ((e = Fd(t)), (e = e === null ? null : e.stateNode), e);
};
Le.flushSync = function (e) {
    return cn(e);
};
Le.hydrate = function (e, t, n) {
    if (!$s(t)) throw Error(P(200));
    return Hs(null, e, t, !0, n);
};
Le.hydrateRoot = function (e, t, n) {
    if (!Ha(e)) throw Error(P(405));
    var r = (n != null && n.hydratedSources) || null,
        i = !1,
        s = '',
        o = mp;
    if (
        (n != null &&
            (n.unstable_strictMode === !0 && (i = !0),
            n.identifierPrefix !== void 0 && (s = n.identifierPrefix),
            n.onRecoverableError !== void 0 && (o = n.onRecoverableError)),
        (t = pp(t, null, e, 1, n ?? null, i, !1, s, o)),
        (e[pt] = t.current),
        Ur(e),
        r)
    )
        for (e = 0; e < r.length; e++)
            ((n = r[e]),
                (i = n._getVersion),
                (i = i(n._source)),
                t.mutableSourceEagerHydrationData == null
                    ? (t.mutableSourceEagerHydrationData = [n, i])
                    : t.mutableSourceEagerHydrationData.push(n, i));
    return new Ws(t);
};
Le.render = function (e, t, n) {
    if (!$s(t)) throw Error(P(200));
    return Hs(null, e, t, !1, n);
};
Le.unmountComponentAtNode = function (e) {
    if (!$s(e)) throw Error(P(40));
    return e._reactRootContainer
        ? (cn(function () {
              Hs(null, null, e, !1, function () {
                  ((e._reactRootContainer = null), (e[pt] = null));
              });
          }),
          !0)
        : !1;
};
Le.unstable_batchedUpdates = Fa;
Le.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
    if (!$s(n)) throw Error(P(200));
    if (e == null || e._reactInternals === void 0) throw Error(P(38));
    return Hs(e, t, n, !1, r);
};
Le.version = '18.3.1-next-f1338f8080-20240426';
function gp() {
    if (
        !(
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
        )
    )
        try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(gp);
        } catch (e) {
            console.error(e);
        }
}
(gp(), (gd.exports = Le));
var Cv = gd.exports,
    Nc = Cv;
((Uo.createRoot = Nc.createRoot), (Uo.hydrateRoot = Nc.hydrateRoot));
const Ka = C.createContext({});
function qn(e) {
    const t = C.useRef(null);
    return (t.current === null && (t.current = e()), t.current);
}
const Ks = C.createContext(null),
    si = C.createContext({ transformPagePoint: (e) => e, isStatic: !1, reducedMotion: 'never' });
class Ev extends C.Component {
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
function Av({ children: e, isPresent: t }) {
    const n = C.useId(),
        r = C.useRef(null),
        i = C.useRef({ width: 0, height: 0, top: 0, left: 0 }),
        { nonce: s } = C.useContext(si);
    return (
        C.useInsertionEffect(() => {
            const { width: o, height: l, top: a, left: u } = i.current;
            if (t || !r.current || !o || !l) return;
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
            height: ${l}px !important;
            top: ${a}px !important;
            left: ${u}px !important;
          }
        `),
                () => {
                    document.head.removeChild(c);
                }
            );
        }, [t]),
        R.jsx(Ev, {
            isPresent: t,
            childRef: r,
            sizeRef: i,
            children: C.cloneElement(e, { ref: r }),
        })
    );
}
const Mv = ({
    children: e,
    initial: t,
    isPresent: n,
    onExitComplete: r,
    custom: i,
    presenceAffectsLayout: s,
    mode: o,
}) => {
    const l = qn(Rv),
        a = C.useId(),
        u = C.useCallback(
            (f) => {
                l.set(f, !0);
                for (const d of l.values()) if (!d) return;
                r && r();
            },
            [l, r],
        ),
        c = C.useMemo(
            () => ({
                id: a,
                initial: t,
                isPresent: n,
                custom: i,
                onExitComplete: u,
                register: (f) => (l.set(f, !1), () => l.delete(f)),
            }),
            s ? [Math.random(), u] : [n, u],
        );
    return (
        C.useMemo(() => {
            l.forEach((f, d) => l.set(d, !1));
        }, [n]),
        C.useEffect(() => {
            !n && !l.size && r && r();
        }, [n]),
        o === 'popLayout' && (e = R.jsx(Av, { isPresent: n, children: e })),
        R.jsx(Ks.Provider, { value: c, children: e })
    );
};
function Rv() {
    return new Map();
}
function yp(e = !0) {
    const t = C.useContext(Ks);
    if (t === null) return [!0, null];
    const { isPresent: n, onExitComplete: r, register: i } = t,
        s = C.useId();
    C.useEffect(() => {
        e && i(s);
    }, [e]);
    const o = C.useCallback(() => e && r && r(s), [s, r, e]);
    return !n && r ? [!1, o] : [!0];
}
const Li = (e) => e.key || '';
function jc(e) {
    const t = [];
    return (
        C.Children.forEach(e, (n) => {
            C.isValidElement(n) && t.push(n);
        }),
        t
    );
}
const Ga = typeof window < 'u',
    oi = Ga ? C.useLayoutEffect : C.useEffect,
    Dv = ({
        children: e,
        custom: t,
        initial: n = !0,
        onExitComplete: r,
        presenceAffectsLayout: i = !0,
        mode: s = 'sync',
        propagate: o = !1,
    }) => {
        const [l, a] = yp(o),
            u = C.useMemo(() => jc(e), [e]),
            c = o && !l ? [] : u.map(Li),
            f = C.useRef(!0),
            d = C.useRef(u),
            g = qn(() => new Map()),
            [y, v] = C.useState(u),
            [S, p] = C.useState(u);
        oi(() => {
            ((f.current = !1), (d.current = u));
            for (let w = 0; w < S.length; w++) {
                const x = Li(S[w]);
                c.includes(x) ? g.delete(x) : g.get(x) !== !0 && g.set(x, !1);
            }
        }, [S, c.length, c.join('-')]);
        const h = [];
        if (u !== y) {
            let w = [...u];
            for (let x = 0; x < S.length; x++) {
                const k = S[x],
                    E = Li(k);
                c.includes(E) || (w.splice(x, 0, k), h.push(k));
            }
            (s === 'wait' && h.length && (w = h), p(jc(w)), v(u));
            return;
        }
        const { forceRender: m } = C.useContext(Ka);
        return R.jsx(R.Fragment, {
            children: S.map((w) => {
                const x = Li(w),
                    k = o && !l ? !1 : u === S || c.includes(x),
                    E = () => {
                        if (g.has(x)) g.set(x, !0);
                        else return;
                        let T = !0;
                        (g.forEach((N) => {
                            N || (T = !1);
                        }),
                            T &&
                                (m == null || m(),
                                p(d.current),
                                o && (a == null || a()),
                                r && r()));
                    };
                return R.jsx(
                    Mv,
                    {
                        isPresent: k,
                        initial: !f.current || n ? void 0 : !1,
                        custom: k ? void 0 : t,
                        presenceAffectsLayout: i,
                        mode: s,
                        onExitComplete: k ? void 0 : E,
                        children: w,
                    },
                    x,
                );
            }),
        });
    },
    ve = (e) => e;
let Lv = ve,
    vp = ve;
function Qa(e) {
    let t;
    return () => (t === void 0 && (t = e()), t);
}
const fn = (e, t, n) => {
        const r = t - e;
        return r === 0 ? 1 : (n - e) / r;
    },
    ft = (e) => e * 1e3,
    dt = (e) => e / 1e3,
    Vv = { useManualTiming: !1 };
function _v(e) {
    let t = new Set(),
        n = new Set(),
        r = !1,
        i = !1;
    const s = new WeakSet();
    let o = { delta: 0, timestamp: 0, isProcessing: !1 };
    function l(u) {
        (s.has(u) && (a.schedule(u), e()), u(o));
    }
    const a = {
        schedule: (u, c = !1, f = !1) => {
            const g = f && r ? t : n;
            return (c && s.add(u), g.has(u) || g.add(u), u);
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
                t.forEach(l),
                t.clear(),
                (r = !1),
                i && ((i = !1), a.process(u)));
        },
    };
    return a;
}
const Vi = ['read', 'resolveKeyframes', 'update', 'preRender', 'render', 'postRender'],
    Nv = 40;
function wp(e, t) {
    let n = !1,
        r = !0;
    const i = { delta: 0, timestamp: 0, isProcessing: !1 },
        s = () => (n = !0),
        o = Vi.reduce((p, h) => ((p[h] = _v(s)), p), {}),
        { read: l, resolveKeyframes: a, update: u, preRender: c, render: f, postRender: d } = o,
        g = () => {
            const p = performance.now();
            ((n = !1),
                (i.delta = r ? 1e3 / 60 : Math.max(Math.min(p - i.timestamp, Nv), 1)),
                (i.timestamp = p),
                (i.isProcessing = !0),
                l.process(i),
                a.process(i),
                u.process(i),
                c.process(i),
                f.process(i),
                d.process(i),
                (i.isProcessing = !1),
                n && t && ((r = !1), e(g)));
        },
        y = () => {
            ((n = !0), (r = !0), i.isProcessing || e(g));
        };
    return {
        schedule: Vi.reduce((p, h) => {
            const m = o[h];
            return ((p[h] = (w, x = !1, k = !1) => (n || y(), m.schedule(w, x, k))), p);
        }, {}),
        cancel: (p) => {
            for (let h = 0; h < Vi.length; h++) o[Vi[h]].cancel(p);
        },
        state: i,
        steps: o,
    };
}
const {
        schedule: F,
        cancel: Ze,
        state: ee,
        steps: Eo,
    } = wp(typeof requestAnimationFrame < 'u' ? requestAnimationFrame : ve, !0),
    xp = C.createContext({ strict: !1 }),
    Oc = {
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
    Gn = {};
for (const e in Oc) Gn[e] = { isEnabled: (t) => Oc[e].some((n) => !!t[n]) };
function jv(e) {
    for (const t in e) Gn[t] = { ...Gn[t], ...e[t] };
}
const Ov = new Set([
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
function Ts(e) {
    return (
        e.startsWith('while') ||
        (e.startsWith('drag') && e !== 'draggable') ||
        e.startsWith('layout') ||
        e.startsWith('onTap') ||
        e.startsWith('onPan') ||
        e.startsWith('onLayout') ||
        Ov.has(e)
    );
}
let Sp = (e) => !Ts(e);
function Fv(e) {
    e && (Sp = (t) => (t.startsWith('on') ? !Ts(t) : e(t)));
}
try {
    Fv(require('@emotion/is-prop-valid').default);
} catch {}
function Iv(e, t, n) {
    const r = {};
    for (const i in e)
        (i === 'values' && typeof e.values == 'object') ||
            ((Sp(i) ||
                (n === !0 && Ts(i)) ||
                (!t && !Ts(i)) ||
                (e.draggable && i.startsWith('onDrag'))) &&
                (r[i] = e[i]));
    return r;
}
function zv(e) {
    if (typeof Proxy > 'u') return e;
    const t = new Map(),
        n = (...r) => e(...r);
    return new Proxy(n, {
        get: (r, i) => (i === 'create' ? e : (t.has(i) || t.set(i, e(i)), t.get(i))),
    });
}
const Gs = C.createContext({});
function Zr(e) {
    return typeof e == 'string' || Array.isArray(e);
}
function Qs(e) {
    return e !== null && typeof e == 'object' && typeof e.start == 'function';
}
const Ya = ['animate', 'whileInView', 'whileFocus', 'whileHover', 'whileTap', 'whileDrag', 'exit'],
    Xa = ['initial', ...Ya];
function Ys(e) {
    return Qs(e.animate) || Xa.some((t) => Zr(e[t]));
}
function Tp(e) {
    return !!(Ys(e) || e.variants);
}
function Bv(e, t) {
    if (Ys(e)) {
        const { initial: n, animate: r } = e;
        return { initial: n === !1 || Zr(n) ? n : void 0, animate: Zr(r) ? r : void 0 };
    }
    return e.inherit !== !1 ? t : {};
}
function Uv(e) {
    const { initial: t, animate: n } = Bv(e, C.useContext(Gs));
    return C.useMemo(() => ({ initial: t, animate: n }), [Fc(t), Fc(n)]);
}
function Fc(e) {
    return Array.isArray(e) ? e.join(' ') : e;
}
const Wv = Symbol.for('motionComponentSymbol');
function Mn(e) {
    return e && typeof e == 'object' && Object.prototype.hasOwnProperty.call(e, 'current');
}
function $v(e, t, n) {
    return C.useCallback(
        (r) => {
            (r && e.onMount && e.onMount(r),
                t && (r ? t.mount(r) : t.unmount()),
                n && (typeof n == 'function' ? n(r) : Mn(n) && (n.current = r)));
        },
        [t],
    );
}
const Za = (e) => e.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase(),
    Hv = 'framerAppearId',
    Pp = 'data-' + Za(Hv),
    { schedule: qa } = wp(queueMicrotask, !1),
    kp = C.createContext({});
function Kv(e, t, n, r, i) {
    var s, o;
    const { visualElement: l } = C.useContext(Gs),
        a = C.useContext(xp),
        u = C.useContext(Ks),
        c = C.useContext(si).reducedMotion,
        f = C.useRef(null);
    ((r = r || a.renderer),
        !f.current &&
            r &&
            (f.current = r(e, {
                visualState: t,
                parent: l,
                props: n,
                presenceContext: u,
                blockInitialAnimation: u ? u.initial === !1 : !1,
                reducedMotionConfig: c,
            })));
    const d = f.current,
        g = C.useContext(kp);
    d && !d.projection && i && (d.type === 'html' || d.type === 'svg') && Gv(f.current, n, i, g);
    const y = C.useRef(!1);
    C.useInsertionEffect(() => {
        d && y.current && d.update(n, u);
    });
    const v = n[Pp],
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
        oi(() => {
            d &&
                ((y.current = !0),
                (window.MotionIsMounted = !0),
                d.updateFeatures(),
                qa.render(d.render),
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
function Gv(e, t, n, r) {
    const {
        layoutId: i,
        layout: s,
        drag: o,
        dragConstraints: l,
        layoutScroll: a,
        layoutRoot: u,
    } = t;
    ((e.projection = new n(e.latestValues, t['data-framer-portal-id'] ? void 0 : Cp(e.parent))),
        e.projection.setOptions({
            layoutId: i,
            layout: s,
            alwaysMeasureLayout: !!o || (l && Mn(l)),
            visualElement: e,
            animationType: typeof s == 'string' ? s : 'both',
            initialPromotionConfig: r,
            layoutScroll: a,
            layoutRoot: u,
        }));
}
function Cp(e) {
    if (e) return e.options.allowProjection !== !1 ? e.projection : Cp(e.parent);
}
function Qv({
    preloadedFeatures: e,
    createVisualElement: t,
    useRender: n,
    useVisualState: r,
    Component: i,
}) {
    var s, o;
    e && jv(e);
    function l(u, c) {
        let f;
        const d = { ...C.useContext(si), ...u, layoutId: Yv(u) },
            { isStatic: g } = d,
            y = Uv(u),
            v = r(u, g);
        if (!g && Ga) {
            Xv();
            const S = Zv(d);
            ((f = S.MeasureLayout), (y.visualElement = Kv(i, v, d, t, S.ProjectionNode)));
        }
        return R.jsxs(Gs.Provider, {
            value: y,
            children: [
                f && y.visualElement ? R.jsx(f, { visualElement: y.visualElement, ...d }) : null,
                n(i, u, $v(v, y.visualElement, c), v, g, y.visualElement),
            ],
        });
    }
    l.displayName = `motion.${typeof i == 'string' ? i : `create(${(o = (s = i.displayName) !== null && s !== void 0 ? s : i.name) !== null && o !== void 0 ? o : ''})`}`;
    const a = C.forwardRef(l);
    return ((a[Wv] = i), a);
}
function Yv({ layoutId: e }) {
    const t = C.useContext(Ka).id;
    return t && e !== void 0 ? t + '-' + e : e;
}
function Xv(e, t) {
    C.useContext(xp).strict;
}
function Zv(e) {
    const { drag: t, layout: n } = Gn;
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
const qv = [
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
function Ja(e) {
    return typeof e != 'string' || e.includes('-')
        ? !1
        : !!(qv.indexOf(e) > -1 || /[A-Z]/u.test(e));
}
function Ic(e) {
    const t = [{}, {}];
    return (
        e == null ||
            e.values.forEach((n, r) => {
                ((t[0][r] = n.get()), (t[1][r] = n.getVelocity()));
            }),
        t
    );
}
function ba(e, t, n, r) {
    if (typeof t == 'function') {
        const [i, s] = Ic(r);
        t = t(n !== void 0 ? n : e.custom, i, s);
    }
    if ((typeof t == 'string' && (t = e.variants && e.variants[t]), typeof t == 'function')) {
        const [i, s] = Ic(r);
        t = t(n !== void 0 ? n : e.custom, i, s);
    }
    return t;
}
const Nl = (e) => Array.isArray(e),
    Jv = (e) => !!(e && typeof e == 'object' && e.mix && e.toValue),
    bv = (e) => (Nl(e) ? e[e.length - 1] || 0 : e),
    oe = (e) => !!(e && e.getVelocity);
function Qi(e) {
    const t = oe(e) ? e.get() : e;
    return Jv(t) ? t.toValue() : t;
}
function e0({ scrapeMotionValuesFromProps: e, createRenderState: t, onUpdate: n }, r, i, s) {
    const o = { latestValues: t0(r, i, s, e), renderState: t() };
    return (
        n && ((o.onMount = (l) => n({ props: r, current: l, ...o })), (o.onUpdate = (l) => n(l))),
        o
    );
}
const Ep = (e) => (t, n) => {
    const r = C.useContext(Gs),
        i = C.useContext(Ks),
        s = () => e0(e, t, r, i);
    return n ? s() : qn(s);
};
function t0(e, t, n, r) {
    const i = {},
        s = r(e, {});
    for (const d in s) i[d] = Qi(s[d]);
    let { initial: o, animate: l } = e;
    const a = Ys(e),
        u = Tp(e);
    t &&
        u &&
        !a &&
        e.inherit !== !1 &&
        (o === void 0 && (o = t.initial), l === void 0 && (l = t.animate));
    let c = n ? n.initial === !1 : !1;
    c = c || o === !1;
    const f = c ? l : o;
    if (f && typeof f != 'boolean' && !Qs(f)) {
        const d = Array.isArray(f) ? f : [f];
        for (let g = 0; g < d.length; g++) {
            const y = ba(e, d[g]);
            if (y) {
                const { transitionEnd: v, transition: S, ...p } = y;
                for (const h in p) {
                    let m = p[h];
                    if (Array.isArray(m)) {
                        const w = c ? m.length - 1 : 0;
                        m = m[w];
                    }
                    m !== null && (i[h] = m);
                }
                for (const h in v) i[h] = v[h];
            }
        }
    }
    return i;
}
const Jn = [
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
    pn = new Set(Jn),
    Ap = (e) => (t) => typeof t == 'string' && t.startsWith(e),
    Mp = Ap('--'),
    n0 = Ap('var(--'),
    eu = (e) => (n0(e) ? r0.test(e.split('/*')[0].trim()) : !1),
    r0 = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu,
    Rp = (e, t) => (t && typeof e == 'number' ? t.transform(e) : e),
    st = (e, t, n) => (n > t ? t : n < e ? e : n),
    bn = { test: (e) => typeof e == 'number', parse: parseFloat, transform: (e) => e },
    qr = { ...bn, transform: (e) => st(0, 1, e) },
    _i = { ...bn, default: 1 },
    li = (e) => ({
        test: (t) => typeof t == 'string' && t.endsWith(e) && t.split(' ').length === 1,
        parse: parseFloat,
        transform: (t) => `${t}${e}`,
    }),
    xt = li('deg'),
    rt = li('%'),
    D = li('px'),
    i0 = li('vh'),
    s0 = li('vw'),
    zc = { ...rt, parse: (e) => rt.parse(e) / 100, transform: (e) => rt.transform(e * 100) },
    o0 = {
        borderWidth: D,
        borderTopWidth: D,
        borderRightWidth: D,
        borderBottomWidth: D,
        borderLeftWidth: D,
        borderRadius: D,
        radius: D,
        borderTopLeftRadius: D,
        borderTopRightRadius: D,
        borderBottomRightRadius: D,
        borderBottomLeftRadius: D,
        width: D,
        maxWidth: D,
        height: D,
        maxHeight: D,
        top: D,
        right: D,
        bottom: D,
        left: D,
        padding: D,
        paddingTop: D,
        paddingRight: D,
        paddingBottom: D,
        paddingLeft: D,
        margin: D,
        marginTop: D,
        marginRight: D,
        marginBottom: D,
        marginLeft: D,
        backgroundPositionX: D,
        backgroundPositionY: D,
    },
    l0 = {
        rotate: xt,
        rotateX: xt,
        rotateY: xt,
        rotateZ: xt,
        scale: _i,
        scaleX: _i,
        scaleY: _i,
        scaleZ: _i,
        skew: xt,
        skewX: xt,
        skewY: xt,
        distance: D,
        translateX: D,
        translateY: D,
        translateZ: D,
        x: D,
        y: D,
        z: D,
        perspective: D,
        transformPerspective: D,
        opacity: qr,
        originX: zc,
        originY: zc,
        originZ: D,
    },
    Bc = { ...bn, transform: Math.round },
    tu = { ...o0, ...l0, zIndex: Bc, size: D, fillOpacity: qr, strokeOpacity: qr, numOctaves: Bc },
    a0 = { x: 'translateX', y: 'translateY', z: 'translateZ', transformPerspective: 'perspective' },
    u0 = Jn.length;
function c0(e, t, n) {
    let r = '',
        i = !0;
    for (let s = 0; s < u0; s++) {
        const o = Jn[s],
            l = e[o];
        if (l === void 0) continue;
        let a = !0;
        if (
            (typeof l == 'number'
                ? (a = l === (o.startsWith('scale') ? 1 : 0))
                : (a = parseFloat(l) === 0),
            !a || n)
        ) {
            const u = Rp(l, tu[o]);
            if (!a) {
                i = !1;
                const c = a0[o] || o;
                r += `${c}(${u}) `;
            }
            n && (t[o] = u);
        }
    }
    return ((r = r.trim()), n ? (r = n(t, i ? '' : r)) : i && (r = 'none'), r);
}
function nu(e, t, n) {
    const { style: r, vars: i, transformOrigin: s } = e;
    let o = !1,
        l = !1;
    for (const a in t) {
        const u = t[a];
        if (pn.has(a)) {
            o = !0;
            continue;
        } else if (Mp(a)) {
            i[a] = u;
            continue;
        } else {
            const c = Rp(u, tu[a]);
            a.startsWith('origin') ? ((l = !0), (s[a] = c)) : (r[a] = c);
        }
    }
    if (
        (t.transform ||
            (o || n
                ? (r.transform = c0(t, e.transform, n))
                : r.transform && (r.transform = 'none')),
        l)
    ) {
        const { originX: a = '50%', originY: u = '50%', originZ: c = 0 } = s;
        r.transformOrigin = `${a} ${u} ${c}`;
    }
}
const f0 = { offset: 'stroke-dashoffset', array: 'stroke-dasharray' },
    d0 = { offset: 'strokeDashoffset', array: 'strokeDasharray' };
function h0(e, t, n = 1, r = 0, i = !0) {
    e.pathLength = 1;
    const s = i ? f0 : d0;
    e[s.offset] = D.transform(-r);
    const o = D.transform(t),
        l = D.transform(n);
    e[s.array] = `${o} ${l}`;
}
function Uc(e, t, n) {
    return typeof e == 'string' ? e : D.transform(t + n * e);
}
function p0(e, t, n) {
    const r = Uc(t, e.x, e.width),
        i = Uc(n, e.y, e.height);
    return `${r} ${i}`;
}
function ru(
    e,
    {
        attrX: t,
        attrY: n,
        attrScale: r,
        originX: i,
        originY: s,
        pathLength: o,
        pathSpacing: l = 1,
        pathOffset: a = 0,
        ...u
    },
    c,
    f,
) {
    if ((nu(e, u, f), c)) {
        e.style.viewBox && (e.attrs.viewBox = e.style.viewBox);
        return;
    }
    ((e.attrs = e.style), (e.style = {}));
    const { attrs: d, style: g, dimensions: y } = e;
    (d.transform && (y && (g.transform = d.transform), delete d.transform),
        y &&
            (i !== void 0 || s !== void 0 || g.transform) &&
            (g.transformOrigin = p0(y, i !== void 0 ? i : 0.5, s !== void 0 ? s : 0.5)),
        t !== void 0 && (d.x = t),
        n !== void 0 && (d.y = n),
        r !== void 0 && (d.scale = r),
        o !== void 0 && h0(d, o, l, a, !1));
}
const iu = () => ({ style: {}, transform: {}, transformOrigin: {}, vars: {} }),
    Dp = () => ({ ...iu(), attrs: {} }),
    su = (e) => typeof e == 'string' && e.toLowerCase() === 'svg';
function Lp(e, { style: t, vars: n }, r, i) {
    Object.assign(e.style, t, i && i.getProjectionStyles(r));
    for (const s in n) e.style.setProperty(s, n[s]);
}
const Vp = new Set([
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
function _p(e, t, n, r) {
    Lp(e, t, void 0, r);
    for (const i in t.attrs) e.setAttribute(Vp.has(i) ? i : Za(i), t.attrs[i]);
}
const Ps = {};
function m0(e) {
    Object.assign(Ps, e);
}
function Np(e, { layout: t, layoutId: n }) {
    return (
        pn.has(e) || e.startsWith('origin') || ((t || n !== void 0) && (!!Ps[e] || e === 'opacity'))
    );
}
function ou(e, t, n) {
    var r;
    const { style: i } = e,
        s = {};
    for (const o in i)
        (oe(i[o]) ||
            (t.style && oe(t.style[o])) ||
            Np(o, e) ||
            ((r = n == null ? void 0 : n.getValue(o)) === null || r === void 0
                ? void 0
                : r.liveStyle) !== void 0) &&
            (s[o] = i[o]);
    return s;
}
function jp(e, t, n) {
    const r = ou(e, t, n);
    for (const i in e)
        if (oe(e[i]) || oe(t[i])) {
            const s =
                Jn.indexOf(i) !== -1 ? 'attr' + i.charAt(0).toUpperCase() + i.substring(1) : i;
            r[s] = e[i];
        }
    return r;
}
function g0(e, t) {
    try {
        t.dimensions = typeof e.getBBox == 'function' ? e.getBBox() : e.getBoundingClientRect();
    } catch {
        t.dimensions = { x: 0, y: 0, width: 0, height: 0 };
    }
}
const Wc = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r'],
    y0 = {
        useVisualState: Ep({
            scrapeMotionValuesFromProps: jp,
            createRenderState: Dp,
            onUpdate: ({ props: e, prevProps: t, current: n, renderState: r, latestValues: i }) => {
                if (!n) return;
                let s = !!e.drag;
                if (!s) {
                    for (const l in i)
                        if (pn.has(l)) {
                            s = !0;
                            break;
                        }
                }
                if (!s) return;
                let o = !t;
                if (t)
                    for (let l = 0; l < Wc.length; l++) {
                        const a = Wc[l];
                        e[a] !== t[a] && (o = !0);
                    }
                o &&
                    F.read(() => {
                        (g0(n, r),
                            F.render(() => {
                                (ru(r, i, su(n.tagName), e.transformTemplate), _p(n, r));
                            }));
                    });
            },
        }),
    },
    v0 = { useVisualState: Ep({ scrapeMotionValuesFromProps: ou, createRenderState: iu }) };
function Op(e, t, n) {
    for (const r in t) !oe(t[r]) && !Np(r, n) && (e[r] = t[r]);
}
function w0({ transformTemplate: e }, t) {
    return C.useMemo(() => {
        const n = iu();
        return (nu(n, t, e), Object.assign({}, n.vars, n.style));
    }, [t]);
}
function x0(e, t) {
    const n = e.style || {},
        r = {};
    return (Op(r, n, e), Object.assign(r, w0(e, t)), r);
}
function S0(e, t) {
    const n = {},
        r = x0(e, t);
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
function T0(e, t, n, r) {
    const i = C.useMemo(() => {
        const s = Dp();
        return (ru(s, t, su(r), e.transformTemplate), { ...s.attrs, style: { ...s.style } });
    }, [t]);
    if (e.style) {
        const s = {};
        (Op(s, e.style, e), (i.style = { ...s, ...i.style }));
    }
    return i;
}
function P0(e = !1) {
    return (n, r, i, { latestValues: s }, o) => {
        const a = (Ja(n) ? T0 : S0)(r, s, o, n),
            u = Iv(r, typeof n == 'string', e),
            c = n !== C.Fragment ? { ...u, ...a, ref: i } : {},
            { children: f } = r,
            d = C.useMemo(() => (oe(f) ? f.get() : f), [f]);
        return C.createElement(n, { ...c, children: d });
    };
}
function k0(e, t) {
    return function (r, { forwardMotionProps: i } = { forwardMotionProps: !1 }) {
        const o = {
            ...(Ja(r) ? y0 : v0),
            preloadedFeatures: e,
            useRender: P0(i),
            createVisualElement: t,
            Component: r,
        };
        return Qv(o);
    };
}
function Fp(e, t) {
    if (!Array.isArray(t)) return !1;
    const n = t.length;
    if (n !== e.length) return !1;
    for (let r = 0; r < n; r++) if (t[r] !== e[r]) return !1;
    return !0;
}
function Xs(e, t, n) {
    const r = e.getProps();
    return ba(r, t, n !== void 0 ? n : r.custom, e);
}
const Ip = Qa(() => window.ScrollTimeline !== void 0);
class C0 {
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
            if (Ip() && i.attachTimeline) return i.attachTimeline(t);
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
class E0 extends C0 {
    then(t, n) {
        return Promise.all(this.animations).then(t).catch(n);
    }
}
function lu(e, t) {
    return e ? e[t] || e.default || e : void 0;
}
const jl = 2e4;
function zp(e) {
    let t = 0;
    const n = 50;
    let r = e.next(t);
    for (; !r.done && t < jl; ) ((t += n), (r = e.next(t)));
    return t >= jl ? 1 / 0 : t;
}
function au(e) {
    return typeof e == 'function';
}
function $c(e, t) {
    ((e.timeline = t), (e.onfinish = null));
}
const uu = (e) => Array.isArray(e) && typeof e[0] == 'number',
    A0 = { linearEasing: void 0 };
function M0(e, t) {
    const n = Qa(e);
    return () => {
        var r;
        return (r = A0[t]) !== null && r !== void 0 ? r : n();
    };
}
const ks = M0(() => {
        try {
            document.createElement('div').animate({ opacity: 0 }, { easing: 'linear(0, 1)' });
        } catch {
            return !1;
        }
        return !0;
    }, 'linearEasing'),
    Bp = (e, t, n = 10) => {
        let r = '';
        const i = Math.max(Math.round(t / n), 2);
        for (let s = 0; s < i; s++) r += e(fn(0, i - 1, s)) + ', ';
        return `linear(${r.substring(0, r.length - 2)})`;
    };
function Up(e) {
    return !!(
        (typeof e == 'function' && ks()) ||
        !e ||
        (typeof e == 'string' && (e in Ol || ks())) ||
        uu(e) ||
        (Array.isArray(e) && e.every(Up))
    );
}
const mr = ([e, t, n, r]) => `cubic-bezier(${e}, ${t}, ${n}, ${r})`,
    Ol = {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        circIn: mr([0, 0.65, 0.55, 1]),
        circOut: mr([0.55, 0, 1, 0.45]),
        backIn: mr([0.31, 0.01, 0.66, -0.59]),
        backOut: mr([0.33, 1.53, 0.69, 0.99]),
    };
function Wp(e, t) {
    if (e)
        return typeof e == 'function' && ks()
            ? Bp(e, t)
            : uu(e)
              ? mr(e)
              : Array.isArray(e)
                ? e.map((n) => Wp(n, t) || Ol.easeOut)
                : Ol[e];
}
const $e = { x: !1, y: !1 };
function $p() {
    return $e.x || $e.y;
}
function Hp(e, t, n) {
    var r;
    if (e instanceof Element) return [e];
    if (typeof e == 'string') {
        let i = document;
        const s = (r = void 0) !== null && r !== void 0 ? r : i.querySelectorAll(e);
        return s ? Array.from(s) : [];
    }
    return Array.from(e);
}
function Kp(e, t) {
    const n = Hp(e),
        r = new AbortController(),
        i = { passive: !0, ...t, signal: r.signal };
    return [n, i, () => r.abort()];
}
function Hc(e) {
    return (t) => {
        t.pointerType === 'touch' || $p() || e(t);
    };
}
function R0(e, t, n = {}) {
    const [r, i, s] = Kp(e, n),
        o = Hc((l) => {
            const { target: a } = l,
                u = t(l);
            if (typeof u != 'function' || !a) return;
            const c = Hc((f) => {
                (u(f), a.removeEventListener('pointerleave', c));
            });
            a.addEventListener('pointerleave', c, i);
        });
    return (
        r.forEach((l) => {
            l.addEventListener('pointerenter', o, i);
        }),
        s
    );
}
const Gp = (e, t) => (t ? (e === t ? !0 : Gp(e, t.parentElement)) : !1),
    cu = (e) =>
        e.pointerType === 'mouse'
            ? typeof e.button != 'number' || e.button <= 0
            : e.isPrimary !== !1,
    D0 = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']);
function L0(e) {
    return D0.has(e.tagName) || e.tabIndex !== -1;
}
const gr = new WeakSet();
function Kc(e) {
    return (t) => {
        t.key === 'Enter' && e(t);
    };
}
function Ao(e, t) {
    e.dispatchEvent(new PointerEvent('pointer' + t, { isPrimary: !0, bubbles: !0 }));
}
const V0 = (e, t) => {
    const n = e.currentTarget;
    if (!n) return;
    const r = Kc(() => {
        if (gr.has(n)) return;
        Ao(n, 'down');
        const i = Kc(() => {
                Ao(n, 'up');
            }),
            s = () => Ao(n, 'cancel');
        (n.addEventListener('keyup', i, t), n.addEventListener('blur', s, t));
    });
    (n.addEventListener('keydown', r, t),
        n.addEventListener('blur', () => n.removeEventListener('keydown', r), t));
};
function Gc(e) {
    return cu(e) && !$p();
}
function _0(e, t, n = {}) {
    const [r, i, s] = Kp(e, n),
        o = (l) => {
            const a = l.currentTarget;
            if (!Gc(l) || gr.has(a)) return;
            gr.add(a);
            const u = t(l),
                c = (g, y) => {
                    (window.removeEventListener('pointerup', f),
                        window.removeEventListener('pointercancel', d),
                        !(!Gc(g) || !gr.has(a)) &&
                            (gr.delete(a), typeof u == 'function' && u(g, { success: y })));
                },
                f = (g) => {
                    c(g, n.useGlobalTarget || Gp(a, g.target));
                },
                d = (g) => {
                    c(g, !1);
                };
            (window.addEventListener('pointerup', f, i),
                window.addEventListener('pointercancel', d, i));
        };
    return (
        r.forEach((l) => {
            (!L0(l) && l.getAttribute('tabindex') === null && (l.tabIndex = 0),
                (n.useGlobalTarget ? window : l).addEventListener('pointerdown', o, i),
                l.addEventListener('focus', (u) => V0(u, i), i));
        }),
        s
    );
}
function N0(e) {
    return e === 'x' || e === 'y'
        ? $e[e]
            ? null
            : (($e[e] = !0),
              () => {
                  $e[e] = !1;
              })
        : $e.x || $e.y
          ? null
          : (($e.x = $e.y = !0),
            () => {
                $e.x = $e.y = !1;
            });
}
const Qp = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', ...Jn]);
let Yi;
function j0() {
    Yi = void 0;
}
const it = {
    now: () => (
        Yi === void 0 &&
            it.set(ee.isProcessing || Vv.useManualTiming ? ee.timestamp : performance.now()),
        Yi
    ),
    set: (e) => {
        ((Yi = e), queueMicrotask(j0));
    },
};
function fu(e, t) {
    e.indexOf(t) === -1 && e.push(t);
}
function du(e, t) {
    const n = e.indexOf(t);
    n > -1 && e.splice(n, 1);
}
class hu {
    constructor() {
        this.subscriptions = [];
    }
    add(t) {
        return (fu(this.subscriptions, t), () => du(this.subscriptions, t));
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
function pu(e, t) {
    return t ? e * (1e3 / t) : 0;
}
const Qc = 30,
    O0 = (e) => !isNaN(parseFloat(e)),
    Ar = { current: void 0 };
class F0 {
    constructor(t, n = {}) {
        ((this.version = '11.18.2'),
            (this.canTrackVelocity = null),
            (this.events = {}),
            (this.updateAndNotify = (r, i = !0) => {
                const s = it.now();
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
            (this.updatedAt = it.now()),
            this.canTrackVelocity === null &&
                t !== void 0 &&
                (this.canTrackVelocity = O0(this.current)));
    }
    setPrevFrameValue(t = this.current) {
        ((this.prevFrameValue = t), (this.prevUpdatedAt = this.updatedAt));
    }
    onChange(t) {
        return this.on('change', t);
    }
    on(t, n) {
        this.events[t] || (this.events[t] = new hu());
        const r = this.events[t].add(n);
        return t === 'change'
            ? () => {
                  (r(),
                      F.read(() => {
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
        return (Ar.current && Ar.current.push(this), this.current);
    }
    getPrevious() {
        return this.prev;
    }
    getVelocity() {
        const t = it.now();
        if (!this.canTrackVelocity || this.prevFrameValue === void 0 || t - this.updatedAt > Qc)
            return 0;
        const n = Math.min(this.updatedAt - this.prevUpdatedAt, Qc);
        return pu(parseFloat(this.current) - parseFloat(this.prevFrameValue), n);
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
function et(e, t) {
    return new F0(e, t);
}
function I0(e, t, n) {
    e.hasValue(t) ? e.getValue(t).set(n) : e.addValue(t, et(n));
}
function z0(e, t) {
    const n = Xs(e, t);
    let { transitionEnd: r = {}, transition: i = {}, ...s } = n || {};
    s = { ...s, ...r };
    for (const o in s) {
        const l = bv(s[o]);
        I0(e, o, l);
    }
}
function B0(e) {
    return !!(oe(e) && e.add);
}
function Fl(e, t) {
    const n = e.getValue('willChange');
    if (B0(n)) return n.add(t);
}
function Yp(e) {
    return e.props[Pp];
}
const Xp = (e, t, n) => (((1 - 3 * n + 3 * t) * e + (3 * n - 6 * t)) * e + 3 * t) * e,
    U0 = 1e-7,
    W0 = 12;
function $0(e, t, n, r, i) {
    let s,
        o,
        l = 0;
    do ((o = t + (n - t) / 2), (s = Xp(o, r, i) - e), s > 0 ? (n = o) : (t = o));
    while (Math.abs(s) > U0 && ++l < W0);
    return o;
}
function ai(e, t, n, r) {
    if (e === t && n === r) return ve;
    const i = (s) => $0(s, 0, 1, e, n);
    return (s) => (s === 0 || s === 1 ? s : Xp(i(s), t, r));
}
const Zp = (e) => (t) => (t <= 0.5 ? e(2 * t) / 2 : (2 - e(2 * (1 - t))) / 2),
    qp = (e) => (t) => 1 - e(1 - t),
    Jp = ai(0.33, 1.53, 0.69, 0.99),
    mu = qp(Jp),
    bp = Zp(mu),
    em = (e) => ((e *= 2) < 1 ? 0.5 * mu(e) : 0.5 * (2 - Math.pow(2, -10 * (e - 1)))),
    gu = (e) => 1 - Math.sin(Math.acos(e)),
    tm = qp(gu),
    nm = Zp(gu),
    rm = (e) => /^0[^.\s]+$/u.test(e);
function H0(e) {
    return typeof e == 'number' ? e === 0 : e !== null ? e === 'none' || e === '0' || rm(e) : !0;
}
const Mr = (e) => Math.round(e * 1e5) / 1e5,
    yu = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function K0(e) {
    return e == null;
}
const G0 =
        /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu,
    vu = (e, t) => (n) =>
        !!(
            (typeof n == 'string' && G0.test(n) && n.startsWith(e)) ||
            (t && !K0(n) && Object.prototype.hasOwnProperty.call(n, t))
        ),
    im = (e, t, n) => (r) => {
        if (typeof r != 'string') return r;
        const [i, s, o, l] = r.match(yu);
        return {
            [e]: parseFloat(i),
            [t]: parseFloat(s),
            [n]: parseFloat(o),
            alpha: l !== void 0 ? parseFloat(l) : 1,
        };
    },
    Q0 = (e) => st(0, 255, e),
    Mo = { ...bn, transform: (e) => Math.round(Q0(e)) },
    en = {
        test: vu('rgb', 'red'),
        parse: im('red', 'green', 'blue'),
        transform: ({ red: e, green: t, blue: n, alpha: r = 1 }) =>
            'rgba(' +
            Mo.transform(e) +
            ', ' +
            Mo.transform(t) +
            ', ' +
            Mo.transform(n) +
            ', ' +
            Mr(qr.transform(r)) +
            ')',
    };
function Y0(e) {
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
const Il = { test: vu('#'), parse: Y0, transform: en.transform },
    Rn = {
        test: vu('hsl', 'hue'),
        parse: im('hue', 'saturation', 'lightness'),
        transform: ({ hue: e, saturation: t, lightness: n, alpha: r = 1 }) =>
            'hsla(' +
            Math.round(e) +
            ', ' +
            rt.transform(Mr(t)) +
            ', ' +
            rt.transform(Mr(n)) +
            ', ' +
            Mr(qr.transform(r)) +
            ')',
    },
    he = {
        test: (e) => en.test(e) || Il.test(e) || Rn.test(e),
        parse: (e) => (en.test(e) ? en.parse(e) : Rn.test(e) ? Rn.parse(e) : Il.parse(e)),
        transform: (e) =>
            typeof e == 'string' ? e : e.hasOwnProperty('red') ? en.transform(e) : Rn.transform(e),
    },
    X0 =
        /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
function Z0(e) {
    var t, n;
    return (
        isNaN(e) &&
        typeof e == 'string' &&
        (((t = e.match(yu)) === null || t === void 0 ? void 0 : t.length) || 0) +
            (((n = e.match(X0)) === null || n === void 0 ? void 0 : n.length) || 0) >
            0
    );
}
const sm = 'number',
    om = 'color',
    q0 = 'var',
    J0 = 'var(',
    Yc = '${}',
    b0 =
        /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function Jr(e) {
    const t = e.toString(),
        n = [],
        r = { color: [], number: [], var: [] },
        i = [];
    let s = 0;
    const l = t
        .replace(
            b0,
            (a) => (
                he.test(a)
                    ? (r.color.push(s), i.push(om), n.push(he.parse(a)))
                    : a.startsWith(J0)
                      ? (r.var.push(s), i.push(q0), n.push(a))
                      : (r.number.push(s), i.push(sm), n.push(parseFloat(a))),
                ++s,
                Yc
            ),
        )
        .split(Yc);
    return { values: n, split: l, indexes: r, types: i };
}
function lm(e) {
    return Jr(e).values;
}
function am(e) {
    const { split: t, types: n } = Jr(e),
        r = t.length;
    return (i) => {
        let s = '';
        for (let o = 0; o < r; o++)
            if (((s += t[o]), i[o] !== void 0)) {
                const l = n[o];
                l === sm ? (s += Mr(i[o])) : l === om ? (s += he.transform(i[o])) : (s += i[o]);
            }
        return s;
    };
}
const e1 = (e) => (typeof e == 'number' ? 0 : e);
function t1(e) {
    const t = lm(e);
    return am(e)(t.map(e1));
}
const It = { test: Z0, parse: lm, createTransformer: am, getAnimatableNone: t1 },
    n1 = new Set(['brightness', 'contrast', 'saturate', 'opacity']);
function r1(e) {
    const [t, n] = e.slice(0, -1).split('(');
    if (t === 'drop-shadow') return e;
    const [r] = n.match(yu) || [];
    if (!r) return e;
    const i = n.replace(r, '');
    let s = n1.has(t) ? 1 : 0;
    return (r !== n && (s *= 100), t + '(' + s + i + ')');
}
const i1 = /\b([a-z-]*)\(.*?\)/gu,
    zl = {
        ...It,
        getAnimatableNone: (e) => {
            const t = e.match(i1);
            return t ? t.map(r1).join(' ') : e;
        },
    },
    s1 = {
        ...tu,
        color: he,
        backgroundColor: he,
        outlineColor: he,
        fill: he,
        stroke: he,
        borderColor: he,
        borderTopColor: he,
        borderRightColor: he,
        borderBottomColor: he,
        borderLeftColor: he,
        filter: zl,
        WebkitFilter: zl,
    },
    wu = (e) => s1[e];
function um(e, t) {
    let n = wu(e);
    return (n !== zl && (n = It), n.getAnimatableNone ? n.getAnimatableNone(t) : void 0);
}
const o1 = new Set(['auto', 'none', '0']);
function l1(e, t, n) {
    let r = 0,
        i;
    for (; r < e.length && !i; ) {
        const s = e[r];
        (typeof s == 'string' && !o1.has(s) && Jr(s).values.length && (i = e[r]), r++);
    }
    if (i && n) for (const s of t) e[s] = um(n, i);
}
const Xc = (e) => e === bn || e === D,
    Zc = (e, t) => parseFloat(e.split(', ')[t]),
    qc =
        (e, t) =>
        (n, { transform: r }) => {
            if (r === 'none' || !r) return 0;
            const i = r.match(/^matrix3d\((.+)\)$/u);
            if (i) return Zc(i[1], t);
            {
                const s = r.match(/^matrix\((.+)\)$/u);
                return s ? Zc(s[1], e) : 0;
            }
        },
    a1 = new Set(['x', 'y', 'z']),
    u1 = Jn.filter((e) => !a1.has(e));
function c1(e) {
    const t = [];
    return (
        u1.forEach((n) => {
            const r = e.getValue(n);
            r !== void 0 && (t.push([n, r.get()]), r.set(n.startsWith('scale') ? 1 : 0));
        }),
        t
    );
}
const Qn = {
    width: ({ x: e }, { paddingLeft: t = '0', paddingRight: n = '0' }) =>
        e.max - e.min - parseFloat(t) - parseFloat(n),
    height: ({ y: e }, { paddingTop: t = '0', paddingBottom: n = '0' }) =>
        e.max - e.min - parseFloat(t) - parseFloat(n),
    top: (e, { top: t }) => parseFloat(t),
    left: (e, { left: t }) => parseFloat(t),
    bottom: ({ y: e }, { top: t }) => parseFloat(t) + (e.max - e.min),
    right: ({ x: e }, { left: t }) => parseFloat(t) + (e.max - e.min),
    x: qc(4, 13),
    y: qc(5, 14),
};
Qn.translateX = Qn.x;
Qn.translateY = Qn.y;
const sn = new Set();
let Bl = !1,
    Ul = !1;
function cm() {
    if (Ul) {
        const e = Array.from(sn).filter((r) => r.needsMeasurement),
            t = new Set(e.map((r) => r.element)),
            n = new Map();
        (t.forEach((r) => {
            const i = c1(r);
            i.length && (n.set(r, i), r.render());
        }),
            e.forEach((r) => r.measureInitialState()),
            t.forEach((r) => {
                r.render();
                const i = n.get(r);
                i &&
                    i.forEach(([s, o]) => {
                        var l;
                        (l = r.getValue(s)) === null || l === void 0 || l.set(o);
                    });
            }),
            e.forEach((r) => r.measureEndState()),
            e.forEach((r) => {
                r.suspendedScrollY !== void 0 && window.scrollTo(0, r.suspendedScrollY);
            }));
    }
    ((Ul = !1), (Bl = !1), sn.forEach((e) => e.complete()), sn.clear());
}
function fm() {
    sn.forEach((e) => {
        (e.readKeyframes(), e.needsMeasurement && (Ul = !0));
    });
}
function f1() {
    (fm(), cm());
}
class xu {
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
                ? (sn.add(this), Bl || ((Bl = !0), F.read(fm), F.resolveKeyframes(cm)))
                : (this.readKeyframes(), this.complete()));
    }
    readKeyframes() {
        const { unresolvedKeyframes: t, name: n, element: r, motionValue: i } = this;
        for (let s = 0; s < t.length; s++)
            if (t[s] === null)
                if (s === 0) {
                    const o = i == null ? void 0 : i.get(),
                        l = t[t.length - 1];
                    if (o !== void 0) t[0] = o;
                    else if (r && n) {
                        const a = r.readValue(n, l);
                        a != null && (t[0] = a);
                    }
                    (t[0] === void 0 && (t[0] = l), i && o === void 0 && i.set(t[0]));
                } else t[s] = t[s - 1];
    }
    setFinalKeyframe() {}
    measureInitialState() {}
    renderEndStyles() {}
    measureEndState() {}
    complete() {
        ((this.isComplete = !0),
            this.onComplete(this.unresolvedKeyframes, this.finalKeyframe),
            sn.delete(this));
    }
    cancel() {
        this.isComplete || ((this.isScheduled = !1), sn.delete(this));
    }
    resume() {
        this.isComplete || this.scheduleResolve();
    }
}
const dm = (e) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(e),
    d1 = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function h1(e) {
    const t = d1.exec(e);
    if (!t) return [,];
    const [, n, r, i] = t;
    return [`--${n ?? r}`, i];
}
function hm(e, t, n = 1) {
    const [r, i] = h1(e);
    if (!r) return;
    const s = window.getComputedStyle(t).getPropertyValue(r);
    if (s) {
        const o = s.trim();
        return dm(o) ? parseFloat(o) : o;
    }
    return eu(i) ? hm(i, t, n + 1) : i;
}
const pm = (e) => (t) => t.test(e),
    p1 = { test: (e) => e === 'auto', parse: (e) => e },
    mm = [bn, D, rt, xt, s0, i0, p1],
    Jc = (e) => mm.find(pm(e));
class gm extends xu {
    constructor(t, n, r, i, s) {
        super(t, n, r, i, s, !0);
    }
    readKeyframes() {
        const { unresolvedKeyframes: t, element: n, name: r } = this;
        if (!n || !n.current) return;
        super.readKeyframes();
        for (let a = 0; a < t.length; a++) {
            let u = t[a];
            if (typeof u == 'string' && ((u = u.trim()), eu(u))) {
                const c = hm(u, n.current);
                (c !== void 0 && (t[a] = c), a === t.length - 1 && (this.finalKeyframe = u));
            }
        }
        if ((this.resolveNoneKeyframes(), !Qp.has(r) || t.length !== 2)) return;
        const [i, s] = t,
            o = Jc(i),
            l = Jc(s);
        if (o !== l)
            if (Xc(o) && Xc(l))
                for (let a = 0; a < t.length; a++) {
                    const u = t[a];
                    typeof u == 'string' && (t[a] = parseFloat(u));
                }
            else this.needsMeasurement = !0;
    }
    resolveNoneKeyframes() {
        const { unresolvedKeyframes: t, name: n } = this,
            r = [];
        for (let i = 0; i < t.length; i++) H0(t[i]) && r.push(i);
        r.length && l1(t, r, n);
    }
    measureInitialState() {
        const { element: t, unresolvedKeyframes: n, name: r } = this;
        if (!t || !t.current) return;
        (r === 'height' && (this.suspendedScrollY = window.pageYOffset),
            (this.measuredOrigin = Qn[r](
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
            l = i[o];
        ((i[o] = Qn[r](n.measureViewportBox(), window.getComputedStyle(n.current))),
            l !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = l),
            !((t = this.removedTransforms) === null || t === void 0) &&
                t.length &&
                this.removedTransforms.forEach(([a, u]) => {
                    n.getValue(a).set(u);
                }),
            this.resolveNoneKeyframes());
    }
}
const bc = (e, t) =>
    t === 'zIndex'
        ? !1
        : !!(
              typeof e == 'number' ||
              Array.isArray(e) ||
              (typeof e == 'string' && (It.test(e) || e === '0') && !e.startsWith('url('))
          );
function m1(e) {
    const t = e[0];
    if (e.length === 1) return !0;
    for (let n = 0; n < e.length; n++) if (e[n] !== t) return !0;
}
function g1(e, t, n, r) {
    const i = e[0];
    if (i === null) return !1;
    if (t === 'display' || t === 'visibility') return !0;
    const s = e[e.length - 1],
        o = bc(i, t),
        l = bc(s, t);
    return !o || !l ? !1 : m1(e) || ((n === 'spring' || au(n)) && r);
}
const y1 = (e) => e !== null;
function Zs(e, { repeat: t, repeatType: n = 'loop' }, r) {
    const i = e.filter(y1),
        s = t && n !== 'loop' && t % 2 === 1 ? 0 : i.length - 1;
    return !s || r === void 0 ? i[s] : r;
}
const v1 = 40;
class ym {
    constructor({
        autoplay: t = !0,
        delay: n = 0,
        type: r = 'keyframes',
        repeat: i = 0,
        repeatDelay: s = 0,
        repeatType: o = 'loop',
        ...l
    }) {
        ((this.isStopped = !1),
            (this.hasAttemptedResolve = !1),
            (this.createdAt = it.now()),
            (this.options = {
                autoplay: t,
                delay: n,
                type: r,
                repeat: i,
                repeatDelay: s,
                repeatType: o,
                ...l,
            }),
            this.updateFinishedPromise());
    }
    calcStartTime() {
        return this.resolvedAt
            ? this.resolvedAt - this.createdAt > v1
                ? this.resolvedAt
                : this.createdAt
            : this.createdAt;
    }
    get resolved() {
        return (!this._resolved && !this.hasAttemptedResolve && f1(), this._resolved);
    }
    onKeyframesResolved(t, n) {
        ((this.resolvedAt = it.now()), (this.hasAttemptedResolve = !0));
        const {
            name: r,
            type: i,
            velocity: s,
            delay: o,
            onComplete: l,
            onUpdate: a,
            isGenerator: u,
        } = this.options;
        if (!u && !g1(t, r, i, s))
            if (o) this.options.duration = 0;
            else {
                (a && a(Zs(t, this.options, n)), l && l(), this.resolveFinishedPromise());
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
const H = (e, t, n) => e + (t - e) * n;
function Ro(e, t, n) {
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
function w1({ hue: e, saturation: t, lightness: n, alpha: r }) {
    ((e /= 360), (t /= 100), (n /= 100));
    let i = 0,
        s = 0,
        o = 0;
    if (!t) i = s = o = n;
    else {
        const l = n < 0.5 ? n * (1 + t) : n + t - n * t,
            a = 2 * n - l;
        ((i = Ro(a, l, e + 1 / 3)), (s = Ro(a, l, e)), (o = Ro(a, l, e - 1 / 3)));
    }
    return {
        red: Math.round(i * 255),
        green: Math.round(s * 255),
        blue: Math.round(o * 255),
        alpha: r,
    };
}
function Cs(e, t) {
    return (n) => (n > 0 ? t : e);
}
const Do = (e, t, n) => {
        const r = e * e,
            i = n * (t * t - r) + r;
        return i < 0 ? 0 : Math.sqrt(i);
    },
    x1 = [Il, en, Rn],
    S1 = (e) => x1.find((t) => t.test(e));
function ef(e) {
    const t = S1(e);
    if (!t) return !1;
    let n = t.parse(e);
    return (t === Rn && (n = w1(n)), n);
}
const tf = (e, t) => {
        const n = ef(e),
            r = ef(t);
        if (!n || !r) return Cs(e, t);
        const i = { ...n };
        return (s) => (
            (i.red = Do(n.red, r.red, s)),
            (i.green = Do(n.green, r.green, s)),
            (i.blue = Do(n.blue, r.blue, s)),
            (i.alpha = H(n.alpha, r.alpha, s)),
            en.transform(i)
        );
    },
    T1 = (e, t) => (n) => t(e(n)),
    ui = (...e) => e.reduce(T1),
    Wl = new Set(['none', 'hidden']);
function P1(e, t) {
    return Wl.has(e) ? (n) => (n <= 0 ? e : t) : (n) => (n >= 1 ? t : e);
}
function k1(e, t) {
    return (n) => H(e, t, n);
}
function Su(e) {
    return typeof e == 'number'
        ? k1
        : typeof e == 'string'
          ? eu(e)
              ? Cs
              : he.test(e)
                ? tf
                : A1
          : Array.isArray(e)
            ? vm
            : typeof e == 'object'
              ? he.test(e)
                  ? tf
                  : C1
              : Cs;
}
function vm(e, t) {
    const n = [...e],
        r = n.length,
        i = e.map((s, o) => Su(s)(s, t[o]));
    return (s) => {
        for (let o = 0; o < r; o++) n[o] = i[o](s);
        return n;
    };
}
function C1(e, t) {
    const n = { ...e, ...t },
        r = {};
    for (const i in n) e[i] !== void 0 && t[i] !== void 0 && (r[i] = Su(e[i])(e[i], t[i]));
    return (i) => {
        for (const s in r) n[s] = r[s](i);
        return n;
    };
}
function E1(e, t) {
    var n;
    const r = [],
        i = { color: 0, var: 0, number: 0 };
    for (let s = 0; s < t.values.length; s++) {
        const o = t.types[s],
            l = e.indexes[o][i[o]],
            a = (n = e.values[l]) !== null && n !== void 0 ? n : 0;
        ((r[s] = a), i[o]++);
    }
    return r;
}
const A1 = (e, t) => {
    const n = It.createTransformer(t),
        r = Jr(e),
        i = Jr(t);
    return r.indexes.var.length === i.indexes.var.length &&
        r.indexes.color.length === i.indexes.color.length &&
        r.indexes.number.length >= i.indexes.number.length
        ? (Wl.has(e) && !i.values.length) || (Wl.has(t) && !r.values.length)
            ? P1(e, t)
            : ui(vm(E1(r, i), i.values), n)
        : Cs(e, t);
};
function wm(e, t, n) {
    return typeof e == 'number' && typeof t == 'number' && typeof n == 'number'
        ? H(e, t, n)
        : Su(e)(e, t);
}
const M1 = 5;
function xm(e, t, n) {
    const r = Math.max(t - M1, 0);
    return pu(n - e(r), t - r);
}
const Q = {
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
    Lo = 0.001;
function R1({
    duration: e = Q.duration,
    bounce: t = Q.bounce,
    velocity: n = Q.velocity,
    mass: r = Q.mass,
}) {
    let i,
        s,
        o = 1 - t;
    ((o = st(Q.minDamping, Q.maxDamping, o)),
        (e = st(Q.minDuration, Q.maxDuration, dt(e))),
        o < 1
            ? ((i = (u) => {
                  const c = u * o,
                      f = c * e,
                      d = c - n,
                      g = $l(u, o),
                      y = Math.exp(-f);
                  return Lo - (d / g) * y;
              }),
              (s = (u) => {
                  const f = u * o * e,
                      d = f * n + n,
                      g = Math.pow(o, 2) * Math.pow(u, 2) * e,
                      y = Math.exp(-f),
                      v = $l(Math.pow(u, 2), o);
                  return ((-i(u) + Lo > 0 ? -1 : 1) * ((d - g) * y)) / v;
              }))
            : ((i = (u) => {
                  const c = Math.exp(-u * e),
                      f = (u - n) * e + 1;
                  return -Lo + c * f;
              }),
              (s = (u) => {
                  const c = Math.exp(-u * e),
                      f = (n - u) * (e * e);
                  return c * f;
              })));
    const l = 5 / e,
        a = L1(i, s, l);
    if (((e = ft(e)), isNaN(a))) return { stiffness: Q.stiffness, damping: Q.damping, duration: e };
    {
        const u = Math.pow(a, 2) * r;
        return { stiffness: u, damping: o * 2 * Math.sqrt(r * u), duration: e };
    }
}
const D1 = 12;
function L1(e, t, n) {
    let r = n;
    for (let i = 1; i < D1; i++) r = r - e(r) / t(r);
    return r;
}
function $l(e, t) {
    return e * Math.sqrt(1 - t * t);
}
const V1 = ['duration', 'bounce'],
    _1 = ['stiffness', 'damping', 'mass'];
function nf(e, t) {
    return t.some((n) => e[n] !== void 0);
}
function N1(e) {
    let t = {
        velocity: Q.velocity,
        stiffness: Q.stiffness,
        damping: Q.damping,
        mass: Q.mass,
        isResolvedFromDuration: !1,
        ...e,
    };
    if (!nf(e, _1) && nf(e, V1))
        if (e.visualDuration) {
            const n = e.visualDuration,
                r = (2 * Math.PI) / (n * 1.2),
                i = r * r,
                s = 2 * st(0.05, 1, 1 - (e.bounce || 0)) * Math.sqrt(i);
            t = { ...t, mass: Q.mass, stiffness: i, damping: s };
        } else {
            const n = R1(e);
            ((t = { ...t, ...n, mass: Q.mass }), (t.isResolvedFromDuration = !0));
        }
    return t;
}
function Sm(e = Q.visualDuration, t = Q.bounce) {
    const n = typeof e != 'object' ? { visualDuration: e, keyframes: [0, 1], bounce: t } : e;
    let { restSpeed: r, restDelta: i } = n;
    const s = n.keyframes[0],
        o = n.keyframes[n.keyframes.length - 1],
        l = { done: !1, value: s },
        {
            stiffness: a,
            damping: u,
            mass: c,
            duration: f,
            velocity: d,
            isResolvedFromDuration: g,
        } = N1({ ...n, velocity: -dt(n.velocity || 0) }),
        y = d || 0,
        v = u / (2 * Math.sqrt(a * c)),
        S = o - s,
        p = dt(Math.sqrt(a / c)),
        h = Math.abs(S) < 5;
    (r || (r = h ? Q.restSpeed.granular : Q.restSpeed.default),
        i || (i = h ? Q.restDelta.granular : Q.restDelta.default));
    let m;
    if (v < 1) {
        const x = $l(p, v);
        m = (k) => {
            const E = Math.exp(-v * p * k);
            return o - E * (((y + v * p * S) / x) * Math.sin(x * k) + S * Math.cos(x * k));
        };
    } else if (v === 1) m = (x) => o - Math.exp(-p * x) * (S + (y + p * S) * x);
    else {
        const x = p * Math.sqrt(v * v - 1);
        m = (k) => {
            const E = Math.exp(-v * p * k),
                T = Math.min(x * k, 300);
            return o - (E * ((y + v * p * S) * Math.sinh(T) + x * S * Math.cosh(T))) / x;
        };
    }
    const w = {
        calculatedDuration: (g && f) || null,
        next: (x) => {
            const k = m(x);
            if (g) l.done = x >= f;
            else {
                let E = 0;
                v < 1 && (E = x === 0 ? ft(y) : xm(m, x, k));
                const T = Math.abs(E) <= r,
                    N = Math.abs(o - k) <= i;
                l.done = T && N;
            }
            return ((l.value = l.done ? o : k), l);
        },
        toString: () => {
            const x = Math.min(zp(w), jl),
                k = Bp((E) => w.next(x * E).value, x, 30);
            return x + 'ms ' + k;
        },
    };
    return w;
}
function rf({
    keyframes: e,
    velocity: t = 0,
    power: n = 0.8,
    timeConstant: r = 325,
    bounceDamping: i = 10,
    bounceStiffness: s = 500,
    modifyTarget: o,
    min: l,
    max: a,
    restDelta: u = 0.5,
    restSpeed: c,
}) {
    const f = e[0],
        d = { done: !1, value: f },
        g = (T) => (l !== void 0 && T < l) || (a !== void 0 && T > a),
        y = (T) => (l === void 0 ? a : a === void 0 || Math.abs(l - T) < Math.abs(a - T) ? l : a);
    let v = n * t;
    const S = f + v,
        p = o === void 0 ? S : o(S);
    p !== S && (v = p - f);
    const h = (T) => -v * Math.exp(-T / r),
        m = (T) => p + h(T),
        w = (T) => {
            const N = h(T),
                L = m(T);
            ((d.done = Math.abs(N) <= u), (d.value = d.done ? p : L));
        };
    let x, k;
    const E = (T) => {
        g(d.value) &&
            ((x = T),
            (k = Sm({
                keyframes: [d.value, y(d.value)],
                velocity: xm(m, T, d.value),
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
            next: (T) => {
                let N = !1;
                return (
                    !k && x === void 0 && ((N = !0), w(T), E(T)),
                    x !== void 0 && T >= x ? k.next(T - x) : (!N && w(T), d)
                );
            },
        }
    );
}
const j1 = ai(0.42, 0, 1, 1),
    O1 = ai(0, 0, 0.58, 1),
    Tm = ai(0.42, 0, 0.58, 1),
    F1 = (e) => Array.isArray(e) && typeof e[0] != 'number',
    I1 = {
        linear: ve,
        easeIn: j1,
        easeInOut: Tm,
        easeOut: O1,
        circIn: gu,
        circInOut: nm,
        circOut: tm,
        backIn: mu,
        backInOut: bp,
        backOut: Jp,
        anticipate: em,
    },
    sf = (e) => {
        if (uu(e)) {
            vp(e.length === 4);
            const [t, n, r, i] = e;
            return ai(t, n, r, i);
        } else if (typeof e == 'string') return I1[e];
        return e;
    };
function z1(e, t, n) {
    const r = [],
        i = n || wm,
        s = e.length - 1;
    for (let o = 0; o < s; o++) {
        let l = i(e[o], e[o + 1]);
        if (t) {
            const a = Array.isArray(t) ? t[o] || ve : t;
            l = ui(a, l);
        }
        r.push(l);
    }
    return r;
}
function Tu(e, t, { clamp: n = !0, ease: r, mixer: i } = {}) {
    const s = e.length;
    if ((vp(s === t.length), s === 1)) return () => t[0];
    if (s === 2 && t[0] === t[1]) return () => t[1];
    const o = e[0] === e[1];
    e[0] > e[s - 1] && ((e = [...e].reverse()), (t = [...t].reverse()));
    const l = z1(t, r, i),
        a = l.length,
        u = (c) => {
            if (o && c < e[0]) return t[0];
            let f = 0;
            if (a > 1) for (; f < e.length - 2 && !(c < e[f + 1]); f++);
            const d = fn(e[f], e[f + 1], c);
            return l[f](d);
        };
    return n ? (c) => u(st(e[0], e[s - 1], c)) : u;
}
function B1(e, t) {
    const n = e[e.length - 1];
    for (let r = 1; r <= t; r++) {
        const i = fn(0, t, r);
        e.push(H(n, 1, i));
    }
}
function Pm(e) {
    const t = [0];
    return (B1(t, e.length - 1), t);
}
function U1(e, t) {
    return e.map((n) => n * t);
}
function W1(e, t) {
    return e.map(() => t || Tm).splice(0, e.length - 1);
}
function Es({ duration: e = 300, keyframes: t, times: n, ease: r = 'easeInOut' }) {
    const i = F1(r) ? r.map(sf) : sf(r),
        s = { done: !1, value: t[0] },
        o = U1(n && n.length === t.length ? n : Pm(t), e),
        l = Tu(o, t, { ease: Array.isArray(i) ? i : W1(t, i) });
    return { calculatedDuration: e, next: (a) => ((s.value = l(a)), (s.done = a >= e), s) };
}
const $1 = (e) => {
        const t = ({ timestamp: n }) => e(n);
        return {
            start: () => F.update(t, !0),
            stop: () => Ze(t),
            now: () => (ee.isProcessing ? ee.timestamp : it.now()),
        };
    },
    H1 = { decay: rf, inertia: rf, tween: Es, keyframes: Es, spring: Sm },
    K1 = (e) => e / 100;
class qs extends ym {
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
                const { onStop: a } = this.options;
                a && a();
            }));
        const { name: n, motionValue: r, element: i, keyframes: s } = this.options,
            o = (i == null ? void 0 : i.KeyframeResolver) || xu,
            l = (a, u) => this.onKeyframesResolved(a, u);
        ((this.resolver = new o(s, l, n, r, i)), this.resolver.scheduleResolve());
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
            l = au(n) ? n : H1[n] || Es;
        let a, u;
        l !== Es && typeof t[0] != 'number' && ((a = ui(K1, wm(t[0], t[1]))), (t = [0, 100]));
        const c = l({ ...this.options, keyframes: t });
        (s === 'mirror' && (u = l({ ...this.options, keyframes: [...t].reverse(), velocity: -o })),
            c.calculatedDuration === null && (c.calculatedDuration = zp(c)));
        const { calculatedDuration: f } = c,
            d = f + i,
            g = d * (r + 1) - i;
        return {
            generator: c,
            mirroredGenerator: u,
            mapPercentToKeyframes: a,
            calculatedDuration: f,
            resolvedDuration: d,
            totalDuration: g,
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
            const { keyframes: T } = this.options;
            return { done: !0, value: T[T.length - 1] };
        }
        const {
            finalKeyframe: i,
            generator: s,
            mirroredGenerator: o,
            mapPercentToKeyframes: l,
            keyframes: a,
            calculatedDuration: u,
            totalDuration: c,
            resolvedDuration: f,
        } = r;
        if (this.startTime === null) return s.next(0);
        const { delay: d, repeat: g, repeatType: y, repeatDelay: v, onUpdate: S } = this.options;
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
        let m = this.currentTime,
            w = s;
        if (g) {
            const T = Math.min(this.currentTime, c) / f;
            let N = Math.floor(T),
                L = T % 1;
            (!L && T >= 1 && (L = 1),
                L === 1 && N--,
                (N = Math.min(N, g + 1)),
                !!(N % 2) &&
                    (y === 'reverse'
                        ? ((L = 1 - L), v && (L -= v / f))
                        : y === 'mirror' && (w = o)),
                (m = st(0, 1, L) * f));
        }
        const x = h ? { done: !1, value: a[0] } : w.next(m);
        l && (x.value = l(x.value));
        let { done: k } = x;
        !h && u !== null && (k = this.speed >= 0 ? this.currentTime >= c : this.currentTime <= 0);
        const E =
            this.holdTime === null &&
            (this.state === 'finished' || (this.state === 'running' && k));
        return (
            E && i !== void 0 && (x.value = Zs(a, this.options, i)),
            S && S(x.value),
            E && this.finish(),
            x
        );
    }
    get duration() {
        const { resolved: t } = this;
        return t ? dt(t.calculatedDuration) : 0;
    }
    get time() {
        return dt(this.currentTime);
    }
    set time(t) {
        ((t = ft(t)),
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
        ((this.playbackSpeed = t), n && (this.time = dt(this.currentTime)));
    }
    play() {
        if ((this.resolver.isScheduled || this.resolver.resume(), !this._resolved)) {
            this.pendingPlayState = 'running';
            return;
        }
        if (this.isStopped) return;
        const { driver: t = $1, onPlay: n, startTime: r } = this.options;
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
function G1(e) {
    return new qs(e);
}
const Q1 = new Set(['opacity', 'clipPath', 'filter', 'transform']);
function Y1(
    e,
    t,
    n,
    {
        delay: r = 0,
        duration: i = 300,
        repeat: s = 0,
        repeatType: o = 'loop',
        ease: l = 'easeInOut',
        times: a,
    } = {},
) {
    const u = { [t]: n };
    a && (u.offset = a);
    const c = Wp(l, i);
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
const X1 = Qa(() => Object.hasOwnProperty.call(Element.prototype, 'animate')),
    As = 10,
    Z1 = 2e4;
function q1(e) {
    return au(e.type) || e.type === 'spring' || !Up(e.ease);
}
function J1(e, t) {
    const n = new qs({ ...t, keyframes: e, repeat: 0, delay: 0, isGenerator: !0 });
    let r = { done: !1, value: e[0] };
    const i = [];
    let s = 0;
    for (; !r.done && s < Z1; ) ((r = n.sample(s)), i.push(r.value), (s += As));
    return { times: void 0, keyframes: i, duration: s - As, ease: 'linear' };
}
const km = { anticipate: em, backInOut: bp, circInOut: nm };
function b1(e) {
    return e in km;
}
class of extends ym {
    constructor(t) {
        super(t);
        const { name: n, motionValue: r, element: i, keyframes: s } = this.options;
        ((this.resolver = new gm(s, (o, l) => this.onKeyframesResolved(o, l), n, r, i)),
            this.resolver.scheduleResolve());
    }
    initPlayback(t, n) {
        let {
            duration: r = 300,
            times: i,
            ease: s,
            type: o,
            motionValue: l,
            name: a,
            startTime: u,
        } = this.options;
        if (!l.owner || !l.owner.current) return !1;
        if ((typeof s == 'string' && ks() && b1(s) && (s = km[s]), q1(this.options))) {
            const { onComplete: f, onUpdate: d, motionValue: g, element: y, ...v } = this.options,
                S = J1(t, v);
            ((t = S.keyframes),
                t.length === 1 && (t[1] = t[0]),
                (r = S.duration),
                (i = S.times),
                (s = S.ease),
                (o = 'keyframes'));
        }
        const c = Y1(l.owner.current, a, t, { ...this.options, duration: r, times: i, ease: s });
        return (
            (c.startTime = u ?? this.calcStartTime()),
            this.pendingTimeline
                ? ($c(c, this.pendingTimeline), (this.pendingTimeline = void 0))
                : (c.onfinish = () => {
                      const { onComplete: f } = this.options;
                      (l.set(Zs(t, this.options, n)),
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
        return dt(n);
    }
    get time() {
        const { resolved: t } = this;
        if (!t) return 0;
        const { animation: n } = t;
        return dt(n.currentTime || 0);
    }
    set time(t) {
        const { resolved: n } = this;
        if (!n) return;
        const { animation: r } = n;
        r.currentTime = ft(t);
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
            if (!n) return ve;
            const { animation: r } = n;
            $c(r, t);
        }
        return ve;
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
        const { animation: n, keyframes: r, duration: i, type: s, ease: o, times: l } = t;
        if (n.playState === 'idle' || n.playState === 'finished') return;
        if (this.time) {
            const { motionValue: u, onUpdate: c, onComplete: f, element: d, ...g } = this.options,
                y = new qs({
                    ...g,
                    keyframes: r,
                    duration: i,
                    type: s,
                    ease: o,
                    times: l,
                    isGenerator: !0,
                }),
                v = ft(this.time);
            u.setWithVelocity(y.sample(v - As).value, y.sample(v).value, As);
        }
        const { onStop: a } = this.options;
        (a && a(), this.cancel());
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
        const { motionValue: n, name: r, repeatDelay: i, repeatType: s, damping: o, type: l } = t;
        if (!n || !n.owner || !(n.owner.current instanceof HTMLElement)) return !1;
        const { onUpdate: a, transformTemplate: u } = n.owner.getProps();
        return (
            X1() && r && Q1.has(r) && !a && !u && !i && s !== 'mirror' && o !== 0 && l !== 'inertia'
        );
    }
}
const ew = { type: 'spring', stiffness: 500, damping: 25, restSpeed: 10 },
    tw = (e) => ({
        type: 'spring',
        stiffness: 550,
        damping: e === 0 ? 2 * Math.sqrt(550) : 30,
        restSpeed: 10,
    }),
    nw = { type: 'keyframes', duration: 0.8 },
    rw = { type: 'keyframes', ease: [0.25, 0.1, 0.35, 1], duration: 0.3 },
    iw = (e, { keyframes: t }) =>
        t.length > 2 ? nw : pn.has(e) ? (e.startsWith('scale') ? tw(t[1]) : ew) : rw;
function sw({
    when: e,
    delay: t,
    delayChildren: n,
    staggerChildren: r,
    staggerDirection: i,
    repeat: s,
    repeatType: o,
    repeatDelay: l,
    from: a,
    elapsed: u,
    ...c
}) {
    return !!Object.keys(c).length;
}
const Pu =
    (e, t, n, r = {}, i, s) =>
    (o) => {
        const l = lu(r, e) || {},
            a = l.delay || r.delay || 0;
        let { elapsed: u = 0 } = r;
        u = u - ft(a);
        let c = {
            keyframes: Array.isArray(n) ? n : [null, n],
            ease: 'easeOut',
            velocity: t.getVelocity(),
            ...l,
            delay: -u,
            onUpdate: (d) => {
                (t.set(d), l.onUpdate && l.onUpdate(d));
            },
            onComplete: () => {
                (o(), l.onComplete && l.onComplete());
            },
            name: e,
            motionValue: t,
            element: s ? void 0 : i,
        };
        (sw(l) || (c = { ...c, ...iw(e, c) }),
            c.duration && (c.duration = ft(c.duration)),
            c.repeatDelay && (c.repeatDelay = ft(c.repeatDelay)),
            c.from !== void 0 && (c.keyframes[0] = c.from));
        let f = !1;
        if (
            ((c.type === !1 || (c.duration === 0 && !c.repeatDelay)) &&
                ((c.duration = 0), c.delay === 0 && (f = !0)),
            f && !s && t.get() !== void 0)
        ) {
            const d = Zs(c.keyframes, l);
            if (d !== void 0)
                return (
                    F.update(() => {
                        (c.onUpdate(d), c.onComplete());
                    }),
                    new E0([])
                );
        }
        return !s && of.supports(c) ? new of(c) : new qs(c);
    };
function ow({ protectedKeys: e, needsAnimating: t }, n) {
    const r = e.hasOwnProperty(n) && t[n] !== !0;
    return ((t[n] = !1), r);
}
function Cm(e, t, { delay: n = 0, transitionOverride: r, type: i } = {}) {
    var s;
    let { transition: o = e.getDefaultTransition(), transitionEnd: l, ...a } = t;
    r && (o = r);
    const u = [],
        c = i && e.animationState && e.animationState.getState()[i];
    for (const f in a) {
        const d = e.getValue(f, (s = e.latestValues[f]) !== null && s !== void 0 ? s : null),
            g = a[f];
        if (g === void 0 || (c && ow(c, f))) continue;
        const y = { delay: n, ...lu(o || {}, f) };
        let v = !1;
        if (window.MotionHandoffAnimation) {
            const p = Yp(e);
            if (p) {
                const h = window.MotionHandoffAnimation(p, f, F);
                h !== null && ((y.startTime = h), (v = !0));
            }
        }
        (Fl(e, f),
            d.start(Pu(f, d, g, e.shouldReduceMotion && Qp.has(f) ? { type: !1 } : y, e, v)));
        const S = d.animation;
        S && u.push(S);
    }
    return (
        l &&
            Promise.all(u).then(() => {
                F.update(() => {
                    l && z0(e, l);
                });
            }),
        u
    );
}
function Hl(e, t, n = {}) {
    var r;
    const i = Xs(
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
    const o = i ? () => Promise.all(Cm(e, i, n)) : () => Promise.resolve(),
        l =
            e.variantChildren && e.variantChildren.size
                ? (u = 0) => {
                      const { delayChildren: c = 0, staggerChildren: f, staggerDirection: d } = s;
                      return lw(e, t, c + u, f, d, n);
                  }
                : () => Promise.resolve(),
        { when: a } = s;
    if (a) {
        const [u, c] = a === 'beforeChildren' ? [o, l] : [l, o];
        return u().then(() => c());
    } else return Promise.all([o(), l(n.delay)]);
}
function lw(e, t, n = 0, r = 0, i = 1, s) {
    const o = [],
        l = (e.variantChildren.size - 1) * r,
        a = i === 1 ? (u = 0) => u * r : (u = 0) => l - u * r;
    return (
        Array.from(e.variantChildren)
            .sort(aw)
            .forEach((u, c) => {
                (u.notify('AnimationStart', t),
                    o.push(
                        Hl(u, t, { ...s, delay: n + a(c) }).then(() =>
                            u.notify('AnimationComplete', t),
                        ),
                    ));
            }),
        Promise.all(o)
    );
}
function aw(e, t) {
    return e.sortNodePosition(t);
}
function uw(e, t, n = {}) {
    e.notify('AnimationStart', t);
    let r;
    if (Array.isArray(t)) {
        const i = t.map((s) => Hl(e, s, n));
        r = Promise.all(i);
    } else if (typeof t == 'string') r = Hl(e, t, n);
    else {
        const i = typeof t == 'function' ? Xs(e, t, n.custom) : t;
        r = Promise.all(Cm(e, i, n));
    }
    return r.then(() => {
        e.notify('AnimationComplete', t);
    });
}
const cw = Xa.length;
function Em(e) {
    if (!e) return;
    if (!e.isControllingVariants) {
        const n = e.parent ? Em(e.parent) || {} : {};
        return (e.props.initial !== void 0 && (n.initial = e.props.initial), n);
    }
    const t = {};
    for (let n = 0; n < cw; n++) {
        const r = Xa[n],
            i = e.props[r];
        (Zr(i) || i === !1) && (t[r] = i);
    }
    return t;
}
const fw = [...Ya].reverse(),
    dw = Ya.length;
function hw(e) {
    return (t) => Promise.all(t.map(({ animation: n, options: r }) => uw(e, n, r)));
}
function pw(e) {
    let t = hw(e),
        n = lf(),
        r = !0;
    const i = (a) => (u, c) => {
        var f;
        const d = Xs(
            e,
            c,
            a === 'exit'
                ? (f = e.presenceContext) === null || f === void 0
                    ? void 0
                    : f.custom
                : void 0,
        );
        if (d) {
            const { transition: g, transitionEnd: y, ...v } = d;
            u = { ...u, ...v, ...y };
        }
        return u;
    };
    function s(a) {
        t = a(e);
    }
    function o(a) {
        const { props: u } = e,
            c = Em(e.parent) || {},
            f = [],
            d = new Set();
        let g = {},
            y = 1 / 0;
        for (let S = 0; S < dw; S++) {
            const p = fw[S],
                h = n[p],
                m = u[p] !== void 0 ? u[p] : c[p],
                w = Zr(m),
                x = p === a ? h.isActive : null;
            x === !1 && (y = S);
            let k = m === c[p] && m !== u[p] && w;
            if (
                (k && r && e.manuallyAnimateOnMount && (k = !1),
                (h.protectedKeys = { ...g }),
                (!h.isActive && x === null) ||
                    (!m && !h.prevProp) ||
                    Qs(m) ||
                    typeof m == 'boolean')
            )
                continue;
            const E = mw(h.prevProp, m);
            let T = E || (p === a && h.isActive && !k && w) || (S > y && w),
                N = !1;
            const L = Array.isArray(m) ? m : [m];
            let re = L.reduce(i(p), {});
            x === !1 && (re = {});
            const { prevResolvedValues: vt = {} } = h,
                $t = { ...vt, ...re },
                er = (b) => {
                    ((T = !0), d.has(b) && ((N = !0), d.delete(b)), (h.needsAnimating[b] = !0));
                    const A = e.getValue(b);
                    A && (A.liveStyle = !1);
                };
            for (const b in $t) {
                const A = re[b],
                    V = vt[b];
                if (g.hasOwnProperty(b)) continue;
                let _ = !1;
                (Nl(A) && Nl(V) ? (_ = !Fp(A, V)) : (_ = A !== V),
                    _
                        ? A != null
                            ? er(b)
                            : d.add(b)
                        : A !== void 0 && d.has(b)
                          ? er(b)
                          : (h.protectedKeys[b] = !0));
            }
            ((h.prevProp = m),
                (h.prevResolvedValues = re),
                h.isActive && (g = { ...g, ...re }),
                r && e.blockInitialAnimation && (T = !1),
                T &&
                    (!(k && E) || N) &&
                    f.push(...L.map((b) => ({ animation: b, options: { type: p } }))));
        }
        if (d.size) {
            const S = {};
            (d.forEach((p) => {
                const h = e.getBaseTarget(p),
                    m = e.getValue(p);
                (m && (m.liveStyle = !0), (S[p] = h ?? null));
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
    function l(a, u) {
        var c;
        if (n[a].isActive === u) return Promise.resolve();
        ((c = e.variantChildren) === null ||
            c === void 0 ||
            c.forEach((d) => {
                var g;
                return (g = d.animationState) === null || g === void 0 ? void 0 : g.setActive(a, u);
            }),
            (n[a].isActive = u));
        const f = o(a);
        for (const d in n) n[d].protectedKeys = {};
        return f;
    }
    return {
        animateChanges: o,
        setActive: l,
        setAnimateFunction: s,
        getState: () => n,
        reset: () => {
            ((n = lf()), (r = !0));
        },
    };
}
function mw(e, t) {
    return typeof t == 'string' ? t !== e : Array.isArray(t) ? !Fp(t, e) : !1;
}
function Gt(e = !1) {
    return { isActive: e, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
}
function lf() {
    return {
        animate: Gt(!0),
        whileInView: Gt(),
        whileHover: Gt(),
        whileTap: Gt(),
        whileDrag: Gt(),
        whileFocus: Gt(),
        exit: Gt(),
    };
}
class Wt {
    constructor(t) {
        ((this.isMounted = !1), (this.node = t));
    }
    update() {}
}
class gw extends Wt {
    constructor(t) {
        (super(t), t.animationState || (t.animationState = pw(t)));
    }
    updateAnimationControlsSubscription() {
        const { animate: t } = this.node.getProps();
        Qs(t) && (this.unmountControls = t.subscribe(this.node));
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
let yw = 0;
class vw extends Wt {
    constructor() {
        (super(...arguments), (this.id = yw++));
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
const ww = { animation: { Feature: gw }, exit: { Feature: vw } };
function br(e, t, n, r = { passive: !0 }) {
    return (e.addEventListener(t, n, r), () => e.removeEventListener(t, n));
}
function ci(e) {
    return { point: { x: e.pageX, y: e.pageY } };
}
const xw = (e) => (t) => cu(t) && e(t, ci(t));
function Rr(e, t, n, r) {
    return br(e, t, xw(n), r);
}
const af = (e, t) => Math.abs(e - t);
function Sw(e, t) {
    const n = af(e.x, t.x),
        r = af(e.y, t.y);
    return Math.sqrt(n ** 2 + r ** 2);
}
class Am {
    constructor(t, n, { transformPagePoint: r, contextWindow: i, dragSnapToOrigin: s = !1 } = {}) {
        if (
            ((this.startEvent = null),
            (this.lastMoveEvent = null),
            (this.lastMoveEventInfo = null),
            (this.handlers = {}),
            (this.contextWindow = window),
            (this.updatePoint = () => {
                if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return;
                const f = _o(this.lastMoveEventInfo, this.history),
                    d = this.startEvent !== null,
                    g = Sw(f.offset, { x: 0, y: 0 }) >= 3;
                if (!d && !g) return;
                const { point: y } = f,
                    { timestamp: v } = ee;
                this.history.push({ ...y, timestamp: v });
                const { onStart: S, onMove: p } = this.handlers;
                (d || (S && S(this.lastMoveEvent, f), (this.startEvent = this.lastMoveEvent)),
                    p && p(this.lastMoveEvent, f));
            }),
            (this.handlePointerMove = (f, d) => {
                ((this.lastMoveEvent = f),
                    (this.lastMoveEventInfo = Vo(d, this.transformPagePoint)),
                    F.update(this.updatePoint, !0));
            }),
            (this.handlePointerUp = (f, d) => {
                this.end();
                const { onEnd: g, onSessionEnd: y, resumeAnimation: v } = this.handlers;
                if (
                    (this.dragSnapToOrigin && v && v(),
                    !(this.lastMoveEvent && this.lastMoveEventInfo))
                )
                    return;
                const S = _o(
                    f.type === 'pointercancel'
                        ? this.lastMoveEventInfo
                        : Vo(d, this.transformPagePoint),
                    this.history,
                );
                (this.startEvent && g && g(f, S), y && y(f, S));
            }),
            !cu(t))
        )
            return;
        ((this.dragSnapToOrigin = s),
            (this.handlers = n),
            (this.transformPagePoint = r),
            (this.contextWindow = i || window));
        const o = ci(t),
            l = Vo(o, this.transformPagePoint),
            { point: a } = l,
            { timestamp: u } = ee;
        this.history = [{ ...a, timestamp: u }];
        const { onSessionStart: c } = n;
        (c && c(t, _o(l, this.history)),
            (this.removeListeners = ui(
                Rr(this.contextWindow, 'pointermove', this.handlePointerMove),
                Rr(this.contextWindow, 'pointerup', this.handlePointerUp),
                Rr(this.contextWindow, 'pointercancel', this.handlePointerUp),
            )));
    }
    updateHandlers(t) {
        this.handlers = t;
    }
    end() {
        (this.removeListeners && this.removeListeners(), Ze(this.updatePoint));
    }
}
function Vo(e, t) {
    return t ? { point: t(e.point) } : e;
}
function uf(e, t) {
    return { x: e.x - t.x, y: e.y - t.y };
}
function _o({ point: e }, t) {
    return { point: e, delta: uf(e, Mm(t)), offset: uf(e, Tw(t)), velocity: Pw(t, 0.1) };
}
function Tw(e) {
    return e[0];
}
function Mm(e) {
    return e[e.length - 1];
}
function Pw(e, t) {
    if (e.length < 2) return { x: 0, y: 0 };
    let n = e.length - 1,
        r = null;
    const i = Mm(e);
    for (; n >= 0 && ((r = e[n]), !(i.timestamp - r.timestamp > ft(t))); ) n--;
    if (!r) return { x: 0, y: 0 };
    const s = dt(i.timestamp - r.timestamp);
    if (s === 0) return { x: 0, y: 0 };
    const o = { x: (i.x - r.x) / s, y: (i.y - r.y) / s };
    return (o.x === 1 / 0 && (o.x = 0), o.y === 1 / 0 && (o.y = 0), o);
}
const Rm = 1e-4,
    kw = 1 - Rm,
    Cw = 1 + Rm,
    Dm = 0.01,
    Ew = 0 - Dm,
    Aw = 0 + Dm;
function De(e) {
    return e.max - e.min;
}
function Mw(e, t, n) {
    return Math.abs(e - t) <= n;
}
function cf(e, t, n, r = 0.5) {
    ((e.origin = r),
        (e.originPoint = H(t.min, t.max, e.origin)),
        (e.scale = De(n) / De(t)),
        (e.translate = H(n.min, n.max, e.origin) - e.originPoint),
        ((e.scale >= kw && e.scale <= Cw) || isNaN(e.scale)) && (e.scale = 1),
        ((e.translate >= Ew && e.translate <= Aw) || isNaN(e.translate)) && (e.translate = 0));
}
function Dr(e, t, n, r) {
    (cf(e.x, t.x, n.x, r ? r.originX : void 0), cf(e.y, t.y, n.y, r ? r.originY : void 0));
}
function ff(e, t, n) {
    ((e.min = n.min + t.min), (e.max = e.min + De(t)));
}
function Rw(e, t, n) {
    (ff(e.x, t.x, n.x), ff(e.y, t.y, n.y));
}
function df(e, t, n) {
    ((e.min = t.min - n.min), (e.max = e.min + De(t)));
}
function Lr(e, t, n) {
    (df(e.x, t.x, n.x), df(e.y, t.y, n.y));
}
function Dw(e, { min: t, max: n }, r) {
    return (
        t !== void 0 && e < t
            ? (e = r ? H(t, e, r.min) : Math.max(e, t))
            : n !== void 0 && e > n && (e = r ? H(n, e, r.max) : Math.min(e, n)),
        e
    );
}
function hf(e, t, n) {
    return {
        min: t !== void 0 ? e.min + t : void 0,
        max: n !== void 0 ? e.max + n - (e.max - e.min) : void 0,
    };
}
function Lw(e, { top: t, left: n, bottom: r, right: i }) {
    return { x: hf(e.x, n, i), y: hf(e.y, t, r) };
}
function pf(e, t) {
    let n = t.min - e.min,
        r = t.max - e.max;
    return (t.max - t.min < e.max - e.min && ([n, r] = [r, n]), { min: n, max: r });
}
function Vw(e, t) {
    return { x: pf(e.x, t.x), y: pf(e.y, t.y) };
}
function _w(e, t) {
    let n = 0.5;
    const r = De(e),
        i = De(t);
    return (
        i > r ? (n = fn(t.min, t.max - r, e.min)) : r > i && (n = fn(e.min, e.max - i, t.min)),
        st(0, 1, n)
    );
}
function Nw(e, t) {
    const n = {};
    return (
        t.min !== void 0 && (n.min = t.min - e.min),
        t.max !== void 0 && (n.max = t.max - e.min),
        n
    );
}
const Kl = 0.35;
function jw(e = Kl) {
    return (
        e === !1 ? (e = 0) : e === !0 && (e = Kl),
        { x: mf(e, 'left', 'right'), y: mf(e, 'top', 'bottom') }
    );
}
function mf(e, t, n) {
    return { min: gf(e, t), max: gf(e, n) };
}
function gf(e, t) {
    return typeof e == 'number' ? e : e[t] || 0;
}
const yf = () => ({ translate: 0, scale: 1, origin: 0, originPoint: 0 }),
    Dn = () => ({ x: yf(), y: yf() }),
    vf = () => ({ min: 0, max: 0 }),
    Z = () => ({ x: vf(), y: vf() });
function Ne(e) {
    return [e('x'), e('y')];
}
function Lm({ top: e, left: t, right: n, bottom: r }) {
    return { x: { min: t, max: n }, y: { min: e, max: r } };
}
function Ow({ x: e, y: t }) {
    return { top: t.min, right: e.max, bottom: t.max, left: e.min };
}
function Fw(e, t) {
    if (!t) return e;
    const n = t({ x: e.left, y: e.top }),
        r = t({ x: e.right, y: e.bottom });
    return { top: n.y, left: n.x, bottom: r.y, right: r.x };
}
function No(e) {
    return e === void 0 || e === 1;
}
function Gl({ scale: e, scaleX: t, scaleY: n }) {
    return !No(e) || !No(t) || !No(n);
}
function Xt(e) {
    return Gl(e) || Vm(e) || e.z || e.rotate || e.rotateX || e.rotateY || e.skewX || e.skewY;
}
function Vm(e) {
    return wf(e.x) || wf(e.y);
}
function wf(e) {
    return e && e !== '0%';
}
function Ms(e, t, n) {
    const r = e - n,
        i = t * r;
    return n + i;
}
function xf(e, t, n, r, i) {
    return (i !== void 0 && (e = Ms(e, i, r)), Ms(e, n, r) + t);
}
function Ql(e, t = 0, n = 1, r, i) {
    ((e.min = xf(e.min, t, n, r, i)), (e.max = xf(e.max, t, n, r, i)));
}
function _m(e, { x: t, y: n }) {
    (Ql(e.x, t.translate, t.scale, t.originPoint), Ql(e.y, n.translate, n.scale, n.originPoint));
}
const Sf = 0.999999999999,
    Tf = 1.0000000000001;
function Iw(e, t, n, r = !1) {
    const i = n.length;
    if (!i) return;
    t.x = t.y = 1;
    let s, o;
    for (let l = 0; l < i; l++) {
        ((s = n[l]), (o = s.projectionDelta));
        const { visualElement: a } = s.options;
        (a && a.props.style && a.props.style.display === 'contents') ||
            (r &&
                s.options.layoutScroll &&
                s.scroll &&
                s !== s.root &&
                Vn(e, { x: -s.scroll.offset.x, y: -s.scroll.offset.y }),
            o && ((t.x *= o.x.scale), (t.y *= o.y.scale), _m(e, o)),
            r && Xt(s.latestValues) && Vn(e, s.latestValues));
    }
    (t.x < Tf && t.x > Sf && (t.x = 1), t.y < Tf && t.y > Sf && (t.y = 1));
}
function Ln(e, t) {
    ((e.min = e.min + t), (e.max = e.max + t));
}
function Pf(e, t, n, r, i = 0.5) {
    const s = H(e.min, e.max, i);
    Ql(e, t, n, s, r);
}
function Vn(e, t) {
    (Pf(e.x, t.x, t.scaleX, t.scale, t.originX), Pf(e.y, t.y, t.scaleY, t.scale, t.originY));
}
function Nm(e, t) {
    return Lm(Fw(e.getBoundingClientRect(), t));
}
function zw(e, t, n) {
    const r = Nm(e, n),
        { scroll: i } = t;
    return (i && (Ln(r.x, i.offset.x), Ln(r.y, i.offset.y)), r);
}
const jm = ({ current: e }) => (e ? e.ownerDocument.defaultView : null),
    Bw = new WeakMap();
class Uw {
    constructor(t) {
        ((this.openDragLock = null),
            (this.isDragging = !1),
            (this.currentDirection = null),
            (this.originPoint = { x: 0, y: 0 }),
            (this.constraints = !1),
            (this.hasMutatedConstraints = !1),
            (this.elastic = Z()),
            (this.visualElement = t));
    }
    start(t, { snapToCursor: n = !1 } = {}) {
        const { presenceContext: r } = this.visualElement;
        if (r && r.isPresent === !1) return;
        const i = (c) => {
                const { dragSnapToOrigin: f } = this.getProps();
                (f ? this.pauseAnimation() : this.stopAnimation(),
                    n && this.snapToCursor(ci(c).point));
            },
            s = (c, f) => {
                const { drag: d, dragPropagation: g, onDragStart: y } = this.getProps();
                if (
                    d &&
                    !g &&
                    (this.openDragLock && this.openDragLock(),
                    (this.openDragLock = N0(d)),
                    !this.openDragLock)
                )
                    return;
                ((this.isDragging = !0),
                    (this.currentDirection = null),
                    this.resolveConstraints(),
                    this.visualElement.projection &&
                        ((this.visualElement.projection.isAnimationBlocked = !0),
                        (this.visualElement.projection.target = void 0)),
                    Ne((S) => {
                        let p = this.getAxisMotionValue(S).get() || 0;
                        if (rt.test(p)) {
                            const { projection: h } = this.visualElement;
                            if (h && h.layout) {
                                const m = h.layout.layoutBox[S];
                                m && (p = De(m) * (parseFloat(p) / 100));
                            }
                        }
                        this.originPoint[S] = p;
                    }),
                    y && F.postRender(() => y(c, f)),
                    Fl(this.visualElement, 'transform'));
                const { animationState: v } = this.visualElement;
                v && v.setActive('whileDrag', !0);
            },
            o = (c, f) => {
                const {
                    dragPropagation: d,
                    dragDirectionLock: g,
                    onDirectionLock: y,
                    onDrag: v,
                } = this.getProps();
                if (!d && !this.openDragLock) return;
                const { offset: S } = f;
                if (g && this.currentDirection === null) {
                    ((this.currentDirection = Ww(S)),
                        this.currentDirection !== null && y && y(this.currentDirection));
                    return;
                }
                (this.updateAxis('x', f.point, S),
                    this.updateAxis('y', f.point, S),
                    this.visualElement.render(),
                    v && v(c, f));
            },
            l = (c, f) => this.stop(c, f),
            a = () =>
                Ne((c) => {
                    var f;
                    return (
                        this.getAnimationState(c) === 'paused' &&
                        ((f = this.getAxisMotionValue(c).animation) === null || f === void 0
                            ? void 0
                            : f.play())
                    );
                }),
            { dragSnapToOrigin: u } = this.getProps();
        this.panSession = new Am(
            t,
            { onSessionStart: i, onStart: s, onMove: o, onSessionEnd: l, resumeAnimation: a },
            {
                transformPagePoint: this.visualElement.getTransformPagePoint(),
                dragSnapToOrigin: u,
                contextWindow: jm(this.visualElement),
            },
        );
    }
    stop(t, n) {
        const r = this.isDragging;
        if ((this.cancel(), !r)) return;
        const { velocity: i } = n;
        this.startAnimation(i);
        const { onDragEnd: s } = this.getProps();
        s && F.postRender(() => s(t, n));
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
        if (!r || !Ni(t, i, this.currentDirection)) return;
        const s = this.getAxisMotionValue(t);
        let o = this.originPoint[t] + r[t];
        (this.constraints &&
            this.constraints[t] &&
            (o = Dw(o, this.constraints[t], this.elastic[t])),
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
        (n && Mn(n)
            ? this.constraints || (this.constraints = this.resolveRefConstraints())
            : n && i
              ? (this.constraints = Lw(i.layoutBox, n))
              : (this.constraints = !1),
            (this.elastic = jw(r)),
            s !== this.constraints &&
                i &&
                this.constraints &&
                !this.hasMutatedConstraints &&
                Ne((o) => {
                    this.constraints !== !1 &&
                        this.getAxisMotionValue(o) &&
                        (this.constraints[o] = Nw(i.layoutBox[o], this.constraints[o]));
                }));
    }
    resolveRefConstraints() {
        const { dragConstraints: t, onMeasureDragConstraints: n } = this.getProps();
        if (!t || !Mn(t)) return !1;
        const r = t.current,
            { projection: i } = this.visualElement;
        if (!i || !i.layout) return !1;
        const s = zw(r, i.root, this.visualElement.getTransformPagePoint());
        let o = Vw(i.layout.layoutBox, s);
        if (n) {
            const l = n(Ow(o));
            ((this.hasMutatedConstraints = !!l), l && (o = Lm(l)));
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
                onDragTransitionEnd: l,
            } = this.getProps(),
            a = this.constraints || {},
            u = Ne((c) => {
                if (!Ni(c, n, this.currentDirection)) return;
                let f = (a && a[c]) || {};
                o && (f = { min: 0, max: 0 });
                const d = i ? 200 : 1e6,
                    g = i ? 40 : 1e7,
                    y = {
                        type: 'inertia',
                        velocity: r ? t[c] : 0,
                        bounceStiffness: d,
                        bounceDamping: g,
                        timeConstant: 750,
                        restDelta: 1,
                        restSpeed: 10,
                        ...s,
                        ...f,
                    };
                return this.startAxisValueAnimation(c, y);
            });
        return Promise.all(u).then(l);
    }
    startAxisValueAnimation(t, n) {
        const r = this.getAxisMotionValue(t);
        return (Fl(this.visualElement, t), r.start(Pu(t, r, 0, n, this.visualElement, !1)));
    }
    stopAnimation() {
        Ne((t) => this.getAxisMotionValue(t).stop());
    }
    pauseAnimation() {
        Ne((t) => {
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
        Ne((n) => {
            const { drag: r } = this.getProps();
            if (!Ni(n, r, this.currentDirection)) return;
            const { projection: i } = this.visualElement,
                s = this.getAxisMotionValue(n);
            if (i && i.layout) {
                const { min: o, max: l } = i.layout.layoutBox[n];
                s.set(t[n] - H(o, l, 0.5));
            }
        });
    }
    scalePositionWithinConstraints() {
        if (!this.visualElement.current) return;
        const { drag: t, dragConstraints: n } = this.getProps(),
            { projection: r } = this.visualElement;
        if (!Mn(n) || !r || !this.constraints) return;
        this.stopAnimation();
        const i = { x: 0, y: 0 };
        Ne((o) => {
            const l = this.getAxisMotionValue(o);
            if (l && this.constraints !== !1) {
                const a = l.get();
                i[o] = _w({ min: a, max: a }, this.constraints[o]);
            }
        });
        const { transformTemplate: s } = this.visualElement.getProps();
        ((this.visualElement.current.style.transform = s ? s({}, '') : 'none'),
            r.root && r.root.updateScroll(),
            r.updateLayout(),
            this.resolveConstraints(),
            Ne((o) => {
                if (!Ni(o, t, null)) return;
                const l = this.getAxisMotionValue(o),
                    { min: a, max: u } = this.constraints[o];
                l.set(H(a, u, i[o]));
            }));
    }
    addListeners() {
        if (!this.visualElement.current) return;
        Bw.set(this.visualElement, this);
        const t = this.visualElement.current,
            n = Rr(t, 'pointerdown', (a) => {
                const { drag: u, dragListener: c = !0 } = this.getProps();
                u && c && this.start(a);
            }),
            r = () => {
                const { dragConstraints: a } = this.getProps();
                Mn(a) && a.current && (this.constraints = this.resolveRefConstraints());
            },
            { projection: i } = this.visualElement,
            s = i.addEventListener('measure', r);
        (i && !i.layout && (i.root && i.root.updateScroll(), i.updateLayout()), F.read(r));
        const o = br(window, 'resize', () => this.scalePositionWithinConstraints()),
            l = i.addEventListener('didUpdate', ({ delta: a, hasLayoutChanged: u }) => {
                this.isDragging &&
                    u &&
                    (Ne((c) => {
                        const f = this.getAxisMotionValue(c);
                        f &&
                            ((this.originPoint[c] += a[c].translate),
                            f.set(f.get() + a[c].translate));
                    }),
                    this.visualElement.render());
            });
        return () => {
            (o(), n(), s(), l && l());
        };
    }
    getProps() {
        const t = this.visualElement.getProps(),
            {
                drag: n = !1,
                dragDirectionLock: r = !1,
                dragPropagation: i = !1,
                dragConstraints: s = !1,
                dragElastic: o = Kl,
                dragMomentum: l = !0,
            } = t;
        return {
            ...t,
            drag: n,
            dragDirectionLock: r,
            dragPropagation: i,
            dragConstraints: s,
            dragElastic: o,
            dragMomentum: l,
        };
    }
}
function Ni(e, t, n) {
    return (t === !0 || t === e) && (n === null || n === e);
}
function Ww(e, t = 10) {
    let n = null;
    return (Math.abs(e.y) > t ? (n = 'y') : Math.abs(e.x) > t && (n = 'x'), n);
}
class $w extends Wt {
    constructor(t) {
        (super(t),
            (this.removeGroupControls = ve),
            (this.removeListeners = ve),
            (this.controls = new Uw(t)));
    }
    mount() {
        const { dragControls: t } = this.node.getProps();
        (t && (this.removeGroupControls = t.subscribe(this.controls)),
            (this.removeListeners = this.controls.addListeners() || ve));
    }
    unmount() {
        (this.removeGroupControls(), this.removeListeners());
    }
}
const kf = (e) => (t, n) => {
    e && F.postRender(() => e(t, n));
};
class Hw extends Wt {
    constructor() {
        (super(...arguments), (this.removePointerDownListener = ve));
    }
    onPointerDown(t) {
        this.session = new Am(t, this.createPanHandlers(), {
            transformPagePoint: this.node.getTransformPagePoint(),
            contextWindow: jm(this.node),
        });
    }
    createPanHandlers() {
        const { onPanSessionStart: t, onPanStart: n, onPan: r, onPanEnd: i } = this.node.getProps();
        return {
            onSessionStart: kf(t),
            onStart: kf(n),
            onMove: r,
            onEnd: (s, o) => {
                (delete this.session, i && F.postRender(() => i(s, o)));
            },
        };
    }
    mount() {
        this.removePointerDownListener = Rr(this.node.current, 'pointerdown', (t) =>
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
const Xi = { hasAnimatedSinceResize: !0, hasEverUpdated: !1 };
function Cf(e, t) {
    return t.max === t.min ? 0 : (e / (t.max - t.min)) * 100;
}
const ur = {
        correct: (e, t) => {
            if (!t.target) return e;
            if (typeof e == 'string')
                if (D.test(e)) e = parseFloat(e);
                else return e;
            const n = Cf(e, t.target.x),
                r = Cf(e, t.target.y);
            return `${n}% ${r}%`;
        },
    },
    Kw = {
        correct: (e, { treeScale: t, projectionDelta: n }) => {
            const r = e,
                i = It.parse(e);
            if (i.length > 5) return r;
            const s = It.createTransformer(e),
                o = typeof i[0] != 'number' ? 1 : 0,
                l = n.x.scale * t.x,
                a = n.y.scale * t.y;
            ((i[0 + o] /= l), (i[1 + o] /= a));
            const u = H(l, a, 0.5);
            return (
                typeof i[2 + o] == 'number' && (i[2 + o] /= u),
                typeof i[3 + o] == 'number' && (i[3 + o] /= u),
                s(i)
            );
        },
    };
class Gw extends C.Component {
    componentDidMount() {
        const { visualElement: t, layoutGroup: n, switchLayoutGroup: r, layoutId: i } = this.props,
            { projection: s } = t;
        (m0(Qw),
            s &&
                (n.group && n.group.add(s),
                r && r.register && i && r.register(s),
                s.root.didUpdate(),
                s.addEventListener('animationComplete', () => {
                    this.safeToRemove();
                }),
                s.setOptions({ ...s.options, onExitComplete: () => this.safeToRemove() })),
            (Xi.hasEverUpdated = !0));
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
                          F.postRender(() => {
                              const l = o.getStack();
                              (!l || !l.members.length) && this.safeToRemove();
                          }))),
            null
        );
    }
    componentDidUpdate() {
        const { projection: t } = this.props.visualElement;
        t &&
            (t.root.didUpdate(),
            qa.postRender(() => {
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
function Om(e) {
    const [t, n] = yp(),
        r = C.useContext(Ka);
    return R.jsx(Gw, {
        ...e,
        layoutGroup: r,
        switchLayoutGroup: C.useContext(kp),
        isPresent: t,
        safeToRemove: n,
    });
}
const Qw = {
    borderRadius: {
        ...ur,
        applyTo: [
            'borderTopLeftRadius',
            'borderTopRightRadius',
            'borderBottomLeftRadius',
            'borderBottomRightRadius',
        ],
    },
    borderTopLeftRadius: ur,
    borderTopRightRadius: ur,
    borderBottomLeftRadius: ur,
    borderBottomRightRadius: ur,
    boxShadow: Kw,
};
function Yw(e, t, n) {
    const r = oe(e) ? e : et(e);
    return (r.start(Pu('', r, t, n)), r.animation);
}
function Xw(e) {
    return e instanceof SVGElement && e.tagName !== 'svg';
}
const Zw = (e, t) => e.depth - t.depth;
class qw {
    constructor() {
        ((this.children = []), (this.isDirty = !1));
    }
    add(t) {
        (fu(this.children, t), (this.isDirty = !0));
    }
    remove(t) {
        (du(this.children, t), (this.isDirty = !0));
    }
    forEach(t) {
        (this.isDirty && this.children.sort(Zw), (this.isDirty = !1), this.children.forEach(t));
    }
}
function Jw(e, t) {
    const n = it.now(),
        r = ({ timestamp: i }) => {
            const s = i - n;
            s >= t && (Ze(r), e(s - t));
        };
    return (F.read(r, !0), () => Ze(r));
}
const Fm = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'],
    bw = Fm.length,
    Ef = (e) => (typeof e == 'string' ? parseFloat(e) : e),
    Af = (e) => typeof e == 'number' || D.test(e);
function ex(e, t, n, r, i, s) {
    i
        ? ((e.opacity = H(0, n.opacity !== void 0 ? n.opacity : 1, tx(r))),
          (e.opacityExit = H(t.opacity !== void 0 ? t.opacity : 1, 0, nx(r))))
        : s &&
          (e.opacity = H(
              t.opacity !== void 0 ? t.opacity : 1,
              n.opacity !== void 0 ? n.opacity : 1,
              r,
          ));
    for (let o = 0; o < bw; o++) {
        const l = `border${Fm[o]}Radius`;
        let a = Mf(t, l),
            u = Mf(n, l);
        if (a === void 0 && u === void 0) continue;
        (a || (a = 0),
            u || (u = 0),
            a === 0 || u === 0 || Af(a) === Af(u)
                ? ((e[l] = Math.max(H(Ef(a), Ef(u), r), 0)),
                  (rt.test(u) || rt.test(a)) && (e[l] += '%'))
                : (e[l] = u));
    }
    (t.rotate || n.rotate) && (e.rotate = H(t.rotate || 0, n.rotate || 0, r));
}
function Mf(e, t) {
    return e[t] !== void 0 ? e[t] : e.borderRadius;
}
const tx = Im(0, 0.5, tm),
    nx = Im(0.5, 0.95, ve);
function Im(e, t, n) {
    return (r) => (r < e ? 0 : r > t ? 1 : n(fn(e, t, r)));
}
function Rf(e, t) {
    ((e.min = t.min), (e.max = t.max));
}
function _e(e, t) {
    (Rf(e.x, t.x), Rf(e.y, t.y));
}
function Df(e, t) {
    ((e.translate = t.translate),
        (e.scale = t.scale),
        (e.originPoint = t.originPoint),
        (e.origin = t.origin));
}
function Lf(e, t, n, r, i) {
    return ((e -= t), (e = Ms(e, 1 / n, r)), i !== void 0 && (e = Ms(e, 1 / i, r)), e);
}
function rx(e, t = 0, n = 1, r = 0.5, i, s = e, o = e) {
    if (
        (rt.test(t) && ((t = parseFloat(t)), (t = H(o.min, o.max, t / 100) - o.min)),
        typeof t != 'number')
    )
        return;
    let l = H(s.min, s.max, r);
    (e === s && (l -= t), (e.min = Lf(e.min, t, n, l, i)), (e.max = Lf(e.max, t, n, l, i)));
}
function Vf(e, t, [n, r, i], s, o) {
    rx(e, t[n], t[r], t[i], t.scale, s, o);
}
const ix = ['x', 'scaleX', 'originX'],
    sx = ['y', 'scaleY', 'originY'];
function _f(e, t, n, r) {
    (Vf(e.x, t, ix, n ? n.x : void 0, r ? r.x : void 0),
        Vf(e.y, t, sx, n ? n.y : void 0, r ? r.y : void 0));
}
function Nf(e) {
    return e.translate === 0 && e.scale === 1;
}
function zm(e) {
    return Nf(e.x) && Nf(e.y);
}
function jf(e, t) {
    return e.min === t.min && e.max === t.max;
}
function ox(e, t) {
    return jf(e.x, t.x) && jf(e.y, t.y);
}
function Of(e, t) {
    return Math.round(e.min) === Math.round(t.min) && Math.round(e.max) === Math.round(t.max);
}
function Bm(e, t) {
    return Of(e.x, t.x) && Of(e.y, t.y);
}
function Ff(e) {
    return De(e.x) / De(e.y);
}
function If(e, t) {
    return e.translate === t.translate && e.scale === t.scale && e.originPoint === t.originPoint;
}
class lx {
    constructor() {
        this.members = [];
    }
    add(t) {
        (fu(this.members, t), t.scheduleRender());
    }
    remove(t) {
        if (
            (du(this.members, t), t === this.prevLead && (this.prevLead = void 0), t === this.lead)
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
function ax(e, t, n) {
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
            skewX: g,
            skewY: y,
        } = n;
        (u && (r = `perspective(${u}px) ${r}`),
            c && (r += `rotate(${c}deg) `),
            f && (r += `rotateX(${f}deg) `),
            d && (r += `rotateY(${d}deg) `),
            g && (r += `skewX(${g}deg) `),
            y && (r += `skewY(${y}deg) `));
    }
    const l = e.x.scale * t.x,
        a = e.y.scale * t.y;
    return ((l !== 1 || a !== 1) && (r += `scale(${l}, ${a})`), r || 'none');
}
const Zt = {
        type: 'projectionFrame',
        totalNodes: 0,
        resolvedTargetDeltas: 0,
        recalculatedProjection: 0,
    },
    yr = typeof window < 'u' && window.MotionDebug !== void 0,
    jo = ['', 'X', 'Y', 'Z'],
    ux = { visibility: 'hidden' },
    zf = 1e3;
let cx = 0;
function Oo(e, t, n, r) {
    const { latestValues: i } = t;
    i[e] && ((n[e] = i[e]), t.setStaticValue(e, 0), r && (r[e] = 0));
}
function Um(e) {
    if (((e.hasCheckedOptimisedAppear = !0), e.root === e)) return;
    const { visualElement: t } = e.options;
    if (!t) return;
    const n = Yp(t);
    if (window.MotionHasOptimisedAnimation(n, 'transform')) {
        const { layout: i, layoutId: s } = e.options;
        window.MotionCancelOptimisedAnimation(n, 'transform', F, !(i || s));
    }
    const { parent: r } = e;
    r && !r.hasCheckedOptimisedAppear && Um(r);
}
function Wm({
    attachResizeListener: e,
    defaultParent: t,
    measureScroll: n,
    checkIsScrollRoot: r,
    resetTransform: i,
}) {
    return class {
        constructor(o = {}, l = t == null ? void 0 : t()) {
            ((this.id = cx++),
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
                        yr &&
                            (Zt.totalNodes =
                                Zt.resolvedTargetDeltas =
                                Zt.recalculatedProjection =
                                    0),
                        this.nodes.forEach(hx),
                        this.nodes.forEach(vx),
                        this.nodes.forEach(wx),
                        this.nodes.forEach(px),
                        yr && window.MotionDebug.record(Zt));
                }),
                (this.resolvedRelativeTargetAt = 0),
                (this.hasProjected = !1),
                (this.isVisible = !0),
                (this.animationProgress = 0),
                (this.sharedNodes = new Map()),
                (this.latestValues = o),
                (this.root = l ? l.root || l : this),
                (this.path = l ? [...l.path, l] : []),
                (this.parent = l),
                (this.depth = l ? l.depth + 1 : 0));
            for (let a = 0; a < this.path.length; a++) this.path[a].shouldResetTransform = !0;
            this.root === this && (this.nodes = new qw());
        }
        addEventListener(o, l) {
            return (
                this.eventHandlers.has(o) || this.eventHandlers.set(o, new hu()),
                this.eventHandlers.get(o).add(l)
            );
        }
        notifyListeners(o, ...l) {
            const a = this.eventHandlers.get(o);
            a && a.notify(...l);
        }
        hasListeners(o) {
            return this.eventHandlers.has(o);
        }
        mount(o, l = this.root.hasTreeAnimated) {
            if (this.instance) return;
            ((this.isSVG = Xw(o)), (this.instance = o));
            const { layoutId: a, layout: u, visualElement: c } = this.options;
            if (
                (c && !c.current && c.mount(o),
                this.root.nodes.add(this),
                this.parent && this.parent.children.add(this),
                l && (u || a) && (this.isLayoutDirty = !0),
                e)
            ) {
                let f;
                const d = () => (this.root.updateBlockedByResize = !1);
                e(o, () => {
                    ((this.root.updateBlockedByResize = !0),
                        f && f(),
                        (f = Jw(d, 250)),
                        Xi.hasAnimatedSinceResize &&
                            ((Xi.hasAnimatedSinceResize = !1), this.nodes.forEach(Uf)));
                });
            }
            (a && this.root.registerSharedNode(a, this),
                this.options.animate !== !1 &&
                    c &&
                    (a || u) &&
                    this.addEventListener(
                        'didUpdate',
                        ({
                            delta: f,
                            hasLayoutChanged: d,
                            hasRelativeTargetChanged: g,
                            layout: y,
                        }) => {
                            if (this.isTreeAnimationBlocked()) {
                                ((this.target = void 0), (this.relativeTarget = void 0));
                                return;
                            }
                            const v = this.options.transition || c.getDefaultTransition() || kx,
                                { onLayoutAnimationStart: S, onLayoutAnimationComplete: p } =
                                    c.getProps(),
                                h = !this.targetLayout || !Bm(this.targetLayout, y) || g,
                                m = !d && g;
                            if (
                                this.options.layoutRoot ||
                                (this.resumeFrom && this.resumeFrom.instance) ||
                                m ||
                                (d && (h || !this.currentAnimation))
                            ) {
                                (this.resumeFrom &&
                                    ((this.resumingFrom = this.resumeFrom),
                                    (this.resumingFrom.resumingFrom = void 0)),
                                    this.setAnimationOrigin(f, m));
                                const w = { ...lu(v, 'layout'), onPlay: S, onComplete: p };
                                ((c.shouldReduceMotion || this.options.layoutRoot) &&
                                    ((w.delay = 0), (w.type = !1)),
                                    this.startAnimation(w));
                            } else
                                (d || Uf(this),
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
                Ze(this.updateProjection));
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
                ((this.isUpdating = !0), this.nodes && this.nodes.forEach(xx), this.animationId++);
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
                    Um(this),
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
            const { layoutId: l, layout: a } = this.options;
            if (l === void 0 && !a) return;
            const u = this.getTransformTemplate();
            ((this.prevTransformTemplateValue = u ? u(this.latestValues, '') : void 0),
                this.updateSnapshot(),
                o && this.notifyListeners('willUpdate'));
        }
        update() {
            if (((this.updateScheduled = !1), this.isUpdateBlocked())) {
                (this.unblockUpdate(), this.clearAllSnapshots(), this.nodes.forEach(Bf));
                return;
            }
            (this.isUpdating || this.nodes.forEach(gx),
                (this.isUpdating = !1),
                this.nodes.forEach(yx),
                this.nodes.forEach(fx),
                this.nodes.forEach(dx),
                this.clearAllSnapshots());
            const l = it.now();
            ((ee.delta = st(0, 1e3 / 60, l - ee.timestamp)),
                (ee.timestamp = l),
                (ee.isProcessing = !0),
                Eo.update.process(ee),
                Eo.preRender.process(ee),
                Eo.render.process(ee),
                (ee.isProcessing = !1));
        }
        didUpdate() {
            this.updateScheduled || ((this.updateScheduled = !0), qa.read(this.scheduleUpdate));
        }
        clearAllSnapshots() {
            (this.nodes.forEach(mx), this.sharedNodes.forEach(Sx));
        }
        scheduleUpdateProjection() {
            this.projectionUpdateScheduled ||
                ((this.projectionUpdateScheduled = !0), F.preRender(this.updateProjection, !1, !0));
        }
        scheduleCheckAfterUnmount() {
            F.postRender(() => {
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
                for (let a = 0; a < this.path.length; a++) this.path[a].updateScroll();
            const o = this.layout;
            ((this.layout = this.measure(!1)),
                (this.layoutCorrected = Z()),
                (this.isLayoutDirty = !1),
                (this.projectionDelta = void 0),
                this.notifyListeners('measure', this.layout.layoutBox));
            const { visualElement: l } = this.options;
            l && l.notify('LayoutMeasure', this.layout.layoutBox, o ? o.layoutBox : void 0);
        }
        updateScroll(o = 'measure') {
            let l = !!(this.options.layoutScroll && this.instance);
            if (
                (this.scroll &&
                    this.scroll.animationId === this.root.animationId &&
                    this.scroll.phase === o &&
                    (l = !1),
                l)
            ) {
                const a = r(this.instance);
                this.scroll = {
                    animationId: this.root.animationId,
                    phase: o,
                    isRoot: a,
                    offset: n(this.instance),
                    wasRoot: this.scroll ? this.scroll.isRoot : a,
                };
            }
        }
        resetTransform() {
            if (!i) return;
            const o =
                    this.isLayoutDirty ||
                    this.shouldResetTransform ||
                    this.options.alwaysMeasureLayout,
                l = this.projectionDelta && !zm(this.projectionDelta),
                a = this.getTransformTemplate(),
                u = a ? a(this.latestValues, '') : void 0,
                c = u !== this.prevTransformTemplateValue;
            o &&
                (l || Xt(this.latestValues) || c) &&
                (i(this.instance, u), (this.shouldResetTransform = !1), this.scheduleRender());
        }
        measure(o = !0) {
            const l = this.measurePageBox();
            let a = this.removeElementScroll(l);
            return (
                o && (a = this.removeTransform(a)),
                Cx(a),
                {
                    animationId: this.root.animationId,
                    measuredBox: l,
                    layoutBox: a,
                    latestValues: {},
                    source: this.id,
                }
            );
        }
        measurePageBox() {
            var o;
            const { visualElement: l } = this.options;
            if (!l) return Z();
            const a = l.measureViewportBox();
            if (
                !(
                    ((o = this.scroll) === null || o === void 0 ? void 0 : o.wasRoot) ||
                    this.path.some(Ex)
                )
            ) {
                const { scroll: c } = this.root;
                c && (Ln(a.x, c.offset.x), Ln(a.y, c.offset.y));
            }
            return a;
        }
        removeElementScroll(o) {
            var l;
            const a = Z();
            if ((_e(a, o), !((l = this.scroll) === null || l === void 0) && l.wasRoot)) return a;
            for (let u = 0; u < this.path.length; u++) {
                const c = this.path[u],
                    { scroll: f, options: d } = c;
                c !== this.root &&
                    f &&
                    d.layoutScroll &&
                    (f.wasRoot && _e(a, o), Ln(a.x, f.offset.x), Ln(a.y, f.offset.y));
            }
            return a;
        }
        applyTransform(o, l = !1) {
            const a = Z();
            _e(a, o);
            for (let u = 0; u < this.path.length; u++) {
                const c = this.path[u];
                (!l &&
                    c.options.layoutScroll &&
                    c.scroll &&
                    c !== c.root &&
                    Vn(a, { x: -c.scroll.offset.x, y: -c.scroll.offset.y }),
                    Xt(c.latestValues) && Vn(a, c.latestValues));
            }
            return (Xt(this.latestValues) && Vn(a, this.latestValues), a);
        }
        removeTransform(o) {
            const l = Z();
            _e(l, o);
            for (let a = 0; a < this.path.length; a++) {
                const u = this.path[a];
                if (!u.instance || !Xt(u.latestValues)) continue;
                Gl(u.latestValues) && u.updateSnapshot();
                const c = Z(),
                    f = u.measurePageBox();
                (_e(c, f), _f(l, u.latestValues, u.snapshot ? u.snapshot.layoutBox : void 0, c));
            }
            return (Xt(this.latestValues) && _f(l, this.latestValues), l);
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
                this.relativeParent.resolvedRelativeTargetAt !== ee.timestamp &&
                this.relativeParent.resolveTargetDelta(!0);
        }
        resolveTargetDelta(o = !1) {
            var l;
            const a = this.getLead();
            (this.isProjectionDirty || (this.isProjectionDirty = a.isProjectionDirty),
                this.isTransformDirty || (this.isTransformDirty = a.isTransformDirty),
                this.isSharedProjectionDirty ||
                    (this.isSharedProjectionDirty = a.isSharedProjectionDirty));
            const u = !!this.resumingFrom || this !== a;
            if (
                !(
                    o ||
                    (u && this.isSharedProjectionDirty) ||
                    this.isProjectionDirty ||
                    (!((l = this.parent) === null || l === void 0) && l.isProjectionDirty) ||
                    this.attemptToResolveRelativeTarget ||
                    this.root.updateBlockedByResize
                )
            )
                return;
            const { layout: f, layoutId: d } = this.options;
            if (!(!this.layout || !(f || d))) {
                if (
                    ((this.resolvedRelativeTargetAt = ee.timestamp),
                    !this.targetDelta && !this.relativeTarget)
                ) {
                    const g = this.getClosestProjectingParent();
                    g && g.layout && this.animationProgress !== 1
                        ? ((this.relativeParent = g),
                          this.forceRelativeParentToResolveTarget(),
                          (this.relativeTarget = Z()),
                          (this.relativeTargetOrigin = Z()),
                          Lr(this.relativeTargetOrigin, this.layout.layoutBox, g.layout.layoutBox),
                          _e(this.relativeTarget, this.relativeTargetOrigin))
                        : (this.relativeParent = this.relativeTarget = void 0);
                }
                if (!(!this.relativeTarget && !this.targetDelta)) {
                    if (
                        (this.target || ((this.target = Z()), (this.targetWithTransforms = Z())),
                        this.relativeTarget &&
                        this.relativeTargetOrigin &&
                        this.relativeParent &&
                        this.relativeParent.target
                            ? (this.forceRelativeParentToResolveTarget(),
                              Rw(this.target, this.relativeTarget, this.relativeParent.target))
                            : this.targetDelta
                              ? (this.resumingFrom
                                    ? (this.target = this.applyTransform(this.layout.layoutBox))
                                    : _e(this.target, this.layout.layoutBox),
                                _m(this.target, this.targetDelta))
                              : _e(this.target, this.layout.layoutBox),
                        this.attemptToResolveRelativeTarget)
                    ) {
                        this.attemptToResolveRelativeTarget = !1;
                        const g = this.getClosestProjectingParent();
                        g &&
                        !!g.resumingFrom == !!this.resumingFrom &&
                        !g.options.layoutScroll &&
                        g.target &&
                        this.animationProgress !== 1
                            ? ((this.relativeParent = g),
                              this.forceRelativeParentToResolveTarget(),
                              (this.relativeTarget = Z()),
                              (this.relativeTargetOrigin = Z()),
                              Lr(this.relativeTargetOrigin, this.target, g.target),
                              _e(this.relativeTarget, this.relativeTargetOrigin))
                            : (this.relativeParent = this.relativeTarget = void 0);
                    }
                    yr && Zt.resolvedTargetDeltas++;
                }
            }
        }
        getClosestProjectingParent() {
            if (!(!this.parent || Gl(this.parent.latestValues) || Vm(this.parent.latestValues)))
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
            const l = this.getLead(),
                a = !!this.resumingFrom || this !== l;
            let u = !0;
            if (
                ((this.isProjectionDirty ||
                    (!((o = this.parent) === null || o === void 0) && o.isProjectionDirty)) &&
                    (u = !1),
                a && (this.isSharedProjectionDirty || this.isTransformDirty) && (u = !1),
                this.resolvedRelativeTargetAt === ee.timestamp && (u = !1),
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
            _e(this.layoutCorrected, this.layout.layoutBox);
            const d = this.treeScale.x,
                g = this.treeScale.y;
            (Iw(this.layoutCorrected, this.treeScale, this.path, a),
                l.layout &&
                    !l.target &&
                    (this.treeScale.x !== 1 || this.treeScale.y !== 1) &&
                    ((l.target = l.layout.layoutBox), (l.targetWithTransforms = Z())));
            const { target: y } = l;
            if (!y) {
                this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
                return;
            }
            (!this.projectionDelta || !this.prevProjectionDelta
                ? this.createProjectionDeltas()
                : (Df(this.prevProjectionDelta.x, this.projectionDelta.x),
                  Df(this.prevProjectionDelta.y, this.projectionDelta.y)),
                Dr(this.projectionDelta, this.layoutCorrected, y, this.latestValues),
                (this.treeScale.x !== d ||
                    this.treeScale.y !== g ||
                    !If(this.projectionDelta.x, this.prevProjectionDelta.x) ||
                    !If(this.projectionDelta.y, this.prevProjectionDelta.y)) &&
                    ((this.hasProjected = !0),
                    this.scheduleRender(),
                    this.notifyListeners('projectionUpdate', y)),
                yr && Zt.recalculatedProjection++);
        }
        hide() {
            this.isVisible = !1;
        }
        show() {
            this.isVisible = !0;
        }
        scheduleRender(o = !0) {
            var l;
            if (
                ((l = this.options.visualElement) === null || l === void 0 || l.scheduleRender(), o)
            ) {
                const a = this.getStack();
                a && a.scheduleRender();
            }
            this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = void 0);
        }
        createProjectionDeltas() {
            ((this.prevProjectionDelta = Dn()),
                (this.projectionDelta = Dn()),
                (this.projectionDeltaWithTransform = Dn()));
        }
        setAnimationOrigin(o, l = !1) {
            const a = this.snapshot,
                u = a ? a.latestValues : {},
                c = { ...this.latestValues },
                f = Dn();
            ((!this.relativeParent || !this.relativeParent.options.layoutRoot) &&
                (this.relativeTarget = this.relativeTargetOrigin = void 0),
                (this.attemptToResolveRelativeTarget = !l));
            const d = Z(),
                g = a ? a.source : void 0,
                y = this.layout ? this.layout.source : void 0,
                v = g !== y,
                S = this.getStack(),
                p = !S || S.members.length <= 1,
                h = !!(v && !p && this.options.crossfade === !0 && !this.path.some(Px));
            this.animationProgress = 0;
            let m;
            ((this.mixTargetDelta = (w) => {
                const x = w / 1e3;
                (Wf(f.x, o.x, x),
                    Wf(f.y, o.y, x),
                    this.setTargetDelta(f),
                    this.relativeTarget &&
                        this.relativeTargetOrigin &&
                        this.layout &&
                        this.relativeParent &&
                        this.relativeParent.layout &&
                        (Lr(d, this.layout.layoutBox, this.relativeParent.layout.layoutBox),
                        Tx(this.relativeTarget, this.relativeTargetOrigin, d, x),
                        m && ox(this.relativeTarget, m) && (this.isProjectionDirty = !1),
                        m || (m = Z()),
                        _e(m, this.relativeTarget)),
                    v && ((this.animationValues = c), ex(c, u, this.latestValues, x, h, p)),
                    this.root.scheduleUpdateProjection(),
                    this.scheduleRender(),
                    (this.animationProgress = x));
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
                    (Ze(this.pendingAnimation), (this.pendingAnimation = void 0)),
                (this.pendingAnimation = F.update(() => {
                    ((Xi.hasAnimatedSinceResize = !0),
                        (this.currentAnimation = Yw(0, zf, {
                            ...o,
                            onUpdate: (l) => {
                                (this.mixTargetDelta(l), o.onUpdate && o.onUpdate(l));
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
                (this.mixTargetDelta && this.mixTargetDelta(zf), this.currentAnimation.stop()),
                this.completeAnimation());
        }
        applyTransformsToTarget() {
            const o = this.getLead();
            let { targetWithTransforms: l, target: a, layout: u, latestValues: c } = o;
            if (!(!l || !a || !u)) {
                if (
                    this !== o &&
                    this.layout &&
                    u &&
                    $m(this.options.animationType, this.layout.layoutBox, u.layoutBox)
                ) {
                    a = this.target || Z();
                    const f = De(this.layout.layoutBox.x);
                    ((a.x.min = o.target.x.min), (a.x.max = a.x.min + f));
                    const d = De(this.layout.layoutBox.y);
                    ((a.y.min = o.target.y.min), (a.y.max = a.y.min + d));
                }
                (_e(l, a),
                    Vn(l, c),
                    Dr(this.projectionDeltaWithTransform, this.layoutCorrected, l, c));
            }
        }
        registerSharedNode(o, l) {
            (this.sharedNodes.has(o) || this.sharedNodes.set(o, new lx()),
                this.sharedNodes.get(o).add(l));
            const u = l.options.initialPromotionConfig;
            l.promote({
                transition: u ? u.transition : void 0,
                preserveFollowOpacity:
                    u && u.shouldPreserveFollowOpacity ? u.shouldPreserveFollowOpacity(l) : void 0,
            });
        }
        isLead() {
            const o = this.getStack();
            return o ? o.lead === this : !0;
        }
        getLead() {
            var o;
            const { layoutId: l } = this.options;
            return l
                ? ((o = this.getStack()) === null || o === void 0 ? void 0 : o.lead) || this
                : this;
        }
        getPrevLead() {
            var o;
            const { layoutId: l } = this.options;
            return l
                ? (o = this.getStack()) === null || o === void 0
                    ? void 0
                    : o.prevLead
                : void 0;
        }
        getStack() {
            const { layoutId: o } = this.options;
            if (o) return this.root.sharedNodes.get(o);
        }
        promote({ needsReset: o, transition: l, preserveFollowOpacity: a } = {}) {
            const u = this.getStack();
            (u && u.promote(this, a),
                o && ((this.projectionDelta = void 0), (this.needsReset = !0)),
                l && this.setOptions({ transition: l }));
        }
        relegate() {
            const o = this.getStack();
            return o ? o.relegate(this) : !1;
        }
        resetSkewAndRotation() {
            const { visualElement: o } = this.options;
            if (!o) return;
            let l = !1;
            const { latestValues: a } = o;
            if (
                ((a.z || a.rotate || a.rotateX || a.rotateY || a.rotateZ || a.skewX || a.skewY) &&
                    (l = !0),
                !l)
            )
                return;
            const u = {};
            a.z && Oo('z', o, u, this.animationValues);
            for (let c = 0; c < jo.length; c++)
                (Oo(`rotate${jo[c]}`, o, u, this.animationValues),
                    Oo(`skew${jo[c]}`, o, u, this.animationValues));
            o.render();
            for (const c in u)
                (o.setStaticValue(c, u[c]),
                    this.animationValues && (this.animationValues[c] = u[c]));
            o.scheduleRender();
        }
        getProjectionStyles(o) {
            var l, a;
            if (!this.instance || this.isSVG) return;
            if (!this.isVisible) return ux;
            const u = { visibility: '' },
                c = this.getTransformTemplate();
            if (this.needsReset)
                return (
                    (this.needsReset = !1),
                    (u.opacity = ''),
                    (u.pointerEvents = Qi(o == null ? void 0 : o.pointerEvents) || ''),
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
                        (v.pointerEvents = Qi(o == null ? void 0 : o.pointerEvents) || '')),
                    this.hasProjected &&
                        !Xt(this.latestValues) &&
                        ((v.transform = c ? c({}, '') : 'none'), (this.hasProjected = !1)),
                    v
                );
            }
            const d = f.animationValues || f.latestValues;
            (this.applyTransformsToTarget(),
                (u.transform = ax(this.projectionDeltaWithTransform, this.treeScale, d)),
                c && (u.transform = c(d, u.transform)));
            const { x: g, y } = this.projectionDelta;
            ((u.transformOrigin = `${g.origin * 100}% ${y.origin * 100}% 0`),
                f.animationValues
                    ? (u.opacity =
                          f === this
                              ? (a =
                                    (l = d.opacity) !== null && l !== void 0
                                        ? l
                                        : this.latestValues.opacity) !== null && a !== void 0
                                  ? a
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
            for (const v in Ps) {
                if (d[v] === void 0) continue;
                const { correct: S, applyTo: p } = Ps[v],
                    h = u.transform === 'none' ? d[v] : S(d[v], f);
                if (p) {
                    const m = p.length;
                    for (let w = 0; w < m; w++) u[p[w]] = h;
                } else u[v] = h;
            }
            return (
                this.options.layoutId &&
                    (u.pointerEvents =
                        f === this ? Qi(o == null ? void 0 : o.pointerEvents) || '' : 'none'),
                u
            );
        }
        clearSnapshot() {
            this.resumeFrom = this.snapshot = void 0;
        }
        resetTree() {
            (this.root.nodes.forEach((o) => {
                var l;
                return (l = o.currentAnimation) === null || l === void 0 ? void 0 : l.stop();
            }),
                this.root.nodes.forEach(Bf),
                this.root.sharedNodes.clear());
        }
    };
}
function fx(e) {
    e.updateLayout();
}
function dx(e) {
    var t;
    const n = ((t = e.resumeFrom) === null || t === void 0 ? void 0 : t.snapshot) || e.snapshot;
    if (e.isLead() && e.layout && n && e.hasListeners('didUpdate')) {
        const { layoutBox: r, measuredBox: i } = e.layout,
            { animationType: s } = e.options,
            o = n.source !== e.layout.source;
        s === 'size'
            ? Ne((f) => {
                  const d = o ? n.measuredBox[f] : n.layoutBox[f],
                      g = De(d);
                  ((d.min = r[f].min), (d.max = d.min + g));
              })
            : $m(s, n.layoutBox, r) &&
              Ne((f) => {
                  const d = o ? n.measuredBox[f] : n.layoutBox[f],
                      g = De(r[f]);
                  ((d.max = d.min + g),
                      e.relativeTarget &&
                          !e.currentAnimation &&
                          ((e.isProjectionDirty = !0),
                          (e.relativeTarget[f].max = e.relativeTarget[f].min + g)));
              });
        const l = Dn();
        Dr(l, r, n.layoutBox);
        const a = Dn();
        o ? Dr(a, e.applyTransform(i, !0), n.measuredBox) : Dr(a, r, n.layoutBox);
        const u = !zm(l);
        let c = !1;
        if (!e.resumeFrom) {
            const f = e.getClosestProjectingParent();
            if (f && !f.resumeFrom) {
                const { snapshot: d, layout: g } = f;
                if (d && g) {
                    const y = Z();
                    Lr(y, n.layoutBox, d.layoutBox);
                    const v = Z();
                    (Lr(v, r, g.layoutBox),
                        Bm(y, v) || (c = !0),
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
            delta: a,
            layoutDelta: l,
            hasLayoutChanged: u,
            hasRelativeTargetChanged: c,
        });
    } else if (e.isLead()) {
        const { onExitComplete: r } = e.options;
        r && r();
    }
    e.options.transition = void 0;
}
function hx(e) {
    (yr && Zt.totalNodes++,
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
function px(e) {
    e.isProjectionDirty = e.isSharedProjectionDirty = e.isTransformDirty = !1;
}
function mx(e) {
    e.clearSnapshot();
}
function Bf(e) {
    e.clearMeasurements();
}
function gx(e) {
    e.isLayoutDirty = !1;
}
function yx(e) {
    const { visualElement: t } = e.options;
    (t && t.getProps().onBeforeLayoutMeasure && t.notify('BeforeLayoutMeasure'),
        e.resetTransform());
}
function Uf(e) {
    (e.finishAnimation(),
        (e.targetDelta = e.relativeTarget = e.target = void 0),
        (e.isProjectionDirty = !0));
}
function vx(e) {
    e.resolveTargetDelta();
}
function wx(e) {
    e.calcProjection();
}
function xx(e) {
    e.resetSkewAndRotation();
}
function Sx(e) {
    e.removeLeadSnapshot();
}
function Wf(e, t, n) {
    ((e.translate = H(t.translate, 0, n)),
        (e.scale = H(t.scale, 1, n)),
        (e.origin = t.origin),
        (e.originPoint = t.originPoint));
}
function $f(e, t, n, r) {
    ((e.min = H(t.min, n.min, r)), (e.max = H(t.max, n.max, r)));
}
function Tx(e, t, n, r) {
    ($f(e.x, t.x, n.x, r), $f(e.y, t.y, n.y, r));
}
function Px(e) {
    return e.animationValues && e.animationValues.opacityExit !== void 0;
}
const kx = { duration: 0.45, ease: [0.4, 0, 0.1, 1] },
    Hf = (e) =>
        typeof navigator < 'u' &&
        navigator.userAgent &&
        navigator.userAgent.toLowerCase().includes(e),
    Kf = Hf('applewebkit/') && !Hf('chrome/') ? Math.round : ve;
function Gf(e) {
    ((e.min = Kf(e.min)), (e.max = Kf(e.max)));
}
function Cx(e) {
    (Gf(e.x), Gf(e.y));
}
function $m(e, t, n) {
    return e === 'position' || (e === 'preserve-aspect' && !Mw(Ff(t), Ff(n), 0.2));
}
function Ex(e) {
    var t;
    return e !== e.root && ((t = e.scroll) === null || t === void 0 ? void 0 : t.wasRoot);
}
const Ax = Wm({
        attachResizeListener: (e, t) => br(e, 'resize', t),
        measureScroll: () => ({
            x: document.documentElement.scrollLeft || document.body.scrollLeft,
            y: document.documentElement.scrollTop || document.body.scrollTop,
        }),
        checkIsScrollRoot: () => !0,
    }),
    Fo = { current: void 0 },
    Hm = Wm({
        measureScroll: (e) => ({ x: e.scrollLeft, y: e.scrollTop }),
        defaultParent: () => {
            if (!Fo.current) {
                const e = new Ax({});
                (e.mount(window), e.setOptions({ layoutScroll: !0 }), (Fo.current = e));
            }
            return Fo.current;
        },
        resetTransform: (e, t) => {
            e.style.transform = t !== void 0 ? t : 'none';
        },
        checkIsScrollRoot: (e) => window.getComputedStyle(e).position === 'fixed',
    }),
    Mx = { pan: { Feature: Hw }, drag: { Feature: $w, ProjectionNode: Hm, MeasureLayout: Om } };
function Qf(e, t, n) {
    const { props: r } = e;
    e.animationState && r.whileHover && e.animationState.setActive('whileHover', n === 'Start');
    const i = 'onHover' + n,
        s = r[i];
    s && F.postRender(() => s(t, ci(t)));
}
class Rx extends Wt {
    mount() {
        const { current: t } = this.node;
        t &&
            (this.unmount = R0(
                t,
                (n) => (Qf(this.node, n, 'Start'), (r) => Qf(this.node, r, 'End')),
            ));
    }
    unmount() {}
}
class Dx extends Wt {
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
        this.unmount = ui(
            br(this.node.current, 'focus', () => this.onFocus()),
            br(this.node.current, 'blur', () => this.onBlur()),
        );
    }
    unmount() {}
}
function Yf(e, t, n) {
    const { props: r } = e;
    e.animationState && r.whileTap && e.animationState.setActive('whileTap', n === 'Start');
    const i = 'onTap' + (n === 'End' ? '' : n),
        s = r[i];
    s && F.postRender(() => s(t, ci(t)));
}
class Lx extends Wt {
    mount() {
        const { current: t } = this.node;
        t &&
            (this.unmount = _0(
                t,
                (n) => (
                    Yf(this.node, n, 'Start'),
                    (r, { success: i }) => Yf(this.node, r, i ? 'End' : 'Cancel')
                ),
                { useGlobalTarget: this.node.props.globalTapTarget },
            ));
    }
    unmount() {}
}
const Yl = new WeakMap(),
    Io = new WeakMap(),
    Vx = (e) => {
        const t = Yl.get(e.target);
        t && t(e);
    },
    _x = (e) => {
        e.forEach(Vx);
    };
function Nx({ root: e, ...t }) {
    const n = e || document;
    Io.has(n) || Io.set(n, {});
    const r = Io.get(n),
        i = JSON.stringify(t);
    return (r[i] || (r[i] = new IntersectionObserver(_x, { root: e, ...t })), r[i]);
}
function jx(e, t, n) {
    const r = Nx(t);
    return (
        Yl.set(e, n),
        r.observe(e),
        () => {
            (Yl.delete(e), r.unobserve(e));
        }
    );
}
const Ox = { some: 0, all: 1 };
class Fx extends Wt {
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
                threshold: typeof i == 'number' ? i : Ox[i],
            },
            l = (a) => {
                const { isIntersecting: u } = a;
                if (this.isInView === u || ((this.isInView = u), s && !u && this.hasEnteredView))
                    return;
                (u && (this.hasEnteredView = !0),
                    this.node.animationState &&
                        this.node.animationState.setActive('whileInView', u));
                const { onViewportEnter: c, onViewportLeave: f } = this.node.getProps(),
                    d = u ? c : f;
                d && d(a);
            };
        return jx(this.node.current, o, l);
    }
    mount() {
        this.startObserver();
    }
    update() {
        if (typeof IntersectionObserver > 'u') return;
        const { props: t, prevProps: n } = this.node;
        ['amount', 'margin', 'root'].some(Ix(t, n)) && this.startObserver();
    }
    unmount() {}
}
function Ix({ viewport: e = {} }, { viewport: t = {} } = {}) {
    return (n) => e[n] !== t[n];
}
const zx = {
        inView: { Feature: Fx },
        tap: { Feature: Lx },
        focus: { Feature: Dx },
        hover: { Feature: Rx },
    },
    Bx = { layout: { ProjectionNode: Hm, MeasureLayout: Om } },
    Xl = { current: null },
    Km = { current: !1 };
function Ux() {
    if (((Km.current = !0), !!Ga))
        if (window.matchMedia) {
            const e = window.matchMedia('(prefers-reduced-motion)'),
                t = () => (Xl.current = e.matches);
            (e.addListener(t), t());
        } else Xl.current = !1;
}
const Wx = [...mm, he, It],
    $x = (e) => Wx.find(pm(e)),
    Xf = new WeakMap();
function Hx(e, t, n) {
    for (const r in t) {
        const i = t[r],
            s = n[r];
        if (oe(i)) e.addValue(r, i);
        else if (oe(s)) e.addValue(r, et(i, { owner: e }));
        else if (s !== i)
            if (e.hasValue(r)) {
                const o = e.getValue(r);
                o.liveStyle === !0 ? o.jump(i) : o.hasAnimated || o.set(i);
            } else {
                const o = e.getStaticValue(r);
                e.addValue(r, et(o !== void 0 ? o : i, { owner: e }));
            }
    }
    for (const r in n) t[r] === void 0 && e.removeValue(r);
    return t;
}
const Zf = [
    'AnimationStart',
    'AnimationComplete',
    'Update',
    'BeforeLayoutMeasure',
    'LayoutMeasure',
    'LayoutAnimationStart',
    'LayoutAnimationComplete',
];
class Kx {
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
        l = {},
    ) {
        ((this.current = null),
            (this.children = new Set()),
            (this.isVariantNode = !1),
            (this.isControllingVariants = !1),
            (this.shouldReduceMotion = null),
            (this.values = new Map()),
            (this.KeyframeResolver = xu),
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
                const g = it.now();
                this.renderScheduledAt < g &&
                    ((this.renderScheduledAt = g), F.render(this.render, !1, !0));
            }));
        const { latestValues: a, renderState: u, onUpdate: c } = o;
        ((this.onUpdate = c),
            (this.latestValues = a),
            (this.baseTarget = { ...a }),
            (this.initialValues = n.initial ? { ...a } : {}),
            (this.renderState = u),
            (this.parent = t),
            (this.props = n),
            (this.presenceContext = r),
            (this.depth = t ? t.depth + 1 : 0),
            (this.reducedMotionConfig = i),
            (this.options = l),
            (this.blockInitialAnimation = !!s),
            (this.isControllingVariants = Ys(n)),
            (this.isVariantNode = Tp(n)),
            this.isVariantNode && (this.variantChildren = new Set()),
            (this.manuallyAnimateOnMount = !!(t && t.current)));
        const { willChange: f, ...d } = this.scrapeMotionValuesFromProps(n, {}, this);
        for (const g in d) {
            const y = d[g];
            a[g] !== void 0 && oe(y) && y.set(a[g], !1);
        }
    }
    mount(t) {
        ((this.current = t),
            Xf.set(t, this),
            this.projection && !this.projection.instance && this.projection.mount(t),
            this.parent &&
                this.isVariantNode &&
                !this.isControllingVariants &&
                (this.removeFromVariantTree = this.parent.addVariantChild(this)),
            this.values.forEach((n, r) => this.bindToMotionValue(r, n)),
            Km.current || Ux(),
            (this.shouldReduceMotion =
                this.reducedMotionConfig === 'never'
                    ? !1
                    : this.reducedMotionConfig === 'always'
                      ? !0
                      : Xl.current),
            this.parent && this.parent.children.add(this),
            this.update(this.props, this.presenceContext));
    }
    unmount() {
        (Xf.delete(this.current),
            this.projection && this.projection.unmount(),
            Ze(this.notifyUpdate),
            Ze(this.render),
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
        const r = pn.has(t),
            i = n.on('change', (l) => {
                ((this.latestValues[t] = l),
                    this.props.onUpdate && F.preRender(this.notifyUpdate),
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
        for (t in Gn) {
            const n = Gn[t];
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
        return this.current ? this.measureInstanceViewportBox(this.current, this.props) : Z();
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
        for (let r = 0; r < Zf.length; r++) {
            const i = Zf[r];
            this.propEventSubscriptions[i] &&
                (this.propEventSubscriptions[i](), delete this.propEventSubscriptions[i]);
            const s = 'on' + i,
                o = t[s];
            o && (this.propEventSubscriptions[i] = this.on(i, o));
        }
        ((this.prevMotionValues = Hx(
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
                ((r = et(n === null ? void 0 : n, { owner: this })), this.addValue(t, r)),
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
                (typeof i == 'string' && (dm(i) || rm(i))
                    ? (i = parseFloat(i))
                    : !$x(i) && It.test(n) && (i = um(t, n)),
                this.setBaseTarget(t, oe(i) ? i.get() : i)),
            oe(i) ? i.get() : i
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
            const o = ba(
                this.props,
                r,
                (n = this.presenceContext) === null || n === void 0 ? void 0 : n.custom,
            );
            o && (i = o[t]);
        }
        if (r && i !== void 0) return i;
        const s = this.getBaseTargetFromProps(this.props, t);
        return s !== void 0 && !oe(s)
            ? s
            : this.initialValues[t] !== void 0 && i === void 0
              ? void 0
              : this.baseTarget[t];
    }
    on(t, n) {
        return (this.events[t] || (this.events[t] = new hu()), this.events[t].add(n));
    }
    notify(t, ...n) {
        this.events[t] && this.events[t].notify(...n);
    }
}
class Gm extends Kx {
    constructor() {
        (super(...arguments), (this.KeyframeResolver = gm));
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
        oe(t) &&
            (this.childSubscription = t.on('change', (n) => {
                this.current && (this.current.textContent = `${n}`);
            }));
    }
}
function Gx(e) {
    return window.getComputedStyle(e);
}
class Qx extends Gm {
    constructor() {
        (super(...arguments), (this.type = 'html'), (this.renderInstance = Lp));
    }
    readValueFromInstance(t, n) {
        if (pn.has(n)) {
            const r = wu(n);
            return (r && r.default) || 0;
        } else {
            const r = Gx(t),
                i = (Mp(n) ? r.getPropertyValue(n) : r[n]) || 0;
            return typeof i == 'string' ? i.trim() : i;
        }
    }
    measureInstanceViewportBox(t, { transformPagePoint: n }) {
        return Nm(t, n);
    }
    build(t, n, r) {
        nu(t, n, r.transformTemplate);
    }
    scrapeMotionValuesFromProps(t, n, r) {
        return ou(t, n, r);
    }
}
class Yx extends Gm {
    constructor() {
        (super(...arguments),
            (this.type = 'svg'),
            (this.isSVGTag = !1),
            (this.measureInstanceViewportBox = Z));
    }
    getBaseTargetFromProps(t, n) {
        return t[n];
    }
    readValueFromInstance(t, n) {
        if (pn.has(n)) {
            const r = wu(n);
            return (r && r.default) || 0;
        }
        return ((n = Vp.has(n) ? n : Za(n)), t.getAttribute(n));
    }
    scrapeMotionValuesFromProps(t, n, r) {
        return jp(t, n, r);
    }
    build(t, n, r) {
        ru(t, n, this.isSVGTag, r.transformTemplate);
    }
    renderInstance(t, n, r, i) {
        _p(t, n, r, i);
    }
    mount(t) {
        ((this.isSVGTag = su(t.tagName)), super.mount(t));
    }
}
const Xx = (e, t) => (Ja(e) ? new Yx(t) : new Qx(t, { allowProjection: e !== C.Fragment })),
    Zx = k0({ ...ww, ...zx, ...Mx, ...Bx }, Xx),
    Fe = zv(Zx);
function Qm(e, t) {
    let n;
    const r = () => {
        const { currentTime: i } = t,
            o = (i === null ? 0 : i.value) / 100;
        (n !== o && e(o), (n = o));
    };
    return (F.update(r, !0), () => Ze(r));
}
const Zi = new WeakMap();
let St;
function qx(e, t) {
    if (t) {
        const { inlineSize: n, blockSize: r } = t[0];
        return { width: n, height: r };
    } else
        return e instanceof SVGElement && 'getBBox' in e
            ? e.getBBox()
            : { width: e.offsetWidth, height: e.offsetHeight };
}
function Jx({ target: e, contentRect: t, borderBoxSize: n }) {
    var r;
    (r = Zi.get(e)) === null ||
        r === void 0 ||
        r.forEach((i) => {
            i({
                target: e,
                contentSize: t,
                get size() {
                    return qx(e, n);
                },
            });
        });
}
function bx(e) {
    e.forEach(Jx);
}
function eS() {
    typeof ResizeObserver > 'u' || (St = new ResizeObserver(bx));
}
function tS(e, t) {
    St || eS();
    const n = Hp(e);
    return (
        n.forEach((r) => {
            let i = Zi.get(r);
            (i || ((i = new Set()), Zi.set(r, i)), i.add(t), St == null || St.observe(r));
        }),
        () => {
            n.forEach((r) => {
                const i = Zi.get(r);
                (i == null || i.delete(t), (i != null && i.size) || St == null || St.unobserve(r));
            });
        }
    );
}
const qi = new Set();
let Vr;
function nS() {
    ((Vr = () => {
        const e = { width: window.innerWidth, height: window.innerHeight },
            t = { target: window, size: e, contentSize: e };
        qi.forEach((n) => n(t));
    }),
        window.addEventListener('resize', Vr));
}
function rS(e) {
    return (
        qi.add(e),
        Vr || nS(),
        () => {
            (qi.delete(e), !qi.size && Vr && (Vr = void 0));
        }
    );
}
function iS(e, t) {
    return typeof e == 'function' ? rS(e) : tS(e, t);
}
const sS = 50,
    qf = () => ({
        current: 0,
        offset: [],
        progress: 0,
        scrollLength: 0,
        targetOffset: 0,
        targetLength: 0,
        containerLength: 0,
        velocity: 0,
    }),
    oS = () => ({ time: 0, x: qf(), y: qf() }),
    lS = { x: { length: 'Width', position: 'Left' }, y: { length: 'Height', position: 'Top' } };
function Jf(e, t, n, r) {
    const i = n[t],
        { length: s, position: o } = lS[t],
        l = i.current,
        a = n.time;
    ((i.current = e[`scroll${o}`]),
        (i.scrollLength = e[`scroll${s}`] - e[`client${s}`]),
        (i.offset.length = 0),
        (i.offset[0] = 0),
        (i.offset[1] = i.scrollLength),
        (i.progress = fn(0, i.scrollLength, i.current)));
    const u = r - a;
    i.velocity = u > sS ? 0 : pu(i.current - l, u);
}
function aS(e, t, n) {
    (Jf(e, 'x', t, n), Jf(e, 'y', t, n), (t.time = n));
}
function uS(e, t) {
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
                l = r.parentNode;
            for (; !o; ) (l.tagName === 'svg' && (o = l), (l = r.parentNode));
            r = o;
        } else break;
    return n;
}
const Zl = { start: 0, center: 0.5, end: 1 };
function bf(e, t, n = 0) {
    let r = 0;
    if ((e in Zl && (e = Zl[e]), typeof e == 'string')) {
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
const cS = [0, 0];
function fS(e, t, n, r) {
    let i = Array.isArray(e) ? e : cS,
        s = 0,
        o = 0;
    return (
        typeof e == 'number'
            ? (i = [e, e])
            : typeof e == 'string' &&
              ((e = e.trim()), e.includes(' ') ? (i = e.split(' ')) : (i = [e, Zl[e] ? e : '0'])),
        (s = bf(i[0], n, r)),
        (o = bf(i[1], t)),
        s - o
    );
}
const dS = {
        All: [
            [0, 0],
            [1, 1],
        ],
    },
    hS = { x: 0, y: 0 };
function pS(e) {
    return 'getBBox' in e && e.tagName !== 'svg'
        ? e.getBBox()
        : { width: e.clientWidth, height: e.clientHeight };
}
function mS(e, t, n) {
    const { offset: r = dS.All } = n,
        { target: i = e, axis: s = 'y' } = n,
        o = s === 'y' ? 'height' : 'width',
        l = i !== e ? uS(i, e) : hS,
        a = i === e ? { width: e.scrollWidth, height: e.scrollHeight } : pS(i),
        u = { width: e.clientWidth, height: e.clientHeight };
    t[s].offset.length = 0;
    let c = !t[s].interpolate;
    const f = r.length;
    for (let d = 0; d < f; d++) {
        const g = fS(r[d], u[o], a[o], l[s]);
        (!c && g !== t[s].interpolatorOffsets[d] && (c = !0), (t[s].offset[d] = g));
    }
    (c &&
        ((t[s].interpolate = Tu(t[s].offset, Pm(r), { clamp: !1 })),
        (t[s].interpolatorOffsets = [...t[s].offset])),
        (t[s].progress = st(0, 1, t[s].interpolate(t[s].current))));
}
function gS(e, t = e, n) {
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
function yS(e, t, n, r = {}) {
    return {
        measure: () => gS(e, r.target, n),
        update: (i) => {
            (aS(e, n, i), (r.offset || r.target) && mS(e, n, r));
        },
        notify: () => t(n),
    };
}
const cr = new WeakMap(),
    ed = new WeakMap(),
    zo = new WeakMap(),
    td = (e) => (e === document.documentElement ? window : e);
function ku(e, { container: t = document.documentElement, ...n } = {}) {
    let r = zo.get(t);
    r || ((r = new Set()), zo.set(t, r));
    const i = oS(),
        s = yS(t, e, i, n);
    if ((r.add(s), !cr.has(t))) {
        const l = () => {
                for (const d of r) d.measure();
            },
            a = () => {
                for (const d of r) d.update(ee.timestamp);
            },
            u = () => {
                for (const d of r) d.notify();
            },
            c = () => {
                (F.read(l, !1, !0), F.read(a, !1, !0), F.update(u, !1, !0));
            };
        cr.set(t, c);
        const f = td(t);
        (window.addEventListener('resize', c, { passive: !0 }),
            t !== document.documentElement && ed.set(t, iS(t, c)),
            f.addEventListener('scroll', c, { passive: !0 }));
    }
    const o = cr.get(t);
    return (
        F.read(o, !1, !0),
        () => {
            var l;
            Ze(o);
            const a = zo.get(t);
            if (!a || (a.delete(s), a.size)) return;
            const u = cr.get(t);
            (cr.delete(t),
                u &&
                    (td(t).removeEventListener('scroll', u),
                    (l = ed.get(t)) === null || l === void 0 || l(),
                    window.removeEventListener('resize', u)));
        }
    );
}
function vS({ source: e, container: t, axis: n = 'y' }) {
    e && (t = e);
    const r = { value: 0 },
        i = ku(
            (s) => {
                r.value = s[n].progress * 100;
            },
            { container: t, axis: n },
        );
    return { currentTime: r, cancel: i };
}
const Bo = new Map();
function Ym({ source: e, container: t = document.documentElement, axis: n = 'y' } = {}) {
    (e && (t = e), Bo.has(t) || Bo.set(t, {}));
    const r = Bo.get(t);
    return (
        r[n] ||
            (r[n] = Ip() ? new ScrollTimeline({ source: t, axis: n }) : vS({ source: t, axis: n })),
        r[n]
    );
}
function wS(e) {
    return e.length === 2;
}
function Xm(e) {
    return e && (e.target || e.offset);
}
function xS(e, t) {
    return wS(e) || Xm(t)
        ? ku((n) => {
              e(n[t.axis].progress, n);
          }, t)
        : Qm(e, Ym(t));
}
function SS(e, t) {
    if ((e.flatten(), Xm(t)))
        return (
            e.pause(),
            ku((n) => {
                e.time = e.duration * n[t.axis].progress;
            }, t)
        );
    {
        const n = Ym(t);
        return e.attachTimeline
            ? e.attachTimeline(
                  n,
                  (r) => (
                      r.pause(),
                      Qm((i) => {
                          r.time = r.duration * i;
                      }, n)
                  ),
              )
            : ve;
    }
}
function TS(e, { axis: t = 'y', ...n } = {}) {
    const r = { axis: t, ...n };
    return typeof e == 'function' ? xS(e, r) : SS(e, r);
}
function nd(e, t) {
    Lv(!!(!t || t.current));
}
const PS = () => ({
    scrollX: et(0),
    scrollY: et(0),
    scrollXProgress: et(0),
    scrollYProgress: et(0),
});
function kS({ container: e, target: t, layoutEffect: n = !0, ...r } = {}) {
    const i = qn(PS);
    return (
        (n ? oi : C.useEffect)(
            () => (
                nd('target', t),
                nd('container', e),
                TS(
                    (o, { x: l, y: a }) => {
                        (i.scrollX.set(l.current),
                            i.scrollXProgress.set(l.progress),
                            i.scrollY.set(a.current),
                            i.scrollYProgress.set(a.progress));
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
function Zm(e) {
    const t = qn(() => et(e)),
        { isStatic: n } = C.useContext(si);
    if (n) {
        const [, r] = C.useState(e);
        C.useEffect(() => t.on('change', r), []);
    }
    return t;
}
function qm(e, t) {
    const n = Zm(t()),
        r = () => n.set(t());
    return (
        r(),
        oi(() => {
            const i = () => F.preRender(r, !1, !0),
                s = e.map((o) => o.on('change', i));
            return () => {
                (s.forEach((o) => o()), Ze(r));
            };
        }),
        n
    );
}
function rd(e) {
    return typeof e == 'number' ? e : parseFloat(e);
}
function CS(e, t = {}) {
    const { isStatic: n } = C.useContext(si),
        r = C.useRef(null),
        i = Zm(oe(e) ? rd(e.get()) : e),
        s = C.useRef(i.get()),
        o = C.useRef(() => {}),
        l = () => {
            const u = r.current;
            (u && u.time === 0 && u.sample(ee.delta),
                a(),
                (r.current = G1({
                    keyframes: [i.get(), s.current],
                    velocity: i.getVelocity(),
                    type: 'spring',
                    restDelta: 0.001,
                    restSpeed: 0.01,
                    ...t,
                    onUpdate: o.current,
                })));
        },
        a = () => {
            r.current && r.current.stop();
        };
    return (
        C.useInsertionEffect(
            () =>
                i.attach(
                    (u, c) => (n ? c(u) : ((s.current = u), (o.current = c), F.update(l), i.get())),
                    a,
                ),
            [JSON.stringify(t)],
        ),
        oi(() => {
            if (oe(e)) return e.on('change', (u) => i.set(rd(u)));
        }, [i]),
        i
    );
}
const ES = (e) => e && typeof e == 'object' && e.mix,
    AS = (e) => (ES(e) ? e.mix : void 0);
function MS(...e) {
    const t = !Array.isArray(e[0]),
        n = t ? 0 : -1,
        r = e[0 + n],
        i = e[1 + n],
        s = e[2 + n],
        o = e[3 + n],
        l = Tu(i, s, { mixer: AS(s[0]), ...o });
    return t ? l(r) : l;
}
function RS(e) {
    ((Ar.current = []), e());
    const t = qm(Ar.current, e);
    return ((Ar.current = void 0), t);
}
function tn(e, t, n, r) {
    if (typeof e == 'function') return RS(e);
    const i = typeof t == 'function' ? t : MS(t, n, r);
    return Array.isArray(e) ? id(e, i) : id([e], ([s]) => i(s));
}
function id(e, t) {
    const n = qn(() => []);
    return qm(e, () => {
        n.length = 0;
        const r = e.length;
        for (let i = 0; i < r; i++) n[i] = e[i].get();
        return t(n);
    });
}
const DS = ({ scrollProgress: e }) => {
        const t = C.useRef(null),
            [n, r] = C.useState([]),
            [i, s] = C.useState(!1),
            [o, l] = C.useState(0),
            a = 120,
            u = tn(e, [0, 1], [1, a]),
            c = CS(u, { stiffness: 300, damping: 30, restDelta: 0.001 });
        return (
            C.useEffect(() => {
                let f = 0;
                const d = [];
                (() => {
                    for (let y = 1; y <= a; y++) {
                        const v = new Image(),
                            S = y.toString().padStart(4, '0');
                        ((v.src = `/frames/hal-Test_frame_${S}.webp`),
                            (v.onload = () => {
                                (f++, l(Math.floor((f / a) * 100)), f === a && s(!0));
                            }),
                            (v.onerror = () => {
                                (f++, f === a && s(!0));
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
                                m = p.width / 2 - (S.width / 2) * h,
                                w = p.height / 2 - (S.height / 2) * h;
                            f.drawImage(S, m, w, S.width * h, S.height * h);
                        }
                        requestAnimationFrame(d);
                    },
                    g = () => {
                        t.current &&
                            ((t.current.width = window.innerWidth),
                            (t.current.height = window.innerHeight));
                    };
                (window.addEventListener('resize', g), g());
                const y = requestAnimationFrame(d);
                return () => {
                    (cancelAnimationFrame(y), window.removeEventListener('resize', g));
                };
            }, [i, n, c]),
            R.jsxs('div', {
                className: 'fixed inset-0 z-0 flex items-center justify-center bg-transparent',
                children: [
                    R.jsx('canvas', { ref: t, className: 'w-full h-full object-contain' }),
                    R.jsx(Dv, {
                        children:
                            !i &&
                            R.jsxs(Fe.div, {
                                exit: { opacity: 0 },
                                className:
                                    'absolute inset-0 z-50 flex flex-col items-center justify-center bg-background font-mono',
                                children: [
                                    R.jsx('div', {
                                        className: 'text-white text-xl mb-4 tracking-tighter',
                                        children: 'INITIALIZING HAL_SYSTEM',
                                    }),
                                    R.jsx('div', {
                                        className: 'w-64 h-[2px] bg-white/10 overflow-hidden',
                                        children: R.jsx(Fe.div, {
                                            className: 'h-full bg-white',
                                            initial: { width: 0 },
                                            animate: { width: `${o}%` },
                                        }),
                                    }),
                                    R.jsxs('div', {
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
    LS = ({ scrollProgress: e }) => {
        const t = tn(e, [0, 0.15], [1, 0]),
            n = tn(e, [0.2, 0.3, 0.4], [0, 1, 0]),
            r = tn(e, [0.5, 0.6, 0.7], [0, 1, 0]),
            i = tn(e, [0.85, 0.95], [0, 1]),
            s = 'text-white font-mono tracking-tight text-center px-6 max-w-4xl select-none';
        return R.jsxs('div', {
            className: 'fixed inset-0 z-10 pointer-events-none flex items-center justify-center',
            children: [
                R.jsxs(Fe.div, {
                    style: { opacity: t },
                    className: s,
                    children: [
                        R.jsxs('h1', {
                            className: 'text-5xl md:text-8xl font-bold uppercase mb-4',
                            children: [
                                R.jsx('span', {
                                    className: 'text-hal-primary-500',
                                    children: 'hal',
                                }),
                                R.jsx('span', { className: 'text-white', children: '-' }),
                                R.jsx('span', {
                                    className: 'text-hal-warning-500',
                                    children: 'Test',
                                }),
                            ],
                        }),
                        R.jsx('p', {
                            className: 'text-lg md:text-xl text-white/60',
                            children: 'Modern, visual automation framework.',
                        }),
                    ],
                }),
                R.jsxs(Fe.div, {
                    style: { opacity: n },
                    className: s,
                    children: [
                        R.jsx('h2', {
                            className: 'text-3xl md:text-5xl font-bold uppercase mb-4',
                            children: 'Visual Flow Editor',
                        }),
                        R.jsx('p', {
                            className: 'text-lg md:text-xl text-white/60',
                            children:
                                'Orquestación "drag-and-drop" con más de 50 nodos especializados. Sin código.',
                        }),
                    ],
                }),
                R.jsxs(Fe.div, {
                    style: { opacity: r },
                    className: s,
                    children: [
                        R.jsx('h2', {
                            className: 'text-3xl md:text-5xl font-bold uppercase mb-4',
                            children: 'Advanced Control',
                        }),
                        R.jsx('p', {
                            className: 'text-lg md:text-xl text-white/60',
                            children:
                                'Intercepción de red, integración con IA y gestión de sesiones.',
                        }),
                    ],
                }),
                R.jsxs(Fe.div, {
                    style: { opacity: i },
                    className: `${s} pointer-events-auto`,
                    children: [
                        R.jsx('h2', {
                            className: 'text-4xl md:text-7xl font-bold uppercase mb-8',
                            children: 'Open Source & Free',
                        }),
                        R.jsxs('div', {
                            className:
                                'flex flex-col md:flex-row gap-4 justify-center items-center',
                            children: [
                                R.jsx(Fe.button, {
                                    whileHover: {
                                        scale: 1.05,
                                        backgroundColor: 'var(--hal-primary-500)',
                                        borderColor: 'var(--hal-primary-500)',
                                    },
                                    whileTap: { scale: 0.95 },
                                    onClick: () => window.open('/app', '_blank'),
                                    className:
                                        'border border-white/20 bg-hal-primary-500/20 text-white px-12 py-4 rounded-full text-lg uppercase font-bold transition-colors backdrop-blur-md hover:bg-hal-primary-500',
                                    children: 'Launch App',
                                }),
                                R.jsxs(Fe.button, {
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
                                    children: [R.jsx('span', { children: '★' }), ' Star on GitHub'],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });
    };
function VS() {
    const e = C.useRef(null),
        { scrollYProgress: t } = kS({ target: e, offset: ['start start', 'end end'] }),
        n = tn(t, [0, 1], [0, 360]);
    return R.jsxs('div', {
        className: 'bg-background min-h-screen text-white',
        children: [
            R.jsx('style', {
                dangerouslySetInnerHTML: {
                    __html: `
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');
        body { background: #0f172a; margin: 0; cursor: crosshair; }
        ::-webkit-scrollbar { display: none; }
        .font-mono { font-family: 'Geist Mono', monospace; }
      `,
                },
            }),
            R.jsxs('nav', {
                className:
                    'fixed top-0 left-0 w-full p-8 z-50 flex justify-between items-center mix-blend-difference font-mono',
                children: [
                    R.jsxs('div', {
                        className: 'text-xl font-bold tracking-wider flex items-center gap-3',
                        children: [
                            R.jsx(Fe.img, {
                                style: { rotate: n },
                                src: '/images/haltest_logo.jpeg',
                                alt: 'Hal-Test Logo',
                                className: 'w-8 h-8 rounded-lg',
                            }),
                            R.jsxs('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                    R.jsx('span', {
                                        className: 'text-hal-primary-500',
                                        children: 'HAL',
                                    }),
                                    R.jsx('span', { className: 'text-white/50', children: '-' }),
                                    R.jsx('span', {
                                        className: 'text-hal-warning-500',
                                        children: 'TEST',
                                    }),
                                ],
                            }),
                        ],
                    }),
                    R.jsx('div', {
                        className: 'text-white/40 text-[10px] uppercase',
                        children: 'Status: Operating',
                    }),
                ],
            }),
            R.jsxs('div', {
                ref: e,
                className: 'relative h-[400vh]',
                children: [
                    R.jsxs('div', {
                        className: 'fixed inset-0 z-0 opacity-20 pointer-events-none',
                        children: [
                            R.jsx('img', {
                                src: '/video/base1.gif',
                                alt: 'Background Animation',
                                className: 'w-full h-full object-cover',
                            }),
                            R.jsx('div', {
                                className:
                                    'absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f172a_100%)]',
                            }),
                        ],
                    }),
                    R.jsx('div', {
                        className:
                            'fixed inset-0 z-0 flex items-center justify-center pointer-events-none',
                        children: R.jsx(Fe.img, {
                            style: { rotate: n, opacity: 0.1 },
                            src: '/images/haltest_logo.jpeg',
                            alt: 'Hal-Test Logo Watermark',
                            className:
                                'w-[50vmin] h-[50vmin] rounded-full mix-blend-overlay blur-sm',
                        }),
                    }),
                    R.jsx(DS, { scrollProgress: t }),
                    R.jsx(LS, { scrollProgress: t }),
                ],
            }),
            R.jsx('div', {
                className: 'fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50',
                children: [0, 1, 2, 3].map((r) =>
                    R.jsx(
                        Fe.div,
                        {
                            className: 'w-1 h-8 bg-white/10 rounded-full overflow-hidden',
                            children: R.jsx(Fe.div, {
                                className: 'w-full bg-white h-full origin-top',
                                style: { scaleY: tn(t, [r * 0.25, (r + 1) * 0.25], [0, 1]) },
                            }),
                        },
                        r,
                    ),
                ),
            }),
        ],
    });
}
Uo.createRoot(document.getElementById('root')).render(
    R.jsx(pg.StrictMode, { children: R.jsx(VS, {}) }),
);
