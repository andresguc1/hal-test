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
function wg(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
}
var kd = { exports: {} },
    js = {},
    Pd = { exports: {} },
    I = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var ci = Symbol.for('react.element'),
    Sg = Symbol.for('react.portal'),
    kg = Symbol.for('react.fragment'),
    Pg = Symbol.for('react.strict_mode'),
    Cg = Symbol.for('react.profiler'),
    Tg = Symbol.for('react.provider'),
    Eg = Symbol.for('react.context'),
    Lg = Symbol.for('react.forward_ref'),
    Rg = Symbol.for('react.suspense'),
    Ag = Symbol.for('react.memo'),
    Ng = Symbol.for('react.lazy'),
    Ou = Symbol.iterator;
function Dg(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = (Ou && e[Ou]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var Cd = {
        isMounted: function () {
            return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
    },
    Td = Object.assign,
    Ed = {};
function ir(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = Ed), (this.updater = n || Cd));
}
ir.prototype.isReactComponent = {};
ir.prototype.setState = function (e, t) {
    if (typeof e != 'object' && typeof e != 'function' && e != null)
        throw Error(
            'setState(...): takes an object of state variables to update or a function which returns an object of state variables.',
        );
    this.updater.enqueueSetState(this, e, t, 'setState');
};
ir.prototype.forceUpdate = function (e) {
    this.updater.enqueueForceUpdate(this, e, 'forceUpdate');
};
function Ld() {}
Ld.prototype = ir.prototype;
function ol(e, t, n) {
    ((this.props = e), (this.context = t), (this.refs = Ed), (this.updater = n || Cd));
}
var al = (ol.prototype = new Ld());
al.constructor = ol;
Td(al, ir.prototype);
al.isPureReactComponent = !0;
var Mu = Array.isArray,
    Rd = Object.prototype.hasOwnProperty,
    ll = { current: null },
    Ad = { key: !0, ref: !0, __self: !0, __source: !0 };
function Nd(e, t, n) {
    var r,
        i = {},
        s = null,
        o = null;
    if (t != null)
        for (r in (t.ref !== void 0 && (o = t.ref), t.key !== void 0 && (s = '' + t.key), t))
            Rd.call(t, r) && !Ad.hasOwnProperty(r) && (i[r] = t[r]);
    var a = arguments.length - 2;
    if (a === 1) i.children = n;
    else if (1 < a) {
        for (var l = Array(a), u = 0; u < a; u++) l[u] = arguments[u + 2];
        i.children = l;
    }
    if (e && e.defaultProps) for (r in ((a = e.defaultProps), a)) i[r] === void 0 && (i[r] = a[r]);
    return { $$typeof: ci, type: e, key: s, ref: o, props: i, _owner: ll.current };
}
function Og(e, t) {
    return { $$typeof: ci, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function ul(e) {
    return typeof e == 'object' && e !== null && e.$$typeof === ci;
}
function Mg(e) {
    var t = { '=': '=0', ':': '=2' };
    return (
        '$' +
        e.replace(/[=:]/g, function (n) {
            return t[n];
        })
    );
}
var Vu = /\/+/g;
function io(e, t) {
    return typeof e == 'object' && e !== null && e.key != null ? Mg('' + e.key) : t.toString(36);
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
                    case ci:
                    case Sg:
                        o = !0;
                }
        }
    if (o)
        return (
            (o = e),
            (i = i(o)),
            (e = r === '' ? '.' + io(o, 0) : r),
            Mu(i)
                ? ((n = ''),
                  e != null && (n = e.replace(Vu, '$&/') + '/'),
                  Ui(i, t, n, '', function (u) {
                      return u;
                  }))
                : i != null &&
                  (ul(i) &&
                      (i = Og(
                          i,
                          n +
                              (!i.key || (o && o.key === i.key)
                                  ? ''
                                  : ('' + i.key).replace(Vu, '$&/') + '/') +
                              e,
                      )),
                  t.push(i)),
            1
        );
    if (((o = 0), (r = r === '' ? '.' : r + ':'), Mu(e)))
        for (var a = 0; a < e.length; a++) {
            s = e[a];
            var l = r + io(s, a);
            o += Ui(s, t, n, l, i);
        }
    else if (((l = Dg(e)), typeof l == 'function'))
        for (e = l.call(e), a = 0; !(s = e.next()).done; )
            ((s = s.value), (l = r + io(s, a++)), (o += Ui(s, t, n, l, i)));
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
function wi(e, t, n) {
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
function Vg(e) {
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
var Ce = { current: null },
    $i = { transition: null },
    _g = { ReactCurrentDispatcher: Ce, ReactCurrentBatchConfig: $i, ReactCurrentOwner: ll };
function Dd() {
    throw Error('act(...) is not supported in production builds of React.');
}
I.Children = {
    map: wi,
    forEach: function (e, t, n) {
        wi(
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
            wi(e, function () {
                t++;
            }),
            t
        );
    },
    toArray: function (e) {
        return (
            wi(e, function (t) {
                return t;
            }) || []
        );
    },
    only: function (e) {
        if (!ul(e))
            throw Error('React.Children.only expected to receive a single React element child.');
        return e;
    },
};
I.Component = ir;
I.Fragment = kg;
I.Profiler = Cg;
I.PureComponent = ol;
I.StrictMode = Pg;
I.Suspense = Rg;
I.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = _g;
I.act = Dd;
I.cloneElement = function (e, t, n) {
    if (e == null)
        throw Error(
            'React.cloneElement(...): The argument must be a React element, but you passed ' +
                e +
                '.',
        );
    var r = Td({}, e.props),
        i = e.key,
        s = e.ref,
        o = e._owner;
    if (t != null) {
        if (
            (t.ref !== void 0 && ((s = t.ref), (o = ll.current)),
            t.key !== void 0 && (i = '' + t.key),
            e.type && e.type.defaultProps)
        )
            var a = e.type.defaultProps;
        for (l in t)
            Rd.call(t, l) &&
                !Ad.hasOwnProperty(l) &&
                (r[l] = t[l] === void 0 && a !== void 0 ? a[l] : t[l]);
    }
    var l = arguments.length - 2;
    if (l === 1) r.children = n;
    else if (1 < l) {
        a = Array(l);
        for (var u = 0; u < l; u++) a[u] = arguments[u + 2];
        r.children = a;
    }
    return { $$typeof: ci, type: e.type, key: i, ref: s, props: r, _owner: o };
};
I.createContext = function (e) {
    return (
        (e = {
            $$typeof: Eg,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
            _defaultValue: null,
            _globalName: null,
        }),
        (e.Provider = { $$typeof: Tg, _context: e }),
        (e.Consumer = e)
    );
};
I.createElement = Nd;
I.createFactory = function (e) {
    var t = Nd.bind(null, e);
    return ((t.type = e), t);
};
I.createRef = function () {
    return { current: null };
};
I.forwardRef = function (e) {
    return { $$typeof: Lg, render: e };
};
I.isValidElement = ul;
I.lazy = function (e) {
    return { $$typeof: Ng, _payload: { _status: -1, _result: e }, _init: Vg };
};
I.memo = function (e, t) {
    return { $$typeof: Ag, type: e, compare: t === void 0 ? null : t };
};
I.startTransition = function (e) {
    var t = $i.transition;
    $i.transition = {};
    try {
        e();
    } finally {
        $i.transition = t;
    }
};
I.unstable_act = Dd;
I.useCallback = function (e, t) {
    return Ce.current.useCallback(e, t);
};
I.useContext = function (e) {
    return Ce.current.useContext(e);
};
I.useDebugValue = function () {};
I.useDeferredValue = function (e) {
    return Ce.current.useDeferredValue(e);
};
I.useEffect = function (e, t) {
    return Ce.current.useEffect(e, t);
};
I.useId = function () {
    return Ce.current.useId();
};
I.useImperativeHandle = function (e, t, n) {
    return Ce.current.useImperativeHandle(e, t, n);
};
I.useInsertionEffect = function (e, t) {
    return Ce.current.useInsertionEffect(e, t);
};
I.useLayoutEffect = function (e, t) {
    return Ce.current.useLayoutEffect(e, t);
};
I.useMemo = function (e, t) {
    return Ce.current.useMemo(e, t);
};
I.useReducer = function (e, t, n) {
    return Ce.current.useReducer(e, t, n);
};
I.useRef = function (e) {
    return Ce.current.useRef(e);
};
I.useState = function (e) {
    return Ce.current.useState(e);
};
I.useSyncExternalStore = function (e, t, n) {
    return Ce.current.useSyncExternalStore(e, t, n);
};
I.useTransition = function () {
    return Ce.current.useTransition();
};
I.version = '18.3.1';
Pd.exports = I;
var N = Pd.exports;
const jg = wg(N);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Fg = N,
    Ig = Symbol.for('react.element'),
    zg = Symbol.for('react.fragment'),
    Bg = Object.prototype.hasOwnProperty,
    Ug = Fg.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    $g = { key: !0, ref: !0, __self: !0, __source: !0 };
function Od(e, t, n) {
    var r,
        i = {},
        s = null,
        o = null;
    (n !== void 0 && (s = '' + n),
        t.key !== void 0 && (s = '' + t.key),
        t.ref !== void 0 && (o = t.ref));
    for (r in t) Bg.call(t, r) && !$g.hasOwnProperty(r) && (i[r] = t[r]);
    if (e && e.defaultProps) for (r in ((t = e.defaultProps), t)) i[r] === void 0 && (i[r] = t[r]);
    return { $$typeof: Ig, type: e, key: s, ref: o, props: i, _owner: Ug.current };
}
js.Fragment = zg;
js.jsx = Od;
js.jsxs = Od;
kd.exports = js;
var A = kd.exports,
    Go = {},
    Md = { exports: {} },
    Ie = {},
    Vd = { exports: {} },
    _d = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
    function t(E, O) {
        var _ = E.length;
        E.push(O);
        e: for (; 0 < _; ) {
            var B = (_ - 1) >>> 1,
                K = E[B];
            if (0 < i(K, O)) ((E[B] = O), (E[_] = K), (_ = B));
            else break e;
        }
    }
    function n(E) {
        return E.length === 0 ? null : E[0];
    }
    function r(E) {
        if (E.length === 0) return null;
        var O = E[0],
            _ = E.pop();
        if (_ !== O) {
            E[0] = _;
            e: for (var B = 0, K = E.length, rt = K >>> 1; B < rt; ) {
                var it = 2 * (B + 1) - 1,
                    xn = E[it],
                    Xt = it + 1,
                    xi = E[Xt];
                if (0 > i(xn, _))
                    Xt < K && 0 > i(xi, xn)
                        ? ((E[B] = xi), (E[Xt] = _), (B = Xt))
                        : ((E[B] = xn), (E[it] = _), (B = it));
                else if (Xt < K && 0 > i(xi, _)) ((E[B] = xi), (E[Xt] = _), (B = Xt));
                else break e;
            }
        }
        return O;
    }
    function i(E, O) {
        var _ = E.sortIndex - O.sortIndex;
        return _ !== 0 ? _ : E.id - O.id;
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
    function g(E) {
        for (var O = n(u); O !== null; ) {
            if (O.callback === null) r(u);
            else if (O.startTime <= E) (r(u), (O.sortIndex = O.expirationTime), t(l, O));
            else break;
            O = n(u);
        }
    }
    function x(E) {
        if (((v = !1), g(E), !y))
            if (n(l) !== null) ((y = !0), oe(w));
            else {
                var O = n(u);
                O !== null && $(x, O.startTime - E);
            }
    }
    function w(E, O) {
        ((y = !1), v && ((v = !1), p(k), (k = -1)), (m = !0));
        var _ = d;
        try {
            for (g(O), f = n(l); f !== null && (!(f.expirationTime > O) || (E && !X())); ) {
                var B = f.callback;
                if (typeof B == 'function') {
                    ((f.callback = null), (d = f.priorityLevel));
                    var K = B(f.expirationTime <= O);
                    ((O = e.unstable_now()),
                        typeof K == 'function' ? (f.callback = K) : f === n(l) && r(l),
                        g(O));
                } else r(l);
                f = n(l);
            }
            if (f !== null) var rt = !0;
            else {
                var it = n(u);
                (it !== null && $(x, it.startTime - O), (rt = !1));
            }
            return rt;
        } finally {
            ((f = null), (d = _), (m = !1));
        }
    }
    var P = !1,
        T = null,
        k = -1,
        D = 5,
        L = -1;
    function X() {
        return !(e.unstable_now() - L < D);
    }
    function z() {
        if (T !== null) {
            var E = e.unstable_now();
            L = E;
            var O = !0;
            try {
                O = T(!0, E);
            } finally {
                O ? j() : ((P = !1), (T = null));
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
    function oe(E) {
        ((T = E), P || ((P = !0), j()));
    }
    function $(E, O) {
        k = S(function () {
            E(e.unstable_now());
        }, O);
    }
    ((e.unstable_IdlePriority = 5),
        (e.unstable_ImmediatePriority = 1),
        (e.unstable_LowPriority = 4),
        (e.unstable_NormalPriority = 3),
        (e.unstable_Profiling = null),
        (e.unstable_UserBlockingPriority = 2),
        (e.unstable_cancelCallback = function (E) {
            E.callback = null;
        }),
        (e.unstable_continueExecution = function () {
            y || m || ((y = !0), oe(w));
        }),
        (e.unstable_forceFrameRate = function (E) {
            0 > E || 125 < E
                ? console.error(
                      'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported',
                  )
                : (D = 0 < E ? Math.floor(1e3 / E) : 5);
        }),
        (e.unstable_getCurrentPriorityLevel = function () {
            return d;
        }),
        (e.unstable_getFirstCallbackNode = function () {
            return n(l);
        }),
        (e.unstable_next = function (E) {
            switch (d) {
                case 1:
                case 2:
                case 3:
                    var O = 3;
                    break;
                default:
                    O = d;
            }
            var _ = d;
            d = O;
            try {
                return E();
            } finally {
                d = _;
            }
        }),
        (e.unstable_pauseExecution = function () {}),
        (e.unstable_requestPaint = function () {}),
        (e.unstable_runWithPriority = function (E, O) {
            switch (E) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    break;
                default:
                    E = 3;
            }
            var _ = d;
            d = E;
            try {
                return O();
            } finally {
                d = _;
            }
        }),
        (e.unstable_scheduleCallback = function (E, O, _) {
            var B = e.unstable_now();
            switch (
                (typeof _ == 'object' && _ !== null
                    ? ((_ = _.delay), (_ = typeof _ == 'number' && 0 < _ ? B + _ : B))
                    : (_ = B),
                E)
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
                (E = {
                    id: c++,
                    callback: O,
                    priorityLevel: E,
                    startTime: _,
                    expirationTime: K,
                    sortIndex: -1,
                }),
                _ > B
                    ? ((E.sortIndex = _),
                      t(u, E),
                      n(l) === null && E === n(u) && (v ? (p(k), (k = -1)) : (v = !0), $(x, _ - B)))
                    : ((E.sortIndex = K), t(l, E), y || m || ((y = !0), oe(w))),
                E
            );
        }),
        (e.unstable_shouldYield = X),
        (e.unstable_wrapCallback = function (E) {
            var O = d;
            return function () {
                var _ = d;
                d = O;
                try {
                    return E.apply(this, arguments);
                } finally {
                    d = _;
                }
            };
        }));
})(_d);
Vd.exports = _d;
var Hg = Vd.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Kg = N,
    je = Hg;
function C(e) {
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
var jd = new Set(),
    Ur = {};
function gn(e, t) {
    (Gn(e, t), Gn(e + 'Capture', t));
}
function Gn(e, t) {
    for (Ur[e] = t, e = 0; e < t.length; e++) jd.add(t[e]);
}
var wt = !(
        typeof window > 'u' ||
        typeof window.document > 'u' ||
        typeof window.document.createElement > 'u'
    ),
    Qo = Object.prototype.hasOwnProperty,
    Wg =
        /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
    _u = {},
    ju = {};
function bg(e) {
    return Qo.call(ju, e)
        ? !0
        : Qo.call(_u, e)
          ? !1
          : Wg.test(e)
            ? (ju[e] = !0)
            : ((_u[e] = !0), !1);
}
function Gg(e, t, n, r) {
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
function Qg(e, t, n, r) {
    if (t === null || typeof t > 'u' || Gg(e, t, n, r)) return !0;
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
function Te(e, t, n, r, i, s, o) {
    ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
        (this.attributeName = r),
        (this.attributeNamespace = i),
        (this.mustUseProperty = n),
        (this.propertyName = e),
        (this.type = t),
        (this.sanitizeURL = s),
        (this.removeEmptyString = o));
}
var me = {};
'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
    .split(' ')
    .forEach(function (e) {
        me[e] = new Te(e, 0, !1, e, null, !1, !1);
    });
[
    ['acceptCharset', 'accept-charset'],
    ['className', 'class'],
    ['htmlFor', 'for'],
    ['httpEquiv', 'http-equiv'],
].forEach(function (e) {
    var t = e[0];
    me[t] = new Te(t, 1, !1, e[1], null, !1, !1);
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
    me[e] = new Te(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (e) {
    me[e] = new Te(e, 2, !1, e, null, !1, !1);
});
'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
    .split(' ')
    .forEach(function (e) {
        me[e] = new Te(e, 3, !1, e.toLowerCase(), null, !1, !1);
    });
['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
    me[e] = new Te(e, 3, !0, e, null, !1, !1);
});
['capture', 'download'].forEach(function (e) {
    me[e] = new Te(e, 4, !1, e, null, !1, !1);
});
['cols', 'rows', 'size', 'span'].forEach(function (e) {
    me[e] = new Te(e, 6, !1, e, null, !1, !1);
});
['rowSpan', 'start'].forEach(function (e) {
    me[e] = new Te(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var cl = /[\-:]([a-z])/g;
function fl(e) {
    return e[1].toUpperCase();
}
'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(cl, fl);
        me[t] = new Te(t, 1, !1, e, null, !1, !1);
    });
'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'
    .split(' ')
    .forEach(function (e) {
        var t = e.replace(cl, fl);
        me[t] = new Te(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
    });
['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
    var t = e.replace(cl, fl);
    me[t] = new Te(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
});
['tabIndex', 'crossOrigin'].forEach(function (e) {
    me[e] = new Te(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
me.xlinkHref = new Te('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1);
['src', 'href', 'action', 'formAction'].forEach(function (e) {
    me[e] = new Te(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function dl(e, t, n, r) {
    var i = me.hasOwnProperty(t) ? me[t] : null;
    (i !== null
        ? i.type !== 0
        : r ||
          !(2 < t.length) ||
          (t[0] !== 'o' && t[0] !== 'O') ||
          (t[1] !== 'n' && t[1] !== 'N')) &&
        (Qg(t, n, i, r) && (n = null),
        r || i === null
            ? bg(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, '' + n))
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
var Tt = Kg.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    Si = Symbol.for('react.element'),
    Cn = Symbol.for('react.portal'),
    Tn = Symbol.for('react.fragment'),
    hl = Symbol.for('react.strict_mode'),
    Yo = Symbol.for('react.profiler'),
    Fd = Symbol.for('react.provider'),
    Id = Symbol.for('react.context'),
    pl = Symbol.for('react.forward_ref'),
    Xo = Symbol.for('react.suspense'),
    Zo = Symbol.for('react.suspense_list'),
    ml = Symbol.for('react.memo'),
    Rt = Symbol.for('react.lazy'),
    zd = Symbol.for('react.offscreen'),
    Fu = Symbol.iterator;
function ur(e) {
    return e === null || typeof e != 'object'
        ? null
        : ((e = (Fu && e[Fu]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var te = Object.assign,
    so;
function xr(e) {
    if (so === void 0)
        try {
            throw Error();
        } catch (n) {
            var t = n.stack.trim().match(/\n( *(at )?)/);
            so = (t && t[1]) || '';
        }
    return (
        `
` +
        so +
        e
    );
}
var oo = !1;
function ao(e, t) {
    if (!e || oo) return '';
    oo = !0;
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
        ((oo = !1), (Error.prepareStackTrace = n));
    }
    return (e = e ? e.displayName || e.name : '') ? xr(e) : '';
}
function Yg(e) {
    switch (e.tag) {
        case 5:
            return xr(e.type);
        case 16:
            return xr('Lazy');
        case 13:
            return xr('Suspense');
        case 19:
            return xr('SuspenseList');
        case 0:
        case 2:
        case 15:
            return ((e = ao(e.type, !1)), e);
        case 11:
            return ((e = ao(e.type.render, !1)), e);
        case 1:
            return ((e = ao(e.type, !0)), e);
        default:
            return '';
    }
}
function Jo(e) {
    if (e == null) return null;
    if (typeof e == 'function') return e.displayName || e.name || null;
    if (typeof e == 'string') return e;
    switch (e) {
        case Tn:
            return 'Fragment';
        case Cn:
            return 'Portal';
        case Yo:
            return 'Profiler';
        case hl:
            return 'StrictMode';
        case Xo:
            return 'Suspense';
        case Zo:
            return 'SuspenseList';
    }
    if (typeof e == 'object')
        switch (e.$$typeof) {
            case Id:
                return (e.displayName || 'Context') + '.Consumer';
            case Fd:
                return (e._context.displayName || 'Context') + '.Provider';
            case pl:
                var t = e.render;
                return (
                    (e = e.displayName),
                    e ||
                        ((e = t.displayName || t.name || ''),
                        (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
                    e
                );
            case ml:
                return ((t = e.displayName || null), t !== null ? t : Jo(e.type) || 'Memo');
            case Rt:
                ((t = e._payload), (e = e._init));
                try {
                    return Jo(e(t));
                } catch {}
        }
    return null;
}
function Xg(e) {
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
            return Jo(t);
        case 8:
            return t === hl ? 'StrictMode' : 'Mode';
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
function $t(e) {
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
function Bd(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio');
}
function Zg(e) {
    var t = Bd(e) ? 'checked' : 'value',
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
function ki(e) {
    e._valueTracker || (e._valueTracker = Zg(e));
}
function Ud(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var n = t.getValue(),
        r = '';
    return (
        e && (r = Bd(e) ? (e.checked ? 'true' : 'false') : e.value),
        (e = r),
        e !== n ? (t.setValue(e), !0) : !1
    );
}
function ns(e) {
    if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
    try {
        return e.activeElement || e.body;
    } catch {
        return e.body;
    }
}
function qo(e, t) {
    var n = t.checked;
    return te({}, t, {
        defaultChecked: void 0,
        defaultValue: void 0,
        value: void 0,
        checked: n ?? e._wrapperState.initialChecked,
    });
}
function Iu(e, t) {
    var n = t.defaultValue == null ? '' : t.defaultValue,
        r = t.checked != null ? t.checked : t.defaultChecked;
    ((n = $t(t.value != null ? t.value : n)),
        (e._wrapperState = {
            initialChecked: r,
            initialValue: n,
            controlled:
                t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
        }));
}
function $d(e, t) {
    ((t = t.checked), t != null && dl(e, 'checked', t, !1));
}
function ea(e, t) {
    $d(e, t);
    var n = $t(t.value),
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
        ? ta(e, t.type, n)
        : t.hasOwnProperty('defaultValue') && ta(e, t.type, $t(t.defaultValue)),
        t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked));
}
function zu(e, t, n) {
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
function ta(e, t, n) {
    (t !== 'number' || ns(e.ownerDocument) !== e) &&
        (n == null
            ? (e.defaultValue = '' + e._wrapperState.initialValue)
            : e.defaultValue !== '' + n && (e.defaultValue = '' + n));
}
var wr = Array.isArray;
function Un(e, t, n, r) {
    if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t['$' + n[i]] = !0;
        for (n = 0; n < e.length; n++)
            ((i = t.hasOwnProperty('$' + e[n].value)),
                e[n].selected !== i && (e[n].selected = i),
                i && r && (e[n].defaultSelected = !0));
    } else {
        for (n = '' + $t(n), t = null, i = 0; i < e.length; i++) {
            if (e[i].value === n) {
                ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
                return;
            }
            t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
    }
}
function na(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(C(91));
    return te({}, t, {
        value: void 0,
        defaultValue: void 0,
        children: '' + e._wrapperState.initialValue,
    });
}
function Bu(e, t) {
    var n = t.value;
    if (n == null) {
        if (((n = t.children), (t = t.defaultValue), n != null)) {
            if (t != null) throw Error(C(92));
            if (wr(n)) {
                if (1 < n.length) throw Error(C(93));
                n = n[0];
            }
            t = n;
        }
        (t == null && (t = ''), (n = t));
    }
    e._wrapperState = { initialValue: $t(n) };
}
function Hd(e, t) {
    var n = $t(t.value),
        r = $t(t.defaultValue);
    (n != null &&
        ((n = '' + n),
        n !== e.value && (e.value = n),
        t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
        r != null && (e.defaultValue = '' + r));
}
function Uu(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
}
function Kd(e) {
    switch (e) {
        case 'svg':
            return 'http://www.w3.org/2000/svg';
        case 'math':
            return 'http://www.w3.org/1998/Math/MathML';
        default:
            return 'http://www.w3.org/1999/xhtml';
    }
}
function ra(e, t) {
    return e == null || e === 'http://www.w3.org/1999/xhtml'
        ? Kd(t)
        : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
          ? 'http://www.w3.org/1999/xhtml'
          : e;
}
var Pi,
    Wd = (function (e) {
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
function $r(e, t) {
    if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
            n.nodeValue = t;
            return;
        }
    }
    e.textContent = t;
}
var Er = {
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
    Jg = ['Webkit', 'ms', 'Moz', 'O'];
Object.keys(Er).forEach(function (e) {
    Jg.forEach(function (t) {
        ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Er[t] = Er[e]));
    });
});
function bd(e, t, n) {
    return t == null || typeof t == 'boolean' || t === ''
        ? ''
        : n || typeof t != 'number' || t === 0 || (Er.hasOwnProperty(e) && Er[e])
          ? ('' + t).trim()
          : t + 'px';
}
function Gd(e, t) {
    e = e.style;
    for (var n in t)
        if (t.hasOwnProperty(n)) {
            var r = n.indexOf('--') === 0,
                i = bd(n, t[n], r);
            (n === 'float' && (n = 'cssFloat'), r ? e.setProperty(n, i) : (e[n] = i));
        }
}
var qg = te(
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
function ia(e, t) {
    if (t) {
        if (qg[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
            throw Error(C(137, e));
        if (t.dangerouslySetInnerHTML != null) {
            if (t.children != null) throw Error(C(60));
            if (
                typeof t.dangerouslySetInnerHTML != 'object' ||
                !('__html' in t.dangerouslySetInnerHTML)
            )
                throw Error(C(61));
        }
        if (t.style != null && typeof t.style != 'object') throw Error(C(62));
    }
}
function sa(e, t) {
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
var oa = null;
function gl(e) {
    return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    );
}
var aa = null,
    $n = null,
    Hn = null;
function $u(e) {
    if ((e = hi(e))) {
        if (typeof aa != 'function') throw Error(C(280));
        var t = e.stateNode;
        t && ((t = Us(t)), aa(e.stateNode, e.type, t));
    }
}
function Qd(e) {
    $n ? (Hn ? Hn.push(e) : (Hn = [e])) : ($n = e);
}
function Yd() {
    if ($n) {
        var e = $n,
            t = Hn;
        if (((Hn = $n = null), $u(e), t)) for (e = 0; e < t.length; e++) $u(t[e]);
    }
}
function Xd(e, t) {
    return e(t);
}
function Zd() {}
var lo = !1;
function Jd(e, t, n) {
    if (lo) return e(t, n);
    lo = !0;
    try {
        return Xd(e, t, n);
    } finally {
        ((lo = !1), ($n !== null || Hn !== null) && (Zd(), Yd()));
    }
}
function Hr(e, t) {
    var n = e.stateNode;
    if (n === null) return null;
    var r = Us(n);
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
    if (n && typeof n != 'function') throw Error(C(231, t, typeof n));
    return n;
}
var la = !1;
if (wt)
    try {
        var cr = {};
        (Object.defineProperty(cr, 'passive', {
            get: function () {
                la = !0;
            },
        }),
            window.addEventListener('test', cr, cr),
            window.removeEventListener('test', cr, cr));
    } catch {
        la = !1;
    }
function ey(e, t, n, r, i, s, o, a, l) {
    var u = Array.prototype.slice.call(arguments, 3);
    try {
        t.apply(n, u);
    } catch (c) {
        this.onError(c);
    }
}
var Lr = !1,
    rs = null,
    is = !1,
    ua = null,
    ty = {
        onError: function (e) {
            ((Lr = !0), (rs = e));
        },
    };
function ny(e, t, n, r, i, s, o, a, l) {
    ((Lr = !1), (rs = null), ey.apply(ty, arguments));
}
function ry(e, t, n, r, i, s, o, a, l) {
    if ((ny.apply(this, arguments), Lr)) {
        if (Lr) {
            var u = rs;
            ((Lr = !1), (rs = null));
        } else throw Error(C(198));
        is || ((is = !0), (ua = u));
    }
}
function yn(e) {
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
function qd(e) {
    if (e.tag === 13) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
            return t.dehydrated;
    }
    return null;
}
function Hu(e) {
    if (yn(e) !== e) throw Error(C(188));
}
function iy(e) {
    var t = e.alternate;
    if (!t) {
        if (((t = yn(e)), t === null)) throw Error(C(188));
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
                if (s === n) return (Hu(i), e);
                if (s === r) return (Hu(i), t);
                s = s.sibling;
            }
            throw Error(C(188));
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
                if (!o) throw Error(C(189));
            }
        }
        if (n.alternate !== r) throw Error(C(190));
    }
    if (n.tag !== 3) throw Error(C(188));
    return n.stateNode.current === n ? e : t;
}
function eh(e) {
    return ((e = iy(e)), e !== null ? th(e) : null);
}
function th(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
        var t = th(e);
        if (t !== null) return t;
        e = e.sibling;
    }
    return null;
}
var nh = je.unstable_scheduleCallback,
    Ku = je.unstable_cancelCallback,
    sy = je.unstable_shouldYield,
    oy = je.unstable_requestPaint,
    se = je.unstable_now,
    ay = je.unstable_getCurrentPriorityLevel,
    yl = je.unstable_ImmediatePriority,
    rh = je.unstable_UserBlockingPriority,
    ss = je.unstable_NormalPriority,
    ly = je.unstable_LowPriority,
    ih = je.unstable_IdlePriority,
    Fs = null,
    ut = null;
function uy(e) {
    if (ut && typeof ut.onCommitFiberRoot == 'function')
        try {
            ut.onCommitFiberRoot(Fs, e, void 0, (e.current.flags & 128) === 128);
        } catch {}
}
var et = Math.clz32 ? Math.clz32 : dy,
    cy = Math.log,
    fy = Math.LN2;
function dy(e) {
    return ((e >>>= 0), e === 0 ? 32 : (31 - ((cy(e) / fy) | 0)) | 0);
}
var Ci = 64,
    Ti = 4194304;
function Sr(e) {
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
function os(e, t) {
    var n = e.pendingLanes;
    if (n === 0) return 0;
    var r = 0,
        i = e.suspendedLanes,
        s = e.pingedLanes,
        o = n & 268435455;
    if (o !== 0) {
        var a = o & ~i;
        a !== 0 ? (r = Sr(a)) : ((s &= o), s !== 0 && (r = Sr(s)));
    } else ((o = n & ~i), o !== 0 ? (r = Sr(o)) : s !== 0 && (r = Sr(s)));
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
function hy(e, t) {
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
function py(e, t) {
    for (
        var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, s = e.pendingLanes;
        0 < s;
    ) {
        var o = 31 - et(s),
            a = 1 << o,
            l = i[o];
        (l === -1 ? (!(a & n) || a & r) && (i[o] = hy(a, t)) : l <= t && (e.expiredLanes |= a),
            (s &= ~a));
    }
}
function ca(e) {
    return ((e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0);
}
function sh() {
    var e = Ci;
    return ((Ci <<= 1), !(Ci & 4194240) && (Ci = 64), e);
}
function uo(e) {
    for (var t = [], n = 0; 31 > n; n++) t.push(e);
    return t;
}
function fi(e, t, n) {
    ((e.pendingLanes |= t),
        t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
        (e = e.eventTimes),
        (t = 31 - et(t)),
        (e[t] = n));
}
function my(e, t) {
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
function vl(e, t) {
    var n = (e.entangledLanes |= t);
    for (e = e.entanglements; n; ) {
        var r = 31 - et(n),
            i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
    }
}
var H = 0;
function oh(e) {
    return ((e &= -e), 1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1);
}
var ah,
    xl,
    lh,
    uh,
    ch,
    fa = !1,
    Ei = [],
    Vt = null,
    _t = null,
    jt = null,
    Kr = new Map(),
    Wr = new Map(),
    Nt = [],
    gy =
        'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
            ' ',
        );
function Wu(e, t) {
    switch (e) {
        case 'focusin':
        case 'focusout':
            Vt = null;
            break;
        case 'dragenter':
        case 'dragleave':
            _t = null;
            break;
        case 'mouseover':
        case 'mouseout':
            jt = null;
            break;
        case 'pointerover':
        case 'pointerout':
            Kr.delete(t.pointerId);
            break;
        case 'gotpointercapture':
        case 'lostpointercapture':
            Wr.delete(t.pointerId);
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
          t !== null && ((t = hi(t)), t !== null && xl(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
}
function yy(e, t, n, r, i) {
    switch (t) {
        case 'focusin':
            return ((Vt = fr(Vt, e, t, n, r, i)), !0);
        case 'dragenter':
            return ((_t = fr(_t, e, t, n, r, i)), !0);
        case 'mouseover':
            return ((jt = fr(jt, e, t, n, r, i)), !0);
        case 'pointerover':
            var s = i.pointerId;
            return (Kr.set(s, fr(Kr.get(s) || null, e, t, n, r, i)), !0);
        case 'gotpointercapture':
            return ((s = i.pointerId), Wr.set(s, fr(Wr.get(s) || null, e, t, n, r, i)), !0);
    }
    return !1;
}
function fh(e) {
    var t = nn(e.target);
    if (t !== null) {
        var n = yn(t);
        if (n !== null) {
            if (((t = n.tag), t === 13)) {
                if (((t = qd(n)), t !== null)) {
                    ((e.blockedOn = t),
                        ch(e.priority, function () {
                            lh(n);
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
function Hi(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
        var n = da(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
        if (n === null) {
            n = e.nativeEvent;
            var r = new n.constructor(n.type, n);
            ((oa = r), n.target.dispatchEvent(r), (oa = null));
        } else return ((t = hi(n)), t !== null && xl(t), (e.blockedOn = n), !1);
        t.shift();
    }
    return !0;
}
function bu(e, t, n) {
    Hi(e) && n.delete(t);
}
function vy() {
    ((fa = !1),
        Vt !== null && Hi(Vt) && (Vt = null),
        _t !== null && Hi(_t) && (_t = null),
        jt !== null && Hi(jt) && (jt = null),
        Kr.forEach(bu),
        Wr.forEach(bu));
}
function dr(e, t) {
    e.blockedOn === t &&
        ((e.blockedOn = null),
        fa || ((fa = !0), je.unstable_scheduleCallback(je.unstable_NormalPriority, vy)));
}
function br(e) {
    function t(i) {
        return dr(i, e);
    }
    if (0 < Ei.length) {
        dr(Ei[0], e);
        for (var n = 1; n < Ei.length; n++) {
            var r = Ei[n];
            r.blockedOn === e && (r.blockedOn = null);
        }
    }
    for (
        Vt !== null && dr(Vt, e),
            _t !== null && dr(_t, e),
            jt !== null && dr(jt, e),
            Kr.forEach(t),
            Wr.forEach(t),
            n = 0;
        n < Nt.length;
        n++
    )
        ((r = Nt[n]), r.blockedOn === e && (r.blockedOn = null));
    for (; 0 < Nt.length && ((n = Nt[0]), n.blockedOn === null); )
        (fh(n), n.blockedOn === null && Nt.shift());
}
var Kn = Tt.ReactCurrentBatchConfig,
    as = !0;
function xy(e, t, n, r) {
    var i = H,
        s = Kn.transition;
    Kn.transition = null;
    try {
        ((H = 1), wl(e, t, n, r));
    } finally {
        ((H = i), (Kn.transition = s));
    }
}
function wy(e, t, n, r) {
    var i = H,
        s = Kn.transition;
    Kn.transition = null;
    try {
        ((H = 4), wl(e, t, n, r));
    } finally {
        ((H = i), (Kn.transition = s));
    }
}
function wl(e, t, n, r) {
    if (as) {
        var i = da(e, t, n, r);
        if (i === null) (wo(e, t, r, ls, n), Wu(e, r));
        else if (yy(i, e, t, n, r)) r.stopPropagation();
        else if ((Wu(e, r), t & 4 && -1 < gy.indexOf(e))) {
            for (; i !== null; ) {
                var s = hi(i);
                if (
                    (s !== null && ah(s),
                    (s = da(e, t, n, r)),
                    s === null && wo(e, t, r, ls, n),
                    s === i)
                )
                    break;
                i = s;
            }
            i !== null && r.stopPropagation();
        } else wo(e, t, r, null, n);
    }
}
var ls = null;
function da(e, t, n, r) {
    if (((ls = null), (e = gl(r)), (e = nn(e)), e !== null))
        if (((t = yn(e)), t === null)) e = null;
        else if (((n = t.tag), n === 13)) {
            if (((e = qd(t)), e !== null)) return e;
            e = null;
        } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
                return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
        } else t !== e && (e = null);
    return ((ls = e), null);
}
function dh(e) {
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
            switch (ay()) {
                case yl:
                    return 1;
                case rh:
                    return 4;
                case ss:
                case ly:
                    return 16;
                case ih:
                    return 536870912;
                default:
                    return 16;
            }
        default:
            return 16;
    }
}
var Ot = null,
    Sl = null,
    Ki = null;
function hh() {
    if (Ki) return Ki;
    var e,
        t = Sl,
        n = t.length,
        r,
        i = 'value' in Ot ? Ot.value : Ot.textContent,
        s = i.length;
    for (e = 0; e < n && t[e] === i[e]; e++);
    var o = n - e;
    for (r = 1; r <= o && t[n - r] === i[s - r]; r++);
    return (Ki = i.slice(e, 1 < r ? 1 - r : void 0));
}
function Wi(e) {
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
function Gu() {
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
                ? Li
                : Gu),
            (this.isPropagationStopped = Gu),
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
var sr = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
            return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
    },
    kl = ze(sr),
    di = te({}, sr, { view: 0, detail: 0 }),
    Sy = ze(di),
    co,
    fo,
    hr,
    Is = te({}, di, {
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
        getModifierState: Pl,
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
                : (e !== hr &&
                      (hr && e.type === 'mousemove'
                          ? ((co = e.screenX - hr.screenX), (fo = e.screenY - hr.screenY))
                          : (fo = co = 0),
                      (hr = e)),
                  co);
        },
        movementY: function (e) {
            return 'movementY' in e ? e.movementY : fo;
        },
    }),
    Qu = ze(Is),
    ky = te({}, Is, { dataTransfer: 0 }),
    Py = ze(ky),
    Cy = te({}, di, { relatedTarget: 0 }),
    ho = ze(Cy),
    Ty = te({}, sr, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Ey = ze(Ty),
    Ly = te({}, sr, {
        clipboardData: function (e) {
            return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
        },
    }),
    Ry = ze(Ly),
    Ay = te({}, sr, { data: 0 }),
    Yu = ze(Ay),
    Ny = {
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
    Dy = {
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
    Oy = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
function My(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = Oy[e]) ? !!t[e] : !1;
}
function Pl() {
    return My;
}
var Vy = te({}, di, {
        key: function (e) {
            if (e.key) {
                var t = Ny[e.key] || e.key;
                if (t !== 'Unidentified') return t;
            }
            return e.type === 'keypress'
                ? ((e = Wi(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
                : e.type === 'keydown' || e.type === 'keyup'
                  ? Dy[e.keyCode] || 'Unidentified'
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
        getModifierState: Pl,
        charCode: function (e) {
            return e.type === 'keypress' ? Wi(e) : 0;
        },
        keyCode: function (e) {
            return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
        },
        which: function (e) {
            return e.type === 'keypress'
                ? Wi(e)
                : e.type === 'keydown' || e.type === 'keyup'
                  ? e.keyCode
                  : 0;
        },
    }),
    _y = ze(Vy),
    jy = te({}, Is, {
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
    Xu = ze(jy),
    Fy = te({}, di, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: Pl,
    }),
    Iy = ze(Fy),
    zy = te({}, sr, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    By = ze(zy),
    Uy = te({}, Is, {
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
    $y = ze(Uy),
    Hy = [9, 13, 27, 32],
    Cl = wt && 'CompositionEvent' in window,
    Rr = null;
wt && 'documentMode' in document && (Rr = document.documentMode);
var Ky = wt && 'TextEvent' in window && !Rr,
    ph = wt && (!Cl || (Rr && 8 < Rr && 11 >= Rr)),
    Zu = ' ',
    Ju = !1;
function mh(e, t) {
    switch (e) {
        case 'keyup':
            return Hy.indexOf(t.keyCode) !== -1;
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
function gh(e) {
    return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null);
}
var En = !1;
function Wy(e, t) {
    switch (e) {
        case 'compositionend':
            return gh(t);
        case 'keypress':
            return t.which !== 32 ? null : ((Ju = !0), Zu);
        case 'textInput':
            return ((e = t.data), e === Zu && Ju ? null : e);
        default:
            return null;
    }
}
function by(e, t) {
    if (En)
        return e === 'compositionend' || (!Cl && mh(e, t))
            ? ((e = hh()), (Ki = Sl = Ot = null), (En = !1), e)
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
            return ph && t.locale !== 'ko' ? null : t.data;
        default:
            return null;
    }
}
var Gy = {
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
function qu(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === 'input' ? !!Gy[e.type] : t === 'textarea';
}
function yh(e, t, n, r) {
    (Qd(r),
        (t = us(t, 'onChange')),
        0 < t.length &&
            ((n = new kl('onChange', 'change', null, n, r)), e.push({ event: n, listeners: t })));
}
var Ar = null,
    Gr = null;
function Qy(e) {
    Rh(e, 0);
}
function zs(e) {
    var t = An(e);
    if (Ud(t)) return e;
}
function Yy(e, t) {
    if (e === 'change') return t;
}
var vh = !1;
if (wt) {
    var po;
    if (wt) {
        var mo = 'oninput' in document;
        if (!mo) {
            var ec = document.createElement('div');
            (ec.setAttribute('oninput', 'return;'), (mo = typeof ec.oninput == 'function'));
        }
        po = mo;
    } else po = !1;
    vh = po && (!document.documentMode || 9 < document.documentMode);
}
function tc() {
    Ar && (Ar.detachEvent('onpropertychange', xh), (Gr = Ar = null));
}
function xh(e) {
    if (e.propertyName === 'value' && zs(Gr)) {
        var t = [];
        (yh(t, Gr, e, gl(e)), Jd(Qy, t));
    }
}
function Xy(e, t, n) {
    e === 'focusin'
        ? (tc(), (Ar = t), (Gr = n), Ar.attachEvent('onpropertychange', xh))
        : e === 'focusout' && tc();
}
function Zy(e) {
    if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return zs(Gr);
}
function Jy(e, t) {
    if (e === 'click') return zs(t);
}
function qy(e, t) {
    if (e === 'input' || e === 'change') return zs(t);
}
function ev(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var nt = typeof Object.is == 'function' ? Object.is : ev;
function Qr(e, t) {
    if (nt(e, t)) return !0;
    if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
    var n = Object.keys(e),
        r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!Qo.call(t, i) || !nt(e[i], t[i])) return !1;
    }
    return !0;
}
function nc(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
}
function rc(e, t) {
    var n = nc(e);
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
        n = nc(n);
    }
}
function wh(e, t) {
    return e && t
        ? e === t
            ? !0
            : e && e.nodeType === 3
              ? !1
              : t && t.nodeType === 3
                ? wh(e, t.parentNode)
                : 'contains' in e
                  ? e.contains(t)
                  : e.compareDocumentPosition
                    ? !!(e.compareDocumentPosition(t) & 16)
                    : !1
        : !1;
}
function Sh() {
    for (var e = window, t = ns(); t instanceof e.HTMLIFrameElement; ) {
        try {
            var n = typeof t.contentWindow.location.href == 'string';
        } catch {
            n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = ns(e.document);
    }
    return t;
}
function Tl(e) {
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
function tv(e) {
    var t = Sh(),
        n = e.focusedElem,
        r = e.selectionRange;
    if (t !== n && n && n.ownerDocument && wh(n.ownerDocument.documentElement, n)) {
        if (r !== null && Tl(n)) {
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
                    (i = rc(n, s)));
                var o = rc(n, r);
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
var nv = wt && 'documentMode' in document && 11 >= document.documentMode,
    Ln = null,
    ha = null,
    Nr = null,
    pa = !1;
function ic(e, t, n) {
    var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    pa ||
        Ln == null ||
        Ln !== ns(r) ||
        ((r = Ln),
        'selectionStart' in r && Tl(r)
            ? (r = { start: r.selectionStart, end: r.selectionEnd })
            : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
              (r = {
                  anchorNode: r.anchorNode,
                  anchorOffset: r.anchorOffset,
                  focusNode: r.focusNode,
                  focusOffset: r.focusOffset,
              })),
        (Nr && Qr(Nr, r)) ||
            ((Nr = r),
            (r = us(ha, 'onSelect')),
            0 < r.length &&
                ((t = new kl('onSelect', 'select', null, t, n)),
                e.push({ event: t, listeners: r }),
                (t.target = Ln))));
}
function Ri(e, t) {
    var n = {};
    return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n['Webkit' + e] = 'webkit' + t),
        (n['Moz' + e] = 'moz' + t),
        n
    );
}
var Rn = {
        animationend: Ri('Animation', 'AnimationEnd'),
        animationiteration: Ri('Animation', 'AnimationIteration'),
        animationstart: Ri('Animation', 'AnimationStart'),
        transitionend: Ri('Transition', 'TransitionEnd'),
    },
    go = {},
    kh = {};
wt &&
    ((kh = document.createElement('div').style),
    'AnimationEvent' in window ||
        (delete Rn.animationend.animation,
        delete Rn.animationiteration.animation,
        delete Rn.animationstart.animation),
    'TransitionEvent' in window || delete Rn.transitionend.transition);
function Bs(e) {
    if (go[e]) return go[e];
    if (!Rn[e]) return e;
    var t = Rn[e],
        n;
    for (n in t) if (t.hasOwnProperty(n) && n in kh) return (go[e] = t[n]);
    return e;
}
var Ph = Bs('animationend'),
    Ch = Bs('animationiteration'),
    Th = Bs('animationstart'),
    Eh = Bs('transitionend'),
    Lh = new Map(),
    sc =
        'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
            ' ',
        );
function bt(e, t) {
    (Lh.set(e, t), gn(t, [e]));
}
for (var yo = 0; yo < sc.length; yo++) {
    var vo = sc[yo],
        rv = vo.toLowerCase(),
        iv = vo[0].toUpperCase() + vo.slice(1);
    bt(rv, 'on' + iv);
}
bt(Ph, 'onAnimationEnd');
bt(Ch, 'onAnimationIteration');
bt(Th, 'onAnimationStart');
bt('dblclick', 'onDoubleClick');
bt('focusin', 'onFocus');
bt('focusout', 'onBlur');
bt(Eh, 'onTransitionEnd');
Gn('onMouseEnter', ['mouseout', 'mouseover']);
Gn('onMouseLeave', ['mouseout', 'mouseover']);
Gn('onPointerEnter', ['pointerout', 'pointerover']);
Gn('onPointerLeave', ['pointerout', 'pointerover']);
gn('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '));
gn(
    'onSelect',
    'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(
        ' ',
    ),
);
gn('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']);
gn('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '));
gn('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '));
gn('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '));
var kr =
        'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
            ' ',
        ),
    sv = new Set('cancel close invalid load scroll toggle'.split(' ').concat(kr));
function oc(e, t, n) {
    var r = e.type || 'unknown-event';
    ((e.currentTarget = n), ry(r, t, void 0, e), (e.currentTarget = null));
}
function Rh(e, t) {
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
                    (oc(i, a, u), (s = l));
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
                    (oc(i, a, u), (s = l));
                }
        }
    }
    if (is) throw ((e = ua), (is = !1), (ua = null), e);
}
function b(e, t) {
    var n = t[xa];
    n === void 0 && (n = t[xa] = new Set());
    var r = e + '__bubble';
    n.has(r) || (Ah(t, e, 2, !1), n.add(r));
}
function xo(e, t, n) {
    var r = 0;
    (t && (r |= 4), Ah(n, e, r, t));
}
var Ai = '_reactListening' + Math.random().toString(36).slice(2);
function Yr(e) {
    if (!e[Ai]) {
        ((e[Ai] = !0),
            jd.forEach(function (n) {
                n !== 'selectionchange' && (sv.has(n) || xo(n, !1, e), xo(n, !0, e));
            }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[Ai] || ((t[Ai] = !0), xo('selectionchange', !1, t));
    }
}
function Ah(e, t, n, r) {
    switch (dh(t)) {
        case 1:
            var i = xy;
            break;
        case 4:
            i = wy;
            break;
        default:
            i = wl;
    }
    ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !la || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (i = !0),
        r
            ? i !== void 0
                ? e.addEventListener(t, n, { capture: !0, passive: i })
                : e.addEventListener(t, n, !0)
            : i !== void 0
              ? e.addEventListener(t, n, { passive: i })
              : e.addEventListener(t, n, !1));
}
function wo(e, t, n, r, i) {
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
                    if (((o = nn(a)), o === null)) return;
                    if (((l = o.tag), l === 5 || l === 6)) {
                        r = s = o;
                        continue e;
                    }
                    a = a.parentNode;
                }
            }
            r = r.return;
        }
    Jd(function () {
        var u = s,
            c = gl(n),
            f = [];
        e: {
            var d = Lh.get(e);
            if (d !== void 0) {
                var m = kl,
                    y = e;
                switch (e) {
                    case 'keypress':
                        if (Wi(n) === 0) break e;
                    case 'keydown':
                    case 'keyup':
                        m = _y;
                        break;
                    case 'focusin':
                        ((y = 'focus'), (m = ho));
                        break;
                    case 'focusout':
                        ((y = 'blur'), (m = ho));
                        break;
                    case 'beforeblur':
                    case 'afterblur':
                        m = ho;
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
                        m = Qu;
                        break;
                    case 'drag':
                    case 'dragend':
                    case 'dragenter':
                    case 'dragexit':
                    case 'dragleave':
                    case 'dragover':
                    case 'dragstart':
                    case 'drop':
                        m = Py;
                        break;
                    case 'touchcancel':
                    case 'touchend':
                    case 'touchmove':
                    case 'touchstart':
                        m = Iy;
                        break;
                    case Ph:
                    case Ch:
                    case Th:
                        m = Ey;
                        break;
                    case Eh:
                        m = By;
                        break;
                    case 'scroll':
                        m = Sy;
                        break;
                    case 'wheel':
                        m = $y;
                        break;
                    case 'copy':
                    case 'cut':
                    case 'paste':
                        m = Ry;
                        break;
                    case 'gotpointercapture':
                    case 'lostpointercapture':
                    case 'pointercancel':
                    case 'pointerdown':
                    case 'pointermove':
                    case 'pointerout':
                    case 'pointerover':
                    case 'pointerup':
                        m = Xu;
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
                            p !== null && ((x = Hr(h, p)), x != null && v.push(Xr(h, x, g)))),
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
                    d && n !== oa && (y = n.relatedTarget || n.fromElement) && (nn(y) || y[St]))
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
                          (y = y ? nn(y) : null),
                          y !== null &&
                              ((S = yn(y)), y !== S || (y.tag !== 5 && y.tag !== 6)) &&
                              (y = null))
                        : ((m = null), (y = u)),
                    m !== y)
                ) {
                    if (
                        ((v = Qu),
                        (x = 'onMouseLeave'),
                        (p = 'onMouseEnter'),
                        (h = 'mouse'),
                        (e === 'pointerout' || e === 'pointerover') &&
                            ((v = Xu),
                            (x = 'onPointerLeave'),
                            (p = 'onPointerEnter'),
                            (h = 'pointer')),
                        (S = m == null ? d : An(m)),
                        (g = y == null ? d : An(y)),
                        (d = new v(x, h + 'leave', m, n, c)),
                        (d.target = S),
                        (d.relatedTarget = g),
                        (x = null),
                        nn(c) === u &&
                            ((v = new v(p, h + 'enter', y, n, c)),
                            (v.target = g),
                            (v.relatedTarget = S),
                            (x = v)),
                        (S = x),
                        m && y)
                    )
                        t: {
                            for (v = m, p = y, h = 0, g = v; g; g = wn(g)) h++;
                            for (g = 0, x = p; x; x = wn(x)) g++;
                            for (; 0 < h - g; ) ((v = wn(v)), h--);
                            for (; 0 < g - h; ) ((p = wn(p)), g--);
                            for (; h--; ) {
                                if (v === p || (p !== null && v === p.alternate)) break t;
                                ((v = wn(v)), (p = wn(p)));
                            }
                            v = null;
                        }
                    else v = null;
                    (m !== null && ac(f, d, m, v, !1),
                        y !== null && S !== null && ac(f, S, y, v, !0));
                }
            }
            e: {
                if (
                    ((d = u ? An(u) : window),
                    (m = d.nodeName && d.nodeName.toLowerCase()),
                    m === 'select' || (m === 'input' && d.type === 'file'))
                )
                    var w = Yy;
                else if (qu(d))
                    if (vh) w = qy;
                    else {
                        w = Zy;
                        var P = Xy;
                    }
                else
                    (m = d.nodeName) &&
                        m.toLowerCase() === 'input' &&
                        (d.type === 'checkbox' || d.type === 'radio') &&
                        (w = Jy);
                if (w && (w = w(e, u))) {
                    yh(f, w, n, c);
                    break e;
                }
                (P && P(e, d, u),
                    e === 'focusout' &&
                        (P = d._wrapperState) &&
                        P.controlled &&
                        d.type === 'number' &&
                        ta(d, 'number', d.value));
            }
            switch (((P = u ? An(u) : window), e)) {
                case 'focusin':
                    (qu(P) || P.contentEditable === 'true') && ((Ln = P), (ha = u), (Nr = null));
                    break;
                case 'focusout':
                    Nr = ha = Ln = null;
                    break;
                case 'mousedown':
                    pa = !0;
                    break;
                case 'contextmenu':
                case 'mouseup':
                case 'dragend':
                    ((pa = !1), ic(f, n, c));
                    break;
                case 'selectionchange':
                    if (nv) break;
                case 'keydown':
                case 'keyup':
                    ic(f, n, c);
            }
            var T;
            if (Cl)
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
                En
                    ? mh(e, n) && (k = 'onCompositionEnd')
                    : e === 'keydown' && n.keyCode === 229 && (k = 'onCompositionStart');
            (k &&
                (ph &&
                    n.locale !== 'ko' &&
                    (En || k !== 'onCompositionStart'
                        ? k === 'onCompositionEnd' && En && (T = hh())
                        : ((Ot = c), (Sl = 'value' in Ot ? Ot.value : Ot.textContent), (En = !0))),
                (P = us(u, k)),
                0 < P.length &&
                    ((k = new Yu(k, e, null, n, c)),
                    f.push({ event: k, listeners: P }),
                    T ? (k.data = T) : ((T = gh(n)), T !== null && (k.data = T)))),
                (T = Ky ? Wy(e, n) : by(e, n)) &&
                    ((u = us(u, 'onBeforeInput')),
                    0 < u.length &&
                        ((c = new Yu('onBeforeInput', 'beforeinput', null, n, c)),
                        f.push({ event: c, listeners: u }),
                        (c.data = T))));
        }
        Rh(f, t);
    });
}
function Xr(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
}
function us(e, t) {
    for (var n = t + 'Capture', r = []; e !== null; ) {
        var i = e,
            s = i.stateNode;
        (i.tag === 5 &&
            s !== null &&
            ((i = s),
            (s = Hr(e, n)),
            s != null && r.unshift(Xr(e, s, i)),
            (s = Hr(e, t)),
            s != null && r.push(Xr(e, s, i))),
            (e = e.return));
    }
    return r;
}
function wn(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5);
    return e || null;
}
function ac(e, t, n, r, i) {
    for (var s = t._reactName, o = []; n !== null && n !== r; ) {
        var a = n,
            l = a.alternate,
            u = a.stateNode;
        if (l !== null && l === r) break;
        (a.tag === 5 &&
            u !== null &&
            ((a = u),
            i
                ? ((l = Hr(n, s)), l != null && o.unshift(Xr(n, l, a)))
                : i || ((l = Hr(n, s)), l != null && o.push(Xr(n, l, a)))),
            (n = n.return));
    }
    o.length !== 0 && e.push({ event: t, listeners: o });
}
var ov = /\r\n?/g,
    av = /\u0000|\uFFFD/g;
function lc(e) {
    return (typeof e == 'string' ? e : '' + e)
        .replace(
            ov,
            `
`,
        )
        .replace(av, '');
}
function Ni(e, t, n) {
    if (((t = lc(t)), lc(e) !== t && n)) throw Error(C(425));
}
function cs() {}
var ma = null,
    ga = null;
function ya(e, t) {
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
var va = typeof setTimeout == 'function' ? setTimeout : void 0,
    lv = typeof clearTimeout == 'function' ? clearTimeout : void 0,
    uc = typeof Promise == 'function' ? Promise : void 0,
    uv =
        typeof queueMicrotask == 'function'
            ? queueMicrotask
            : typeof uc < 'u'
              ? function (e) {
                    return uc.resolve(null).then(e).catch(cv);
                }
              : va;
function cv(e) {
    setTimeout(function () {
        throw e;
    });
}
function So(e, t) {
    var n = t,
        r = 0;
    do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8))
            if (((n = i.data), n === '/$')) {
                if (r === 0) {
                    (e.removeChild(i), br(t));
                    return;
                }
                r--;
            } else (n !== '$' && n !== '$?' && n !== '$!') || r++;
        n = i;
    } while (n);
    br(t);
}
function Ft(e) {
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
function cc(e) {
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
var or = Math.random().toString(36).slice(2),
    at = '__reactFiber$' + or,
    Zr = '__reactProps$' + or,
    St = '__reactContainer$' + or,
    xa = '__reactEvents$' + or,
    fv = '__reactListeners$' + or,
    dv = '__reactHandles$' + or;
function nn(e) {
    var t = e[at];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
        if ((t = n[St] || n[at])) {
            if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
                for (e = cc(e); e !== null; ) {
                    if ((n = e[at])) return n;
                    e = cc(e);
                }
            return t;
        }
        ((e = n), (n = e.parentNode));
    }
    return null;
}
function hi(e) {
    return (
        (e = e[at] || e[St]),
        !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
    );
}
function An(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(C(33));
}
function Us(e) {
    return e[Zr] || null;
}
var wa = [],
    Nn = -1;
function Gt(e) {
    return { current: e };
}
function G(e) {
    0 > Nn || ((e.current = wa[Nn]), (wa[Nn] = null), Nn--);
}
function W(e, t) {
    (Nn++, (wa[Nn] = e.current), (e.current = t));
}
var Ht = {},
    Se = Gt(Ht),
    Ae = Gt(!1),
    cn = Ht;
function Qn(e, t) {
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
function Ne(e) {
    return ((e = e.childContextTypes), e != null);
}
function fs() {
    (G(Ae), G(Se));
}
function fc(e, t, n) {
    if (Se.current !== Ht) throw Error(C(168));
    (W(Se, t), W(Ae, n));
}
function Nh(e, t, n) {
    var r = e.stateNode;
    if (((t = t.childContextTypes), typeof r.getChildContext != 'function')) return n;
    r = r.getChildContext();
    for (var i in r) if (!(i in t)) throw Error(C(108, Xg(e) || 'Unknown', i));
    return te({}, n, r);
}
function ds(e) {
    return (
        (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || Ht),
        (cn = Se.current),
        W(Se, e),
        W(Ae, Ae.current),
        !0
    );
}
function dc(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(C(169));
    (n
        ? ((e = Nh(e, t, cn)),
          (r.__reactInternalMemoizedMergedChildContext = e),
          G(Ae),
          G(Se),
          W(Se, e))
        : G(Ae),
        W(Ae, n));
}
var pt = null,
    $s = !1,
    ko = !1;
function Dh(e) {
    pt === null ? (pt = [e]) : pt.push(e);
}
function hv(e) {
    (($s = !0), Dh(e));
}
function Qt() {
    if (!ko && pt !== null) {
        ko = !0;
        var e = 0,
            t = H;
        try {
            var n = pt;
            for (H = 1; e < n.length; e++) {
                var r = n[e];
                do r = r(!0);
                while (r !== null);
            }
            ((pt = null), ($s = !1));
        } catch (i) {
            throw (pt !== null && (pt = pt.slice(e + 1)), nh(yl, Qt), i);
        } finally {
            ((H = t), (ko = !1));
        }
    }
    return null;
}
var Dn = [],
    On = 0,
    hs = null,
    ps = 0,
    $e = [],
    He = 0,
    fn = null,
    mt = 1,
    gt = '';
function Jt(e, t) {
    ((Dn[On++] = ps), (Dn[On++] = hs), (hs = e), (ps = t));
}
function Oh(e, t, n) {
    (($e[He++] = mt), ($e[He++] = gt), ($e[He++] = fn), (fn = e));
    var r = mt;
    e = gt;
    var i = 32 - et(r) - 1;
    ((r &= ~(1 << i)), (n += 1));
    var s = 32 - et(t) + i;
    if (30 < s) {
        var o = i - (i % 5);
        ((s = (r & ((1 << o) - 1)).toString(32)),
            (r >>= o),
            (i -= o),
            (mt = (1 << (32 - et(t) + i)) | (n << i) | r),
            (gt = s + e));
    } else ((mt = (1 << s) | (n << i) | r), (gt = e));
}
function El(e) {
    e.return !== null && (Jt(e, 1), Oh(e, 1, 0));
}
function Ll(e) {
    for (; e === hs; ) ((hs = Dn[--On]), (Dn[On] = null), (ps = Dn[--On]), (Dn[On] = null));
    for (; e === fn; )
        ((fn = $e[--He]),
            ($e[He] = null),
            (gt = $e[--He]),
            ($e[He] = null),
            (mt = $e[--He]),
            ($e[He] = null));
}
var Ve = null,
    Me = null,
    Y = !1,
    qe = null;
function Mh(e, t) {
    var n = Ke(5, null, null, 0);
    ((n.elementType = 'DELETED'),
        (n.stateNode = t),
        (n.return = e),
        (t = e.deletions),
        t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function hc(e, t) {
    switch (e.tag) {
        case 5:
            var n = e.type;
            return (
                (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
                t !== null ? ((e.stateNode = t), (Ve = e), (Me = Ft(t.firstChild)), !0) : !1
            );
        case 6:
            return (
                (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
                t !== null ? ((e.stateNode = t), (Ve = e), (Me = null), !0) : !1
            );
        case 13:
            return (
                (t = t.nodeType !== 8 ? null : t),
                t !== null
                    ? ((n = fn !== null ? { id: mt, overflow: gt } : null),
                      (e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }),
                      (n = Ke(18, null, null, 0)),
                      (n.stateNode = t),
                      (n.return = e),
                      (e.child = n),
                      (Ve = e),
                      (Me = null),
                      !0)
                    : !1
            );
        default:
            return !1;
    }
}
function Sa(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function ka(e) {
    if (Y) {
        var t = Me;
        if (t) {
            var n = t;
            if (!hc(e, t)) {
                if (Sa(e)) throw Error(C(418));
                t = Ft(n.nextSibling);
                var r = Ve;
                t && hc(e, t) ? Mh(r, n) : ((e.flags = (e.flags & -4097) | 2), (Y = !1), (Ve = e));
            }
        } else {
            if (Sa(e)) throw Error(C(418));
            ((e.flags = (e.flags & -4097) | 2), (Y = !1), (Ve = e));
        }
    }
}
function pc(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    Ve = e;
}
function Di(e) {
    if (e !== Ve) return !1;
    if (!Y) return (pc(e), (Y = !0), !1);
    var t;
    if (
        ((t = e.tag !== 3) &&
            !(t = e.tag !== 5) &&
            ((t = e.type), (t = t !== 'head' && t !== 'body' && !ya(e.type, e.memoizedProps))),
        t && (t = Me))
    ) {
        if (Sa(e)) throw (Vh(), Error(C(418)));
        for (; t; ) (Mh(e, t), (t = Ft(t.nextSibling)));
    }
    if ((pc(e), e.tag === 13)) {
        if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
            throw Error(C(317));
        e: {
            for (e = e.nextSibling, t = 0; e; ) {
                if (e.nodeType === 8) {
                    var n = e.data;
                    if (n === '/$') {
                        if (t === 0) {
                            Me = Ft(e.nextSibling);
                            break e;
                        }
                        t--;
                    } else (n !== '$' && n !== '$!' && n !== '$?') || t++;
                }
                e = e.nextSibling;
            }
            Me = null;
        }
    } else Me = Ve ? Ft(e.stateNode.nextSibling) : null;
    return !0;
}
function Vh() {
    for (var e = Me; e; ) e = Ft(e.nextSibling);
}
function Yn() {
    ((Me = Ve = null), (Y = !1));
}
function Rl(e) {
    qe === null ? (qe = [e]) : qe.push(e);
}
var pv = Tt.ReactCurrentBatchConfig;
function pr(e, t, n) {
    if (((e = n.ref), e !== null && typeof e != 'function' && typeof e != 'object')) {
        if (n._owner) {
            if (((n = n._owner), n)) {
                if (n.tag !== 1) throw Error(C(309));
                var r = n.stateNode;
            }
            if (!r) throw Error(C(147, e));
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
        if (typeof e != 'string') throw Error(C(284));
        if (!n._owner) throw Error(C(290, e));
    }
    return e;
}
function Oi(e, t) {
    throw (
        (e = Object.prototype.toString.call(t)),
        Error(
            C(
                31,
                e === '[object Object]'
                    ? 'object with keys {' + Object.keys(t).join(', ') + '}'
                    : e,
            ),
        )
    );
}
function mc(e) {
    var t = e._init;
    return t(e._payload);
}
function _h(e) {
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
        return ((p = Ut(p, h)), (p.index = 0), (p.sibling = null), p);
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
            ? ((h = Ao(g, p.mode, x)), (h.return = p), h)
            : ((h = i(h, g)), (h.return = p), h);
    }
    function l(p, h, g, x) {
        var w = g.type;
        return w === Tn
            ? c(p, h, g.props.children, x, g.key)
            : h !== null &&
                (h.elementType === w ||
                    (typeof w == 'object' && w !== null && w.$$typeof === Rt && mc(w) === h.type))
              ? ((x = i(h, g.props)), (x.ref = pr(p, h, g)), (x.return = p), x)
              : ((x = Ji(g.type, g.key, g.props, null, p.mode, x)),
                (x.ref = pr(p, h, g)),
                (x.return = p),
                x);
    }
    function u(p, h, g, x) {
        return h === null ||
            h.tag !== 4 ||
            h.stateNode.containerInfo !== g.containerInfo ||
            h.stateNode.implementation !== g.implementation
            ? ((h = No(g, p.mode, x)), (h.return = p), h)
            : ((h = i(h, g.children || [])), (h.return = p), h);
    }
    function c(p, h, g, x, w) {
        return h === null || h.tag !== 7
            ? ((h = ln(g, p.mode, x, w)), (h.return = p), h)
            : ((h = i(h, g)), (h.return = p), h);
    }
    function f(p, h, g) {
        if ((typeof h == 'string' && h !== '') || typeof h == 'number')
            return ((h = Ao('' + h, p.mode, g)), (h.return = p), h);
        if (typeof h == 'object' && h !== null) {
            switch (h.$$typeof) {
                case Si:
                    return (
                        (g = Ji(h.type, h.key, h.props, null, p.mode, g)),
                        (g.ref = pr(p, null, h)),
                        (g.return = p),
                        g
                    );
                case Cn:
                    return ((h = No(h, p.mode, g)), (h.return = p), h);
                case Rt:
                    var x = h._init;
                    return f(p, x(h._payload), g);
            }
            if (wr(h) || ur(h)) return ((h = ln(h, p.mode, g, null)), (h.return = p), h);
            Oi(p, h);
        }
        return null;
    }
    function d(p, h, g, x) {
        var w = h !== null ? h.key : null;
        if ((typeof g == 'string' && g !== '') || typeof g == 'number')
            return w !== null ? null : a(p, h, '' + g, x);
        if (typeof g == 'object' && g !== null) {
            switch (g.$$typeof) {
                case Si:
                    return g.key === w ? l(p, h, g, x) : null;
                case Cn:
                    return g.key === w ? u(p, h, g, x) : null;
                case Rt:
                    return ((w = g._init), d(p, h, w(g._payload), x));
            }
            if (wr(g) || ur(g)) return w !== null ? null : c(p, h, g, x, null);
            Oi(p, g);
        }
        return null;
    }
    function m(p, h, g, x, w) {
        if ((typeof x == 'string' && x !== '') || typeof x == 'number')
            return ((p = p.get(g) || null), a(h, p, '' + x, w));
        if (typeof x == 'object' && x !== null) {
            switch (x.$$typeof) {
                case Si:
                    return ((p = p.get(x.key === null ? g : x.key) || null), l(h, p, x, w));
                case Cn:
                    return ((p = p.get(x.key === null ? g : x.key) || null), u(h, p, x, w));
                case Rt:
                    var P = x._init;
                    return m(p, h, g, P(x._payload), w);
            }
            if (wr(x) || ur(x)) return ((p = p.get(g) || null), c(h, p, x, w, null));
            Oi(h, x);
        }
        return null;
    }
    function y(p, h, g, x) {
        for (
            var w = null, P = null, T = h, k = (h = 0), D = null;
            T !== null && k < g.length;
            k++
        ) {
            T.index > k ? ((D = T), (T = null)) : (D = T.sibling);
            var L = d(p, T, g[k], x);
            if (L === null) {
                T === null && (T = D);
                break;
            }
            (e && T && L.alternate === null && t(p, T),
                (h = s(L, h, k)),
                P === null ? (w = L) : (P.sibling = L),
                (P = L),
                (T = D));
        }
        if (k === g.length) return (n(p, T), Y && Jt(p, k), w);
        if (T === null) {
            for (; k < g.length; k++)
                ((T = f(p, g[k], x)),
                    T !== null &&
                        ((h = s(T, h, k)), P === null ? (w = T) : (P.sibling = T), (P = T)));
            return (Y && Jt(p, k), w);
        }
        for (T = r(p, T); k < g.length; k++)
            ((D = m(T, p, k, g[k], x)),
                D !== null &&
                    (e && D.alternate !== null && T.delete(D.key === null ? k : D.key),
                    (h = s(D, h, k)),
                    P === null ? (w = D) : (P.sibling = D),
                    (P = D)));
        return (
            e &&
                T.forEach(function (X) {
                    return t(p, X);
                }),
            Y && Jt(p, k),
            w
        );
    }
    function v(p, h, g, x) {
        var w = ur(g);
        if (typeof w != 'function') throw Error(C(150));
        if (((g = w.call(g)), g == null)) throw Error(C(151));
        for (
            var P = (w = null), T = h, k = (h = 0), D = null, L = g.next();
            T !== null && !L.done;
            k++, L = g.next()
        ) {
            T.index > k ? ((D = T), (T = null)) : (D = T.sibling);
            var X = d(p, T, L.value, x);
            if (X === null) {
                T === null && (T = D);
                break;
            }
            (e && T && X.alternate === null && t(p, T),
                (h = s(X, h, k)),
                P === null ? (w = X) : (P.sibling = X),
                (P = X),
                (T = D));
        }
        if (L.done) return (n(p, T), Y && Jt(p, k), w);
        if (T === null) {
            for (; !L.done; k++, L = g.next())
                ((L = f(p, L.value, x)),
                    L !== null &&
                        ((h = s(L, h, k)), P === null ? (w = L) : (P.sibling = L), (P = L)));
            return (Y && Jt(p, k), w);
        }
        for (T = r(p, T); !L.done; k++, L = g.next())
            ((L = m(T, p, k, L.value, x)),
                L !== null &&
                    (e && L.alternate !== null && T.delete(L.key === null ? k : L.key),
                    (h = s(L, h, k)),
                    P === null ? (w = L) : (P.sibling = L),
                    (P = L)));
        return (
            e &&
                T.forEach(function (z) {
                    return t(p, z);
                }),
            Y && Jt(p, k),
            w
        );
    }
    function S(p, h, g, x) {
        if (
            (typeof g == 'object' &&
                g !== null &&
                g.type === Tn &&
                g.key === null &&
                (g = g.props.children),
            typeof g == 'object' && g !== null)
        ) {
            switch (g.$$typeof) {
                case Si:
                    e: {
                        for (var w = g.key, P = h; P !== null; ) {
                            if (P.key === w) {
                                if (((w = g.type), w === Tn)) {
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
                                        w.$$typeof === Rt &&
                                        mc(w) === P.type)
                                ) {
                                    (n(p, P.sibling),
                                        (h = i(P, g.props)),
                                        (h.ref = pr(p, P, g)),
                                        (h.return = p),
                                        (p = h));
                                    break e;
                                }
                                n(p, P);
                                break;
                            } else t(p, P);
                            P = P.sibling;
                        }
                        g.type === Tn
                            ? ((h = ln(g.props.children, p.mode, x, g.key)),
                              (h.return = p),
                              (p = h))
                            : ((x = Ji(g.type, g.key, g.props, null, p.mode, x)),
                              (x.ref = pr(p, h, g)),
                              (x.return = p),
                              (p = x));
                    }
                    return o(p);
                case Cn:
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
                        ((h = No(g, p.mode, x)), (h.return = p), (p = h));
                    }
                    return o(p);
                case Rt:
                    return ((P = g._init), S(p, h, P(g._payload), x));
            }
            if (wr(g)) return y(p, h, g, x);
            if (ur(g)) return v(p, h, g, x);
            Oi(p, g);
        }
        return (typeof g == 'string' && g !== '') || typeof g == 'number'
            ? ((g = '' + g),
              h !== null && h.tag === 6
                  ? (n(p, h.sibling), (h = i(h, g)), (h.return = p), (p = h))
                  : (n(p, h), (h = Ao(g, p.mode, x)), (h.return = p), (p = h)),
              o(p))
            : n(p, h);
    }
    return S;
}
var Xn = _h(!0),
    jh = _h(!1),
    ms = Gt(null),
    gs = null,
    Mn = null,
    Al = null;
function Nl() {
    Al = Mn = gs = null;
}
function Dl(e) {
    var t = ms.current;
    (G(ms), (e._currentValue = t));
}
function Pa(e, t, n) {
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
function Wn(e, t) {
    ((gs = e),
        (Al = Mn = null),
        (e = e.dependencies),
        e !== null &&
            e.firstContext !== null &&
            (e.lanes & t && (Re = !0), (e.firstContext = null)));
}
function be(e) {
    var t = e._currentValue;
    if (Al !== e)
        if (((e = { context: e, memoizedValue: t, next: null }), Mn === null)) {
            if (gs === null) throw Error(C(308));
            ((Mn = e), (gs.dependencies = { lanes: 0, firstContext: e }));
        } else Mn = Mn.next = e;
    return t;
}
var rn = null;
function Ol(e) {
    rn === null ? (rn = [e]) : rn.push(e);
}
function Fh(e, t, n, r) {
    var i = t.interleaved;
    return (
        i === null ? ((n.next = n), Ol(t)) : ((n.next = i.next), (i.next = n)),
        (t.interleaved = n),
        kt(e, r)
    );
}
function kt(e, t) {
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
var At = !1;
function Ml(e) {
    e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, interleaved: null, lanes: 0 },
        effects: null,
    };
}
function Ih(e, t) {
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
function yt(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function It(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (((r = r.shared), U & 2)) {
        var i = r.pending;
        return (
            i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
            (r.pending = t),
            kt(e, n)
        );
    }
    return (
        (i = r.interleaved),
        i === null ? ((t.next = t), Ol(r)) : ((t.next = i.next), (i.next = t)),
        (r.interleaved = t),
        kt(e, n)
    );
}
function bi(e, t, n) {
    if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), vl(e, n));
    }
}
function gc(e, t) {
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
function ys(e, t, n, r) {
    var i = e.updateQueue;
    At = !1;
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
                            At = !0;
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
        ((hn |= o), (e.lanes = o), (e.memoizedState = f));
    }
}
function yc(e, t, n) {
    if (((e = t.effects), (t.effects = null), e !== null))
        for (t = 0; t < e.length; t++) {
            var r = e[t],
                i = r.callback;
            if (i !== null) {
                if (((r.callback = null), (r = n), typeof i != 'function')) throw Error(C(191, i));
                i.call(r);
            }
        }
}
var pi = {},
    ct = Gt(pi),
    Jr = Gt(pi),
    qr = Gt(pi);
function sn(e) {
    if (e === pi) throw Error(C(174));
    return e;
}
function Vl(e, t) {
    switch ((W(qr, t), W(Jr, e), W(ct, pi), (e = t.nodeType), e)) {
        case 9:
        case 11:
            t = (t = t.documentElement) ? t.namespaceURI : ra(null, '');
            break;
        default:
            ((e = e === 8 ? t.parentNode : t),
                (t = e.namespaceURI || null),
                (e = e.tagName),
                (t = ra(t, e)));
    }
    (G(ct), W(ct, t));
}
function Zn() {
    (G(ct), G(Jr), G(qr));
}
function zh(e) {
    sn(qr.current);
    var t = sn(ct.current),
        n = ra(t, e.type);
    t !== n && (W(Jr, e), W(ct, n));
}
function _l(e) {
    Jr.current === e && (G(ct), G(Jr));
}
var J = Gt(0);
function vs(e) {
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
var Po = [];
function jl() {
    for (var e = 0; e < Po.length; e++) Po[e]._workInProgressVersionPrimary = null;
    Po.length = 0;
}
var Gi = Tt.ReactCurrentDispatcher,
    Co = Tt.ReactCurrentBatchConfig,
    dn = 0,
    ee = null,
    le = null,
    ce = null,
    xs = !1,
    Dr = !1,
    ei = 0,
    mv = 0;
function ge() {
    throw Error(C(321));
}
function Fl(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++) if (!nt(e[n], t[n])) return !1;
    return !0;
}
function Il(e, t, n, r, i, s) {
    if (
        ((dn = s),
        (ee = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (Gi.current = e === null || e.memoizedState === null ? xv : wv),
        (e = n(r, i)),
        Dr)
    ) {
        s = 0;
        do {
            if (((Dr = !1), (ei = 0), 25 <= s)) throw Error(C(301));
            ((s += 1), (ce = le = null), (t.updateQueue = null), (Gi.current = Sv), (e = n(r, i)));
        } while (Dr);
    }
    if (
        ((Gi.current = ws),
        (t = le !== null && le.next !== null),
        (dn = 0),
        (ce = le = ee = null),
        (xs = !1),
        t)
    )
        throw Error(C(300));
    return e;
}
function zl() {
    var e = ei !== 0;
    return ((ei = 0), e);
}
function ot() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return (ce === null ? (ee.memoizedState = ce = e) : (ce = ce.next = e), ce);
}
function Ge() {
    if (le === null) {
        var e = ee.alternate;
        e = e !== null ? e.memoizedState : null;
    } else e = le.next;
    var t = ce === null ? ee.memoizedState : ce.next;
    if (t !== null) ((ce = t), (le = e));
    else {
        if (e === null) throw Error(C(310));
        ((le = e),
            (e = {
                memoizedState: le.memoizedState,
                baseState: le.baseState,
                baseQueue: le.baseQueue,
                queue: le.queue,
                next: null,
            }),
            ce === null ? (ee.memoizedState = ce = e) : (ce = ce.next = e));
    }
    return ce;
}
function ti(e, t) {
    return typeof t == 'function' ? t(e) : t;
}
function To(e) {
    var t = Ge(),
        n = t.queue;
    if (n === null) throw Error(C(311));
    n.lastRenderedReducer = e;
    var r = le,
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
            if ((dn & c) === c)
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
                    (hn |= c));
            }
            u = u.next;
        } while (u !== null && u !== s);
        (l === null ? (o = r) : (l.next = a),
            nt(r, t.memoizedState) || (Re = !0),
            (t.memoizedState = r),
            (t.baseState = o),
            (t.baseQueue = l),
            (n.lastRenderedState = r));
    }
    if (((e = n.interleaved), e !== null)) {
        i = e;
        do ((s = i.lane), (ee.lanes |= s), (hn |= s), (i = i.next));
        while (i !== e);
    } else i === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
}
function Eo(e) {
    var t = Ge(),
        n = t.queue;
    if (n === null) throw Error(C(311));
    n.lastRenderedReducer = e;
    var r = n.dispatch,
        i = n.pending,
        s = t.memoizedState;
    if (i !== null) {
        n.pending = null;
        var o = (i = i.next);
        do ((s = e(s, o.action)), (o = o.next));
        while (o !== i);
        (nt(s, t.memoizedState) || (Re = !0),
            (t.memoizedState = s),
            t.baseQueue === null && (t.baseState = s),
            (n.lastRenderedState = s));
    }
    return [s, r];
}
function Bh() {}
function Uh(e, t) {
    var n = ee,
        r = Ge(),
        i = t(),
        s = !nt(r.memoizedState, i);
    if (
        (s && ((r.memoizedState = i), (Re = !0)),
        (r = r.queue),
        Bl(Kh.bind(null, n, r, e), [e]),
        r.getSnapshot !== t || s || (ce !== null && ce.memoizedState.tag & 1))
    ) {
        if (((n.flags |= 2048), ni(9, Hh.bind(null, n, r, i, t), void 0, null), fe === null))
            throw Error(C(349));
        dn & 30 || $h(n, t, i);
    }
    return i;
}
function $h(e, t, n) {
    ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = ee.updateQueue),
        t === null
            ? ((t = { lastEffect: null, stores: null }), (ee.updateQueue = t), (t.stores = [e]))
            : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function Hh(e, t, n, r) {
    ((t.value = n), (t.getSnapshot = r), Wh(t) && bh(e));
}
function Kh(e, t, n) {
    return n(function () {
        Wh(t) && bh(e);
    });
}
function Wh(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !nt(e, n);
    } catch {
        return !0;
    }
}
function bh(e) {
    var t = kt(e, 1);
    t !== null && tt(t, e, 1, -1);
}
function vc(e) {
    var t = ot();
    return (
        typeof e == 'function' && (e = e()),
        (t.memoizedState = t.baseState = e),
        (e = {
            pending: null,
            interleaved: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: ti,
            lastRenderedState: e,
        }),
        (t.queue = e),
        (e = e.dispatch = vv.bind(null, ee, e)),
        [t.memoizedState, e]
    );
}
function ni(e, t, n, r) {
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
function Gh() {
    return Ge().memoizedState;
}
function Qi(e, t, n, r) {
    var i = ot();
    ((ee.flags |= e), (i.memoizedState = ni(1 | t, n, void 0, r === void 0 ? null : r)));
}
function Hs(e, t, n, r) {
    var i = Ge();
    r = r === void 0 ? null : r;
    var s = void 0;
    if (le !== null) {
        var o = le.memoizedState;
        if (((s = o.destroy), r !== null && Fl(r, o.deps))) {
            i.memoizedState = ni(t, n, s, r);
            return;
        }
    }
    ((ee.flags |= e), (i.memoizedState = ni(1 | t, n, s, r)));
}
function xc(e, t) {
    return Qi(8390656, 8, e, t);
}
function Bl(e, t) {
    return Hs(2048, 8, e, t);
}
function Qh(e, t) {
    return Hs(4, 2, e, t);
}
function Yh(e, t) {
    return Hs(4, 4, e, t);
}
function Xh(e, t) {
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
function Zh(e, t, n) {
    return ((n = n != null ? n.concat([e]) : null), Hs(4, 4, Xh.bind(null, t, e), n));
}
function Ul() {}
function Jh(e, t) {
    var n = Ge();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Fl(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
}
function qh(e, t) {
    var n = Ge();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Fl(t, r[1])
        ? r[0]
        : ((e = e()), (n.memoizedState = [e, t]), e);
}
function ep(e, t, n) {
    return dn & 21
        ? (nt(n, t) || ((n = sh()), (ee.lanes |= n), (hn |= n), (e.baseState = !0)), t)
        : (e.baseState && ((e.baseState = !1), (Re = !0)), (e.memoizedState = n));
}
function gv(e, t) {
    var n = H;
    ((H = n !== 0 && 4 > n ? n : 4), e(!0));
    var r = Co.transition;
    Co.transition = {};
    try {
        (e(!1), t());
    } finally {
        ((H = n), (Co.transition = r));
    }
}
function tp() {
    return Ge().memoizedState;
}
function yv(e, t, n) {
    var r = Bt(e);
    if (((n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }), np(e)))
        rp(t, n);
    else if (((n = Fh(e, t, n, r)), n !== null)) {
        var i = Pe();
        (tt(n, e, r, i), ip(n, t, r));
    }
}
function vv(e, t, n) {
    var r = Bt(e),
        i = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
    if (np(e)) rp(t, i);
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
                    (l === null ? ((i.next = i), Ol(t)) : ((i.next = l.next), (l.next = i)),
                        (t.interleaved = i));
                    return;
                }
            } catch {
            } finally {
            }
        ((n = Fh(e, t, i, r)), n !== null && ((i = Pe()), tt(n, e, r, i), ip(n, t, r)));
    }
}
function np(e) {
    var t = e.alternate;
    return e === ee || (t !== null && t === ee);
}
function rp(e, t) {
    Dr = xs = !0;
    var n = e.pending;
    (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t));
}
function ip(e, t, n) {
    if (n & 4194240) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), vl(e, n));
    }
}
var ws = {
        readContext: be,
        useCallback: ge,
        useContext: ge,
        useEffect: ge,
        useImperativeHandle: ge,
        useInsertionEffect: ge,
        useLayoutEffect: ge,
        useMemo: ge,
        useReducer: ge,
        useRef: ge,
        useState: ge,
        useDebugValue: ge,
        useDeferredValue: ge,
        useTransition: ge,
        useMutableSource: ge,
        useSyncExternalStore: ge,
        useId: ge,
        unstable_isNewReconciler: !1,
    },
    xv = {
        readContext: be,
        useCallback: function (e, t) {
            return ((ot().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: be,
        useEffect: xc,
        useImperativeHandle: function (e, t, n) {
            return ((n = n != null ? n.concat([e]) : null), Qi(4194308, 4, Xh.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
            return Qi(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
            return Qi(4, 2, e, t);
        },
        useMemo: function (e, t) {
            var n = ot();
            return ((t = t === void 0 ? null : t), (e = e()), (n.memoizedState = [e, t]), e);
        },
        useReducer: function (e, t, n) {
            var r = ot();
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
                (e = e.dispatch = yv.bind(null, ee, e)),
                [r.memoizedState, e]
            );
        },
        useRef: function (e) {
            var t = ot();
            return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: vc,
        useDebugValue: Ul,
        useDeferredValue: function (e) {
            return (ot().memoizedState = e);
        },
        useTransition: function () {
            var e = vc(!1),
                t = e[0];
            return ((e = gv.bind(null, e[1])), (ot().memoizedState = e), [t, e]);
        },
        useMutableSource: function () {},
        useSyncExternalStore: function (e, t, n) {
            var r = ee,
                i = ot();
            if (Y) {
                if (n === void 0) throw Error(C(407));
                n = n();
            } else {
                if (((n = t()), fe === null)) throw Error(C(349));
                dn & 30 || $h(r, t, n);
            }
            i.memoizedState = n;
            var s = { value: n, getSnapshot: t };
            return (
                (i.queue = s),
                xc(Kh.bind(null, r, s, e), [e]),
                (r.flags |= 2048),
                ni(9, Hh.bind(null, r, s, n, t), void 0, null),
                n
            );
        },
        useId: function () {
            var e = ot(),
                t = fe.identifierPrefix;
            if (Y) {
                var n = gt,
                    r = mt;
                ((n = (r & ~(1 << (32 - et(r) - 1))).toString(32) + n),
                    (t = ':' + t + 'R' + n),
                    (n = ei++),
                    0 < n && (t += 'H' + n.toString(32)),
                    (t += ':'));
            } else ((n = mv++), (t = ':' + t + 'r' + n.toString(32) + ':'));
            return (e.memoizedState = t);
        },
        unstable_isNewReconciler: !1,
    },
    wv = {
        readContext: be,
        useCallback: Jh,
        useContext: be,
        useEffect: Bl,
        useImperativeHandle: Zh,
        useInsertionEffect: Qh,
        useLayoutEffect: Yh,
        useMemo: qh,
        useReducer: To,
        useRef: Gh,
        useState: function () {
            return To(ti);
        },
        useDebugValue: Ul,
        useDeferredValue: function (e) {
            var t = Ge();
            return ep(t, le.memoizedState, e);
        },
        useTransition: function () {
            var e = To(ti)[0],
                t = Ge().memoizedState;
            return [e, t];
        },
        useMutableSource: Bh,
        useSyncExternalStore: Uh,
        useId: tp,
        unstable_isNewReconciler: !1,
    },
    Sv = {
        readContext: be,
        useCallback: Jh,
        useContext: be,
        useEffect: Bl,
        useImperativeHandle: Zh,
        useInsertionEffect: Qh,
        useLayoutEffect: Yh,
        useMemo: qh,
        useReducer: Eo,
        useRef: Gh,
        useState: function () {
            return Eo(ti);
        },
        useDebugValue: Ul,
        useDeferredValue: function (e) {
            var t = Ge();
            return le === null ? (t.memoizedState = e) : ep(t, le.memoizedState, e);
        },
        useTransition: function () {
            var e = Eo(ti)[0],
                t = Ge().memoizedState;
            return [e, t];
        },
        useMutableSource: Bh,
        useSyncExternalStore: Uh,
        useId: tp,
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
function Ca(e, t, n, r) {
    ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : te({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
}
var Ks = {
    isMounted: function (e) {
        return (e = e._reactInternals) ? yn(e) === e : !1;
    },
    enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = Pe(),
            i = Bt(e),
            s = yt(r, i);
        ((s.payload = t),
            n != null && (s.callback = n),
            (t = It(e, s, i)),
            t !== null && (tt(t, e, i, r), bi(t, e, i)));
    },
    enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = Pe(),
            i = Bt(e),
            s = yt(r, i);
        ((s.tag = 1),
            (s.payload = t),
            n != null && (s.callback = n),
            (t = It(e, s, i)),
            t !== null && (tt(t, e, i, r), bi(t, e, i)));
    },
    enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = Pe(),
            r = Bt(e),
            i = yt(n, r);
        ((i.tag = 2),
            t != null && (i.callback = t),
            (t = It(e, i, r)),
            t !== null && (tt(t, e, r, n), bi(t, e, r)));
    },
};
function wc(e, t, n, r, i, s, o) {
    return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == 'function'
            ? e.shouldComponentUpdate(r, s, o)
            : t.prototype && t.prototype.isPureReactComponent
              ? !Qr(n, r) || !Qr(i, s)
              : !0
    );
}
function sp(e, t, n) {
    var r = !1,
        i = Ht,
        s = t.contextType;
    return (
        typeof s == 'object' && s !== null
            ? (s = be(s))
            : ((i = Ne(t) ? cn : Se.current),
              (r = t.contextTypes),
              (s = (r = r != null) ? Qn(e, i) : Ht)),
        (t = new t(n, s)),
        (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
        (t.updater = Ks),
        (e.stateNode = t),
        (t._reactInternals = e),
        r &&
            ((e = e.stateNode),
            (e.__reactInternalMemoizedUnmaskedChildContext = i),
            (e.__reactInternalMemoizedMaskedChildContext = s)),
        t
    );
}
function Sc(e, t, n, r) {
    ((e = t.state),
        typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
            t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && Ks.enqueueReplaceState(t, t.state, null));
}
function Ta(e, t, n, r) {
    var i = e.stateNode;
    ((i.props = n), (i.state = e.memoizedState), (i.refs = {}), Ml(e));
    var s = t.contextType;
    (typeof s == 'object' && s !== null
        ? (i.context = be(s))
        : ((s = Ne(t) ? cn : Se.current), (i.context = Qn(e, s))),
        (i.state = e.memoizedState),
        (s = t.getDerivedStateFromProps),
        typeof s == 'function' && (Ca(e, t, s, n), (i.state = e.memoizedState)),
        typeof t.getDerivedStateFromProps == 'function' ||
            typeof i.getSnapshotBeforeUpdate == 'function' ||
            (typeof i.UNSAFE_componentWillMount != 'function' &&
                typeof i.componentWillMount != 'function') ||
            ((t = i.state),
            typeof i.componentWillMount == 'function' && i.componentWillMount(),
            typeof i.UNSAFE_componentWillMount == 'function' && i.UNSAFE_componentWillMount(),
            t !== i.state && Ks.enqueueReplaceState(i, i.state, null),
            ys(e, n, i, r),
            (i.state = e.memoizedState)),
        typeof i.componentDidMount == 'function' && (e.flags |= 4194308));
}
function Jn(e, t) {
    try {
        var n = '',
            r = t;
        do ((n += Yg(r)), (r = r.return));
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
function Lo(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Ea(e, t) {
    try {
        console.error(t.value);
    } catch (n) {
        setTimeout(function () {
            throw n;
        });
    }
}
var kv = typeof WeakMap == 'function' ? WeakMap : Map;
function op(e, t, n) {
    ((n = yt(-1, n)), (n.tag = 3), (n.payload = { element: null }));
    var r = t.value;
    return (
        (n.callback = function () {
            (ks || ((ks = !0), (ja = r)), Ea(e, t));
        }),
        n
    );
}
function ap(e, t, n) {
    ((n = yt(-1, n)), (n.tag = 3));
    var r = e.type.getDerivedStateFromError;
    if (typeof r == 'function') {
        var i = t.value;
        ((n.payload = function () {
            return r(i);
        }),
            (n.callback = function () {
                Ea(e, t);
            }));
    }
    var s = e.stateNode;
    return (
        s !== null &&
            typeof s.componentDidCatch == 'function' &&
            (n.callback = function () {
                (Ea(e, t),
                    typeof r != 'function' &&
                        (zt === null ? (zt = new Set([this])) : zt.add(this)));
                var o = t.stack;
                this.componentDidCatch(t.value, { componentStack: o !== null ? o : '' });
            }),
        n
    );
}
function kc(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
        r = e.pingCache = new kv();
        var i = new Set();
        r.set(t, i);
    } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
    i.has(n) || (i.add(n), (e = jv.bind(null, e, t, n)), t.then(e, e));
}
function Pc(e) {
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
function Cc(e, t, n, r, i) {
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
                        : ((t = yt(-1, 1)), (t.tag = 2), It(n, t, 1))),
                (n.lanes |= 1)),
          e);
}
var Pv = Tt.ReactCurrentOwner,
    Re = !1;
function ke(e, t, n, r) {
    t.child = e === null ? jh(t, null, n, r) : Xn(t, e.child, n, r);
}
function Tc(e, t, n, r, i) {
    n = n.render;
    var s = t.ref;
    return (
        Wn(t, i),
        (r = Il(e, t, n, r, s, i)),
        (n = zl()),
        e !== null && !Re
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), Pt(e, t, i))
            : (Y && n && El(t), (t.flags |= 1), ke(e, t, r, i), t.child)
    );
}
function Ec(e, t, n, r, i) {
    if (e === null) {
        var s = n.type;
        return typeof s == 'function' &&
            !Yl(s) &&
            s.defaultProps === void 0 &&
            n.compare === null &&
            n.defaultProps === void 0
            ? ((t.tag = 15), (t.type = s), lp(e, t, s, r, i))
            : ((e = Ji(n.type, null, r, t, t.mode, i)),
              (e.ref = t.ref),
              (e.return = t),
              (t.child = e));
    }
    if (((s = e.child), !(e.lanes & i))) {
        var o = s.memoizedProps;
        if (((n = n.compare), (n = n !== null ? n : Qr), n(o, r) && e.ref === t.ref))
            return Pt(e, t, i);
    }
    return ((t.flags |= 1), (e = Ut(s, r)), (e.ref = t.ref), (e.return = t), (t.child = e));
}
function lp(e, t, n, r, i) {
    if (e !== null) {
        var s = e.memoizedProps;
        if (Qr(s, r) && e.ref === t.ref)
            if (((Re = !1), (t.pendingProps = r = s), (e.lanes & i) !== 0))
                e.flags & 131072 && (Re = !0);
            else return ((t.lanes = e.lanes), Pt(e, t, i));
    }
    return La(e, t, n, r, i);
}
function up(e, t, n) {
    var r = t.pendingProps,
        i = r.children,
        s = e !== null ? e.memoizedState : null;
    if (r.mode === 'hidden')
        if (!(t.mode & 1))
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                W(_n, Oe),
                (Oe |= n));
        else {
            if (!(n & 1073741824))
                return (
                    (e = s !== null ? s.baseLanes | n : n),
                    (t.lanes = t.childLanes = 1073741824),
                    (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
                    (t.updateQueue = null),
                    W(_n, Oe),
                    (Oe |= e),
                    null
                );
            ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
                (r = s !== null ? s.baseLanes : n),
                W(_n, Oe),
                (Oe |= r));
        }
    else
        (s !== null ? ((r = s.baseLanes | n), (t.memoizedState = null)) : (r = n),
            W(_n, Oe),
            (Oe |= r));
    return (ke(e, t, i, n), t.child);
}
function cp(e, t) {
    var n = t.ref;
    ((e === null && n !== null) || (e !== null && e.ref !== n)) &&
        ((t.flags |= 512), (t.flags |= 2097152));
}
function La(e, t, n, r, i) {
    var s = Ne(n) ? cn : Se.current;
    return (
        (s = Qn(t, s)),
        Wn(t, i),
        (n = Il(e, t, n, r, s, i)),
        (r = zl()),
        e !== null && !Re
            ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~i), Pt(e, t, i))
            : (Y && r && El(t), (t.flags |= 1), ke(e, t, n, i), t.child)
    );
}
function Lc(e, t, n, r, i) {
    if (Ne(n)) {
        var s = !0;
        ds(t);
    } else s = !1;
    if ((Wn(t, i), t.stateNode === null)) (Yi(e, t), sp(t, n, r), Ta(t, n, r, i), (r = !0));
    else if (e === null) {
        var o = t.stateNode,
            a = t.memoizedProps;
        o.props = a;
        var l = o.context,
            u = n.contextType;
        typeof u == 'object' && u !== null
            ? (u = be(u))
            : ((u = Ne(n) ? cn : Se.current), (u = Qn(t, u)));
        var c = n.getDerivedStateFromProps,
            f = typeof c == 'function' || typeof o.getSnapshotBeforeUpdate == 'function';
        (f ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((a !== r || l !== u) && Sc(t, o, r, u)),
            (At = !1));
        var d = t.memoizedState;
        ((o.state = d),
            ys(t, r, o, i),
            (l = t.memoizedState),
            a !== r || d !== l || Ae.current || At
                ? (typeof c == 'function' && (Ca(t, n, c, r), (l = t.memoizedState)),
                  (a = At || wc(t, n, a, r, d, l, u))
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
            Ih(e, t),
            (a = t.memoizedProps),
            (u = t.type === t.elementType ? a : Ze(t.type, a)),
            (o.props = u),
            (f = t.pendingProps),
            (d = o.context),
            (l = n.contextType),
            typeof l == 'object' && l !== null
                ? (l = be(l))
                : ((l = Ne(n) ? cn : Se.current), (l = Qn(t, l))));
        var m = n.getDerivedStateFromProps;
        ((c = typeof m == 'function' || typeof o.getSnapshotBeforeUpdate == 'function') ||
            (typeof o.UNSAFE_componentWillReceiveProps != 'function' &&
                typeof o.componentWillReceiveProps != 'function') ||
            ((a !== f || d !== l) && Sc(t, o, r, l)),
            (At = !1),
            (d = t.memoizedState),
            (o.state = d),
            ys(t, r, o, i));
        var y = t.memoizedState;
        a !== f || d !== y || Ae.current || At
            ? (typeof m == 'function' && (Ca(t, n, m, r), (y = t.memoizedState)),
              (u = At || wc(t, n, u, r, d, y, l) || !1)
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
    return Ra(e, t, n, r, s, i);
}
function Ra(e, t, n, r, i, s) {
    cp(e, t);
    var o = (t.flags & 128) !== 0;
    if (!r && !o) return (i && dc(t, n, !1), Pt(e, t, s));
    ((r = t.stateNode), (Pv.current = t));
    var a = o && typeof n.getDerivedStateFromError != 'function' ? null : r.render();
    return (
        (t.flags |= 1),
        e !== null && o
            ? ((t.child = Xn(t, e.child, null, s)), (t.child = Xn(t, null, a, s)))
            : ke(e, t, a, s),
        (t.memoizedState = r.state),
        i && dc(t, n, !0),
        t.child
    );
}
function fp(e) {
    var t = e.stateNode;
    (t.pendingContext
        ? fc(e, t.pendingContext, t.pendingContext !== t.context)
        : t.context && fc(e, t.context, !1),
        Vl(e, t.containerInfo));
}
function Rc(e, t, n, r, i) {
    return (Yn(), Rl(i), (t.flags |= 256), ke(e, t, n, r), t.child);
}
var Aa = { dehydrated: null, treeContext: null, retryLane: 0 };
function Na(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
}
function dp(e, t, n) {
    var r = t.pendingProps,
        i = J.current,
        s = !1,
        o = (t.flags & 128) !== 0,
        a;
    if (
        ((a = o) || (a = e !== null && e.memoizedState === null ? !1 : (i & 2) !== 0),
        a ? ((s = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (i |= 1),
        W(J, i & 1),
        e === null)
    )
        return (
            ka(t),
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
                            : (s = Gs(o, r, 0, null)),
                        (e = ln(e, r, n, null)),
                        (s.return = t),
                        (e.return = t),
                        (s.sibling = e),
                        (t.child = s),
                        (t.child.memoizedState = Na(n)),
                        (t.memoizedState = Aa),
                        e)
                      : $l(t, o))
        );
    if (((i = e.memoizedState), i !== null && ((a = i.dehydrated), a !== null)))
        return Cv(e, t, o, r, a, i, n);
    if (s) {
        ((s = r.fallback), (o = t.mode), (i = e.child), (a = i.sibling));
        var l = { mode: 'hidden', children: r.children };
        return (
            !(o & 1) && t.child !== i
                ? ((r = t.child), (r.childLanes = 0), (r.pendingProps = l), (t.deletions = null))
                : ((r = Ut(i, l)), (r.subtreeFlags = i.subtreeFlags & 14680064)),
            a !== null ? (s = Ut(a, s)) : ((s = ln(s, o, n, null)), (s.flags |= 2)),
            (s.return = t),
            (r.return = t),
            (r.sibling = s),
            (t.child = r),
            (r = s),
            (s = t.child),
            (o = e.child.memoizedState),
            (o =
                o === null
                    ? Na(n)
                    : { baseLanes: o.baseLanes | n, cachePool: null, transitions: o.transitions }),
            (s.memoizedState = o),
            (s.childLanes = e.childLanes & ~n),
            (t.memoizedState = Aa),
            r
        );
    }
    return (
        (s = e.child),
        (e = s.sibling),
        (r = Ut(s, { mode: 'visible', children: r.children })),
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
function $l(e, t) {
    return (
        (t = Gs({ mode: 'visible', children: t }, e.mode, 0, null)),
        (t.return = e),
        (e.child = t)
    );
}
function Mi(e, t, n, r) {
    return (
        r !== null && Rl(r),
        Xn(t, e.child, null, n),
        (e = $l(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
    );
}
function Cv(e, t, n, r, i, s, o) {
    if (n)
        return t.flags & 256
            ? ((t.flags &= -257), (r = Lo(Error(C(422)))), Mi(e, t, o, r))
            : t.memoizedState !== null
              ? ((t.child = e.child), (t.flags |= 128), null)
              : ((s = r.fallback),
                (i = t.mode),
                (r = Gs({ mode: 'visible', children: r.children }, i, 0, null)),
                (s = ln(s, i, o, null)),
                (s.flags |= 2),
                (r.return = t),
                (s.return = t),
                (r.sibling = s),
                (t.child = r),
                t.mode & 1 && Xn(t, e.child, null, o),
                (t.child.memoizedState = Na(o)),
                (t.memoizedState = Aa),
                s);
    if (!(t.mode & 1)) return Mi(e, t, o, null);
    if (i.data === '$!') {
        if (((r = i.nextSibling && i.nextSibling.dataset), r)) var a = r.dgst;
        return ((r = a), (s = Error(C(419))), (r = Lo(s, r, void 0)), Mi(e, t, o, r));
    }
    if (((a = (o & e.childLanes) !== 0), Re || a)) {
        if (((r = fe), r !== null)) {
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
                i !== 0 && i !== s.retryLane && ((s.retryLane = i), kt(e, i), tt(r, e, i, -1)));
        }
        return (Ql(), (r = Lo(Error(C(421)))), Mi(e, t, o, r));
    }
    return i.data === '$?'
        ? ((t.flags |= 128), (t.child = e.child), (t = Fv.bind(null, e)), (i._reactRetry = t), null)
        : ((e = s.treeContext),
          (Me = Ft(i.nextSibling)),
          (Ve = t),
          (Y = !0),
          (qe = null),
          e !== null &&
              (($e[He++] = mt),
              ($e[He++] = gt),
              ($e[He++] = fn),
              (mt = e.id),
              (gt = e.overflow),
              (fn = t)),
          (t = $l(t, r.children)),
          (t.flags |= 4096),
          t);
}
function Ac(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    (r !== null && (r.lanes |= t), Pa(e.return, t, n));
}
function Ro(e, t, n, r, i) {
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
function hp(e, t, n) {
    var r = t.pendingProps,
        i = r.revealOrder,
        s = r.tail;
    if ((ke(e, t, r.children, n), (r = J.current), r & 2)) ((r = (r & 1) | 2), (t.flags |= 128));
    else {
        if (e !== null && e.flags & 128)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13) e.memoizedState !== null && Ac(e, n, t);
                else if (e.tag === 19) Ac(e, n, t);
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
    if ((W(J, r), !(t.mode & 1))) t.memoizedState = null;
    else
        switch (i) {
            case 'forwards':
                for (n = t.child, i = null; n !== null; )
                    ((e = n.alternate), e !== null && vs(e) === null && (i = n), (n = n.sibling));
                ((n = i),
                    n === null
                        ? ((i = t.child), (t.child = null))
                        : ((i = n.sibling), (n.sibling = null)),
                    Ro(t, !1, i, n, s));
                break;
            case 'backwards':
                for (n = null, i = t.child, t.child = null; i !== null; ) {
                    if (((e = i.alternate), e !== null && vs(e) === null)) {
                        t.child = i;
                        break;
                    }
                    ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
                }
                Ro(t, !0, n, null, s);
                break;
            case 'together':
                Ro(t, !1, null, null, void 0);
                break;
            default:
                t.memoizedState = null;
        }
    return t.child;
}
function Yi(e, t) {
    !(t.mode & 1) && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function Pt(e, t, n) {
    if ((e !== null && (t.dependencies = e.dependencies), (hn |= t.lanes), !(n & t.childLanes)))
        return null;
    if (e !== null && t.child !== e.child) throw Error(C(153));
    if (t.child !== null) {
        for (
            e = t.child, n = Ut(e, e.pendingProps), t.child = n, n.return = t;
            e.sibling !== null;
        )
            ((e = e.sibling), (n = n.sibling = Ut(e, e.pendingProps)), (n.return = t));
        n.sibling = null;
    }
    return t.child;
}
function Tv(e, t, n) {
    switch (t.tag) {
        case 3:
            (fp(t), Yn());
            break;
        case 5:
            zh(t);
            break;
        case 1:
            Ne(t.type) && ds(t);
            break;
        case 4:
            Vl(t, t.stateNode.containerInfo);
            break;
        case 10:
            var r = t.type._context,
                i = t.memoizedProps.value;
            (W(ms, r._currentValue), (r._currentValue = i));
            break;
        case 13:
            if (((r = t.memoizedState), r !== null))
                return r.dehydrated !== null
                    ? (W(J, J.current & 1), (t.flags |= 128), null)
                    : n & t.child.childLanes
                      ? dp(e, t, n)
                      : (W(J, J.current & 1), (e = Pt(e, t, n)), e !== null ? e.sibling : null);
            W(J, J.current & 1);
            break;
        case 19:
            if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
                if (r) return hp(e, t, n);
                t.flags |= 128;
            }
            if (
                ((i = t.memoizedState),
                i !== null && ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
                W(J, J.current),
                r)
            )
                break;
            return null;
        case 22:
        case 23:
            return ((t.lanes = 0), up(e, t, n));
    }
    return Pt(e, t, n);
}
var pp, Da, mp, gp;
pp = function (e, t) {
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
Da = function () {};
mp = function (e, t, n, r) {
    var i = e.memoizedProps;
    if (i !== r) {
        ((e = t.stateNode), sn(ct.current));
        var s = null;
        switch (n) {
            case 'input':
                ((i = qo(e, i)), (r = qo(e, r)), (s = []));
                break;
            case 'select':
                ((i = te({}, i, { value: void 0 })), (r = te({}, r, { value: void 0 })), (s = []));
                break;
            case 'textarea':
                ((i = na(e, i)), (r = na(e, r)), (s = []));
                break;
            default:
                typeof i.onClick != 'function' &&
                    typeof r.onClick == 'function' &&
                    (e.onclick = cs);
        }
        ia(n, r);
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
                        (Ur.hasOwnProperty(u) ? s || (s = []) : (s = s || []).push(u, null));
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
                            (Ur.hasOwnProperty(u)
                                ? (l != null && u === 'onScroll' && b('scroll', e),
                                  s || a === l || (s = []))
                                : (s = s || []).push(u, l));
        }
        n && (s = s || []).push('style', n);
        var u = s;
        (t.updateQueue = u) && (t.flags |= 4);
    }
};
gp = function (e, t, n, r) {
    n !== r && (t.flags |= 4);
};
function mr(e, t) {
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
function ye(e) {
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
function Ev(e, t, n) {
    var r = t.pendingProps;
    switch ((Ll(t), t.tag)) {
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
            return (ye(t), null);
        case 1:
            return (Ne(t.type) && fs(), ye(t), null);
        case 3:
            return (
                (r = t.stateNode),
                Zn(),
                G(Ae),
                G(Se),
                jl(),
                r.pendingContext && ((r.context = r.pendingContext), (r.pendingContext = null)),
                (e === null || e.child === null) &&
                    (Di(t)
                        ? (t.flags |= 4)
                        : e === null ||
                          (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                          ((t.flags |= 1024), qe !== null && (za(qe), (qe = null)))),
                Da(e, t),
                ye(t),
                null
            );
        case 5:
            _l(t);
            var i = sn(qr.current);
            if (((n = t.type), e !== null && t.stateNode != null))
                (mp(e, t, n, r, i), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
            else {
                if (!r) {
                    if (t.stateNode === null) throw Error(C(166));
                    return (ye(t), null);
                }
                if (((e = sn(ct.current)), Di(t))) {
                    ((r = t.stateNode), (n = t.type));
                    var s = t.memoizedProps;
                    switch (((r[at] = t), (r[Zr] = s), (e = (t.mode & 1) !== 0), n)) {
                        case 'dialog':
                            (b('cancel', r), b('close', r));
                            break;
                        case 'iframe':
                        case 'object':
                        case 'embed':
                            b('load', r);
                            break;
                        case 'video':
                        case 'audio':
                            for (i = 0; i < kr.length; i++) b(kr[i], r);
                            break;
                        case 'source':
                            b('error', r);
                            break;
                        case 'img':
                        case 'image':
                        case 'link':
                            (b('error', r), b('load', r));
                            break;
                        case 'details':
                            b('toggle', r);
                            break;
                        case 'input':
                            (Iu(r, s), b('invalid', r));
                            break;
                        case 'select':
                            ((r._wrapperState = { wasMultiple: !!s.multiple }), b('invalid', r));
                            break;
                        case 'textarea':
                            (Bu(r, s), b('invalid', r));
                    }
                    (ia(n, s), (i = null));
                    for (var o in s)
                        if (s.hasOwnProperty(o)) {
                            var a = s[o];
                            o === 'children'
                                ? typeof a == 'string'
                                    ? r.textContent !== a &&
                                      (s.suppressHydrationWarning !== !0 && Ni(r.textContent, a, e),
                                      (i = ['children', a]))
                                    : typeof a == 'number' &&
                                      r.textContent !== '' + a &&
                                      (s.suppressHydrationWarning !== !0 && Ni(r.textContent, a, e),
                                      (i = ['children', '' + a]))
                                : Ur.hasOwnProperty(o) &&
                                  a != null &&
                                  o === 'onScroll' &&
                                  b('scroll', r);
                        }
                    switch (n) {
                        case 'input':
                            (ki(r), zu(r, s, !0));
                            break;
                        case 'textarea':
                            (ki(r), Uu(r));
                            break;
                        case 'select':
                        case 'option':
                            break;
                        default:
                            typeof s.onClick == 'function' && (r.onclick = cs);
                    }
                    ((r = i), (t.updateQueue = r), r !== null && (t.flags |= 4));
                } else {
                    ((o = i.nodeType === 9 ? i : i.ownerDocument),
                        e === 'http://www.w3.org/1999/xhtml' && (e = Kd(n)),
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
                        (e[at] = t),
                        (e[Zr] = r),
                        pp(e, t, !1, !1),
                        (t.stateNode = e));
                    e: {
                        switch (((o = sa(n, r)), n)) {
                            case 'dialog':
                                (b('cancel', e), b('close', e), (i = r));
                                break;
                            case 'iframe':
                            case 'object':
                            case 'embed':
                                (b('load', e), (i = r));
                                break;
                            case 'video':
                            case 'audio':
                                for (i = 0; i < kr.length; i++) b(kr[i], e);
                                i = r;
                                break;
                            case 'source':
                                (b('error', e), (i = r));
                                break;
                            case 'img':
                            case 'image':
                            case 'link':
                                (b('error', e), b('load', e), (i = r));
                                break;
                            case 'details':
                                (b('toggle', e), (i = r));
                                break;
                            case 'input':
                                (Iu(e, r), (i = qo(e, r)), b('invalid', e));
                                break;
                            case 'option':
                                i = r;
                                break;
                            case 'select':
                                ((e._wrapperState = { wasMultiple: !!r.multiple }),
                                    (i = te({}, r, { value: void 0 })),
                                    b('invalid', e));
                                break;
                            case 'textarea':
                                (Bu(e, r), (i = na(e, r)), b('invalid', e));
                                break;
                            default:
                                i = r;
                        }
                        (ia(n, i), (a = i));
                        for (s in a)
                            if (a.hasOwnProperty(s)) {
                                var l = a[s];
                                s === 'style'
                                    ? Gd(e, l)
                                    : s === 'dangerouslySetInnerHTML'
                                      ? ((l = l ? l.__html : void 0), l != null && Wd(e, l))
                                      : s === 'children'
                                        ? typeof l == 'string'
                                            ? (n !== 'textarea' || l !== '') && $r(e, l)
                                            : typeof l == 'number' && $r(e, '' + l)
                                        : s !== 'suppressContentEditableWarning' &&
                                          s !== 'suppressHydrationWarning' &&
                                          s !== 'autoFocus' &&
                                          (Ur.hasOwnProperty(s)
                                              ? l != null && s === 'onScroll' && b('scroll', e)
                                              : l != null && dl(e, s, l, o));
                            }
                        switch (n) {
                            case 'input':
                                (ki(e), zu(e, r, !1));
                                break;
                            case 'textarea':
                                (ki(e), Uu(e));
                                break;
                            case 'option':
                                r.value != null && e.setAttribute('value', '' + $t(r.value));
                                break;
                            case 'select':
                                ((e.multiple = !!r.multiple),
                                    (s = r.value),
                                    s != null
                                        ? Un(e, !!r.multiple, s, !1)
                                        : r.defaultValue != null &&
                                          Un(e, !!r.multiple, r.defaultValue, !0));
                                break;
                            default:
                                typeof i.onClick == 'function' && (e.onclick = cs);
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
            return (ye(t), null);
        case 6:
            if (e && t.stateNode != null) gp(e, t, e.memoizedProps, r);
            else {
                if (typeof r != 'string' && t.stateNode === null) throw Error(C(166));
                if (((n = sn(qr.current)), sn(ct.current), Di(t))) {
                    if (
                        ((r = t.stateNode),
                        (n = t.memoizedProps),
                        (r[at] = t),
                        (s = r.nodeValue !== n) && ((e = Ve), e !== null))
                    )
                        switch (e.tag) {
                            case 3:
                                Ni(r.nodeValue, n, (e.mode & 1) !== 0);
                                break;
                            case 5:
                                e.memoizedProps.suppressHydrationWarning !== !0 &&
                                    Ni(r.nodeValue, n, (e.mode & 1) !== 0);
                        }
                    s && (t.flags |= 4);
                } else
                    ((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)),
                        (r[at] = t),
                        (t.stateNode = r));
            }
            return (ye(t), null);
        case 13:
            if (
                (G(J),
                (r = t.memoizedState),
                e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
            ) {
                if (Y && Me !== null && t.mode & 1 && !(t.flags & 128))
                    (Vh(), Yn(), (t.flags |= 98560), (s = !1));
                else if (((s = Di(t)), r !== null && r.dehydrated !== null)) {
                    if (e === null) {
                        if (!s) throw Error(C(318));
                        if (((s = t.memoizedState), (s = s !== null ? s.dehydrated : null), !s))
                            throw Error(C(317));
                        s[at] = t;
                    } else (Yn(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
                    (ye(t), (s = !1));
                } else (qe !== null && (za(qe), (qe = null)), (s = !0));
                if (!s) return t.flags & 65536 ? t : null;
            }
            return t.flags & 128
                ? ((t.lanes = n), t)
                : ((r = r !== null),
                  r !== (e !== null && e.memoizedState !== null) &&
                      r &&
                      ((t.child.flags |= 8192),
                      t.mode & 1 && (e === null || J.current & 1 ? ue === 0 && (ue = 3) : Ql())),
                  t.updateQueue !== null && (t.flags |= 4),
                  ye(t),
                  null);
        case 4:
            return (Zn(), Da(e, t), e === null && Yr(t.stateNode.containerInfo), ye(t), null);
        case 10:
            return (Dl(t.type._context), ye(t), null);
        case 17:
            return (Ne(t.type) && fs(), ye(t), null);
        case 19:
            if ((G(J), (s = t.memoizedState), s === null)) return (ye(t), null);
            if (((r = (t.flags & 128) !== 0), (o = s.rendering), o === null))
                if (r) mr(s, !1);
                else {
                    if (ue !== 0 || (e !== null && e.flags & 128))
                        for (e = t.child; e !== null; ) {
                            if (((o = vs(e)), o !== null)) {
                                for (
                                    t.flags |= 128,
                                        mr(s, !1),
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
                                return (W(J, (J.current & 1) | 2), t.child);
                            }
                            e = e.sibling;
                        }
                    s.tail !== null &&
                        se() > qn &&
                        ((t.flags |= 128), (r = !0), mr(s, !1), (t.lanes = 4194304));
                }
            else {
                if (!r)
                    if (((e = vs(o)), e !== null)) {
                        if (
                            ((t.flags |= 128),
                            (r = !0),
                            (n = e.updateQueue),
                            n !== null && ((t.updateQueue = n), (t.flags |= 4)),
                            mr(s, !0),
                            s.tail === null && s.tailMode === 'hidden' && !o.alternate && !Y)
                        )
                            return (ye(t), null);
                    } else
                        2 * se() - s.renderingStartTime > qn &&
                            n !== 1073741824 &&
                            ((t.flags |= 128), (r = !0), mr(s, !1), (t.lanes = 4194304));
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
                  W(J, r ? (n & 1) | 2 : n & 1),
                  t)
                : (ye(t), null);
        case 22:
        case 23:
            return (
                Gl(),
                (r = t.memoizedState !== null),
                e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
                r && t.mode & 1
                    ? Oe & 1073741824 && (ye(t), t.subtreeFlags & 6 && (t.flags |= 8192))
                    : ye(t),
                null
            );
        case 24:
            return null;
        case 25:
            return null;
    }
    throw Error(C(156, t.tag));
}
function Lv(e, t) {
    switch ((Ll(t), t.tag)) {
        case 1:
            return (
                Ne(t.type) && fs(),
                (e = t.flags),
                e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 3:
            return (
                Zn(),
                G(Ae),
                G(Se),
                jl(),
                (e = t.flags),
                e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
            );
        case 5:
            return (_l(t), null);
        case 13:
            if ((G(J), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
                if (t.alternate === null) throw Error(C(340));
                Yn();
            }
            return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 19:
            return (G(J), null);
        case 4:
            return (Zn(), null);
        case 10:
            return (Dl(t.type._context), null);
        case 22:
        case 23:
            return (Gl(), null);
        case 24:
            return null;
        default:
            return null;
    }
}
var Vi = !1,
    xe = !1,
    Rv = typeof WeakSet == 'function' ? WeakSet : Set,
    R = null;
function Vn(e, t) {
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
function Oa(e, t, n) {
    try {
        n();
    } catch (r) {
        re(e, t, r);
    }
}
var Nc = !1;
function Av(e, t) {
    if (((ma = as), (e = Sh()), Tl(e))) {
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
    for (ga = { focusedElem: e, selectionRange: n }, as = !1, R = t; R !== null; )
        if (((t = R), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
            ((e.return = t), (R = e));
        else
            for (; R !== null; ) {
                t = R;
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
                                throw Error(C(163));
                        }
                } catch (x) {
                    re(t, t.return, x);
                }
                if (((e = t.sibling), e !== null)) {
                    ((e.return = t.return), (R = e));
                    break;
                }
                R = t.return;
            }
    return ((y = Nc), (Nc = !1), y);
}
function Or(e, t, n) {
    var r = t.updateQueue;
    if (((r = r !== null ? r.lastEffect : null), r !== null)) {
        var i = (r = r.next);
        do {
            if ((i.tag & e) === e) {
                var s = i.destroy;
                ((i.destroy = void 0), s !== void 0 && Oa(t, n, s));
            }
            i = i.next;
        } while (i !== r);
    }
}
function Ws(e, t) {
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
function Ma(e) {
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
function yp(e) {
    var t = e.alternate;
    (t !== null && ((e.alternate = null), yp(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 &&
            ((t = e.stateNode),
            t !== null && (delete t[at], delete t[Zr], delete t[xa], delete t[fv], delete t[dv])),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
}
function vp(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Dc(e) {
    e: for (;;) {
        for (; e.sibling === null; ) {
            if (e.return === null || vp(e.return)) return null;
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
function Va(e, t, n) {
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
                  n != null || t.onclick !== null || (t.onclick = cs)));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (Va(e, t, n), e = e.sibling; e !== null; ) (Va(e, t, n), (e = e.sibling));
}
function _a(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
    else if (r !== 4 && ((e = e.child), e !== null))
        for (_a(e, t, n), e = e.sibling; e !== null; ) (_a(e, t, n), (e = e.sibling));
}
var de = null,
    Je = !1;
function Et(e, t, n) {
    for (n = n.child; n !== null; ) (xp(e, t, n), (n = n.sibling));
}
function xp(e, t, n) {
    if (ut && typeof ut.onCommitFiberUnmount == 'function')
        try {
            ut.onCommitFiberUnmount(Fs, n);
        } catch {}
    switch (n.tag) {
        case 5:
            xe || Vn(n, t);
        case 6:
            var r = de,
                i = Je;
            ((de = null),
                Et(e, t, n),
                (de = r),
                (Je = i),
                de !== null &&
                    (Je
                        ? ((e = de),
                          (n = n.stateNode),
                          e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
                        : de.removeChild(n.stateNode)));
            break;
        case 18:
            de !== null &&
                (Je
                    ? ((e = de),
                      (n = n.stateNode),
                      e.nodeType === 8 ? So(e.parentNode, n) : e.nodeType === 1 && So(e, n),
                      br(e))
                    : So(de, n.stateNode));
            break;
        case 4:
            ((r = de),
                (i = Je),
                (de = n.stateNode.containerInfo),
                (Je = !0),
                Et(e, t, n),
                (de = r),
                (Je = i));
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            if (!xe && ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))) {
                i = r = r.next;
                do {
                    var s = i,
                        o = s.destroy;
                    ((s = s.tag), o !== void 0 && (s & 2 || s & 4) && Oa(n, t, o), (i = i.next));
                } while (i !== r);
            }
            Et(e, t, n);
            break;
        case 1:
            if (!xe && (Vn(n, t), (r = n.stateNode), typeof r.componentWillUnmount == 'function'))
                try {
                    ((r.props = n.memoizedProps),
                        (r.state = n.memoizedState),
                        r.componentWillUnmount());
                } catch (a) {
                    re(n, t, a);
                }
            Et(e, t, n);
            break;
        case 21:
            Et(e, t, n);
            break;
        case 22:
            n.mode & 1
                ? ((xe = (r = xe) || n.memoizedState !== null), Et(e, t, n), (xe = r))
                : Et(e, t, n);
            break;
        default:
            Et(e, t, n);
    }
}
function Oc(e) {
    var t = e.updateQueue;
    if (t !== null) {
        e.updateQueue = null;
        var n = e.stateNode;
        (n === null && (n = e.stateNode = new Rv()),
            t.forEach(function (r) {
                var i = Iv.bind(null, e, r);
                n.has(r) || (n.add(r), r.then(i, i));
            }));
    }
}
function Qe(e, t) {
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
                            ((de = a.stateNode), (Je = !1));
                            break e;
                        case 3:
                            ((de = a.stateNode.containerInfo), (Je = !0));
                            break e;
                        case 4:
                            ((de = a.stateNode.containerInfo), (Je = !0));
                            break e;
                    }
                    a = a.return;
                }
                if (de === null) throw Error(C(160));
                (xp(s, o, i), (de = null), (Je = !1));
                var l = i.alternate;
                (l !== null && (l.return = null), (i.return = null));
            } catch (u) {
                re(i, t, u);
            }
        }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) (wp(t, e), (t = t.sibling));
}
function wp(e, t) {
    var n = e.alternate,
        r = e.flags;
    switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            if ((Qe(t, e), st(e), r & 4)) {
                try {
                    (Or(3, e, e.return), Ws(3, e));
                } catch (v) {
                    re(e, e.return, v);
                }
                try {
                    Or(5, e, e.return);
                } catch (v) {
                    re(e, e.return, v);
                }
            }
            break;
        case 1:
            (Qe(t, e), st(e), r & 512 && n !== null && Vn(n, n.return));
            break;
        case 5:
            if ((Qe(t, e), st(e), r & 512 && n !== null && Vn(n, n.return), e.flags & 32)) {
                var i = e.stateNode;
                try {
                    $r(i, '');
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
                        (a === 'input' && s.type === 'radio' && s.name != null && $d(i, s),
                            sa(a, o));
                        var u = sa(a, s);
                        for (o = 0; o < l.length; o += 2) {
                            var c = l[o],
                                f = l[o + 1];
                            c === 'style'
                                ? Gd(i, f)
                                : c === 'dangerouslySetInnerHTML'
                                  ? Wd(i, f)
                                  : c === 'children'
                                    ? $r(i, f)
                                    : dl(i, c, f, u);
                        }
                        switch (a) {
                            case 'input':
                                ea(i, s);
                                break;
                            case 'textarea':
                                Hd(i, s);
                                break;
                            case 'select':
                                var d = i._wrapperState.wasMultiple;
                                i._wrapperState.wasMultiple = !!s.multiple;
                                var m = s.value;
                                m != null
                                    ? Un(i, !!s.multiple, m, !1)
                                    : d !== !!s.multiple &&
                                      (s.defaultValue != null
                                          ? Un(i, !!s.multiple, s.defaultValue, !0)
                                          : Un(i, !!s.multiple, s.multiple ? [] : '', !1));
                        }
                        i[Zr] = s;
                    } catch (v) {
                        re(e, e.return, v);
                    }
            }
            break;
        case 6:
            if ((Qe(t, e), st(e), r & 4)) {
                if (e.stateNode === null) throw Error(C(162));
                ((i = e.stateNode), (s = e.memoizedProps));
                try {
                    i.nodeValue = s;
                } catch (v) {
                    re(e, e.return, v);
                }
            }
            break;
        case 3:
            if ((Qe(t, e), st(e), r & 4 && n !== null && n.memoizedState.isDehydrated))
                try {
                    br(t.containerInfo);
                } catch (v) {
                    re(e, e.return, v);
                }
            break;
        case 4:
            (Qe(t, e), st(e));
            break;
        case 13:
            (Qe(t, e),
                st(e),
                (i = e.child),
                i.flags & 8192 &&
                    ((s = i.memoizedState !== null),
                    (i.stateNode.isHidden = s),
                    !s ||
                        (i.alternate !== null && i.alternate.memoizedState !== null) ||
                        (Wl = se())),
                r & 4 && Oc(e));
            break;
        case 22:
            if (
                ((c = n !== null && n.memoizedState !== null),
                e.mode & 1 ? ((xe = (u = xe) || c), Qe(t, e), (xe = u)) : Qe(t, e),
                st(e),
                r & 8192)
            ) {
                if (
                    ((u = e.memoizedState !== null), (e.stateNode.isHidden = u) && !c && e.mode & 1)
                )
                    for (R = e, c = e.child; c !== null; ) {
                        for (f = R = c; R !== null; ) {
                            switch (((d = R), (m = d.child), d.tag)) {
                                case 0:
                                case 11:
                                case 14:
                                case 15:
                                    Or(4, d, d.return);
                                    break;
                                case 1:
                                    Vn(d, d.return);
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
                                    Vn(d, d.return);
                                    break;
                                case 22:
                                    if (d.memoizedState !== null) {
                                        Vc(f);
                                        continue;
                                    }
                            }
                            m !== null ? ((m.return = d), (R = m)) : Vc(f);
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
                                          (a.style.display = bd('display', o))));
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
            (Qe(t, e), st(e), r & 4 && Oc(e));
            break;
        case 21:
            break;
        default:
            (Qe(t, e), st(e));
    }
}
function st(e) {
    var t = e.flags;
    if (t & 2) {
        try {
            e: {
                for (var n = e.return; n !== null; ) {
                    if (vp(n)) {
                        var r = n;
                        break e;
                    }
                    n = n.return;
                }
                throw Error(C(160));
            }
            switch (r.tag) {
                case 5:
                    var i = r.stateNode;
                    r.flags & 32 && ($r(i, ''), (r.flags &= -33));
                    var s = Dc(e);
                    _a(e, s, i);
                    break;
                case 3:
                case 4:
                    var o = r.stateNode.containerInfo,
                        a = Dc(e);
                    Va(e, a, o);
                    break;
                default:
                    throw Error(C(161));
            }
        } catch (l) {
            re(e, e.return, l);
        }
        e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
}
function Nv(e, t, n) {
    ((R = e), Sp(e));
}
function Sp(e, t, n) {
    for (var r = (e.mode & 1) !== 0; R !== null; ) {
        var i = R,
            s = i.child;
        if (i.tag === 22 && r) {
            var o = i.memoizedState !== null || Vi;
            if (!o) {
                var a = i.alternate,
                    l = (a !== null && a.memoizedState !== null) || xe;
                a = Vi;
                var u = xe;
                if (((Vi = o), (xe = l) && !u))
                    for (R = i; R !== null; )
                        ((o = R),
                            (l = o.child),
                            o.tag === 22 && o.memoizedState !== null
                                ? _c(i)
                                : l !== null
                                  ? ((l.return = o), (R = l))
                                  : _c(i));
                for (; s !== null; ) ((R = s), Sp(s), (s = s.sibling));
                ((R = i), (Vi = a), (xe = u));
            }
            Mc(e);
        } else i.subtreeFlags & 8772 && s !== null ? ((s.return = i), (R = s)) : Mc(e);
    }
}
function Mc(e) {
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
                            xe || Ws(5, t);
                            break;
                        case 1:
                            var r = t.stateNode;
                            if (t.flags & 4 && !xe)
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
                            s !== null && yc(t, s, r);
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
                                yc(t, o, n);
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
                                        f !== null && br(f);
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
                            throw Error(C(163));
                    }
                xe || (t.flags & 512 && Ma(t));
            } catch (d) {
                re(t, t.return, d);
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
function Vc(e) {
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
function _c(e) {
    for (; R !== null; ) {
        var t = R;
        try {
            switch (t.tag) {
                case 0:
                case 11:
                case 15:
                    var n = t.return;
                    try {
                        Ws(4, t);
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
                        Ma(t);
                    } catch (l) {
                        re(t, s, l);
                    }
                    break;
                case 5:
                    var o = t.return;
                    try {
                        Ma(t);
                    } catch (l) {
                        re(t, o, l);
                    }
            }
        } catch (l) {
            re(t, t.return, l);
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
var Dv = Math.ceil,
    Ss = Tt.ReactCurrentDispatcher,
    Hl = Tt.ReactCurrentOwner,
    We = Tt.ReactCurrentBatchConfig,
    U = 0,
    fe = null,
    ae = null,
    pe = 0,
    Oe = 0,
    _n = Gt(0),
    ue = 0,
    ri = null,
    hn = 0,
    bs = 0,
    Kl = 0,
    Mr = null,
    Le = null,
    Wl = 0,
    qn = 1 / 0,
    ht = null,
    ks = !1,
    ja = null,
    zt = null,
    _i = !1,
    Mt = null,
    Ps = 0,
    Vr = 0,
    Fa = null,
    Xi = -1,
    Zi = 0;
function Pe() {
    return U & 6 ? se() : Xi !== -1 ? Xi : (Xi = se());
}
function Bt(e) {
    return e.mode & 1
        ? U & 2 && pe !== 0
            ? pe & -pe
            : pv.transition !== null
              ? (Zi === 0 && (Zi = sh()), Zi)
              : ((e = H), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : dh(e.type))), e)
        : 1;
}
function tt(e, t, n, r) {
    if (50 < Vr) throw ((Vr = 0), (Fa = null), Error(C(185)));
    (fi(e, n, r),
        (!(U & 2) || e !== fe) &&
            (e === fe && (!(U & 2) && (bs |= n), ue === 4 && Dt(e, pe)),
            De(e, r),
            n === 1 && U === 0 && !(t.mode & 1) && ((qn = se() + 500), $s && Qt())));
}
function De(e, t) {
    var n = e.callbackNode;
    py(e, t);
    var r = os(e, e === fe ? pe : 0);
    if (r === 0) (n !== null && Ku(n), (e.callbackNode = null), (e.callbackPriority = 0));
    else if (((t = r & -r), e.callbackPriority !== t)) {
        if ((n != null && Ku(n), t === 1))
            (e.tag === 0 ? hv(jc.bind(null, e)) : Dh(jc.bind(null, e)),
                uv(function () {
                    !(U & 6) && Qt();
                }),
                (n = null));
        else {
            switch (oh(r)) {
                case 1:
                    n = yl;
                    break;
                case 4:
                    n = rh;
                    break;
                case 16:
                    n = ss;
                    break;
                case 536870912:
                    n = ih;
                    break;
                default:
                    n = ss;
            }
            n = Ap(n, kp.bind(null, e));
        }
        ((e.callbackPriority = t), (e.callbackNode = n));
    }
}
function kp(e, t) {
    if (((Xi = -1), (Zi = 0), U & 6)) throw Error(C(327));
    var n = e.callbackNode;
    if (bn() && e.callbackNode !== n) return null;
    var r = os(e, e === fe ? pe : 0);
    if (r === 0) return null;
    if (r & 30 || r & e.expiredLanes || t) t = Cs(e, r);
    else {
        t = r;
        var i = U;
        U |= 2;
        var s = Cp();
        (fe !== e || pe !== t) && ((ht = null), (qn = se() + 500), an(e, t));
        do
            try {
                Vv();
                break;
            } catch (a) {
                Pp(e, a);
            }
        while (!0);
        (Nl(),
            (Ss.current = s),
            (U = i),
            ae !== null ? (t = 0) : ((fe = null), (pe = 0), (t = ue)));
    }
    if (t !== 0) {
        if ((t === 2 && ((i = ca(e)), i !== 0 && ((r = i), (t = Ia(e, i)))), t === 1))
            throw ((n = ri), an(e, 0), Dt(e, r), De(e, se()), n);
        if (t === 6) Dt(e, r);
        else {
            if (
                ((i = e.current.alternate),
                !(r & 30) &&
                    !Ov(i) &&
                    ((t = Cs(e, r)),
                    t === 2 && ((s = ca(e)), s !== 0 && ((r = s), (t = Ia(e, s)))),
                    t === 1))
            )
                throw ((n = ri), an(e, 0), Dt(e, r), De(e, se()), n);
            switch (((e.finishedWork = i), (e.finishedLanes = r), t)) {
                case 0:
                case 1:
                    throw Error(C(345));
                case 2:
                    qt(e, Le, ht);
                    break;
                case 3:
                    if ((Dt(e, r), (r & 130023424) === r && ((t = Wl + 500 - se()), 10 < t))) {
                        if (os(e, 0) !== 0) break;
                        if (((i = e.suspendedLanes), (i & r) !== r)) {
                            (Pe(), (e.pingedLanes |= e.suspendedLanes & i));
                            break;
                        }
                        e.timeoutHandle = va(qt.bind(null, e, Le, ht), t);
                        break;
                    }
                    qt(e, Le, ht);
                    break;
                case 4:
                    if ((Dt(e, r), (r & 4194240) === r)) break;
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
                                          : 1960 * Dv(r / 1960)) - r),
                        10 < r)
                    ) {
                        e.timeoutHandle = va(qt.bind(null, e, Le, ht), r);
                        break;
                    }
                    qt(e, Le, ht);
                    break;
                case 5:
                    qt(e, Le, ht);
                    break;
                default:
                    throw Error(C(329));
            }
        }
    }
    return (De(e, se()), e.callbackNode === n ? kp.bind(null, e) : null);
}
function Ia(e, t) {
    var n = Mr;
    return (
        e.current.memoizedState.isDehydrated && (an(e, t).flags |= 256),
        (e = Cs(e, t)),
        e !== 2 && ((t = Le), (Le = n), t !== null && za(t)),
        e
    );
}
function za(e) {
    Le === null ? (Le = e) : Le.push.apply(Le, e);
}
function Ov(e) {
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
function Dt(e, t) {
    for (
        t &= ~Kl, t &= ~bs, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes;
        0 < t;
    ) {
        var n = 31 - et(t),
            r = 1 << n;
        ((e[n] = -1), (t &= ~r));
    }
}
function jc(e) {
    if (U & 6) throw Error(C(327));
    bn();
    var t = os(e, 0);
    if (!(t & 1)) return (De(e, se()), null);
    var n = Cs(e, t);
    if (e.tag !== 0 && n === 2) {
        var r = ca(e);
        r !== 0 && ((t = r), (n = Ia(e, r)));
    }
    if (n === 1) throw ((n = ri), an(e, 0), Dt(e, t), De(e, se()), n);
    if (n === 6) throw Error(C(345));
    return (
        (e.finishedWork = e.current.alternate),
        (e.finishedLanes = t),
        qt(e, Le, ht),
        De(e, se()),
        null
    );
}
function bl(e, t) {
    var n = U;
    U |= 1;
    try {
        return e(t);
    } finally {
        ((U = n), U === 0 && ((qn = se() + 500), $s && Qt()));
    }
}
function pn(e) {
    Mt !== null && Mt.tag === 0 && !(U & 6) && bn();
    var t = U;
    U |= 1;
    var n = We.transition,
        r = H;
    try {
        if (((We.transition = null), (H = 1), e)) return e();
    } finally {
        ((H = r), (We.transition = n), (U = t), !(U & 6) && Qt());
    }
}
function Gl() {
    ((Oe = _n.current), G(_n));
}
function an(e, t) {
    ((e.finishedWork = null), (e.finishedLanes = 0));
    var n = e.timeoutHandle;
    if ((n !== -1 && ((e.timeoutHandle = -1), lv(n)), ae !== null))
        for (n = ae.return; n !== null; ) {
            var r = n;
            switch ((Ll(r), r.tag)) {
                case 1:
                    ((r = r.type.childContextTypes), r != null && fs());
                    break;
                case 3:
                    (Zn(), G(Ae), G(Se), jl());
                    break;
                case 5:
                    _l(r);
                    break;
                case 4:
                    Zn();
                    break;
                case 13:
                    G(J);
                    break;
                case 19:
                    G(J);
                    break;
                case 10:
                    Dl(r.type._context);
                    break;
                case 22:
                case 23:
                    Gl();
            }
            n = n.return;
        }
    if (
        ((fe = e),
        (ae = e = Ut(e.current, null)),
        (pe = Oe = t),
        (ue = 0),
        (ri = null),
        (Kl = bs = hn = 0),
        (Le = Mr = null),
        rn !== null)
    ) {
        for (t = 0; t < rn.length; t++)
            if (((n = rn[t]), (r = n.interleaved), r !== null)) {
                n.interleaved = null;
                var i = r.next,
                    s = n.pending;
                if (s !== null) {
                    var o = s.next;
                    ((s.next = i), (r.next = o));
                }
                n.pending = r;
            }
        rn = null;
    }
    return e;
}
function Pp(e, t) {
    do {
        var n = ae;
        try {
            if ((Nl(), (Gi.current = ws), xs)) {
                for (var r = ee.memoizedState; r !== null; ) {
                    var i = r.queue;
                    (i !== null && (i.pending = null), (r = r.next));
                }
                xs = !1;
            }
            if (
                ((dn = 0),
                (ce = le = ee = null),
                (Dr = !1),
                (ei = 0),
                (Hl.current = null),
                n === null || n.return === null)
            ) {
                ((ue = 1), (ri = t), (ae = null));
                break;
            }
            e: {
                var s = e,
                    o = n.return,
                    a = n,
                    l = t;
                if (
                    ((t = pe),
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
                    var m = Pc(o);
                    if (m !== null) {
                        ((m.flags &= -257),
                            Cc(m, o, a, s, t),
                            m.mode & 1 && kc(s, u, t),
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
                            (kc(s, u, t), Ql());
                            break e;
                        }
                        l = Error(C(426));
                    }
                } else if (Y && a.mode & 1) {
                    var S = Pc(o);
                    if (S !== null) {
                        (!(S.flags & 65536) && (S.flags |= 256), Cc(S, o, a, s, t), Rl(Jn(l, a)));
                        break e;
                    }
                }
                ((s = l = Jn(l, a)),
                    ue !== 4 && (ue = 2),
                    Mr === null ? (Mr = [s]) : Mr.push(s),
                    (s = o));
                do {
                    switch (s.tag) {
                        case 3:
                            ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
                            var p = op(s, l, t);
                            gc(s, p);
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
                                        (zt === null || !zt.has(g))))
                            ) {
                                ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
                                var x = ap(s, a, t);
                                gc(s, x);
                                break e;
                            }
                    }
                    s = s.return;
                } while (s !== null);
            }
            Ep(n);
        } catch (w) {
            ((t = w), ae === n && n !== null && (ae = n = n.return));
            continue;
        }
        break;
    } while (!0);
}
function Cp() {
    var e = Ss.current;
    return ((Ss.current = ws), e === null ? ws : e);
}
function Ql() {
    ((ue === 0 || ue === 3 || ue === 2) && (ue = 4),
        fe === null || (!(hn & 268435455) && !(bs & 268435455)) || Dt(fe, pe));
}
function Cs(e, t) {
    var n = U;
    U |= 2;
    var r = Cp();
    (fe !== e || pe !== t) && ((ht = null), an(e, t));
    do
        try {
            Mv();
            break;
        } catch (i) {
            Pp(e, i);
        }
    while (!0);
    if ((Nl(), (U = n), (Ss.current = r), ae !== null)) throw Error(C(261));
    return ((fe = null), (pe = 0), ue);
}
function Mv() {
    for (; ae !== null; ) Tp(ae);
}
function Vv() {
    for (; ae !== null && !sy(); ) Tp(ae);
}
function Tp(e) {
    var t = Rp(e.alternate, e, Oe);
    ((e.memoizedProps = e.pendingProps), t === null ? Ep(e) : (ae = t), (Hl.current = null));
}
function Ep(e) {
    var t = e;
    do {
        var n = t.alternate;
        if (((e = t.return), t.flags & 32768)) {
            if (((n = Lv(n, t)), n !== null)) {
                ((n.flags &= 32767), (ae = n));
                return;
            }
            if (e !== null) ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
            else {
                ((ue = 6), (ae = null));
                return;
            }
        } else if (((n = Ev(n, t, Oe)), n !== null)) {
            ae = n;
            return;
        }
        if (((t = t.sibling), t !== null)) {
            ae = t;
            return;
        }
        ae = t = e;
    } while (t !== null);
    ue === 0 && (ue = 5);
}
function qt(e, t, n) {
    var r = H,
        i = We.transition;
    try {
        ((We.transition = null), (H = 1), _v(e, t, n, r));
    } finally {
        ((We.transition = i), (H = r));
    }
    return null;
}
function _v(e, t, n, r) {
    do bn();
    while (Mt !== null);
    if (U & 6) throw Error(C(327));
    n = e.finishedWork;
    var i = e.finishedLanes;
    if (n === null) return null;
    if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current)) throw Error(C(177));
    ((e.callbackNode = null), (e.callbackPriority = 0));
    var s = n.lanes | n.childLanes;
    if (
        (my(e, s),
        e === fe && ((ae = fe = null), (pe = 0)),
        (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
            _i ||
            ((_i = !0),
            Ap(ss, function () {
                return (bn(), null);
            })),
        (s = (n.flags & 15990) !== 0),
        n.subtreeFlags & 15990 || s)
    ) {
        ((s = We.transition), (We.transition = null));
        var o = H;
        H = 1;
        var a = U;
        ((U |= 4),
            (Hl.current = null),
            Av(e, n),
            wp(n, e),
            tv(ga),
            (as = !!ma),
            (ga = ma = null),
            (e.current = n),
            Nv(n),
            oy(),
            (U = a),
            (H = o),
            (We.transition = s));
    } else e.current = n;
    if (
        (_i && ((_i = !1), (Mt = e), (Ps = i)),
        (s = e.pendingLanes),
        s === 0 && (zt = null),
        uy(n.stateNode),
        De(e, se()),
        t !== null)
    )
        for (r = e.onRecoverableError, n = 0; n < t.length; n++)
            ((i = t[n]), r(i.value, { componentStack: i.stack, digest: i.digest }));
    if (ks) throw ((ks = !1), (e = ja), (ja = null), e);
    return (
        Ps & 1 && e.tag !== 0 && bn(),
        (s = e.pendingLanes),
        s & 1 ? (e === Fa ? Vr++ : ((Vr = 0), (Fa = e))) : (Vr = 0),
        Qt(),
        null
    );
}
function bn() {
    if (Mt !== null) {
        var e = oh(Ps),
            t = We.transition,
            n = H;
        try {
            if (((We.transition = null), (H = 16 > e ? 16 : e), Mt === null)) var r = !1;
            else {
                if (((e = Mt), (Mt = null), (Ps = 0), U & 6)) throw Error(C(331));
                var i = U;
                for (U |= 4, R = e.current; R !== null; ) {
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
                                            Or(8, c, s);
                                    }
                                    var f = c.child;
                                    if (f !== null) ((f.return = c), (R = f));
                                    else
                                        for (; R !== null; ) {
                                            c = R;
                                            var d = c.sibling,
                                                m = c.return;
                                            if ((yp(c), c === u)) {
                                                R = null;
                                                break;
                                            }
                                            if (d !== null) {
                                                ((d.return = m), (R = d));
                                                break;
                                            }
                                            R = m;
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
                                        Or(9, s, s.return);
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
                    var g = o.child;
                    if (o.subtreeFlags & 2064 && g !== null) ((g.return = o), (R = g));
                    else
                        e: for (o = h; R !== null; ) {
                            if (((a = R), a.flags & 2048))
                                try {
                                    switch (a.tag) {
                                        case 0:
                                        case 11:
                                        case 15:
                                            Ws(9, a);
                                    }
                                } catch (w) {
                                    re(a, a.return, w);
                                }
                            if (a === o) {
                                R = null;
                                break e;
                            }
                            var x = a.sibling;
                            if (x !== null) {
                                ((x.return = a.return), (R = x));
                                break e;
                            }
                            R = a.return;
                        }
                }
                if (((U = i), Qt(), ut && typeof ut.onPostCommitFiberRoot == 'function'))
                    try {
                        ut.onPostCommitFiberRoot(Fs, e);
                    } catch {}
                r = !0;
            }
            return r;
        } finally {
            ((H = n), (We.transition = t));
        }
    }
    return !1;
}
function Fc(e, t, n) {
    ((t = Jn(n, t)),
        (t = op(e, t, 1)),
        (e = It(e, t, 1)),
        (t = Pe()),
        e !== null && (fi(e, 1, t), De(e, t)));
}
function re(e, t, n) {
    if (e.tag === 3) Fc(e, e, n);
    else
        for (; t !== null; ) {
            if (t.tag === 3) {
                Fc(t, e, n);
                break;
            } else if (t.tag === 1) {
                var r = t.stateNode;
                if (
                    typeof t.type.getDerivedStateFromError == 'function' ||
                    (typeof r.componentDidCatch == 'function' && (zt === null || !zt.has(r)))
                ) {
                    ((e = Jn(n, e)),
                        (e = ap(t, e, 1)),
                        (t = It(t, e, 1)),
                        (e = Pe()),
                        t !== null && (fi(t, 1, e), De(t, e)));
                    break;
                }
            }
            t = t.return;
        }
}
function jv(e, t, n) {
    var r = e.pingCache;
    (r !== null && r.delete(t),
        (t = Pe()),
        (e.pingedLanes |= e.suspendedLanes & n),
        fe === e &&
            (pe & n) === n &&
            (ue === 4 || (ue === 3 && (pe & 130023424) === pe && 500 > se() - Wl)
                ? an(e, 0)
                : (Kl |= n)),
        De(e, t));
}
function Lp(e, t) {
    t === 0 && (e.mode & 1 ? ((t = Ti), (Ti <<= 1), !(Ti & 130023424) && (Ti = 4194304)) : (t = 1));
    var n = Pe();
    ((e = kt(e, t)), e !== null && (fi(e, t, n), De(e, n)));
}
function Fv(e) {
    var t = e.memoizedState,
        n = 0;
    (t !== null && (n = t.retryLane), Lp(e, n));
}
function Iv(e, t) {
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
            throw Error(C(314));
    }
    (r !== null && r.delete(t), Lp(e, n));
}
var Rp;
Rp = function (e, t, n) {
    if (e !== null)
        if (e.memoizedProps !== t.pendingProps || Ae.current) Re = !0;
        else {
            if (!(e.lanes & n) && !(t.flags & 128)) return ((Re = !1), Tv(e, t, n));
            Re = !!(e.flags & 131072);
        }
    else ((Re = !1), Y && t.flags & 1048576 && Oh(t, ps, t.index));
    switch (((t.lanes = 0), t.tag)) {
        case 2:
            var r = t.type;
            (Yi(e, t), (e = t.pendingProps));
            var i = Qn(t, Se.current);
            (Wn(t, n), (i = Il(null, t, r, e, i, n)));
            var s = zl();
            return (
                (t.flags |= 1),
                typeof i == 'object' &&
                i !== null &&
                typeof i.render == 'function' &&
                i.$$typeof === void 0
                    ? ((t.tag = 1),
                      (t.memoizedState = null),
                      (t.updateQueue = null),
                      Ne(r) ? ((s = !0), ds(t)) : (s = !1),
                      (t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null),
                      Ml(t),
                      (i.updater = Ks),
                      (t.stateNode = i),
                      (i._reactInternals = t),
                      Ta(t, r, e, n),
                      (t = Ra(null, t, r, !0, s, n)))
                    : ((t.tag = 0), Y && s && El(t), ke(null, t, i, n), (t = t.child)),
                t
            );
        case 16:
            r = t.elementType;
            e: {
                switch (
                    (Yi(e, t),
                    (e = t.pendingProps),
                    (i = r._init),
                    (r = i(r._payload)),
                    (t.type = r),
                    (i = t.tag = Bv(r)),
                    (e = Ze(r, e)),
                    i)
                ) {
                    case 0:
                        t = La(null, t, r, e, n);
                        break e;
                    case 1:
                        t = Lc(null, t, r, e, n);
                        break e;
                    case 11:
                        t = Tc(null, t, r, e, n);
                        break e;
                    case 14:
                        t = Ec(null, t, r, Ze(r.type, e), n);
                        break e;
                }
                throw Error(C(306, r, ''));
            }
            return t;
        case 0:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Ze(r, i)),
                La(e, t, r, i, n)
            );
        case 1:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Ze(r, i)),
                Lc(e, t, r, i, n)
            );
        case 3:
            e: {
                if ((fp(t), e === null)) throw Error(C(387));
                ((r = t.pendingProps),
                    (s = t.memoizedState),
                    (i = s.element),
                    Ih(e, t),
                    ys(t, r, null, n));
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
                        ((i = Jn(Error(C(423)), t)), (t = Rc(e, t, r, n, i)));
                        break e;
                    } else if (r !== i) {
                        ((i = Jn(Error(C(424)), t)), (t = Rc(e, t, r, n, i)));
                        break e;
                    } else
                        for (
                            Me = Ft(t.stateNode.containerInfo.firstChild),
                                Ve = t,
                                Y = !0,
                                qe = null,
                                n = jh(t, null, r, n),
                                t.child = n;
                            n;
                        )
                            ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
                else {
                    if ((Yn(), r === i)) {
                        t = Pt(e, t, n);
                        break e;
                    }
                    ke(e, t, r, n);
                }
                t = t.child;
            }
            return t;
        case 5:
            return (
                zh(t),
                e === null && ka(t),
                (r = t.type),
                (i = t.pendingProps),
                (s = e !== null ? e.memoizedProps : null),
                (o = i.children),
                ya(r, i) ? (o = null) : s !== null && ya(r, s) && (t.flags |= 32),
                cp(e, t),
                ke(e, t, o, n),
                t.child
            );
        case 6:
            return (e === null && ka(t), null);
        case 13:
            return dp(e, t, n);
        case 4:
            return (
                Vl(t, t.stateNode.containerInfo),
                (r = t.pendingProps),
                e === null ? (t.child = Xn(t, null, r, n)) : ke(e, t, r, n),
                t.child
            );
        case 11:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Ze(r, i)),
                Tc(e, t, r, i, n)
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
                    W(ms, r._currentValue),
                    (r._currentValue = o),
                    s !== null)
                )
                    if (nt(s.value, o)) {
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
                                            ((l = yt(-1, n & -n)), (l.tag = 2));
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
                                            Pa(s.return, n, t),
                                            (a.lanes |= n));
                                        break;
                                    }
                                    l = l.next;
                                }
                            } else if (s.tag === 10) o = s.type === t.type ? null : s.child;
                            else if (s.tag === 18) {
                                if (((o = s.return), o === null)) throw Error(C(341));
                                ((o.lanes |= n),
                                    (a = o.alternate),
                                    a !== null && (a.lanes |= n),
                                    Pa(o, n, t),
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
                Wn(t, n),
                (i = be(i)),
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
                Ec(e, t, r, i, n)
            );
        case 15:
            return lp(e, t, t.type, t.pendingProps, n);
        case 17:
            return (
                (r = t.type),
                (i = t.pendingProps),
                (i = t.elementType === r ? i : Ze(r, i)),
                Yi(e, t),
                (t.tag = 1),
                Ne(r) ? ((e = !0), ds(t)) : (e = !1),
                Wn(t, n),
                sp(t, r, i),
                Ta(t, r, i, n),
                Ra(null, t, r, !0, e, n)
            );
        case 19:
            return hp(e, t, n);
        case 22:
            return up(e, t, n);
    }
    throw Error(C(156, t.tag));
};
function Ap(e, t) {
    return nh(e, t);
}
function zv(e, t, n, r) {
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
    return new zv(e, t, n, r);
}
function Yl(e) {
    return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function Bv(e) {
    if (typeof e == 'function') return Yl(e) ? 1 : 0;
    if (e != null) {
        if (((e = e.$$typeof), e === pl)) return 11;
        if (e === ml) return 14;
    }
    return 2;
}
function Ut(e, t) {
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
function Ji(e, t, n, r, i, s) {
    var o = 2;
    if (((r = e), typeof e == 'function')) Yl(e) && (o = 1);
    else if (typeof e == 'string') o = 5;
    else
        e: switch (e) {
            case Tn:
                return ln(n.children, i, s, t);
            case hl:
                ((o = 8), (i |= 8));
                break;
            case Yo:
                return ((e = Ke(12, n, t, i | 2)), (e.elementType = Yo), (e.lanes = s), e);
            case Xo:
                return ((e = Ke(13, n, t, i)), (e.elementType = Xo), (e.lanes = s), e);
            case Zo:
                return ((e = Ke(19, n, t, i)), (e.elementType = Zo), (e.lanes = s), e);
            case zd:
                return Gs(n, i, s, t);
            default:
                if (typeof e == 'object' && e !== null)
                    switch (e.$$typeof) {
                        case Fd:
                            o = 10;
                            break e;
                        case Id:
                            o = 9;
                            break e;
                        case pl:
                            o = 11;
                            break e;
                        case ml:
                            o = 14;
                            break e;
                        case Rt:
                            ((o = 16), (r = null));
                            break e;
                    }
                throw Error(C(130, e == null ? e : typeof e, ''));
        }
    return ((t = Ke(o, n, t, i)), (t.elementType = e), (t.type = r), (t.lanes = s), t);
}
function ln(e, t, n, r) {
    return ((e = Ke(7, e, r, t)), (e.lanes = n), e);
}
function Gs(e, t, n, r) {
    return (
        (e = Ke(22, e, r, t)),
        (e.elementType = zd),
        (e.lanes = n),
        (e.stateNode = { isHidden: !1 }),
        e
    );
}
function Ao(e, t, n) {
    return ((e = Ke(6, e, null, t)), (e.lanes = n), e);
}
function No(e, t, n) {
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
function Uv(e, t, n, r, i) {
    ((this.tag = t),
        (this.containerInfo = e),
        (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode = this.pendingContext = this.context = null),
        (this.callbackPriority = 0),
        (this.eventTimes = uo(0)),
        (this.expirationTimes = uo(-1)),
        (this.entangledLanes =
            this.finishedLanes =
            this.mutableReadLanes =
            this.expiredLanes =
            this.pingedLanes =
            this.suspendedLanes =
            this.pendingLanes =
                0),
        (this.entanglements = uo(0)),
        (this.identifierPrefix = r),
        (this.onRecoverableError = i),
        (this.mutableSourceEagerHydrationData = null));
}
function Xl(e, t, n, r, i, s, o, a, l) {
    return (
        (e = new Uv(e, t, n, a, l)),
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
        Ml(s),
        e
    );
}
function $v(e, t, n) {
    var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
        $$typeof: Cn,
        key: r == null ? null : '' + r,
        children: e,
        containerInfo: t,
        implementation: n,
    };
}
function Np(e) {
    if (!e) return Ht;
    e = e._reactInternals;
    e: {
        if (yn(e) !== e || e.tag !== 1) throw Error(C(170));
        var t = e;
        do {
            switch (t.tag) {
                case 3:
                    t = t.stateNode.context;
                    break e;
                case 1:
                    if (Ne(t.type)) {
                        t = t.stateNode.__reactInternalMemoizedMergedChildContext;
                        break e;
                    }
            }
            t = t.return;
        } while (t !== null);
        throw Error(C(171));
    }
    if (e.tag === 1) {
        var n = e.type;
        if (Ne(n)) return Nh(e, n, t);
    }
    return t;
}
function Dp(e, t, n, r, i, s, o, a, l) {
    return (
        (e = Xl(n, r, !0, e, i, s, o, a, l)),
        (e.context = Np(null)),
        (n = e.current),
        (r = Pe()),
        (i = Bt(n)),
        (s = yt(r, i)),
        (s.callback = t ?? null),
        It(n, s, i),
        (e.current.lanes = i),
        fi(e, i, r),
        De(e, r),
        e
    );
}
function Qs(e, t, n, r) {
    var i = t.current,
        s = Pe(),
        o = Bt(i);
    return (
        (n = Np(n)),
        t.context === null ? (t.context = n) : (t.pendingContext = n),
        (t = yt(s, o)),
        (t.payload = { element: e }),
        (r = r === void 0 ? null : r),
        r !== null && (t.callback = r),
        (e = It(i, t, o)),
        e !== null && (tt(e, i, o, s), bi(e, i, o)),
        o
    );
}
function Ts(e) {
    if (((e = e.current), !e.child)) return null;
    switch (e.child.tag) {
        case 5:
            return e.child.stateNode;
        default:
            return e.child.stateNode;
    }
}
function Ic(e, t) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
    }
}
function Zl(e, t) {
    (Ic(e, t), (e = e.alternate) && Ic(e, t));
}
function Hv() {
    return null;
}
var Op =
    typeof reportError == 'function'
        ? reportError
        : function (e) {
              console.error(e);
          };
function Jl(e) {
    this._internalRoot = e;
}
Ys.prototype.render = Jl.prototype.render = function (e) {
    var t = this._internalRoot;
    if (t === null) throw Error(C(409));
    Qs(e, t, null, null);
};
Ys.prototype.unmount = Jl.prototype.unmount = function () {
    var e = this._internalRoot;
    if (e !== null) {
        this._internalRoot = null;
        var t = e.containerInfo;
        (pn(function () {
            Qs(null, e, null, null);
        }),
            (t[St] = null));
    }
};
function Ys(e) {
    this._internalRoot = e;
}
Ys.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
        var t = uh();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < Nt.length && t !== 0 && t < Nt[n].priority; n++);
        (Nt.splice(n, 0, e), n === 0 && fh(e));
    }
};
function ql(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function Xs(e) {
    return !(
        !e ||
        (e.nodeType !== 1 &&
            e.nodeType !== 9 &&
            e.nodeType !== 11 &&
            (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
    );
}
function zc() {}
function Kv(e, t, n, r, i) {
    if (i) {
        if (typeof r == 'function') {
            var s = r;
            r = function () {
                var u = Ts(o);
                s.call(u);
            };
        }
        var o = Dp(t, r, e, 0, null, !1, !1, '', zc);
        return (
            (e._reactRootContainer = o),
            (e[St] = o.current),
            Yr(e.nodeType === 8 ? e.parentNode : e),
            pn(),
            o
        );
    }
    for (; (i = e.lastChild); ) e.removeChild(i);
    if (typeof r == 'function') {
        var a = r;
        r = function () {
            var u = Ts(l);
            a.call(u);
        };
    }
    var l = Xl(e, 0, !1, null, null, !1, !1, '', zc);
    return (
        (e._reactRootContainer = l),
        (e[St] = l.current),
        Yr(e.nodeType === 8 ? e.parentNode : e),
        pn(function () {
            Qs(t, l, n, r);
        }),
        l
    );
}
function Zs(e, t, n, r, i) {
    var s = n._reactRootContainer;
    if (s) {
        var o = s;
        if (typeof i == 'function') {
            var a = i;
            i = function () {
                var l = Ts(o);
                a.call(l);
            };
        }
        Qs(t, o, e, i);
    } else o = Kv(n, t, e, i, r);
    return Ts(o);
}
ah = function (e) {
    switch (e.tag) {
        case 3:
            var t = e.stateNode;
            if (t.current.memoizedState.isDehydrated) {
                var n = Sr(t.pendingLanes);
                n !== 0 && (vl(t, n | 1), De(t, se()), !(U & 6) && ((qn = se() + 500), Qt()));
            }
            break;
        case 13:
            (pn(function () {
                var r = kt(e, 1);
                if (r !== null) {
                    var i = Pe();
                    tt(r, e, 1, i);
                }
            }),
                Zl(e, 1));
    }
};
xl = function (e) {
    if (e.tag === 13) {
        var t = kt(e, 134217728);
        if (t !== null) {
            var n = Pe();
            tt(t, e, 134217728, n);
        }
        Zl(e, 134217728);
    }
};
lh = function (e) {
    if (e.tag === 13) {
        var t = Bt(e),
            n = kt(e, t);
        if (n !== null) {
            var r = Pe();
            tt(n, e, t, r);
        }
        Zl(e, t);
    }
};
uh = function () {
    return H;
};
ch = function (e, t) {
    var n = H;
    try {
        return ((H = e), t());
    } finally {
        H = n;
    }
};
aa = function (e, t, n) {
    switch (t) {
        case 'input':
            if ((ea(e, n), (t = n.name), n.type === 'radio' && t != null)) {
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
                        var i = Us(r);
                        if (!i) throw Error(C(90));
                        (Ud(r), ea(r, i));
                    }
                }
            }
            break;
        case 'textarea':
            Hd(e, n);
            break;
        case 'select':
            ((t = n.value), t != null && Un(e, !!n.multiple, t, !1));
    }
};
Xd = bl;
Zd = pn;
var Wv = { usingClientEntryPoint: !1, Events: [hi, An, Us, Qd, Yd, bl] },
    gr = {
        findFiberByHostInstance: nn,
        bundleType: 0,
        version: '18.3.1',
        rendererPackageName: 'react-dom',
    },
    bv = {
        bundleType: gr.bundleType,
        version: gr.version,
        rendererPackageName: gr.rendererPackageName,
        rendererConfig: gr.rendererConfig,
        overrideHookState: null,
        overrideHookStateDeletePath: null,
        overrideHookStateRenamePath: null,
        overrideProps: null,
        overridePropsDeletePath: null,
        overridePropsRenamePath: null,
        setErrorHandler: null,
        setSuspenseHandler: null,
        scheduleUpdate: null,
        currentDispatcherRef: Tt.ReactCurrentDispatcher,
        findHostInstanceByFiber: function (e) {
            return ((e = eh(e)), e === null ? null : e.stateNode);
        },
        findFiberByHostInstance: gr.findFiberByHostInstance || Hv,
        findHostInstancesForRefresh: null,
        scheduleRefresh: null,
        scheduleRoot: null,
        setRefreshHandler: null,
        getCurrentFiber: null,
        reconcilerVersion: '18.3.1-next-f1338f8080-20240426',
    };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
    var ji = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!ji.isDisabled && ji.supportsFiber)
        try {
            ((Fs = ji.inject(bv)), (ut = ji));
        } catch {}
}
Ie.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Wv;
Ie.createPortal = function (e, t) {
    var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!ql(t)) throw Error(C(200));
    return $v(e, t, null, n);
};
Ie.createRoot = function (e, t) {
    if (!ql(e)) throw Error(C(299));
    var n = !1,
        r = '',
        i = Op;
    return (
        t != null &&
            (t.unstable_strictMode === !0 && (n = !0),
            t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
            t.onRecoverableError !== void 0 && (i = t.onRecoverableError)),
        (t = Xl(e, 1, !1, null, null, n, !1, r, i)),
        (e[St] = t.current),
        Yr(e.nodeType === 8 ? e.parentNode : e),
        new Jl(t)
    );
};
Ie.findDOMNode = function (e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
        throw typeof e.render == 'function'
            ? Error(C(188))
            : ((e = Object.keys(e).join(',')), Error(C(268, e)));
    return ((e = eh(t)), (e = e === null ? null : e.stateNode), e);
};
Ie.flushSync = function (e) {
    return pn(e);
};
Ie.hydrate = function (e, t, n) {
    if (!Xs(t)) throw Error(C(200));
    return Zs(null, e, t, !0, n);
};
Ie.hydrateRoot = function (e, t, n) {
    if (!ql(e)) throw Error(C(405));
    var r = (n != null && n.hydratedSources) || null,
        i = !1,
        s = '',
        o = Op;
    if (
        (n != null &&
            (n.unstable_strictMode === !0 && (i = !0),
            n.identifierPrefix !== void 0 && (s = n.identifierPrefix),
            n.onRecoverableError !== void 0 && (o = n.onRecoverableError)),
        (t = Dp(t, null, e, 1, n ?? null, i, !1, s, o)),
        (e[St] = t.current),
        Yr(e),
        r)
    )
        for (e = 0; e < r.length; e++)
            ((n = r[e]),
                (i = n._getVersion),
                (i = i(n._source)),
                t.mutableSourceEagerHydrationData == null
                    ? (t.mutableSourceEagerHydrationData = [n, i])
                    : t.mutableSourceEagerHydrationData.push(n, i));
    return new Ys(t);
};
Ie.render = function (e, t, n) {
    if (!Xs(t)) throw Error(C(200));
    return Zs(null, e, t, !1, n);
};
Ie.unmountComponentAtNode = function (e) {
    if (!Xs(e)) throw Error(C(40));
    return e._reactRootContainer
        ? (pn(function () {
              Zs(null, null, e, !1, function () {
                  ((e._reactRootContainer = null), (e[St] = null));
              });
          }),
          !0)
        : !1;
};
Ie.unstable_batchedUpdates = bl;
Ie.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
    if (!Xs(n)) throw Error(C(200));
    if (e == null || e._reactInternals === void 0) throw Error(C(38));
    return Zs(e, t, n, !1, r);
};
Ie.version = '18.3.1-next-f1338f8080-20240426';
function Mp() {
    if (
        !(
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
        )
    )
        try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Mp);
        } catch (e) {
            console.error(e);
        }
}
(Mp(), (Md.exports = Ie));
var Gv = Md.exports,
    Bc = Gv;
((Go.createRoot = Bc.createRoot), (Go.hydrateRoot = Bc.hydrateRoot));
const Vp = N.createContext({});
function Qv(e) {
    const t = N.useRef(null);
    return (t.current === null && (t.current = e()), t.current);
}
const eu = N.createContext(null),
    _p = N.createContext({ transformPagePoint: (e) => e, isStatic: !1, reducedMotion: 'never' });
function Yv(e = !0) {
    const t = N.useContext(eu);
    if (t === null) return [!0, null];
    const { isPresent: n, onExitComplete: r, register: i } = t,
        s = N.useId();
    N.useEffect(() => {
        e && i(s);
    }, [e]);
    const o = N.useCallback(() => e && r && r(s), [s, r, e]);
    return !n && r ? [!1, o] : [!0];
}
const tu = typeof window < 'u',
    Xv = tu ? N.useLayoutEffect : N.useEffect,
    _e = (e) => e;
let jp = _e;
function nu(e) {
    let t;
    return () => (t === void 0 && (t = e()), t);
}
const er = (e, t, n) => {
        const r = t - e;
        return r === 0 ? 1 : (n - e) / r;
    },
    vt = (e) => e * 1e3,
    xt = (e) => e / 1e3,
    Zv = { useManualTiming: !1 };
function Jv(e) {
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
const Fi = ['read', 'resolveKeyframes', 'update', 'preRender', 'render', 'postRender'],
    qv = 40;
function Fp(e, t) {
    let n = !1,
        r = !0;
    const i = { delta: 0, timestamp: 0, isProcessing: !1 },
        s = () => (n = !0),
        o = Fi.reduce((p, h) => ((p[h] = Jv(s)), p), {}),
        { read: a, resolveKeyframes: l, update: u, preRender: c, render: f, postRender: d } = o,
        m = () => {
            const p = performance.now();
            ((n = !1),
                (i.delta = r ? 1e3 / 60 : Math.max(Math.min(p - i.timestamp, qv), 1)),
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
        schedule: Fi.reduce((p, h) => {
            const g = o[h];
            return ((p[h] = (x, w = !1, P = !1) => (n || y(), g.schedule(x, w, P))), p);
        }, {}),
        cancel: (p) => {
            for (let h = 0; h < Fi.length; h++) o[Fi[h]].cancel(p);
        },
        state: i,
        steps: o,
    };
}
const {
        schedule: Q,
        cancel: Kt,
        state: he,
        steps: Do,
    } = Fp(typeof requestAnimationFrame < 'u' ? requestAnimationFrame : _e, !0),
    Ip = N.createContext({ strict: !1 }),
    Uc = {
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
    tr = {};
for (const e in Uc) tr[e] = { isEnabled: (t) => Uc[e].some((n) => !!t[n]) };
function e0(e) {
    for (const t in e) tr[t] = { ...tr[t], ...e[t] };
}
const t0 = new Set([
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
function Es(e) {
    return (
        e.startsWith('while') ||
        (e.startsWith('drag') && e !== 'draggable') ||
        e.startsWith('layout') ||
        e.startsWith('onTap') ||
        e.startsWith('onPan') ||
        e.startsWith('onLayout') ||
        t0.has(e)
    );
}
let zp = (e) => !Es(e);
function n0(e) {
    e && (zp = (t) => (t.startsWith('on') ? !Es(t) : e(t)));
}
try {
    n0(require('@emotion/is-prop-valid').default);
} catch {}
function r0(e, t, n) {
    const r = {};
    for (const i in e)
        (i === 'values' && typeof e.values == 'object') ||
            ((zp(i) ||
                (n === !0 && Es(i)) ||
                (!t && !Es(i)) ||
                (e.draggable && i.startsWith('onDrag'))) &&
                (r[i] = e[i]));
    return r;
}
function i0(e) {
    if (typeof Proxy > 'u') return e;
    const t = new Map(),
        n = (...r) => e(...r);
    return new Proxy(n, {
        get: (r, i) => (i === 'create' ? e : (t.has(i) || t.set(i, e(i)), t.get(i))),
    });
}
const Js = N.createContext({});
function ii(e) {
    return typeof e == 'string' || Array.isArray(e);
}
function qs(e) {
    return e !== null && typeof e == 'object' && typeof e.start == 'function';
}
const ru = ['animate', 'whileInView', 'whileFocus', 'whileHover', 'whileTap', 'whileDrag', 'exit'],
    iu = ['initial', ...ru];
function eo(e) {
    return qs(e.animate) || iu.some((t) => ii(e[t]));
}
function Bp(e) {
    return !!(eo(e) || e.variants);
}
function s0(e, t) {
    if (eo(e)) {
        const { initial: n, animate: r } = e;
        return { initial: n === !1 || ii(n) ? n : void 0, animate: ii(r) ? r : void 0 };
    }
    return e.inherit !== !1 ? t : {};
}
function o0(e) {
    const { initial: t, animate: n } = s0(e, N.useContext(Js));
    return N.useMemo(() => ({ initial: t, animate: n }), [$c(t), $c(n)]);
}
function $c(e) {
    return Array.isArray(e) ? e.join(' ') : e;
}
const a0 = Symbol.for('motionComponentSymbol');
function jn(e) {
    return e && typeof e == 'object' && Object.prototype.hasOwnProperty.call(e, 'current');
}
function l0(e, t, n) {
    return N.useCallback(
        (r) => {
            (r && e.onMount && e.onMount(r),
                t && (r ? t.mount(r) : t.unmount()),
                n && (typeof n == 'function' ? n(r) : jn(n) && (n.current = r)));
        },
        [t],
    );
}
const su = (e) => e.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase(),
    u0 = 'framerAppearId',
    Up = 'data-' + su(u0),
    { schedule: ou } = Fp(queueMicrotask, !1),
    $p = N.createContext({});
function c0(e, t, n, r, i) {
    var s, o;
    const { visualElement: a } = N.useContext(Js),
        l = N.useContext(Ip),
        u = N.useContext(eu),
        c = N.useContext(_p).reducedMotion,
        f = N.useRef(null);
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
        m = N.useContext($p);
    d && !d.projection && i && (d.type === 'html' || d.type === 'svg') && f0(f.current, n, i, m);
    const y = N.useRef(!1);
    N.useInsertionEffect(() => {
        d && y.current && d.update(n, u);
    });
    const v = n[Up],
        S = N.useRef(
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
        Xv(() => {
            d &&
                ((y.current = !0),
                (window.MotionIsMounted = !0),
                d.updateFeatures(),
                ou.render(d.render),
                S.current && d.animationState && d.animationState.animateChanges());
        }),
        N.useEffect(() => {
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
function f0(e, t, n, r) {
    const {
        layoutId: i,
        layout: s,
        drag: o,
        dragConstraints: a,
        layoutScroll: l,
        layoutRoot: u,
    } = t;
    ((e.projection = new n(e.latestValues, t['data-framer-portal-id'] ? void 0 : Hp(e.parent))),
        e.projection.setOptions({
            layoutId: i,
            layout: s,
            alwaysMeasureLayout: !!o || (a && jn(a)),
            visualElement: e,
            animationType: typeof s == 'string' ? s : 'both',
            initialPromotionConfig: r,
            layoutScroll: l,
            layoutRoot: u,
        }));
}
function Hp(e) {
    if (e) return e.options.allowProjection !== !1 ? e.projection : Hp(e.parent);
}
function d0({
    preloadedFeatures: e,
    createVisualElement: t,
    useRender: n,
    useVisualState: r,
    Component: i,
}) {
    var s, o;
    e && e0(e);
    function a(u, c) {
        let f;
        const d = { ...N.useContext(_p), ...u, layoutId: h0(u) },
            { isStatic: m } = d,
            y = o0(u),
            v = r(u, m);
        if (!m && tu) {
            p0();
            const S = m0(d);
            ((f = S.MeasureLayout), (y.visualElement = c0(i, v, d, t, S.ProjectionNode)));
        }
        return A.jsxs(Js.Provider, {
            value: y,
            children: [
                f && y.visualElement ? A.jsx(f, { visualElement: y.visualElement, ...d }) : null,
                n(i, u, l0(v, y.visualElement, c), v, m, y.visualElement),
            ],
        });
    }
    a.displayName = `motion.${typeof i == 'string' ? i : `create(${(o = (s = i.displayName) !== null && s !== void 0 ? s : i.name) !== null && o !== void 0 ? o : ''})`}`;
    const l = N.forwardRef(a);
    return ((l[a0] = i), l);
}
function h0({ layoutId: e }) {
    const t = N.useContext(Vp).id;
    return t && e !== void 0 ? t + '-' + e : e;
}
function p0(e, t) {
    N.useContext(Ip).strict;
}
function m0(e) {
    const { drag: t, layout: n } = tr;
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
const g0 = [
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
function au(e) {
    return typeof e != 'string' || e.includes('-')
        ? !1
        : !!(g0.indexOf(e) > -1 || /[A-Z]/u.test(e));
}
function Hc(e) {
    const t = [{}, {}];
    return (
        e == null ||
            e.values.forEach((n, r) => {
                ((t[0][r] = n.get()), (t[1][r] = n.getVelocity()));
            }),
        t
    );
}
function lu(e, t, n, r) {
    if (typeof t == 'function') {
        const [i, s] = Hc(r);
        t = t(n !== void 0 ? n : e.custom, i, s);
    }
    if ((typeof t == 'string' && (t = e.variants && e.variants[t]), typeof t == 'function')) {
        const [i, s] = Hc(r);
        t = t(n !== void 0 ? n : e.custom, i, s);
    }
    return t;
}
const Ba = (e) => Array.isArray(e),
    y0 = (e) => !!(e && typeof e == 'object' && e.mix && e.toValue),
    v0 = (e) => (Ba(e) ? e[e.length - 1] || 0 : e),
    we = (e) => !!(e && e.getVelocity);
function qi(e) {
    const t = we(e) ? e.get() : e;
    return y0(t) ? t.toValue() : t;
}
function x0({ scrapeMotionValuesFromProps: e, createRenderState: t, onUpdate: n }, r, i, s) {
    const o = { latestValues: w0(r, i, s, e), renderState: t() };
    return (
        n && ((o.onMount = (a) => n({ props: r, current: a, ...o })), (o.onUpdate = (a) => n(a))),
        o
    );
}
const Kp = (e) => (t, n) => {
    const r = N.useContext(Js),
        i = N.useContext(eu),
        s = () => x0(e, t, r, i);
    return n ? s() : Qv(s);
};
function w0(e, t, n, r) {
    const i = {},
        s = r(e, {});
    for (const d in s) i[d] = qi(s[d]);
    let { initial: o, animate: a } = e;
    const l = eo(e),
        u = Bp(e);
    t &&
        u &&
        !l &&
        e.inherit !== !1 &&
        (o === void 0 && (o = t.initial), a === void 0 && (a = t.animate));
    let c = n ? n.initial === !1 : !1;
    c = c || o === !1;
    const f = c ? a : o;
    if (f && typeof f != 'boolean' && !qs(f)) {
        const d = Array.isArray(f) ? f : [f];
        for (let m = 0; m < d.length; m++) {
            const y = lu(e, d[m]);
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
const ar = [
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
    vn = new Set(ar),
    Wp = (e) => (t) => typeof t == 'string' && t.startsWith(e),
    bp = Wp('--'),
    S0 = Wp('var(--'),
    uu = (e) => (S0(e) ? k0.test(e.split('/*')[0].trim()) : !1),
    k0 = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu,
    Gp = (e, t) => (t && typeof e == 'number' ? t.transform(e) : e),
    Ct = (e, t, n) => (n > t ? t : n < e ? e : n),
    lr = { test: (e) => typeof e == 'number', parse: parseFloat, transform: (e) => e },
    si = { ...lr, transform: (e) => Ct(0, 1, e) },
    Ii = { ...lr, default: 1 },
    mi = (e) => ({
        test: (t) => typeof t == 'string' && t.endsWith(e) && t.split(' ').length === 1,
        parse: parseFloat,
        transform: (t) => `${t}${e}`,
    }),
    Lt = mi('deg'),
    ft = mi('%'),
    M = mi('px'),
    P0 = mi('vh'),
    C0 = mi('vw'),
    Kc = { ...ft, parse: (e) => ft.parse(e) / 100, transform: (e) => ft.transform(e * 100) },
    T0 = {
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
    E0 = {
        rotate: Lt,
        rotateX: Lt,
        rotateY: Lt,
        rotateZ: Lt,
        scale: Ii,
        scaleX: Ii,
        scaleY: Ii,
        scaleZ: Ii,
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
        opacity: si,
        originX: Kc,
        originY: Kc,
        originZ: M,
    },
    Wc = { ...lr, transform: Math.round },
    cu = { ...T0, ...E0, zIndex: Wc, size: M, fillOpacity: si, strokeOpacity: si, numOctaves: Wc },
    L0 = { x: 'translateX', y: 'translateY', z: 'translateZ', transformPerspective: 'perspective' },
    R0 = ar.length;
function A0(e, t, n) {
    let r = '',
        i = !0;
    for (let s = 0; s < R0; s++) {
        const o = ar[s],
            a = e[o];
        if (a === void 0) continue;
        let l = !0;
        if (
            (typeof a == 'number'
                ? (l = a === (o.startsWith('scale') ? 1 : 0))
                : (l = parseFloat(a) === 0),
            !l || n)
        ) {
            const u = Gp(a, cu[o]);
            if (!l) {
                i = !1;
                const c = L0[o] || o;
                r += `${c}(${u}) `;
            }
            n && (t[o] = u);
        }
    }
    return ((r = r.trim()), n ? (r = n(t, i ? '' : r)) : i && (r = 'none'), r);
}
function fu(e, t, n) {
    const { style: r, vars: i, transformOrigin: s } = e;
    let o = !1,
        a = !1;
    for (const l in t) {
        const u = t[l];
        if (vn.has(l)) {
            o = !0;
            continue;
        } else if (bp(l)) {
            i[l] = u;
            continue;
        } else {
            const c = Gp(u, cu[l]);
            l.startsWith('origin') ? ((a = !0), (s[l] = c)) : (r[l] = c);
        }
    }
    if (
        (t.transform ||
            (o || n
                ? (r.transform = A0(t, e.transform, n))
                : r.transform && (r.transform = 'none')),
        a)
    ) {
        const { originX: l = '50%', originY: u = '50%', originZ: c = 0 } = s;
        r.transformOrigin = `${l} ${u} ${c}`;
    }
}
const N0 = { offset: 'stroke-dashoffset', array: 'stroke-dasharray' },
    D0 = { offset: 'strokeDashoffset', array: 'strokeDasharray' };
function O0(e, t, n = 1, r = 0, i = !0) {
    e.pathLength = 1;
    const s = i ? N0 : D0;
    e[s.offset] = M.transform(-r);
    const o = M.transform(t),
        a = M.transform(n);
    e[s.array] = `${o} ${a}`;
}
function bc(e, t, n) {
    return typeof e == 'string' ? e : M.transform(t + n * e);
}
function M0(e, t, n) {
    const r = bc(t, e.x, e.width),
        i = bc(n, e.y, e.height);
    return `${r} ${i}`;
}
function du(
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
    if ((fu(e, u, f), c)) {
        e.style.viewBox && (e.attrs.viewBox = e.style.viewBox);
        return;
    }
    ((e.attrs = e.style), (e.style = {}));
    const { attrs: d, style: m, dimensions: y } = e;
    (d.transform && (y && (m.transform = d.transform), delete d.transform),
        y &&
            (i !== void 0 || s !== void 0 || m.transform) &&
            (m.transformOrigin = M0(y, i !== void 0 ? i : 0.5, s !== void 0 ? s : 0.5)),
        t !== void 0 && (d.x = t),
        n !== void 0 && (d.y = n),
        r !== void 0 && (d.scale = r),
        o !== void 0 && O0(d, o, a, l, !1));
}
const hu = () => ({ style: {}, transform: {}, transformOrigin: {}, vars: {} }),
    Qp = () => ({ ...hu(), attrs: {} }),
    pu = (e) => typeof e == 'string' && e.toLowerCase() === 'svg';
function Yp(e, { style: t, vars: n }, r, i) {
    Object.assign(e.style, t, i && i.getProjectionStyles(r));
    for (const s in n) e.style.setProperty(s, n[s]);
}
const Xp = new Set([
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
function Zp(e, t, n, r) {
    Yp(e, t, void 0, r);
    for (const i in t.attrs) e.setAttribute(Xp.has(i) ? i : su(i), t.attrs[i]);
}
const Ls = {};
function V0(e) {
    Object.assign(Ls, e);
}
function Jp(e, { layout: t, layoutId: n }) {
    return (
        vn.has(e) || e.startsWith('origin') || ((t || n !== void 0) && (!!Ls[e] || e === 'opacity'))
    );
}
function mu(e, t, n) {
    var r;
    const { style: i } = e,
        s = {};
    for (const o in i)
        (we(i[o]) ||
            (t.style && we(t.style[o])) ||
            Jp(o, e) ||
            ((r = n == null ? void 0 : n.getValue(o)) === null || r === void 0
                ? void 0
                : r.liveStyle) !== void 0) &&
            (s[o] = i[o]);
    return s;
}
function qp(e, t, n) {
    const r = mu(e, t, n);
    for (const i in e)
        if (we(e[i]) || we(t[i])) {
            const s =
                ar.indexOf(i) !== -1 ? 'attr' + i.charAt(0).toUpperCase() + i.substring(1) : i;
            r[s] = e[i];
        }
    return r;
}
function _0(e, t) {
    try {
        t.dimensions = typeof e.getBBox == 'function' ? e.getBBox() : e.getBoundingClientRect();
    } catch {
        t.dimensions = { x: 0, y: 0, width: 0, height: 0 };
    }
}
const Gc = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r'],
    j0 = {
        useVisualState: Kp({
            scrapeMotionValuesFromProps: qp,
            createRenderState: Qp,
            onUpdate: ({ props: e, prevProps: t, current: n, renderState: r, latestValues: i }) => {
                if (!n) return;
                let s = !!e.drag;
                if (!s) {
                    for (const a in i)
                        if (vn.has(a)) {
                            s = !0;
                            break;
                        }
                }
                if (!s) return;
                let o = !t;
                if (t)
                    for (let a = 0; a < Gc.length; a++) {
                        const l = Gc[a];
                        e[l] !== t[l] && (o = !0);
                    }
                o &&
                    Q.read(() => {
                        (_0(n, r),
                            Q.render(() => {
                                (du(r, i, pu(n.tagName), e.transformTemplate), Zp(n, r));
                            }));
                    });
            },
        }),
    },
    F0 = { useVisualState: Kp({ scrapeMotionValuesFromProps: mu, createRenderState: hu }) };
function em(e, t, n) {
    for (const r in t) !we(t[r]) && !Jp(r, n) && (e[r] = t[r]);
}
function I0({ transformTemplate: e }, t) {
    return N.useMemo(() => {
        const n = hu();
        return (fu(n, t, e), Object.assign({}, n.vars, n.style));
    }, [t]);
}
function z0(e, t) {
    const n = e.style || {},
        r = {};
    return (em(r, n, e), Object.assign(r, I0(e, t)), r);
}
function B0(e, t) {
    const n = {},
        r = z0(e, t);
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
function U0(e, t, n, r) {
    const i = N.useMemo(() => {
        const s = Qp();
        return (du(s, t, pu(r), e.transformTemplate), { ...s.attrs, style: { ...s.style } });
    }, [t]);
    if (e.style) {
        const s = {};
        (em(s, e.style, e), (i.style = { ...s, ...i.style }));
    }
    return i;
}
function $0(e = !1) {
    return (n, r, i, { latestValues: s }, o) => {
        const l = (au(n) ? U0 : B0)(r, s, o, n),
            u = r0(r, typeof n == 'string', e),
            c = n !== N.Fragment ? { ...u, ...l, ref: i } : {},
            { children: f } = r,
            d = N.useMemo(() => (we(f) ? f.get() : f), [f]);
        return N.createElement(n, { ...c, children: d });
    };
}
function H0(e, t) {
    return function (r, { forwardMotionProps: i } = { forwardMotionProps: !1 }) {
        const o = {
            ...(au(r) ? j0 : F0),
            preloadedFeatures: e,
            useRender: $0(i),
            createVisualElement: t,
            Component: r,
        };
        return d0(o);
    };
}
function tm(e, t) {
    if (!Array.isArray(t)) return !1;
    const n = t.length;
    if (n !== e.length) return !1;
    for (let r = 0; r < n; r++) if (t[r] !== e[r]) return !1;
    return !0;
}
function to(e, t, n) {
    const r = e.getProps();
    return lu(r, t, n !== void 0 ? n : r.custom, e);
}
const K0 = nu(() => window.ScrollTimeline !== void 0);
class W0 {
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
            if (K0() && i.attachTimeline) return i.attachTimeline(t);
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
class b0 extends W0 {
    then(t, n) {
        return Promise.all(this.animations).then(t).catch(n);
    }
}
function gu(e, t) {
    return e ? e[t] || e.default || e : void 0;
}
const Ua = 2e4;
function nm(e) {
    let t = 0;
    const n = 50;
    let r = e.next(t);
    for (; !r.done && t < Ua; ) ((t += n), (r = e.next(t)));
    return t >= Ua ? 1 / 0 : t;
}
function yu(e) {
    return typeof e == 'function';
}
function Qc(e, t) {
    ((e.timeline = t), (e.onfinish = null));
}
const vu = (e) => Array.isArray(e) && typeof e[0] == 'number',
    G0 = { linearEasing: void 0 };
function Q0(e, t) {
    const n = nu(e);
    return () => {
        var r;
        return (r = G0[t]) !== null && r !== void 0 ? r : n();
    };
}
const Rs = Q0(() => {
        try {
            document.createElement('div').animate({ opacity: 0 }, { easing: 'linear(0, 1)' });
        } catch {
            return !1;
        }
        return !0;
    }, 'linearEasing'),
    rm = (e, t, n = 10) => {
        let r = '';
        const i = Math.max(Math.round(t / n), 2);
        for (let s = 0; s < i; s++) r += e(er(0, i - 1, s)) + ', ';
        return `linear(${r.substring(0, r.length - 2)})`;
    };
function im(e) {
    return !!(
        (typeof e == 'function' && Rs()) ||
        !e ||
        (typeof e == 'string' && (e in $a || Rs())) ||
        vu(e) ||
        (Array.isArray(e) && e.every(im))
    );
}
const Pr = ([e, t, n, r]) => `cubic-bezier(${e}, ${t}, ${n}, ${r})`,
    $a = {
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
function sm(e, t) {
    if (e)
        return typeof e == 'function' && Rs()
            ? rm(e, t)
            : vu(e)
              ? Pr(e)
              : Array.isArray(e)
                ? e.map((n) => sm(n, t) || $a.easeOut)
                : $a[e];
}
const Xe = { x: !1, y: !1 };
function om() {
    return Xe.x || Xe.y;
}
function Y0(e, t, n) {
    var r;
    if (e instanceof Element) return [e];
    if (typeof e == 'string') {
        let i = document;
        const s = (r = void 0) !== null && r !== void 0 ? r : i.querySelectorAll(e);
        return s ? Array.from(s) : [];
    }
    return Array.from(e);
}
function am(e, t) {
    const n = Y0(e),
        r = new AbortController(),
        i = { passive: !0, ...t, signal: r.signal };
    return [n, i, () => r.abort()];
}
function Yc(e) {
    return (t) => {
        t.pointerType === 'touch' || om() || e(t);
    };
}
function X0(e, t, n = {}) {
    const [r, i, s] = am(e, n),
        o = Yc((a) => {
            const { target: l } = a,
                u = t(a);
            if (typeof u != 'function' || !l) return;
            const c = Yc((f) => {
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
const lm = (e, t) => (t ? (e === t ? !0 : lm(e, t.parentElement)) : !1),
    xu = (e) =>
        e.pointerType === 'mouse'
            ? typeof e.button != 'number' || e.button <= 0
            : e.isPrimary !== !1,
    Z0 = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']);
function J0(e) {
    return Z0.has(e.tagName) || e.tabIndex !== -1;
}
const Cr = new WeakSet();
function Xc(e) {
    return (t) => {
        t.key === 'Enter' && e(t);
    };
}
function Oo(e, t) {
    e.dispatchEvent(new PointerEvent('pointer' + t, { isPrimary: !0, bubbles: !0 }));
}
const q0 = (e, t) => {
    const n = e.currentTarget;
    if (!n) return;
    const r = Xc(() => {
        if (Cr.has(n)) return;
        Oo(n, 'down');
        const i = Xc(() => {
                Oo(n, 'up');
            }),
            s = () => Oo(n, 'cancel');
        (n.addEventListener('keyup', i, t), n.addEventListener('blur', s, t));
    });
    (n.addEventListener('keydown', r, t),
        n.addEventListener('blur', () => n.removeEventListener('keydown', r), t));
};
function Zc(e) {
    return xu(e) && !om();
}
function ex(e, t, n = {}) {
    const [r, i, s] = am(e, n),
        o = (a) => {
            const l = a.currentTarget;
            if (!Zc(a) || Cr.has(l)) return;
            Cr.add(l);
            const u = t(a),
                c = (m, y) => {
                    (window.removeEventListener('pointerup', f),
                        window.removeEventListener('pointercancel', d),
                        !(!Zc(m) || !Cr.has(l)) &&
                            (Cr.delete(l), typeof u == 'function' && u(m, { success: y })));
                },
                f = (m) => {
                    c(m, n.useGlobalTarget || lm(l, m.target));
                },
                d = (m) => {
                    c(m, !1);
                };
            (window.addEventListener('pointerup', f, i),
                window.addEventListener('pointercancel', d, i));
        };
    return (
        r.forEach((a) => {
            (!J0(a) && a.getAttribute('tabindex') === null && (a.tabIndex = 0),
                (n.useGlobalTarget ? window : a).addEventListener('pointerdown', o, i),
                a.addEventListener('focus', (u) => q0(u, i), i));
        }),
        s
    );
}
function tx(e) {
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
const um = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', ...ar]);
let es;
function nx() {
    es = void 0;
}
const dt = {
    now: () => (
        es === void 0 &&
            dt.set(he.isProcessing || Zv.useManualTiming ? he.timestamp : performance.now()),
        es
    ),
    set: (e) => {
        ((es = e), queueMicrotask(nx));
    },
};
function wu(e, t) {
    e.indexOf(t) === -1 && e.push(t);
}
function Su(e, t) {
    const n = e.indexOf(t);
    n > -1 && e.splice(n, 1);
}
class ku {
    constructor() {
        this.subscriptions = [];
    }
    add(t) {
        return (wu(this.subscriptions, t), () => Su(this.subscriptions, t));
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
function cm(e, t) {
    return t ? e * (1e3 / t) : 0;
}
const Jc = 30,
    rx = (e) => !isNaN(parseFloat(e));
class ix {
    constructor(t, n = {}) {
        ((this.version = '11.18.2'),
            (this.canTrackVelocity = null),
            (this.events = {}),
            (this.updateAndNotify = (r, i = !0) => {
                const s = dt.now();
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
            (this.updatedAt = dt.now()),
            this.canTrackVelocity === null &&
                t !== void 0 &&
                (this.canTrackVelocity = rx(this.current)));
    }
    setPrevFrameValue(t = this.current) {
        ((this.prevFrameValue = t), (this.prevUpdatedAt = this.updatedAt));
    }
    onChange(t) {
        return this.on('change', t);
    }
    on(t, n) {
        this.events[t] || (this.events[t] = new ku());
        const r = this.events[t].add(n);
        return t === 'change'
            ? () => {
                  (r(),
                      Q.read(() => {
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
        const t = dt.now();
        if (!this.canTrackVelocity || this.prevFrameValue === void 0 || t - this.updatedAt > Jc)
            return 0;
        const n = Math.min(this.updatedAt - this.prevUpdatedAt, Jc);
        return cm(parseFloat(this.current) - parseFloat(this.prevFrameValue), n);
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
function oi(e, t) {
    return new ix(e, t);
}
function sx(e, t, n) {
    e.hasValue(t) ? e.getValue(t).set(n) : e.addValue(t, oi(n));
}
function ox(e, t) {
    const n = to(e, t);
    let { transitionEnd: r = {}, transition: i = {}, ...s } = n || {};
    s = { ...s, ...r };
    for (const o in s) {
        const a = v0(s[o]);
        sx(e, o, a);
    }
}
function ax(e) {
    return !!(we(e) && e.add);
}
function Ha(e, t) {
    const n = e.getValue('willChange');
    if (ax(n)) return n.add(t);
}
function fm(e) {
    return e.props[Up];
}
const dm = (e, t, n) => (((1 - 3 * n + 3 * t) * e + (3 * n - 6 * t)) * e + 3 * t) * e,
    lx = 1e-7,
    ux = 12;
function cx(e, t, n, r, i) {
    let s,
        o,
        a = 0;
    do ((o = t + (n - t) / 2), (s = dm(o, r, i) - e), s > 0 ? (n = o) : (t = o));
    while (Math.abs(s) > lx && ++a < ux);
    return o;
}
function gi(e, t, n, r) {
    if (e === t && n === r) return _e;
    const i = (s) => cx(s, 0, 1, e, n);
    return (s) => (s === 0 || s === 1 ? s : dm(i(s), t, r));
}
const hm = (e) => (t) => (t <= 0.5 ? e(2 * t) / 2 : (2 - e(2 * (1 - t))) / 2),
    pm = (e) => (t) => 1 - e(1 - t),
    mm = gi(0.33, 1.53, 0.69, 0.99),
    Pu = pm(mm),
    gm = hm(Pu),
    ym = (e) => ((e *= 2) < 1 ? 0.5 * Pu(e) : 0.5 * (2 - Math.pow(2, -10 * (e - 1)))),
    Cu = (e) => 1 - Math.sin(Math.acos(e)),
    vm = pm(Cu),
    xm = hm(Cu),
    wm = (e) => /^0[^.\s]+$/u.test(e);
function fx(e) {
    return typeof e == 'number' ? e === 0 : e !== null ? e === 'none' || e === '0' || wm(e) : !0;
}
const _r = (e) => Math.round(e * 1e5) / 1e5,
    Tu = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function dx(e) {
    return e == null;
}
const hx =
        /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu,
    Eu = (e, t) => (n) =>
        !!(
            (typeof n == 'string' && hx.test(n) && n.startsWith(e)) ||
            (t && !dx(n) && Object.prototype.hasOwnProperty.call(n, t))
        ),
    Sm = (e, t, n) => (r) => {
        if (typeof r != 'string') return r;
        const [i, s, o, a] = r.match(Tu);
        return {
            [e]: parseFloat(i),
            [t]: parseFloat(s),
            [n]: parseFloat(o),
            alpha: a !== void 0 ? parseFloat(a) : 1,
        };
    },
    px = (e) => Ct(0, 255, e),
    Mo = { ...lr, transform: (e) => Math.round(px(e)) },
    on = {
        test: Eu('rgb', 'red'),
        parse: Sm('red', 'green', 'blue'),
        transform: ({ red: e, green: t, blue: n, alpha: r = 1 }) =>
            'rgba(' +
            Mo.transform(e) +
            ', ' +
            Mo.transform(t) +
            ', ' +
            Mo.transform(n) +
            ', ' +
            _r(si.transform(r)) +
            ')',
    };
function mx(e) {
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
const Ka = { test: Eu('#'), parse: mx, transform: on.transform },
    Fn = {
        test: Eu('hsl', 'hue'),
        parse: Sm('hue', 'saturation', 'lightness'),
        transform: ({ hue: e, saturation: t, lightness: n, alpha: r = 1 }) =>
            'hsla(' +
            Math.round(e) +
            ', ' +
            ft.transform(_r(t)) +
            ', ' +
            ft.transform(_r(n)) +
            ', ' +
            _r(si.transform(r)) +
            ')',
    },
    ve = {
        test: (e) => on.test(e) || Ka.test(e) || Fn.test(e),
        parse: (e) => (on.test(e) ? on.parse(e) : Fn.test(e) ? Fn.parse(e) : Ka.parse(e)),
        transform: (e) =>
            typeof e == 'string' ? e : e.hasOwnProperty('red') ? on.transform(e) : Fn.transform(e),
    },
    gx =
        /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
function yx(e) {
    var t, n;
    return (
        isNaN(e) &&
        typeof e == 'string' &&
        (((t = e.match(Tu)) === null || t === void 0 ? void 0 : t.length) || 0) +
            (((n = e.match(gx)) === null || n === void 0 ? void 0 : n.length) || 0) >
            0
    );
}
const km = 'number',
    Pm = 'color',
    vx = 'var',
    xx = 'var(',
    qc = '${}',
    wx =
        /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function ai(e) {
    const t = e.toString(),
        n = [],
        r = { color: [], number: [], var: [] },
        i = [];
    let s = 0;
    const a = t
        .replace(
            wx,
            (l) => (
                ve.test(l)
                    ? (r.color.push(s), i.push(Pm), n.push(ve.parse(l)))
                    : l.startsWith(xx)
                      ? (r.var.push(s), i.push(vx), n.push(l))
                      : (r.number.push(s), i.push(km), n.push(parseFloat(l))),
                ++s,
                qc
            ),
        )
        .split(qc);
    return { values: n, split: a, indexes: r, types: i };
}
function Cm(e) {
    return ai(e).values;
}
function Tm(e) {
    const { split: t, types: n } = ai(e),
        r = t.length;
    return (i) => {
        let s = '';
        for (let o = 0; o < r; o++)
            if (((s += t[o]), i[o] !== void 0)) {
                const a = n[o];
                a === km ? (s += _r(i[o])) : a === Pm ? (s += ve.transform(i[o])) : (s += i[o]);
            }
        return s;
    };
}
const Sx = (e) => (typeof e == 'number' ? 0 : e);
function kx(e) {
    const t = Cm(e);
    return Tm(e)(t.map(Sx));
}
const Wt = { test: yx, parse: Cm, createTransformer: Tm, getAnimatableNone: kx },
    Px = new Set(['brightness', 'contrast', 'saturate', 'opacity']);
function Cx(e) {
    const [t, n] = e.slice(0, -1).split('(');
    if (t === 'drop-shadow') return e;
    const [r] = n.match(Tu) || [];
    if (!r) return e;
    const i = n.replace(r, '');
    let s = Px.has(t) ? 1 : 0;
    return (r !== n && (s *= 100), t + '(' + s + i + ')');
}
const Tx = /\b([a-z-]*)\(.*?\)/gu,
    Wa = {
        ...Wt,
        getAnimatableNone: (e) => {
            const t = e.match(Tx);
            return t ? t.map(Cx).join(' ') : e;
        },
    },
    Ex = {
        ...cu,
        color: ve,
        backgroundColor: ve,
        outlineColor: ve,
        fill: ve,
        stroke: ve,
        borderColor: ve,
        borderTopColor: ve,
        borderRightColor: ve,
        borderBottomColor: ve,
        borderLeftColor: ve,
        filter: Wa,
        WebkitFilter: Wa,
    },
    Lu = (e) => Ex[e];
function Em(e, t) {
    let n = Lu(e);
    return (n !== Wa && (n = Wt), n.getAnimatableNone ? n.getAnimatableNone(t) : void 0);
}
const Lx = new Set(['auto', 'none', '0']);
function Rx(e, t, n) {
    let r = 0,
        i;
    for (; r < e.length && !i; ) {
        const s = e[r];
        (typeof s == 'string' && !Lx.has(s) && ai(s).values.length && (i = e[r]), r++);
    }
    if (i && n) for (const s of t) e[s] = Em(n, i);
}
const ef = (e) => e === lr || e === M,
    tf = (e, t) => parseFloat(e.split(', ')[t]),
    nf =
        (e, t) =>
        (n, { transform: r }) => {
            if (r === 'none' || !r) return 0;
            const i = r.match(/^matrix3d\((.+)\)$/u);
            if (i) return tf(i[1], t);
            {
                const s = r.match(/^matrix\((.+)\)$/u);
                return s ? tf(s[1], e) : 0;
            }
        },
    Ax = new Set(['x', 'y', 'z']),
    Nx = ar.filter((e) => !Ax.has(e));
function Dx(e) {
    const t = [];
    return (
        Nx.forEach((n) => {
            const r = e.getValue(n);
            r !== void 0 && (t.push([n, r.get()]), r.set(n.startsWith('scale') ? 1 : 0));
        }),
        t
    );
}
const nr = {
    width: ({ x: e }, { paddingLeft: t = '0', paddingRight: n = '0' }) =>
        e.max - e.min - parseFloat(t) - parseFloat(n),
    height: ({ y: e }, { paddingTop: t = '0', paddingBottom: n = '0' }) =>
        e.max - e.min - parseFloat(t) - parseFloat(n),
    top: (e, { top: t }) => parseFloat(t),
    left: (e, { left: t }) => parseFloat(t),
    bottom: ({ y: e }, { top: t }) => parseFloat(t) + (e.max - e.min),
    right: ({ x: e }, { left: t }) => parseFloat(t) + (e.max - e.min),
    x: nf(4, 13),
    y: nf(5, 14),
};
nr.translateX = nr.x;
nr.translateY = nr.y;
const un = new Set();
let ba = !1,
    Ga = !1;
function Lm() {
    if (Ga) {
        const e = Array.from(un).filter((r) => r.needsMeasurement),
            t = new Set(e.map((r) => r.element)),
            n = new Map();
        (t.forEach((r) => {
            const i = Dx(r);
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
    ((Ga = !1), (ba = !1), un.forEach((e) => e.complete()), un.clear());
}
function Rm() {
    un.forEach((e) => {
        (e.readKeyframes(), e.needsMeasurement && (Ga = !0));
    });
}
function Ox() {
    (Rm(), Lm());
}
class Ru {
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
                ? (un.add(this), ba || ((ba = !0), Q.read(Rm), Q.resolveKeyframes(Lm)))
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
            un.delete(this));
    }
    cancel() {
        this.isComplete || ((this.isScheduled = !1), un.delete(this));
    }
    resume() {
        this.isComplete || this.scheduleResolve();
    }
}
const Am = (e) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(e),
    Mx = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function Vx(e) {
    const t = Mx.exec(e);
    if (!t) return [,];
    const [, n, r, i] = t;
    return [`--${n ?? r}`, i];
}
function Nm(e, t, n = 1) {
    const [r, i] = Vx(e);
    if (!r) return;
    const s = window.getComputedStyle(t).getPropertyValue(r);
    if (s) {
        const o = s.trim();
        return Am(o) ? parseFloat(o) : o;
    }
    return uu(i) ? Nm(i, t, n + 1) : i;
}
const Dm = (e) => (t) => t.test(e),
    _x = { test: (e) => e === 'auto', parse: (e) => e },
    Om = [lr, M, ft, Lt, C0, P0, _x],
    rf = (e) => Om.find(Dm(e));
class Mm extends Ru {
    constructor(t, n, r, i, s) {
        super(t, n, r, i, s, !0);
    }
    readKeyframes() {
        const { unresolvedKeyframes: t, element: n, name: r } = this;
        if (!n || !n.current) return;
        super.readKeyframes();
        for (let l = 0; l < t.length; l++) {
            let u = t[l];
            if (typeof u == 'string' && ((u = u.trim()), uu(u))) {
                const c = Nm(u, n.current);
                (c !== void 0 && (t[l] = c), l === t.length - 1 && (this.finalKeyframe = u));
            }
        }
        if ((this.resolveNoneKeyframes(), !um.has(r) || t.length !== 2)) return;
        const [i, s] = t,
            o = rf(i),
            a = rf(s);
        if (o !== a)
            if (ef(o) && ef(a))
                for (let l = 0; l < t.length; l++) {
                    const u = t[l];
                    typeof u == 'string' && (t[l] = parseFloat(u));
                }
            else this.needsMeasurement = !0;
    }
    resolveNoneKeyframes() {
        const { unresolvedKeyframes: t, name: n } = this,
            r = [];
        for (let i = 0; i < t.length; i++) fx(t[i]) && r.push(i);
        r.length && Rx(t, r, n);
    }
    measureInitialState() {
        const { element: t, unresolvedKeyframes: n, name: r } = this;
        if (!t || !t.current) return;
        (r === 'height' && (this.suspendedScrollY = window.pageYOffset),
            (this.measuredOrigin = nr[r](
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
        ((i[o] = nr[r](n.measureViewportBox(), window.getComputedStyle(n.current))),
            a !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = a),
            !((t = this.removedTransforms) === null || t === void 0) &&
                t.length &&
                this.removedTransforms.forEach(([l, u]) => {
                    n.getValue(l).set(u);
                }),
            this.resolveNoneKeyframes());
    }
}
const sf = (e, t) =>
    t === 'zIndex'
        ? !1
        : !!(
              typeof e == 'number' ||
              Array.isArray(e) ||
              (typeof e == 'string' && (Wt.test(e) || e === '0') && !e.startsWith('url('))
          );
function jx(e) {
    const t = e[0];
    if (e.length === 1) return !0;
    for (let n = 0; n < e.length; n++) if (e[n] !== t) return !0;
}
function Fx(e, t, n, r) {
    const i = e[0];
    if (i === null) return !1;
    if (t === 'display' || t === 'visibility') return !0;
    const s = e[e.length - 1],
        o = sf(i, t),
        a = sf(s, t);
    return !o || !a ? !1 : jx(e) || ((n === 'spring' || yu(n)) && r);
}
const Ix = (e) => e !== null;
function no(e, { repeat: t, repeatType: n = 'loop' }, r) {
    const i = e.filter(Ix),
        s = t && n !== 'loop' && t % 2 === 1 ? 0 : i.length - 1;
    return !s || r === void 0 ? i[s] : r;
}
const zx = 40;
class Vm {
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
            (this.createdAt = dt.now()),
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
            ? this.resolvedAt - this.createdAt > zx
                ? this.resolvedAt
                : this.createdAt
            : this.createdAt;
    }
    get resolved() {
        return (!this._resolved && !this.hasAttemptedResolve && Ox(), this._resolved);
    }
    onKeyframesResolved(t, n) {
        ((this.resolvedAt = dt.now()), (this.hasAttemptedResolve = !0));
        const {
            name: r,
            type: i,
            velocity: s,
            delay: o,
            onComplete: a,
            onUpdate: l,
            isGenerator: u,
        } = this.options;
        if (!u && !Fx(t, r, i, s))
            if (o) this.options.duration = 0;
            else {
                (l && l(no(t, this.options, n)), a && a(), this.resolveFinishedPromise());
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
function Vo(e, t, n) {
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
function Bx({ hue: e, saturation: t, lightness: n, alpha: r }) {
    ((e /= 360), (t /= 100), (n /= 100));
    let i = 0,
        s = 0,
        o = 0;
    if (!t) i = s = o = n;
    else {
        const a = n < 0.5 ? n * (1 + t) : n + t - n * t,
            l = 2 * n - a;
        ((i = Vo(l, a, e + 1 / 3)), (s = Vo(l, a, e)), (o = Vo(l, a, e - 1 / 3)));
    }
    return {
        red: Math.round(i * 255),
        green: Math.round(s * 255),
        blue: Math.round(o * 255),
        alpha: r,
    };
}
function As(e, t) {
    return (n) => (n > 0 ? t : e);
}
const _o = (e, t, n) => {
        const r = e * e,
            i = n * (t * t - r) + r;
        return i < 0 ? 0 : Math.sqrt(i);
    },
    Ux = [Ka, on, Fn],
    $x = (e) => Ux.find((t) => t.test(e));
function of(e) {
    const t = $x(e);
    if (!t) return !1;
    let n = t.parse(e);
    return (t === Fn && (n = Bx(n)), n);
}
const af = (e, t) => {
        const n = of(e),
            r = of(t);
        if (!n || !r) return As(e, t);
        const i = { ...n };
        return (s) => (
            (i.red = _o(n.red, r.red, s)),
            (i.green = _o(n.green, r.green, s)),
            (i.blue = _o(n.blue, r.blue, s)),
            (i.alpha = q(n.alpha, r.alpha, s)),
            on.transform(i)
        );
    },
    Hx = (e, t) => (n) => t(e(n)),
    yi = (...e) => e.reduce(Hx),
    Qa = new Set(['none', 'hidden']);
function Kx(e, t) {
    return Qa.has(e) ? (n) => (n <= 0 ? e : t) : (n) => (n >= 1 ? t : e);
}
function Wx(e, t) {
    return (n) => q(e, t, n);
}
function Au(e) {
    return typeof e == 'number'
        ? Wx
        : typeof e == 'string'
          ? uu(e)
              ? As
              : ve.test(e)
                ? af
                : Qx
          : Array.isArray(e)
            ? _m
            : typeof e == 'object'
              ? ve.test(e)
                  ? af
                  : bx
              : As;
}
function _m(e, t) {
    const n = [...e],
        r = n.length,
        i = e.map((s, o) => Au(s)(s, t[o]));
    return (s) => {
        for (let o = 0; o < r; o++) n[o] = i[o](s);
        return n;
    };
}
function bx(e, t) {
    const n = { ...e, ...t },
        r = {};
    for (const i in n) e[i] !== void 0 && t[i] !== void 0 && (r[i] = Au(e[i])(e[i], t[i]));
    return (i) => {
        for (const s in r) n[s] = r[s](i);
        return n;
    };
}
function Gx(e, t) {
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
const Qx = (e, t) => {
    const n = Wt.createTransformer(t),
        r = ai(e),
        i = ai(t);
    return r.indexes.var.length === i.indexes.var.length &&
        r.indexes.color.length === i.indexes.color.length &&
        r.indexes.number.length >= i.indexes.number.length
        ? (Qa.has(e) && !i.values.length) || (Qa.has(t) && !r.values.length)
            ? Kx(e, t)
            : yi(_m(Gx(r, i), i.values), n)
        : As(e, t);
};
function jm(e, t, n) {
    return typeof e == 'number' && typeof t == 'number' && typeof n == 'number'
        ? q(e, t, n)
        : Au(e)(e, t);
}
const Yx = 5;
function Fm(e, t, n) {
    const r = Math.max(t - Yx, 0);
    return cm(n - e(r), t - r);
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
    jo = 0.001;
function Xx({
    duration: e = ne.duration,
    bounce: t = ne.bounce,
    velocity: n = ne.velocity,
    mass: r = ne.mass,
}) {
    let i,
        s,
        o = 1 - t;
    ((o = Ct(ne.minDamping, ne.maxDamping, o)),
        (e = Ct(ne.minDuration, ne.maxDuration, xt(e))),
        o < 1
            ? ((i = (u) => {
                  const c = u * o,
                      f = c * e,
                      d = c - n,
                      m = Ya(u, o),
                      y = Math.exp(-f);
                  return jo - (d / m) * y;
              }),
              (s = (u) => {
                  const f = u * o * e,
                      d = f * n + n,
                      m = Math.pow(o, 2) * Math.pow(u, 2) * e,
                      y = Math.exp(-f),
                      v = Ya(Math.pow(u, 2), o);
                  return ((-i(u) + jo > 0 ? -1 : 1) * ((d - m) * y)) / v;
              }))
            : ((i = (u) => {
                  const c = Math.exp(-u * e),
                      f = (u - n) * e + 1;
                  return -jo + c * f;
              }),
              (s = (u) => {
                  const c = Math.exp(-u * e),
                      f = (n - u) * (e * e);
                  return c * f;
              })));
    const a = 5 / e,
        l = Jx(i, s, a);
    if (((e = vt(e)), isNaN(l)))
        return { stiffness: ne.stiffness, damping: ne.damping, duration: e };
    {
        const u = Math.pow(l, 2) * r;
        return { stiffness: u, damping: o * 2 * Math.sqrt(r * u), duration: e };
    }
}
const Zx = 12;
function Jx(e, t, n) {
    let r = n;
    for (let i = 1; i < Zx; i++) r = r - e(r) / t(r);
    return r;
}
function Ya(e, t) {
    return e * Math.sqrt(1 - t * t);
}
const qx = ['duration', 'bounce'],
    e1 = ['stiffness', 'damping', 'mass'];
function lf(e, t) {
    return t.some((n) => e[n] !== void 0);
}
function t1(e) {
    let t = {
        velocity: ne.velocity,
        stiffness: ne.stiffness,
        damping: ne.damping,
        mass: ne.mass,
        isResolvedFromDuration: !1,
        ...e,
    };
    if (!lf(e, e1) && lf(e, qx))
        if (e.visualDuration) {
            const n = e.visualDuration,
                r = (2 * Math.PI) / (n * 1.2),
                i = r * r,
                s = 2 * Ct(0.05, 1, 1 - (e.bounce || 0)) * Math.sqrt(i);
            t = { ...t, mass: ne.mass, stiffness: i, damping: s };
        } else {
            const n = Xx(e);
            ((t = { ...t, ...n, mass: ne.mass }), (t.isResolvedFromDuration = !0));
        }
    return t;
}
function Im(e = ne.visualDuration, t = ne.bounce) {
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
        } = t1({ ...n, velocity: -xt(n.velocity || 0) }),
        y = d || 0,
        v = u / (2 * Math.sqrt(l * c)),
        S = o - s,
        p = xt(Math.sqrt(l / c)),
        h = Math.abs(S) < 5;
    (r || (r = h ? ne.restSpeed.granular : ne.restSpeed.default),
        i || (i = h ? ne.restDelta.granular : ne.restDelta.default));
    let g;
    if (v < 1) {
        const w = Ya(p, v);
        g = (P) => {
            const T = Math.exp(-v * p * P);
            return o - T * (((y + v * p * S) / w) * Math.sin(w * P) + S * Math.cos(w * P));
        };
    } else if (v === 1) g = (w) => o - Math.exp(-p * w) * (S + (y + p * S) * w);
    else {
        const w = p * Math.sqrt(v * v - 1);
        g = (P) => {
            const T = Math.exp(-v * p * P),
                k = Math.min(w * P, 300);
            return o - (T * ((y + v * p * S) * Math.sinh(k) + w * S * Math.cosh(k))) / w;
        };
    }
    const x = {
        calculatedDuration: (m && f) || null,
        next: (w) => {
            const P = g(w);
            if (m) a.done = w >= f;
            else {
                let T = 0;
                v < 1 && (T = w === 0 ? vt(y) : Fm(g, w, P));
                const k = Math.abs(T) <= r,
                    D = Math.abs(o - P) <= i;
                a.done = k && D;
            }
            return ((a.value = a.done ? o : P), a);
        },
        toString: () => {
            const w = Math.min(nm(x), Ua),
                P = rm((T) => x.next(w * T).value, w, 30);
            return w + 'ms ' + P;
        },
    };
    return x;
}
function uf({
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
                L = g(k);
            ((d.done = Math.abs(D) <= u), (d.value = d.done ? p : L));
        };
    let w, P;
    const T = (k) => {
        m(d.value) &&
            ((w = k),
            (P = Im({
                keyframes: [d.value, y(d.value)],
                velocity: Fm(g, k, d.value),
                damping: i,
                stiffness: s,
                restDelta: u,
                restSpeed: c,
            })));
    };
    return (
        T(0),
        {
            calculatedDuration: null,
            next: (k) => {
                let D = !1;
                return (
                    !P && w === void 0 && ((D = !0), x(k), T(k)),
                    w !== void 0 && k >= w ? P.next(k - w) : (!D && x(k), d)
                );
            },
        }
    );
}
const n1 = gi(0.42, 0, 1, 1),
    r1 = gi(0, 0, 0.58, 1),
    zm = gi(0.42, 0, 0.58, 1),
    i1 = (e) => Array.isArray(e) && typeof e[0] != 'number',
    s1 = {
        linear: _e,
        easeIn: n1,
        easeInOut: zm,
        easeOut: r1,
        circIn: Cu,
        circInOut: xm,
        circOut: vm,
        backIn: Pu,
        backInOut: gm,
        backOut: mm,
        anticipate: ym,
    },
    cf = (e) => {
        if (vu(e)) {
            jp(e.length === 4);
            const [t, n, r, i] = e;
            return gi(t, n, r, i);
        } else if (typeof e == 'string') return s1[e];
        return e;
    };
function o1(e, t, n) {
    const r = [],
        i = n || jm,
        s = e.length - 1;
    for (let o = 0; o < s; o++) {
        let a = i(e[o], e[o + 1]);
        if (t) {
            const l = Array.isArray(t) ? t[o] || _e : t;
            a = yi(l, a);
        }
        r.push(a);
    }
    return r;
}
function a1(e, t, { clamp: n = !0, ease: r, mixer: i } = {}) {
    const s = e.length;
    if ((jp(s === t.length), s === 1)) return () => t[0];
    if (s === 2 && t[0] === t[1]) return () => t[1];
    const o = e[0] === e[1];
    e[0] > e[s - 1] && ((e = [...e].reverse()), (t = [...t].reverse()));
    const a = o1(t, r, i),
        l = a.length,
        u = (c) => {
            if (o && c < e[0]) return t[0];
            let f = 0;
            if (l > 1) for (; f < e.length - 2 && !(c < e[f + 1]); f++);
            const d = er(e[f], e[f + 1], c);
            return a[f](d);
        };
    return n ? (c) => u(Ct(e[0], e[s - 1], c)) : u;
}
function l1(e, t) {
    const n = e[e.length - 1];
    for (let r = 1; r <= t; r++) {
        const i = er(0, t, r);
        e.push(q(n, 1, i));
    }
}
function u1(e) {
    const t = [0];
    return (l1(t, e.length - 1), t);
}
function c1(e, t) {
    return e.map((n) => n * t);
}
function f1(e, t) {
    return e.map(() => t || zm).splice(0, e.length - 1);
}
function Ns({ duration: e = 300, keyframes: t, times: n, ease: r = 'easeInOut' }) {
    const i = i1(r) ? r.map(cf) : cf(r),
        s = { done: !1, value: t[0] },
        o = c1(n && n.length === t.length ? n : u1(t), e),
        a = a1(o, t, { ease: Array.isArray(i) ? i : f1(t, i) });
    return { calculatedDuration: e, next: (l) => ((s.value = a(l)), (s.done = l >= e), s) };
}
const d1 = (e) => {
        const t = ({ timestamp: n }) => e(n);
        return {
            start: () => Q.update(t, !0),
            stop: () => Kt(t),
            now: () => (he.isProcessing ? he.timestamp : dt.now()),
        };
    },
    h1 = { decay: uf, inertia: uf, tween: Ns, keyframes: Ns, spring: Im },
    p1 = (e) => e / 100;
class Nu extends Vm {
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
            o = (i == null ? void 0 : i.KeyframeResolver) || Ru,
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
            a = yu(n) ? n : h1[n] || Ns;
        let l, u;
        a !== Ns && typeof t[0] != 'number' && ((l = yi(p1, jm(t[0], t[1]))), (t = [0, 100]));
        const c = a({ ...this.options, keyframes: t });
        (s === 'mirror' && (u = a({ ...this.options, keyframes: [...t].reverse(), velocity: -o })),
            c.calculatedDuration === null && (c.calculatedDuration = nm(c)));
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
                L = k % 1;
            (!L && k >= 1 && (L = 1),
                L === 1 && D--,
                (D = Math.min(D, m + 1)),
                !!(D % 2) &&
                    (y === 'reverse'
                        ? ((L = 1 - L), v && (L -= v / f))
                        : y === 'mirror' && (x = o)),
                (g = Ct(0, 1, L) * f));
        }
        const w = h ? { done: !1, value: l[0] } : x.next(g);
        a && (w.value = a(w.value));
        let { done: P } = w;
        !h && u !== null && (P = this.speed >= 0 ? this.currentTime >= c : this.currentTime <= 0);
        const T =
            this.holdTime === null &&
            (this.state === 'finished' || (this.state === 'running' && P));
        return (
            T && i !== void 0 && (w.value = no(l, this.options, i)),
            S && S(w.value),
            T && this.finish(),
            w
        );
    }
    get duration() {
        const { resolved: t } = this;
        return t ? xt(t.calculatedDuration) : 0;
    }
    get time() {
        return xt(this.currentTime);
    }
    set time(t) {
        ((t = vt(t)),
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
        ((this.playbackSpeed = t), n && (this.time = xt(this.currentTime)));
    }
    play() {
        if ((this.resolver.isScheduled || this.resolver.resume(), !this._resolved)) {
            this.pendingPlayState = 'running';
            return;
        }
        if (this.isStopped) return;
        const { driver: t = d1, onPlay: n, startTime: r } = this.options;
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
const m1 = new Set(['opacity', 'clipPath', 'filter', 'transform']);
function g1(
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
    const c = sm(a, i);
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
const y1 = nu(() => Object.hasOwnProperty.call(Element.prototype, 'animate')),
    Ds = 10,
    v1 = 2e4;
function x1(e) {
    return yu(e.type) || e.type === 'spring' || !im(e.ease);
}
function w1(e, t) {
    const n = new Nu({ ...t, keyframes: e, repeat: 0, delay: 0, isGenerator: !0 });
    let r = { done: !1, value: e[0] };
    const i = [];
    let s = 0;
    for (; !r.done && s < v1; ) ((r = n.sample(s)), i.push(r.value), (s += Ds));
    return { times: void 0, keyframes: i, duration: s - Ds, ease: 'linear' };
}
const Bm = { anticipate: ym, backInOut: gm, circInOut: xm };
function S1(e) {
    return e in Bm;
}
class ff extends Vm {
    constructor(t) {
        super(t);
        const { name: n, motionValue: r, element: i, keyframes: s } = this.options;
        ((this.resolver = new Mm(s, (o, a) => this.onKeyframesResolved(o, a), n, r, i)),
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
        if ((typeof s == 'string' && Rs() && S1(s) && (s = Bm[s]), x1(this.options))) {
            const { onComplete: f, onUpdate: d, motionValue: m, element: y, ...v } = this.options,
                S = w1(t, v);
            ((t = S.keyframes),
                t.length === 1 && (t[1] = t[0]),
                (r = S.duration),
                (i = S.times),
                (s = S.ease),
                (o = 'keyframes'));
        }
        const c = g1(a.owner.current, l, t, { ...this.options, duration: r, times: i, ease: s });
        return (
            (c.startTime = u ?? this.calcStartTime()),
            this.pendingTimeline
                ? (Qc(c, this.pendingTimeline), (this.pendingTimeline = void 0))
                : (c.onfinish = () => {
                      const { onComplete: f } = this.options;
                      (a.set(no(t, this.options, n)),
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
        return xt(n);
    }
    get time() {
        const { resolved: t } = this;
        if (!t) return 0;
        const { animation: n } = t;
        return xt(n.currentTime || 0);
    }
    set time(t) {
        const { resolved: n } = this;
        if (!n) return;
        const { animation: r } = n;
        r.currentTime = vt(t);
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
            Qc(r, t);
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
            const { motionValue: u, onUpdate: c, onComplete: f, element: d, ...m } = this.options,
                y = new Nu({
                    ...m,
                    keyframes: r,
                    duration: i,
                    type: s,
                    ease: o,
                    times: a,
                    isGenerator: !0,
                }),
                v = vt(this.time);
            u.setWithVelocity(y.sample(v - Ds).value, y.sample(v).value, Ds);
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
            y1() && r && m1.has(r) && !l && !u && !i && s !== 'mirror' && o !== 0 && a !== 'inertia'
        );
    }
}
const k1 = { type: 'spring', stiffness: 500, damping: 25, restSpeed: 10 },
    P1 = (e) => ({
        type: 'spring',
        stiffness: 550,
        damping: e === 0 ? 2 * Math.sqrt(550) : 30,
        restSpeed: 10,
    }),
    C1 = { type: 'keyframes', duration: 0.8 },
    T1 = { type: 'keyframes', ease: [0.25, 0.1, 0.35, 1], duration: 0.3 },
    E1 = (e, { keyframes: t }) =>
        t.length > 2 ? C1 : vn.has(e) ? (e.startsWith('scale') ? P1(t[1]) : k1) : T1;
function L1({
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
const Du =
    (e, t, n, r = {}, i, s) =>
    (o) => {
        const a = gu(r, e) || {},
            l = a.delay || r.delay || 0;
        let { elapsed: u = 0 } = r;
        u = u - vt(l);
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
        (L1(a) || (c = { ...c, ...E1(e, c) }),
            c.duration && (c.duration = vt(c.duration)),
            c.repeatDelay && (c.repeatDelay = vt(c.repeatDelay)),
            c.from !== void 0 && (c.keyframes[0] = c.from));
        let f = !1;
        if (
            ((c.type === !1 || (c.duration === 0 && !c.repeatDelay)) &&
                ((c.duration = 0), c.delay === 0 && (f = !0)),
            f && !s && t.get() !== void 0)
        ) {
            const d = no(c.keyframes, a);
            if (d !== void 0)
                return (
                    Q.update(() => {
                        (c.onUpdate(d), c.onComplete());
                    }),
                    new b0([])
                );
        }
        return !s && ff.supports(c) ? new ff(c) : new Nu(c);
    };
function R1({ protectedKeys: e, needsAnimating: t }, n) {
    const r = e.hasOwnProperty(n) && t[n] !== !0;
    return ((t[n] = !1), r);
}
function Um(e, t, { delay: n = 0, transitionOverride: r, type: i } = {}) {
    var s;
    let { transition: o = e.getDefaultTransition(), transitionEnd: a, ...l } = t;
    r && (o = r);
    const u = [],
        c = i && e.animationState && e.animationState.getState()[i];
    for (const f in l) {
        const d = e.getValue(f, (s = e.latestValues[f]) !== null && s !== void 0 ? s : null),
            m = l[f];
        if (m === void 0 || (c && R1(c, f))) continue;
        const y = { delay: n, ...gu(o || {}, f) };
        let v = !1;
        if (window.MotionHandoffAnimation) {
            const p = fm(e);
            if (p) {
                const h = window.MotionHandoffAnimation(p, f, Q);
                h !== null && ((y.startTime = h), (v = !0));
            }
        }
        (Ha(e, f),
            d.start(Du(f, d, m, e.shouldReduceMotion && um.has(f) ? { type: !1 } : y, e, v)));
        const S = d.animation;
        S && u.push(S);
    }
    return (
        a &&
            Promise.all(u).then(() => {
                Q.update(() => {
                    a && ox(e, a);
                });
            }),
        u
    );
}
function Xa(e, t, n = {}) {
    var r;
    const i = to(
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
    const o = i ? () => Promise.all(Um(e, i, n)) : () => Promise.resolve(),
        a =
            e.variantChildren && e.variantChildren.size
                ? (u = 0) => {
                      const { delayChildren: c = 0, staggerChildren: f, staggerDirection: d } = s;
                      return A1(e, t, c + u, f, d, n);
                  }
                : () => Promise.resolve(),
        { when: l } = s;
    if (l) {
        const [u, c] = l === 'beforeChildren' ? [o, a] : [a, o];
        return u().then(() => c());
    } else return Promise.all([o(), a(n.delay)]);
}
function A1(e, t, n = 0, r = 0, i = 1, s) {
    const o = [],
        a = (e.variantChildren.size - 1) * r,
        l = i === 1 ? (u = 0) => u * r : (u = 0) => a - u * r;
    return (
        Array.from(e.variantChildren)
            .sort(N1)
            .forEach((u, c) => {
                (u.notify('AnimationStart', t),
                    o.push(
                        Xa(u, t, { ...s, delay: n + l(c) }).then(() =>
                            u.notify('AnimationComplete', t),
                        ),
                    ));
            }),
        Promise.all(o)
    );
}
function N1(e, t) {
    return e.sortNodePosition(t);
}
function D1(e, t, n = {}) {
    e.notify('AnimationStart', t);
    let r;
    if (Array.isArray(t)) {
        const i = t.map((s) => Xa(e, s, n));
        r = Promise.all(i);
    } else if (typeof t == 'string') r = Xa(e, t, n);
    else {
        const i = typeof t == 'function' ? to(e, t, n.custom) : t;
        r = Promise.all(Um(e, i, n));
    }
    return r.then(() => {
        e.notify('AnimationComplete', t);
    });
}
const O1 = iu.length;
function $m(e) {
    if (!e) return;
    if (!e.isControllingVariants) {
        const n = e.parent ? $m(e.parent) || {} : {};
        return (e.props.initial !== void 0 && (n.initial = e.props.initial), n);
    }
    const t = {};
    for (let n = 0; n < O1; n++) {
        const r = iu[n],
            i = e.props[r];
        (ii(i) || i === !1) && (t[r] = i);
    }
    return t;
}
const M1 = [...ru].reverse(),
    V1 = ru.length;
function _1(e) {
    return (t) => Promise.all(t.map(({ animation: n, options: r }) => D1(e, n, r)));
}
function j1(e) {
    let t = _1(e),
        n = df(),
        r = !0;
    const i = (l) => (u, c) => {
        var f;
        const d = to(
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
            c = $m(e.parent) || {},
            f = [],
            d = new Set();
        let m = {},
            y = 1 / 0;
        for (let S = 0; S < V1; S++) {
            const p = M1[S],
                h = n[p],
                g = u[p] !== void 0 ? u[p] : c[p],
                x = ii(g),
                w = p === l ? h.isActive : null;
            w === !1 && (y = S);
            let P = g === c[p] && g !== u[p] && x;
            if (
                (P && r && e.manuallyAnimateOnMount && (P = !1),
                (h.protectedKeys = { ...m }),
                (!h.isActive && w === null) ||
                    (!g && !h.prevProp) ||
                    qs(g) ||
                    typeof g == 'boolean')
            )
                continue;
            const T = F1(h.prevProp, g);
            let k = T || (p === l && h.isActive && !P && x) || (S > y && x),
                D = !1;
            const L = Array.isArray(g) ? g : [g];
            let X = L.reduce(i(p), {});
            w === !1 && (X = {});
            const { prevResolvedValues: z = {} } = h,
                j = { ...z, ...X },
                F = ($) => {
                    ((k = !0), d.has($) && ((D = !0), d.delete($)), (h.needsAnimating[$] = !0));
                    const E = e.getValue($);
                    E && (E.liveStyle = !1);
                };
            for (const $ in j) {
                const E = X[$],
                    O = z[$];
                if (m.hasOwnProperty($)) continue;
                let _ = !1;
                (Ba(E) && Ba(O) ? (_ = !tm(E, O)) : (_ = E !== O),
                    _
                        ? E != null
                            ? F($)
                            : d.add($)
                        : E !== void 0 && d.has($)
                          ? F($)
                          : (h.protectedKeys[$] = !0));
            }
            ((h.prevProp = g),
                (h.prevResolvedValues = X),
                h.isActive && (m = { ...m, ...X }),
                r && e.blockInitialAnimation && (k = !1),
                k &&
                    (!(P && T) || D) &&
                    f.push(...L.map(($) => ({ animation: $, options: { type: p } }))));
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
            ((n = df()), (r = !0));
        },
    };
}
function F1(e, t) {
    return typeof t == 'string' ? t !== e : Array.isArray(t) ? !tm(t, e) : !1;
}
function Zt(e = !1) {
    return { isActive: e, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
}
function df() {
    return {
        animate: Zt(!0),
        whileInView: Zt(),
        whileHover: Zt(),
        whileTap: Zt(),
        whileDrag: Zt(),
        whileFocus: Zt(),
        exit: Zt(),
    };
}
class Yt {
    constructor(t) {
        ((this.isMounted = !1), (this.node = t));
    }
    update() {}
}
class I1 extends Yt {
    constructor(t) {
        (super(t), t.animationState || (t.animationState = j1(t)));
    }
    updateAnimationControlsSubscription() {
        const { animate: t } = this.node.getProps();
        qs(t) && (this.unmountControls = t.subscribe(this.node));
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
let z1 = 0;
class B1 extends Yt {
    constructor() {
        (super(...arguments), (this.id = z1++));
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
const U1 = { animation: { Feature: I1 }, exit: { Feature: B1 } };
function li(e, t, n, r = { passive: !0 }) {
    return (e.addEventListener(t, n, r), () => e.removeEventListener(t, n));
}
function vi(e) {
    return { point: { x: e.pageX, y: e.pageY } };
}
const $1 = (e) => (t) => xu(t) && e(t, vi(t));
function jr(e, t, n, r) {
    return li(e, t, $1(n), r);
}
const hf = (e, t) => Math.abs(e - t);
function H1(e, t) {
    const n = hf(e.x, t.x),
        r = hf(e.y, t.y);
    return Math.sqrt(n ** 2 + r ** 2);
}
class Hm {
    constructor(t, n, { transformPagePoint: r, contextWindow: i, dragSnapToOrigin: s = !1 } = {}) {
        if (
            ((this.startEvent = null),
            (this.lastMoveEvent = null),
            (this.lastMoveEventInfo = null),
            (this.handlers = {}),
            (this.contextWindow = window),
            (this.updatePoint = () => {
                if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return;
                const f = Io(this.lastMoveEventInfo, this.history),
                    d = this.startEvent !== null,
                    m = H1(f.offset, { x: 0, y: 0 }) >= 3;
                if (!d && !m) return;
                const { point: y } = f,
                    { timestamp: v } = he;
                this.history.push({ ...y, timestamp: v });
                const { onStart: S, onMove: p } = this.handlers;
                (d || (S && S(this.lastMoveEvent, f), (this.startEvent = this.lastMoveEvent)),
                    p && p(this.lastMoveEvent, f));
            }),
            (this.handlePointerMove = (f, d) => {
                ((this.lastMoveEvent = f),
                    (this.lastMoveEventInfo = Fo(d, this.transformPagePoint)),
                    Q.update(this.updatePoint, !0));
            }),
            (this.handlePointerUp = (f, d) => {
                this.end();
                const { onEnd: m, onSessionEnd: y, resumeAnimation: v } = this.handlers;
                if (
                    (this.dragSnapToOrigin && v && v(),
                    !(this.lastMoveEvent && this.lastMoveEventInfo))
                )
                    return;
                const S = Io(
                    f.type === 'pointercancel'
                        ? this.lastMoveEventInfo
                        : Fo(d, this.transformPagePoint),
                    this.history,
                );
                (this.startEvent && m && m(f, S), y && y(f, S));
            }),
            !xu(t))
        )
            return;
        ((this.dragSnapToOrigin = s),
            (this.handlers = n),
            (this.transformPagePoint = r),
            (this.contextWindow = i || window));
        const o = vi(t),
            a = Fo(o, this.transformPagePoint),
            { point: l } = a,
            { timestamp: u } = he;
        this.history = [{ ...l, timestamp: u }];
        const { onSessionStart: c } = n;
        (c && c(t, Io(a, this.history)),
            (this.removeListeners = yi(
                jr(this.contextWindow, 'pointermove', this.handlePointerMove),
                jr(this.contextWindow, 'pointerup', this.handlePointerUp),
                jr(this.contextWindow, 'pointercancel', this.handlePointerUp),
            )));
    }
    updateHandlers(t) {
        this.handlers = t;
    }
    end() {
        (this.removeListeners && this.removeListeners(), Kt(this.updatePoint));
    }
}
function Fo(e, t) {
    return t ? { point: t(e.point) } : e;
}
function pf(e, t) {
    return { x: e.x - t.x, y: e.y - t.y };
}
function Io({ point: e }, t) {
    return { point: e, delta: pf(e, Km(t)), offset: pf(e, K1(t)), velocity: W1(t, 0.1) };
}
function K1(e) {
    return e[0];
}
function Km(e) {
    return e[e.length - 1];
}
function W1(e, t) {
    if (e.length < 2) return { x: 0, y: 0 };
    let n = e.length - 1,
        r = null;
    const i = Km(e);
    for (; n >= 0 && ((r = e[n]), !(i.timestamp - r.timestamp > vt(t))); ) n--;
    if (!r) return { x: 0, y: 0 };
    const s = xt(i.timestamp - r.timestamp);
    if (s === 0) return { x: 0, y: 0 };
    const o = { x: (i.x - r.x) / s, y: (i.y - r.y) / s };
    return (o.x === 1 / 0 && (o.x = 0), o.y === 1 / 0 && (o.y = 0), o);
}
const Wm = 1e-4,
    b1 = 1 - Wm,
    G1 = 1 + Wm,
    bm = 0.01,
    Q1 = 0 - bm,
    Y1 = 0 + bm;
function Fe(e) {
    return e.max - e.min;
}
function X1(e, t, n) {
    return Math.abs(e - t) <= n;
}
function mf(e, t, n, r = 0.5) {
    ((e.origin = r),
        (e.originPoint = q(t.min, t.max, e.origin)),
        (e.scale = Fe(n) / Fe(t)),
        (e.translate = q(n.min, n.max, e.origin) - e.originPoint),
        ((e.scale >= b1 && e.scale <= G1) || isNaN(e.scale)) && (e.scale = 1),
        ((e.translate >= Q1 && e.translate <= Y1) || isNaN(e.translate)) && (e.translate = 0));
}
function Fr(e, t, n, r) {
    (mf(e.x, t.x, n.x, r ? r.originX : void 0), mf(e.y, t.y, n.y, r ? r.originY : void 0));
}
function gf(e, t, n) {
    ((e.min = n.min + t.min), (e.max = e.min + Fe(t)));
}
function Z1(e, t, n) {
    (gf(e.x, t.x, n.x), gf(e.y, t.y, n.y));
}
function yf(e, t, n) {
    ((e.min = t.min - n.min), (e.max = e.min + Fe(t)));
}
function Ir(e, t, n) {
    (yf(e.x, t.x, n.x), yf(e.y, t.y, n.y));
}
function J1(e, { min: t, max: n }, r) {
    return (
        t !== void 0 && e < t
            ? (e = r ? q(t, e, r.min) : Math.max(e, t))
            : n !== void 0 && e > n && (e = r ? q(n, e, r.max) : Math.min(e, n)),
        e
    );
}
function vf(e, t, n) {
    return {
        min: t !== void 0 ? e.min + t : void 0,
        max: n !== void 0 ? e.max + n - (e.max - e.min) : void 0,
    };
}
function q1(e, { top: t, left: n, bottom: r, right: i }) {
    return { x: vf(e.x, n, i), y: vf(e.y, t, r) };
}
function xf(e, t) {
    let n = t.min - e.min,
        r = t.max - e.max;
    return (t.max - t.min < e.max - e.min && ([n, r] = [r, n]), { min: n, max: r });
}
function ew(e, t) {
    return { x: xf(e.x, t.x), y: xf(e.y, t.y) };
}
function tw(e, t) {
    let n = 0.5;
    const r = Fe(e),
        i = Fe(t);
    return (
        i > r ? (n = er(t.min, t.max - r, e.min)) : r > i && (n = er(e.min, e.max - i, t.min)),
        Ct(0, 1, n)
    );
}
function nw(e, t) {
    const n = {};
    return (
        t.min !== void 0 && (n.min = t.min - e.min),
        t.max !== void 0 && (n.max = t.max - e.min),
        n
    );
}
const Za = 0.35;
function rw(e = Za) {
    return (
        e === !1 ? (e = 0) : e === !0 && (e = Za),
        { x: wf(e, 'left', 'right'), y: wf(e, 'top', 'bottom') }
    );
}
function wf(e, t, n) {
    return { min: Sf(e, t), max: Sf(e, n) };
}
function Sf(e, t) {
    return typeof e == 'number' ? e : e[t] || 0;
}
const kf = () => ({ translate: 0, scale: 1, origin: 0, originPoint: 0 }),
    In = () => ({ x: kf(), y: kf() }),
    Pf = () => ({ min: 0, max: 0 }),
    ie = () => ({ x: Pf(), y: Pf() });
function Ue(e) {
    return [e('x'), e('y')];
}
function Gm({ top: e, left: t, right: n, bottom: r }) {
    return { x: { min: t, max: n }, y: { min: e, max: r } };
}
function iw({ x: e, y: t }) {
    return { top: t.min, right: e.max, bottom: t.max, left: e.min };
}
function sw(e, t) {
    if (!t) return e;
    const n = t({ x: e.left, y: e.top }),
        r = t({ x: e.right, y: e.bottom });
    return { top: n.y, left: n.x, bottom: r.y, right: r.x };
}
function zo(e) {
    return e === void 0 || e === 1;
}
function Ja({ scale: e, scaleX: t, scaleY: n }) {
    return !zo(e) || !zo(t) || !zo(n);
}
function en(e) {
    return Ja(e) || Qm(e) || e.z || e.rotate || e.rotateX || e.rotateY || e.skewX || e.skewY;
}
function Qm(e) {
    return Cf(e.x) || Cf(e.y);
}
function Cf(e) {
    return e && e !== '0%';
}
function Os(e, t, n) {
    const r = e - n,
        i = t * r;
    return n + i;
}
function Tf(e, t, n, r, i) {
    return (i !== void 0 && (e = Os(e, i, r)), Os(e, n, r) + t);
}
function qa(e, t = 0, n = 1, r, i) {
    ((e.min = Tf(e.min, t, n, r, i)), (e.max = Tf(e.max, t, n, r, i)));
}
function Ym(e, { x: t, y: n }) {
    (qa(e.x, t.translate, t.scale, t.originPoint), qa(e.y, n.translate, n.scale, n.originPoint));
}
const Ef = 0.999999999999,
    Lf = 1.0000000000001;
function ow(e, t, n, r = !1) {
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
            o && ((t.x *= o.x.scale), (t.y *= o.y.scale), Ym(e, o)),
            r && en(s.latestValues) && Bn(e, s.latestValues));
    }
    (t.x < Lf && t.x > Ef && (t.x = 1), t.y < Lf && t.y > Ef && (t.y = 1));
}
function zn(e, t) {
    ((e.min = e.min + t), (e.max = e.max + t));
}
function Rf(e, t, n, r, i = 0.5) {
    const s = q(e.min, e.max, i);
    qa(e, t, n, s, r);
}
function Bn(e, t) {
    (Rf(e.x, t.x, t.scaleX, t.scale, t.originX), Rf(e.y, t.y, t.scaleY, t.scale, t.originY));
}
function Xm(e, t) {
    return Gm(sw(e.getBoundingClientRect(), t));
}
function aw(e, t, n) {
    const r = Xm(e, n),
        { scroll: i } = t;
    return (i && (zn(r.x, i.offset.x), zn(r.y, i.offset.y)), r);
}
const Zm = ({ current: e }) => (e ? e.ownerDocument.defaultView : null),
    lw = new WeakMap();
class uw {
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
                    n && this.snapToCursor(vi(c).point));
            },
            s = (c, f) => {
                const { drag: d, dragPropagation: m, onDragStart: y } = this.getProps();
                if (
                    d &&
                    !m &&
                    (this.openDragLock && this.openDragLock(),
                    (this.openDragLock = tx(d)),
                    !this.openDragLock)
                )
                    return;
                ((this.isDragging = !0),
                    (this.currentDirection = null),
                    this.resolveConstraints(),
                    this.visualElement.projection &&
                        ((this.visualElement.projection.isAnimationBlocked = !0),
                        (this.visualElement.projection.target = void 0)),
                    Ue((S) => {
                        let p = this.getAxisMotionValue(S).get() || 0;
                        if (ft.test(p)) {
                            const { projection: h } = this.visualElement;
                            if (h && h.layout) {
                                const g = h.layout.layoutBox[S];
                                g && (p = Fe(g) * (parseFloat(p) / 100));
                            }
                        }
                        this.originPoint[S] = p;
                    }),
                    y && Q.postRender(() => y(c, f)),
                    Ha(this.visualElement, 'transform'));
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
                    ((this.currentDirection = cw(S)),
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
                Ue((c) => {
                    var f;
                    return (
                        this.getAnimationState(c) === 'paused' &&
                        ((f = this.getAxisMotionValue(c).animation) === null || f === void 0
                            ? void 0
                            : f.play())
                    );
                }),
            { dragSnapToOrigin: u } = this.getProps();
        this.panSession = new Hm(
            t,
            { onSessionStart: i, onStart: s, onMove: o, onSessionEnd: a, resumeAnimation: l },
            {
                transformPagePoint: this.visualElement.getTransformPagePoint(),
                dragSnapToOrigin: u,
                contextWindow: Zm(this.visualElement),
            },
        );
    }
    stop(t, n) {
        const r = this.isDragging;
        if ((this.cancel(), !r)) return;
        const { velocity: i } = n;
        this.startAnimation(i);
        const { onDragEnd: s } = this.getProps();
        s && Q.postRender(() => s(t, n));
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
        if (!r || !zi(t, i, this.currentDirection)) return;
        const s = this.getAxisMotionValue(t);
        let o = this.originPoint[t] + r[t];
        (this.constraints &&
            this.constraints[t] &&
            (o = J1(o, this.constraints[t], this.elastic[t])),
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
        (n && jn(n)
            ? this.constraints || (this.constraints = this.resolveRefConstraints())
            : n && i
              ? (this.constraints = q1(i.layoutBox, n))
              : (this.constraints = !1),
            (this.elastic = rw(r)),
            s !== this.constraints &&
                i &&
                this.constraints &&
                !this.hasMutatedConstraints &&
                Ue((o) => {
                    this.constraints !== !1 &&
                        this.getAxisMotionValue(o) &&
                        (this.constraints[o] = nw(i.layoutBox[o], this.constraints[o]));
                }));
    }
    resolveRefConstraints() {
        const { dragConstraints: t, onMeasureDragConstraints: n } = this.getProps();
        if (!t || !jn(t)) return !1;
        const r = t.current,
            { projection: i } = this.visualElement;
        if (!i || !i.layout) return !1;
        const s = aw(r, i.root, this.visualElement.getTransformPagePoint());
        let o = ew(i.layout.layoutBox, s);
        if (n) {
            const a = n(iw(o));
            ((this.hasMutatedConstraints = !!a), a && (o = Gm(a)));
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
                if (!zi(c, n, this.currentDirection)) return;
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
        return (Ha(this.visualElement, t), r.start(Du(t, r, 0, n, this.visualElement, !1)));
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
            if (!zi(n, r, this.currentDirection)) return;
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
        if (!jn(n) || !r || !this.constraints) return;
        this.stopAnimation();
        const i = { x: 0, y: 0 };
        Ue((o) => {
            const a = this.getAxisMotionValue(o);
            if (a && this.constraints !== !1) {
                const l = a.get();
                i[o] = tw({ min: l, max: l }, this.constraints[o]);
            }
        });
        const { transformTemplate: s } = this.visualElement.getProps();
        ((this.visualElement.current.style.transform = s ? s({}, '') : 'none'),
            r.root && r.root.updateScroll(),
            r.updateLayout(),
            this.resolveConstraints(),
            Ue((o) => {
                if (!zi(o, t, null)) return;
                const a = this.getAxisMotionValue(o),
                    { min: l, max: u } = this.constraints[o];
                a.set(q(l, u, i[o]));
            }));
    }
    addListeners() {
        if (!this.visualElement.current) return;
        lw.set(this.visualElement, this);
        const t = this.visualElement.current,
            n = jr(t, 'pointerdown', (l) => {
                const { drag: u, dragListener: c = !0 } = this.getProps();
                u && c && this.start(l);
            }),
            r = () => {
                const { dragConstraints: l } = this.getProps();
                jn(l) && l.current && (this.constraints = this.resolveRefConstraints());
            },
            { projection: i } = this.visualElement,
            s = i.addEventListener('measure', r);
        (i && !i.layout && (i.root && i.root.updateScroll(), i.updateLayout()), Q.read(r));
        const o = li(window, 'resize', () => this.scalePositionWithinConstraints()),
            a = i.addEventListener('didUpdate', ({ delta: l, hasLayoutChanged: u }) => {
                this.isDragging &&
                    u &&
                    (Ue((c) => {
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
                dragElastic: o = Za,
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
function zi(e, t, n) {
    return (t === !0 || t === e) && (n === null || n === e);
}
function cw(e, t = 10) {
    let n = null;
    return (Math.abs(e.y) > t ? (n = 'y') : Math.abs(e.x) > t && (n = 'x'), n);
}
class fw extends Yt {
    constructor(t) {
        (super(t),
            (this.removeGroupControls = _e),
            (this.removeListeners = _e),
            (this.controls = new uw(t)));
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
const Af = (e) => (t, n) => {
    e && Q.postRender(() => e(t, n));
};
class dw extends Yt {
    constructor() {
        (super(...arguments), (this.removePointerDownListener = _e));
    }
    onPointerDown(t) {
        this.session = new Hm(t, this.createPanHandlers(), {
            transformPagePoint: this.node.getTransformPagePoint(),
            contextWindow: Zm(this.node),
        });
    }
    createPanHandlers() {
        const { onPanSessionStart: t, onPanStart: n, onPan: r, onPanEnd: i } = this.node.getProps();
        return {
            onSessionStart: Af(t),
            onStart: Af(n),
            onMove: r,
            onEnd: (s, o) => {
                (delete this.session, i && Q.postRender(() => i(s, o)));
            },
        };
    }
    mount() {
        this.removePointerDownListener = jr(this.node.current, 'pointerdown', (t) =>
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
const ts = { hasAnimatedSinceResize: !0, hasEverUpdated: !1 };
function Nf(e, t) {
    return t.max === t.min ? 0 : (e / (t.max - t.min)) * 100;
}
const yr = {
        correct: (e, t) => {
            if (!t.target) return e;
            if (typeof e == 'string')
                if (M.test(e)) e = parseFloat(e);
                else return e;
            const n = Nf(e, t.target.x),
                r = Nf(e, t.target.y);
            return `${n}% ${r}%`;
        },
    },
    hw = {
        correct: (e, { treeScale: t, projectionDelta: n }) => {
            const r = e,
                i = Wt.parse(e);
            if (i.length > 5) return r;
            const s = Wt.createTransformer(e),
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
class pw extends N.Component {
    componentDidMount() {
        const { visualElement: t, layoutGroup: n, switchLayoutGroup: r, layoutId: i } = this.props,
            { projection: s } = t;
        (V0(mw),
            s &&
                (n.group && n.group.add(s),
                r && r.register && i && r.register(s),
                s.root.didUpdate(),
                s.addEventListener('animationComplete', () => {
                    this.safeToRemove();
                }),
                s.setOptions({ ...s.options, onExitComplete: () => this.safeToRemove() })),
            (ts.hasEverUpdated = !0));
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
                          Q.postRender(() => {
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
            ou.postRender(() => {
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
function Jm(e) {
    const [t, n] = Yv(),
        r = N.useContext(Vp);
    return A.jsx(pw, {
        ...e,
        layoutGroup: r,
        switchLayoutGroup: N.useContext($p),
        isPresent: t,
        safeToRemove: n,
    });
}
const mw = {
    borderRadius: {
        ...yr,
        applyTo: [
            'borderTopLeftRadius',
            'borderTopRightRadius',
            'borderBottomLeftRadius',
            'borderBottomRightRadius',
        ],
    },
    borderTopLeftRadius: yr,
    borderTopRightRadius: yr,
    borderBottomLeftRadius: yr,
    borderBottomRightRadius: yr,
    boxShadow: hw,
};
function gw(e, t, n) {
    const r = we(e) ? e : oi(e);
    return (r.start(Du('', r, t, n)), r.animation);
}
function yw(e) {
    return e instanceof SVGElement && e.tagName !== 'svg';
}
const vw = (e, t) => e.depth - t.depth;
class xw {
    constructor() {
        ((this.children = []), (this.isDirty = !1));
    }
    add(t) {
        (wu(this.children, t), (this.isDirty = !0));
    }
    remove(t) {
        (Su(this.children, t), (this.isDirty = !0));
    }
    forEach(t) {
        (this.isDirty && this.children.sort(vw), (this.isDirty = !1), this.children.forEach(t));
    }
}
function ww(e, t) {
    const n = dt.now(),
        r = ({ timestamp: i }) => {
            const s = i - n;
            s >= t && (Kt(r), e(s - t));
        };
    return (Q.read(r, !0), () => Kt(r));
}
const qm = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'],
    Sw = qm.length,
    Df = (e) => (typeof e == 'string' ? parseFloat(e) : e),
    Of = (e) => typeof e == 'number' || M.test(e);
function kw(e, t, n, r, i, s) {
    i
        ? ((e.opacity = q(0, n.opacity !== void 0 ? n.opacity : 1, Pw(r))),
          (e.opacityExit = q(t.opacity !== void 0 ? t.opacity : 1, 0, Cw(r))))
        : s &&
          (e.opacity = q(
              t.opacity !== void 0 ? t.opacity : 1,
              n.opacity !== void 0 ? n.opacity : 1,
              r,
          ));
    for (let o = 0; o < Sw; o++) {
        const a = `border${qm[o]}Radius`;
        let l = Mf(t, a),
            u = Mf(n, a);
        if (l === void 0 && u === void 0) continue;
        (l || (l = 0),
            u || (u = 0),
            l === 0 || u === 0 || Of(l) === Of(u)
                ? ((e[a] = Math.max(q(Df(l), Df(u), r), 0)),
                  (ft.test(u) || ft.test(l)) && (e[a] += '%'))
                : (e[a] = u));
    }
    (t.rotate || n.rotate) && (e.rotate = q(t.rotate || 0, n.rotate || 0, r));
}
function Mf(e, t) {
    return e[t] !== void 0 ? e[t] : e.borderRadius;
}
const Pw = eg(0, 0.5, vm),
    Cw = eg(0.5, 0.95, _e);
function eg(e, t, n) {
    return (r) => (r < e ? 0 : r > t ? 1 : n(er(e, t, r)));
}
function Vf(e, t) {
    ((e.min = t.min), (e.max = t.max));
}
function Be(e, t) {
    (Vf(e.x, t.x), Vf(e.y, t.y));
}
function _f(e, t) {
    ((e.translate = t.translate),
        (e.scale = t.scale),
        (e.originPoint = t.originPoint),
        (e.origin = t.origin));
}
function jf(e, t, n, r, i) {
    return ((e -= t), (e = Os(e, 1 / n, r)), i !== void 0 && (e = Os(e, 1 / i, r)), e);
}
function Tw(e, t = 0, n = 1, r = 0.5, i, s = e, o = e) {
    if (
        (ft.test(t) && ((t = parseFloat(t)), (t = q(o.min, o.max, t / 100) - o.min)),
        typeof t != 'number')
    )
        return;
    let a = q(s.min, s.max, r);
    (e === s && (a -= t), (e.min = jf(e.min, t, n, a, i)), (e.max = jf(e.max, t, n, a, i)));
}
function Ff(e, t, [n, r, i], s, o) {
    Tw(e, t[n], t[r], t[i], t.scale, s, o);
}
const Ew = ['x', 'scaleX', 'originX'],
    Lw = ['y', 'scaleY', 'originY'];
function If(e, t, n, r) {
    (Ff(e.x, t, Ew, n ? n.x : void 0, r ? r.x : void 0),
        Ff(e.y, t, Lw, n ? n.y : void 0, r ? r.y : void 0));
}
function zf(e) {
    return e.translate === 0 && e.scale === 1;
}
function tg(e) {
    return zf(e.x) && zf(e.y);
}
function Bf(e, t) {
    return e.min === t.min && e.max === t.max;
}
function Rw(e, t) {
    return Bf(e.x, t.x) && Bf(e.y, t.y);
}
function Uf(e, t) {
    return Math.round(e.min) === Math.round(t.min) && Math.round(e.max) === Math.round(t.max);
}
function ng(e, t) {
    return Uf(e.x, t.x) && Uf(e.y, t.y);
}
function $f(e) {
    return Fe(e.x) / Fe(e.y);
}
function Hf(e, t) {
    return e.translate === t.translate && e.scale === t.scale && e.originPoint === t.originPoint;
}
class Aw {
    constructor() {
        this.members = [];
    }
    add(t) {
        (wu(this.members, t), t.scheduleRender());
    }
    remove(t) {
        if (
            (Su(this.members, t), t === this.prevLead && (this.prevLead = void 0), t === this.lead)
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
function Nw(e, t, n) {
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
const tn = {
        type: 'projectionFrame',
        totalNodes: 0,
        resolvedTargetDeltas: 0,
        recalculatedProjection: 0,
    },
    Tr = typeof window < 'u' && window.MotionDebug !== void 0,
    Bo = ['', 'X', 'Y', 'Z'],
    Dw = { visibility: 'hidden' },
    Kf = 1e3;
let Ow = 0;
function Uo(e, t, n, r) {
    const { latestValues: i } = t;
    i[e] && ((n[e] = i[e]), t.setStaticValue(e, 0), r && (r[e] = 0));
}
function rg(e) {
    if (((e.hasCheckedOptimisedAppear = !0), e.root === e)) return;
    const { visualElement: t } = e.options;
    if (!t) return;
    const n = fm(t);
    if (window.MotionHasOptimisedAnimation(n, 'transform')) {
        const { layout: i, layoutId: s } = e.options;
        window.MotionCancelOptimisedAnimation(n, 'transform', Q, !(i || s));
    }
    const { parent: r } = e;
    r && !r.hasCheckedOptimisedAppear && rg(r);
}
function ig({
    attachResizeListener: e,
    defaultParent: t,
    measureScroll: n,
    checkIsScrollRoot: r,
    resetTransform: i,
}) {
    return class {
        constructor(o = {}, a = t == null ? void 0 : t()) {
            ((this.id = Ow++),
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
                        Tr &&
                            (tn.totalNodes =
                                tn.resolvedTargetDeltas =
                                tn.recalculatedProjection =
                                    0),
                        this.nodes.forEach(_w),
                        this.nodes.forEach(Bw),
                        this.nodes.forEach(Uw),
                        this.nodes.forEach(jw),
                        Tr && window.MotionDebug.record(tn));
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
            this.root === this && (this.nodes = new xw());
        }
        addEventListener(o, a) {
            return (
                this.eventHandlers.has(o) || this.eventHandlers.set(o, new ku()),
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
            ((this.isSVG = yw(o)), (this.instance = o));
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
                        (f = ww(d, 250)),
                        ts.hasAnimatedSinceResize &&
                            ((ts.hasAnimatedSinceResize = !1), this.nodes.forEach(bf)));
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
                            const v = this.options.transition || c.getDefaultTransition() || bw,
                                { onLayoutAnimationStart: S, onLayoutAnimationComplete: p } =
                                    c.getProps(),
                                h = !this.targetLayout || !ng(this.targetLayout, y) || m,
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
                                const x = { ...gu(v, 'layout'), onPlay: S, onComplete: p };
                                ((c.shouldReduceMotion || this.options.layoutRoot) &&
                                    ((x.delay = 0), (x.type = !1)),
                                    this.startAnimation(x));
                            } else
                                (d || bf(this),
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
                Kt(this.updateProjection));
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
                ((this.isUpdating = !0), this.nodes && this.nodes.forEach($w), this.animationId++);
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
                    rg(this),
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
                (this.unblockUpdate(), this.clearAllSnapshots(), this.nodes.forEach(Wf));
                return;
            }
            (this.isUpdating || this.nodes.forEach(Iw),
                (this.isUpdating = !1),
                this.nodes.forEach(zw),
                this.nodes.forEach(Mw),
                this.nodes.forEach(Vw),
                this.clearAllSnapshots());
            const a = dt.now();
            ((he.delta = Ct(0, 1e3 / 60, a - he.timestamp)),
                (he.timestamp = a),
                (he.isProcessing = !0),
                Do.update.process(he),
                Do.preRender.process(he),
                Do.render.process(he),
                (he.isProcessing = !1));
        }
        didUpdate() {
            this.updateScheduled || ((this.updateScheduled = !0), ou.read(this.scheduleUpdate));
        }
        clearAllSnapshots() {
            (this.nodes.forEach(Fw), this.sharedNodes.forEach(Hw));
        }
        scheduleUpdateProjection() {
            this.projectionUpdateScheduled ||
                ((this.projectionUpdateScheduled = !0), Q.preRender(this.updateProjection, !1, !0));
        }
        scheduleCheckAfterUnmount() {
            Q.postRender(() => {
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
                a = this.projectionDelta && !tg(this.projectionDelta),
                l = this.getTransformTemplate(),
                u = l ? l(this.latestValues, '') : void 0,
                c = u !== this.prevTransformTemplateValue;
            o &&
                (a || en(this.latestValues) || c) &&
                (i(this.instance, u), (this.shouldResetTransform = !1), this.scheduleRender());
        }
        measure(o = !0) {
            const a = this.measurePageBox();
            let l = this.removeElementScroll(a);
            return (
                o && (l = this.removeTransform(l)),
                Gw(l),
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
                    this.path.some(Qw)
                )
            ) {
                const { scroll: c } = this.root;
                c && (zn(l.x, c.offset.x), zn(l.y, c.offset.y));
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
                    (f.wasRoot && Be(l, o), zn(l.x, f.offset.x), zn(l.y, f.offset.y));
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
                    Bn(l, { x: -c.scroll.offset.x, y: -c.scroll.offset.y }),
                    en(c.latestValues) && Bn(l, c.latestValues));
            }
            return (en(this.latestValues) && Bn(l, this.latestValues), l);
        }
        removeTransform(o) {
            const a = ie();
            Be(a, o);
            for (let l = 0; l < this.path.length; l++) {
                const u = this.path[l];
                if (!u.instance || !en(u.latestValues)) continue;
                Ja(u.latestValues) && u.updateSnapshot();
                const c = ie(),
                    f = u.measurePageBox();
                (Be(c, f), If(a, u.latestValues, u.snapshot ? u.snapshot.layoutBox : void 0, c));
            }
            return (en(this.latestValues) && If(a, this.latestValues), a);
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
                this.relativeParent.resolvedRelativeTargetAt !== he.timestamp &&
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
                    ((this.resolvedRelativeTargetAt = he.timestamp),
                    !this.targetDelta && !this.relativeTarget)
                ) {
                    const m = this.getClosestProjectingParent();
                    m && m.layout && this.animationProgress !== 1
                        ? ((this.relativeParent = m),
                          this.forceRelativeParentToResolveTarget(),
                          (this.relativeTarget = ie()),
                          (this.relativeTargetOrigin = ie()),
                          Ir(this.relativeTargetOrigin, this.layout.layoutBox, m.layout.layoutBox),
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
                              Z1(this.target, this.relativeTarget, this.relativeParent.target))
                            : this.targetDelta
                              ? (this.resumingFrom
                                    ? (this.target = this.applyTransform(this.layout.layoutBox))
                                    : Be(this.target, this.layout.layoutBox),
                                Ym(this.target, this.targetDelta))
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
                              Ir(this.relativeTargetOrigin, this.target, m.target),
                              Be(this.relativeTarget, this.relativeTargetOrigin))
                            : (this.relativeParent = this.relativeTarget = void 0);
                    }
                    Tr && tn.resolvedTargetDeltas++;
                }
            }
        }
        getClosestProjectingParent() {
            if (!(!this.parent || Ja(this.parent.latestValues) || Qm(this.parent.latestValues)))
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
                this.resolvedRelativeTargetAt === he.timestamp && (u = !1),
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
            (ow(this.layoutCorrected, this.treeScale, this.path, l),
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
                : (_f(this.prevProjectionDelta.x, this.projectionDelta.x),
                  _f(this.prevProjectionDelta.y, this.projectionDelta.y)),
                Fr(this.projectionDelta, this.layoutCorrected, y, this.latestValues),
                (this.treeScale.x !== d ||
                    this.treeScale.y !== m ||
                    !Hf(this.projectionDelta.x, this.prevProjectionDelta.x) ||
                    !Hf(this.projectionDelta.y, this.prevProjectionDelta.y)) &&
                    ((this.hasProjected = !0),
                    this.scheduleRender(),
                    this.notifyListeners('projectionUpdate', y)),
                Tr && tn.recalculatedProjection++);
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
            ((this.prevProjectionDelta = In()),
                (this.projectionDelta = In()),
                (this.projectionDeltaWithTransform = In()));
        }
        setAnimationOrigin(o, a = !1) {
            const l = this.snapshot,
                u = l ? l.latestValues : {},
                c = { ...this.latestValues },
                f = In();
            ((!this.relativeParent || !this.relativeParent.options.layoutRoot) &&
                (this.relativeTarget = this.relativeTargetOrigin = void 0),
                (this.attemptToResolveRelativeTarget = !a));
            const d = ie(),
                m = l ? l.source : void 0,
                y = this.layout ? this.layout.source : void 0,
                v = m !== y,
                S = this.getStack(),
                p = !S || S.members.length <= 1,
                h = !!(v && !p && this.options.crossfade === !0 && !this.path.some(Ww));
            this.animationProgress = 0;
            let g;
            ((this.mixTargetDelta = (x) => {
                const w = x / 1e3;
                (Gf(f.x, o.x, w),
                    Gf(f.y, o.y, w),
                    this.setTargetDelta(f),
                    this.relativeTarget &&
                        this.relativeTargetOrigin &&
                        this.layout &&
                        this.relativeParent &&
                        this.relativeParent.layout &&
                        (Ir(d, this.layout.layoutBox, this.relativeParent.layout.layoutBox),
                        Kw(this.relativeTarget, this.relativeTargetOrigin, d, w),
                        g && Rw(this.relativeTarget, g) && (this.isProjectionDirty = !1),
                        g || (g = ie()),
                        Be(g, this.relativeTarget)),
                    v && ((this.animationValues = c), kw(c, u, this.latestValues, w, h, p)),
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
                    (Kt(this.pendingAnimation), (this.pendingAnimation = void 0)),
                (this.pendingAnimation = Q.update(() => {
                    ((ts.hasAnimatedSinceResize = !0),
                        (this.currentAnimation = gw(0, Kf, {
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
                (this.mixTargetDelta && this.mixTargetDelta(Kf), this.currentAnimation.stop()),
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
                    sg(this.options.animationType, this.layout.layoutBox, u.layoutBox)
                ) {
                    l = this.target || ie();
                    const f = Fe(this.layout.layoutBox.x);
                    ((l.x.min = o.target.x.min), (l.x.max = l.x.min + f));
                    const d = Fe(this.layout.layoutBox.y);
                    ((l.y.min = o.target.y.min), (l.y.max = l.y.min + d));
                }
                (Be(a, l),
                    Bn(a, c),
                    Fr(this.projectionDeltaWithTransform, this.layoutCorrected, a, c));
            }
        }
        registerSharedNode(o, a) {
            (this.sharedNodes.has(o) || this.sharedNodes.set(o, new Aw()),
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
            l.z && Uo('z', o, u, this.animationValues);
            for (let c = 0; c < Bo.length; c++)
                (Uo(`rotate${Bo[c]}`, o, u, this.animationValues),
                    Uo(`skew${Bo[c]}`, o, u, this.animationValues));
            o.render();
            for (const c in u)
                (o.setStaticValue(c, u[c]),
                    this.animationValues && (this.animationValues[c] = u[c]));
            o.scheduleRender();
        }
        getProjectionStyles(o) {
            var a, l;
            if (!this.instance || this.isSVG) return;
            if (!this.isVisible) return Dw;
            const u = { visibility: '' },
                c = this.getTransformTemplate();
            if (this.needsReset)
                return (
                    (this.needsReset = !1),
                    (u.opacity = ''),
                    (u.pointerEvents = qi(o == null ? void 0 : o.pointerEvents) || ''),
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
                        (v.pointerEvents = qi(o == null ? void 0 : o.pointerEvents) || '')),
                    this.hasProjected &&
                        !en(this.latestValues) &&
                        ((v.transform = c ? c({}, '') : 'none'), (this.hasProjected = !1)),
                    v
                );
            }
            const d = f.animationValues || f.latestValues;
            (this.applyTransformsToTarget(),
                (u.transform = Nw(this.projectionDeltaWithTransform, this.treeScale, d)),
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
            for (const v in Ls) {
                if (d[v] === void 0) continue;
                const { correct: S, applyTo: p } = Ls[v],
                    h = u.transform === 'none' ? d[v] : S(d[v], f);
                if (p) {
                    const g = p.length;
                    for (let x = 0; x < g; x++) u[p[x]] = h;
                } else u[v] = h;
            }
            return (
                this.options.layoutId &&
                    (u.pointerEvents =
                        f === this ? qi(o == null ? void 0 : o.pointerEvents) || '' : 'none'),
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
                this.root.nodes.forEach(Wf),
                this.root.sharedNodes.clear());
        }
    };
}
function Mw(e) {
    e.updateLayout();
}
function Vw(e) {
    var t;
    const n = ((t = e.resumeFrom) === null || t === void 0 ? void 0 : t.snapshot) || e.snapshot;
    if (e.isLead() && e.layout && n && e.hasListeners('didUpdate')) {
        const { layoutBox: r, measuredBox: i } = e.layout,
            { animationType: s } = e.options,
            o = n.source !== e.layout.source;
        s === 'size'
            ? Ue((f) => {
                  const d = o ? n.measuredBox[f] : n.layoutBox[f],
                      m = Fe(d);
                  ((d.min = r[f].min), (d.max = d.min + m));
              })
            : sg(s, n.layoutBox, r) &&
              Ue((f) => {
                  const d = o ? n.measuredBox[f] : n.layoutBox[f],
                      m = Fe(r[f]);
                  ((d.max = d.min + m),
                      e.relativeTarget &&
                          !e.currentAnimation &&
                          ((e.isProjectionDirty = !0),
                          (e.relativeTarget[f].max = e.relativeTarget[f].min + m)));
              });
        const a = In();
        Fr(a, r, n.layoutBox);
        const l = In();
        o ? Fr(l, e.applyTransform(i, !0), n.measuredBox) : Fr(l, r, n.layoutBox);
        const u = !tg(a);
        let c = !1;
        if (!e.resumeFrom) {
            const f = e.getClosestProjectingParent();
            if (f && !f.resumeFrom) {
                const { snapshot: d, layout: m } = f;
                if (d && m) {
                    const y = ie();
                    Ir(y, n.layoutBox, d.layoutBox);
                    const v = ie();
                    (Ir(v, r, m.layoutBox),
                        ng(y, v) || (c = !0),
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
function _w(e) {
    (Tr && tn.totalNodes++,
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
function jw(e) {
    e.isProjectionDirty = e.isSharedProjectionDirty = e.isTransformDirty = !1;
}
function Fw(e) {
    e.clearSnapshot();
}
function Wf(e) {
    e.clearMeasurements();
}
function Iw(e) {
    e.isLayoutDirty = !1;
}
function zw(e) {
    const { visualElement: t } = e.options;
    (t && t.getProps().onBeforeLayoutMeasure && t.notify('BeforeLayoutMeasure'),
        e.resetTransform());
}
function bf(e) {
    (e.finishAnimation(),
        (e.targetDelta = e.relativeTarget = e.target = void 0),
        (e.isProjectionDirty = !0));
}
function Bw(e) {
    e.resolveTargetDelta();
}
function Uw(e) {
    e.calcProjection();
}
function $w(e) {
    e.resetSkewAndRotation();
}
function Hw(e) {
    e.removeLeadSnapshot();
}
function Gf(e, t, n) {
    ((e.translate = q(t.translate, 0, n)),
        (e.scale = q(t.scale, 1, n)),
        (e.origin = t.origin),
        (e.originPoint = t.originPoint));
}
function Qf(e, t, n, r) {
    ((e.min = q(t.min, n.min, r)), (e.max = q(t.max, n.max, r)));
}
function Kw(e, t, n, r) {
    (Qf(e.x, t.x, n.x, r), Qf(e.y, t.y, n.y, r));
}
function Ww(e) {
    return e.animationValues && e.animationValues.opacityExit !== void 0;
}
const bw = { duration: 0.45, ease: [0.4, 0, 0.1, 1] },
    Yf = (e) =>
        typeof navigator < 'u' &&
        navigator.userAgent &&
        navigator.userAgent.toLowerCase().includes(e),
    Xf = Yf('applewebkit/') && !Yf('chrome/') ? Math.round : _e;
function Zf(e) {
    ((e.min = Xf(e.min)), (e.max = Xf(e.max)));
}
function Gw(e) {
    (Zf(e.x), Zf(e.y));
}
function sg(e, t, n) {
    return e === 'position' || (e === 'preserve-aspect' && !X1($f(t), $f(n), 0.2));
}
function Qw(e) {
    var t;
    return e !== e.root && ((t = e.scroll) === null || t === void 0 ? void 0 : t.wasRoot);
}
const Yw = ig({
        attachResizeListener: (e, t) => li(e, 'resize', t),
        measureScroll: () => ({
            x: document.documentElement.scrollLeft || document.body.scrollLeft,
            y: document.documentElement.scrollTop || document.body.scrollTop,
        }),
        checkIsScrollRoot: () => !0,
    }),
    $o = { current: void 0 },
    og = ig({
        measureScroll: (e) => ({ x: e.scrollLeft, y: e.scrollTop }),
        defaultParent: () => {
            if (!$o.current) {
                const e = new Yw({});
                (e.mount(window), e.setOptions({ layoutScroll: !0 }), ($o.current = e));
            }
            return $o.current;
        },
        resetTransform: (e, t) => {
            e.style.transform = t !== void 0 ? t : 'none';
        },
        checkIsScrollRoot: (e) => window.getComputedStyle(e).position === 'fixed',
    }),
    Xw = { pan: { Feature: dw }, drag: { Feature: fw, ProjectionNode: og, MeasureLayout: Jm } };
function Jf(e, t, n) {
    const { props: r } = e;
    e.animationState && r.whileHover && e.animationState.setActive('whileHover', n === 'Start');
    const i = 'onHover' + n,
        s = r[i];
    s && Q.postRender(() => s(t, vi(t)));
}
class Zw extends Yt {
    mount() {
        const { current: t } = this.node;
        t &&
            (this.unmount = X0(
                t,
                (n) => (Jf(this.node, n, 'Start'), (r) => Jf(this.node, r, 'End')),
            ));
    }
    unmount() {}
}
class Jw extends Yt {
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
        this.unmount = yi(
            li(this.node.current, 'focus', () => this.onFocus()),
            li(this.node.current, 'blur', () => this.onBlur()),
        );
    }
    unmount() {}
}
function qf(e, t, n) {
    const { props: r } = e;
    e.animationState && r.whileTap && e.animationState.setActive('whileTap', n === 'Start');
    const i = 'onTap' + (n === 'End' ? '' : n),
        s = r[i];
    s && Q.postRender(() => s(t, vi(t)));
}
class qw extends Yt {
    mount() {
        const { current: t } = this.node;
        t &&
            (this.unmount = ex(
                t,
                (n) => (
                    qf(this.node, n, 'Start'),
                    (r, { success: i }) => qf(this.node, r, i ? 'End' : 'Cancel')
                ),
                { useGlobalTarget: this.node.props.globalTapTarget },
            ));
    }
    unmount() {}
}
const el = new WeakMap(),
    Ho = new WeakMap(),
    eS = (e) => {
        const t = el.get(e.target);
        t && t(e);
    },
    tS = (e) => {
        e.forEach(eS);
    };
function nS({ root: e, ...t }) {
    const n = e || document;
    Ho.has(n) || Ho.set(n, {});
    const r = Ho.get(n),
        i = JSON.stringify(t);
    return (r[i] || (r[i] = new IntersectionObserver(tS, { root: e, ...t })), r[i]);
}
function rS(e, t, n) {
    const r = nS(t);
    return (
        el.set(e, n),
        r.observe(e),
        () => {
            (el.delete(e), r.unobserve(e));
        }
    );
}
const iS = { some: 0, all: 1 };
class sS extends Yt {
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
                threshold: typeof i == 'number' ? i : iS[i],
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
        return rS(this.node.current, o, a);
    }
    mount() {
        this.startObserver();
    }
    update() {
        if (typeof IntersectionObserver > 'u') return;
        const { props: t, prevProps: n } = this.node;
        ['amount', 'margin', 'root'].some(oS(t, n)) && this.startObserver();
    }
    unmount() {}
}
function oS({ viewport: e = {} }, { viewport: t = {} } = {}) {
    return (n) => e[n] !== t[n];
}
const aS = {
        inView: { Feature: sS },
        tap: { Feature: qw },
        focus: { Feature: Jw },
        hover: { Feature: Zw },
    },
    lS = { layout: { ProjectionNode: og, MeasureLayout: Jm } },
    tl = { current: null },
    ag = { current: !1 };
function uS() {
    if (((ag.current = !0), !!tu))
        if (window.matchMedia) {
            const e = window.matchMedia('(prefers-reduced-motion)'),
                t = () => (tl.current = e.matches);
            (e.addListener(t), t());
        } else tl.current = !1;
}
const cS = [...Om, ve, Wt],
    fS = (e) => cS.find(Dm(e)),
    ed = new WeakMap();
function dS(e, t, n) {
    for (const r in t) {
        const i = t[r],
            s = n[r];
        if (we(i)) e.addValue(r, i);
        else if (we(s)) e.addValue(r, oi(i, { owner: e }));
        else if (s !== i)
            if (e.hasValue(r)) {
                const o = e.getValue(r);
                o.liveStyle === !0 ? o.jump(i) : o.hasAnimated || o.set(i);
            } else {
                const o = e.getStaticValue(r);
                e.addValue(r, oi(o !== void 0 ? o : i, { owner: e }));
            }
    }
    for (const r in n) t[r] === void 0 && e.removeValue(r);
    return t;
}
const td = [
    'AnimationStart',
    'AnimationComplete',
    'Update',
    'BeforeLayoutMeasure',
    'LayoutMeasure',
    'LayoutAnimationStart',
    'LayoutAnimationComplete',
];
class hS {
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
            (this.KeyframeResolver = Ru),
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
                const m = dt.now();
                this.renderScheduledAt < m &&
                    ((this.renderScheduledAt = m), Q.render(this.render, !1, !0));
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
            (this.isControllingVariants = eo(n)),
            (this.isVariantNode = Bp(n)),
            this.isVariantNode && (this.variantChildren = new Set()),
            (this.manuallyAnimateOnMount = !!(t && t.current)));
        const { willChange: f, ...d } = this.scrapeMotionValuesFromProps(n, {}, this);
        for (const m in d) {
            const y = d[m];
            l[m] !== void 0 && we(y) && y.set(l[m], !1);
        }
    }
    mount(t) {
        ((this.current = t),
            ed.set(t, this),
            this.projection && !this.projection.instance && this.projection.mount(t),
            this.parent &&
                this.isVariantNode &&
                !this.isControllingVariants &&
                (this.removeFromVariantTree = this.parent.addVariantChild(this)),
            this.values.forEach((n, r) => this.bindToMotionValue(r, n)),
            ag.current || uS(),
            (this.shouldReduceMotion =
                this.reducedMotionConfig === 'never'
                    ? !1
                    : this.reducedMotionConfig === 'always'
                      ? !0
                      : tl.current),
            this.parent && this.parent.children.add(this),
            this.update(this.props, this.presenceContext));
    }
    unmount() {
        (ed.delete(this.current),
            this.projection && this.projection.unmount(),
            Kt(this.notifyUpdate),
            Kt(this.render),
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
        const r = vn.has(t),
            i = n.on('change', (a) => {
                ((this.latestValues[t] = a),
                    this.props.onUpdate && Q.preRender(this.notifyUpdate),
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
        for (t in tr) {
            const n = tr[t];
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
        for (let r = 0; r < td.length; r++) {
            const i = td[r];
            this.propEventSubscriptions[i] &&
                (this.propEventSubscriptions[i](), delete this.propEventSubscriptions[i]);
            const s = 'on' + i,
                o = t[s];
            o && (this.propEventSubscriptions[i] = this.on(i, o));
        }
        ((this.prevMotionValues = dS(
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
                ((r = oi(n === null ? void 0 : n, { owner: this })), this.addValue(t, r)),
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
                (typeof i == 'string' && (Am(i) || wm(i))
                    ? (i = parseFloat(i))
                    : !fS(i) && Wt.test(n) && (i = Em(t, n)),
                this.setBaseTarget(t, we(i) ? i.get() : i)),
            we(i) ? i.get() : i
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
            const o = lu(
                this.props,
                r,
                (n = this.presenceContext) === null || n === void 0 ? void 0 : n.custom,
            );
            o && (i = o[t]);
        }
        if (r && i !== void 0) return i;
        const s = this.getBaseTargetFromProps(this.props, t);
        return s !== void 0 && !we(s)
            ? s
            : this.initialValues[t] !== void 0 && i === void 0
              ? void 0
              : this.baseTarget[t];
    }
    on(t, n) {
        return (this.events[t] || (this.events[t] = new ku()), this.events[t].add(n));
    }
    notify(t, ...n) {
        this.events[t] && this.events[t].notify(...n);
    }
}
class lg extends hS {
    constructor() {
        (super(...arguments), (this.KeyframeResolver = Mm));
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
        we(t) &&
            (this.childSubscription = t.on('change', (n) => {
                this.current && (this.current.textContent = `${n}`);
            }));
    }
}
function pS(e) {
    return window.getComputedStyle(e);
}
class mS extends lg {
    constructor() {
        (super(...arguments), (this.type = 'html'), (this.renderInstance = Yp));
    }
    readValueFromInstance(t, n) {
        if (vn.has(n)) {
            const r = Lu(n);
            return (r && r.default) || 0;
        } else {
            const r = pS(t),
                i = (bp(n) ? r.getPropertyValue(n) : r[n]) || 0;
            return typeof i == 'string' ? i.trim() : i;
        }
    }
    measureInstanceViewportBox(t, { transformPagePoint: n }) {
        return Xm(t, n);
    }
    build(t, n, r) {
        fu(t, n, r.transformTemplate);
    }
    scrapeMotionValuesFromProps(t, n, r) {
        return mu(t, n, r);
    }
}
class gS extends lg {
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
        if (vn.has(n)) {
            const r = Lu(n);
            return (r && r.default) || 0;
        }
        return ((n = Xp.has(n) ? n : su(n)), t.getAttribute(n));
    }
    scrapeMotionValuesFromProps(t, n, r) {
        return qp(t, n, r);
    }
    build(t, n, r) {
        du(t, n, this.isSVGTag, r.transformTemplate);
    }
    renderInstance(t, n, r, i) {
        Zp(t, n, r, i);
    }
    mount(t) {
        ((this.isSVGTag = pu(t.tagName)), super.mount(t));
    }
}
const yS = (e, t) => (au(e) ? new gS(t) : new mS(t, { allowProjection: e !== N.Fragment })),
    vS = H0({ ...U1, ...aS, ...Xw, ...lS }, yS),
    Ye = i0(vS),
    V = (e) => typeof e == 'string',
    vr = () => {
        let e, t;
        const n = new Promise((r, i) => {
            ((e = r), (t = i));
        });
        return ((n.resolve = e), (n.reject = t), n);
    },
    nd = (e) => (e == null ? '' : '' + e),
    xS = (e, t, n) => {
        e.forEach((r) => {
            t[r] && (n[r] = t[r]);
        });
    },
    wS = /###/g,
    rd = (e) => (e && e.indexOf('###') > -1 ? e.replace(wS, '.') : e),
    id = (e) => !e || V(e),
    zr = (e, t, n) => {
        const r = V(t) ? t.split('.') : t;
        let i = 0;
        for (; i < r.length - 1; ) {
            if (id(e)) return {};
            const s = rd(r[i]);
            (!e[s] && n && (e[s] = new n()),
                Object.prototype.hasOwnProperty.call(e, s) ? (e = e[s]) : (e = {}),
                ++i);
        }
        return id(e) ? {} : { obj: e, k: rd(r[i]) };
    },
    sd = (e, t, n) => {
        const { obj: r, k: i } = zr(e, t, Object);
        if (r !== void 0 || t.length === 1) {
            r[i] = n;
            return;
        }
        let s = t[t.length - 1],
            o = t.slice(0, t.length - 1),
            a = zr(e, o, Object);
        for (; a.obj === void 0 && o.length; )
            ((s = `${o[o.length - 1]}.${s}`),
                (o = o.slice(0, o.length - 1)),
                (a = zr(e, o, Object)),
                a != null && a.obj && typeof a.obj[`${a.k}.${s}`] < 'u' && (a.obj = void 0));
        a.obj[`${a.k}.${s}`] = n;
    },
    SS = (e, t, n, r) => {
        const { obj: i, k: s } = zr(e, t, Object);
        ((i[s] = i[s] || []), i[s].push(n));
    },
    Ms = (e, t) => {
        const { obj: n, k: r } = zr(e, t);
        if (n && Object.prototype.hasOwnProperty.call(n, r)) return n[r];
    },
    kS = (e, t, n) => {
        const r = Ms(e, n);
        return r !== void 0 ? r : Ms(t, n);
    },
    ug = (e, t, n) => {
        for (const r in t)
            r !== '__proto__' &&
                r !== 'constructor' &&
                (r in e
                    ? V(e[r]) || e[r] instanceof String || V(t[r]) || t[r] instanceof String
                        ? n && (e[r] = t[r])
                        : ug(e[r], t[r], n)
                    : (e[r] = t[r]));
        return e;
    },
    Sn = (e) => e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
var PS = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;' };
const CS = (e) => (V(e) ? e.replace(/[&<>"'\/]/g, (t) => PS[t]) : e);
class TS {
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
const ES = [' ', ',', '?', '!', ';'],
    LS = new TS(20),
    RS = (e, t, n) => {
        ((t = t || ''), (n = n || ''));
        const r = ES.filter((o) => t.indexOf(o) < 0 && n.indexOf(o) < 0);
        if (r.length === 0) return !0;
        const i = LS.getRegExp(`(${r.map((o) => (o === '?' ? '\\?' : o)).join('|')})`);
        let s = !i.test(e);
        if (!s) {
            const o = e.indexOf(n);
            o > 0 && !i.test(e.substring(0, o)) && (s = !0);
        }
        return s;
    },
    nl = (e, t, n = '.') => {
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
    ui = (e) => (e == null ? void 0 : e.replace('_', '-')),
    AS = {
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
class Vs {
    constructor(t, n = {}) {
        this.init(t, n);
    }
    init(t, n = {}) {
        ((this.prefix = n.prefix || 'i18next:'),
            (this.logger = t || AS),
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
        return new Vs(this.logger, { prefix: `${this.prefix}:${t}:`, ...this.options });
    }
    clone(t) {
        return (
            (t = t || this.options),
            (t.prefix = t.prefix || this.prefix),
            new Vs(this.logger, t)
        );
    }
}
var lt = new Vs();
class ro {
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
class od extends ro {
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
        const l = Ms(this.data, a);
        return (
            !l &&
                !n &&
                !r &&
                t.indexOf('.') > -1 &&
                ((t = a[0]), (n = a[1]), (r = a.slice(2).join('.'))),
            l || !o || !V(r)
                ? l
                : nl((c = (u = this.data) == null ? void 0 : u[t]) == null ? void 0 : c[n], r, s)
        );
    }
    addResource(t, n, r, i, s = { silent: !1 }) {
        const o = s.keySeparator !== void 0 ? s.keySeparator : this.options.keySeparator;
        let a = [t, n];
        (r && (a = a.concat(o ? r.split(o) : r)),
            t.indexOf('.') > -1 && ((a = t.split('.')), (i = n), (n = a[1])),
            this.addNamespaces(n),
            sd(this.data, a, i),
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
        let l = Ms(this.data, a) || {};
        (o.skipCopy || (r = JSON.parse(JSON.stringify(r))),
            i ? ug(l, r, s) : (l = { ...l, ...r }),
            sd(this.data, a, l),
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
var cg = {
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
const fg = Symbol('i18next/PATH_KEY');
function NS() {
    const e = [],
        t = Object.create(null);
    let n;
    return (
        (t.get = (r, i) => {
            var s;
            return (
                (s = n == null ? void 0 : n.revoke) == null || s.call(n),
                i === fg ? e : (e.push(i), (n = Proxy.revocable(r, t)), n.proxy)
            );
        }),
        Proxy.revocable(Object.create(null), t).proxy
    );
}
function rl(e, t) {
    const { [fg]: n } = e(NS());
    return n.join((t == null ? void 0 : t.keySeparator) ?? '.');
}
const ad = {},
    Ko = (e) => !V(e) && typeof e != 'boolean' && typeof e != 'number';
class _s extends ro {
    constructor(t, n = {}) {
        (super(),
            xS(
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
            (this.logger = lt.create('translator')));
    }
    changeLanguage(t) {
        t && (this.language = t);
    }
    exists(t, n = { interpolation: {} }) {
        const r = { ...n };
        if (t == null) return !1;
        const i = this.resolve(t, r);
        if ((i == null ? void 0 : i.res) === void 0) return !1;
        const s = Ko(i.res);
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
                !RS(t, r, i);
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
        (typeof t == 'function' && (t = rl(t, { ...this.options, ...i })),
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
            w = _s.hasDefaultValue(i),
            P = x ? this.pluralResolver.getSuffix(f, i.count, i) : '',
            T = i.ordinal && x ? this.pluralResolver.getSuffix(f, i.count, { ordinal: !1 }) : '',
            k = x && !i.ordinal && i.count === 0,
            D =
                (k && i[`defaultValue${this.options.pluralSeparator}zero`]) ||
                i[`defaultValue${P}`] ||
                i[`defaultValue${T}`] ||
                i.defaultValue;
        let L = y;
        g && !y && w && (L = D);
        const X = Ko(L),
            z = Object.prototype.toString.apply(L);
        if (g && L && X && p.indexOf(z) < 0 && !(V(h) && Array.isArray(L))) {
            if (!i.returnObjects && !this.options.returnObjects) {
                this.options.returnedObjectHandler ||
                    this.logger.warn(
                        'accessing an object - but returnObjects options is not enabled!',
                    );
                const j = this.options.returnedObjectHandler
                    ? this.options.returnedObjectHandler(v, L, { ...i, ns: l })
                    : `key '${a} (${this.language})' returned an object instead of string.`;
                return s ? ((m.res = j), (m.usedParams = this.getUsedParamsDetails(i)), m) : j;
            }
            if (o) {
                const j = Array.isArray(L),
                    F = j ? [] : {},
                    Z = j ? S : v;
                for (const oe in L)
                    if (Object.prototype.hasOwnProperty.call(L, oe)) {
                        const $ = `${Z}${o}${oe}`;
                        (w && !y
                            ? (F[oe] = this.translate($, {
                                  ...i,
                                  defaultValue: Ko(D) ? D[oe] : void 0,
                                  joinArrays: !1,
                                  ns: l,
                              }))
                            : (F[oe] = this.translate($, { ...i, joinArrays: !1, ns: l })),
                            F[oe] === $ && (F[oe] = L[oe]));
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
                $ = w && D !== y && this.options.updateMissing;
            if (F || j || $) {
                if ((this.logger.log($ ? 'updateKey' : 'missingKey', f, u, a, $ ? D : y), o)) {
                    const B = this.resolve(a, { ...i, keySeparator: !1 });
                    B &&
                        B.res &&
                        this.logger.warn(
                            'Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.',
                        );
                }
                let E = [];
                const O = this.languageUtils.getFallbackCodes(
                    this.options.fallbackLng,
                    i.lng || this.language,
                );
                if (this.options.saveMissingTo === 'fallback' && O && O[0])
                    for (let B = 0; B < O.length; B++) E.push(O[B]);
                else
                    this.options.saveMissingTo === 'all'
                        ? (E = this.languageUtils.toResolveHierarchy(i.lng || this.language))
                        : E.push(i.lng || this.language);
                const _ = (B, K, rt) => {
                    var xn;
                    const it = w && rt !== y ? rt : oe;
                    (this.options.missingKeyHandler
                        ? this.options.missingKeyHandler(B, u, K, it, $, i)
                        : (xn = this.backendConnector) != null &&
                          xn.saveMissing &&
                          this.backendConnector.saveMissing(B, u, K, it, $, i),
                        this.emit('missingKey', B, u, K, y));
                };
                this.options.saveMissing &&
                    (this.options.saveMissingPlurals && x
                        ? E.forEach((B) => {
                              const K = this.pluralResolver.getSuffixes(B, i);
                              (k &&
                                  i[`defaultValue${this.options.pluralSeparator}zero`] &&
                                  K.indexOf(`${this.options.pluralSeparator}zero`) < 0 &&
                                  K.push(`${this.options.pluralSeparator}zero`),
                                  K.forEach((rt) => {
                                      _([B], a + rt, i[`defaultValue${rt}`] || D);
                                  }));
                          })
                        : _(E, a, D));
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
                (t = cg.handle(
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
                        !ad[`${v[0]}-${S}`] &&
                            (p = this.utils) != null &&
                            p.hasLoadedNamespace &&
                            !((h = this.utils) != null && h.hasLoadedNamespace(a)) &&
                            ((ad[`${v[0]}-${S}`] = !0),
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
                                let T;
                                d && (T = this.pluralResolver.getSuffix(g, n.count, n));
                                const k = `${this.options.pluralSeparator}zero`,
                                    D = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                                if (
                                    (d &&
                                        (n.ordinal &&
                                            T.indexOf(D) === 0 &&
                                            x.push(c + T.replace(D, this.options.pluralSeparator)),
                                        x.push(c + T),
                                        m && x.push(c + k)),
                                    y)
                                ) {
                                    const L = `${c}${this.options.contextSeparator || '_'}${n.context}`;
                                    (x.push(L),
                                        d &&
                                            (n.ordinal &&
                                                T.indexOf(D) === 0 &&
                                                x.push(
                                                    L + T.replace(D, this.options.pluralSeparator),
                                                ),
                                            x.push(L + T),
                                            m && x.push(L + k)));
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
class ld {
    constructor(t) {
        ((this.options = t),
            (this.supportedLngs = this.options.supportedLngs || !1),
            (this.logger = lt.create('languageUtils')));
    }
    getScriptPartFromCode(t) {
        if (((t = ui(t)), !t || t.indexOf('-') < 0)) return null;
        const n = t.split('-');
        return n.length === 2 || (n.pop(), n[n.length - 1].toLowerCase() === 'x')
            ? null
            : this.formatLanguageCode(n.join('-'));
    }
    getLanguagePartFromCode(t) {
        if (((t = ui(t)), !t || t.indexOf('-') < 0)) return t;
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
const ud = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 },
    cd = {
        select: (e) => (e === 1 ? 'one' : 'other'),
        resolvedOptions: () => ({ pluralCategories: ['one', 'other'] }),
    };
class DS {
    constructor(t, n = {}) {
        ((this.languageUtils = t),
            (this.options = n),
            (this.logger = lt.create('pluralResolver')),
            (this.pluralRulesCache = {}));
    }
    addRule(t, n) {
        this.rules[t] = n;
    }
    clearCache() {
        this.pluralRulesCache = {};
    }
    getRule(t, n = {}) {
        const r = ui(t === 'dev' ? 'en' : t),
            i = n.ordinal ? 'ordinal' : 'cardinal',
            s = JSON.stringify({ cleanedCode: r, type: i });
        if (s in this.pluralRulesCache) return this.pluralRulesCache[s];
        let o;
        try {
            o = new Intl.PluralRules(r, { type: i });
        } catch {
            if (!Intl)
                return (this.logger.error('No Intl support, please use an Intl polyfill!'), cd);
            if (!t.match(/-|_/)) return cd;
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
                      .pluralCategories.sort((i, s) => ud[i] - ud[s])
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
const fd = (e, t, n, r = '.', i = !0) => {
        let s = kS(e, t, n);
        return (!s && i && V(n) && ((s = nl(e, n, r)), s === void 0 && (s = nl(t, n, r))), s);
    },
    Wo = (e) => e.replace(/\$/g, '$$$$');
class dd {
    constructor(t = {}) {
        var n;
        ((this.logger = lt.create('interpolator')),
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
        ((this.escape = n !== void 0 ? n : CS),
            (this.escapeValue = r !== void 0 ? r : !0),
            (this.useRawValueToEscape = i !== void 0 ? i : !1),
            (this.prefix = s ? Sn(s) : o || '{{'),
            (this.suffix = a ? Sn(a) : l || '}}'),
            (this.formatSeparator = u || ','),
            (this.unescapePrefix = c ? '' : f || '-'),
            (this.unescapeSuffix = this.unescapePrefix ? '' : c || ''),
            (this.nestingPrefix = d ? Sn(d) : m || Sn('$t(')),
            (this.nestingSuffix = y ? Sn(y) : v || Sn(')')),
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
                    const h = fd(
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
                    fd(n, l, S, this.options.keySeparator, this.options.ignoreJSONStructure),
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
                { regex: this.regexpUnescape, safeValue: (y) => Wo(y) },
                {
                    regex: this.regexp,
                    safeValue: (y) => (this.escapeValue ? Wo(this.escape(y)) : Wo(y)),
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
                    else !V(o) && !this.useRawValueToEscape && (o = nd(o));
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
            (V(s) || (s = nd(s)),
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
const OS = (e) => {
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
    hd = (e) => {
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
            return (a || ((a = e(ui(r), i)), (t[o] = a)), a(n));
        };
    },
    MS = (e) => (t, n, r) => e(ui(n), r)(t);
class VS {
    constructor(t = {}) {
        ((this.logger = lt.create('formatter')), (this.options = t), this.init(t));
    }
    init(t, n = { interpolation: {} }) {
        this.formatSeparator = n.interpolation.formatSeparator || ',';
        const r = n.cacheInBuiltFormats ? hd : MS;
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
        this.formats[t.toLowerCase().trim()] = hd(n);
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
            const { formatName: u, formatOptions: c } = OS(l);
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
const _S = (e, t) => {
    e.pending[t] !== void 0 && (delete e.pending[t], e.pendingCount--);
};
class jS extends ro {
    constructor(t, n, r, i = {}) {
        var s, o;
        (super(),
            (this.backend = t),
            (this.store = n),
            (this.services = r),
            (this.languageUtils = r.languageUtils),
            (this.options = i),
            (this.logger = lt.create('backendConnector')),
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
            (SS(l.loaded, [s], o),
                _S(l, t),
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
const pd = () => ({
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
    md = (e) => {
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
    Bi = () => {},
    FS = (e) => {
        Object.getOwnPropertyNames(Object.getPrototypeOf(e)).forEach((n) => {
            typeof e[n] == 'function' && (e[n] = e[n].bind(e));
        });
    };
class Br extends ro {
    constructor(t = {}, n) {
        if (
            (super(),
            (this.options = md(t)),
            (this.services = {}),
            (this.logger = lt),
            (this.modules = { external: [] }),
            FS(this),
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
        const r = pd();
        ((this.options = { ...r, ...this.options, ...md(t) }),
            (this.options.interpolation = { ...r.interpolation, ...this.options.interpolation }),
            t.keySeparator !== void 0 && (this.options.userDefinedKeySeparator = t.keySeparator),
            t.nsSeparator !== void 0 && (this.options.userDefinedNsSeparator = t.nsSeparator),
            typeof this.options.overloadTranslationOptionHandler != 'function' &&
                (this.options.overloadTranslationOptionHandler =
                    r.overloadTranslationOptionHandler));
        const i = (u) => (u ? (typeof u == 'function' ? new u() : u) : null);
        if (!this.options.isClone) {
            this.modules.logger
                ? lt.init(i(this.modules.logger), this.options)
                : lt.init(null, this.options);
            let u;
            this.modules.formatter ? (u = this.modules.formatter) : (u = VS);
            const c = new ld(this.options);
            this.store = new od(this.options.resources, this.options);
            const f = this.services;
            ((f.logger = lt),
                (f.resourceStore = this.store),
                (f.languageUtils = c),
                (f.pluralResolver = new DS(c, {
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
                (f.interpolator = new dd(this.options)),
                (f.utils = { hasLoadedNamespace: this.hasLoadedNamespace.bind(this) }),
                (f.backendConnector = new jS(
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
                (this.translator = new _s(this.services, this.options)),
                this.translator.on('*', (m, ...y) => {
                    this.emit(m, ...y);
                }),
                this.modules.external.forEach((m) => {
                    m.init && m.init(this);
                }));
        }
        if (
            ((this.format = this.options.interpolation.format),
            n || (n = Bi),
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
    loadResources(t, n = Bi) {
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
        const i = vr();
        return (
            typeof t == 'function' && ((r = t), (t = void 0)),
            typeof n == 'function' && ((r = n), (n = void 0)),
            t || (t = this.languages),
            n || (n = this.options.ns),
            r || (r = Bi),
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
            t.type === 'postProcessor' && cg.addPostProcessor(t),
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
                              typeof f == 'function' && (f = rl(f, { ...this.options, ...o })),
                              `${l.keyPrefix}${u}${f}`
                          ),
                      ))
                    : (typeof s == 'function' && (s = rl(s, { ...this.options, ...o })),
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
        const r = vr();
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
        const r = vr();
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
            r = ((s = this.services) == null ? void 0 : s.languageUtils) || new ld(pd());
        return t.toLowerCase().indexOf('-latn') > 1
            ? 'ltr'
            : n.indexOf(r.getLanguagePartFromCode(t)) > -1 || t.toLowerCase().indexOf('-arab') > 1
              ? 'rtl'
              : 'ltr';
    }
    static createInstance(t = {}, n) {
        const r = new Br(t, n);
        return ((r.createInstance = Br.createInstance), r);
    }
    cloneInstance(t = {}, n = Bi) {
        const r = t.forkResourceStore;
        r && delete t.forkResourceStore;
        const i = { ...this.options, ...t, isClone: !0 },
            s = new Br(i);
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
            ((s.store = new od(a, i)), (s.services.resourceStore = s.store));
        }
        return (
            t.interpolation && (s.services.interpolator = new dd(i)),
            (s.translator = new _s(s.services, i)),
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
const Ee = Br.createInstance();
Ee.createInstance;
Ee.dir;
Ee.init;
Ee.loadResources;
Ee.reloadResources;
Ee.use;
Ee.changeLanguage;
Ee.getFixedT;
Ee.t;
Ee.exists;
Ee.setDefaultNamespace;
Ee.hasLoadedNamespace;
Ee.loadNamespaces;
Ee.loadLanguages;
const IS = (e, t, n, r) => {
        var s, o, a, l;
        const i = [n, { code: t, ...(r || {}) }];
        if (
            (o = (s = e == null ? void 0 : e.services) == null ? void 0 : s.logger) != null &&
            o.forward
        )
            return e.services.logger.forward(i, 'warn', 'react-i18next::', !0);
        (mn(i[0]) && (i[0] = `react-i18next:: ${i[0]}`),
            (l = (a = e == null ? void 0 : e.services) == null ? void 0 : a.logger) != null &&
            l.warn
                ? e.services.logger.warn(...i)
                : console != null && console.warn && console.warn(...i));
    },
    gd = {},
    dg = (e, t, n, r) => {
        (mn(n) && gd[n]) || (mn(n) && (gd[n] = new Date()), IS(e, t, n, r));
    },
    hg = (e, t) => () => {
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
    il = (e, t, n) => {
        e.loadNamespaces(t, hg(e, n));
    },
    yd = (e, t, n, r) => {
        if ((mn(n) && (n = [n]), e.options.preload && e.options.preload.indexOf(t) > -1))
            return il(e, n, r);
        (n.forEach((i) => {
            e.options.ns.indexOf(i) < 0 && e.options.ns.push(i);
        }),
            e.loadLanguages(t, hg(e, r)));
    },
    zS = (e, t, n = {}) =>
        !t.languages || !t.languages.length
            ? (dg(t, 'NO_LANGUAGES', 'i18n.languages were undefined or empty', {
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
    mn = (e) => typeof e == 'string',
    BS = (e) => typeof e == 'object' && e !== null,
    US =
        /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g,
    $S = {
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
    HS = (e) => $S[e],
    KS = (e) => e.replace(US, HS);
let sl = {
    bindI18n: 'languageChanged',
    bindI18nStore: '',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: !0,
    transWrapTextNodes: '',
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    useSuspense: !0,
    unescape: KS,
    transDefaultProps: void 0,
};
const WS = (e = {}) => {
        sl = { ...sl, ...e };
    },
    bS = () => sl;
let pg;
const GS = (e) => {
        pg = e;
    },
    QS = () => pg,
    YS = {
        type: '3rdParty',
        init(e) {
            (WS(e.options.react), GS(e));
        },
    },
    XS = N.createContext();
class ZS {
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
var mg = { exports: {} },
    gg = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var rr = N;
function JS(e, t) {
    return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var qS = typeof Object.is == 'function' ? Object.is : JS,
    ek = rr.useState,
    tk = rr.useEffect,
    nk = rr.useLayoutEffect,
    rk = rr.useDebugValue;
function ik(e, t) {
    var n = t(),
        r = ek({ inst: { value: n, getSnapshot: t } }),
        i = r[0].inst,
        s = r[1];
    return (
        nk(
            function () {
                ((i.value = n), (i.getSnapshot = t), bo(i) && s({ inst: i }));
            },
            [e, n, t],
        ),
        tk(
            function () {
                return (
                    bo(i) && s({ inst: i }),
                    e(function () {
                        bo(i) && s({ inst: i });
                    })
                );
            },
            [e],
        ),
        rk(n),
        n
    );
}
function bo(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
        var n = t();
        return !qS(e, n);
    } catch {
        return !0;
    }
}
function sk(e, t) {
    return t();
}
var ok =
    typeof window > 'u' ||
    typeof window.document > 'u' ||
    typeof window.document.createElement > 'u'
        ? sk
        : ik;
gg.useSyncExternalStore = rr.useSyncExternalStore !== void 0 ? rr.useSyncExternalStore : ok;
mg.exports = gg;
var ak = mg.exports;
const lk = (e, t) =>
        mn(t)
            ? t
            : BS(t) && mn(t.defaultValue)
              ? t.defaultValue
              : Array.isArray(e)
                ? e[e.length - 1]
                : e,
    uk = { t: lk, ready: !1 },
    ck = () => () => {},
    fk = (e, t = {}) => {
        var D, L, X;
        const { i18n: n } = t,
            { i18n: r, defaultNS: i } = N.useContext(XS) || {},
            s = n || r || QS();
        (s && !s.reportNamespaces && (s.reportNamespaces = new ZS()),
            s ||
                dg(
                    s,
                    'NO_I18NEXT_INSTANCE',
                    'useTranslation: You will need to pass in an i18next instance by using initReactI18next',
                ));
        const o = N.useMemo(() => {
                var z;
                return {
                    ...bS(),
                    ...((z = s == null ? void 0 : s.options) == null ? void 0 : z.react),
                    ...t,
                };
            }, [s, t]),
            { useSuspense: a, keyPrefix: l } = o,
            u = i || ((D = s == null ? void 0 : s.options) == null ? void 0 : D.defaultNS),
            c = mn(u) ? [u] : u || ['translation'],
            f = N.useMemo(() => c, c);
        (X =
            (L = s == null ? void 0 : s.reportNamespaces) == null ? void 0 : L.addUsedNamespaces) ==
            null || X.call(L, f);
        const d = N.useRef(0),
            m = N.useCallback(
                (z) => {
                    if (!s) return ck;
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
            y = N.useRef(),
            v = N.useCallback(() => {
                if (!s) return uk;
                const z =
                        !!(s.isInitialized || s.initializedStoreOnce) &&
                        f.every((E) => zS(E, s, o)),
                    j = t.lng || s.language,
                    F = d.current,
                    Z = y.current;
                if (Z && Z.ready === z && Z.lng === j && Z.keyPrefix === l && Z.revision === F)
                    return Z;
                const $ = {
                    t: s.getFixedT(j, o.nsMode === 'fallback' ? f : f[0], l),
                    ready: z,
                    lng: j,
                    keyPrefix: l,
                    revision: F,
                };
                return ((y.current = $), $);
            }, [s, f, l, o, t.lng]),
            [S, p] = N.useState(0),
            { t: h, ready: g } = ak.useSyncExternalStore(m, v, v);
        N.useEffect(() => {
            if (s && !g && !a) {
                const z = () => p((j) => j + 1);
                t.lng ? yd(s, t.lng, f, z) : il(s, f, z);
            }
        }, [s, t.lng, f, g, a, S]);
        const x = s || {},
            w = N.useRef(null),
            P = N.useRef(),
            T = (z) => {
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
            k = N.useMemo(() => {
                const z = x,
                    j = z == null ? void 0 : z.language;
                let F = z;
                z &&
                    (w.current && w.current.__original === z
                        ? P.current !== j
                            ? ((F = T(z)), (w.current = F), (P.current = j))
                            : (F = w.current)
                        : ((F = T(z)), (w.current = F), (P.current = j)));
                const Z = [h, F, g];
                return ((Z.t = h), (Z.i18n = F), (Z.ready = g), Z);
            }, [h, x, g, x.resolvedLanguage, x.language, x.languages]);
        if (s && a && !g)
            throw new Promise((z) => {
                const j = () => z();
                t.lng ? yd(s, t.lng, f, j) : il(s, f, j);
            });
        return k;
    };
function dk() {
    const { t: e, i18n: t } = fk(),
        n = () => {
            const r = t.language.startsWith('es') ? 'en' : 'es';
            t.changeLanguage(r);
        };
    return A.jsxs('div', {
        className:
            'relative min-h-screen bg-slate-900 text-white overflow-hidden font-mono selection:bg-hal-primary-500/30',
        children: [
            A.jsx('style', {
                dangerouslySetInnerHTML: {
                    __html: `
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');
        body { margin: 0; cursor: default; }
        .font-mono { font-family: 'Geist Mono', monospace; }
      `,
                },
            }),
            A.jsx('div', {
                className: 'absolute inset-0 z-0 opacity-20 pointer-events-none',
                children: A.jsx('img', {
                    src: '/video/base1.gif',
                    alt: 'Background Animation',
                    className: 'w-full h-full object-cover',
                }),
            }),
            A.jsx('div', {
                className:
                    'absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.4)_0%,#0f172a_100%)] mix-blend-multiply',
            }),
            A.jsx('div', {
                className: 'absolute inset-0 z-0 opacity-10 pointer-events-none',
                style: {
                    backgroundImage:
                        'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                },
            }),
            A.jsxs('nav', {
                className:
                    'absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-center',
                children: [
                    A.jsxs(Ye.div, {
                        initial: { opacity: 0, y: -20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.5 },
                        className: 'flex items-center gap-3',
                        children: [
                            A.jsx('img', {
                                src: '/images/haltest_logo.jpeg',
                                alt: 'HAL-TEST',
                                className: 'w-8 h-8 rounded-md shadow-lg shadow-hal-primary-500/20',
                            }),
                            A.jsxs('div', {
                                className: 'text-xl font-bold tracking-widest flex gap-1',
                                children: [
                                    A.jsx('span', {
                                        className: 'text-hal-primary-400',
                                        children: 'HAL',
                                    }),
                                    A.jsx('span', { className: 'text-white/30', children: '-' }),
                                    A.jsx('span', {
                                        className: 'text-hal-warning-400',
                                        children: 'TEST',
                                    }),
                                ],
                            }),
                        ],
                    }),
                    A.jsxs(Ye.div, {
                        initial: { opacity: 0, y: -20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.5, delay: 0.1 },
                        className:
                            'hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500',
                        children: [
                            A.jsx('span', {
                                className:
                                    'hover:text-hal-primary-400 cursor-pointer transition-colors',
                                children: 'Docs',
                            }),
                            A.jsx('span', {
                                className:
                                    'hover:text-hal-primary-400 cursor-pointer transition-colors',
                                children: 'Roadmap',
                            }),
                            A.jsx('span', {
                                className:
                                    'hover:text-hal-primary-400 cursor-pointer transition-colors',
                                children: 'Pricing',
                            }),
                        ],
                    }),
                    A.jsxs(Ye.div, {
                        initial: { opacity: 0, y: -20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.5, delay: 0.2 },
                        className: 'flex items-center gap-6',
                        children: [
                            A.jsx('button', {
                                onClick: n,
                                className:
                                    'text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors',
                                children: t.language.startsWith('es') ? 'EN' : 'ES',
                            }),
                            A.jsxs('div', {
                                className:
                                    'flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10',
                                children: [
                                    A.jsx('div', {
                                        className:
                                            'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse',
                                    }),
                                    A.jsx('span', {
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
            A.jsxs('main', {
                className:
                    'relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-20',
                children: [
                    A.jsxs(Ye.div, {
                        initial: { opacity: 0, scale: 0.8 },
                        animate: { opacity: 1, scale: 1 },
                        transition: { duration: 0.8, ease: 'easeOut' },
                        className: 'mb-8 relative',
                        children: [
                            A.jsx('div', {
                                className:
                                    'absolute inset-0 bg-hal-primary-500/20 blur-3xl rounded-full',
                            }),
                            A.jsx('img', {
                                src: '/images/haltest_logo.jpeg',
                                alt: 'Hero Logo',
                                className:
                                    'w-32 h-32 md:w-32 md:h-32 rounded-2xl shadow-2xl shadow-hal-primary-500/30 relative z-10 border border-white/10',
                            }),
                        ],
                    }),
                    A.jsxs(Ye.h1, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.6, delay: 0.2 },
                        className:
                            'text-5xl md:text-7xl font-bold uppercase tracking-tight mb-4 max-w-4xl',
                        children: [
                            A.jsx('span', {
                                className:
                                    'bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50',
                                children: 'The Missing Link',
                            }),
                            A.jsx('br', {}),
                            A.jsx('span', {
                                className: 'text-hal-primary-400',
                                children: 'in Automation',
                            }),
                        ],
                    }),
                    A.jsxs(Ye.p, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.6, delay: 0.3 },
                        className:
                            'text-lg md:text-xl text-slate-300 max-w-2xl mb-4 leading-relaxed font-bold',
                        children: [
                            'No-code flow builder with AI-powered healing',
                            A.jsx('br', {}),
                            'and real-time Playwright execution.',
                        ],
                    }),
                    A.jsx(Ye.p, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.6, delay: 0.35 },
                        className: 'text-sm md:text-base text-slate-500 max-w-lg mb-12',
                        children:
                            e('hero.subtitle') ||
                            'Unified platform for visual workflows, mock services, and intelligent testing.',
                    }),
                    A.jsxs(Ye.div, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.6, delay: 0.4 },
                        className: 'flex flex-col sm:flex-row gap-4 items-center mb-16',
                        children: [
                            A.jsxs(Ye.button, {
                                whileHover: { scale: 1.05 },
                                whileTap: { scale: 0.95 },
                                onClick: () => window.open('/app', '_self'),
                                className:
                                    'group relative px-8 py-4 bg-hal-primary-600 hover:bg-hal-primary-500 text-white rounded-lg font-bold uppercase tracking-wider overflow-hidden transition-all shadow-lg shadow-hal-primary-900/50',
                                children: [
                                    A.jsxs('span', {
                                        className: 'relative z-10 flex items-center gap-2',
                                        children: [
                                            e('cta.launch_app') || 'Launch App',
                                            A.jsxs('svg', {
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
                                                    A.jsx('path', { d: 'M5 12h14' }),
                                                    A.jsx('path', { d: 'm12 5 7 7-7 7' }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    A.jsx('div', {
                                        className:
                                            'absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700',
                                    }),
                                ],
                            }),
                            A.jsx(Ye.button, {
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
                        ],
                    }),
                    A.jsxs(Ye.div, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.8, delay: 0.5 },
                        className:
                            'grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/5 pt-8',
                        children: [
                            A.jsxs('div', {
                                className: 'flex flex-col items-center',
                                children: [
                                    A.jsx('span', {
                                        className: 'text-2xl font-bold text-white',
                                        children: '2.5k+',
                                    }),
                                    A.jsx('span', {
                                        className:
                                            'text-[10px] uppercase tracking-widest text-slate-500',
                                        children: 'Flows Executed',
                                    }),
                                ],
                            }),
                            A.jsxs('div', {
                                className: 'flex flex-col items-center',
                                children: [
                                    A.jsx('span', {
                                        className: 'text-2xl font-bold text-white',
                                        children: '45+',
                                    }),
                                    A.jsx('span', {
                                        className:
                                            'text-[10px] uppercase tracking-widest text-slate-500',
                                        children: 'Node Types',
                                    }),
                                ],
                            }),
                            A.jsxs('div', {
                                className: 'flex flex-col items-center',
                                children: [
                                    A.jsx('span', {
                                        className: 'text-2xl font-bold text-white',
                                        children: '99%',
                                    }),
                                    A.jsx('span', {
                                        className:
                                            'text-[10px] uppercase tracking-widest text-slate-500',
                                        children: 'Success Rate',
                                    }),
                                ],
                            }),
                            A.jsxs('div', {
                                className: 'flex flex-col items-center',
                                children: [
                                    A.jsx('span', {
                                        className: 'text-2xl font-bold text-white',
                                        children: 'Open',
                                    }),
                                    A.jsx('span', {
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
const { slice: hk, forEach: pk } = [];
function mk(e) {
    return (
        pk.call(hk.call(arguments, 1), (t) => {
            if (t) for (const n in t) e[n] === void 0 && (e[n] = t[n]);
        }),
        e
    );
}
function gk(e) {
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
const vd = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/,
    yk = function (e, t) {
        const r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : { path: '/' },
            i = encodeURIComponent(t);
        let s = `${e}=${i}`;
        if (r.maxAge > 0) {
            const o = r.maxAge - 0;
            if (Number.isNaN(o)) throw new Error('maxAge should be a Number');
            s += `; Max-Age=${Math.floor(o)}`;
        }
        if (r.domain) {
            if (!vd.test(r.domain)) throw new TypeError('option domain is invalid');
            s += `; Domain=${r.domain}`;
        }
        if (r.path) {
            if (!vd.test(r.path)) throw new TypeError('option path is invalid');
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
    xd = {
        create(e, t, n, r) {
            let i =
                arguments.length > 4 && arguments[4] !== void 0
                    ? arguments[4]
                    : { path: '/', sameSite: 'strict' };
            (n && ((i.expires = new Date()), i.expires.setTime(i.expires.getTime() + n * 60 * 1e3)),
                r && (i.domain = r),
                (document.cookie = yk(e, t, i)));
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
var vk = {
        name: 'cookie',
        lookup(e) {
            let { lookupCookie: t } = e;
            if (t && typeof document < 'u') return xd.read(t) || void 0;
        },
        cacheUserLanguage(e, t) {
            let { lookupCookie: n, cookieMinutes: r, cookieDomain: i, cookieOptions: s } = t;
            n && typeof document < 'u' && xd.create(n, e, r, i, s);
        },
    },
    xk = {
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
    wk = {
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
let kn = null;
const wd = () => {
    if (kn !== null) return kn;
    try {
        if (((kn = typeof window < 'u' && window.localStorage !== null), !kn)) return !1;
        const e = 'i18next.translate.boo';
        (window.localStorage.setItem(e, 'foo'), window.localStorage.removeItem(e));
    } catch {
        kn = !1;
    }
    return kn;
};
var Sk = {
    name: 'localStorage',
    lookup(e) {
        let { lookupLocalStorage: t } = e;
        if (t && wd()) return window.localStorage.getItem(t) || void 0;
    },
    cacheUserLanguage(e, t) {
        let { lookupLocalStorage: n } = t;
        n && wd() && window.localStorage.setItem(n, e);
    },
};
let Pn = null;
const Sd = () => {
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
var kk = {
        name: 'sessionStorage',
        lookup(e) {
            let { lookupSessionStorage: t } = e;
            if (t && Sd()) return window.sessionStorage.getItem(t) || void 0;
        },
        cacheUserLanguage(e, t) {
            let { lookupSessionStorage: n } = t;
            n && Sd() && window.sessionStorage.setItem(n, e);
        },
    },
    Pk = {
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
    Ck = {
        name: 'htmlTag',
        lookup(e) {
            let { htmlTag: t } = e,
                n;
            const r = t || (typeof document < 'u' ? document.documentElement : null);
            return (r && typeof r.getAttribute == 'function' && (n = r.getAttribute('lang')), n);
        },
    },
    Tk = {
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
    Ek = {
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
let yg = !1;
try {
    (document.cookie, (yg = !0));
} catch {}
const vg = ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'];
yg || vg.splice(1, 1);
const Lk = () => ({
    order: vg,
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    lookupSessionStorage: 'i18nextLng',
    caches: ['localStorage'],
    excludeCacheFor: ['cimode'],
    convertDetectedLanguage: (e) => e,
});
class xg {
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
            (this.options = mk(n, this.options || {}, Lk())),
            typeof this.options.convertDetectedLanguage == 'string' &&
                this.options.convertDetectedLanguage.indexOf('15897') > -1 &&
                (this.options.convertDetectedLanguage = (i) => i.replace('-', '_')),
            this.options.lookupFromUrlIndex &&
                (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
            (this.i18nOptions = r),
            this.addDetector(vk),
            this.addDetector(xk),
            this.addDetector(Sk),
            this.addDetector(kk),
            this.addDetector(Pk),
            this.addDetector(Ck),
            this.addDetector(Tk),
            this.addDetector(Ek),
            this.addDetector(wk));
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
                .filter((r) => r != null && !gk(r))
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
xg.type = 'languageDetector';
const Rk = {
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
Ee.use(xg)
    .use(YS)
    .init({
        resources: Rk,
        fallbackLng: 'en',
        interpolation: { escapeValue: !1 },
        detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    });
Go.createRoot(document.getElementById('root')).render(
    A.jsx(jg.StrictMode, { children: A.jsx(dk, {}) }),
);
