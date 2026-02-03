(function () {
    const t = document.createElement('link').relList;
    if (t && t.supports && t.supports('modulepreload')) return;
    for (const i of document.querySelectorAll('link[rel="modulepreload"]')) r(i);
    new MutationObserver((i) => {
        for (const l of i)
            if (l.type === 'childList')
                for (const o of l.addedNodes)
                    o.tagName === 'LINK' && o.rel === 'modulepreload' && r(o);
    }).observe(document, { childList: !0, subtree: !0 });
    function n(i) {
        const l = {};
        return (
            i.integrity && (l.integrity = i.integrity),
            i.referrerPolicy && (l.referrerPolicy = i.referrerPolicy),
            i.crossOrigin === 'use-credentials'
                ? (l.credentials = 'include')
                : i.crossOrigin === 'anonymous'
                  ? (l.credentials = 'omit')
                  : (l.credentials = 'same-origin'),
            l
        );
    }
    function r(i) {
        if (i.ep) return;
        i.ep = !0;
        const l = n(i);
        fetch(i.href, l);
    }
})();
function rf(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
}
var Fa = { exports: {} },
    Si = {},
    Ia = { exports: {} },
    I = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var dr = Symbol.for('react.element'),
    lf = Symbol.for('react.portal'),
    of = Symbol.for('react.fragment'),
    sf = Symbol.for('react.strict_mode'),
    af = Symbol.for('react.profiler'),
    uf = Symbol.for('react.provider'),
    cf = Symbol.for('react.context'),
    ff = Symbol.for('react.forward_ref'),
    df = Symbol.for('react.suspense'),
    pf = Symbol.for('react.memo'),
    hf = Symbol.for('react.lazy'),
    ls = Symbol.iterator;
function gf(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = (ls && e[ls]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var Da = {
        isMounted: function () {
            return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
    },
    Ma = Object.assign,
    $a = {};
function Sn(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = $a), (this.updater = n || Da));
}
Sn.prototype.isReactComponent = {};
Sn.prototype.setState = function (e, t) {
    if (typeof e != 'object' && typeof e != 'function' && e != null)
        throw Error(
            'setState(...): takes an object of state variables to update or a function which returns an object of state variables.',
        );
    this.updater.enqueueSetState(this, e, t, 'setState');
};
Sn.prototype.forceUpdate = function (e) {
    this.updater.enqueueForceUpdate(this, e, 'forceUpdate');
};
function Ua() {}
Ua.prototype = Sn.prototype;
function co(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = $a), (this.updater = n || Da));
}
var fo = (co.prototype = new Ua());
fo.constructor = co;
Ma(fo, Sn.prototype);
fo.isPureReactComponent = !0;
var os = Array.isArray,
    Aa = Object.prototype.hasOwnProperty,
    po = { current: null },
    Va = { key: !0, ref: !0, __self: !0, __source: !0 };
function Ha(e, t, n) {
    var r,
        i = {},
        l = null,
        o = null;
    if (t != null)
        for (r in (t.ref !== void 0 && (o = t.ref), t.key !== void 0 && (l = '' + t.key), t))
            Aa.call(t, r) && !Va.hasOwnProperty(r) && (i[r] = t[r]);
    var s = arguments.length - 2;
    if (s === 1) i.children = n;
    else if (1 < s) {
        for (var a = Array(s), u = 0; u < s; u++) a[u] = arguments[u + 2];
        i.children = a;
    }
    if (e && e.defaultProps) for (r in ((s = e.defaultProps), s)) i[r] === void 0 && (i[r] = s[r]);
    return { $$typeof: dr, type: e, key: l, ref: o, props: i, _owner: po.current };
}
function mf(e, t) {
    return { $$typeof: dr, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function ho(e) {
    return typeof e == 'object' && e !== null && e.$$typeof === dr;
}
function yf(e) {
    var t = { '=': '=0', ':': '=2' };
    return (
        '$' +
        e.replace(/[=:]/g, function (n) {
            return t[n];
        })
    );
}
var ss = /\/+/g;
function $i(e, t) {
    return typeof e == 'object' && e !== null && e.key != null ? yf('' + e.key) : t.toString(36);
}
function Dr(e, t, n, r, i) {
    var l = typeof e;
    (l === 'undefined' || l === 'boolean') && (e = null);
    var o = !1;
    if (e === null) o = !0;
    else
        switch (l) {
            case 'string':
            case 'number':
                o = !0;
                break;
            case 'object':
                switch (e.$$typeof) {
                    case dr:
                    case lf:
                        o = !0;
                }
        }
    if (o)
        return (
            (o = e),
            (i = i(o)),
            (e = r === '' ? '.' + $i(o, 0) : r),
            os(i)
                ? ((n = ''),
                  e != null && (n = e.replace(ss, '$&/') + '/'),
                  Dr(i, t, n, '', function (u) {
                      return u;
                  }))
                : i != null &&
                  (ho(i) &&
                      (i = mf(
                          i,
                          n +
                              (!i.key || (o && o.key === i.key)
                                  ? ''
                                  : ('' + i.key).replace(ss, '$&/') + '/') +
                              e,
                      )),
                  t.push(i)),
            1
        );
    if (((o = 0), (r = r === '' ? '.' : r + ':'), os(e)))
        for (var s = 0; s < e.length; s++) {
            l = e[s];
            var a = r + $i(l, s);
            o += Dr(l, t, n, a, i);
        }
    else if (((a = gf(e)), typeof a == 'function'))
        for (e = a.call(e), s = 0; !(l = e.next()).done; )
            ((l = l.value), (a = r + $i(l, s++)), (o += Dr(l, t, n, a, i)));
    else if (l === 'object')
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
function vr(e, t, n) {
    if (e == null) return e;
    var r = [],
        i = 0;
    return (
        Dr(e, r, '', '', function (l) {
            return t.call(n, l, i++);
        }),
        r
    );
}
function vf(e) {
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
var me = { current: null },
    Mr = { transition: null },
    wf = { ReactCurrentDispatcher: me, ReactCurrentBatchConfig: Mr, ReactCurrentOwner: po };
function Ba() {
    throw Error('act(...) is not supported in production builds of React.');
}
I.Children = {
    map: vr,
    forEach: function (e, t, n) {
        vr(
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
            vr(e, function () {
                t++;
            }),
            t
        );
    },
    toArray: function (e) {
        return (
            vr(e, function (t) {
                return t;
            }) || []
        );
    },
    only: function (e) {
        if (!ho(e))
            throw Error('React.Children.only expected to receive a single React element child.');
        return e;
    },
};
I.Component = Sn;
I.Fragment = of;
I.Profiler = af;
I.PureComponent = co;
I.StrictMode = sf;
I.Suspense = df;
I.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = wf;
I.act = Ba;
I.cloneElement = function (e, t, n) {
    if (e == null)
        throw Error(
            'React.cloneElement(...): The argument must be a React element, but you passed ' +
                e +
                '.',
        );
    var r = Ma({}, e.props),
        i = e.key,
        l = e.ref,
        o = e._owner;
    if (t != null) {
        if (
            (t.ref !== void 0 && ((l = t.ref), (o = po.current)),
            t.key !== void 0 && (i = '' + t.key),
            e.type && e.type.defaultProps)
        )
            var s = e.type.defaultProps;
        for (a in t)
            Aa.call(t, a) &&
                !Va.hasOwnProperty(a) &&
                (r[a] = t[a] === void 0 && s !== void 0 ? s[a] : t[a]);
    }
    var a = arguments.length - 2;
    if (a === 1) r.children = n;
    else if (1 < a) {
        s = Array(a);
        for (var u = 0; u < a; u++) s[u] = arguments[u + 2];
        r.children = s;
    }
    return { $$typeof: dr, type: e.type, key: i, ref: l, props: r, _owner: o };
};
I.createContext = function (e) {
    return (
        (e = {
            $$typeof: cf,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
            _defaultValue: null,
            _globalName: null,
        }),
        (e.Provider = { $$typeof: uf, _context: e }),
        (e.Consumer = e)
    );
};
I.createElement = Ha;
I.createFactory = function (e) {
    var t = Ha.bind(null, e);
    return ((t.type = e), t);
};
I.createRef = function () {
    return { current: null };
};
I.forwardRef = function (e) {
    return { $$typeof: ff, render: e };
};
I.isValidElement = ho;
I.lazy = function (e) {
    return { $$typeof: hf, _payload: { _status: -1, _result: e }, _init: vf };
};
I.memo = function (e, t) {
    return { $$typeof: pf, type: e, compare: t === void 0 ? null : t };
};
I.startTransition = function (e) {
    var t = Mr.transition;
    Mr.transition = {};
    try {
        e();
    } finally {
        Mr.transition = t;
    }
};
I.unstable_act = Ba;
I.useCallback = function (e, t) {
    return me.current.useCallback(e, t);
};
I.useContext = function (e) {
    return me.current.useContext(e);
};
I.useDebugValue = function () {};
I.useDeferredValue = function (e) {
    return me.current.useDeferredValue(e);
};
I.useEffect = function (e, t) {
    return me.current.useEffect(e, t);
};
I.useId = function () {
    return me.current.useId();
};
I.useImperativeHandle = function (e, t, n) {
    return me.current.useImperativeHandle(e, t, n);
};
I.useInsertionEffect = function (e, t) {
    return me.current.useInsertionEffect(e, t);
};
I.useLayoutEffect = function (e, t) {
    return me.current.useLayoutEffect(e, t);
};
I.useMemo = function (e, t) {
    return me.current.useMemo(e, t);
};
I.useReducer = function (e, t, n) {
    return me.current.useReducer(e, t, n);
};
I.useRef = function (e) {
    return me.current.useRef(e);
};
I.useState = function (e) {
    return me.current.useState(e);
};
I.useSyncExternalStore = function (e, t, n) {
    return me.current.useSyncExternalStore(e, t, n);
};
I.useTransition = function () {
    return me.current.useTransition();
};
I.version = '18.3.1';
Ia.exports = I;
var q = Ia.exports;
const xf = rf(q);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Sf = q,
    kf = Symbol.for('react.element'),
    Ef = Symbol.for('react.fragment'),
    Cf = Object.prototype.hasOwnProperty,
    Nf = Sf.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    Lf = { key: !0, ref: !0, __self: !0, __source: !0 };
function Ka(e, t, n) {
    var r,
        i = {},
        l = null,
        o = null;
    (n !== void 0 && (l = '' + n),
        t.key !== void 0 && (l = '' + t.key),
        t.ref !== void 0 && (o = t.ref));
    for (r in t) Cf.call(t, r) && !Lf.hasOwnProperty(r) && (i[r] = t[r]);
    if (e && e.defaultProps) for (r in ((t = e.defaultProps), t)) i[r] === void 0 && (i[r] = t[r]);
    return { $$typeof: kf, type: e, key: l, ref: o, props: i, _owner: Nf.current };
}
Si.Fragment = Ef;
Si.jsx = Ka;
Si.jsxs = Ka;
Fa.exports = Si;
var P = Fa.exports,
    pl = {},
    Wa = { exports: {} },
    Oe = {},
    Qa = { exports: {} },
    Ya = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
    function t(k, _) {
        var j = k.length;
        k.push(_);
        e: for (; 0 < j; ) {
            var D = (j - 1) >>> 1,
                V = k[D];
            if (0 < i(V, _)) ((k[D] = _), (k[j] = V), (j = D));
            else break e;
        }
    }
    function n(k) {
        return k.length === 0 ? null : k[0];
    }
    function r(k) {
        if (k.length === 0) return null;
        var _ = k[0],
            j = k.pop();
        if (j !== _) {
            k[0] = j;
            e: for (var D = 0, V = k.length, Be = V >>> 1; D < Be; ) {
                var Ke = 2 * (D + 1) - 1,
                    Bt = k[Ke],
                    Pt = Ke + 1,
                    yr = k[Pt];
                if (0 > i(Bt, j))
                    Pt < V && 0 > i(yr, Bt)
                        ? ((k[D] = yr), (k[Pt] = j), (D = Pt))
                        : ((k[D] = Bt), (k[Ke] = j), (D = Ke));
                else if (Pt < V && 0 > i(yr, j)) ((k[D] = yr), (k[Pt] = j), (D = Pt));
                else break e;
            }
        }
        return _;
    }
    function i(k, _) {
        var j = k.sortIndex - _.sortIndex;
        return j !== 0 ? j : k.id - _.id;
    }
    if (typeof performance == 'object' && typeof performance.now == 'function') {
        var l = performance;
        e.unstable_now = function () {
            return l.now();
        };
    } else {
        var o = Date,
            s = o.now();
        e.unstable_now = function () {
            return o.now() - s;
        };
    }
    var a = [],
        u = [],
        d = 1,
        f = null,
        g = 3,
        y = !1,
        m = !1,
        w = !1,
        T = typeof setTimeout == 'function' ? setTimeout : null,
        p = typeof clearTimeout == 'function' ? clearTimeout : null,
        c = typeof setImmediate < 'u' ? setImmediate : null;
    typeof navigator < 'u' &&
        navigator.scheduling !== void 0 &&
        navigator.scheduling.isInputPending !== void 0 &&
        navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function h(k) {
        for (var _ = n(u); _ !== null; ) {
            if (_.callback === null) r(u);
            else if (_.startTime <= k) (r(u), (_.sortIndex = _.expirationTime), t(a, _));
            else break;
            _ = n(u);
        }
    }
    function v(k) {
        if (((w = !1), h(k), !m))
            if (n(a) !== null) ((m = !0), ee(S));
            else {
                var _ = n(u);
                _ !== null && ue(v, _.startTime - k);
            }
    }
    function S(k, _) {
        ((m = !1), w && ((w = !1), p(L), (L = -1)), (y = !0));
        var j = g;
        try {
            for (h(_), f = n(a); f !== null && (!(f.expirationTime > _) || (k && !ae())); ) {
                var D = f.callback;
                if (typeof D == 'function') {
                    ((f.callback = null), (g = f.priorityLevel));
                    var V = D(f.expirationTime <= _);
                    ((_ = e.unstable_now()),
                        typeof V == 'function' ? (f.callback = V) : f === n(a) && r(a),
                        h(_));
                } else r(a);
                f = n(a);
            }
            if (f !== null) var Be = !0;
            else {
                var Ke = n(u);
                (Ke !== null && ue(v, Ke.startTime - _), (Be = !1));
            }
            return Be;
        } finally {
            ((f = null), (g = j), (y = !1));
        }
    }
    var C = !1,
        E = null,
        L = -1,
        z = 5,
        O = -1;
    function ae() {
        return !(e.unstable_now() - O < z);
    }
    function $() {
        if (E !== null) {
            var k = e.unstable_now();
            O = k;
            var _ = !0;
            try {
                _ = E(!0, k);
            } finally {
                _ ? F() : ((C = !1), (E = null));
            }
        } else C = !1;
    }
    var F;
    if (typeof c == 'function')
        F = function () {
            c($);
        };
    else if (typeof MessageChannel < 'u') {
        var M = new MessageChannel(),
            X = M.port2;
        ((M.port1.onmessage = $),
            (F = function () {
                X.postMessage(null);
            }));
    } else
        F = function () {
            T($, 0);
        };
    function ee(k) {
        ((E = k), C || ((C = !0), F()));
    }
    function ue(k, _) {
        L = T(function () {
            k(e.unstable_now());
        }, _);
    }
    ((e.unstable_IdlePriority = 5),
        (e.unstable_ImmediatePriority = 1),
        (e.unstable_LowPriority = 4),
        (e.unstable_NormalPriority = 3),
        (e.unstable_Profiling = null),
        (e.unstable_UserBlockingPriority = 2),
        (e.unstable_cancelCallback = function (k) {
            k.callback = null;
        }),
        (e.unstable_continueExecution = function () {
            m || y || ((m = !0), ee(S));
        }),
        (e.unstable_forceFrameRate = function (k) {
            0 > k || 125 < k
                ? console.error(
                      'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported',
                  )
                : (z = 0 < k ? Math.floor(1e3 / k) : 5);
        }),
        (e.unstable_getCurrentPriorityLevel = function () {
            return g;
        }),
        (e.unstable_getFirstCallbackNode = function () {
            return n(a);
        }),
        (e.unstable_next = function (k) {
            switch (g) {
                case 1:
                case 2:
                case 3:
                    var _ = 3;
                    break;
                default:
                    _ = g;
            }
            var j = g;
            g = _;
            try {
                return k();
            } finally {
                g = j;
            }
        }),
        (e.unstable_pauseExecution = function () {}),
        (e.unstable_requestPaint = function () {}),
        (e.unstable_runWithPriority = function (k, _) {
            switch (k) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    break;
                default:
                    k = 3;
            }
            var j = g;
            g = k;
            try {
                return _();
            } finally {
                g = j;
            }
        }),
        (e.unstable_scheduleCallback = function (k, _, j) {
            var D = e.unstable_now();
            switch (
                (typeof j == 'object' && j !== null
                    ? ((j = j.delay), (j = typeof j == 'number' && 0 < j ? D + j : D))
                    : (j = D),
                k)
            ) {
                case 1:
                    var V = -1;
                    break;
                case 2:
                    V = 250;
                    break;
                case 5:
                    V = 1073741823;
                    break;
                case 4:
                    V = 1e4;
                    break;
                default:
                    V = 5e3;
            }
            return (
                (V = j + V),
                (k = {
                    id: d++,
                    callback: _,
                    priorityLevel: k,
                    startTime: j,
                    expirationTime: V,
                    sortIndex: -1,
                }),
                j > D
                    ? ((k.sortIndex = j),
                      t(u, k),
                      n(a) === null &&
                          k === n(u) &&
                          (w ? (p(L), (L = -1)) : (w = !0), ue(v, j - D)))
                    : ((k.sortIndex = V), t(a, k), m || y || ((m = !0), ee(S))),
                k
            );
        }),
        (e.unstable_shouldYield = ae),
        (e.unstable_wrapCallback = function (k) {
            var _ = g;
            return function () {
                var j = g;
                g = _;
                try {
                    return k.apply(this, arguments);
                } finally {
                    g = j;
                }
            };
        }));
})(Ya);
Qa.exports = Ya;
var Pf = Qa.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Of = q,
    Pe = Pf;
function x(e) {
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
var Ga = new Set(),
    Gn = {};
function Vt(e, t) {
    (pn(e, t), pn(e + 'Capture', t));
}
function pn(e, t) {
    for (Gn[e] = t, e = 0; e < t.length; e++) Ga.add(t[e]);
}
var nt = !(
        typeof window > 'u' ||
        typeof window.document > 'u' ||
        typeof window.document.createElement > 'u'
    ),
    hl = Object.prototype.hasOwnProperty,
    _f =
        /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
    as = {},
    us = {};
function Rf(e) {
    return hl.call(us, e)
        ? !0
        : hl.call(as, e)
          ? !1
          : _f.test(e)
            ? (us[e] = !0)
            : ((as[e] = !0), !1);
}
function Tf(e, t, n, r) {
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
function jf(e, t, n, r) {
    if (t === null || typeof t > 'u' || Tf(e, t, n, r)) return !0;
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
function ye(e, t, n, r, i, l, o) {
    ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
        (this.attributeName = r),
        (this.attributeNamespace = i),
        (this.mustUseProperty = n),
        (this.propertyName = e),
        (this.type = t),
        (this.sanitizeURL = l),
        (this.removeEmptyString = o));
}
var se = {};
'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
    .split(' ')
    .forEach(function (e) {
        se[e] = new ye(e, 0, !1, e, null, !1, !1);
    });
[
    ['acceptCharset', 'accept-charset'],
    ['className', 'class'],
    ['htmlFor', 'for'],
    ['httpEquiv', 'http-equiv'],
].forEach(function (e) {
    var t = e[0];
    se[t] = new ye(t, 1, !1, e[1], null, !1, !1);
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
    se[e] = new ye(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (e) {
    se[e] = new ye(e, 2, !1, e, null, !1, !1);
});
'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
    .split(' ')
    .forEach(function (e) {
        se[e] = new ye(e, 3, !1, e.toLowerCase(), null, !1, !1);
    });
['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
    se[e] = new ye(e, 3, !0, e, null, !1, !1);
});
['capture', 'download'].forEach(function (e) {
    se[e] = new ye(e, 4, !1, e, null, !1, !1);
});
['cols', 'rows', 'size', 'span'].forEach(function (e) {
    se[e] = new ye(e, 6, !1, e, null, !1, !1);
});
['rowSpan', 'start'].forEach(function (e) {
    se[e] = new ye(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var go = /[\-:]([a-z])/g;
function mo(e) {
    return e[1].toUpperCase();
}
'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(go, mo);
        se[t] = new ye(t, 1, !1, e, null, !1, !1);
    });
'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(go, mo);
        se[t] = new ye(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
    });
['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
    var t = e.replace(go, mo);
    se[t] = new ye(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
});
['tabIndex', 'crossOrigin'].forEach(function (e) {
    se[e] = new ye(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
se.xlinkHref = new ye('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1);
['src', 'href', 'action', 'formAction'].forEach(function (e) {
    se[e] = new ye(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function yo(e, t, n, r) {
    var i = se.hasOwnProperty(t) ? se[t] : null;
    (i !== null
        ? i.type !== 0
        : r ||
          !(2 < t.length) ||
          (t[0] !== 'o' && t[0] !== 'O') ||
          (t[1] !== 'n' && t[1] !== 'N')) &&
        (jf(t, n, i, r) && (n = null),
        r || i === null
            ? Rf(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, '' + n))
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
var ot = Of.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    wr = Symbol.for('react.element'),
    Gt = Symbol.for('react.portal'),
    Xt = Symbol.for('react.fragment'),
    vo = Symbol.for('react.strict_mode'),
    gl = Symbol.for('react.profiler'),
    Xa = Symbol.for('react.provider'),
    Za = Symbol.for('react.context'),
    wo = Symbol.for('react.forward_ref'),
    ml = Symbol.for('react.suspense'),
    yl = Symbol.for('react.suspense_list'),
    xo = Symbol.for('react.memo'),
    at = Symbol.for('react.lazy'),
    Ja = Symbol.for('react.offscreen'),
    cs = Symbol.iterator;
function Cn(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = (cs && e[cs]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var G = Object.assign,
    Ui;
function zn(e) {
    if (Ui === void 0)
        try {
            throw Error();
        } catch (n) {
            var t = n.stack.trim().match(/\n( *(at )?)/);
            Ui = (t && t[1]) || '';
        }
    return (
        `
` +
        Ui +
        e
    );
}
var Ai = !1;
function Vi(e, t) {
    if (!e || Ai) return '';
    Ai = !0;
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
                    l = r.stack.split(`
`),
                    o = i.length - 1,
                    s = l.length - 1;
                1 <= o && 0 <= s && i[o] !== l[s];
            )
                s--;
            for (; 1 <= o && 0 <= s; o--, s--)
                if (i[o] !== l[s]) {
                    if (o !== 1 || s !== 1)
                        do
                            if ((o--, s--, 0 > s || i[o] !== l[s])) {
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
                        while (1 <= o && 0 <= s);
                    break;
                }
        }
    } finally {
        ((Ai = !1), (Error.prepareStackTrace = n));
    }
    return (e = e ? e.displayName || e.name : '') ? zn(e) : '';
}
function zf(e) {
    switch (e.tag) {
        case 5:
            return zn(e.type);
        case 16:
            return zn('Lazy');
        case 13:
            return zn('Suspense');
        case 19:
            return zn('SuspenseList');
        case 0:
        case 2:
        case 15:
            return ((e = Vi(e.type, !1)), e);
        case 11:
            return ((e = Vi(e.type.render, !1)), e);
        case 1:
            return ((e = Vi(e.type, !0)), e);
        default:
            return '';
    }
}
function vl(e) {
    if (e == null) return null;
    if (typeof e == 'function') return e.displayName || e.name || null;
    if (typeof e == 'string') return e;
    switch (e) {
        case Xt:
            return 'Fragment';
        case Gt:
            return 'Portal';
        case gl:
            return 'Profiler';
        case vo:
            return 'StrictMode';
        case ml:
            return 'Suspense';
        case yl:
            return 'SuspenseList';
    }
    if (typeof e == 'object')
        switch (e.$$typeof) {
            case Za:
                return (e.displayName || 'Context') + '.Consumer';
            case Xa:
                return (e._context.displayName || 'Context') + '.Provider';
            case wo:
                var t = e.render;
                return (
                    (e = e.displayName),
                    e ||
                        ((e = t.displayName || t.name || ''),
                        (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
                    e
                );
            case xo:
                return ((t = e.displayName || null), t !== null ? t : vl(e.type) || 'Memo');
            case at:
                ((t = e._payload), (e = e._init));
                try {
                    return vl(e(t));
                } catch {}
        }
    return null;
}
function Ff(e) {
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
            return vl(t);
        case 8:
            return t === vo ? 'StrictMode' : 'Mode';
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
function kt(e) {
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
function qa(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio');
}
function If(e) {
    var t = qa(e) ? 'checked' : 'value',
        n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
        r = '' + e[t];
    if (
        !e.hasOwnProperty(t) &&
        typeof n < 'u' &&
        typeof n.get == 'function' &&
        typeof n.set == 'function'
    ) {
        var i = n.get,
            l = n.set;
        return (
            Object.defineProperty(e, t, {
                configurable: !0,
                get: function () {
                    return i.call(this);
                },
                set: function (o) {
                    ((r = '' + o), l.call(this, o));
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
function xr(e) {
    e._valueTracker || (e._valueTracker = If(e));
}
function ba(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var n = t.getValue(),
        r = '';
    return (
        e && (r = qa(e) ? (e.checked ? 'true' : 'false') : e.value),
        (e = r),
        e !== n ? (t.setValue(e), !0) : !1
    );
}
function Gr(e) {
    if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
    try {
        return e.activeElement || e.body;
    } catch {
        return e.body;
    }
}
function wl(e, t) {
    var n = t.checked;
    return G({}, t, {
        defaultChecked: void 0,
        defaultValue: void 0,
        value: void 0,
        checked: n ?? e._wrapperState.initialChecked,
    });
}
function fs(e, t) {
    var n = t.defaultValue == null ? '' : t.defaultValue,
        r = t.checked != null ? t.checked : t.defaultChecked;
    ((n = kt(t.value != null ? t.value : n)),
        (e._wrapperState = {
            initialChecked: r,
            initialValue: n,
            controlled:
                t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
        }));
}
function eu(e, t) {
    ((t = t.checked), t != null && yo(e, 'checked', t, !1));
}
function xl(e, t) {
    eu(e, t);
    var n = kt(t.value),
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
        ? Sl(e, t.type, n)
        : t.hasOwnProperty('defaultValue') && Sl(e, t.type, kt(t.defaultValue)),
        t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked));
}
function ds(e, t, n) {
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
function Sl(e, t, n) {
    (t !== 'number' || Gr(e.ownerDocument) !== e) &&
        (n == null
            ? (e.defaultValue = '' + e._wrapperState.initialValue)
            : e.defaultValue !== '' + n && (e.defaultValue = '' + n));
}
var Fn = Array.isArray;
function sn(e, t, n, r) {
    if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t['$' + n[i]] = !0;
        for (n = 0; n < e.length; n++)
            ((i = t.hasOwnProperty('$' + e[n].value)),
                e[n].selected !== i && (e[n].selected = i),
                i && r && (e[n].defaultSelected = !0));
    } else {
        for (n = '' + kt(n), t = null, i = 0; i < e.length; i++) {
            if (e[i].value === n) {
                ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
                return;
            }
            t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
    }
}
function kl(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(x(91));
    return G({}, t, {
        value: void 0,
        defaultValue: void 0,
        children: '' + e._wrapperState.initialValue,
    });
}
function ps(e, t) {
    var n = t.value;
    if (n == null) {
        if (((n = t.children), (t = t.defaultValue), n != null)) {
            if (t != null) throw Error(x(92));
            if (Fn(n)) {
                if (1 < n.length) throw Error(x(93));
                n = n[0];
            }
            t = n;
        }
        (t == null && (t = ''), (n = t));
    }
    e._wrapperState = { initialValue: kt(n) };
}
function tu(e, t) {
    var n = kt(t.value),
        r = kt(t.defaultValue);
    (n != null &&
        ((n = '' + n),
        n !== e.value && (e.value = n),
        t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
        r != null && (e.defaultValue = '' + r));
}
function hs(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
}
function nu(e) {
    switch (e) {
        case 'svg':
            return 'http://www.w3.org/2000/svg';
        case 'math':
            return 'http://www.w3.org/1998/Math/MathML';
        default:
            return 'http://www.w3.org/1999/xhtml';
    }
}
function El(e, t) {
    return e == null || e === 'http://www.w3.org/1999/xhtml'
        ? nu(t)
        : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
          ? 'http://www.w3.org/1999/xhtml'
          : e;
}
var Sr,
    ru = (function (e) {
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
                Sr = Sr || document.createElement('div'),
                    Sr.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>',
                    t = Sr.firstChild;
                e.firstChild;
            )
                e.removeChild(e.firstChild);
            for (; t.firstChild; ) e.appendChild(t.firstChild);
        }
    });
function Xn(e, t) {
    if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
            n.nodeValue = t;
            return;
        }
    }
    e.textContent = t;
}
var Mn = {
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
    Df = ['Webkit', 'ms', 'Moz', 'O'];
Object.keys(Mn).forEach(function (e) {
    Df.forEach(function (t) {
        ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Mn[t] = Mn[e]));
    });
});
function iu(e, t, n) {
    return t == null || typeof t == 'boolean' || t === ''
        ? ''
        : n || typeof t != 'number' || t === 0 || (Mn.hasOwnProperty(e) && Mn[e])
          ? ('' + t).trim()
          : t + 'px';
}
function lu(e, t) {
    e = e.style;
    for (var n in t)
        if (t.hasOwnProperty(n)) {
            var r = n.indexOf('--') === 0,
                i = iu(n, t[n], r);
            (n === 'float' && (n = 'cssFloat'), r ? e.setProperty(n, i) : (e[n] = i));
        }
}
var Mf = G(
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
function Cl(e, t) {
    if (t) {
        if (Mf[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
            throw Error(x(137, e));
        if (t.dangerouslySetInnerHTML != null) {
            if (t.children != null) throw Error(x(60));
            if (
                typeof t.dangerouslySetInnerHTML != 'object' ||
                !('__html' in t.dangerouslySetInnerHTML)
            )
                throw Error(x(61));
        }
        if (t.style != null && typeof t.style != 'object') throw Error(x(62));
    }
}
function Nl(e, t) {
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
var Ll = null;
function So(e) {
    return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    );
}
var Pl = null,
    an = null,
    un = null;
function gs(e) {
    if ((e = gr(e))) {
        if (typeof Pl != 'function') throw Error(x(280));
        var t = e.stateNode;
        t && ((t = Li(t)), Pl(e.stateNode, e.type, t));
    }
}
function ou(e) {
    an ? (un ? un.push(e) : (un = [e])) : (an = e);
}
function su() {
    if (an) {
        var e = an,
            t = un;
        if (((un = an = null), gs(e), t)) for (e = 0; e < t.length; e++) gs(t[e]);
    }
}
function au(e, t) {
    return e(t);
}
function uu() {}
var Hi = !1;
function cu(e, t, n) {
    if (Hi) return e(t, n);
    Hi = !0;
    try {
        return au(e, t, n);
    } finally {
        ((Hi = !1), (an !== null || un !== null) && (uu(), su()));
    }
}
function Zn(e, t) {
    var n = e.stateNode;
    if (n === null) return null;
    var r = Li(n);
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
    if (n && typeof n != 'function') throw Error(x(231, t, typeof n));
    return n;
}
var Ol = !1;
if (nt)
    try {
        var Nn = {};
        (Object.defineProperty(Nn, 'passive', {
            get: function () {
                Ol = !0;
            },
        }),
            window.addEventListener('test', Nn, Nn),
            window.removeEventListener('test', Nn, Nn));
    } catch {
        Ol = !1;
    }
function $f(e, t, n, r, i, l, o, s, a) {
    var u = Array.prototype.slice.call(arguments, 3);
    try {
        t.apply(n, u);
    } catch (d) {
        this.onError(d);
    }
}
var $n = !1,
    Xr = null,
    Zr = !1,
    _l = null,
    Uf = {
        onError: function (e) {
            (($n = !0), (Xr = e));
        },
    };
function Af(e, t, n, r, i, l, o, s, a) {
    (($n = !1), (Xr = null), $f.apply(Uf, arguments));
}
function Vf(e, t, n, r, i, l, o, s, a) {
    if ((Af.apply(this, arguments), $n)) {
        if ($n) {
            var u = Xr;
            (($n = !1), (Xr = null));
        } else throw Error(x(198));
        Zr || ((Zr = !0), (_l = u));
    }
}
function Ht(e) {
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
function fu(e) {
    if (e.tag === 13) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
            return t.dehydrated;
    }
    return null;
}
function ms(e) {
    if (Ht(e) !== e) throw Error(x(188));
}
function Hf(e) {
    var t = e.alternate;
    if (!t) {
        if (((t = Ht(e)), t === null)) throw Error(x(188));
        return t !== e ? null : e;
    }
    for (var n = e, r = t; ; ) {
        var i = n.return;
        if (i === null) break;
        var l = i.alternate;
        if (l === null) {
            if (((r = i.return), r !== null)) {
                n = r;
                continue;
            }
            break;
        }
        if (i.child === l.child) {
            for (l = i.child; l; ) {
                if (l === n) return (ms(i), e);
                if (l === r) return (ms(i), t);
                l = l.sibling;
            }
            throw Error(x(188));
        }
        if (n.return !== r.return) ((n = i), (r = l));
        else {
            for (var o = !1, s = i.child; s; ) {
                if (s === n) {
                    ((o = !0), (n = i), (r = l));
                    break;
                }
                if (s === r) {
                    ((o = !0), (r = i), (n = l));
                    break;
                }
                s = s.sibling;
            }
            if (!o) {
                for (s = l.child; s; ) {
                    if (s === n) {
                        ((o = !0), (n = l), (r = i));
                        break;
                    }
                    if (s === r) {
                        ((o = !0), (r = l), (n = i));
                        break;
                    }
                    s = s.sibling;
                }
                if (!o) throw Error(x(189));
            }
        }
        if (n.alternate !== r) throw Error(x(190));
    }
    if (n.tag !== 3) throw Error(x(188));
    return n.stateNode.current === n ? e : t;
}
function du(e) {
    return ((e = Hf(e)), e !== null ? pu(e) : null);
}
function pu(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
        var t = pu(e);
        if (t !== null) return t;
        e = e.sibling;
    }
    return null;
}
var hu = Pe.unstable_scheduleCallback,
    ys = Pe.unstable_cancelCallback,
    Bf = Pe.unstable_shouldYield,
    Kf = Pe.unstable_requestPaint,
    J = Pe.unstable_now,
    Wf = Pe.unstable_getCurrentPriorityLevel,
    ko = Pe.unstable_ImmediatePriority,
    gu = Pe.unstable_UserBlockingPriority,
    Jr = Pe.unstable_NormalPriority,
    Qf = Pe.unstable_LowPriority,
    mu = Pe.unstable_IdlePriority,
    ki = null,
    Xe = null;
function Yf(e) {
    if (Xe && typeof Xe.onCommitFiberRoot == 'function')
        try {
            Xe.onCommitFiberRoot(ki, e, void 0, (e.current.flags & 128) === 128);
        } catch {}
}
var Ae = Math.clz32 ? Math.clz32 : Zf,
    Gf = Math.log,
    Xf = Math.LN2;
function Zf(e) {
    return ((e >>>= 0), e === 0 ? 32 : (31 - ((Gf(e) / Xf) | 0)) | 0);
}
var kr = 64,
    Er = 4194304;
function In(e) {
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
function qr(e, t) {
    var n = e.pendingLanes;
    if (n === 0) return 0;
    var r = 0,
        i = e.suspendedLanes,
        l = e.pingedLanes,
        o = n & 268435455;
    if (o !== 0) {
        var s = o & ~i;
        s !== 0 ? (r = In(s)) : ((l &= o), l !== 0 && (r = In(l)));
    } else ((o = n & ~i), o !== 0 ? (r = In(o)) : l !== 0 && (r = In(l)));
    if (r === 0) return 0;
    if (
        t !== 0 &&
        t !== r &&
        !(t & i) &&
        ((i = r & -r), (l = t & -t), i >= l || (i === 16 && (l & 4194240) !== 0))
    )
        return t;
    if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
        for (e = e.entanglements, t &= r; 0 < t; )
            ((n = 31 - Ae(t)), (i = 1 << n), (r |= e[n]), (t &= ~i));
    return r;
}
function Jf(e, t) {
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
function qf(e, t) {
    for (
        var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, l = e.pendingLanes;
        0 < l;
    ) {
        var o = 31 - Ae(l),
            s = 1 << o,
            a = i[o];
        (a === -1 ? (!(s & n) || s & r) && (i[o] = Jf(s, t)) : a <= t && (e.expiredLanes |= s),
            (l &= ~s));
    }
}
function Rl(e) {
    return ((e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0);
}
function yu() {
    var e = kr;
    return ((kr <<= 1), !(kr & 4194240) && (kr = 64), e);
}
function Bi(e) {
    for (var t = [], n = 0; 31 > n; n++) t.push(e);
    return t;
}
function pr(e, t, n) {
    ((e.pendingLanes |= t),
        t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
        (e = e.eventTimes),
        (t = 31 - Ae(t)),
        (e[t] = n));
}
function bf(e, t) {
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
        var i = 31 - Ae(n),
            l = 1 << i;
        ((t[i] = 0), (r[i] = -1), (e[i] = -1), (n &= ~l));
    }
}
function Eo(e, t) {
    var n = (e.entangledLanes |= t);
    for (e = e.entanglements; n; ) {
        var r = 31 - Ae(n),
            i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
    }
}
var A = 0;
function vu(e) {
    return ((e &= -e), 1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1);
}
var wu,
    Co,
    xu,
    Su,
    ku,
    Tl = !1,
    Cr = [],
    ht = null,
    gt = null,
    mt = null,
    Jn = new Map(),
    qn = new Map(),
    ct = [],
    ed =
        'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
            ' ',
        );
function vs(e, t) {
    switch (e) {
        case 'focusin':
        case 'focusout':
            ht = null;
            break;
        case 'dragenter':
        case 'dragleave':
            gt = null;
            break;
        case 'mouseover':
        case 'mouseout':
            mt = null;
            break;
        case 'pointerover':
        case 'pointerout':
            Jn.delete(t.pointerId);
            break;
        case 'gotpointercapture':
        case 'lostpointercapture':
            qn.delete(t.pointerId);
    }
}
function Ln(e, t, n, r, i, l) {
    return e === null || e.nativeEvent !== l
        ? ((e = {
              blockedOn: t,
              domEventName: n,
              eventSystemFlags: r,
              nativeEvent: l,
              targetContainers: [i],
          }),
          t !== null && ((t = gr(t)), t !== null && Co(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
}
function td(e, t, n, r, i) {
    switch (t) {
        case 'focusin':
            return ((ht = Ln(ht, e, t, n, r, i)), !0);
        case 'dragenter':
            return ((gt = Ln(gt, e, t, n, r, i)), !0);
        case 'mouseover':
            return ((mt = Ln(mt, e, t, n, r, i)), !0);
        case 'pointerover':
            var l = i.pointerId;
            return (Jn.set(l, Ln(Jn.get(l) || null, e, t, n, r, i)), !0);
        case 'gotpointercapture':
            return ((l = i.pointerId), qn.set(l, Ln(qn.get(l) || null, e, t, n, r, i)), !0);
    }
    return !1;
}
function Eu(e) {
    var t = Rt(e.target);
    if (t !== null) {
        var n = Ht(t);
        if (n !== null) {
            if (((t = n.tag), t === 13)) {
                if (((t = fu(n)), t !== null)) {
                    ((e.blockedOn = t),
                        ku(e.priority, function () {
                            xu(n);
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
function $r(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
        var n = jl(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
        if (n === null) {
            n = e.nativeEvent;
            var r = new n.constructor(n.type, n);
            ((Ll = r), n.target.dispatchEvent(r), (Ll = null));
        } else return ((t = gr(n)), t !== null && Co(t), (e.blockedOn = n), !1);
        t.shift();
    }
    return !0;
}
function ws(e, t, n) {
    $r(e) && n.delete(t);
}
function nd() {
    ((Tl = !1),
        ht !== null && $r(ht) && (ht = null),
        gt !== null && $r(gt) && (gt = null),
        mt !== null && $r(mt) && (mt = null),
        Jn.forEach(ws),
        qn.forEach(ws));
}
function Pn(e, t) {
    e.blockedOn === t &&
        ((e.blockedOn = null),
        Tl || ((Tl = !0), Pe.unstable_scheduleCallback(Pe.unstable_NormalPriority, nd)));
}
function bn(e) {
    function t(i) {
        return Pn(i, e);
    }
    if (0 < Cr.length) {
        Pn(Cr[0], e);
        for (var n = 1; n < Cr.length; n++) {
            var r = Cr[n];
            r.blockedOn === e && (r.blockedOn = null);
        }
    }
    for (
        ht !== null && Pn(ht, e),
            gt !== null && Pn(gt, e),
            mt !== null && Pn(mt, e),
            Jn.forEach(t),
            qn.forEach(t),
            n = 0;
        n < ct.length;
        n++
    )
        ((r = ct[n]), r.blockedOn === e && (r.blockedOn = null));
    for (; 0 < ct.length && ((n = ct[0]), n.blockedOn === null); )
        (Eu(n), n.blockedOn === null && ct.shift());
}
var cn = ot.ReactCurrentBatchConfig,
    br = !0;
function rd(e, t, n, r) {
    var i = A,
        l = cn.transition;
    cn.transition = null;
    try {
        ((A = 1), No(e, t, n, r));
    } finally {
        ((A = i), (cn.transition = l));
    }
}
function id(e, t, n, r) {
    var i = A,
        l = cn.transition;
    cn.transition = null;
    try {
        ((A = 4), No(e, t, n, r));
    } finally {
        ((A = i), (cn.transition = l));
    }
}
function No(e, t, n, r) {
    if (br) {
        var i = jl(e, t, n, r);
        if (i === null) (bi(e, t, r, ei, n), vs(e, r));
        else if (td(i, e, t, n, r)) r.stopPropagation();
        else if ((vs(e, r), t & 4 && -1 < ed.indexOf(e))) {
            for (; i !== null; ) {
                var l = gr(i);
                if (
                    (l !== null && wu(l),
                    (l = jl(e, t, n, r)),
                    l === null && bi(e, t, r, ei, n),
                    l === i)
                )
                    break;
                i = l;
            }
            i !== null && r.stopPropagation();
        } else bi(e, t, r, null, n);
    }
}
var ei = null;
function jl(e, t, n, r) {
    if (((ei = null), (e = So(r)), (e = Rt(e)), e !== null))
        if (((t = Ht(e)), t === null)) e = null;
        else if (((n = t.tag), n === 13)) {
            if (((e = fu(t)), e !== null)) return e;
            e = null;
        } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
                return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
        } else t !== e && (e = null);
    return ((ei = e), null);
}
function Cu(e) {
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
            switch (Wf()) {
                case ko:
                    return 1;
                case gu:
                    return 4;
                case Jr:
                case Qf:
                    return 16;
                case mu:
                    return 536870912;
                default:
                    return 16;
            }
        default:
            return 16;
    }
}
var dt = null,
    Lo = null,
    Ur = null;
function Nu() {
    if (Ur) return Ur;
    var e,
        t = Lo,
        n = t.length,
        r,
        i = 'value' in dt ? dt.value : dt.textContent,
        l = i.length;
    for (e = 0; e < n && t[e] === i[e]; e++);
    var o = n - e;
    for (r = 1; r <= o && t[n - r] === i[l - r]; r++);
    return (Ur = i.slice(e, 1 < r ? 1 - r : void 0));
}
function Ar(e) {
    var t = e.keyCode;
    return (
        'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
    );
}
function Nr() {
    return !0;
}
function xs() {
    return !1;
}
function _e(e) {
    function t(n, r, i, l, o) {
        ((this._reactName = n),
            (this._targetInst = i),
            (this.type = r),
            (this.nativeEvent = l),
            (this.target = o),
            (this.currentTarget = null));
        for (var s in e) e.hasOwnProperty(s) && ((n = e[s]), (this[s] = n ? n(l) : l[s]));
        return (
            (this.isDefaultPrevented = (
                l.defaultPrevented != null ? l.defaultPrevented : l.returnValue === !1
            )
                ? Nr
                : xs),
            (this.isPropagationStopped = xs),
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
                    (this.isDefaultPrevented = Nr));
            },
            stopPropagation: function () {
                var n = this.nativeEvent;
                n &&
                    (n.stopPropagation
                        ? n.stopPropagation()
                        : typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
                    (this.isPropagationStopped = Nr));
            },
            persist: function () {},
            isPersistent: Nr,
        }),
        t
    );
}
var kn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
            return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
    },
    Po = _e(kn),
    hr = G({}, kn, { view: 0, detail: 0 }),
    ld = _e(hr),
    Ki,
    Wi,
    On,
    Ei = G({}, hr, {
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
        getModifierState: Oo,
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
                : (e !== On &&
                      (On && e.type === 'mousemove'
                          ? ((Ki = e.screenX - On.screenX), (Wi = e.screenY - On.screenY))
                          : (Wi = Ki = 0),
                      (On = e)),
                  Ki);
        },
        movementY: function (e) {
            return 'movementY' in e ? e.movementY : Wi;
        },
    }),
    Ss = _e(Ei),
    od = G({}, Ei, { dataTransfer: 0 }),
    sd = _e(od),
    ad = G({}, hr, { relatedTarget: 0 }),
    Qi = _e(ad),
    ud = G({}, kn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    cd = _e(ud),
    fd = G({}, kn, {
        clipboardData: function (e) {
            return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
        },
    }),
    dd = _e(fd),
    pd = G({}, kn, { data: 0 }),
    ks = _e(pd),
    hd = {
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
    gd = {
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
    md = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
function yd(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = md[e]) ? !!t[e] : !1;
}
function Oo() {
    return yd;
}
var vd = G({}, hr, {
        key: function (e) {
            if (e.key) {
                var t = hd[e.key] || e.key;
                if (t !== 'Unidentified') return t;
            }
            return e.type === 'keypress'
                ? ((e = Ar(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
                : e.type === 'keydown' || e.type === 'keyup'
                  ? gd[e.keyCode] || 'Unidentified'
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
        getModifierState: Oo,
        charCode: function (e) {
            return e.type === 'keypress' ? Ar(e) : 0;
        },
        keyCode: function (e) {
            return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
        },
        which: function (e) {
            return e.type === 'keypress'
                ? Ar(e)
                : e.type === 'keydown' || e.type === 'keyup'
                  ? e.keyCode
                  : 0;
        },
    }),
    wd = _e(vd),
    xd = G({}, Ei, {
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
    Es = _e(xd),
    Sd = G({}, hr, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: Oo,
    }),
    kd = _e(Sd),
    Ed = G({}, kn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Cd = _e(Ed),
    Nd = G({}, Ei, {
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
    Ld = _e(Nd),
    Pd = [9, 13, 27, 32],
    _o = nt && 'CompositionEvent' in window,
    Un = null;
nt && 'documentMode' in document && (Un = document.documentMode);
var Od = nt && 'TextEvent' in window && !Un,
    Lu = nt && (!_o || (Un && 8 < Un && 11 >= Un)),
    Cs = ' ',
    Ns = !1;
function Pu(e, t) {
    switch (e) {
        case 'keyup':
            return Pd.indexOf(t.keyCode) !== -1;
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
function Ou(e) {
    return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null);
}
var Zt = !1;
function _d(e, t) {
    switch (e) {
        case 'compositionend':
            return Ou(t);
        case 'keypress':
            return t.which !== 32 ? null : ((Ns = !0), Cs);
        case 'textInput':
            return ((e = t.data), e === Cs && Ns ? null : e);
        default:
            return null;
    }
}
function Rd(e, t) {
    if (Zt)
        return e === 'compositionend' || (!_o && Pu(e, t))
            ? ((e = Nu()), (Ur = Lo = dt = null), (Zt = !1), e)
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
            return Lu && t.locale !== 'ko' ? null : t.data;
        default:
            return null;
    }
}
var Td = {
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
function Ls(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === 'input' ? !!Td[e.type] : t === 'textarea';
}
function _u(e, t, n, r) {
    (ou(r),
        (t = ti(t, 'onChange')),
        0 < t.length &&
            ((n = new Po('onChange', 'change', null, n, r)), e.push({ event: n, listeners: t })));
}
var An = null,
    er = null;
function jd(e) {
    Au(e, 0);
}
function Ci(e) {
    var t = bt(e);
    if (ba(t)) return e;
}
function zd(e, t) {
    if (e === 'change') return t;
}
var Ru = !1;
if (nt) {
    var Yi;
    if (nt) {
        var Gi = 'oninput' in document;
        if (!Gi) {
            var Ps = document.createElement('div');
            (Ps.setAttribute('oninput', 'return;'), (Gi = typeof Ps.oninput == 'function'));
        }
        Yi = Gi;
    } else Yi = !1;
    Ru = Yi && (!document.documentMode || 9 < document.documentMode);
}
function Os() {
    An && (An.detachEvent('onpropertychange', Tu), (er = An = null));
}
function Tu(e) {
    if (e.propertyName === 'value' && Ci(er)) {
        var t = [];
        (_u(t, er, e, So(e)), cu(jd, t));
    }
}
function Fd(e, t, n) {
    e === 'focusin'
        ? (Os(), (An = t), (er = n), An.attachEvent('onpropertychange', Tu))
        : e === 'focusout' && Os();
}
function Id(e) {
    if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return Ci(er);
}
function Dd(e, t) {
    if (e === 'click') return Ci(t);
}
function Md(e, t) {
    if (e === 'input' || e === 'change') return Ci(t);
}
function $d(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var He = typeof Object.is == 'function' ? Object.is : $d;
function tr(e, t) {
    if (He(e, t)) return !0;
    if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
    var n = Object.keys(e),
        r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!hl.call(t, i) || !He(e[i], t[i])) return !1;
    }
    return !0;
}
function _s(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
}
function Rs(e, t) {
    var n = _s(e);
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
        n = _s(n);
    }
}
function ju(e, t) {
    return e && t
        ? e === t
            ? !0
            : e && e.nodeType === 3
              ? !1
              : t && t.nodeType === 3
                ? ju(e, t.parentNode)
                : 'contains' in e
                  ? e.contains(t)
                  : e.compareDocumentPosition
                    ? !!(e.compareDocumentPosition(t) & 16)
                    : !1
        : !1;
}
function zu() {
    for (var e = window, t = Gr(); t instanceof e.HTMLIFrameElement; ) {
        try {
            var n = typeof t.contentWindow.location.href == 'string';
        } catch {
            n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = Gr(e.document);
    }
    return t;
}
function Ro(e) {
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
function Ud(e) {
    var t = zu(),
        n = e.focusedElem,
        r = e.selectionRange;
    if (t !== n && n && n.ownerDocument && ju(n.ownerDocument.documentElement, n)) {
        if (r !== null && Ro(n)) {
            if (((t = r.start), (e = r.end), e === void 0 && (e = t), 'selectionStart' in n))
                ((n.selectionStart = t), (n.selectionEnd = Math.min(e, n.value.length)));
            else if (
                ((e = ((t = n.ownerDocument || document) && t.defaultView) || window),
                e.getSelection)
            ) {
                e = e.getSelection();
                var i = n.textContent.length,
                    l = Math.min(r.start, i);
                ((r = r.end === void 0 ? l : Math.min(r.end, i)),
                    !e.extend && l > r && ((i = r), (r = l), (l = i)),
                    (i = Rs(n, l)));
                var o = Rs(n, r);
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
                    l > r
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
var Ad = nt && 'documentMode' in document && 11 >= document.documentMode,
    Jt = null,
    zl = null,
    Vn = null,
    Fl = !1;
function Ts(e, t, n) {
    var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    Fl ||
        Jt == null ||
        Jt !== Gr(r) ||
        ((r = Jt),
        'selectionStart' in r && Ro(r)
            ? (r = { start: r.selectionStart, end: r.selectionEnd })
            : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
              (r = {
                  anchorNode: r.anchorNode,
                  anchorOffset: r.anchorOffset,
                  focusNode: r.focusNode,
                  focusOffset: r.focusOffset,
              })),
        (Vn && tr(Vn, r)) ||
            ((Vn = r),
            (r = ti(zl, 'onSelect')),
            0 < r.length &&
                ((t = new Po('onSelect', 'select', null, t, n)),
                e.push({ event: t, listeners: r }),
                (t.target = Jt))));
}
function Lr(e, t) {
    var n = {};
    return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n['Webkit' + e] = 'webkit' + t),
        (n['Moz' + e] = 'moz' + t),
        n
    );
}
var qt = {
        animationend: Lr('Animation', 'AnimationEnd'),
        animationiteration: Lr('Animation', 'AnimationIteration'),
        animationstart: Lr('Animation', 'AnimationStart'),
        transitionend: Lr('Transition', 'TransitionEnd'),
    },
    Xi = {},
    Fu = {};
nt &&
    ((Fu = document.createElement('div').style),
    'AnimationEvent' in window ||
        (delete qt.animationend.animation,
        delete qt.animationiteration.animation,
        delete qt.animationstart.animation),
    'TransitionEvent' in window || delete qt.transitionend.transition);
function Ni(e) {
    if (Xi[e]) return Xi[e];
    if (!qt[e]) return e;
    var t = qt[e],
        n;
    for (n in t) if (t.hasOwnProperty(n) && n in Fu) return (Xi[e] = t[n]);
    return e;
}
var Iu = Ni('animationend'),
    Du = Ni('animationiteration'),
    Mu = Ni('animationstart'),
    $u = Ni('transitionend'),
    Uu = new Map(),
    js =
        'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
            ' ',
        );
function Ct(e, t) {
    (Uu.set(e, t), Vt(t, [e]));
}
for (var Zi = 0; Zi < js.length; Zi++) {
    var Ji = js[Zi],
        Vd = Ji.toLowerCase(),
        Hd = Ji[0].toUpperCase() + Ji.slice(1);
    Ct(Vd, 'on' + Hd);
}
Ct(Iu, 'onAnimationEnd');
Ct(Du, 'onAnimationIteration');
Ct(Mu, 'onAnimationStart');
Ct('dblclick', 'onDoubleClick');
Ct('focusin', 'onFocus');
Ct('focusout', 'onBlur');
Ct($u, 'onTransitionEnd');
pn('onMouseEnter', ['mouseout', 'mouseover']);
pn('onMouseLeave', ['mouseout', 'mouseover']);
pn('onPointerEnter', ['pointerout', 'pointerover']);
pn('onPointerLeave', ['pointerout', 'pointerover']);
Vt('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '));
Vt(
    'onSelect',
    'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(
        ' ',
    ),
);
Vt('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']);
Vt('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '));
Vt('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '));
Vt('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '));
var Dn =
        'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
            ' ',
        ),
    Bd = new Set('cancel close invalid load scroll toggle'.split(' ').concat(Dn));
function zs(e, t, n) {
    var r = e.type || 'unknown-event';
    ((e.currentTarget = n), Vf(r, t, void 0, e), (e.currentTarget = null));
}
function Au(e, t) {
    t = (t & 4) !== 0;
    for (var n = 0; n < e.length; n++) {
        var r = e[n],
            i = r.event;
        r = r.listeners;
        e: {
            var l = void 0;
            if (t)
                for (var o = r.length - 1; 0 <= o; o--) {
                    var s = r[o],
                        a = s.instance,
                        u = s.currentTarget;
                    if (((s = s.listener), a !== l && i.isPropagationStopped())) break e;
                    (zs(i, s, u), (l = a));
                }
            else
                for (o = 0; o < r.length; o++) {
                    if (
                        ((s = r[o]),
                        (a = s.instance),
                        (u = s.currentTarget),
                        (s = s.listener),
                        a !== l && i.isPropagationStopped())
                    )
                        break e;
                    (zs(i, s, u), (l = a));
                }
        }
    }
    if (Zr) throw ((e = _l), (Zr = !1), (_l = null), e);
}
function B(e, t) {
    var n = t[Ul];
    n === void 0 && (n = t[Ul] = new Set());
    var r = e + '__bubble';
    n.has(r) || (Vu(t, e, 2, !1), n.add(r));
}
function qi(e, t, n) {
    var r = 0;
    (t && (r |= 4), Vu(n, e, r, t));
}
var Pr = '_reactListening' + Math.random().toString(36).slice(2);
function nr(e) {
    if (!e[Pr]) {
        ((e[Pr] = !0),
            Ga.forEach(function (n) {
                n !== 'selectionchange' && (Bd.has(n) || qi(n, !1, e), qi(n, !0, e));
            }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[Pr] || ((t[Pr] = !0), qi('selectionchange', !1, t));
    }
}
function Vu(e, t, n, r) {
    switch (Cu(t)) {
        case 1:
            var i = rd;
            break;
        case 4:
            i = id;
            break;
        default:
            i = No;
    }
    ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !Ol || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (i = !0),
        r
            ? i !== void 0
                ? e.addEventListener(t, n, { capture: !0, passive: i })
                : e.addEventListener(t, n, !0)
            : i !== void 0
              ? e.addEventListener(t, n, { passive: i })
              : e.addEventListener(t, n, !1));
}
function bi(e, t, n, r, i) {
    var l = r;
    if (!(t & 1) && !(t & 2) && r !== null)
        e: for (;;) {
            if (r === null) return;
            var o = r.tag;
            if (o === 3 || o === 4) {
                var s = r.stateNode.containerInfo;
                if (s === i || (s.nodeType === 8 && s.parentNode === i)) break;
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
                for (; s !== null; ) {
                    if (((o = Rt(s)), o === null)) return;
                    if (((a = o.tag), a === 5 || a === 6)) {
                        r = l = o;
                        continue e;
                    }
                    s = s.parentNode;
                }
            }
            r = r.return;
        }
    cu(function () {
        var u = l,
            d = So(n),
            f = [];
        e: {
            var g = Uu.get(e);
            if (g !== void 0) {
                var y = Po,
                    m = e;
                switch (e) {
                    case 'keypress':
                        if (Ar(n) === 0) break e;
                    case 'keydown':
                    case 'keyup':
                        y = wd;
                        break;
                    case 'focusin':
                        ((m = 'focus'), (y = Qi));
                        break;
                    case 'focusout':
                        ((m = 'blur'), (y = Qi));
                        break;
                    case 'beforeblur':
                    case 'afterblur':
                        y = Qi;
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
                        y = Ss;
                        break;
                    case 'drag':
                    case 'dragend':
                    case 'dragenter':
                    case 'dragexit':
                    case 'dragleave':
                    case 'dragover':
                    case 'dragstart':
                    case 'drop':
                        y = sd;
                        break;
                    case 'touchcancel':
                    case 'touchend':
                    case 'touchmove':
                    case 'touchstart':
                        y = kd;
                        break;
                    case Iu:
                    case Du:
                    case Mu:
                        y = cd;
                        break;
                    case $u:
                        y = Cd;
                        break;
                    case 'scroll':
                        y = ld;
                        break;
                    case 'wheel':
                        y = Ld;
                        break;
                    case 'copy':
                    case 'cut':
                    case 'paste':
                        y = dd;
                        break;
                    case 'gotpointercapture':
                    case 'lostpointercapture':
                    case 'pointercancel':
                    case 'pointerdown':
                    case 'pointermove':
                    case 'pointerout':
                    case 'pointerover':
                    case 'pointerup':
                        y = Es;
                }
                var w = (t & 4) !== 0,
                    T = !w && e === 'scroll',
                    p = w ? (g !== null ? g + 'Capture' : null) : g;
                w = [];
                for (var c = u, h; c !== null; ) {
                    h = c;
                    var v = h.stateNode;
                    if (
                        (h.tag === 5 &&
                            v !== null &&
                            ((h = v),
                            p !== null && ((v = Zn(c, p)), v != null && w.push(rr(c, v, h)))),
                        T)
                    )
                        break;
                    c = c.return;
                }
                0 < w.length && ((g = new y(g, m, null, n, d)), f.push({ event: g, listeners: w }));
            }
        }
        if (!(t & 7)) {
            e: {
                if (
                    ((g = e === 'mouseover' || e === 'pointerover'),
                    (y = e === 'mouseout' || e === 'pointerout'),
                    g && n !== Ll && (m = n.relatedTarget || n.fromElement) && (Rt(m) || m[rt]))
                )
                    break e;
                if (
                    (y || g) &&
                    ((g =
                        d.window === d
                            ? d
                            : (g = d.ownerDocument)
                              ? g.defaultView || g.parentWindow
                              : window),
                    y
                        ? ((m = n.relatedTarget || n.toElement),
                          (y = u),
                          (m = m ? Rt(m) : null),
                          m !== null &&
                              ((T = Ht(m)), m !== T || (m.tag !== 5 && m.tag !== 6)) &&
                              (m = null))
                        : ((y = null), (m = u)),
                    y !== m)
                ) {
                    if (
                        ((w = Ss),
                        (v = 'onMouseLeave'),
                        (p = 'onMouseEnter'),
                        (c = 'mouse'),
                        (e === 'pointerout' || e === 'pointerover') &&
                            ((w = Es),
                            (v = 'onPointerLeave'),
                            (p = 'onPointerEnter'),
                            (c = 'pointer')),
                        (T = y == null ? g : bt(y)),
                        (h = m == null ? g : bt(m)),
                        (g = new w(v, c + 'leave', y, n, d)),
                        (g.target = T),
                        (g.relatedTarget = h),
                        (v = null),
                        Rt(d) === u &&
                            ((w = new w(p, c + 'enter', m, n, d)),
                            (w.target = h),
                            (w.relatedTarget = T),
                            (v = w)),
                        (T = v),
                        y && m)
                    )
                        t: {
                            for (w = y, p = m, c = 0, h = w; h; h = Kt(h)) c++;
                            for (h = 0, v = p; v; v = Kt(v)) h++;
                            for (; 0 < c - h; ) ((w = Kt(w)), c--);
                            for (; 0 < h - c; ) ((p = Kt(p)), h--);
                            for (; c--; ) {
                                if (w === p || (p !== null && w === p.alternate)) break t;
                                ((w = Kt(w)), (p = Kt(p)));
                            }
                            w = null;
                        }
                    else w = null;
                    (y !== null && Fs(f, g, y, w, !1),
                        m !== null && T !== null && Fs(f, T, m, w, !0));
                }
            }
            e: {
                if (
                    ((g = u ? bt(u) : window),
                    (y = g.nodeName && g.nodeName.toLowerCase()),
                    y === 'select' || (y === 'input' && g.type === 'file'))
                )
                    var S = zd;
                else if (Ls(g))
                    if (Ru) S = Md;
                    else {
                        S = Id;
                        var C = Fd;
                    }
                else
                    (y = g.nodeName) &&
                        y.toLowerCase() === 'input' &&
                        (g.type === 'checkbox' || g.type === 'radio') &&
                        (S = Dd);
                if (S && (S = S(e, u))) {
                    _u(f, S, n, d);
                    break e;
                }
                (C && C(e, g, u),
                    e === 'focusout' &&
                        (C = g._wrapperState) &&
                        C.controlled &&
                        g.type === 'number' &&
                        Sl(g, 'number', g.value));
            }
            switch (((C = u ? bt(u) : window), e)) {
                case 'focusin':
                    (Ls(C) || C.contentEditable === 'true') && ((Jt = C), (zl = u), (Vn = null));
                    break;
                case 'focusout':
                    Vn = zl = Jt = null;
                    break;
                case 'mousedown':
                    Fl = !0;
                    break;
                case 'contextmenu':
                case 'mouseup':
                case 'dragend':
                    ((Fl = !1), Ts(f, n, d));
                    break;
                case 'selectionchange':
                    if (Ad) break;
                case 'keydown':
                case 'keyup':
                    Ts(f, n, d);
            }
            var E;
            if (_o)
                e: {
                    switch (e) {
                        case 'compositionstart':
                            var L = 'onCompositionStart';
                            break e;
                        case 'compositionend':
                            L = 'onCompositionEnd';
                            break e;
                        case 'compositionupdate':
                            L = 'onCompositionUpdate';
                            break e;
                    }
                    L = void 0;
                }
            else
                Zt
                    ? Pu(e, n) && (L = 'onCompositionEnd')
                    : e === 'keydown' && n.keyCode === 229 && (L = 'onCompositionStart');
            (L &&
                (Lu &&
                    n.locale !== 'ko' &&
                    (Zt || L !== 'onCompositionStart'
                        ? L === 'onCompositionEnd' && Zt && (E = Nu())
                        : ((dt = d), (Lo = 'value' in dt ? dt.value : dt.textContent), (Zt = !0))),
                (C = ti(u, L)),
                0 < C.length &&
                    ((L = new ks(L, e, null, n, d)),
                    f.push({ event: L, listeners: C }),
                    E ? (L.data = E) : ((E = Ou(n)), E !== null && (L.data = E)))),
                (E = Od ? _d(e, n) : Rd(e, n)) &&
                    ((u = ti(u, 'onBeforeInput')),
                    0 < u.length &&
                        ((d = new ks('onBeforeInput', 'beforeinput', null, n, d)),
                        f.push({ event: d, listeners: u }),
                        (d.data = E))));
        }
        Au(f, t);
    });
}
function rr(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
}
function ti(e, t) {
    for (var n = t + 'Capture', r = []; e !== null; ) {
        var i = e,
            l = i.stateNode;
        (i.tag === 5 &&
            l !== null &&
            ((i = l),
            (l = Zn(e, n)),
            l != null && r.unshift(rr(e, l, i)),
            (l = Zn(e, t)),
            l != null && r.push(rr(e, l, i))),
            (e = e.return));
    }
    return r;
}
function Kt(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5);
    return e || null;
}
function Fs(e, t, n, r, i) {
    for (var l = t._reactName, o = []; n !== null && n !== r; ) {
        var s = n,
            a = s.alternate,
            u = s.stateNode;
        if (a !== null && a === r) break;
        (s.tag === 5 &&
            u !== null &&
            ((s = u),
            i
                ? ((a = Zn(n, l)), a != null && o.unshift(rr(n, a, s)))
                : i || ((a = Zn(n, l)), a != null && o.push(rr(n, a, s)))),
            (n = n.return));
    }
    o.length !== 0 && e.push({ event: t, listeners: o });
}
var Kd = /\r\n?/g,
    Wd = /\u0000|\uFFFD/g;
function Is(e) {
    return (typeof e == 'string' ? e : '' + e)
        .replace(
            Kd,
            `
`,
        )
        .replace(Wd, '');
}
function Or(e, t, n) {
    if (((t = Is(t)), Is(e) !== t && n)) throw Error(x(425));
}
function ni() {}
var Il = null,
    Dl = null;
function Ml(e, t) {
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
var $l = typeof setTimeout == 'function' ? setTimeout : void 0,
    Qd = typeof clearTimeout == 'function' ? clearTimeout : void 0,
    Ds = typeof Promise == 'function' ? Promise : void 0,
    Yd =
        typeof queueMicrotask == 'function'
            ? queueMicrotask
            : typeof Ds < 'u'
              ? function (e) {
                    return Ds.resolve(null).then(e).catch(Gd);
                }
              : $l;
function Gd(e) {
    setTimeout(function () {
        throw e;
    });
}
function el(e, t) {
    var n = t,
        r = 0;
    do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8))
            if (((n = i.data), n === '/$')) {
                if (r === 0) {
                    (e.removeChild(i), bn(t));
                    return;
                }
                r--;
            } else (n !== '$' && n !== '$?' && n !== '$!') || r++;
        n = i;
    } while (n);
    bn(t);
}
function yt(e) {
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
function Ms(e) {
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
var En = Math.random().toString(36).slice(2),
    Ye = '__reactFiber$' + En,
    ir = '__reactProps$' + En,
    rt = '__reactContainer$' + En,
    Ul = '__reactEvents$' + En,
    Xd = '__reactListeners$' + En,
    Zd = '__reactHandles$' + En;
function Rt(e) {
    var t = e[Ye];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
        if ((t = n[rt] || n[Ye])) {
            if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
                for (e = Ms(e); e !== null; ) {
                    if ((n = e[Ye])) return n;
                    e = Ms(e);
                }
            return t;
        }
        ((e = n), (n = e.parentNode));
    }
    return null;
}
function gr(e) {
    return (
        (e = e[Ye] || e[rt]),
        !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
    );
}
function bt(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(x(33));
}
function Li(e) {
    return e[ir] || null;
}
var Al = [],
    en = -1;
function Nt(e) {
    return { current: e };
}
function K(e) {
    0 > en || ((e.current = Al[en]), (Al[en] = null), en--);
}
function H(e, t) {
    (en++, (Al[en] = e.current), (e.current = t));
}
var Et = {},
    pe = Nt(Et),
    Se = Nt(!1),
    It = Et;
function hn(e, t) {
    var n = e.type.contextTypes;
    if (!n) return Et;
    var r = e.stateNode;
    if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
        return r.__reactInternalMemoizedMaskedChildContext;
    var i = {},
        l;
    for (l in n) i[l] = t[l];
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
function ri() {
    (K(Se), K(pe));
}
function $s(e, t, n) {
    if (pe.current !== Et) throw Error(x(168));
    (H(pe, t), H(Se, n));
}
function Hu(e, t, n) {
    var r = e.stateNode;
    if (((t = t.childContextTypes), typeof r.getChildContext != 'function')) return n;
    r = r.getChildContext();
    for (var i in r) if (!(i in t)) throw Error(x(108, Ff(e) || 'Unknown', i));
    return G({}, n, r);
}
function ii(e) {
    return (
        (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || Et),
        (It = pe.current),
        H(pe, e),
        H(Se, Se.current),
        !0
    );
}
function Us(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(x(169));
    (n
        ? ((e = Hu(e, t, It)),
          (r.__reactInternalMemoizedMergedChildContext = e),
          K(Se),
          K(pe),
          H(pe, e))
        : K(Se),
        H(Se, n));
}
var qe = null,
    Pi = !1,
    tl = !1;
function Bu(e) {
    qe === null ? (qe = [e]) : qe.push(e);
}
function Jd(e) {
    ((Pi = !0), Bu(e));
}
function Lt() {
    if (!tl && qe !== null) {
        tl = !0;
        var e = 0,
            t = A;
        try {
            var n = qe;
            for (A = 1; e < n.length; e++) {
                var r = n[e];
                do r = r(!0);
                while (r !== null);
            }
            ((qe = null), (Pi = !1));
        } catch (i) {
            throw (qe !== null && (qe = qe.slice(e + 1)), hu(ko, Lt), i);
        } finally {
            ((A = t), (tl = !1));
        }
    }
    return null;
}
var tn = [],
    nn = 0,
    li = null,
    oi = 0,
    Re = [],
    Te = 0,
    Dt = null,
    be = 1,
    et = '';
function Ot(e, t) {
    ((tn[nn++] = oi), (tn[nn++] = li), (li = e), (oi = t));
}
function Ku(e, t, n) {
    ((Re[Te++] = be), (Re[Te++] = et), (Re[Te++] = Dt), (Dt = e));
    var r = be;
    e = et;
    var i = 32 - Ae(r) - 1;
    ((r &= ~(1 << i)), (n += 1));
    var l = 32 - Ae(t) + i;
    if (30 < l) {
        var o = i - (i % 5);
        ((l = (r & ((1 << o) - 1)).toString(32)),
            (r >>= o),
            (i -= o),
            (be = (1 << (32 - Ae(t) + i)) | (n << i) | r),
            (et = l + e));
    } else ((be = (1 << l) | (n << i) | r), (et = e));
}
function To(e) {
    e.return !== null && (Ot(e, 1), Ku(e, 1, 0));
}
function jo(e) {
    for (; e === li; ) ((li = tn[--nn]), (tn[nn] = null), (oi = tn[--nn]), (tn[nn] = null));
    for (; e === Dt; )
        ((Dt = Re[--Te]),
            (Re[Te] = null),
            (et = Re[--Te]),
            (Re[Te] = null),
            (be = Re[--Te]),
            (Re[Te] = null));
}
var Le = null,
    Ne = null,
    W = !1,
    Ue = null;
function Wu(e, t) {
    var n = je(5, null, null, 0);
    ((n.elementType = 'DELETED'),
        (n.stateNode = t),
        (n.return = e),
        (t = e.deletions),
        t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function As(e, t) {
    switch (e.tag) {
        case 5:
            var n = e.type;
            return (
                (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
                t !== null ? ((e.stateNode = t), (Le = e), (Ne = yt(t.firstChild)), !0) : !1
            );
        case 6:
            return (
                (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
                t !== null ? ((e.stateNode = t), (Le = e), (Ne = null), !0) : !1
            );
        case 13:
            return (
                (t = t.nodeType !== 8 ? null : t),
                t !== null
                    ? ((n = Dt !== null ? { id: be, overflow: et } : null),
                      (e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }),
                      (n = je(18, null, null, 0)),
                      (n.stateNode = t),
                      (n.return = e),
                      (e.child = n),
                      (Le = e),
                      (Ne = null),
                      !0)
                    : !1
            );
        default:
            return !1;
    }
}
function Vl(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Hl(e) {
    if (W) {
        var t = Ne;
        if (t) {
            var n = t;
            if (!As(e, t)) {
                if (Vl(e)) throw Error(x(418));
                t = yt(n.nextSibling);
                var r = Le;
                t && As(e, t) ? Wu(r, n) : ((e.flags = (e.flags & -4097) | 2), (W = !1), (Le = e));
            }
        } else {
            if (Vl(e)) throw Error(x(418));
            ((e.flags = (e.flags & -4097) | 2), (W = !1), (Le = e));
        }
    }
}
function Vs(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    Le = e;
}
function _r(e) {
    if (e !== Le) return !1;
    if (!W) return (Vs(e), (W = !0), !1);
    var t;
    if (
        ((t = e.tag !== 3) &&
            !(t = e.tag !== 5) &&
            ((t = e.type), (t = t !== 'head' && t !== 'body' && !Ml(e.type, e.memoizedProps))),
        t && (t = Ne))
    ) {
        if (Vl(e)) throw (Qu(), Error(x(418)));
        for (; t; ) (Wu(e, t), (t = yt(t.nextSibling)));
    }
    if ((Vs(e), e.tag === 13)) {
        if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
            throw Error(x(317));
        e: {
            for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                    var n = e.data;
                    if (n === '/$') {
                        if (t === 0) {
                            Ne = yt(e.nextSibling);
                            break e;
                        }
                        t--;
                    } else (n !== '$' && n !== '$!' && n !== '$?') || t++;
                }
                e = e.nextSibling;
            }
            Ne = null;
        }
    } else Ne = Le ? yt(e.stateNode.nextSibling) : null;
    return !0;
}
function Qu() {
    for (var e = Ne; e; ) e = yt(e.nextSibling);
}
function gn() {
    ((Ne = Le = null), (W = !1));
}
function zo(e) {
    Ue === null ? (Ue = [e]) : Ue.push(e);
}
var qd = ot.ReactCurrentBatchConfig;
function _n(e, t, n) {
    if (((e = n.ref), e !== null && typeof e != 'function' && typeof e != 'object')) {
        if (n._owner) {
            if (((n = n._owner), n)) {
                if (n.tag !== 1) throw Error(x(309));
                var r = n.stateNode;
            }
            if (!r) throw Error(x(147, e));
            var i = r,
                l = '' + e;
            return t !== null &&
                t.ref !== null &&
                typeof t.ref == 'function' &&
                t.ref._stringRef === l
                ? t.ref
                : ((t = function (o) {
                      var s = i.refs;
                      o === null ? delete s[l] : (s[l] = o);
                  }),
                  (t._stringRef = l),
                  t);
        }
        if (typeof e != 'string') throw Error(x(284));
        if (!n._owner) throw Error(x(290, e));
    }
    return e;
}
function Rr(e, t) {
    throw (
        (e = Object.prototype.toString.call(t)),
        Error(
            x(
                31,
                e === '[object Object]'
                    ? 'object with keys {' + Object.keys(t).join(', ') + '}'
                    : e,
            ),
        )
    );
}
function Hs(e) {
    var t = e._init;
    return t(e._payload);
}
function Yu(e) {
    function t(p, c) {
        if (e) {
            var h = p.deletions;
            h === null ? ((p.deletions = [c]), (p.flags |= 16)) : h.push(c);
        }
    }
    function n(p, c) {
        if (!e) return null;
        for (; c !== null; ) (t(p, c), (c = c.sibling));
        return null;
    }
    function r(p, c) {
        for (p = new Map(); c !== null; )
            (c.key !== null ? p.set(c.key, c) : p.set(c.index, c), (c = c.sibling));
        return p;
    }
    function i(p, c) {
        return ((p = St(p, c)), (p.index = 0), (p.sibling = null), p);
    }
    function l(p, c, h) {
        return (
            (p.index = h),
            e
                ? ((h = p.alternate),
                  h !== null
                      ? ((h = h.index), h < c ? ((p.flags |= 2), c) : h)
                      : ((p.flags |= 2), c))
                : ((p.flags |= 1048576), c)
        );
    }
    function o(p) {
        return (e && p.alternate === null && (p.flags |= 2), p);
    }
    function s(p, c, h, v) {
        return c === null || c.tag !== 6
            ? ((c = al(h, p.mode, v)), (c.return = p), c)
            : ((c = i(c, h)), (c.return = p), c);
    }
    function a(p, c, h, v) {
        var S = h.type;
        return S === Xt
            ? d(p, c, h.props.children, v, h.key)
            : c !== null &&
                (c.elementType === S ||
                    (typeof S == 'object' && S !== null && S.$$typeof === at && Hs(S) === c.type))
              ? ((v = i(c, h.props)), (v.ref = _n(p, c, h)), (v.return = p), v)
              : ((v = Yr(h.type, h.key, h.props, null, p.mode, v)),
                (v.ref = _n(p, c, h)),
                (v.return = p),
                v);
    }
    function u(p, c, h, v) {
        return c === null ||
            c.tag !== 4 ||
            c.stateNode.containerInfo !== h.containerInfo ||
            c.stateNode.implementation !== h.implementation
            ? ((c = ul(h, p.mode, v)), (c.return = p), c)
            : ((c = i(c, h.children || [])), (c.return = p), c);
    }
    function d(p, c, h, v, S) {
        return c === null || c.tag !== 7
            ? ((c = Ft(h, p.mode, v, S)), (c.return = p), c)
            : ((c = i(c, h)), (c.return = p), c);
    }
    function f(p, c, h) {
        if ((typeof c == 'string' && c !== '') || typeof c == 'number')
            return ((c = al('' + c, p.mode, h)), (c.return = p), c);
        if (typeof c == 'object' && c !== null) {
            switch (c.$$typeof) {
                case wr:
                    return (
                        (h = Yr(c.type, c.key, c.props, null, p.mode, h)),
                        (h.ref = _n(p, null, c)),
                        (h.return = p),
                        h
                    );
                case Gt:
                    return ((c = ul(c, p.mode, h)), (c.return = p), c);
                case at:
                    var v = c._init;
                    return f(p, v(c._payload), h);
            }
            if (Fn(c) || Cn(c)) return ((c = Ft(c, p.mode, h, null)), (c.return = p), c);
            Rr(p, c);
        }
        return null;
    }
    function g(p, c, h, v) {
        var S = c !== null ? c.key : null;
        if ((typeof h == 'string' && h !== '') || typeof h == 'number')
            return S !== null ? null : s(p, c, '' + h, v);
        if (typeof h == 'object' && h !== null) {
            switch (h.$$typeof) {
                case wr:
                    return h.key === S ? a(p, c, h, v) : null;
                case Gt:
                    return h.key === S ? u(p, c, h, v) : null;
                case at:
                    return ((S = h._init), g(p, c, S(h._payload), v));
            }
            if (Fn(h) || Cn(h)) return S !== null ? null : d(p, c, h, v, null);
            Rr(p, h);
        }
        return null;
    }
    function y(p, c, h, v, S) {
        if ((typeof v == 'string' && v !== '') || typeof v == 'number')
            return ((p = p.get(h) || null), s(c, p, '' + v, S));
        if (typeof v == 'object' && v !== null) {
            switch (v.$$typeof) {
                case wr:
                    return ((p = p.get(v.key === null ? h : v.key) || null), a(c, p, v, S));
                case Gt:
                    return ((p = p.get(v.key === null ? h : v.key) || null), u(c, p, v, S));
                case at:
                    var C = v._init;
                    return y(p, c, h, C(v._payload), S);
            }
            if (Fn(v) || Cn(v)) return ((p = p.get(h) || null), d(c, p, v, S, null));
            Rr(c, v);
        }
        return null;
    }
    function m(p, c, h, v) {
        for (
            var S = null, C = null, E = c, L = (c = 0), z = null;
            E !== null && L < h.length;
            L++
        ) {
            E.index > L ? ((z = E), (E = null)) : (z = E.sibling);
            var O = g(p, E, h[L], v);
            if (O === null) {
                E === null && (E = z);
                break;
            }
            (e && E && O.alternate === null && t(p, E),
                (c = l(O, c, L)),
                C === null ? (S = O) : (C.sibling = O),
                (C = O),
                (E = z));
        }
        if (L === h.length) return (n(p, E), W && Ot(p, L), S);
        if (E === null) {
            for (; L < h.length; L++)
                ((E = f(p, h[L], v)),
                    E !== null &&
                        ((c = l(E, c, L)), C === null ? (S = E) : (C.sibling = E), (C = E)));
            return (W && Ot(p, L), S);
        }
        for (E = r(p, E); L < h.length; L++)
            ((z = y(E, p, L, h[L], v)),
                z !== null &&
                    (e && z.alternate !== null && E.delete(z.key === null ? L : z.key),
                    (c = l(z, c, L)),
                    C === null ? (S = z) : (C.sibling = z),
                    (C = z)));
        return (
            e &&
                E.forEach(function (ae) {
                    return t(p, ae);
                }),
            W && Ot(p, L),
            S
        );
    }
    function w(p, c, h, v) {
        var S = Cn(h);
        if (typeof S != 'function') throw Error(x(150));
        if (((h = S.call(h)), h == null)) throw Error(x(151));
        for (
            var C = (S = null), E = c, L = (c = 0), z = null, O = h.next();
            E !== null && !O.done;
            L++, O = h.next()
        ) {
            E.index > L ? ((z = E), (E = null)) : (z = E.sibling);
            var ae = g(p, E, O.value, v);
            if (ae === null) {
                E === null && (E = z);
                break;
            }
            (e && E && ae.alternate === null && t(p, E),
                (c = l(ae, c, L)),
                C === null ? (S = ae) : (C.sibling = ae),
                (C = ae),
                (E = z));
        }
        if (O.done) return (n(p, E), W && Ot(p, L), S);
        if (E === null) {
            for (; !O.done; L++, O = h.next())
                ((O = f(p, O.value, v)),
                    O !== null &&
                        ((c = l(O, c, L)), C === null ? (S = O) : (C.sibling = O), (C = O)));
            return (W && Ot(p, L), S);
        }
        for (E = r(p, E); !O.done; L++, O = h.next())
            ((O = y(E, p, L, O.value, v)),
                O !== null &&
                    (e && O.alternate !== null && E.delete(O.key === null ? L : O.key),
                    (c = l(O, c, L)),
                    C === null ? (S = O) : (C.sibling = O),
                    (C = O)));
        return (
            e &&
                E.forEach(function ($) {
                    return t(p, $);
                }),
            W && Ot(p, L),
            S
        );
    }
    function T(p, c, h, v) {
        if (
            (typeof h == 'object' &&
                h !== null &&
                h.type === Xt &&
                h.key === null &&
                (h = h.props.children),
            typeof h == 'object' && h !== null)
        ) {
            switch (h.$$typeof) {
                case wr:
                    e: {
                        for (var S = h.key, C = c; C !== null; ) {
                            if (C.key === S) {
                                if (((S = h.type), S === Xt)) {
                                    if (C.tag === 7) {
                                        (n(p, C.sibling),
                                            (c = i(C, h.props.children)),
                                            (c.return = p),
                                            (p = c));
                                        break e;
                                    }
                                } else if (
                                    C.elementType === S ||
                                    (typeof S == 'object' &&
                                        S !== null &&
                                        S.$$typeof === at &&
                                        Hs(S) === C.type)
                                ) {
                                    (n(p, C.sibling),
                                        (c = i(C, h.props)),
                                        (c.ref = _n(p, C, h)),
                                        (c.return = p),
                                        (p = c));
                                    break e;
                                }
                                n(p, C);
                                break;
                            } else t(p, C);
                            C = C.sibling;
                        }
                        h.type === Xt
                            ? ((c = Ft(h.props.children, p.mode, v, h.key)),
                              (c.return = p),
                              (p = c))
                            : ((v = Yr(h.type, h.key, h.props, null, p.mode, v)),
                              (v.ref = _n(p, c, h)),
                              (v.return = p),
                              (p = v));
                    }
                    return o(p);
                case Gt:
                    e: {
                        for (C = h.key; c !== null; ) {
                            if (c.key === C)
                                if (
                                    c.tag === 4 &&
                                    c.stateNode.containerInfo === h.containerInfo &&
                                    c.stateNode.implementation === h.implementation
                                ) {
                                    (n(p, c.sibling),
                                        (c = i(c, h.children || [])),
                                        (c.return = p),
                                        (p = c));
                                    break e;
                                } else {
                                    n(p, c);
                                    break;
                                }
                            else t(p, c);
                            c = c.sibling;
                        }
                        ((c = ul(h, p.mode, v)), (c.return = p), (p = c));
                    }
                    return o(p);
                case at:
                    return ((C = h._init), T(p, c, C(h._payload), v));
            }
            if (Fn(h)) return m(p, c, h, v);
            if (Cn(h)) return w(p, c, h, v);
            Rr(p, h);
        }
        return (typeof h == 'string' && h !== '') || typeof h == 'number'
            ? ((h = '' + h),
              c !== null && c.tag === 6
                  ? (n(p, c.sibling), (c = i(c, h)), (c.return = p), (p = c))
                  : (n(p, c), (c = al(h, p.mode, v)), (c.return = p), (p = c)),
              o(p))
            : n(p, c);
    }
    return T;
}
var mn = Yu(!0),
    Gu = Yu(!1),
    si = Nt(null),
    ai = null,
    rn = null,
    Fo = null;
function Io() {
    Fo = rn = ai = null;
}
function Do(e) {
    var t = si.current;
    (K(si), (e._currentValue = t));
}
function Bl(e, t, n) {
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
function fn(e, t) {
    ((ai = e),
        (Fo = rn = null),
        (e = e.dependencies),
        e !== null &&
            e.firstContext !== null &&
            (e.lanes & t && (xe = !0), (e.firstContext = null)));
}
function Fe(e) {
    var t = e._currentValue;
    if (Fo !== e)
        if (((e = { context: e, memoizedValue: t, next: null }), rn === null)) {
            if (ai === null) throw Error(x(308));
            ((rn = e), (ai.dependencies = { lanes: 0, firstContext: e }));
        } else rn = rn.next = e;
    return t;
}
var Tt = null;
function Mo(e) {
    Tt === null ? (Tt = [e]) : Tt.push(e);
}
function Xu(e, t, n, r) {
    var i = t.interleaved;
    return (
        i === null ? ((n.next = n), Mo(t)) : ((n.next = i.next), (i.next = n)),
        (t.interleaved = n),
        it(e, r)
    );
}
function it(e, t) {
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
var ut = !1;
function $o(e) {
    e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, interleaved: null, lanes: 0 },
        effects: null,
    };
}
function Zu(e, t) {
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
function tt(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function vt(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (((r = r.shared), U & 2)) {
        var i = r.pending;
        return (
            i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
            (r.pending = t),
            it(e, n)
        );
    }
    return (
        (i = r.interleaved),
        i === null ? ((t.next = t), Mo(r)) : ((t.next = i.next), (i.next = t)),
        (r.interleaved = t),
        it(e, n)
    );
}
function Vr(e, t, n) {
    if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), Eo(e, n));
    }
}
function Bs(e, t) {
    var n = e.updateQueue,
        r = e.alternate;
    if (r !== null && ((r = r.updateQueue), n === r)) {
        var i = null,
            l = null;
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
                (l === null ? (i = l = o) : (l = l.next = o), (n = n.next));
            } while (n !== null);
            l === null ? (i = l = t) : (l = l.next = t);
        } else i = l = t;
        ((n = {
            baseState: r.baseState,
            firstBaseUpdate: i,
            lastBaseUpdate: l,
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
function ui(e, t, n, r) {
    var i = e.updateQueue;
    ut = !1;
    var l = i.firstBaseUpdate,
        o = i.lastBaseUpdate,
        s = i.shared.pending;
    if (s !== null) {
        i.shared.pending = null;
        var a = s,
            u = a.next;
        ((a.next = null), o === null ? (l = u) : (o.next = u), (o = a));
        var d = e.alternate;
        d !== null &&
            ((d = d.updateQueue),
            (s = d.lastBaseUpdate),
            s !== o &&
                (s === null ? (d.firstBaseUpdate = u) : (s.next = u), (d.lastBaseUpdate = a)));
    }
    if (l !== null) {
        var f = i.baseState;
        ((o = 0), (d = u = a = null), (s = l));
        do {
            var g = s.lane,
                y = s.eventTime;
            if ((r & g) === g) {
                d !== null &&
                    (d = d.next =
                        {
                            eventTime: y,
                            lane: 0,
                            tag: s.tag,
                            payload: s.payload,
                            callback: s.callback,
                            next: null,
                        });
                e: {
                    var m = e,
                        w = s;
                    switch (((g = t), (y = n), w.tag)) {
                        case 1:
                            if (((m = w.payload), typeof m == 'function')) {
                                f = m.call(y, f, g);
                                break e;
                            }
                            f = m;
                            break e;
                        case 3:
                            m.flags = (m.flags & -65537) | 128;
                        case 0:
                            if (
                                ((m = w.payload),
                                (g = typeof m == 'function' ? m.call(y, f, g) : m),
                                g == null)
                            )
                                break e;
                            f = G({}, f, g);
                            break e;
                        case 2:
                            ut = !0;
                    }
                }
                s.callback !== null &&
                    s.lane !== 0 &&
                    ((e.flags |= 64), (g = i.effects), g === null ? (i.effects = [s]) : g.push(s));
            } else
                ((y = {
                    eventTime: y,
                    lane: g,
                    tag: s.tag,
                    payload: s.payload,
                    callback: s.callback,
                    next: null,
                }),
                    d === null ? ((u = d = y), (a = f)) : (d = d.next = y),
                    (o |= g));
            if (((s = s.next), s === null)) {
                if (((s = i.shared.pending), s === null)) break;
                ((g = s),
                    (s = g.next),
                    (g.next = null),
                    (i.lastBaseUpdate = g),
                    (i.shared.pending = null));
            }
        } while (!0);
        if (
            (d === null && (a = f),
            (i.baseState = a),
            (i.firstBaseUpdate = u),
            (i.lastBaseUpdate = d),
            (t = i.shared.interleaved),
            t !== null)
        ) {
            i = t;
            do ((o |= i.lane), (i = i.next));
            while (i !== t);
        } else l === null && (i.shared.lanes = 0);
        (($t |= o), (e.lanes = o), (e.memoizedState = f));
    }
}
function Ks(e, t, n) {
    if (((e = t.effects), (t.effects = null), e !== null))
        for (t = 0; t < e.length; t++) {
            var r = e[t],
                i = r.callback;
            if (i !== null) {
                if (((r.callback = null), (r = n), typeof i != 'function')) throw Error(x(191, i));
                i.call(r);
            }
        }
}
var mr = {},
    Ze = Nt(mr),
    lr = Nt(mr),
    or = Nt(mr);
function jt(e) {
    if (e === mr) throw Error(x(174));
    return e;
}
function Uo(e, t) {
    switch ((H(or, t), H(lr, e), H(Ze, mr), (e = t.nodeType), e)) {
        case 9:
        case 11:
            t = (t = t.documentElement) ? t.namespaceURI : El(null, '');
            break;
        default:
            ((e = e === 8 ? t.parentNode : t),
                (t = e.namespaceURI || null),
                (e = e.tagName),
                (t = El(t, e)));
    }
    (K(Ze), H(Ze, t));
}
function yn() {
    (K(Ze), K(lr), K(or));
}
function Ju(e) {
    jt(or.current);
    var t = jt(Ze.current),
        n = El(t, e.type);
    t !== n && (H(lr, e), H(Ze, n));
}
function Ao(e) {
    lr.current === e && (K(Ze), K(lr));
}
var Q = Nt(0);
function ci(e) {
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
var nl = [];
function Vo() {
    for (var e = 0; e < nl.length; e++) nl[e]._workInProgressVersionPrimary = null;
    nl.length = 0;
}
var Hr = ot.ReactCurrentDispatcher,
    rl = ot.ReactCurrentBatchConfig,
    Mt = 0,
    Y = null,
    te = null,
    re = null,
    fi = !1,
    Hn = !1,
    sr = 0,
    bd = 0;
function ce() {
    throw Error(x(321));
}
function Ho(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++) if (!He(e[n], t[n])) return !1;
    return !0;
}
function Bo(e, t, n, r, i, l) {
    if (
        ((Mt = l),
        (Y = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (Hr.current = e === null || e.memoizedState === null ? rp : ip),
        (e = n(r, i)),
        Hn)
    ) {
        l = 0;
        do {
            if (((Hn = !1), (sr = 0), 25 <= l)) throw Error(x(301));
            ((l += 1), (re = te = null), (t.updateQueue = null), (Hr.current = lp), (e = n(r, i)));
        } while (Hn);
    }
    if (
        ((Hr.current = di),
        (t = te !== null && te.next !== null),
        (Mt = 0),
        (re = te = Y = null),
        (fi = !1),
        t)
    )
        throw Error(x(300));
    return e;
}
function Ko() {
    var e = sr !== 0;
    return ((sr = 0), e);
}
function Qe() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return (re === null ? (Y.memoizedState = re = e) : (re = re.next = e), re);
}
function Ie() {
    if (te === null) {
        var e = Y.alternate;
        e = e !== null ? e.memoizedState : null;
    } else e = te.next;
    var t = re === null ? Y.memoizedState : re.next;
    if (t !== null) ((re = t), (te = e));
    else {
        if (e === null) throw Error(x(310));
        ((te = e),
            (e = {
                memoizedState: te.memoizedState,
                baseState: te.baseState,
                baseQueue: te.baseQueue,
                queue: te.queue,
                next: null,
            }),
            re === null ? (Y.memoizedState = re = e) : (re = re.next = e));
    }
    return re;
}
function ar(e, t) {
    return typeof t == 'function' ? t(e) : t;
}
function il(e) {
    var t = Ie(),
        n = t.queue;
    if (n === null) throw Error(x(311));
    n.lastRenderedReducer = e;
    var r = te,
        i = r.baseQueue,
        l = n.pending;
    if (l !== null) {
        if (i !== null) {
            var o = i.next;
            ((i.next = l.next), (l.next = o));
        }
        ((r.baseQueue = i = l), (n.pending = null));
    }
    if (i !== null) {
        ((l = i.next), (r = r.baseState));
        var s = (o = null),
            a = null,
            u = l;
        do {
            var d = u.lane;
            if ((Mt & d) === d)
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
                    lane: d,
                    action: u.action,
                    hasEagerState: u.hasEagerState,
                    eagerState: u.eagerState,
                    next: null,
                };
                (a === null ? ((s = a = f), (o = r)) : (a = a.next = f), (Y.lanes |= d), ($t |= d));
            }
            u = u.next;
        } while (u !== null && u !== l);
        (a === null ? (o = r) : (a.next = s),
            He(r, t.memoizedState) || (xe = !0),
            (t.memoizedState = r),
            (t.baseState = o),
            (t.baseQueue = a),
            (n.lastRenderedState = r));
    }
    if (((e = n.interleaved), e !== null)) {
        i = e;
        do ((l = i.lane), (Y.lanes |= l), ($t |= l), (i = i.next));
        while (i !== e);
    } else i === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
}
function ll(e) {
    var t = Ie(),
        n = t.queue;
    if (n === null) throw Error(x(311));
    n.lastRenderedReducer = e;
    var r = n.dispatch,
        i = n.pending,
        l = t.memoizedState;
    if (i !== null) {
        n.pending = null;
        var o = (i = i.next);
        do ((l = e(l, o.action)), (o = o.next));
        while (o !== i);
        (He(l, t.memoizedState) || (xe = !0),
            (t.memoizedState = l),
            t.baseQueue === null && (t.baseState = l),
            (n.lastRenderedState = l));
    }
    return [l, r];
}
function qu() {}
function bu(e, t) {
    var n = Y,
        r = Ie(),
        i = t(),
        l = !He(r.memoizedState, i);
    if (
        (l && ((r.memoizedState = i), (xe = !0)),
        (r = r.queue),
        Wo(nc.bind(null, n, r, e), [e]),
        r.getSnapshot !== t || l || (re !== null && re.memoizedState.tag & 1))
    ) {
        if (((n.flags |= 2048), ur(9, tc.bind(null, n, r, i, t), void 0, null), ie === null))
            throw Error(x(349));
        Mt & 30 || ec(n, t, i);
    }
    return i;
}
function ec(e, t, n) {
    ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = Y.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }), (Y.updateQueue = t), (t.stores = [e]))
            : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function tc(e, t, n, r) {
    ((t.value = n), (t.getSnapshot = r), rc(t) && ic(e));
}
function nc(e, t, n) {
    return n(function () {
        rc(t) && ic(e);
    });
}
function rc(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !He(e, n);
    } catch {
        return !0;
    }
}
function ic(e) {
    var t = it(e, 1);
    t !== null && Ve(t, e, 1, -1);
}
function Ws(e) {
    var t = Qe();
    return (
        typeof e == 'function' && (e = e()),
        (t.memoizedState = t.baseState = e),
        (e = {
            pending: null,
            interleaved: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: ar,
            lastRenderedState: e,
        }),
        (t.queue = e),
        (e = e.dispatch = np.bind(null, Y, e)),
        [t.memoizedState, e]
    );
}
function ur(e, t, n, r) {
    return (
        (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
        (t = Y.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }),
              (Y.updateQueue = t),
              (t.lastEffect = e.next = e))
            : ((n = t.lastEffect),
              n === null
                  ? (t.lastEffect = e.next = e)
                  : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
        e
    );
}
function lc() {
    return Ie().memoizedState;
}
function Br(e, t, n, r) {
    var i = Qe();
    ((Y.flags |= e), (i.memoizedState = ur(1 | t, n, void 0, r === void 0 ? null : r)));
}
function Oi(e, t, n, r) {
    var i = Ie();
    r = r === void 0 ? null : r;
    var l = void 0;
    if (te !== null) {
        var o = te.memoizedState;
        if (((l = o.destroy), r !== null && Ho(r, o.deps))) {
            i.memoizedState = ur(t, n, l, r);
            return;
        }
    }
    ((Y.flags |= e), (i.memoizedState = ur(1 | t, n, l, r)));
}
function Qs(e, t) {
    return Br(8390656, 8, e, t);
}
function Wo(e, t) {
    return Oi(2048, 8, e, t);
}
function oc(e, t) {
    return Oi(4, 2, e, t);
}
function sc(e, t) {
    return Oi(4, 4, e, t);
}
function ac(e, t) {
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
function uc(e, t, n) {
    return ((n = n != null ? n.concat([e]) : null), Oi(4, 4, ac.bind(null, t, e), n));
}
function Qo() {}
function cc(e, t) {
    var n = Ie();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Ho(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
}
function fc(e, t) {
    var n = Ie();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Ho(t, r[1])
        ? r[0]
        : ((e = e()), (n.memoizedState = [e, t]), e);
}
function dc(e, t, n) {
    return Mt & 21
        ? (He(n, t) || ((n = yu()), (Y.lanes |= n), ($t |= n), (e.baseState = !0)), t)
        : (e.baseState && ((e.baseState = !1), (xe = !0)), (e.memoizedState = n));
}
function ep(e, t) {
    var n = A;
    ((A = n !== 0 && 4 > n ? n : 4), e(!0));
    var r = rl.transition;
    rl.transition = {};
    try {
        (e(!1), t());
    } finally {
        ((A = n), (rl.transition = r));
    }
}
function pc() {
    return Ie().memoizedState;
}
function tp(e, t, n) {
    var r = xt(e);
    if (((n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }), hc(e)))
        gc(t, n);
    else if (((n = Xu(e, t, n, r)), n !== null)) {
        var i = ge();
        (Ve(n, e, r, i), mc(n, t, r));
    }
}
function np(e, t, n) {
    var r = xt(e),
        i = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
    if (hc(e)) gc(t, i);
    else {
        var l = e.alternate;
        if (
            e.lanes === 0 &&
            (l === null || l.lanes === 0) &&
            ((l = t.lastRenderedReducer), l !== null)
        )
            try {
                var o = t.lastRenderedState,
                    s = l(o, n);
                if (((i.hasEagerState = !0), (i.eagerState = s), He(s, o))) {
                    var a = t.interleaved;
                    (a === null ? ((i.next = i), Mo(t)) : ((i.next = a.next), (a.next = i)),
                        (t.interleaved = i));
                    return;
                }
            } catch {
            } finally {
            }
        ((n = Xu(e, t, i, r)), n !== null && ((i = ge()), Ve(n, e, r, i), mc(n, t, r)));
    }
}
function hc(e) {
    var t = e.alternate;
    return e === Y || (t !== null && t === Y);
}
function gc(e, t) {
    Hn = fi = !0;
    var n = e.pending;
    (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t));
}
function mc(e, t, n) {
    if (n & 4194240) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), Eo(e, n));
    }
}
var di = {
        readContext: Fe,
        useCallback: ce,
        useContext: ce,
        useEffect: ce,
        useImperativeHandle: ce,
        useInsertionEffect: ce,
        useLayoutEffect: ce,
        useMemo: ce,
        useReducer: ce,
        useRef: ce,
        useState: ce,
        useDebugValue: ce,
        useDeferredValue: ce,
        useTransition: ce,
        useMutableSource: ce,
        useSyncExternalStore: ce,
        useId: ce,
        unstable_isNewReconciler: !1,
    },
    rp = {
        readContext: Fe,
        useCallback: function (e, t) {
            return ((Qe().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: Fe,
        useEffect: Qs,
        useImperativeHandle: function (e, t, n) {
            return ((n = n != null ? n.concat([e]) : null), Br(4194308, 4, ac.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
            return Br(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
            return Br(4, 2, e, t);
        },
        useMemo: function (e, t) {
            var n = Qe();
            return ((t = t === void 0 ? null : t), (e = e()), (n.memoizedState = [e, t]), e);
        },
        useReducer: function (e, t, n) {
            var r = Qe();
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
                (e = e.dispatch = tp.bind(null, Y, e)),
                [r.memoizedState, e]
            );
        },
        useRef: function (e) {
            var t = Qe();
            return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: Ws,
        useDebugValue: Qo,
        useDeferredValue: function (e) {
            return (Qe().memoizedState = e);
        },
        useTransition: function () {
            var e = Ws(!1),
                t = e[0];
            return ((e = ep.bind(null, e[1])), (Qe().memoizedState = e), [t, e]);
        },
        useMutableSource: function () {},
        useSyncExternalStore: function (e, t, n) {
            var r = Y,
                i = Qe();
            if (W) {
                if (n === void 0) throw Error(x(407));
                n = n();
            } else {
                if (((n = t()), ie === null)) throw Error(x(349));
                Mt & 30 || ec(r, t, n);
            }
            i.memoizedState = n;
            var l = { value: n, getSnapshot: t };
            return (
                (i.queue = l),
                Qs(nc.bind(null, r, l, e), [e]),
                (r.flags |= 2048),
                ur(9, tc.bind(null, r, l, n, t), void 0, null),
                n
            );
        },
        useId: function () {
            var e = Qe(),
                t = ie.identifierPrefix;
            if (W) {
                var n = et,
                    r = be;
                ((n = (r & ~(1 << (32 - Ae(r) - 1))).toString(32) + n),
                    (t = ':' + t + 'R' + n),
                    (n = sr++),
                    0 < n && (t += 'H' + n.toString(32)),
                    (t += ':'));
            } else ((n = bd++), (t = ':' + t + 'r' + n.toString(32) + ':'));
            return (e.memoizedState = t);
        },
        unstable_isNewReconciler: !1,
    },
    ip = {
        readContext: Fe,
        useCallback: cc,
        useContext: Fe,
        useEffect: Wo,
        useImperativeHandle: uc,
        useInsertionEffect: oc,
        useLayoutEffect: sc,
        useMemo: fc,
        useReducer: il,
        useRef: lc,
        useState: function () {
            return il(ar);
        },
        useDebugValue: Qo,
        useDeferredValue: function (e) {
            var t = Ie();
            return dc(t, te.memoizedState, e);
        },
        useTransition: function () {
            var e = il(ar)[0],
                t = Ie().memoizedState;
            return [e, t];
        },
        useMutableSource: qu,
        useSyncExternalStore: bu,
        useId: pc,
        unstable_isNewReconciler: !1,
    },
    lp = {
        readContext: Fe,
        useCallback: cc,
        useContext: Fe,
        useEffect: Wo,
        useImperativeHandle: uc,
        useInsertionEffect: oc,
        useLayoutEffect: sc,
        useMemo: fc,
        useReducer: ll,
        useRef: lc,
        useState: function () {
            return ll(ar);
        },
        useDebugValue: Qo,
        useDeferredValue: function (e) {
            var t = Ie();
            return te === null ? (t.memoizedState = e) : dc(t, te.memoizedState, e);
        },
        useTransition: function () {
            var e = ll(ar)[0],
                t = Ie().memoizedState;
            return [e, t];
        },
        useMutableSource: qu,
        useSyncExternalStore: bu,
        useId: pc,
        unstable_isNewReconciler: !1,
    };
function Me(e, t) {
    if (e && e.defaultProps) {
        ((t = G({}, t)), (e = e.defaultProps));
        for (var n in e) t[n] === void 0 && (t[n] = e[n]);
        return t;
    }
    return t;
}
function Kl(e, t, n, r) {
    ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : G({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
}
var _i = {
    isMounted: function (e) {
        return (e = e._reactInternals) ? Ht(e) === e : !1;
    },
    enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = ge(),
            i = xt(e),
            l = tt(r, i);
        ((l.payload = t),
            n != null && (l.callback = n),
            (t = vt(e, l, i)),
            t !== null && (Ve(t, e, i, r), Vr(t, e, i)));
    },
    enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = ge(),
            i = xt(e),
            l = tt(r, i);
        ((l.tag = 1),
            (l.payload = t),
            n != null && (l.callback = n),
            (t = vt(e, l, i)),
            t !== null && (Ve(t, e, i, r), Vr(t, e, i)));
    },
    enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = ge(),
            r = xt(e),
            i = tt(n, r);
        ((i.tag = 2),
            t != null && (i.callback = t),
            (t = vt(e, i, r)),
            t !== null && (Ve(t, e, r, n), Vr(t, e, r)));
    },
};
function Ys(e, t, n, r, i, l, o) {
    return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == 'function'
            ? e.shouldComponentUpdate(r, l, o)
            : t.prototype && t.prototype.isPureReactComponent
              ? !tr(n, r) || !tr(i, l)
              : !0
    );
}
function yc(e, t, n) {
    var r = !1,
        i = Et,
        l = t.contextType;
    return (
        typeof l == 'object' && l !== null
            ? (l = Fe(l))
            : ((i = ke(t) ? It : pe.current),
              (r = t.contextTypes),
              (l = (r = r != null) ? hn(e, i) : Et)),
        (t = new t(n, l)),
        (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
        (t.updater = _i),
        (e.stateNode = t),
        (t._reactInternals = e),
        r &&
            ((e = e.stateNode),
            (e.__reactInternalMemoizedUnmaskedChildContext = i),
            (e.__reactInternalMemoizedMaskedChildContext = l)),
        t
    );
}
function Gs(e, t, n, r) {
    ((e = t.state),
        typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
            t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && _i.enqueueReplaceState(t, t.state, null));
}
function Wl(e, t, n, r) {
    var i = e.stateNode;
    ((i.props = n), (i.state = e.memoizedState), (i.refs = {}), $o(e));
    var l = t.contextType;
    (typeof l == 'object' && l !== null
        ? (i.context = Fe(l))
        : ((l = ke(t) ? It : pe.current), (i.context = hn(e, l))),
        (i.state = e.memoizedState),
        (l = t.getDerivedStateFromProps),
        typeof l == 'function' && (Kl(e, t, l, n), (i.state = e.memoizedState)),
        typeof t.getDerivedStateFromProps == 'function' ||
            typeof i.getSnapshotBeforeUpdate == 'function' ||
            (typeof i.UNSAFE_componentWillMount != 'function' &&
                typeof i.componentWillMount != 'function') ||
            ((t = i.state),
            typeof i.componentWillMount == 'function' && i.componentWillMount(),
            typeof i.UNSAFE_componentWillMount == 'function' && i.UNSAFE_componentWillMount(),
            t !== i.state && _i.enqueueReplaceState(i, i.state, null),
            ui(e, n, i, r),
            (i.state = e.memoizedState)),
        typeof i.componentDidMount == 'function' && (e.flags |= 4194308));
}
function vn(e, t) {
    try {
        var n = '',
            r = t;
        do ((n += zf(r)), (r = r.return));
        while (r);
        var i = n;
    } catch (l) {
        i =
            `
Error generating stack: ` +
            l.message +
            `
` +
            l.stack;
    }
    return { value: e, source: t, stack: i, digest: null };
}
function ol(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Ql(e, t) {
    try {
        console.error(t.value);
    } catch (n) {
        setTimeout(function () {
            throw n;
        });
    }
}
var op = typeof WeakMap == 'function' ? WeakMap : Map;
function vc(e, t, n) {
    ((n = tt(-1, n)), (n.tag = 3), (n.payload = { element: null }));
    var r = t.value;
    return (
        (n.callback = function () {
            (hi || ((hi = !0), (no = r)), Ql(e, t));
        }),
        n
    );
}
function wc(e, t, n) {
    ((n = tt(-1, n)), (n.tag = 3));
    var r = e.type.getDerivedStateFromError;
    if (typeof r == 'function') {
        var i = t.value;
        ((n.payload = function () {
            return r(i);
        }),
            (n.callback = function () {
                Ql(e, t);
            }));
    }
    var l = e.stateNode;
    return (
        l !== null &&
            typeof l.componentDidCatch == 'function' &&
            (n.callback = function () {
                (Ql(e, t),
                    typeof r != 'function' &&
                        (wt === null ? (wt = new Set([this])) : wt.add(this)));
                var o = t.stack;
                this.componentDidCatch(t.value, { componentStack: o !== null ? o : '' });
            }),
        n
    );
}
function Xs(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
        r = e.pingCache = new op();
        var i = new Set();
        r.set(t, i);
    } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
    i.has(n) || (i.add(n), (e = xp.bind(null, e, t, n)), t.then(e, e));
}
function Zs(e) {
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
function Js(e, t, n, r, i) {
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
                        : ((t = tt(-1, 1)), (t.tag = 2), vt(n, t, 1))),
                (n.lanes |= 1)),
          e);
}
var sp = ot.ReactCurrentOwner,
    xe = !1;
function he(e, t, n, r) {
    t.child = e === null ? Gu(t, null, n, r) : mn(t, e.child, n, r);
}
function qs(e, t, n, r, i) {
    n = n.render;
    var l = t.ref;
    return (
        fn(t, i),
        (r = Bo(e, t, n, r, l, i)),
        (n = Ko()),
        e !== null && !xe
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), lt(e, t, i))
            : (W && n && To(t), (t.flags |= 1), he(e, t, r, i), t.child)
    );
}
function bs(e, t, n, r, i) {
    if (e === null) {
        var l = n.type;
        return typeof l == 'function' &&
            !es(l) &&
            l.defaultProps === void 0 &&
            n.compare === null &&
            n.defaultProps === void 0
            ? ((t.tag = 15), (t.type = l), xc(e, t, l, r, i))
            : ((e = Yr(n.type, null, r, t, t.mode, i)),
              (e.ref = t.ref),
              (e.return = t),
              (t.child = e));
    }
    if (((l = e.child), !(e.lanes & i))) {
        var o = l.memoizedProps;
        if (((n = n.compare), (n = n !== null ? n : tr), n(o, r) && e.ref === t.ref))
            return lt(e, t, i);
    }
    return ((t.flags |= 1), (e = St(l, r)), (e.ref = t.ref), (e.return = t), (t.child = e));
}
function xc(e, t, n, r, i) {
    if (e !== null) {
        var l = e.memoizedProps;
        if (tr(l, r) && e.ref === t.ref)
            if (((xe = !1), (t.pendingProps = r = l), (e.lanes & i) !== 0))
                e.flags & 131072 && (xe = !0);
            else return ((t.lanes = e.lanes), lt(e, t, i));
    }
    return Yl(e, t, n, r, i);
}
function Sc(e, t, n) {
    var r = t.pendingProps,
        i = r.children,
        l = e !== null ? e.memoizedState : null;
    if (r.mode === 'hidden')
        if (!(t.mode & 1))
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                H(on, Ce),
                (Ce |= n));
        else {
            if (!(n & 1073741824))
                return (
                    (e = l !== null ? l.baseLanes | n : n),
                    (t.lanes = t.childLanes = 1073741824),
                    (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
                    (t.updateQueue = null),
                    H(on, Ce),
                    (Ce |= e),
                    null
                );
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                (r = l !== null ? l.baseLanes : n),
                H(on, Ce),
                (Ce |= r));
        }
    else
        (l !== null ? ((r = l.baseLanes | n), (t.memoizedState = null)) : (r = n),
            H(on, Ce),
            (Ce |= r));
    return (he(e, t, i, n), t.child);
}
function kc(e, t) {
    var n = t.ref;
    ((e === null && n !== null) || (e !== null && e.ref !== n)) &&
        ((t.flags |= 512), (t.flags |= 2097152));
}
function Yl(e, t, n, r, i) {
    var l = ke(n) ? It : pe.current;
    return (
        (l = hn(t, l)),
        fn(t, i),
        (n = Bo(e, t, n, r, l, i)),
        (r = Ko()),
        e !== null && !xe
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), lt(e, t, i))
            : (W && r && To(t), (t.flags |= 1), he(e, t, n, i), t.child)
    );
}
function ea(e, t, n, r, i) {
    if (ke(n)) {
        var l = !0;
        ii(t);
    } else l = !1;
    if ((fn(t, i), t.stateNode === null)) (Kr(e, t), yc(t, n, r), Wl(t, n, r, i), (r = !0));
    else if (e === null) {
        var o = t.stateNode,
            s = t.memoizedProps;
        o.props = s;
        var a = o.context,
            u = n.contextType;
        typeof u == 'object' && u !== null
            ? (u = Fe(u))
            : ((u = ke(n) ? It : pe.current), (u = hn(t, u)));
        var d = n.getDerivedStateFromProps,
            f = typeof d == 'function' || typeof o.getSnapshotBeforeUpdate == 'function';
        (f ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((s !== r || a !== u) && Gs(t, o, r, u)),
            (ut = !1));
        var g = t.memoizedState;
        ((o.state = g),
            ui(t, r, o, i),
            (a = t.memoizedState),
            s !== r || g !== a || Se.current || ut
                ? (typeof d == 'function' && (Kl(t, n, d, r), (a = t.memoizedState)),
                  (s = ut || Ys(t, n, s, r, g, a, u))
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
                  (r = s))
                : (typeof o.componentDidMount == 'function' && (t.flags |= 4194308), (r = !1)));
    } else {
        ((o = t.stateNode),
            Zu(e, t),
            (s = t.memoizedProps),
            (u = t.type === t.elementType ? s : Me(t.type, s)),
            (o.props = u),
            (f = t.pendingProps),
            (g = o.context),
            (a = n.contextType),
            typeof a == 'object' && a !== null
                ? (a = Fe(a))
                : ((a = ke(n) ? It : pe.current), (a = hn(t, a))));
        var y = n.getDerivedStateFromProps;
        ((d = typeof y == 'function' || typeof o.getSnapshotBeforeUpdate == 'function') ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((s !== f || g !== a) && Gs(t, o, r, a)),
            (ut = !1),
            (g = t.memoizedState),
            (o.state = g),
            ui(t, r, o, i));
        var m = t.memoizedState;
        s !== f || g !== m || Se.current || ut
            ? (typeof y == 'function' && (Kl(t, n, y, r), (m = t.memoizedState)),
              (u = ut || Ys(t, n, u, r, g, m, a) || !1)
                  ? (d ||
                        (typeof o.UNSAFE_componentWillUpdate != 'function' &&
                            typeof o.componentWillUpdate != 'function') ||
                        (typeof o.componentWillUpdate == 'function' &&
                            o.componentWillUpdate(r, m, a),
                        typeof o.UNSAFE_componentWillUpdate == 'function' &&
                            o.UNSAFE_componentWillUpdate(r, m, a)),
                    typeof o.componentDidUpdate == 'function' && (t.flags |= 4),
                    typeof o.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
                  : (typeof o.componentDidUpdate != 'function' ||
                        (s === e.memoizedProps && g === e.memoizedState) ||
                        (t.flags |= 4),
                    typeof o.getSnapshotBeforeUpdate != 'function' ||
                        (s === e.memoizedProps && g === e.memoizedState) ||
                        (t.flags |= 1024),
                    (t.memoizedProps = r),
                    (t.memoizedState = m)),
              (o.props = r),
              (o.state = m),
              (o.context = a),
              (r = u))
            : (typeof o.componentDidUpdate != 'function' ||
                  (s === e.memoizedProps && g === e.memoizedState) ||
                  (t.flags |= 4),
              typeof o.getSnapshotBeforeUpdate != 'function' ||
                  (s === e.memoizedProps && g === e.memoizedState) ||
                  (t.flags |= 1024),
              (r = !1));
    }
    return Gl(e, t, n, r, l, i);
}
function Gl(e, t, n, r, i, l) {
    kc(e, t);
    var o = (t.flags & 128) !== 0;
    if (!r && !o) return (i && Us(t, n, !1), lt(e, t, l));
    ((r = t.stateNode), (sp.current = t));
    var s = o && typeof n.getDerivedStateFromError != 'function' ? null : r.render();
    return (
        (t.flags |= 1),
        e !== null && o
            ? ((t.child = mn(t, e.child, null, l)), (t.child = mn(t, null, s, l)))
            : he(e, t, s, l),
        (t.memoizedState = r.state),
        i && Us(t, n, !0),
        t.child
    );
}
function Ec(e) {
    var t = e.stateNode;
    (t.pendingContext
        ? $s(e, t.pendingContext, t.pendingContext !== t.context)
        : t.context && $s(e, t.context, !1),
        Uo(e, t.containerInfo));
}
function ta(e, t, n, r, i) {
    return (gn(), zo(i), (t.flags |= 256), he(e, t, n, r), t.child);
}
var Xl = { dehydrated: null, treeContext: null, retryLane: 0 };
function Zl(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
}
function Cc(e, t, n) {
    var r = t.pendingProps,
        i = Q.current,
        l = !1,
        o = (t.flags & 128) !== 0,
        s;
    if (
        ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : (i & 2) !== 0),
        s ? ((l = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (i |= 1),
        H(Q, i & 1),
        e === null)
    )
        return (
            Hl(t),
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
                  l
                      ? ((r = t.mode),
                        (l = t.child),
                        (o = { mode: 'hidden', children: o }),
                        !(r & 1) && l !== null
                            ? ((l.childLanes = 0), (l.pendingProps = o))
                            : (l = ji(o, r, 0, null)),
                        (e = Ft(e, r, n, null)),
                        (l.return = t),
                        (e.return = t),
                        (l.sibling = e),
                        (t.child = l),
                        (t.child.memoizedState = Zl(n)),
                        (t.memoizedState = Xl),
                        e)
                      : Yo(t, o))
        );
    if (((i = e.memoizedState), i !== null && ((s = i.dehydrated), s !== null)))
        return ap(e, t, o, r, s, i, n);
    if (l) {
        ((l = r.fallback), (o = t.mode), (i = e.child), (s = i.sibling));
        var a = { mode: 'hidden', children: r.children };
        return (
            !(o & 1) && t.child !== i
                ? ((r = t.child), (r.childLanes = 0), (r.pendingProps = a), (t.deletions = null))
                : ((r = St(i, a)), (r.subtreeFlags = i.subtreeFlags & 14680064)),
            s !== null ? (l = St(s, l)) : ((l = Ft(l, o, n, null)), (l.flags |= 2)),
            (l.return = t),
            (r.return = t),
            (r.sibling = l),
            (t.child = r),
            (r = l),
            (l = t.child),
            (o = e.child.memoizedState),
            (o =
                o === null
                    ? Zl(n)
                    : { baseLanes: o.baseLanes | n, cachePool: null, transitions: o.transitions }),
            (l.memoizedState = o),
            (l.childLanes = e.childLanes & ~n),
            (t.memoizedState = Xl),
            r
        );
    }
    return (
        (l = e.child),
        (e = l.sibling),
        (r = St(l, { mode: 'visible', children: r.children })),
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
function Yo(e, t) {
    return (
        (t = ji({ mode: 'visible', children: t }, e.mode, 0, null)),
        (t.return = e),
        (e.child = t)
    );
}
function Tr(e, t, n, r) {
    return (
        r !== null && zo(r),
        mn(t, e.child, null, n),
        (e = Yo(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
    );
}
function ap(e, t, n, r, i, l, o) {
    if (n)
        return t.flags & 256
            ? ((t.flags &= -257), (r = ol(Error(x(422)))), Tr(e, t, o, r))
            : t.memoizedState !== null
              ? ((t.child = e.child), (t.flags |= 128), null)
              : ((l = r.fallback),
                (i = t.mode),
                (r = ji({ mode: 'visible', children: r.children }, i, 0, null)),
                (l = Ft(l, i, o, null)),
                (l.flags |= 2),
                (r.return = t),
                (l.return = t),
                (r.sibling = l),
                (t.child = r),
                t.mode & 1 && mn(t, e.child, null, o),
                (t.child.memoizedState = Zl(o)),
                (t.memoizedState = Xl),
                l);
    if (!(t.mode & 1)) return Tr(e, t, o, null);
    if (i.data === '$!') {
        if (((r = i.nextSibling && i.nextSibling.dataset), r)) var s = r.dgst;
        return ((r = s), (l = Error(x(419))), (r = ol(l, r, void 0)), Tr(e, t, o, r));
    }
    if (((s = (o & e.childLanes) !== 0), xe || s)) {
        if (((r = ie), r !== null)) {
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
                i !== 0 && i !== l.retryLane && ((l.retryLane = i), it(e, i), Ve(r, e, i, -1)));
        }
        return (bo(), (r = ol(Error(x(421)))), Tr(e, t, o, r));
    }
    return i.data === '$?'
        ? ((t.flags |= 128), (t.child = e.child), (t = Sp.bind(null, e)), (i._reactRetry = t), null)
        : ((e = l.treeContext),
          (Ne = yt(i.nextSibling)),
          (Le = t),
          (W = !0),
          (Ue = null),
          e !== null &&
              ((Re[Te++] = be),
              (Re[Te++] = et),
              (Re[Te++] = Dt),
              (be = e.id),
              (et = e.overflow),
              (Dt = t)),
          (t = Yo(t, r.children)),
          (t.flags |= 4096),
          t);
}
function na(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    (r !== null && (r.lanes |= t), Bl(e.return, t, n));
}
function sl(e, t, n, r, i) {
    var l = e.memoizedState;
    l === null
        ? (e.memoizedState = {
              isBackwards: t,
              rendering: null,
              renderingStartTime: 0,
              last: r,
              tail: n,
              tailMode: i,
          })
        : ((l.isBackwards = t),
          (l.rendering = null),
          (l.renderingStartTime = 0),
          (l.last = r),
          (l.tail = n),
          (l.tailMode = i));
}
function Nc(e, t, n) {
    var r = t.pendingProps,
        i = r.revealOrder,
        l = r.tail;
    if ((he(e, t, r.children, n), (r = Q.current), r & 2)) ((r = (r & 1) | 2), (t.flags |= 128));
    else {
        if (e !== null && e.flags & 128)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13) e.memoizedState !== null && na(e, n, t);
                else if (e.tag === 19) na(e, n, t);
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
    if ((H(Q, r), !(t.mode & 1))) t.memoizedState = null;
    else
        switch (i) {
            case 'forwards':
                for (n = t.child, i = null; n !== null; )
                    ((e = n.alternate), e !== null && ci(e) === null && (i = n), (n = n.sibling));
                ((n = i),
                    n === null
                        ? ((i = t.child), (t.child = null))
                        : ((i = n.sibling), (n.sibling = null)),
                    sl(t, !1, i, n, l));
                break;
            case 'backwards':
                for (n = null, i = t.child, t.child = null; i !== null; ) {
                    if (((e = i.alternate), e !== null && ci(e) === null)) {
                        t.child = i;
                        break;
                    }
                    ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
                }
                sl(t, !0, n, null, l);
                break;
            case 'together':
                sl(t, !1, null, null, void 0);
                break;
            default:
                t.memoizedState = null;
        }
    return t.child;
}
function Kr(e, t) {
    !(t.mode & 1) && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function lt(e, t, n) {
    if ((e !== null && (t.dependencies = e.dependencies), ($t |= t.lanes), !(n & t.childLanes)))
        return null;
    if (e !== null && t.child !== e.child) throw Error(x(153));
    if (t.child !== null) {
        for (
            e = t.child, n = St(e, e.pendingProps), t.child = n, n.return = t;
            e.sibling !== null;
        )
            ((e = e.sibling), (n = n.sibling = St(e, e.pendingProps)), (n.return = t));
        n.sibling = null;
    }
    return t.child;
}
function up(e, t, n) {
    switch (t.tag) {
        case 3:
            (Ec(t), gn());
            break;
        case 5:
            Ju(t);
            break;
        case 1:
            ke(t.type) && ii(t);
            break;
        case 4:
            Uo(t, t.stateNode.containerInfo);
            break;
        case 10:
            var r = t.type._context,
                i = t.memoizedProps.value;
            (H(si, r._currentValue), (r._currentValue = i));
            break;
        case 13:
            if (((r = t.memoizedState), r !== null))
                return r.dehydrated !== null
                    ? (H(Q, Q.current & 1), (t.flags |= 128), null)
                    : n & t.child.childLanes
                      ? Cc(e, t, n)
                      : (H(Q, Q.current & 1), (e = lt(e, t, n)), e !== null ? e.sibling : null);
            H(Q, Q.current & 1);
            break;
        case 19:
            if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
                if (r) return Nc(e, t, n);
                t.flags |= 128;
            }
            if (
                ((i = t.memoizedState),
                i !== null && ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
                H(Q, Q.current),
                r)
            )
                break;
            return null;
        case 22:
        case 23:
            return ((t.lanes = 0), Sc(e, t, n));
    }
    return lt(e, t, n);
}
var Lc, Jl, Pc, Oc;
Lc = function (e, t) {
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
Jl = function () {};
Pc = function (e, t, n, r) {
    var i = e.memoizedProps;
    if (i !== r) {
        ((e = t.stateNode), jt(Ze.current));
        var l = null;
        switch (n) {
            case 'input':
                ((i = wl(e, i)), (r = wl(e, r)), (l = []));
                break;
            case 'select':
                ((i = G({}, i, { value: void 0 })), (r = G({}, r, { value: void 0 })), (l = []));
                break;
            case 'textarea':
                ((i = kl(e, i)), (r = kl(e, r)), (l = []));
                break;
            default:
                typeof i.onClick != 'function' &&
                    typeof r.onClick == 'function' &&
                    (e.onclick = ni);
        }
        Cl(n, r);
        var o;
        n = null;
        for (u in i)
            if (!r.hasOwnProperty(u) && i.hasOwnProperty(u) && i[u] != null)
                if (u === 'style') {
                    var s = i[u];
                    for (o in s) s.hasOwnProperty(o) && (n || (n = {}), (n[o] = ''));
                } else
                    u !== 'dangerouslySetInnerHTML' &&
                        u !== 'children' &&
                        u !== 'suppressContentEditableWarning' &&
                        u !== 'suppressHydrationWarning' &&
                        u !== 'autoFocus' &&
                        (Gn.hasOwnProperty(u) ? l || (l = []) : (l = l || []).push(u, null));
        for (u in r) {
            var a = r[u];
            if (
                ((s = i != null ? i[u] : void 0),
                r.hasOwnProperty(u) && a !== s && (a != null || s != null))
            )
                if (u === 'style')
                    if (s) {
                        for (o in s)
                            !s.hasOwnProperty(o) ||
                                (a && a.hasOwnProperty(o)) ||
                                (n || (n = {}), (n[o] = ''));
                        for (o in a)
                            a.hasOwnProperty(o) && s[o] !== a[o] && (n || (n = {}), (n[o] = a[o]));
                    } else (n || (l || (l = []), l.push(u, n)), (n = a));
                else
                    u === 'dangerouslySetInnerHTML'
                        ? ((a = a ? a.__html : void 0),
                          (s = s ? s.__html : void 0),
                          a != null && s !== a && (l = l || []).push(u, a))
                        : u === 'children'
                          ? (typeof a != 'string' && typeof a != 'number') ||
                            (l = l || []).push(u, '' + a)
                          : u !== 'suppressContentEditableWarning' &&
                            u !== 'suppressHydrationWarning' &&
                            (Gn.hasOwnProperty(u)
                                ? (a != null && u === 'onScroll' && B('scroll', e),
                                  l || s === a || (l = []))
                                : (l = l || []).push(u, a));
        }
        n && (l = l || []).push('style', n);
        var u = l;
        (t.updateQueue = u) && (t.flags |= 4);
    }
};
Oc = function (e, t, n, r) {
    n !== r && (t.flags |= 4);
};
function Rn(e, t) {
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
function fe(e) {
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
function cp(e, t, n) {
    var r = t.pendingProps;
    switch ((jo(t), t.tag)) {
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
            return (fe(t), null);
        case 1:
            return (ke(t.type) && ri(), fe(t), null);
        case 3:
            return (
                (r = t.stateNode),
                yn(),
                K(Se),
                K(pe),
                Vo(),
                r.pendingContext && ((r.context = r.pendingContext), (r.pendingContext = null)),
                (e === null || e.child === null) &&
                    (_r(t)
                        ? (t.flags |= 4)
                        : e === null ||
                          (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                          ((t.flags |= 1024), Ue !== null && (lo(Ue), (Ue = null)))),
                Jl(e, t),
                fe(t),
                null
            );
        case 5:
            Ao(t);
            var i = jt(or.current);
            if (((n = t.type), e !== null && t.stateNode != null))
                (Pc(e, t, n, r, i), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
            else {
                if (!r) {
                    if (t.stateNode === null) throw Error(x(166));
                    return (fe(t), null);
                }
                if (((e = jt(Ze.current)), _r(t))) {
                    ((r = t.stateNode), (n = t.type));
                    var l = t.memoizedProps;
                    switch (((r[Ye] = t), (r[ir] = l), (e = (t.mode & 1) !== 0), n)) {
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
                            for (i = 0; i < Dn.length; i++) B(Dn[i], r);
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
                            (fs(r, l), B('invalid', r));
                            break;
                        case 'select':
                            ((r._wrapperState = { wasMultiple: !!l.multiple }), B('invalid', r));
                            break;
                        case 'textarea':
                            (ps(r, l), B('invalid', r));
                    }
                    (Cl(n, l), (i = null));
                    for (var o in l)
                        if (l.hasOwnProperty(o)) {
                            var s = l[o];
                            o === 'children'
                                ? typeof s == 'string'
                                    ? r.textContent !== s &&
                                      (l.suppressHydrationWarning !== !0 && Or(r.textContent, s, e),
                                      (i = ['children', s]))
                                    : typeof s == 'number' &&
                                      r.textContent !== '' + s &&
                                      (l.suppressHydrationWarning !== !0 && Or(r.textContent, s, e),
                                      (i = ['children', '' + s]))
                                : Gn.hasOwnProperty(o) &&
                                  s != null &&
                                  o === 'onScroll' &&
                                  B('scroll', r);
                        }
                    switch (n) {
                        case 'input':
                            (xr(r), ds(r, l, !0));
                            break;
                        case 'textarea':
                            (xr(r), hs(r));
                            break;
                        case 'select':
                        case 'option':
                            break;
                        default:
                            typeof l.onClick == 'function' && (r.onclick = ni);
                    }
                    ((r = i), (t.updateQueue = r), r !== null && (t.flags |= 4));
                } else {
                    ((o = i.nodeType === 9 ? i : i.ownerDocument),
                        e === 'http://www.w3.org/1999/xhtml' && (e = nu(n)),
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
                        (e[Ye] = t),
                        (e[ir] = r),
                        Lc(e, t, !1, !1),
                        (t.stateNode = e));
                    e: {
                        switch (((o = Nl(n, r)), n)) {
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
                                for (i = 0; i < Dn.length; i++) B(Dn[i], e);
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
                                (fs(e, r), (i = wl(e, r)), B('invalid', e));
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
                                (ps(e, r), (i = kl(e, r)), B('invalid', e));
                                break;
                            default:
                                i = r;
                        }
                        (Cl(n, i), (s = i));
                        for (l in s)
                            if (s.hasOwnProperty(l)) {
                                var a = s[l];
                                l === 'style'
                                    ? lu(e, a)
                                    : l === 'dangerouslySetInnerHTML'
                                      ? ((a = a ? a.__html : void 0), a != null && ru(e, a))
                                      : l === 'children'
                                        ? typeof a == 'string'
                                            ? (n !== 'textarea' || a !== '') && Xn(e, a)
                                            : typeof a == 'number' && Xn(e, '' + a)
                                        : l !== 'suppressContentEditableWarning' &&
                                          l !== 'suppressHydrationWarning' &&
                                          l !== 'autoFocus' &&
                                          (Gn.hasOwnProperty(l)
                                              ? a != null && l === 'onScroll' && B('scroll', e)
                                              : a != null && yo(e, l, a, o));
                            }
                        switch (n) {
                            case 'input':
                                (xr(e), ds(e, r, !1));
                                break;
                            case 'textarea':
                                (xr(e), hs(e));
                                break;
                            case 'option':
                                r.value != null && e.setAttribute('value', '' + kt(r.value));
                                break;
                            case 'select':
                                ((e.multiple = !!r.multiple),
                                    (l = r.value),
                                    l != null
                                        ? sn(e, !!r.multiple, l, !1)
                                        : r.defaultValue != null &&
                                          sn(e, !!r.multiple, r.defaultValue, !0));
                                break;
                            default:
                                typeof i.onClick == 'function' && (e.onclick = ni);
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
            return (fe(t), null);
        case 6:
            if (e && t.stateNode != null) Oc(e, t, e.memoizedProps, r);
            else {
                if (typeof r != 'string' && t.stateNode === null) throw Error(x(166));
                if (((n = jt(or.current)), jt(Ze.current), _r(t))) {
                    if (
                        ((r = t.stateNode),
                        (n = t.memoizedProps),
                        (r[Ye] = t),
                        (l = r.nodeValue !== n) && ((e = Le), e !== null))
                    )
                        switch (e.tag) {
                            case 3:
                                Or(r.nodeValue, n, (e.mode & 1) !== 0);
                                break;
                            case 5:
                                e.memoizedProps.suppressHydrationWarning !== !0 &&
                                    Or(r.nodeValue, n, (e.mode & 1) !== 0);
                        }
                    l && (t.flags |= 4);
                } else
                    ((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)),
                        (r[Ye] = t),
                        (t.stateNode = r));
            }
            return (fe(t), null);
        case 13:
            if (
                (K(Q),
                (r = t.memoizedState),
                e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
            ) {
                if (W && Ne !== null && t.mode & 1 && !(t.flags & 128))
                    (Qu(), gn(), (t.flags |= 98560), (l = !1));
                else if (((l = _r(t)), r !== null && r.dehydrated !== null)) {
                    if (e === null) {
                        if (!l) throw Error(x(318));
                        if (((l = t.memoizedState), (l = l !== null ? l.dehydrated : null), !l))
                            throw Error(x(317));
                        l[Ye] = t;
                    } else (gn(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
                    (fe(t), (l = !1));
                } else (Ue !== null && (lo(Ue), (Ue = null)), (l = !0));
                if (!l) return t.flags & 65536 ? t : null;
            }
            return t.flags & 128
                ? ((t.lanes = n), t)
                : ((r = r !== null),
                  r !== (e !== null && e.memoizedState !== null) &&
                      r &&
                      ((t.child.flags |= 8192),
                      t.mode & 1 && (e === null || Q.current & 1 ? ne === 0 && (ne = 3) : bo())),
                  t.updateQueue !== null && (t.flags |= 4),
                  fe(t),
                  null);
        case 4:
            return (yn(), Jl(e, t), e === null && nr(t.stateNode.containerInfo), fe(t), null);
        case 10:
            return (Do(t.type._context), fe(t), null);
        case 17:
            return (ke(t.type) && ri(), fe(t), null);
        case 19:
            if ((K(Q), (l = t.memoizedState), l === null)) return (fe(t), null);
            if (((r = (t.flags & 128) !== 0), (o = l.rendering), o === null))
                if (r) Rn(l, !1);
                else {
                    if (ne !== 0 || (e !== null && e.flags & 128))
                        for (e = t.child; e !== null; ) {
                            if (((o = ci(e)), o !== null)) {
                                for (
                                    t.flags |= 128,
                                        Rn(l, !1),
                                        r = o.updateQueue,
                                        r !== null && ((t.updateQueue = r), (t.flags |= 4)),
                                        t.subtreeFlags = 0,
                                        r = n,
                                        n = t.child;
                                    n !== null;
                                )
                                    ((l = n),
                                        (e = r),
                                        (l.flags &= 14680066),
                                        (o = l.alternate),
                                        o === null
                                            ? ((l.childLanes = 0),
                                              (l.lanes = e),
                                              (l.child = null),
                                              (l.subtreeFlags = 0),
                                              (l.memoizedProps = null),
                                              (l.memoizedState = null),
                                              (l.updateQueue = null),
                                              (l.dependencies = null),
                                              (l.stateNode = null))
                                            : ((l.childLanes = o.childLanes),
                                              (l.lanes = o.lanes),
                                              (l.child = o.child),
                                              (l.subtreeFlags = 0),
                                              (l.deletions = null),
                                              (l.memoizedProps = o.memoizedProps),
                                              (l.memoizedState = o.memoizedState),
                                              (l.updateQueue = o.updateQueue),
                                              (l.type = o.type),
                                              (e = o.dependencies),
                                              (l.dependencies =
                                                  e === null
                                                      ? null
                                                      : {
                                                            lanes: e.lanes,
                                                            firstContext: e.firstContext,
                                                        })),
                                        (n = n.sibling));
                                return (H(Q, (Q.current & 1) | 2), t.child);
                            }
                            e = e.sibling;
                        }
                    l.tail !== null &&
                        J() > wn &&
                        ((t.flags |= 128), (r = !0), Rn(l, !1), (t.lanes = 4194304));
                }
            else {
                if (!r)
                    if (((e = ci(o)), e !== null)) {
                        if (
                            ((t.flags |= 128),
                            (r = !0),
                            (n = e.updateQueue),
                            n !== null && ((t.updateQueue = n), (t.flags |= 4)),
                            Rn(l, !0),
                            l.tail === null && l.tailMode === 'hidden' && !o.alternate && !W)
                        )
                            return (fe(t), null);
                    } else
                        2 * J() - l.renderingStartTime > wn &&
                            n !== 1073741824 &&
                            ((t.flags |= 128), (r = !0), Rn(l, !1), (t.lanes = 4194304));
                l.isBackwards
                    ? ((o.sibling = t.child), (t.child = o))
                    : ((n = l.last), n !== null ? (n.sibling = o) : (t.child = o), (l.last = o));
            }
            return l.tail !== null
                ? ((t = l.tail),
                  (l.rendering = t),
                  (l.tail = t.sibling),
                  (l.renderingStartTime = J()),
                  (t.sibling = null),
                  (n = Q.current),
                  H(Q, r ? (n & 1) | 2 : n & 1),
                  t)
                : (fe(t), null);
        case 22:
        case 23:
            return (
                qo(),
                (r = t.memoizedState !== null),
                e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
                r && t.mode & 1
                    ? Ce & 1073741824 && (fe(t), t.subtreeFlags & 6 && (t.flags |= 8192))
                    : fe(t),
                null
            );
        case 24:
            return null;
        case 25:
            return null;
    }
    throw Error(x(156, t.tag));
}
function fp(e, t) {
    switch ((jo(t), t.tag)) {
        case 1:
            return (
                ke(t.type) && ri(),
                (e = t.flags),
                e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 3:
            return (
                yn(),
                K(Se),
                K(pe),
                Vo(),
                (e = t.flags),
                e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 5:
            return (Ao(t), null);
        case 13:
            if ((K(Q), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
                if (t.alternate === null) throw Error(x(340));
                gn();
            }
            return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 19:
            return (K(Q), null);
        case 4:
            return (yn(), null);
        case 10:
            return (Do(t.type._context), null);
        case 22:
        case 23:
            return (qo(), null);
        case 24:
            return null;
        default:
            return null;
    }
}
var jr = !1,
    de = !1,
    dp = typeof WeakSet == 'function' ? WeakSet : Set,
    N = null;
function ln(e, t) {
    var n = e.ref;
    if (n !== null)
        if (typeof n == 'function')
            try {
                n(null);
            } catch (r) {
                Z(e, t, r);
            }
        else n.current = null;
}
function ql(e, t, n) {
    try {
        n();
    } catch (r) {
        Z(e, t, r);
    }
}
var ra = !1;
function pp(e, t) {
    if (((Il = br), (e = zu()), Ro(e))) {
        if ('selectionStart' in e) var n = { start: e.selectionStart, end: e.selectionEnd };
        else
            e: {
                n = ((n = e.ownerDocument) && n.defaultView) || window;
                var r = n.getSelection && n.getSelection();
                if (r && r.rangeCount !== 0) {
                    n = r.anchorNode;
                    var i = r.anchorOffset,
                        l = r.focusNode;
                    r = r.focusOffset;
                    try {
                        (n.nodeType, l.nodeType);
                    } catch {
                        n = null;
                        break e;
                    }
                    var o = 0,
                        s = -1,
                        a = -1,
                        u = 0,
                        d = 0,
                        f = e,
                        g = null;
                    t: for (;;) {
                        for (
                            var y;
                            f !== n || (i !== 0 && f.nodeType !== 3) || (s = o + i),
                                f !== l || (r !== 0 && f.nodeType !== 3) || (a = o + r),
                                f.nodeType === 3 && (o += f.nodeValue.length),
                                (y = f.firstChild) !== null;
                        )
                            ((g = f), (f = y));
                        for (;;) {
                            if (f === e) break t;
                            if (
                                (g === n && ++u === i && (s = o),
                                g === l && ++d === r && (a = o),
                                (y = f.nextSibling) !== null)
                            )
                                break;
                            ((f = g), (g = f.parentNode));
                        }
                        f = y;
                    }
                    n = s === -1 || a === -1 ? null : { start: s, end: a };
                } else n = null;
            }
        n = n || { start: 0, end: 0 };
    } else n = null;
    for (Dl = { focusedElem: e, selectionRange: n }, br = !1, N = t; N !== null; )
        if (((t = N), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
            ((e.return = t), (N = e));
        else
            for (; N !== null; ) {
                t = N;
                try {
                    var m = t.alternate;
                    if (t.flags & 1024)
                        switch (t.tag) {
                            case 0:
                            case 11:
                            case 15:
                                break;
                            case 1:
                                if (m !== null) {
                                    var w = m.memoizedProps,
                                        T = m.memoizedState,
                                        p = t.stateNode,
                                        c = p.getSnapshotBeforeUpdate(
                                            t.elementType === t.type ? w : Me(t.type, w),
                                            T,
                                        );
                                    p.__reactInternalSnapshotBeforeUpdate = c;
                                }
                                break;
                            case 3:
                                var h = t.stateNode.containerInfo;
                                h.nodeType === 1
                                    ? (h.textContent = '')
                                    : h.nodeType === 9 &&
                                      h.documentElement &&
                                      h.removeChild(h.documentElement);
                                break;
                            case 5:
                            case 6:
                            case 4:
                            case 17:
                                break;
                            default:
                                throw Error(x(163));
                        }
                } catch (v) {
                    Z(t, t.return, v);
                }
                if (((e = t.sibling), e !== null)) {
                    ((e.return = t.return), (N = e));
                    break;
                }
                N = t.return;
            }
    return ((m = ra), (ra = !1), m);
}
function Bn(e, t, n) {
    var r = t.updateQueue;
    if (((r = r !== null ? r.lastEffect : null), r !== null)) {
        var i = (r = r.next);
        do {
            if ((i.tag & e) === e) {
                var l = i.destroy;
                ((i.destroy = void 0), l !== void 0 && ql(t, n, l));
            }
            i = i.next;
        } while (i !== r);
    }
}
function Ri(e, t) {
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
function bl(e) {
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
function _c(e) {
    var t = e.alternate;
    (t !== null && ((e.alternate = null), _c(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 &&
            ((t = e.stateNode),
            t !== null && (delete t[Ye], delete t[ir], delete t[Ul], delete t[Xd], delete t[Zd])),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
}
function Rc(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function ia(e) {
    e: for (;;) {
        for (; e.sibling === null; ) {
            if (e.return === null || Rc(e.return)) return null;
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
function eo(e, t, n) {
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
                  n != null || t.onclick !== null || (t.onclick = ni)));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (eo(e, t, n), e = e.sibling; e !== null; ) (eo(e, t, n), (e = e.sibling));
}
function to(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (to(e, t, n), e = e.sibling; e !== null; ) (to(e, t, n), (e = e.sibling));
}
var le = null,
    $e = !1;
function st(e, t, n) {
    for (n = n.child; n !== null; ) (Tc(e, t, n), (n = n.sibling));
}
function Tc(e, t, n) {
    if (Xe && typeof Xe.onCommitFiberUnmount == 'function')
        try {
            Xe.onCommitFiberUnmount(ki, n);
        } catch {}
    switch (n.tag) {
        case 5:
            de || ln(n, t);
        case 6:
            var r = le,
                i = $e;
            ((le = null),
                st(e, t, n),
                (le = r),
                ($e = i),
                le !== null &&
                    ($e
                        ? ((e = le),
                          (n = n.stateNode),
                          e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
                        : le.removeChild(n.stateNode)));
            break;
        case 18:
            le !== null &&
                ($e
                    ? ((e = le),
                      (n = n.stateNode),
                      e.nodeType === 8 ? el(e.parentNode, n) : e.nodeType === 1 && el(e, n),
                      bn(e))
                    : el(le, n.stateNode));
            break;
        case 4:
            ((r = le),
                (i = $e),
                (le = n.stateNode.containerInfo),
                ($e = !0),
                st(e, t, n),
                (le = r),
                ($e = i));
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            if (!de && ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))) {
                i = r = r.next;
                do {
                    var l = i,
                        o = l.destroy;
                    ((l = l.tag), o !== void 0 && (l & 2 || l & 4) && ql(n, t, o), (i = i.next));
                } while (i !== r);
            }
            st(e, t, n);
            break;
        case 1:
            if (!de && (ln(n, t), (r = n.stateNode), typeof r.componentWillUnmount == 'function'))
                try {
                    ((r.props = n.memoizedProps),
                        (r.state = n.memoizedState),
                        r.componentWillUnmount());
                } catch (s) {
                    Z(n, t, s);
                }
            st(e, t, n);
            break;
        case 21:
            st(e, t, n);
            break;
        case 22:
            n.mode & 1
                ? ((de = (r = de) || n.memoizedState !== null), st(e, t, n), (de = r))
                : st(e, t, n);
            break;
        default:
            st(e, t, n);
    }
}
function la(e) {
    var t = e.updateQueue;
    if (t !== null) {
        e.updateQueue = null;
        var n = e.stateNode;
        (n === null && (n = e.stateNode = new dp()),
            t.forEach(function (r) {
                var i = kp.bind(null, e, r);
                n.has(r) || (n.add(r), r.then(i, i));
            }));
    }
}
function De(e, t) {
    var n = t.deletions;
    if (n !== null)
        for (var r = 0; r < n.length; r++) {
            var i = n[r];
            try {
                var l = e,
                    o = t,
                    s = o;
                e: for (; s !== null; ) {
                    switch (s.tag) {
                        case 5:
                            ((le = s.stateNode), ($e = !1));
                            break e;
                        case 3:
                            ((le = s.stateNode.containerInfo), ($e = !0));
                            break e;
                        case 4:
                            ((le = s.stateNode.containerInfo), ($e = !0));
                            break e;
                    }
                    s = s.return;
                }
                if (le === null) throw Error(x(160));
                (Tc(l, o, i), (le = null), ($e = !1));
                var a = i.alternate;
                (a !== null && (a.return = null), (i.return = null));
            } catch (u) {
                Z(i, t, u);
            }
        }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) (jc(t, e), (t = t.sibling));
}
function jc(e, t) {
    var n = e.alternate,
        r = e.flags;
    switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            if ((De(t, e), We(e), r & 4)) {
                try {
                    (Bn(3, e, e.return), Ri(3, e));
                } catch (w) {
                    Z(e, e.return, w);
                }
                try {
                    Bn(5, e, e.return);
                } catch (w) {
                    Z(e, e.return, w);
                }
            }
            break;
        case 1:
            (De(t, e), We(e), r & 512 && n !== null && ln(n, n.return));
            break;
        case 5:
            if ((De(t, e), We(e), r & 512 && n !== null && ln(n, n.return), e.flags & 32)) {
                var i = e.stateNode;
                try {
                    Xn(i, '');
                } catch (w) {
                    Z(e, e.return, w);
                }
            }
            if (r & 4 && ((i = e.stateNode), i != null)) {
                var l = e.memoizedProps,
                    o = n !== null ? n.memoizedProps : l,
                    s = e.type,
                    a = e.updateQueue;
                if (((e.updateQueue = null), a !== null))
                    try {
                        (s === 'input' && l.type === 'radio' && l.name != null && eu(i, l),
                            Nl(s, o));
                        var u = Nl(s, l);
                        for (o = 0; o < a.length; o += 2) {
                            var d = a[o],
                                f = a[o + 1];
                            d === 'style'
                                ? lu(i, f)
                                : d === 'dangerouslySetInnerHTML'
                                  ? ru(i, f)
                                  : d === 'children'
                                    ? Xn(i, f)
                                    : yo(i, d, f, u);
                        }
                        switch (s) {
                            case 'input':
                                xl(i, l);
                                break;
                            case 'textarea':
                                tu(i, l);
                                break;
                            case 'select':
                                var g = i._wrapperState.wasMultiple;
                                i._wrapperState.wasMultiple = !!l.multiple;
                                var y = l.value;
                                y != null
                                    ? sn(i, !!l.multiple, y, !1)
                                    : g !== !!l.multiple &&
                                      (l.defaultValue != null
                                          ? sn(i, !!l.multiple, l.defaultValue, !0)
                                          : sn(i, !!l.multiple, l.multiple ? [] : '', !1));
                        }
                        i[ir] = l;
                    } catch (w) {
                        Z(e, e.return, w);
                    }
            }
            break;
        case 6:
            if ((De(t, e), We(e), r & 4)) {
                if (e.stateNode === null) throw Error(x(162));
                ((i = e.stateNode), (l = e.memoizedProps));
                try {
                    i.nodeValue = l;
                } catch (w) {
                    Z(e, e.return, w);
                }
            }
            break;
        case 3:
            if ((De(t, e), We(e), r & 4 && n !== null && n.memoizedState.isDehydrated))
                try {
                    bn(t.containerInfo);
                } catch (w) {
                    Z(e, e.return, w);
                }
            break;
        case 4:
            (De(t, e), We(e));
            break;
        case 13:
            (De(t, e),
                We(e),
                (i = e.child),
                i.flags & 8192 &&
                    ((l = i.memoizedState !== null),
                    (i.stateNode.isHidden = l),
                    !l ||
                        (i.alternate !== null && i.alternate.memoizedState !== null) ||
                        (Zo = J())),
                r & 4 && la(e));
            break;
        case 22:
            if (
                ((d = n !== null && n.memoizedState !== null),
                e.mode & 1 ? ((de = (u = de) || d), De(t, e), (de = u)) : De(t, e),
                We(e),
                r & 8192)
            ) {
                if (
                    ((u = e.memoizedState !== null), (e.stateNode.isHidden = u) && !d && e.mode & 1)
                )
                    for (N = e, d = e.child; d !== null; ) {
                        for (f = N = d; N !== null; ) {
                            switch (((g = N), (y = g.child), g.tag)) {
                                case 0:
                                case 11:
                                case 14:
                                case 15:
                                    Bn(4, g, g.return);
                                    break;
                                case 1:
                                    ln(g, g.return);
                                    var m = g.stateNode;
                                    if (typeof m.componentWillUnmount == 'function') {
                                        ((r = g), (n = g.return));
                                        try {
                                            ((t = r),
                                                (m.props = t.memoizedProps),
                                                (m.state = t.memoizedState),
                                                m.componentWillUnmount());
                                        } catch (w) {
                                            Z(r, n, w);
                                        }
                                    }
                                    break;
                                case 5:
                                    ln(g, g.return);
                                    break;
                                case 22:
                                    if (g.memoizedState !== null) {
                                        sa(f);
                                        continue;
                                    }
                            }
                            y !== null ? ((y.return = g), (N = y)) : sa(f);
                        }
                        d = d.sibling;
                    }
                e: for (d = null, f = e; ; ) {
                    if (f.tag === 5) {
                        if (d === null) {
                            d = f;
                            try {
                                ((i = f.stateNode),
                                    u
                                        ? ((l = i.style),
                                          typeof l.setProperty == 'function'
                                              ? l.setProperty('display', 'none', 'important')
                                              : (l.display = 'none'))
                                        : ((s = f.stateNode),
                                          (a = f.memoizedProps.style),
                                          (o =
                                              a != null && a.hasOwnProperty('display')
                                                  ? a.display
                                                  : null),
                                          (s.style.display = iu('display', o))));
                            } catch (w) {
                                Z(e, e.return, w);
                            }
                        }
                    } else if (f.tag === 6) {
                        if (d === null)
                            try {
                                f.stateNode.nodeValue = u ? '' : f.memoizedProps;
                            } catch (w) {
                                Z(e, e.return, w);
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
                        (d === f && (d = null), (f = f.return));
                    }
                    (d === f && (d = null), (f.sibling.return = f.return), (f = f.sibling));
                }
            }
            break;
        case 19:
            (De(t, e), We(e), r & 4 && la(e));
            break;
        case 21:
            break;
        default:
            (De(t, e), We(e));
    }
}
function We(e) {
    var t = e.flags;
    if (t & 2) {
        try {
            e: {
                for (var n = e.return; n !== null; ) {
                    if (Rc(n)) {
                        var r = n;
                        break e;
                    }
                    n = n.return;
                }
                throw Error(x(160));
            }
            switch (r.tag) {
                case 5:
                    var i = r.stateNode;
                    r.flags & 32 && (Xn(i, ''), (r.flags &= -33));
                    var l = ia(e);
                    to(e, l, i);
                    break;
                case 3:
                case 4:
                    var o = r.stateNode.containerInfo,
                        s = ia(e);
                    eo(e, s, o);
                    break;
                default:
                    throw Error(x(161));
            }
        } catch (a) {
            Z(e, e.return, a);
        }
        e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
}
function hp(e, t, n) {
    ((N = e), zc(e));
}
function zc(e, t, n) {
    for (var r = (e.mode & 1) !== 0; N !== null; ) {
        var i = N,
            l = i.child;
        if (i.tag === 22 && r) {
            var o = i.memoizedState !== null || jr;
            if (!o) {
                var s = i.alternate,
                    a = (s !== null && s.memoizedState !== null) || de;
                s = jr;
                var u = de;
                if (((jr = o), (de = a) && !u))
                    for (N = i; N !== null; )
                        ((o = N),
                            (a = o.child),
                            o.tag === 22 && o.memoizedState !== null
                                ? aa(i)
                                : a !== null
                                  ? ((a.return = o), (N = a))
                                  : aa(i));
                for (; l !== null; ) ((N = l), zc(l), (l = l.sibling));
                ((N = i), (jr = s), (de = u));
            }
            oa(e);
        } else i.subtreeFlags & 8772 && l !== null ? ((l.return = i), (N = l)) : oa(e);
    }
}
function oa(e) {
    for (; N !== null; ) {
        var t = N;
        if (t.flags & 8772) {
            var n = t.alternate;
            try {
                if (t.flags & 8772)
                    switch (t.tag) {
                        case 0:
                        case 11:
                        case 15:
                            de || Ri(5, t);
                            break;
                        case 1:
                            var r = t.stateNode;
                            if (t.flags & 4 && !de)
                                if (n === null) r.componentDidMount();
                                else {
                                    var i =
                                        t.elementType === t.type
                                            ? n.memoizedProps
                                            : Me(t.type, n.memoizedProps);
                                    r.componentDidUpdate(
                                        i,
                                        n.memoizedState,
                                        r.__reactInternalSnapshotBeforeUpdate,
                                    );
                                }
                            var l = t.updateQueue;
                            l !== null && Ks(t, l, r);
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
                                Ks(t, o, n);
                            }
                            break;
                        case 5:
                            var s = t.stateNode;
                            if (n === null && t.flags & 4) {
                                n = s;
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
                                    var d = u.memoizedState;
                                    if (d !== null) {
                                        var f = d.dehydrated;
                                        f !== null && bn(f);
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
                            throw Error(x(163));
                    }
                de || (t.flags & 512 && bl(t));
            } catch (g) {
                Z(t, t.return, g);
            }
        }
        if (t === e) {
            N = null;
            break;
        }
        if (((n = t.sibling), n !== null)) {
            ((n.return = t.return), (N = n));
            break;
        }
        N = t.return;
    }
}
function sa(e) {
    for (; N !== null; ) {
        var t = N;
        if (t === e) {
            N = null;
            break;
        }
        var n = t.sibling;
        if (n !== null) {
            ((n.return = t.return), (N = n));
            break;
        }
        N = t.return;
    }
}
function aa(e) {
    for (; N !== null; ) {
        var t = N;
        try {
            switch (t.tag) {
                case 0:
                case 11:
                case 15:
                    var n = t.return;
                    try {
                        Ri(4, t);
                    } catch (a) {
                        Z(t, n, a);
                    }
                    break;
                case 1:
                    var r = t.stateNode;
                    if (typeof r.componentDidMount == 'function') {
                        var i = t.return;
                        try {
                            r.componentDidMount();
                        } catch (a) {
                            Z(t, i, a);
                        }
                    }
                    var l = t.return;
                    try {
                        bl(t);
                    } catch (a) {
                        Z(t, l, a);
                    }
                    break;
                case 5:
                    var o = t.return;
                    try {
                        bl(t);
                    } catch (a) {
                        Z(t, o, a);
                    }
            }
        } catch (a) {
            Z(t, t.return, a);
        }
        if (t === e) {
            N = null;
            break;
        }
        var s = t.sibling;
        if (s !== null) {
            ((s.return = t.return), (N = s));
            break;
        }
        N = t.return;
    }
}
var gp = Math.ceil,
    pi = ot.ReactCurrentDispatcher,
    Go = ot.ReactCurrentOwner,
    ze = ot.ReactCurrentBatchConfig,
    U = 0,
    ie = null,
    b = null,
    oe = 0,
    Ce = 0,
    on = Nt(0),
    ne = 0,
    cr = null,
    $t = 0,
    Ti = 0,
    Xo = 0,
    Kn = null,
    we = null,
    Zo = 0,
    wn = 1 / 0,
    Je = null,
    hi = !1,
    no = null,
    wt = null,
    zr = !1,
    pt = null,
    gi = 0,
    Wn = 0,
    ro = null,
    Wr = -1,
    Qr = 0;
function ge() {
    return U & 6 ? J() : Wr !== -1 ? Wr : (Wr = J());
}
function xt(e) {
    return e.mode & 1
        ? U & 2 && oe !== 0
            ? oe & -oe
            : qd.transition !== null
              ? (Qr === 0 && (Qr = yu()), Qr)
              : ((e = A), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : Cu(e.type))), e)
        : 1;
}
function Ve(e, t, n, r) {
    if (50 < Wn) throw ((Wn = 0), (ro = null), Error(x(185)));
    (pr(e, n, r),
        (!(U & 2) || e !== ie) &&
            (e === ie && (!(U & 2) && (Ti |= n), ne === 4 && ft(e, oe)),
            Ee(e, r),
            n === 1 && U === 0 && !(t.mode & 1) && ((wn = J() + 500), Pi && Lt())));
}
function Ee(e, t) {
    var n = e.callbackNode;
    qf(e, t);
    var r = qr(e, e === ie ? oe : 0);
    if (r === 0) (n !== null && ys(n), (e.callbackNode = null), (e.callbackPriority = 0));
    else if (((t = r & -r), e.callbackPriority !== t)) {
        if ((n != null && ys(n), t === 1))
            (e.tag === 0 ? Jd(ua.bind(null, e)) : Bu(ua.bind(null, e)),
                Yd(function () {
                    !(U & 6) && Lt();
                }),
                (n = null));
        else {
            switch (vu(r)) {
                case 1:
                    n = ko;
                    break;
                case 4:
                    n = gu;
                    break;
                case 16:
                    n = Jr;
                    break;
                case 536870912:
                    n = mu;
                    break;
                default:
                    n = Jr;
            }
            n = Vc(n, Fc.bind(null, e));
        }
        ((e.callbackPriority = t), (e.callbackNode = n));
    }
}
function Fc(e, t) {
    if (((Wr = -1), (Qr = 0), U & 6)) throw Error(x(327));
    var n = e.callbackNode;
    if (dn() && e.callbackNode !== n) return null;
    var r = qr(e, e === ie ? oe : 0);
    if (r === 0) return null;
    if (r & 30 || r & e.expiredLanes || t) t = mi(e, r);
    else {
        t = r;
        var i = U;
        U |= 2;
        var l = Dc();
        (ie !== e || oe !== t) && ((Je = null), (wn = J() + 500), zt(e, t));
        do
            try {
                vp();
                break;
            } catch (s) {
                Ic(e, s);
            }
        while (!0);
        (Io(), (pi.current = l), (U = i), b !== null ? (t = 0) : ((ie = null), (oe = 0), (t = ne)));
    }
    if (t !== 0) {
        if ((t === 2 && ((i = Rl(e)), i !== 0 && ((r = i), (t = io(e, i)))), t === 1))
            throw ((n = cr), zt(e, 0), ft(e, r), Ee(e, J()), n);
        if (t === 6) ft(e, r);
        else {
            if (
                ((i = e.current.alternate),
                !(r & 30) &&
                    !mp(i) &&
                    ((t = mi(e, r)),
                    t === 2 && ((l = Rl(e)), l !== 0 && ((r = l), (t = io(e, l)))),
                    t === 1))
            )
                throw ((n = cr), zt(e, 0), ft(e, r), Ee(e, J()), n);
            switch (((e.finishedWork = i), (e.finishedLanes = r), t)) {
                case 0:
                case 1:
                    throw Error(x(345));
                case 2:
                    _t(e, we, Je);
                    break;
                case 3:
                    if ((ft(e, r), (r & 130023424) === r && ((t = Zo + 500 - J()), 10 < t))) {
                        if (qr(e, 0) !== 0) break;
                        if (((i = e.suspendedLanes), (i & r) !== r)) {
                            (ge(), (e.pingedLanes |= e.suspendedLanes & i));
                            break;
                        }
                        e.timeoutHandle = $l(_t.bind(null, e, we, Je), t);
                        break;
                    }
                    _t(e, we, Je);
                    break;
                case 4:
                    if ((ft(e, r), (r & 4194240) === r)) break;
                    for (t = e.eventTimes, i = -1; 0 < r; ) {
                        var o = 31 - Ae(r);
                        ((l = 1 << o), (o = t[o]), o > i && (i = o), (r &= ~l));
                    }
                    if (
                        ((r = i),
                        (r = J() - r),
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
                                          : 1960 * gp(r / 1960)) - r),
                        10 < r)
                    ) {
                        e.timeoutHandle = $l(_t.bind(null, e, we, Je), r);
                        break;
                    }
                    _t(e, we, Je);
                    break;
                case 5:
                    _t(e, we, Je);
                    break;
                default:
                    throw Error(x(329));
            }
        }
    }
    return (Ee(e, J()), e.callbackNode === n ? Fc.bind(null, e) : null);
}
function io(e, t) {
    var n = Kn;
    return (
        e.current.memoizedState.isDehydrated && (zt(e, t).flags |= 256),
        (e = mi(e, t)),
        e !== 2 && ((t = we), (we = n), t !== null && lo(t)),
        e
    );
}
function lo(e) {
    we === null ? (we = e) : we.push.apply(we, e);
}
function mp(e) {
    for (var t = e; ; ) {
        if (t.flags & 16384) {
            var n = t.updateQueue;
            if (n !== null && ((n = n.stores), n !== null))
                for (var r = 0; r < n.length; r++) {
                    var i = n[r],
                        l = i.getSnapshot;
                    i = i.value;
                    try {
                        if (!He(l(), i)) return !1;
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
function ft(e, t) {
    for (
        t &= ~Xo, t &= ~Ti, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes;
        0 < t;
    ) {
        var n = 31 - Ae(t),
            r = 1 << n;
        ((e[n] = -1), (t &= ~r));
    }
}
function ua(e) {
    if (U & 6) throw Error(x(327));
    dn();
    var t = qr(e, 0);
    if (!(t & 1)) return (Ee(e, J()), null);
    var n = mi(e, t);
    if (e.tag !== 0 && n === 2) {
        var r = Rl(e);
        r !== 0 && ((t = r), (n = io(e, r)));
    }
    if (n === 1) throw ((n = cr), zt(e, 0), ft(e, t), Ee(e, J()), n);
    if (n === 6) throw Error(x(345));
    return (
        (e.finishedWork = e.current.alternate),
        (e.finishedLanes = t),
        _t(e, we, Je),
        Ee(e, J()),
        null
    );
}
function Jo(e, t) {
    var n = U;
    U |= 1;
    try {
        return e(t);
    } finally {
        ((U = n), U === 0 && ((wn = J() + 500), Pi && Lt()));
    }
}
function Ut(e) {
    pt !== null && pt.tag === 0 && !(U & 6) && dn();
    var t = U;
    U |= 1;
    var n = ze.transition,
        r = A;
    try {
        if (((ze.transition = null), (A = 1), e)) return e();
    } finally {
        ((A = r), (ze.transition = n), (U = t), !(U & 6) && Lt());
    }
}
function qo() {
    ((Ce = on.current), K(on));
}
function zt(e, t) {
    ((e.finishedWork = null), (e.finishedLanes = 0));
    var n = e.timeoutHandle;
    if ((n !== -1 && ((e.timeoutHandle = -1), Qd(n)), b !== null))
        for (n = b.return; n !== null; ) {
            var r = n;
            switch ((jo(r), r.tag)) {
                case 1:
                    ((r = r.type.childContextTypes), r != null && ri());
                    break;
                case 3:
                    (yn(), K(Se), K(pe), Vo());
                    break;
                case 5:
                    Ao(r);
                    break;
                case 4:
                    yn();
                    break;
                case 13:
                    K(Q);
                    break;
                case 19:
                    K(Q);
                    break;
                case 10:
                    Do(r.type._context);
                    break;
                case 22:
                case 23:
                    qo();
            }
            n = n.return;
        }
    if (
        ((ie = e),
        (b = e = St(e.current, null)),
        (oe = Ce = t),
        (ne = 0),
        (cr = null),
        (Xo = Ti = $t = 0),
        (we = Kn = null),
        Tt !== null)
    ) {
        for (t = 0; t < Tt.length; t++)
            if (((n = Tt[t]), (r = n.interleaved), r !== null)) {
                n.interleaved = null;
                var i = r.next,
                    l = n.pending;
                if (l !== null) {
                    var o = l.next;
                    ((l.next = i), (r.next = o));
                }
                n.pending = r;
            }
        Tt = null;
    }
    return e;
}
function Ic(e, t) {
    do {
        var n = b;
        try {
            if ((Io(), (Hr.current = di), fi)) {
                for (var r = Y.memoizedState; r !== null; ) {
                    var i = r.queue;
                    (i !== null && (i.pending = null), (r = r.next));
                }
                fi = !1;
            }
            if (
                ((Mt = 0),
                (re = te = Y = null),
                (Hn = !1),
                (sr = 0),
                (Go.current = null),
                n === null || n.return === null)
            ) {
                ((ne = 1), (cr = t), (b = null));
                break;
            }
            e: {
                var l = e,
                    o = n.return,
                    s = n,
                    a = t;
                if (
                    ((t = oe),
                    (s.flags |= 32768),
                    a !== null && typeof a == 'object' && typeof a.then == 'function')
                ) {
                    var u = a,
                        d = s,
                        f = d.tag;
                    if (!(d.mode & 1) && (f === 0 || f === 11 || f === 15)) {
                        var g = d.alternate;
                        g
                            ? ((d.updateQueue = g.updateQueue),
                              (d.memoizedState = g.memoizedState),
                              (d.lanes = g.lanes))
                            : ((d.updateQueue = null), (d.memoizedState = null));
                    }
                    var y = Zs(o);
                    if (y !== null) {
                        ((y.flags &= -257),
                            Js(y, o, s, l, t),
                            y.mode & 1 && Xs(l, u, t),
                            (t = y),
                            (a = u));
                        var m = t.updateQueue;
                        if (m === null) {
                            var w = new Set();
                            (w.add(a), (t.updateQueue = w));
                        } else m.add(a);
                        break e;
                    } else {
                        if (!(t & 1)) {
                            (Xs(l, u, t), bo());
                            break e;
                        }
                        a = Error(x(426));
                    }
                } else if (W && s.mode & 1) {
                    var T = Zs(o);
                    if (T !== null) {
                        (!(T.flags & 65536) && (T.flags |= 256), Js(T, o, s, l, t), zo(vn(a, s)));
                        break e;
                    }
                }
                ((l = a = vn(a, s)),
                    ne !== 4 && (ne = 2),
                    Kn === null ? (Kn = [l]) : Kn.push(l),
                    (l = o));
                do {
                    switch (l.tag) {
                        case 3:
                            ((l.flags |= 65536), (t &= -t), (l.lanes |= t));
                            var p = vc(l, a, t);
                            Bs(l, p);
                            break e;
                        case 1:
                            s = a;
                            var c = l.type,
                                h = l.stateNode;
                            if (
                                !(l.flags & 128) &&
                                (typeof c.getDerivedStateFromError == 'function' ||
                                    (h !== null &&
                                        typeof h.componentDidCatch == 'function' &&
                                        (wt === null || !wt.has(h))))
                            ) {
                                ((l.flags |= 65536), (t &= -t), (l.lanes |= t));
                                var v = wc(l, s, t);
                                Bs(l, v);
                                break e;
                            }
                    }
                    l = l.return;
                } while (l !== null);
            }
            $c(n);
        } catch (S) {
            ((t = S), b === n && n !== null && (b = n = n.return));
            continue;
        }
        break;
    } while (!0);
}
function Dc() {
    var e = pi.current;
    return ((pi.current = di), e === null ? di : e);
}
function bo() {
    ((ne === 0 || ne === 3 || ne === 2) && (ne = 4),
        ie === null || (!($t & 268435455) && !(Ti & 268435455)) || ft(ie, oe));
}
function mi(e, t) {
    var n = U;
    U |= 2;
    var r = Dc();
    (ie !== e || oe !== t) && ((Je = null), zt(e, t));
    do
        try {
            yp();
            break;
        } catch (i) {
            Ic(e, i);
        }
    while (!0);
    if ((Io(), (U = n), (pi.current = r), b !== null)) throw Error(x(261));
    return ((ie = null), (oe = 0), ne);
}
function yp() {
    for (; b !== null; ) Mc(b);
}
function vp() {
    for (; b !== null && !Bf(); ) Mc(b);
}
function Mc(e) {
    var t = Ac(e.alternate, e, Ce);
    ((e.memoizedProps = e.pendingProps), t === null ? $c(e) : (b = t), (Go.current = null));
}
function $c(e) {
    var t = e;
    do {
        var n = t.alternate;
        if (((e = t.return), t.flags & 32768)) {
            if (((n = fp(n, t)), n !== null)) {
                ((n.flags &= 32767), (b = n));
                return;
            }
            if (e !== null) ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
            else {
                ((ne = 6), (b = null));
                return;
            }
        } else if (((n = cp(n, t, Ce)), n !== null)) {
            b = n;
            return;
        }
        if (((t = t.sibling), t !== null)) {
            b = t;
            return;
        }
        b = t = e;
    } while (t !== null);
    ne === 0 && (ne = 5);
}
function _t(e, t, n) {
    var r = A,
        i = ze.transition;
    try {
        ((ze.transition = null), (A = 1), wp(e, t, n, r));
    } finally {
        ((ze.transition = i), (A = r));
    }
    return null;
}
function wp(e, t, n, r) {
    do dn();
    while (pt !== null);
    if (U & 6) throw Error(x(327));
    n = e.finishedWork;
    var i = e.finishedLanes;
    if (n === null) return null;
    if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current)) throw Error(x(177));
    ((e.callbackNode = null), (e.callbackPriority = 0));
    var l = n.lanes | n.childLanes;
    if (
        (bf(e, l),
        e === ie && ((b = ie = null), (oe = 0)),
        (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
            zr ||
            ((zr = !0),
            Vc(Jr, function () {
                return (dn(), null);
            })),
        (l = (n.flags & 15990) !== 0),
        n.subtreeFlags & 15990 || l)
    ) {
        ((l = ze.transition), (ze.transition = null));
        var o = A;
        A = 1;
        var s = U;
        ((U |= 4),
            (Go.current = null),
            pp(e, n),
            jc(n, e),
            Ud(Dl),
            (br = !!Il),
            (Dl = Il = null),
            (e.current = n),
            hp(n),
            Kf(),
            (U = s),
            (A = o),
            (ze.transition = l));
    } else e.current = n;
    if (
        (zr && ((zr = !1), (pt = e), (gi = i)),
        (l = e.pendingLanes),
        l === 0 && (wt = null),
        Yf(n.stateNode),
        Ee(e, J()),
        t !== null)
    )
        for (r = e.onRecoverableError, n = 0; n < t.length; n++)
            ((i = t[n]), r(i.value, { componentStack: i.stack, digest: i.digest }));
    if (hi) throw ((hi = !1), (e = no), (no = null), e);
    return (
        gi & 1 && e.tag !== 0 && dn(),
        (l = e.pendingLanes),
        l & 1 ? (e === ro ? Wn++ : ((Wn = 0), (ro = e))) : (Wn = 0),
        Lt(),
        null
    );
}
function dn() {
    if (pt !== null) {
        var e = vu(gi),
            t = ze.transition,
            n = A;
        try {
            if (((ze.transition = null), (A = 16 > e ? 16 : e), pt === null)) var r = !1;
            else {
                if (((e = pt), (pt = null), (gi = 0), U & 6)) throw Error(x(331));
                var i = U;
                for (U |= 4, N = e.current; N !== null; ) {
                    var l = N,
                        o = l.child;
                    if (N.flags & 16) {
                        var s = l.deletions;
                        if (s !== null) {
                            for (var a = 0; a < s.length; a++) {
                                var u = s[a];
                                for (N = u; N !== null; ) {
                                    var d = N;
                                    switch (d.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            Bn(8, d, l);
                                    }
                                    var f = d.child;
                                    if (f !== null) ((f.return = d), (N = f));
                                    else
                                        for (; N !== null; ) {
                                            d = N;
                                            var g = d.sibling,
                                                y = d.return;
                                            if ((_c(d), d === u)) {
                                                N = null;
                                                break;
                                            }
                                            if (g !== null) {
                                                ((g.return = y), (N = g));
                                                break;
                                            }
                                            N = y;
                                        }
                                }
                            }
                            var m = l.alternate;
                            if (m !== null) {
                                var w = m.child;
                                if (w !== null) {
                                    m.child = null;
                                    do {
                                        var T = w.sibling;
                                        ((w.sibling = null), (w = T));
                                    } while (w !== null);
                                }
                            }
                            N = l;
                        }
                    }
                    if (l.subtreeFlags & 2064 && o !== null) ((o.return = l), (N = o));
                    else
                        e: for (; N !== null; ) {
                            if (((l = N), l.flags & 2048))
                                switch (l.tag) {
                                    case 0:
                                    case 11:
                                    case 15:
                                        Bn(9, l, l.return);
                                }
                            var p = l.sibling;
                            if (p !== null) {
                                ((p.return = l.return), (N = p));
                                break e;
                            }
                            N = l.return;
                        }
                }
                var c = e.current;
                for (N = c; N !== null; ) {
                    o = N;
                    var h = o.child;
                    if (o.subtreeFlags & 2064 && h !== null) ((h.return = o), (N = h));
                    else
                        e: for (o = c; N !== null; ) {
                            if (((s = N), s.flags & 2048))
                                try {
                                    switch (s.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            Ri(9, s);
                                    }
                                } catch (S) {
                                    Z(s, s.return, S);
                                }
                            if (s === o) {
                                N = null;
                                break e;
                            }
                            var v = s.sibling;
                            if (v !== null) {
                                ((v.return = s.return), (N = v));
                                break e;
                            }
                            N = s.return;
                        }
                }
                if (((U = i), Lt(), Xe && typeof Xe.onPostCommitFiberRoot == 'function'))
                    try {
                        Xe.onPostCommitFiberRoot(ki, e);
                    } catch {}
                r = !0;
            }
            return r;
        } finally {
            ((A = n), (ze.transition = t));
        }
    }
    return !1;
}
function ca(e, t, n) {
    ((t = vn(n, t)),
        (t = vc(e, t, 1)),
        (e = vt(e, t, 1)),
        (t = ge()),
        e !== null && (pr(e, 1, t), Ee(e, t)));
}
function Z(e, t, n) {
    if (e.tag === 3) ca(e, e, n);
    else
        for (; t !== null; ) {
            if (t.tag === 3) {
                ca(t, e, n);
                break;
            } else if (t.tag === 1) {
                var r = t.stateNode;
                if (
                    typeof t.type.getDerivedStateFromError == 'function' ||
                    (typeof r.componentDidCatch == 'function' && (wt === null || !wt.has(r)))
                ) {
                    ((e = vn(n, e)),
                        (e = wc(t, e, 1)),
                        (t = vt(t, e, 1)),
                        (e = ge()),
                        t !== null && (pr(t, 1, e), Ee(t, e)));
                    break;
                }
            }
            t = t.return;
        }
}
function xp(e, t, n) {
    var r = e.pingCache;
    (r !== null && r.delete(t),
        (t = ge()),
        (e.pingedLanes |= e.suspendedLanes & n),
        ie === e &&
            (oe & n) === n &&
            (ne === 4 || (ne === 3 && (oe & 130023424) === oe && 500 > J() - Zo)
                ? zt(e, 0)
                : (Xo |= n)),
        Ee(e, t));
}
function Uc(e, t) {
    t === 0 && (e.mode & 1 ? ((t = Er), (Er <<= 1), !(Er & 130023424) && (Er = 4194304)) : (t = 1));
    var n = ge();
    ((e = it(e, t)), e !== null && (pr(e, t, n), Ee(e, n)));
}
function Sp(e) {
    var t = e.memoizedState,
        n = 0;
    (t !== null && (n = t.retryLane), Uc(e, n));
}
function kp(e, t) {
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
            throw Error(x(314));
    }
    (r !== null && r.delete(t), Uc(e, n));
}
var Ac;
Ac = function (e, t, n) {
    if (e !== null)
        if (e.memoizedProps !== t.pendingProps || Se.current) xe = !0;
        else {
            if (!(e.lanes & n) && !(t.flags & 128)) return ((xe = !1), up(e, t, n));
            xe = !!(e.flags & 131072);
        }
    else ((xe = !1), W && t.flags & 1048576 && Ku(t, oi, t.index));
    switch (((t.lanes = 0), t.tag)) {
        case 2:
            var r = t.type;
            (Kr(e, t), (e = t.pendingProps));
            var i = hn(t, pe.current);
            (fn(t, n), (i = Bo(null, t, r, e, i, n)));
            var l = Ko();
            return (
                (t.flags |= 1),
                typeof i == 'object' &&
                i !== null &&
                typeof i.render == 'function' &&
                i.$$typeof === void 0
                    ? ((t.tag = 1),
                      (t.memoizedState = null),
                      (t.updateQueue = null),
                      ke(r) ? ((l = !0), ii(t)) : (l = !1),
                      (t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null),
                      $o(t),
                      (i.updater = _i),
                      (t.stateNode = i),
                      (i._reactInternals = t),
                      Wl(t, r, e, n),
                      (t = Gl(null, t, r, !0, l, n)))
                    : ((t.tag = 0), W && l && To(t), he(null, t, i, n), (t = t.child)),
                t
            );
        case 16:
            r = t.elementType;
            e: {
                switch (
                    (Kr(e, t),
                    (e = t.pendingProps),
                    (i = r._init),
                    (r = i(r._payload)),
                    (t.type = r),
                    (i = t.tag = Cp(r)),
                    (e = Me(r, e)),
                    i)
                ) {
                    case 0:
                        t = Yl(null, t, r, e, n);
                        break e;
                    case 1:
                        t = ea(null, t, r, e, n);
                        break e;
                    case 11:
                        t = qs(null, t, r, e, n);
                        break e;
                    case 14:
                        t = bs(null, t, r, Me(r.type, e), n);
                        break e;
                }
                throw Error(x(306, r, ''));
            }
            return t;
        case 0:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Me(r, i)),
                Yl(e, t, r, i, n)
            );
        case 1:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Me(r, i)),
                ea(e, t, r, i, n)
            );
        case 3:
            e: {
                if ((Ec(t), e === null)) throw Error(x(387));
                ((r = t.pendingProps),
                    (l = t.memoizedState),
                    (i = l.element),
                    Zu(e, t),
                    ui(t, r, null, n));
                var o = t.memoizedState;
                if (((r = o.element), l.isDehydrated))
                    if (
                        ((l = {
                            element: r,
                            isDehydrated: !1,
                            cache: o.cache,
                            pendingSuspenseBoundaries: o.pendingSuspenseBoundaries,
                            transitions: o.transitions,
                        }),
                        (t.updateQueue.baseState = l),
                        (t.memoizedState = l),
                        t.flags & 256)
                    ) {
                        ((i = vn(Error(x(423)), t)), (t = ta(e, t, r, n, i)));
                        break e;
                    } else if (r !== i) {
                        ((i = vn(Error(x(424)), t)), (t = ta(e, t, r, n, i)));
                        break e;
                    } else
                        for (
                            Ne = yt(t.stateNode.containerInfo.firstChild),
                                Le = t,
                                W = !0,
                                Ue = null,
                                n = Gu(t, null, r, n),
                                t.child = n;
                            n;
                        )
                            ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
                else {
                    if ((gn(), r === i)) {
                        t = lt(e, t, n);
                        break e;
                    }
                    he(e, t, r, n);
                }
                t = t.child;
            }
            return t;
        case 5:
            return (
                Ju(t),
                e === null && Hl(t),
                (r = t.type),
                (i = t.pendingProps),
                (l = e !== null ? e.memoizedProps : null),
                (o = i.children),
                Ml(r, i) ? (o = null) : l !== null && Ml(r, l) && (t.flags |= 32),
                kc(e, t),
                he(e, t, o, n),
                t.child
            );
        case 6:
            return (e === null && Hl(t), null);
        case 13:
            return Cc(e, t, n);
        case 4:
            return (
                Uo(t, t.stateNode.containerInfo),
                (r = t.pendingProps),
                e === null ? (t.child = mn(t, null, r, n)) : he(e, t, r, n),
                t.child
            );
        case 11:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Me(r, i)),
                qs(e, t, r, i, n)
            );
        case 7:
            return (he(e, t, t.pendingProps, n), t.child);
        case 8:
            return (he(e, t, t.pendingProps.children, n), t.child);
        case 12:
            return (he(e, t, t.pendingProps.children, n), t.child);
        case 10:
            e: {
                if (
                    ((r = t.type._context),
                    (i = t.pendingProps),
                    (l = t.memoizedProps),
                    (o = i.value),
                    H(si, r._currentValue),
                    (r._currentValue = o),
                    l !== null)
                )
                    if (He(l.value, o)) {
                        if (l.children === i.children && !Se.current) {
                            t = lt(e, t, n);
                            break e;
                        }
                    } else
                        for (l = t.child, l !== null && (l.return = t); l !== null; ) {
                            var s = l.dependencies;
                            if (s !== null) {
                                o = l.child;
                                for (var a = s.firstContext; a !== null; ) {
                                    if (a.context === r) {
                                        if (l.tag === 1) {
                                            ((a = tt(-1, n & -n)), (a.tag = 2));
                                            var u = l.updateQueue;
                                            if (u !== null) {
                                                u = u.shared;
                                                var d = u.pending;
                                                (d === null
                                                    ? (a.next = a)
                                                    : ((a.next = d.next), (d.next = a)),
                                                    (u.pending = a));
                                            }
                                        }
                                        ((l.lanes |= n),
                                            (a = l.alternate),
                                            a !== null && (a.lanes |= n),
                                            Bl(l.return, n, t),
                                            (s.lanes |= n));
                                        break;
                                    }
                                    a = a.next;
                                }
                            } else if (l.tag === 10) o = l.type === t.type ? null : l.child;
                            else if (l.tag === 18) {
                                if (((o = l.return), o === null)) throw Error(x(341));
                                ((o.lanes |= n),
                                    (s = o.alternate),
                                    s !== null && (s.lanes |= n),
                                    Bl(o, n, t),
                                    (o = l.sibling));
                            } else o = l.child;
                            if (o !== null) o.return = l;
                            else
                                for (o = l; o !== null; ) {
                                    if (o === t) {
                                        o = null;
                                        break;
                                    }
                                    if (((l = o.sibling), l !== null)) {
                                        ((l.return = o.return), (o = l));
                                        break;
                                    }
                                    o = o.return;
                                }
                            l = o;
                        }
                (he(e, t, i.children, n), (t = t.child));
            }
            return t;
        case 9:
            return (
                (i = t.type),
                (r = t.pendingProps.children),
                fn(t, n),
                (i = Fe(i)),
                (r = r(i)),
                (t.flags |= 1),
                he(e, t, r, n),
                t.child
            );
        case 14:
            return (
                (r = t.type),
                (i = Me(r, t.pendingProps)),
                (i = Me(r.type, i)),
                bs(e, t, r, i, n)
            );
        case 15:
            return xc(e, t, t.type, t.pendingProps, n);
        case 17:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Me(r, i)),
                Kr(e, t),
                (t.tag = 1),
                ke(r) ? ((e = !0), ii(t)) : (e = !1),
                fn(t, n),
                yc(t, r, i),
                Wl(t, r, i, n),
                Gl(null, t, r, !0, e, n)
            );
        case 19:
            return Nc(e, t, n);
        case 22:
            return Sc(e, t, n);
    }
    throw Error(x(156, t.tag));
};
function Vc(e, t) {
    return hu(e, t);
}
function Ep(e, t, n, r) {
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
function je(e, t, n, r) {
    return new Ep(e, t, n, r);
}
function es(e) {
    return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function Cp(e) {
    if (typeof e == 'function') return es(e) ? 1 : 0;
    if (e != null) {
        if (((e = e.$$typeof), e === wo)) return 11;
        if (e === xo) return 14;
    }
    return 2;
}
function St(e, t) {
    var n = e.alternate;
    return (
        n === null
            ? ((n = je(e.tag, t, e.key, e.mode)),
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
function Yr(e, t, n, r, i, l) {
    var o = 2;
    if (((r = e), typeof e == 'function')) es(e) && (o = 1);
    else if (typeof e == 'string') o = 5;
    else
        e: switch (e) {
            case Xt:
                return Ft(n.children, i, l, t);
            case vo:
                ((o = 8), (i |= 8));
                break;
            case gl:
                return ((e = je(12, n, t, i | 2)), (e.elementType = gl), (e.lanes = l), e);
            case ml:
                return ((e = je(13, n, t, i)), (e.elementType = ml), (e.lanes = l), e);
            case yl:
                return ((e = je(19, n, t, i)), (e.elementType = yl), (e.lanes = l), e);
            case Ja:
                return ji(n, i, l, t);
            default:
                if (typeof e == 'object' && e !== null)
                    switch (e.$$typeof) {
                        case Xa:
                            o = 10;
                            break e;
                        case Za:
                            o = 9;
                            break e;
                        case wo:
                            o = 11;
                            break e;
                        case xo:
                            o = 14;
                            break e;
                        case at:
                            ((o = 16), (r = null));
                            break e;
                    }
                throw Error(x(130, e == null ? e : typeof e, ''));
        }
    return ((t = je(o, n, t, i)), (t.elementType = e), (t.type = r), (t.lanes = l), t);
}
function Ft(e, t, n, r) {
    return ((e = je(7, e, r, t)), (e.lanes = n), e);
}
function ji(e, t, n, r) {
    return (
        (e = je(22, e, r, t)),
        (e.elementType = Ja),
        (e.lanes = n),
        (e.stateNode = { isHidden: !1 }),
        e
    );
}
function al(e, t, n) {
    return ((e = je(6, e, null, t)), (e.lanes = n), e);
}
function ul(e, t, n) {
    return (
        (t = je(4, e.children !== null ? e.children : [], e.key, t)),
        (t.lanes = n),
        (t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation,
        }),
        t
    );
}
function Np(e, t, n, r, i) {
    ((this.tag = t),
        (this.containerInfo = e),
        (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode = this.pendingContext = this.context = null),
        (this.callbackPriority = 0),
        (this.eventTimes = Bi(0)),
        (this.expirationTimes = Bi(-1)),
        (this.entangledLanes =
            this.finishedLanes =
            this.mutableReadLanes =
            this.expiredLanes =
            this.pingedLanes =
            this.suspendedLanes =
            this.pendingLanes =
                0),
        (this.entanglements = Bi(0)),
        (this.identifierPrefix = r),
        (this.onRecoverableError = i),
        (this.mutableSourceEagerHydrationData = null));
}
function ts(e, t, n, r, i, l, o, s, a) {
    return (
        (e = new Np(e, t, n, s, a)),
        t === 1 ? ((t = 1), l === !0 && (t |= 8)) : (t = 0),
        (l = je(3, null, null, t)),
        (e.current = l),
        (l.stateNode = e),
        (l.memoizedState = {
            element: r,
            isDehydrated: n,
            cache: null,
            transitions: null,
            pendingSuspenseBoundaries: null,
        }),
        $o(l),
        e
    );
}
function Lp(e, t, n) {
    var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
        $$typeof: Gt,
        key: r == null ? null : '' + r,
        children: e,
        containerInfo: t,
        implementation: n,
    };
}
function Hc(e) {
    if (!e) return Et;
    e = e._reactInternals;
    e: {
        if (Ht(e) !== e || e.tag !== 1) throw Error(x(170));
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
        throw Error(x(171));
    }
    if (e.tag === 1) {
        var n = e.type;
        if (ke(n)) return Hu(e, n, t);
    }
    return t;
}
function Bc(e, t, n, r, i, l, o, s, a) {
    return (
        (e = ts(n, r, !0, e, i, l, o, s, a)),
        (e.context = Hc(null)),
        (n = e.current),
        (r = ge()),
        (i = xt(n)),
        (l = tt(r, i)),
        (l.callback = t ?? null),
        vt(n, l, i),
        (e.current.lanes = i),
        pr(e, i, r),
        Ee(e, r),
        e
    );
}
function zi(e, t, n, r) {
    var i = t.current,
        l = ge(),
        o = xt(i);
    return (
        (n = Hc(n)),
        t.context === null ? (t.context = n) : (t.pendingContext = n),
        (t = tt(l, o)),
        (t.payload = { element: e }),
        (r = r === void 0 ? null : r),
        r !== null && (t.callback = r),
        (e = vt(i, t, o)),
        e !== null && (Ve(e, i, o, l), Vr(e, i, o)),
        o
    );
}
function yi(e) {
    if (((e = e.current), !e.child)) return null;
    switch (e.child.tag) {
        case 5:
            return e.child.stateNode;
        default:
            return e.child.stateNode;
    }
}
function fa(e, t) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
    }
}
function ns(e, t) {
    (fa(e, t), (e = e.alternate) && fa(e, t));
}
function Pp() {
    return null;
}
var Kc =
    typeof reportError == 'function'
        ? reportError
        : function (e) {
              console.error(e);
          };
function rs(e) {
    this._internalRoot = e;
}
Fi.prototype.render = rs.prototype.render = function (e) {
    var t = this._internalRoot;
    if (t === null) throw Error(x(409));
    zi(e, t, null, null);
};
Fi.prototype.unmount = rs.prototype.unmount = function () {
    var e = this._internalRoot;
    if (e !== null) {
        this._internalRoot = null;
        var t = e.containerInfo;
        (Ut(function () {
            zi(null, e, null, null);
        }),
            (t[rt] = null));
    }
};
function Fi(e) {
    this._internalRoot = e;
}
Fi.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
        var t = Su();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < ct.length && t !== 0 && t < ct[n].priority; n++);
        (ct.splice(n, 0, e), n === 0 && Eu(e));
    }
};
function is(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function Ii(e) {
    return !(
        !e ||
        (e.nodeType !== 1 &&
            e.nodeType !== 9 &&
            e.nodeType !== 11 &&
            (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
    );
}
function da() {}
function Op(e, t, n, r, i) {
    if (i) {
        if (typeof r == 'function') {
            var l = r;
            r = function () {
                var u = yi(o);
                l.call(u);
            };
        }
        var o = Bc(t, r, e, 0, null, !1, !1, '', da);
        return (
            (e._reactRootContainer = o),
            (e[rt] = o.current),
            nr(e.nodeType === 8 ? e.parentNode : e),
            Ut(),
            o
        );
    }
    for (; (i = e.lastChild); ) e.removeChild(i);
    if (typeof r == 'function') {
        var s = r;
        r = function () {
            var u = yi(a);
            s.call(u);
        };
    }
    var a = ts(e, 0, !1, null, null, !1, !1, '', da);
    return (
        (e._reactRootContainer = a),
        (e[rt] = a.current),
        nr(e.nodeType === 8 ? e.parentNode : e),
        Ut(function () {
            zi(t, a, n, r);
        }),
        a
    );
}
function Di(e, t, n, r, i) {
    var l = n._reactRootContainer;
    if (l) {
        var o = l;
        if (typeof i == 'function') {
            var s = i;
            i = function () {
                var a = yi(o);
                s.call(a);
            };
        }
        zi(t, o, e, i);
    } else o = Op(n, t, e, i, r);
    return yi(o);
}
wu = function (e) {
    switch (e.tag) {
        case 3:
            var t = e.stateNode;
            if (t.current.memoizedState.isDehydrated) {
                var n = In(t.pendingLanes);
                n !== 0 && (Eo(t, n | 1), Ee(t, J()), !(U & 6) && ((wn = J() + 500), Lt()));
            }
            break;
        case 13:
            (Ut(function () {
                var r = it(e, 1);
                if (r !== null) {
                    var i = ge();
                    Ve(r, e, 1, i);
                }
            }),
                ns(e, 1));
    }
};
Co = function (e) {
    if (e.tag === 13) {
        var t = it(e, 134217728);
        if (t !== null) {
            var n = ge();
            Ve(t, e, 134217728, n);
        }
        ns(e, 134217728);
    }
};
xu = function (e) {
    if (e.tag === 13) {
        var t = xt(e),
            n = it(e, t);
        if (n !== null) {
            var r = ge();
            Ve(n, e, t, r);
        }
        ns(e, t);
    }
};
Su = function () {
    return A;
};
ku = function (e, t) {
    var n = A;
    try {
        return ((A = e), t());
    } finally {
        A = n;
    }
};
Pl = function (e, t, n) {
    switch (t) {
        case 'input':
            if ((xl(e, n), (t = n.name), n.type === 'radio' && t != null)) {
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
                        var i = Li(r);
                        if (!i) throw Error(x(90));
                        (ba(r), xl(r, i));
                    }
                }
            }
            break;
        case 'textarea':
            tu(e, n);
            break;
        case 'select':
            ((t = n.value), t != null && sn(e, !!n.multiple, t, !1));
    }
};
au = Jo;
uu = Ut;
var _p = { usingClientEntryPoint: !1, Events: [gr, bt, Li, ou, su, Jo] },
    Tn = {
        findFiberByHostInstance: Rt,
        bundleType: 0,
        version: '18.3.1',
        rendererPackageName: 'react-dom',
    },
    Rp = {
        bundleType: Tn.bundleType,
        version: Tn.version,
        rendererPackageName: Tn.rendererPackageName,
        rendererConfig: Tn.rendererConfig,
        overrideHookState: null,
        overrideHookStateDeletePath: null,
        overrideHookStateRenamePath: null,
        overrideProps: null,
        overridePropsDeletePath: null,
        overridePropsRenamePath: null,
        setErrorHandler: null,
        setSuspenseHandler: null,
        scheduleUpdate: null,
        currentDispatcherRef: ot.ReactCurrentDispatcher,
        findHostInstanceByFiber: function (e) {
            return ((e = du(e)), e === null ? null : e.stateNode);
        },
        findFiberByHostInstance: Tn.findFiberByHostInstance || Pp,
        findHostInstancesForRefresh: null,
        scheduleRefresh: null,
        scheduleRoot: null,
        setRefreshHandler: null,
        getCurrentFiber: null,
        reconcilerVersion: '18.3.1-next-f1338f8080-20240426',
    };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
    var Fr = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Fr.isDisabled && Fr.supportsFiber)
        try {
            ((ki = Fr.inject(Rp)), (Xe = Fr));
        } catch {}
}
Oe.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = _p;
Oe.createPortal = function (e, t) {
    var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!is(t)) throw Error(x(200));
    return Lp(e, t, null, n);
};
Oe.createRoot = function (e, t) {
    if (!is(e)) throw Error(x(299));
    var n = !1,
        r = '',
        i = Kc;
    return (
        t != null &&
            (t.unstable_strictMode === !0 && (n = !0),
            t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
            t.onRecoverableError !== void 0 && (i = t.onRecoverableError)),
        (t = ts(e, 1, !1, null, null, n, !1, r, i)),
        (e[rt] = t.current),
        nr(e.nodeType === 8 ? e.parentNode : e),
        new rs(t)
    );
};
Oe.findDOMNode = function (e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
        throw typeof e.render == 'function'
            ? Error(x(188))
            : ((e = Object.keys(e).join(',')), Error(x(268, e)));
    return ((e = du(t)), (e = e === null ? null : e.stateNode), e);
};
Oe.flushSync = function (e) {
    return Ut(e);
};
Oe.hydrate = function (e, t, n) {
    if (!Ii(t)) throw Error(x(200));
    return Di(null, e, t, !0, n);
};
Oe.hydrateRoot = function (e, t, n) {
    if (!is(e)) throw Error(x(405));
    var r = (n != null && n.hydratedSources) || null,
        i = !1,
        l = '',
        o = Kc;
    if (
        (n != null &&
            (n.unstable_strictMode === !0 && (i = !0),
            n.identifierPrefix !== void 0 && (l = n.identifierPrefix),
            n.onRecoverableError !== void 0 && (o = n.onRecoverableError)),
        (t = Bc(t, null, e, 1, n ?? null, i, !1, l, o)),
        (e[rt] = t.current),
        nr(e),
        r)
    )
        for (e = 0; e < r.length; e++)
            ((n = r[e]),
                (i = n._getVersion),
                (i = i(n._source)),
                t.mutableSourceEagerHydrationData == null
                    ? (t.mutableSourceEagerHydrationData = [n, i])
                    : t.mutableSourceEagerHydrationData.push(n, i));
    return new Fi(t);
};
Oe.render = function (e, t, n) {
    if (!Ii(t)) throw Error(x(200));
    return Di(null, e, t, !1, n);
};
Oe.unmountComponentAtNode = function (e) {
    if (!Ii(e)) throw Error(x(40));
    return e._reactRootContainer
        ? (Ut(function () {
              Di(null, null, e, !1, function () {
                  ((e._reactRootContainer = null), (e[rt] = null));
              });
          }),
          !0)
        : !1;
};
Oe.unstable_batchedUpdates = Jo;
Oe.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
    if (!Ii(n)) throw Error(x(200));
    if (e == null || e._reactInternals === void 0) throw Error(x(38));
    return Di(e, t, n, !1, r);
};
Oe.version = '18.3.1-next-f1338f8080-20240426';
function Wc() {
    if (
        !(
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
        )
    )
        try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Wc);
        } catch (e) {
            console.error(e);
        }
}
(Wc(), (Wa.exports = Oe));
var Tp = Wa.exports,
    pa = Tp;
((pl.createRoot = pa.createRoot), (pl.hydrateRoot = pa.hydrateRoot));
const R = (e) => typeof e == 'string',
    jn = () => {
        let e, t;
        const n = new Promise((r, i) => {
            ((e = r), (t = i));
        });
        return ((n.resolve = e), (n.reject = t), n);
    },
    ha = (e) => (e == null ? '' : '' + e),
    jp = (e, t, n) => {
        e.forEach((r) => {
            t[r] && (n[r] = t[r]);
        });
    },
    zp = /###/g,
    ga = (e) => (e && e.indexOf('###') > -1 ? e.replace(zp, '.') : e),
    ma = (e) => !e || R(e),
    Qn = (e, t, n) => {
        const r = R(t) ? t.split('.') : t;
        let i = 0;
        for (; i < r.length - 1; ) {
            if (ma(e)) return {};
            const l = ga(r[i]);
            (!e[l] && n && (e[l] = new n()),
                Object.prototype.hasOwnProperty.call(e, l) ? (e = e[l]) : (e = {}),
                ++i);
        }
        return ma(e) ? {} : { obj: e, k: ga(r[i]) };
    },
    ya = (e, t, n) => {
        const { obj: r, k: i } = Qn(e, t, Object);
        if (r !== void 0 || t.length === 1) {
            r[i] = n;
            return;
        }
        let l = t[t.length - 1],
            o = t.slice(0, t.length - 1),
            s = Qn(e, o, Object);
        for (; s.obj === void 0 && o.length; )
            ((l = `${o[o.length - 1]}.${l}`),
                (o = o.slice(0, o.length - 1)),
                (s = Qn(e, o, Object)),
                s != null && s.obj && typeof s.obj[`${s.k}.${l}`] < 'u' && (s.obj = void 0));
        s.obj[`${s.k}.${l}`] = n;
    },
    Fp = (e, t, n, r) => {
        const { obj: i, k: l } = Qn(e, t, Object);
        ((i[l] = i[l] || []), i[l].push(n));
    },
    vi = (e, t) => {
        const { obj: n, k: r } = Qn(e, t);
        if (n && Object.prototype.hasOwnProperty.call(n, r)) return n[r];
    },
    Ip = (e, t, n) => {
        const r = vi(e, n);
        return r !== void 0 ? r : vi(t, n);
    },
    Qc = (e, t, n) => {
        for (const r in t)
            r !== '__proto__' &&
                r !== 'constructor' &&
                (r in e
                    ? R(e[r]) || e[r] instanceof String || R(t[r]) || t[r] instanceof String
                        ? n && (e[r] = t[r])
                        : Qc(e[r], t[r], n)
                    : (e[r] = t[r]));
        return e;
    },
    Wt = (e) => e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
var Dp = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;' };
const Mp = (e) => (R(e) ? e.replace(/[&<>"'\/]/g, (t) => Dp[t]) : e);
class $p {
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
const Up = [' ', ',', '?', '!', ';'],
    Ap = new $p(20),
    Vp = (e, t, n) => {
        ((t = t || ''), (n = n || ''));
        const r = Up.filter((o) => t.indexOf(o) < 0 && n.indexOf(o) < 0);
        if (r.length === 0) return !0;
        const i = Ap.getRegExp(`(${r.map((o) => (o === '?' ? '\\?' : o)).join('|')})`);
        let l = !i.test(e);
        if (!l) {
            const o = e.indexOf(n);
            o > 0 && !i.test(e.substring(0, o)) && (l = !0);
        }
        return l;
    },
    oo = (e, t, n = '.') => {
        if (!e) return;
        if (e[t]) return Object.prototype.hasOwnProperty.call(e, t) ? e[t] : void 0;
        const r = t.split(n);
        let i = e;
        for (let l = 0; l < r.length; ) {
            if (!i || typeof i != 'object') return;
            let o,
                s = '';
            for (let a = l; a < r.length; ++a)
                if ((a !== l && (s += n), (s += r[a]), (o = i[s]), o !== void 0)) {
                    if (['string', 'number', 'boolean'].indexOf(typeof o) > -1 && a < r.length - 1)
                        continue;
                    l += a - l + 1;
                    break;
                }
            i = o;
        }
        return i;
    },
    fr = (e) => (e == null ? void 0 : e.replace('_', '-')),
    Hp = {
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
class wi {
    constructor(t, n = {}) {
        this.init(t, n);
    }
    init(t, n = {}) {
        ((this.prefix = n.prefix || 'i18next:'),
            (this.logger = t || Hp),
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
            : (R(t[0]) && (t[0] = `${r}${this.prefix} ${t[0]}`), this.logger[n](t));
    }
    create(t) {
        return new wi(this.logger, { prefix: `${this.prefix}:${t}:`, ...this.options });
    }
    clone(t) {
        return (
            (t = t || this.options),
            (t.prefix = t.prefix || this.prefix),
            new wi(this.logger, t)
        );
    }
}
var Ge = new wi();
class Mi {
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
            Array.from(this.observers[t].entries()).forEach(([i, l]) => {
                for (let o = 0; o < l; o++) i(...n);
            }),
            this.observers['*'] &&
                Array.from(this.observers['*'].entries()).forEach(([i, l]) => {
                    for (let o = 0; o < l; o++) i.apply(i, [t, ...n]);
                }));
    }
}
class va extends Mi {
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
        var u, d;
        const l = i.keySeparator !== void 0 ? i.keySeparator : this.options.keySeparator,
            o =
                i.ignoreJSONStructure !== void 0
                    ? i.ignoreJSONStructure
                    : this.options.ignoreJSONStructure;
        let s;
        t.indexOf('.') > -1
            ? (s = t.split('.'))
            : ((s = [t, n]),
              r &&
                  (Array.isArray(r)
                      ? s.push(...r)
                      : R(r) && l
                        ? s.push(...r.split(l))
                        : s.push(r)));
        const a = vi(this.data, s);
        return (
            !a &&
                !n &&
                !r &&
                t.indexOf('.') > -1 &&
                ((t = s[0]), (n = s[1]), (r = s.slice(2).join('.'))),
            a || !o || !R(r)
                ? a
                : oo((d = (u = this.data) == null ? void 0 : u[t]) == null ? void 0 : d[n], r, l)
        );
    }
    addResource(t, n, r, i, l = { silent: !1 }) {
        const o = l.keySeparator !== void 0 ? l.keySeparator : this.options.keySeparator;
        let s = [t, n];
        (r && (s = s.concat(o ? r.split(o) : r)),
            t.indexOf('.') > -1 && ((s = t.split('.')), (i = n), (n = s[1])),
            this.addNamespaces(n),
            ya(this.data, s, i),
            l.silent || this.emit('added', t, n, r, i));
    }
    addResources(t, n, r, i = { silent: !1 }) {
        for (const l in r)
            (R(r[l]) || Array.isArray(r[l])) && this.addResource(t, n, l, r[l], { silent: !0 });
        i.silent || this.emit('added', t, n, r);
    }
    addResourceBundle(t, n, r, i, l, o = { silent: !1, skipCopy: !1 }) {
        let s = [t, n];
        (t.indexOf('.') > -1 && ((s = t.split('.')), (i = r), (r = n), (n = s[1])),
            this.addNamespaces(n));
        let a = vi(this.data, s) || {};
        (o.skipCopy || (r = JSON.parse(JSON.stringify(r))),
            i ? Qc(a, r, l) : (a = { ...a, ...r }),
            ya(this.data, s, a),
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
var Yc = {
    processors: {},
    addPostProcessor(e) {
        this.processors[e.name] = e;
    },
    handle(e, t, n, r, i) {
        return (
            e.forEach((l) => {
                var o;
                t = ((o = this.processors[l]) == null ? void 0 : o.process(t, n, r, i)) ?? t;
            }),
            t
        );
    },
};
const Gc = Symbol('i18next/PATH_KEY');
function Bp() {
    const e = [],
        t = Object.create(null);
    let n;
    return (
        (t.get = (r, i) => {
            var l;
            return (
                (l = n == null ? void 0 : n.revoke) == null || l.call(n),
                i === Gc ? e : (e.push(i), (n = Proxy.revocable(r, t)), n.proxy)
            );
        }),
        Proxy.revocable(Object.create(null), t).proxy
    );
}
function so(e, t) {
    const { [Gc]: n } = e(Bp());
    return n.join((t == null ? void 0 : t.keySeparator) ?? '.');
}
const wa = {},
    cl = (e) => !R(e) && typeof e != 'boolean' && typeof e != 'number';
class xi extends Mi {
    constructor(t, n = {}) {
        (super(),
            jp(
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
            (this.logger = Ge.create('translator')));
    }
    changeLanguage(t) {
        t && (this.language = t);
    }
    exists(t, n = { interpolation: {} }) {
        const r = { ...n };
        if (t == null) return !1;
        const i = this.resolve(t, r);
        if ((i == null ? void 0 : i.res) === void 0) return !1;
        const l = cl(i.res);
        return !(r.returnObjects === !1 && l);
    }
    extractFromKey(t, n) {
        let r = n.nsSeparator !== void 0 ? n.nsSeparator : this.options.nsSeparator;
        r === void 0 && (r = ':');
        const i = n.keySeparator !== void 0 ? n.keySeparator : this.options.keySeparator;
        let l = n.ns || this.options.defaultNS || [];
        const o = r && t.indexOf(r) > -1,
            s =
                !this.options.userDefinedKeySeparator &&
                !n.keySeparator &&
                !this.options.userDefinedNsSeparator &&
                !n.nsSeparator &&
                !Vp(t, r, i);
        if (o && !s) {
            const a = t.match(this.interpolator.nestingRegexp);
            if (a && a.length > 0) return { key: t, namespaces: R(l) ? [l] : l };
            const u = t.split(r);
            ((r !== i || (r === i && this.options.ns.indexOf(u[0]) > -1)) && (l = u.shift()),
                (t = u.join(i)));
        }
        return { key: t, namespaces: R(l) ? [l] : l };
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
        (typeof t == 'function' && (t = so(t, { ...this.options, ...i })),
            Array.isArray(t) || (t = [String(t)]));
        const l = i.returnDetails !== void 0 ? i.returnDetails : this.options.returnDetails,
            o = i.keySeparator !== void 0 ? i.keySeparator : this.options.keySeparator,
            { key: s, namespaces: a } = this.extractFromKey(t[t.length - 1], i),
            u = a[a.length - 1];
        let d = i.nsSeparator !== void 0 ? i.nsSeparator : this.options.nsSeparator;
        d === void 0 && (d = ':');
        const f = i.lng || this.language,
            g = i.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
        if ((f == null ? void 0 : f.toLowerCase()) === 'cimode')
            return g
                ? l
                    ? {
                          res: `${u}${d}${s}`,
                          usedKey: s,
                          exactUsedKey: s,
                          usedLng: f,
                          usedNS: u,
                          usedParams: this.getUsedParamsDetails(i),
                      }
                    : `${u}${d}${s}`
                : l
                  ? {
                        res: s,
                        usedKey: s,
                        exactUsedKey: s,
                        usedLng: f,
                        usedNS: u,
                        usedParams: this.getUsedParamsDetails(i),
                    }
                  : s;
        const y = this.resolve(t, i);
        let m = y == null ? void 0 : y.res;
        const w = (y == null ? void 0 : y.usedKey) || s,
            T = (y == null ? void 0 : y.exactUsedKey) || s,
            p = ['[object Number]', '[object Function]', '[object RegExp]'],
            c = i.joinArrays !== void 0 ? i.joinArrays : this.options.joinArrays,
            h = !this.i18nFormat || this.i18nFormat.handleAsObject,
            v = i.count !== void 0 && !R(i.count),
            S = xi.hasDefaultValue(i),
            C = v ? this.pluralResolver.getSuffix(f, i.count, i) : '',
            E = i.ordinal && v ? this.pluralResolver.getSuffix(f, i.count, { ordinal: !1 }) : '',
            L = v && !i.ordinal && i.count === 0,
            z =
                (L && i[`defaultValue${this.options.pluralSeparator}zero`]) ||
                i[`defaultValue${C}`] ||
                i[`defaultValue${E}`] ||
                i.defaultValue;
        let O = m;
        h && !m && S && (O = z);
        const ae = cl(O),
            $ = Object.prototype.toString.apply(O);
        if (h && O && ae && p.indexOf($) < 0 && !(R(c) && Array.isArray(O))) {
            if (!i.returnObjects && !this.options.returnObjects) {
                this.options.returnedObjectHandler ||
                    this.logger.warn(
                        'accessing an object - but returnObjects options is not enabled!',
                    );
                const F = this.options.returnedObjectHandler
                    ? this.options.returnedObjectHandler(w, O, { ...i, ns: a })
                    : `key '${s} (${this.language})' returned an object instead of string.`;
                return l ? ((y.res = F), (y.usedParams = this.getUsedParamsDetails(i)), y) : F;
            }
            if (o) {
                const F = Array.isArray(O),
                    M = F ? [] : {},
                    X = F ? T : w;
                for (const ee in O)
                    if (Object.prototype.hasOwnProperty.call(O, ee)) {
                        const ue = `${X}${o}${ee}`;
                        (S && !m
                            ? (M[ee] = this.translate(ue, {
                                  ...i,
                                  defaultValue: cl(z) ? z[ee] : void 0,
                                  joinArrays: !1,
                                  ns: a,
                              }))
                            : (M[ee] = this.translate(ue, { ...i, joinArrays: !1, ns: a })),
                            M[ee] === ue && (M[ee] = O[ee]));
                    }
                m = M;
            }
        } else if (h && R(c) && Array.isArray(m))
            ((m = m.join(c)), m && (m = this.extendTranslation(m, t, i, r)));
        else {
            let F = !1,
                M = !1;
            (!this.isValidLookup(m) && S && ((F = !0), (m = z)),
                this.isValidLookup(m) || ((M = !0), (m = s)));
            const ee =
                    (i.missingKeyNoValueFallbackToKey ||
                        this.options.missingKeyNoValueFallbackToKey) &&
                    M
                        ? void 0
                        : m,
                ue = S && z !== m && this.options.updateMissing;
            if (M || F || ue) {
                if ((this.logger.log(ue ? 'updateKey' : 'missingKey', f, u, s, ue ? z : m), o)) {
                    const D = this.resolve(s, { ...i, keySeparator: !1 });
                    D &&
                        D.res &&
                        this.logger.warn(
                            'Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.',
                        );
                }
                let k = [];
                const _ = this.languageUtils.getFallbackCodes(
                    this.options.fallbackLng,
                    i.lng || this.language,
                );
                if (this.options.saveMissingTo === 'fallback' && _ && _[0])
                    for (let D = 0; D < _.length; D++) k.push(_[D]);
                else
                    this.options.saveMissingTo === 'all'
                        ? (k = this.languageUtils.toResolveHierarchy(i.lng || this.language))
                        : k.push(i.lng || this.language);
                const j = (D, V, Be) => {
                    var Bt;
                    const Ke = S && Be !== m ? Be : ee;
                    (this.options.missingKeyHandler
                        ? this.options.missingKeyHandler(D, u, V, Ke, ue, i)
                        : (Bt = this.backendConnector) != null &&
                          Bt.saveMissing &&
                          this.backendConnector.saveMissing(D, u, V, Ke, ue, i),
                        this.emit('missingKey', D, u, V, m));
                };
                this.options.saveMissing &&
                    (this.options.saveMissingPlurals && v
                        ? k.forEach((D) => {
                              const V = this.pluralResolver.getSuffixes(D, i);
                              (L &&
                                  i[`defaultValue${this.options.pluralSeparator}zero`] &&
                                  V.indexOf(`${this.options.pluralSeparator}zero`) < 0 &&
                                  V.push(`${this.options.pluralSeparator}zero`),
                                  V.forEach((Be) => {
                                      j([D], s + Be, i[`defaultValue${Be}`] || z);
                                  }));
                          })
                        : j(k, s, z));
            }
            ((m = this.extendTranslation(m, t, i, y, r)),
                M && m === s && this.options.appendNamespaceToMissingKey && (m = `${u}${d}${s}`),
                (M || F) &&
                    this.options.parseMissingKeyHandler &&
                    (m = this.options.parseMissingKeyHandler(
                        this.options.appendNamespaceToMissingKey ? `${u}${d}${s}` : s,
                        F ? m : void 0,
                        i,
                    )));
        }
        return l ? ((y.res = m), (y.usedParams = this.getUsedParamsDetails(i)), y) : m;
    }
    extendTranslation(t, n, r, i, l) {
        var a, u;
        if ((a = this.i18nFormat) != null && a.parse)
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
            const d =
                R(t) &&
                (((u = r == null ? void 0 : r.interpolation) == null
                    ? void 0
                    : u.skipOnVariables) !== void 0
                    ? r.interpolation.skipOnVariables
                    : this.options.interpolation.skipOnVariables);
            let f;
            if (d) {
                const y = t.match(this.interpolator.nestingRegexp);
                f = y && y.length;
            }
            let g = r.replace && !R(r.replace) ? r.replace : r;
            if (
                (this.options.interpolation.defaultVariables &&
                    (g = { ...this.options.interpolation.defaultVariables, ...g }),
                (t = this.interpolator.interpolate(t, g, r.lng || this.language || i.usedLng, r)),
                d)
            ) {
                const y = t.match(this.interpolator.nestingRegexp),
                    m = y && y.length;
                f < m && (r.nest = !1);
            }
            (!r.lng && i && i.res && (r.lng = this.language || i.usedLng),
                r.nest !== !1 &&
                    (t = this.interpolator.nest(
                        t,
                        (...y) =>
                            (l == null ? void 0 : l[0]) === y[0] && !r.context
                                ? (this.logger.warn(
                                      `It seems you are nesting recursively key: ${y[0]} in key: ${n[0]}`,
                                  ),
                                  null)
                                : this.translate(...y, n),
                        r,
                    )),
                r.interpolation && this.interpolator.reset());
        }
        const o = r.postProcess || this.options.postProcess,
            s = R(o) ? [o] : o;
        return (
            t != null &&
                s != null &&
                s.length &&
                r.applyPostProcessor !== !1 &&
                (t = Yc.handle(
                    s,
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
        let r, i, l, o, s;
        return (
            R(t) && (t = [t]),
            t.forEach((a) => {
                if (this.isValidLookup(r)) return;
                const u = this.extractFromKey(a, n),
                    d = u.key;
                i = d;
                let f = u.namespaces;
                this.options.fallbackNS && (f = f.concat(this.options.fallbackNS));
                const g = n.count !== void 0 && !R(n.count),
                    y = g && !n.ordinal && n.count === 0,
                    m =
                        n.context !== void 0 &&
                        (R(n.context) || typeof n.context == 'number') &&
                        n.context !== '',
                    w = n.lngs
                        ? n.lngs
                        : this.languageUtils.toResolveHierarchy(
                              n.lng || this.language,
                              n.fallbackLng,
                          );
                f.forEach((T) => {
                    var p, c;
                    this.isValidLookup(r) ||
                        ((s = T),
                        !wa[`${w[0]}-${T}`] &&
                            (p = this.utils) != null &&
                            p.hasLoadedNamespace &&
                            !((c = this.utils) != null && c.hasLoadedNamespace(s)) &&
                            ((wa[`${w[0]}-${T}`] = !0),
                            this.logger.warn(
                                `key "${i}" for languages "${w.join(', ')}" won't get resolved as namespace "${s}" was not yet loaded`,
                                'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!',
                            )),
                        w.forEach((h) => {
                            var C;
                            if (this.isValidLookup(r)) return;
                            o = h;
                            const v = [d];
                            if ((C = this.i18nFormat) != null && C.addLookupKeys)
                                this.i18nFormat.addLookupKeys(v, d, h, T, n);
                            else {
                                let E;
                                g && (E = this.pluralResolver.getSuffix(h, n.count, n));
                                const L = `${this.options.pluralSeparator}zero`,
                                    z = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                                if (
                                    (g &&
                                        (n.ordinal &&
                                            E.indexOf(z) === 0 &&
                                            v.push(d + E.replace(z, this.options.pluralSeparator)),
                                        v.push(d + E),
                                        y && v.push(d + L)),
                                    m)
                                ) {
                                    const O = `${d}${this.options.contextSeparator || '_'}${n.context}`;
                                    (v.push(O),
                                        g &&
                                            (n.ordinal &&
                                                E.indexOf(z) === 0 &&
                                                v.push(
                                                    O + E.replace(z, this.options.pluralSeparator),
                                                ),
                                            v.push(O + E),
                                            y && v.push(O + L)));
                                }
                            }
                            let S;
                            for (; (S = v.pop()); )
                                this.isValidLookup(r) ||
                                    ((l = S), (r = this.getResource(h, T, S, n)));
                        }));
                });
            }),
            { res: r, usedKey: i, exactUsedKey: l, usedLng: o, usedNS: s }
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
        var l;
        return (l = this.i18nFormat) != null && l.getResource
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
            r = t.replace && !R(t.replace);
        let i = r ? t.replace : t;
        if (
            (r && typeof t.count < 'u' && (i.count = t.count),
            this.options.interpolation.defaultVariables &&
                (i = { ...this.options.interpolation.defaultVariables, ...i }),
            !r)
        ) {
            i = { ...i };
            for (const l of n) delete i[l];
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
class xa {
    constructor(t) {
        ((this.options = t),
            (this.supportedLngs = this.options.supportedLngs || !1),
            (this.logger = Ge.create('languageUtils')));
    }
    getScriptPartFromCode(t) {
        if (((t = fr(t)), !t || t.indexOf('-') < 0)) return null;
        const n = t.split('-');
        return n.length === 2 || (n.pop(), n[n.length - 1].toLowerCase() === 'x')
            ? null
            : this.formatLanguageCode(n.join('-'));
    }
    getLanguagePartFromCode(t) {
        if (((t = fr(t)), !t || t.indexOf('-') < 0)) return t;
        const n = t.split('-');
        return this.formatLanguageCode(n[0]);
    }
    formatLanguageCode(t) {
        if (R(t) && t.indexOf('-') > -1) {
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
                    const l = this.getLanguagePartFromCode(r);
                    if (this.isSupportedCode(l)) return (n = l);
                    n = this.options.supportedLngs.find((o) => {
                        if (o === l) return o;
                        if (
                            !(o.indexOf('-') < 0 && l.indexOf('-') < 0) &&
                            ((o.indexOf('-') > 0 &&
                                l.indexOf('-') < 0 &&
                                o.substring(0, o.indexOf('-')) === l) ||
                                (o.indexOf(l) === 0 && l.length > 1))
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
        if ((typeof t == 'function' && (t = t(n)), R(t) && (t = [t]), Array.isArray(t))) return t;
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
            l = (o) => {
                o &&
                    (this.isSupportedCode(o)
                        ? i.push(o)
                        : this.logger.warn(
                              `rejecting language code not found in supportedLngs: ${o}`,
                          ));
            };
        return (
            R(t) && (t.indexOf('-') > -1 || t.indexOf('_') > -1)
                ? (this.options.load !== 'languageOnly' && l(this.formatLanguageCode(t)),
                  this.options.load !== 'languageOnly' &&
                      this.options.load !== 'currentOnly' &&
                      l(this.getScriptPartFromCode(t)),
                  this.options.load !== 'currentOnly' && l(this.getLanguagePartFromCode(t)))
                : R(t) && l(this.formatLanguageCode(t)),
            r.forEach((o) => {
                i.indexOf(o) < 0 && l(this.formatLanguageCode(o));
            }),
            i
        );
    }
}
const Sa = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 },
    ka = {
        select: (e) => (e === 1 ? 'one' : 'other'),
        resolvedOptions: () => ({ pluralCategories: ['one', 'other'] }),
    };
class Kp {
    constructor(t, n = {}) {
        ((this.languageUtils = t),
            (this.options = n),
            (this.logger = Ge.create('pluralResolver')),
            (this.pluralRulesCache = {}));
    }
    addRule(t, n) {
        this.rules[t] = n;
    }
    clearCache() {
        this.pluralRulesCache = {};
    }
    getRule(t, n = {}) {
        const r = fr(t === 'dev' ? 'en' : t),
            i = n.ordinal ? 'ordinal' : 'cardinal',
            l = JSON.stringify({ cleanedCode: r, type: i });
        if (l in this.pluralRulesCache) return this.pluralRulesCache[l];
        let o;
        try {
            o = new Intl.PluralRules(r, { type: i });
        } catch {
            if (!Intl)
                return (this.logger.error('No Intl support, please use an Intl polyfill!'), ka);
            if (!t.match(/-|_/)) return ka;
            const a = this.languageUtils.getLanguagePartFromCode(t);
            o = this.getRule(a, n);
        }
        return ((this.pluralRulesCache[l] = o), o);
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
                      .pluralCategories.sort((i, l) => Sa[i] - Sa[l])
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
const Ea = (e, t, n, r = '.', i = !0) => {
        let l = Ip(e, t, n);
        return (!l && i && R(n) && ((l = oo(e, n, r)), l === void 0 && (l = oo(t, n, r))), l);
    },
    fl = (e) => e.replace(/\$/g, '$$$$');
class Ca {
    constructor(t = {}) {
        var n;
        ((this.logger = Ge.create('interpolator')),
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
            prefix: l,
            prefixEscaped: o,
            suffix: s,
            suffixEscaped: a,
            formatSeparator: u,
            unescapeSuffix: d,
            unescapePrefix: f,
            nestingPrefix: g,
            nestingPrefixEscaped: y,
            nestingSuffix: m,
            nestingSuffixEscaped: w,
            nestingOptionsSeparator: T,
            maxReplaces: p,
            alwaysFormat: c,
        } = t.interpolation;
        ((this.escape = n !== void 0 ? n : Mp),
            (this.escapeValue = r !== void 0 ? r : !0),
            (this.useRawValueToEscape = i !== void 0 ? i : !1),
            (this.prefix = l ? Wt(l) : o || '{{'),
            (this.suffix = s ? Wt(s) : a || '}}'),
            (this.formatSeparator = u || ','),
            (this.unescapePrefix = d ? '' : f || '-'),
            (this.unescapeSuffix = this.unescapePrefix ? '' : d || ''),
            (this.nestingPrefix = g ? Wt(g) : y || Wt('$t(')),
            (this.nestingSuffix = m ? Wt(m) : w || Wt(')')),
            (this.nestingOptionsSeparator = T || ','),
            (this.maxReplaces = p || 1e3),
            (this.alwaysFormat = c !== void 0 ? c : !1),
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
        var y;
        let l, o, s;
        const a =
                (this.options &&
                    this.options.interpolation &&
                    this.options.interpolation.defaultVariables) ||
                {},
            u = (m) => {
                if (m.indexOf(this.formatSeparator) < 0) {
                    const c = Ea(
                        n,
                        a,
                        m,
                        this.options.keySeparator,
                        this.options.ignoreJSONStructure,
                    );
                    return this.alwaysFormat
                        ? this.format(c, void 0, r, { ...i, ...n, interpolationkey: m })
                        : c;
                }
                const w = m.split(this.formatSeparator),
                    T = w.shift().trim(),
                    p = w.join(this.formatSeparator).trim();
                return this.format(
                    Ea(n, a, T, this.options.keySeparator, this.options.ignoreJSONStructure),
                    p,
                    r,
                    { ...i, ...n, interpolationkey: T },
                );
            };
        this.resetRegExp();
        const d =
                (i == null ? void 0 : i.missingInterpolationHandler) ||
                this.options.missingInterpolationHandler,
            f =
                ((y = i == null ? void 0 : i.interpolation) == null
                    ? void 0
                    : y.skipOnVariables) !== void 0
                    ? i.interpolation.skipOnVariables
                    : this.options.interpolation.skipOnVariables;
        return (
            [
                { regex: this.regexpUnescape, safeValue: (m) => fl(m) },
                {
                    regex: this.regexp,
                    safeValue: (m) => (this.escapeValue ? fl(this.escape(m)) : fl(m)),
                },
            ].forEach((m) => {
                for (s = 0; (l = m.regex.exec(t)); ) {
                    const w = l[1].trim();
                    if (((o = u(w)), o === void 0))
                        if (typeof d == 'function') {
                            const p = d(t, l, i);
                            o = R(p) ? p : '';
                        } else if (i && Object.prototype.hasOwnProperty.call(i, w)) o = '';
                        else if (f) {
                            o = l[0];
                            continue;
                        } else
                            (this.logger.warn(
                                `missed to pass in variable ${w} for interpolating ${t}`,
                            ),
                                (o = ''));
                    else !R(o) && !this.useRawValueToEscape && (o = ha(o));
                    const T = m.safeValue(o);
                    if (
                        ((t = t.replace(l[0], T)),
                        f
                            ? ((m.regex.lastIndex += o.length), (m.regex.lastIndex -= l[0].length))
                            : (m.regex.lastIndex = 0),
                        s++,
                        s >= this.maxReplaces)
                    )
                        break;
                }
            }),
            t
        );
    }
    nest(t, n, r = {}) {
        let i, l, o;
        const s = (a, u) => {
            const d = this.nestingOptionsSeparator;
            if (a.indexOf(d) < 0) return a;
            const f = a.split(new RegExp(`${d}[ ]*{`));
            let g = `{${f[1]}`;
            ((a = f[0]), (g = this.interpolate(g, o)));
            const y = g.match(/'/g),
                m = g.match(/"/g);
            ((((y == null ? void 0 : y.length) ?? 0) % 2 === 0 && !m) || m.length % 2 !== 0) &&
                (g = g.replace(/'/g, '"'));
            try {
                ((o = JSON.parse(g)), u && (o = { ...u, ...o }));
            } catch (w) {
                return (
                    this.logger.warn(`failed parsing options string in nesting for key ${a}`, w),
                    `${a}${d}${g}`
                );
            }
            return (
                o.defaultValue && o.defaultValue.indexOf(this.prefix) > -1 && delete o.defaultValue,
                a
            );
        };
        for (; (i = this.nestingRegexp.exec(t)); ) {
            let a = [];
            ((o = { ...r }),
                (o = o.replace && !R(o.replace) ? o.replace : o),
                (o.applyPostProcessor = !1),
                delete o.defaultValue);
            const u = /{.*}/.test(i[1])
                ? i[1].lastIndexOf('}') + 1
                : i[1].indexOf(this.formatSeparator);
            if (
                (u !== -1 &&
                    ((a = i[1]
                        .slice(u)
                        .split(this.formatSeparator)
                        .map((d) => d.trim())
                        .filter(Boolean)),
                    (i[1] = i[1].slice(0, u))),
                (l = n(s.call(this, i[1].trim(), o), o)),
                l && i[0] === t && !R(l))
            )
                return l;
            (R(l) || (l = ha(l)),
                l || (this.logger.warn(`missed to resolve ${i[1]} for nesting ${t}`), (l = '')),
                a.length &&
                    (l = a.reduce(
                        (d, f) => this.format(d, f, r.lng, { ...r, interpolationkey: i[1].trim() }),
                        l.trim(),
                    )),
                (t = t.replace(i[0], l)),
                (this.regexp.lastIndex = 0));
        }
        return t;
    }
}
const Wp = (e) => {
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
                            const [s, ...a] = o.split(':'),
                                u = a
                                    .join(':')
                                    .trim()
                                    .replace(/^'+|'+$/g, ''),
                                d = s.trim();
                            (n[d] || (n[d] = u),
                                u === 'false' && (n[d] = !1),
                                u === 'true' && (n[d] = !0),
                                isNaN(u) || (n[d] = parseInt(u, 10)));
                        }
                    });
        }
        return { formatName: t, formatOptions: n };
    },
    Na = (e) => {
        const t = {};
        return (n, r, i) => {
            let l = i;
            i &&
                i.interpolationkey &&
                i.formatParams &&
                i.formatParams[i.interpolationkey] &&
                i[i.interpolationkey] &&
                (l = { ...l, [i.interpolationkey]: void 0 });
            const o = r + JSON.stringify(l);
            let s = t[o];
            return (s || ((s = e(fr(r), i)), (t[o] = s)), s(n));
        };
    },
    Qp = (e) => (t, n, r) => e(fr(n), r)(t);
class Yp {
    constructor(t = {}) {
        ((this.logger = Ge.create('formatter')), (this.options = t), this.init(t));
    }
    init(t, n = { interpolation: {} }) {
        this.formatSeparator = n.interpolation.formatSeparator || ',';
        const r = n.cacheInBuiltFormats ? Na : Qp;
        this.formats = {
            number: r((i, l) => {
                const o = new Intl.NumberFormat(i, { ...l });
                return (s) => o.format(s);
            }),
            currency: r((i, l) => {
                const o = new Intl.NumberFormat(i, { ...l, style: 'currency' });
                return (s) => o.format(s);
            }),
            datetime: r((i, l) => {
                const o = new Intl.DateTimeFormat(i, { ...l });
                return (s) => o.format(s);
            }),
            relativetime: r((i, l) => {
                const o = new Intl.RelativeTimeFormat(i, { ...l });
                return (s) => o.format(s, l.range || 'day');
            }),
            list: r((i, l) => {
                const o = new Intl.ListFormat(i, { ...l });
                return (s) => o.format(s);
            }),
        };
    }
    add(t, n) {
        this.formats[t.toLowerCase().trim()] = n;
    }
    addCached(t, n) {
        this.formats[t.toLowerCase().trim()] = Na(n);
    }
    format(t, n, r, i = {}) {
        const l = n.split(this.formatSeparator);
        if (
            l.length > 1 &&
            l[0].indexOf('(') > 1 &&
            l[0].indexOf(')') < 0 &&
            l.find((s) => s.indexOf(')') > -1)
        ) {
            const s = l.findIndex((a) => a.indexOf(')') > -1);
            l[0] = [l[0], ...l.splice(1, s)].join(this.formatSeparator);
        }
        return l.reduce((s, a) => {
            var f;
            const { formatName: u, formatOptions: d } = Wp(a);
            if (this.formats[u]) {
                let g = s;
                try {
                    const y =
                            ((f = i == null ? void 0 : i.formatParams) == null
                                ? void 0
                                : f[i.interpolationkey]) || {},
                        m = y.locale || y.lng || i.locale || i.lng || r;
                    g = this.formats[u](s, m, { ...d, ...i, ...y });
                } catch (y) {
                    this.logger.warn(y);
                }
                return g;
            } else this.logger.warn(`there was no format function for ${u}`);
            return s;
        }, t);
    }
}
const Gp = (e, t) => {
    e.pending[t] !== void 0 && (delete e.pending[t], e.pendingCount--);
};
class Xp extends Mi {
    constructor(t, n, r, i = {}) {
        var l, o;
        (super(),
            (this.backend = t),
            (this.store = n),
            (this.services = r),
            (this.languageUtils = r.languageUtils),
            (this.options = i),
            (this.logger = Ge.create('backendConnector')),
            (this.waitingReads = []),
            (this.maxParallelReads = i.maxParallelReads || 10),
            (this.readingCalls = 0),
            (this.maxRetries = i.maxRetries >= 0 ? i.maxRetries : 5),
            (this.retryTimeout = i.retryTimeout >= 1 ? i.retryTimeout : 350),
            (this.state = {}),
            (this.queue = []),
            (o = (l = this.backend) == null ? void 0 : l.init) == null ||
                o.call(l, r, i.backend, i));
    }
    queueLoad(t, n, r, i) {
        const l = {},
            o = {},
            s = {},
            a = {};
        return (
            t.forEach((u) => {
                let d = !0;
                (n.forEach((f) => {
                    const g = `${u}|${f}`;
                    !r.reload && this.store.hasResourceBundle(u, f)
                        ? (this.state[g] = 2)
                        : this.state[g] < 0 ||
                          (this.state[g] === 1
                              ? o[g] === void 0 && (o[g] = !0)
                              : ((this.state[g] = 1),
                                (d = !1),
                                o[g] === void 0 && (o[g] = !0),
                                l[g] === void 0 && (l[g] = !0),
                                a[f] === void 0 && (a[f] = !0)));
                }),
                    d || (s[u] = !0));
            }),
            (Object.keys(l).length || Object.keys(o).length) &&
                this.queue.push({
                    pending: o,
                    pendingCount: Object.keys(o).length,
                    loaded: {},
                    errors: [],
                    callback: i,
                }),
            {
                toLoad: Object.keys(l),
                pending: Object.keys(o),
                toLoadLanguages: Object.keys(s),
                toLoadNamespaces: Object.keys(a),
            }
        );
    }
    loaded(t, n, r) {
        const i = t.split('|'),
            l = i[0],
            o = i[1];
        (n && this.emit('failedLoading', l, o, n),
            !n && r && this.store.addResourceBundle(l, o, r, void 0, void 0, { skipCopy: !0 }),
            (this.state[t] = n ? -1 : 2),
            n && r && (this.state[t] = 0));
        const s = {};
        (this.queue.forEach((a) => {
            (Fp(a.loaded, [l], o),
                Gp(a, t),
                n && a.errors.push(n),
                a.pendingCount === 0 &&
                    !a.done &&
                    (Object.keys(a.loaded).forEach((u) => {
                        s[u] || (s[u] = {});
                        const d = a.loaded[u];
                        d.length &&
                            d.forEach((f) => {
                                s[u][f] === void 0 && (s[u][f] = !0);
                            });
                    }),
                    (a.done = !0),
                    a.errors.length ? a.callback(a.errors) : a.callback()));
        }),
            this.emit('loaded', s),
            (this.queue = this.queue.filter((a) => !a.done)));
    }
    read(t, n, r, i = 0, l = this.retryTimeout, o) {
        if (!t.length) return o(null, {});
        if (this.readingCalls >= this.maxParallelReads) {
            this.waitingReads.push({ lng: t, ns: n, fcName: r, tried: i, wait: l, callback: o });
            return;
        }
        this.readingCalls++;
        const s = (u, d) => {
                if ((this.readingCalls--, this.waitingReads.length > 0)) {
                    const f = this.waitingReads.shift();
                    this.read(f.lng, f.ns, f.fcName, f.tried, f.wait, f.callback);
                }
                if (u && d && i < this.maxRetries) {
                    setTimeout(() => {
                        this.read.call(this, t, n, r, i + 1, l * 2, o);
                    }, l);
                    return;
                }
                o(u, d);
            },
            a = this.backend[r].bind(this.backend);
        if (a.length === 2) {
            try {
                const u = a(t, n);
                u && typeof u.then == 'function' ? u.then((d) => s(null, d)).catch(s) : s(null, u);
            } catch (u) {
                s(u);
            }
            return;
        }
        return a(t, n, s);
    }
    prepareLoading(t, n, r = {}, i) {
        if (!this.backend)
            return (
                this.logger.warn('No backend was added via i18next.use. Will not load resources.'),
                i && i()
            );
        (R(t) && (t = this.languageUtils.toResolveHierarchy(t)), R(n) && (n = [n]));
        const l = this.queueLoad(t, n, r, i);
        if (!l.toLoad.length) return (l.pending.length || i(), null);
        l.toLoad.forEach((o) => {
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
            l = r[1];
        this.read(i, l, 'read', void 0, void 0, (o, s) => {
            (o && this.logger.warn(`${n}loading namespace ${l} for language ${i} failed`, o),
                !o && s && this.logger.log(`${n}loaded namespace ${l} for language ${i}`, s),
                this.loaded(t, o, s));
        });
    }
    saveMissing(t, n, r, i, l, o = {}, s = () => {}) {
        var a, u, d, f, g;
        if (
            (u = (a = this.services) == null ? void 0 : a.utils) != null &&
            u.hasLoadedNamespace &&
            !(
                (f = (d = this.services) == null ? void 0 : d.utils) != null &&
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
            if ((g = this.backend) != null && g.create) {
                const y = { ...o, isUpdate: l },
                    m = this.backend.create.bind(this.backend);
                if (m.length < 6)
                    try {
                        let w;
                        (m.length === 5 ? (w = m(t, n, r, i, y)) : (w = m(t, n, r, i)),
                            w && typeof w.then == 'function'
                                ? w.then((T) => s(null, T)).catch(s)
                                : s(null, w));
                    } catch (w) {
                        s(w);
                    }
                else m(t, n, r, i, s, y);
            }
            !t || !t[0] || this.store.addResource(t[0], n, r, i);
        }
    }
}
const La = () => ({
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
                R(e[1]) && (t.defaultValue = e[1]),
                R(e[2]) && (t.tDescription = e[2]),
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
    Pa = (e) => {
        var t, n;
        return (
            R(e.ns) && (e.ns = [e.ns]),
            R(e.fallbackLng) && (e.fallbackLng = [e.fallbackLng]),
            R(e.fallbackNS) && (e.fallbackNS = [e.fallbackNS]),
            ((n = (t = e.supportedLngs) == null ? void 0 : t.indexOf) == null
                ? void 0
                : n.call(t, 'cimode')) < 0 &&
                (e.supportedLngs = e.supportedLngs.concat(['cimode'])),
            typeof e.initImmediate == 'boolean' && (e.initAsync = e.initImmediate),
            e
        );
    },
    Ir = () => {},
    Zp = (e) => {
        Object.getOwnPropertyNames(Object.getPrototypeOf(e)).forEach((n) => {
            typeof e[n] == 'function' && (e[n] = e[n].bind(e));
        });
    };
class Yn extends Mi {
    constructor(t = {}, n) {
        if (
            (super(),
            (this.options = Pa(t)),
            (this.services = {}),
            (this.logger = Ge),
            (this.modules = { external: [] }),
            Zp(this),
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
                (R(t.ns)
                    ? (t.defaultNS = t.ns)
                    : t.ns.indexOf('translation') < 0 && (t.defaultNS = t.ns[0])));
        const r = La();
        ((this.options = { ...r, ...this.options, ...Pa(t) }),
            (this.options.interpolation = { ...r.interpolation, ...this.options.interpolation }),
            t.keySeparator !== void 0 && (this.options.userDefinedKeySeparator = t.keySeparator),
            t.nsSeparator !== void 0 && (this.options.userDefinedNsSeparator = t.nsSeparator),
            typeof this.options.overloadTranslationOptionHandler != 'function' &&
                (this.options.overloadTranslationOptionHandler =
                    r.overloadTranslationOptionHandler));
        const i = (u) => (u ? (typeof u == 'function' ? new u() : u) : null);
        if (!this.options.isClone) {
            this.modules.logger
                ? Ge.init(i(this.modules.logger), this.options)
                : Ge.init(null, this.options);
            let u;
            this.modules.formatter ? (u = this.modules.formatter) : (u = Yp);
            const d = new xa(this.options);
            this.store = new va(this.options.resources, this.options);
            const f = this.services;
            ((f.logger = Ge),
                (f.resourceStore = this.store),
                (f.languageUtils = d),
                (f.pluralResolver = new Kp(d, {
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
                (f.interpolator = new Ca(this.options)),
                (f.utils = { hasLoadedNamespace: this.hasLoadedNamespace.bind(this) }),
                (f.backendConnector = new Xp(
                    i(this.modules.backend),
                    f.resourceStore,
                    f,
                    this.options,
                )),
                f.backendConnector.on('*', (y, ...m) => {
                    this.emit(y, ...m);
                }),
                this.modules.languageDetector &&
                    ((f.languageDetector = i(this.modules.languageDetector)),
                    f.languageDetector.init &&
                        f.languageDetector.init(f, this.options.detection, this.options)),
                this.modules.i18nFormat &&
                    ((f.i18nFormat = i(this.modules.i18nFormat)),
                    f.i18nFormat.init && f.i18nFormat.init(this)),
                (this.translator = new xi(this.services, this.options)),
                this.translator.on('*', (y, ...m) => {
                    this.emit(y, ...m);
                }),
                this.modules.external.forEach((y) => {
                    y.init && y.init(this);
                }));
        }
        if (
            ((this.format = this.options.interpolation.format),
            n || (n = Ir),
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
                    this[u] = (...d) => this.store[u](...d);
                },
            ),
            ['addResource', 'addResources', 'addResourceBundle', 'removeResourceBundle'].forEach(
                (u) => {
                    this[u] = (...d) => (this.store[u](...d), this);
                },
            ));
        const s = jn(),
            a = () => {
                const u = (d, f) => {
                    ((this.isInitializing = !1),
                        this.isInitialized &&
                            !this.initializedStoreOnce &&
                            this.logger.warn(
                                'init: i18next is already initialized. You should call init just once!',
                            ),
                        (this.isInitialized = !0),
                        this.options.isClone || this.logger.log('initialized', this.options),
                        this.emit('initialized', this.options),
                        s.resolve(f),
                        n(d, f));
                };
                if (this.languages && !this.isInitialized) return u(null, this.t.bind(this));
                this.changeLanguage(this.options.lng, u);
            };
        return (this.options.resources || !this.options.initAsync ? a() : setTimeout(a, 0), s);
    }
    loadResources(t, n = Ir) {
        var l, o;
        let r = n;
        const i = R(t) ? t : this.language;
        if (
            (typeof t == 'function' && (r = t),
            !this.options.resources || this.options.partialBundledLanguages)
        ) {
            if (
                (i == null ? void 0 : i.toLowerCase()) === 'cimode' &&
                (!this.options.preload || this.options.preload.length === 0)
            )
                return r();
            const s = [],
                a = (u) => {
                    if (!u || u === 'cimode') return;
                    this.services.languageUtils.toResolveHierarchy(u).forEach((f) => {
                        f !== 'cimode' && s.indexOf(f) < 0 && s.push(f);
                    });
                };
            (i
                ? a(i)
                : this.services.languageUtils
                      .getFallbackCodes(this.options.fallbackLng)
                      .forEach((d) => a(d)),
                (o = (l = this.options.preload) == null ? void 0 : l.forEach) == null ||
                    o.call(l, (u) => a(u)),
                this.services.backendConnector.load(s, this.options.ns, (u) => {
                    (!u &&
                        !this.resolvedLanguage &&
                        this.language &&
                        this.setResolvedLanguage(this.language),
                        r(u));
                }));
        } else r(null);
    }
    reloadResources(t, n, r) {
        const i = jn();
        return (
            typeof t == 'function' && ((r = t), (t = void 0)),
            typeof n == 'function' && ((r = n), (n = void 0)),
            t || (t = this.languages),
            n || (n = this.options.ns),
            r || (r = Ir),
            this.services.backendConnector.reload(t, n, (l) => {
                (i.resolve(), r(l));
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
            t.type === 'postProcessor' && Yc.addPostProcessor(t),
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
        const r = jn();
        this.emit('languageChanging', t);
        const i = (s) => {
                ((this.language = s),
                    (this.languages = this.services.languageUtils.toResolveHierarchy(s)),
                    (this.resolvedLanguage = void 0),
                    this.setResolvedLanguage(s));
            },
            l = (s, a) => {
                (a
                    ? this.isLanguageChangingTo === t &&
                      (i(a),
                      this.translator.changeLanguage(a),
                      (this.isLanguageChangingTo = void 0),
                      this.emit('languageChanged', a),
                      this.logger.log('languageChanged', a))
                    : (this.isLanguageChangingTo = void 0),
                    r.resolve((...u) => this.t(...u)),
                    n && n(s, (...u) => this.t(...u)));
            },
            o = (s) => {
                var d, f;
                !t && !s && this.services.languageDetector && (s = []);
                const a = R(s) ? s : s && s[0],
                    u = this.store.hasLanguageSomeTranslations(a)
                        ? a
                        : this.services.languageUtils.getBestMatchFromCodes(R(s) ? [s] : s);
                (u &&
                    (this.language || i(u),
                    this.translator.language || this.translator.changeLanguage(u),
                    (f =
                        (d = this.services.languageDetector) == null
                            ? void 0
                            : d.cacheUserLanguage) == null || f.call(d, u)),
                    this.loadResources(u, (g) => {
                        l(g, u);
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
        const i = (l, o, ...s) => {
            let a;
            (typeof o != 'object'
                ? (a = this.options.overloadTranslationOptionHandler([l, o].concat(s)))
                : (a = { ...o }),
                (a.lng = a.lng || i.lng),
                (a.lngs = a.lngs || i.lngs),
                (a.ns = a.ns || i.ns),
                a.keyPrefix !== '' && (a.keyPrefix = a.keyPrefix || r || i.keyPrefix));
            const u = this.options.keySeparator || '.';
            let d;
            return (
                a.keyPrefix && Array.isArray(l)
                    ? (d = l.map(
                          (f) => (
                              typeof f == 'function' && (f = so(f, { ...this.options, ...o })),
                              `${a.keyPrefix}${u}${f}`
                          ),
                      ))
                    : (typeof l == 'function' && (l = so(l, { ...this.options, ...o })),
                      (d = a.keyPrefix ? `${a.keyPrefix}${u}${l}` : l)),
                this.t(d, a)
            );
        };
        return (R(t) ? (i.lng = t) : (i.lngs = t), (i.ns = n), (i.keyPrefix = r), i);
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
            l = this.languages[this.languages.length - 1];
        if (r.toLowerCase() === 'cimode') return !0;
        const o = (s, a) => {
            const u = this.services.backendConnector.state[`${s}|${a}`];
            return u === -1 || u === 0 || u === 2;
        };
        if (n.precheck) {
            const s = n.precheck(this, o);
            if (s !== void 0) return s;
        }
        return !!(
            this.hasResourceBundle(r, t) ||
            !this.services.backendConnector.backend ||
            (this.options.resources && !this.options.partialBundledLanguages) ||
            (o(r, t) && (!i || o(l, t)))
        );
    }
    loadNamespaces(t, n) {
        const r = jn();
        return this.options.ns
            ? (R(t) && (t = [t]),
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
        const r = jn();
        R(t) && (t = [t]);
        const i = this.options.preload || [],
            l = t.filter((o) => i.indexOf(o) < 0 && this.services.languageUtils.isSupportedCode(o));
        return l.length
            ? ((this.options.preload = i.concat(l)),
              this.loadResources((o) => {
                  (r.resolve(), n && n(o));
              }),
              r)
            : (n && n(), Promise.resolve());
    }
    dir(t) {
        var i, l;
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
                const s = o.getTextInfo();
                if (s && s.direction) return s.direction;
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
            r = ((l = this.services) == null ? void 0 : l.languageUtils) || new xa(La());
        return t.toLowerCase().indexOf('-latn') > 1
            ? 'ltr'
            : n.indexOf(r.getLanguagePartFromCode(t)) > -1 || t.toLowerCase().indexOf('-arab') > 1
              ? 'rtl'
              : 'ltr';
    }
    static createInstance(t = {}, n) {
        const r = new Yn(t, n);
        return ((r.createInstance = Yn.createInstance), r);
    }
    cloneInstance(t = {}, n = Ir) {
        const r = t.forkResourceStore;
        r && delete t.forkResourceStore;
        const i = { ...this.options, ...t, isClone: !0 },
            l = new Yn(i);
        if (
            ((t.debug !== void 0 || t.prefix !== void 0) && (l.logger = l.logger.clone(t)),
            ['store', 'services', 'language'].forEach((s) => {
                l[s] = this[s];
            }),
            (l.services = { ...this.services }),
            (l.services.utils = { hasLoadedNamespace: l.hasLoadedNamespace.bind(l) }),
            r)
        ) {
            const s = Object.keys(this.store.data).reduce(
                (a, u) => (
                    (a[u] = { ...this.store.data[u] }),
                    (a[u] = Object.keys(a[u]).reduce((d, f) => ((d[f] = { ...a[u][f] }), d), a[u])),
                    a
                ),
                {},
            );
            ((l.store = new va(s, i)), (l.services.resourceStore = l.store));
        }
        return (
            t.interpolation && (l.services.interpolator = new Ca(i)),
            (l.translator = new xi(l.services, i)),
            l.translator.on('*', (s, ...a) => {
                l.emit(s, ...a);
            }),
            l.init(i, n),
            (l.translator.options = i),
            (l.translator.backendConnector.services.utils = {
                hasLoadedNamespace: l.hasLoadedNamespace.bind(l),
            }),
            l
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
const ve = Yn.createInstance();
ve.createInstance;
ve.dir;
ve.init;
ve.loadResources;
ve.reloadResources;
ve.use;
ve.changeLanguage;
ve.getFixedT;
ve.t;
ve.exists;
ve.setDefaultNamespace;
ve.hasLoadedNamespace;
ve.loadNamespaces;
ve.loadLanguages;
const Jp = (e, t, n, r) => {
        var l, o, s, a;
        const i = [n, { code: t, ...(r || {}) }];
        if (
            (o = (l = e == null ? void 0 : e.services) == null ? void 0 : l.logger) != null &&
            o.forward
        )
            return e.services.logger.forward(i, 'warn', 'react-i18next::', !0);
        (At(i[0]) && (i[0] = `react-i18next:: ${i[0]}`),
            (a = (s = e == null ? void 0 : e.services) == null ? void 0 : s.logger) != null &&
            a.warn
                ? e.services.logger.warn(...i)
                : console != null && console.warn && console.warn(...i));
    },
    Oa = {},
    Xc = (e, t, n, r) => {
        (At(n) && Oa[n]) || (At(n) && (Oa[n] = new Date()), Jp(e, t, n, r));
    },
    Zc = (e, t) => () => {
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
    ao = (e, t, n) => {
        e.loadNamespaces(t, Zc(e, n));
    },
    _a = (e, t, n, r) => {
        if ((At(n) && (n = [n]), e.options.preload && e.options.preload.indexOf(t) > -1))
            return ao(e, n, r);
        (n.forEach((i) => {
            e.options.ns.indexOf(i) < 0 && e.options.ns.push(i);
        }),
            e.loadLanguages(t, Zc(e, r)));
    },
    qp = (e, t, n = {}) =>
        !t.languages || !t.languages.length
            ? (Xc(t, 'NO_LANGUAGES', 'i18n.languages were undefined or empty', {
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
    At = (e) => typeof e == 'string',
    bp = (e) => typeof e == 'object' && e !== null,
    eh =
        /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g,
    th = {
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
    nh = (e) => th[e],
    rh = (e) => e.replace(eh, nh);
let uo = {
    bindI18n: 'languageChanged',
    bindI18nStore: '',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: !0,
    transWrapTextNodes: '',
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    useSuspense: !0,
    unescape: rh,
    transDefaultProps: void 0,
};
const ih = (e = {}) => {
        uo = { ...uo, ...e };
    },
    lh = () => uo;
let Jc;
const oh = (e) => {
        Jc = e;
    },
    sh = () => Jc,
    ah = {
        type: '3rdParty',
        init(e) {
            (ih(e.options.react), oh(e));
        },
    },
    uh = q.createContext();
class ch {
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
var qc = { exports: {} },
    bc = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var xn = q;
function fh(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var dh = typeof Object.is == 'function' ? Object.is : fh,
    ph = xn.useState,
    hh = xn.useEffect,
    gh = xn.useLayoutEffect,
    mh = xn.useDebugValue;
function yh(e, t) {
    var n = t(),
        r = ph({ inst: { value: n, getSnapshot: t } }),
        i = r[0].inst,
        l = r[1];
    return (
        gh(
            function () {
                ((i.value = n), (i.getSnapshot = t), dl(i) && l({ inst: i }));
            },
            [e, n, t],
        ),
        hh(
            function () {
                return (
                    dl(i) && l({ inst: i }),
                    e(function () {
                        dl(i) && l({ inst: i });
                    })
                );
            },
            [e],
        ),
        mh(n),
        n
    );
}
function dl(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !dh(e, n);
    } catch {
        return !0;
    }
}
function vh(e, t) {
    return t();
}
var wh =
    typeof window > 'u' ||
    typeof window.document > 'u' ||
    typeof window.document.createElement > 'u'
        ? vh
        : yh;
bc.useSyncExternalStore = xn.useSyncExternalStore !== void 0 ? xn.useSyncExternalStore : wh;
qc.exports = bc;
var xh = qc.exports;
const Sh = (e, t) =>
        At(t)
            ? t
            : bp(t) && At(t.defaultValue)
              ? t.defaultValue
              : Array.isArray(e)
                ? e[e.length - 1]
                : e,
    kh = { t: Sh, ready: !1 },
    Eh = () => () => {},
    Ch = (e, t = {}) => {
        var z, O, ae;
        const { i18n: n } = t,
            { i18n: r, defaultNS: i } = q.useContext(uh) || {},
            l = n || r || sh();
        (l && !l.reportNamespaces && (l.reportNamespaces = new ch()),
            l ||
                Xc(
                    l,
                    'NO_I18NEXT_INSTANCE',
                    'useTranslation: You will need to pass in an i18next instance by using initReactI18next',
                ));
        const o = q.useMemo(() => {
                var $;
                return {
                    ...lh(),
                    ...(($ = l == null ? void 0 : l.options) == null ? void 0 : $.react),
                    ...t,
                };
            }, [l, t]),
            { useSuspense: s, keyPrefix: a } = o,
            u = i || ((z = l == null ? void 0 : l.options) == null ? void 0 : z.defaultNS),
            d = At(u) ? [u] : u || ['translation'],
            f = q.useMemo(() => d, d);
        (ae =
            (O = l == null ? void 0 : l.reportNamespaces) == null ? void 0 : O.addUsedNamespaces) ==
            null || ae.call(O, f);
        const g = q.useRef(0),
            y = q.useCallback(
                ($) => {
                    if (!l) return Eh;
                    const { bindI18n: F, bindI18nStore: M } = o,
                        X = () => {
                            ((g.current += 1), $());
                        };
                    return (
                        F && l.on(F, X),
                        M && l.store.on(M, X),
                        () => {
                            (F && F.split(' ').forEach((ee) => l.off(ee, X)),
                                M && M.split(' ').forEach((ee) => l.store.off(ee, X)));
                        }
                    );
                },
                [l, o],
            ),
            m = q.useRef(),
            w = q.useCallback(() => {
                if (!l) return kh;
                const $ =
                        !!(l.isInitialized || l.initializedStoreOnce) &&
                        f.every((k) => qp(k, l, o)),
                    F = t.lng || l.language,
                    M = g.current,
                    X = m.current;
                if (X && X.ready === $ && X.lng === F && X.keyPrefix === a && X.revision === M)
                    return X;
                const ue = {
                    t: l.getFixedT(F, o.nsMode === 'fallback' ? f : f[0], a),
                    ready: $,
                    lng: F,
                    keyPrefix: a,
                    revision: M,
                };
                return ((m.current = ue), ue);
            }, [l, f, a, o, t.lng]),
            [T, p] = q.useState(0),
            { t: c, ready: h } = xh.useSyncExternalStore(y, w, w);
        q.useEffect(() => {
            if (l && !h && !s) {
                const $ = () => p((F) => F + 1);
                t.lng ? _a(l, t.lng, f, $) : ao(l, f, $);
            }
        }, [l, t.lng, f, h, s, T]);
        const v = l || {},
            S = q.useRef(null),
            C = q.useRef(),
            E = ($) => {
                const F = Object.getOwnPropertyDescriptors($);
                F.__original && delete F.__original;
                const M = Object.create(Object.getPrototypeOf($), F);
                if (!Object.prototype.hasOwnProperty.call(M, '__original'))
                    try {
                        Object.defineProperty(M, '__original', {
                            value: $,
                            writable: !1,
                            enumerable: !1,
                            configurable: !1,
                        });
                    } catch {}
                return M;
            },
            L = q.useMemo(() => {
                const $ = v,
                    F = $ == null ? void 0 : $.language;
                let M = $;
                $ &&
                    (S.current && S.current.__original === $
                        ? C.current !== F
                            ? ((M = E($)), (S.current = M), (C.current = F))
                            : (M = S.current)
                        : ((M = E($)), (S.current = M), (C.current = F)));
                const X = [c, M, h];
                return ((X.t = c), (X.i18n = M), (X.ready = h), X);
            }, [c, v, h, v.resolvedLanguage, v.language, v.languages]);
        if (l && s && !h)
            throw new Promise(($) => {
                const F = () => $();
                t.lng ? _a(l, t.lng, f, F) : ao(l, f, F);
            });
        return L;
    };
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var Nh = {
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
 */ const Lh = (e) =>
        e
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase()
            .trim(),
    Ph = (e, t) => {
        const n = q.forwardRef(
            (
                {
                    color: r = 'currentColor',
                    size: i = 24,
                    strokeWidth: l = 2,
                    absoluteStrokeWidth: o,
                    className: s = '',
                    children: a,
                    ...u
                },
                d,
            ) =>
                q.createElement(
                    'svg',
                    {
                        ref: d,
                        ...Nh,
                        width: i,
                        height: i,
                        stroke: r,
                        strokeWidth: o ? (Number(l) * 24) / Number(i) : l,
                        className: ['lucide', `lucide-${Lh(e)}`, s].join(' '),
                        ...u,
                    },
                    [...t.map(([f, g]) => q.createElement(f, g)), ...(Array.isArray(a) ? a : [a])],
                ),
        );
        return ((n.displayName = `${e}`), n);
    };
/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Oh = Ph('Slack', [
    ['rect', { width: '3', height: '8', x: '13', y: '2', rx: '1.5', key: 'diqz80' }],
    ['path', { d: 'M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5', key: '183iwg' }],
    ['rect', { width: '3', height: '8', x: '8', y: '14', rx: '1.5', key: 'hqg7r1' }],
    ['path', { d: 'M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5', key: '76g71w' }],
    ['rect', { width: '8', height: '3', x: '14', y: '13', rx: '1.5', key: '1kmz0a' }],
    ['path', { d: 'M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5', key: 'jc4sz0' }],
    ['rect', { width: '8', height: '3', x: '2', y: '8', rx: '1.5', key: '1omvl4' }],
    ['path', { d: 'M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5', key: '16f3cl' }],
]);
function _h() {
    const { t: e, i18n: t } = Ch(),
        n = () => {
            const r = t.language.startsWith('es') ? 'en' : 'es';
            t.changeLanguage(r);
        };
    return P.jsxs('div', {
        className:
            'relative min-h-screen bg-slate-900 text-white overflow-hidden font-mono selection:bg-hal-primary-500/30',
        children: [
            P.jsx('style', {
                dangerouslySetInnerHTML: {
                    __html: `
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');
        body { margin: 0; cursor: default; }
        .font-mono { font-family: 'Geist Mono', monospace; }
      `,
                },
            }),
            P.jsx('div', {
                className: 'absolute inset-0 z-0 opacity-20 pointer-events-none',
                children: P.jsx('img', {
                    src: '/video/base1.gif',
                    alt: 'Background Animation',
                    className: 'w-full h-full object-cover',
                }),
            }),
            P.jsx('div', {
                className:
                    'absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.4)_0%,#0f172a_100%)] mix-blend-multiply',
            }),
            P.jsx('div', {
                className: 'absolute inset-0 z-0 opacity-10 pointer-events-none',
                style: {
                    backgroundImage:
                        'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                },
            }),
            P.jsxs('nav', {
                className:
                    'absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-center',
                children: [
                    P.jsxs(motion.div, {
                        initial: { opacity: 0, y: -20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.5 },
                        className: 'flex items-center gap-3',
                        children: [
                            P.jsx('img', {
                                src: '/images/haltest_logo.jpeg',
                                alt: 'HAL-TEST',
                                className: 'w-8 h-8 rounded-md shadow-lg shadow-hal-primary-500/20',
                            }),
                            P.jsxs('div', {
                                className: 'text-xl font-bold tracking-widest flex gap-1',
                                children: [
                                    P.jsx('span', {
                                        className: 'text-hal-primary-400',
                                        children: 'HAL',
                                    }),
                                    P.jsx('span', { className: 'text-white/30', children: '-' }),
                                    P.jsx('span', {
                                        className: 'text-hal-warning-400',
                                        children: 'TEST',
                                    }),
                                ],
                            }),
                        ],
                    }),
                    P.jsxs(motion.div, {
                        initial: { opacity: 0, y: -20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.5, delay: 0.1 },
                        className:
                            'hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500',
                        children: [
                            P.jsx('span', {
                                className:
                                    'hover:text-hal-primary-400 cursor-pointer transition-colors',
                                children: 'Docs',
                            }),
                            P.jsx('span', {
                                className:
                                    'hover:text-hal-primary-400 cursor-pointer transition-colors',
                                children: 'Roadmap',
                            }),
                            P.jsx('span', {
                                className:
                                    'hover:text-hal-primary-400 cursor-pointer transition-colors',
                                children: 'Pricing',
                            }),
                            P.jsx('span', {
                                onClick: () =>
                                    window.open(
                                        'https://join.slack.com/t/haltest-talk/shared_invite/zt-3o7wqlt53-tzFebjhK5TxQtYZbwK~f~g',
                                        '_blank',
                                    ),
                                className:
                                    'hover:text-hal-primary-400 cursor-pointer transition-colors flex items-center gap-2',
                                children: 'Community',
                            }),
                        ],
                    }),
                    P.jsxs(motion.div, {
                        initial: { opacity: 0, y: -20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.5, delay: 0.2 },
                        className: 'flex items-center gap-6',
                        children: [
                            P.jsx('button', {
                                onClick: n,
                                className:
                                    'text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors',
                                children: t.language.startsWith('es') ? 'EN' : 'ES',
                            }),
                            P.jsxs('div', {
                                className:
                                    'flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10',
                                children: [
                                    P.jsx('div', {
                                        className:
                                            'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse',
                                    }),
                                    P.jsx('span', {
                                        className:
                                            'text-[10px] uppercase text-emerald-500/80 font-bold tracking-wider',
                                        children: e('nav.status') || 'ONLINE',
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
            P.jsxs('main', {
                className:
                    'relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-20',
                children: [
                    P.jsxs(motion.div, {
                        initial: { opacity: 0, scale: 0.8 },
                        animate: { opacity: 1, scale: 1 },
                        transition: { duration: 0.8, ease: 'easeOut' },
                        className: 'mb-8 relative',
                        children: [
                            P.jsx('div', {
                                className:
                                    'absolute inset-0 bg-hal-primary-500/20 blur-3xl rounded-full',
                            }),
                            P.jsx('img', {
                                src: '/images/haltest_logo.jpeg',
                                alt: 'Hero Logo',
                                className:
                                    'w-32 h-32 md:w-32 md:h-32 rounded-2xl shadow-2xl shadow-hal-primary-500/30 relative z-10 border border-white/10',
                            }),
                        ],
                    }),
                    P.jsxs(motion.h1, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.6, delay: 0.2 },
                        className:
                            'text-5xl md:text-7xl font-bold uppercase tracking-tight mb-4 max-w-4xl',
                        children: [
                            P.jsx('span', {
                                className:
                                    'bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50',
                                children: 'The Missing Link',
                            }),
                            P.jsx('br', {}),
                            P.jsx('span', {
                                className: 'text-hal-primary-400',
                                children: 'in Automation',
                            }),
                        ],
                    }),
                    P.jsxs(motion.p, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.6, delay: 0.3 },
                        className:
                            'text-lg md:text-xl text-slate-300 max-w-2xl mb-4 leading-relaxed font-bold',
                        children: [
                            'No-code flow builder with AI-powered healing',
                            P.jsx('br', {}),
                            'and real-time Playwright execution.',
                        ],
                    }),
                    P.jsx(motion.p, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.6, delay: 0.35 },
                        className: 'text-sm md:text-base text-slate-500 max-w-lg mb-12',
                        children:
                            e('hero.subtitle') ||
                            'Unified platform for visual workflows, mock services, and intelligent testing.',
                    }),
                    P.jsxs(motion.div, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.6, delay: 0.4 },
                        className: 'flex flex-col sm:flex-row gap-4 items-center mb-16',
                        children: [
                            P.jsxs(motion.button, {
                                whileHover: { scale: 1.05 },
                                whileTap: { scale: 0.95 },
                                onClick: () => window.open('/app', '_self'),
                                className:
                                    'group relative px-8 py-4 bg-hal-primary-600 hover:bg-hal-primary-500 text-white rounded-lg font-bold uppercase tracking-wider overflow-hidden transition-all shadow-lg shadow-hal-primary-900/50',
                                children: [
                                    P.jsxs('span', {
                                        className: 'relative z-10 flex items-center gap-2',
                                        children: [
                                            e('cta.launch_app') || 'Launch App',
                                            P.jsxs('svg', {
                                                xmlns: 'http://www.w3.org/2000/svg',
                                                width: '16',
                                                height: '16',
                                                viewBox: '0 0 24 24',
                                                fill: 'none',
                                                stroke: 'currentColor',
                                                strokeWidth: '2',
                                                strokeLinecap: 'round',
                                                strokeLinejoin: 'round',
                                                className:
                                                    'transform group-hover:translate-x-1 transition-transform',
                                                children: [
                                                    P.jsx('path', { d: 'M5 12h14' }),
                                                    P.jsx('path', { d: 'm12 5 7 7-7 7' }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    P.jsx('div', {
                                        className:
                                            'absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700',
                                    }),
                                ],
                            }),
                            P.jsx(motion.button, {
                                whileHover: {
                                    scale: 1.05,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                },
                                whileTap: { scale: 0.95 },
                                onClick: () =>
                                    window.open('https://github.com/andresguc1/hal-test', '_blank'),
                                className:
                                    'px-8 py-4 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white rounded-lg font-bold uppercase tracking-wider transition-all backdrop-blur-sm',
                                children: e('cta.star_github') || 'GitHub',
                            }),
                            P.jsxs(motion.button, {
                                whileHover: {
                                    scale: 1.05,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                },
                                whileTap: { scale: 0.95 },
                                onClick: () =>
                                    window.open(
                                        'https://join.slack.com/t/haltest-talk/shared_invite/zt-3o7wqlt53-tzFebjhK5TxQtYZbwK~f~g',
                                        '_blank',
                                    ),
                                className:
                                    'px-8 py-4 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white rounded-lg font-bold uppercase tracking-wider transition-all backdrop-blur-sm flex items-center gap-2',
                                children: [
                                    P.jsx(Oh, { size: 18, className: 'text-[#4A154B]' }),
                                    e('cta.community') || 'Slack',
                                ],
                            }),
                        ],
                    }),
                    P.jsxs(motion.div, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.8, delay: 0.5 },
                        className:
                            'grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/5 pt-8',
                        children: [
                            P.jsxs('div', {
                                className: 'flex flex-col items-center',
                                children: [
                                    P.jsx('span', {
                                        className: 'text-2xl font-bold text-white',
                                        children: '2.5k+',
                                    }),
                                    P.jsx('span', {
                                        className:
                                            'text-[10px] uppercase tracking-widest text-slate-500',
                                        children: 'Flows Executed',
                                    }),
                                ],
                            }),
                            P.jsxs('div', {
                                className: 'flex flex-col items-center',
                                children: [
                                    P.jsx('span', {
                                        className: 'text-2xl font-bold text-white',
                                        children: '45+',
                                    }),
                                    P.jsx('span', {
                                        className:
                                            'text-[10px] uppercase tracking-widest text-slate-500',
                                        children: 'Node Types',
                                    }),
                                ],
                            }),
                            P.jsxs('div', {
                                className: 'flex flex-col items-center',
                                children: [
                                    P.jsx('span', {
                                        className: 'text-2xl font-bold text-white',
                                        children: '99%',
                                    }),
                                    P.jsx('span', {
                                        className:
                                            'text-[10px] uppercase tracking-widest text-slate-500',
                                        children: 'Success Rate',
                                    }),
                                ],
                            }),
                            P.jsxs('div', {
                                className: 'flex flex-col items-center',
                                children: [
                                    P.jsx('span', {
                                        className: 'text-2xl font-bold text-white',
                                        children: 'Open',
                                    }),
                                    P.jsx('span', {
                                        className:
                                            'text-[10px] uppercase tracking-widest text-slate-500',
                                        children: 'Source',
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}
const { slice: Rh, forEach: Th } = [];
function jh(e) {
    return (
        Th.call(Rh.call(arguments, 1), (t) => {
            if (t) for (const n in t) e[n] === void 0 && (e[n] = t[n]);
        }),
        e
    );
}
function zh(e) {
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
const Ra = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/,
    Fh = function (e, t) {
        const r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : { path: '/' },
            i = encodeURIComponent(t);
        let l = `${e}=${i}`;
        if (r.maxAge > 0) {
            const o = r.maxAge - 0;
            if (Number.isNaN(o)) throw new Error('maxAge should be a Number');
            l += `; Max-Age=${Math.floor(o)}`;
        }
        if (r.domain) {
            if (!Ra.test(r.domain)) throw new TypeError('option domain is invalid');
            l += `; Domain=${r.domain}`;
        }
        if (r.path) {
            if (!Ra.test(r.path)) throw new TypeError('option path is invalid');
            l += `; Path=${r.path}`;
        }
        if (r.expires) {
            if (typeof r.expires.toUTCString != 'function')
                throw new TypeError('option expires is invalid');
            l += `; Expires=${r.expires.toUTCString()}`;
        }
        if ((r.httpOnly && (l += '; HttpOnly'), r.secure && (l += '; Secure'), r.sameSite))
            switch (typeof r.sameSite == 'string' ? r.sameSite.toLowerCase() : r.sameSite) {
                case !0:
                    l += '; SameSite=Strict';
                    break;
                case 'lax':
                    l += '; SameSite=Lax';
                    break;
                case 'strict':
                    l += '; SameSite=Strict';
                    break;
                case 'none':
                    l += '; SameSite=None';
                    break;
                default:
                    throw new TypeError('option sameSite is invalid');
            }
        return (r.partitioned && (l += '; Partitioned'), l);
    },
    Ta = {
        create(e, t, n, r) {
            let i =
                arguments.length > 4 && arguments[4] !== void 0
                    ? arguments[4]
                    : { path: '/', sameSite: 'strict' };
            (n && ((i.expires = new Date()), i.expires.setTime(i.expires.getTime() + n * 60 * 1e3)),
                r && (i.domain = r),
                (document.cookie = Fh(e, t, i)));
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
var Ih = {
        name: 'cookie',
        lookup(e) {
            let { lookupCookie: t } = e;
            if (t && typeof document < 'u') return Ta.read(t) || void 0;
        },
        cacheUserLanguage(e, t) {
            let { lookupCookie: n, cookieMinutes: r, cookieDomain: i, cookieOptions: l } = t;
            n && typeof document < 'u' && Ta.create(n, e, r, i, l);
        },
    },
    Dh = {
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
                for (let s = 0; s < o.length; s++) {
                    const a = o[s].indexOf('=');
                    a > 0 && o[s].substring(0, a) === t && (n = o[s].substring(a + 1));
                }
            }
            return n;
        },
    },
    Mh = {
        name: 'hash',
        lookup(e) {
            var i;
            let { lookupHash: t, lookupFromHashIndex: n } = e,
                r;
            if (typeof window < 'u') {
                const { hash: l } = window.location;
                if (l && l.length > 2) {
                    const o = l.substring(1);
                    if (t) {
                        const s = o.split('&');
                        for (let a = 0; a < s.length; a++) {
                            const u = s[a].indexOf('=');
                            u > 0 && s[a].substring(0, u) === t && (r = s[a].substring(u + 1));
                        }
                    }
                    if (r) return r;
                    if (!r && n > -1) {
                        const s = l.match(/\/([a-zA-Z-]*)/g);
                        return Array.isArray(s)
                            ? (i = s[typeof n == 'number' ? n : 0]) == null
                                ? void 0
                                : i.replace('/', '')
                            : void 0;
                    }
                }
            }
            return r;
        },
    };
let Qt = null;
const ja = () => {
    if (Qt !== null) return Qt;
    try {
        if (((Qt = typeof window < 'u' && window.localStorage !== null), !Qt)) return !1;
        const e = 'i18next.translate.boo';
        (window.localStorage.setItem(e, 'foo'), window.localStorage.removeItem(e));
    } catch {
        Qt = !1;
    }
    return Qt;
};
var $h = {
    name: 'localStorage',
    lookup(e) {
        let { lookupLocalStorage: t } = e;
        if (t && ja()) return window.localStorage.getItem(t) || void 0;
    },
    cacheUserLanguage(e, t) {
        let { lookupLocalStorage: n } = t;
        n && ja() && window.localStorage.setItem(n, e);
    },
};
let Yt = null;
const za = () => {
    if (Yt !== null) return Yt;
    try {
        if (((Yt = typeof window < 'u' && window.sessionStorage !== null), !Yt)) return !1;
        const e = 'i18next.translate.boo';
        (window.sessionStorage.setItem(e, 'foo'), window.sessionStorage.removeItem(e));
    } catch {
        Yt = !1;
    }
    return Yt;
};
var Uh = {
        name: 'sessionStorage',
        lookup(e) {
            let { lookupSessionStorage: t } = e;
            if (t && za()) return window.sessionStorage.getItem(t) || void 0;
        },
        cacheUserLanguage(e, t) {
            let { lookupSessionStorage: n } = t;
            n && za() && window.sessionStorage.setItem(n, e);
        },
    },
    Ah = {
        name: 'navigator',
        lookup(e) {
            const t = [];
            if (typeof navigator < 'u') {
                const { languages: n, userLanguage: r, language: i } = navigator;
                if (n) for (let l = 0; l < n.length; l++) t.push(n[l]);
                (r && t.push(r), i && t.push(i));
            }
            return t.length > 0 ? t : void 0;
        },
    },
    Vh = {
        name: 'htmlTag',
        lookup(e) {
            let { htmlTag: t } = e,
                n;
            const r = t || (typeof document < 'u' ? document.documentElement : null);
            return (r && typeof r.getAttribute == 'function' && (n = r.getAttribute('lang')), n);
        },
    },
    Hh = {
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
    Bh = {
        name: 'subdomain',
        lookup(e) {
            var i, l;
            let { lookupFromSubdomainIndex: t } = e;
            const n = typeof t == 'number' ? t + 1 : 1,
                r =
                    typeof window < 'u' &&
                    ((l = (i = window.location) == null ? void 0 : i.hostname) == null
                        ? void 0
                        : l.match(/^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i));
            if (r) return r[n];
        },
    };
let ef = !1;
try {
    (document.cookie, (ef = !0));
} catch {}
const tf = ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'];
ef || tf.splice(1, 1);
const Kh = () => ({
    order: tf,
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    lookupSessionStorage: 'i18nextLng',
    caches: ['localStorage'],
    excludeCacheFor: ['cimode'],
    convertDetectedLanguage: (e) => e,
});
class nf {
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
            (this.options = jh(n, this.options || {}, Kh())),
            typeof this.options.convertDetectedLanguage == 'string' &&
                this.options.convertDetectedLanguage.indexOf('15897') > -1 &&
                (this.options.convertDetectedLanguage = (i) => i.replace('-', '_')),
            this.options.lookupFromUrlIndex &&
                (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
            (this.i18nOptions = r),
            this.addDetector(Ih),
            this.addDetector(Dh),
            this.addDetector($h),
            this.addDetector(Uh),
            this.addDetector(Ah),
            this.addDetector(Vh),
            this.addDetector(Hh),
            this.addDetector(Bh),
            this.addDetector(Mh));
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
                .filter((r) => r != null && !zh(r))
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
nf.type = 'languageDetector';
const Wh = {
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
                community: 'Community',
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
                community: 'Comunidad',
            },
            nav: { status: 'Estado: Operando' },
            language: { en: 'English', es: 'Español' },
        },
    },
};
ve.use(nf)
    .use(ah)
    .init({
        resources: Wh,
        fallbackLng: 'en',
        interpolation: { escapeValue: !1 },
        detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    });
pl.createRoot(document.getElementById('root')).render(
    P.jsx(xf.StrictMode, { children: P.jsx(_h, {}) }),
);
