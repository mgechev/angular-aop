;(function (undef) {

    var AngularAop = angular.module('AngularAOP', []);

    /**
     * Service which give access to the pointcuts.
     */
    AngularAop.factory('execute', ['$q', function Base($q) {

        var slice = Array.prototype.slice,

            //Cross-browser trim function
            trim = (function () {
                var trimFunction;
                if (typeof String.prototype.trim === 'function') {
                    trimFunction = String.prototype.trim;
                } else {
                    trimFunction = function () {
                        return this === null ?
                            '' :
                            (this + '').replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
                    };
                }
                return trimFunction;
            }()),

            //Default regular expression for matching arguments and method names
            defaultRule = /.*/;

            //Defines all joint points
            POINTCUTS = {
                BEFORE: 'Before',
                AFTER: 'After',
                AROUND: 'Around',
                ON_THROW: 'OnThrow',
                ON_RESOLVE: 'OnResolve',
                AFTER_RESOLVE: 'AfterResolve',
                ON_REJECT: 'OnReject'
            },

            //Contains all aspects (pointcut + advice)
            Aspects = {},

            //Builds specified aspect
            AspectBuilder = {
                buildAspect: function (advice, pointcut) {
                    var self = this;
                    return function (jp, rules) {
                        if (typeof jp === 'function') {
                            return self._getFunctionAspect(jp, pointcut, advice);
                        } else if (jp) {
                            return self._getObjectAspect(jp, rules || {}, pointcut, advice);
                        }
                    };
                },
                _getFunctionAspect: function (method, pointcut, advice, methodName) {
                    methodName = methodName || this._getMethodName(method);
                    var aspect = new Aspects[pointcut](advice),
                        wrapper = function __angularAOPWrapper__() {
                            var args = slice.call(arguments);
                            args = [this, method, methodName].concat(args);
                            return aspect._wrapper.apply(aspect, args);
                        };
                    wrapper.originalMethod = method;
                    aspect.setWrapper(wrapper);
                    return wrapper;
                },
                _getMethodName: function (method) {
                    return (/function\s+(.*?)\s*\(/).exec(method.toString())[1];
                },
                _getObjectAspect: function (obj, rules, pointcut, advice) {
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop) &&
                            typeof obj[prop] === 'function' && obj[prop] != null &&
                            this._matchRules(obj, prop, rules)) {
                            obj[prop] = this._getFunctionAspect(obj[prop], pointcut, advice, prop);
                        }
                    }
                    return obj;
                },
                _matchRules: function (obj, prop, rules) {
                    var methodPattern = rules.methodPattern || defaultRule,
                        argsPatterns = rules.argsPatterns || [],
                        method = obj[prop],
                        tokens = this._parseMethod(method, prop),
                        passed = true;
                    while (tokens.when === '__angularAOPWrapper__') {
                        method = method.originalMethod;
                        tokens = this._parseMethod(method, prop);
                    }
                    return methodPattern.test(tokens.method) && this._matchArguments(argsPatterns, tokens);
                },
                _matchArguments: function (argsPatterns, tokens) {
                    var passed = true;
                    angular.forEach(tokens.args, function (arg, idx) {
                        var rule = argsPatterns[idx] || defaultRule;
                        if (!rule.test(arg)) {
                            passed = false;
                            return;
                        }
                    });
                    return passed;
                },
                _parseMethod: function (method, prop) {
                    var result = { method: prop },
                        parts = method.toString().match(/function\s+([^\(]*)\s*\(([^\)]*)\)/) || [];
                    if (parts && parts[2]) {
                        result.args = parts[2].split(',').map(function (arg) { //TODO to not use map
                            return trim.call(arg);
                        });
                    } else {
                        result.args = [];
                    }
                    result.when = parts[1];
                    return result;
                }
            };



        function Aspect(advice, methodName) {
            this._advice = advice;
            this._wrapperFunc = null;
            this._methodName = methodName;
        }

        Aspect.prototype.setWrapper = function (w) {
            this._wrapperFunc = w;
        };

        Aspect.prototype._wrapper = function () {
            throw 'Not implemented';
        };

        Aspect.prototype.invoke = function (context, args, extraParams) {
            var method,
                params = angular.extend({}, extraParams),
                wrapper = this._wrapperFunc,
                methodName = args.shift();
            params.when = this.when;
            params.method = methodName;
            params.args = args;
            return this._advice.call(context, params);
        };

        Aspects[POINTCUTS.BEFORE] = function () {
            Aspect.apply(this, arguments);
            this.when = 'before';
        };
        Aspects[POINTCUTS.BEFORE].prototype = Object.create(Aspect.prototype);
        Aspects[POINTCUTS.BEFORE].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift();
            this.invoke(context, args);
            return method.apply(context, args);
        };

        Aspects[POINTCUTS.AFTER] = function () {
            Aspect.apply(this, arguments);
            this.when = 'after';
        };
        Aspects[POINTCUTS.AFTER].prototype = Object.create(Aspect.prototype);
        Aspects[POINTCUTS.AFTER].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                result = method.apply(context, args),
                adviceArgs = [result];
            this.invoke(context, args.concat(adviceArgs));
            return result;
        };

        Aspects[POINTCUTS.AROUND] = function () {
            Aspect.apply(this, arguments);
            this.when = 'around';
        };
        Aspects[POINTCUTS.AROUND].prototype = Object.create(Aspect.prototype);
        Aspects[POINTCUTS.AROUND].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                adviceArgs, result;
            this.invoke(context, args);
            result = method.apply(context, args);
            adviceArgs = [result];
            this.invoke(context, adviceArgs.concat(args));
            return result;
        };

        Aspects[POINTCUTS.ON_THROW] = function () {
            Aspect.apply(this, arguments);
            this.when = 'onThrow';
        };
        Aspects[POINTCUTS.ON_THROW].prototype = Object.create(Aspect.prototype);
        Aspects[POINTCUTS.ON_THROW].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                adviceArgs = args,
                result;
            try {
                result = method.apply(context, args);
            } catch (e) {
                this.invoke(context, adviceArgs, { exception: e });
            }
            return result;
        };

        Aspects[POINTCUTS.ON_RESOLVE] = function () {
            Aspect.apply(this, arguments);
            this.when = 'onResolve';
        };
        Aspects[POINTCUTS.ON_RESOLVE].prototype = Object.create(Aspect.prototype);
        Aspects[POINTCUTS.ON_RESOLVE].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                promise = method.apply(context, args),
                self = this;
            if (promise) {
                promise.then(function () {
                    self.invoke(context, slice.call(arguments));
                });
            }
            return promise;
        };

        Aspects[POINTCUTS.AFTER_RESOLVE] = function () {
            Aspect.apply(this, arguments);
            this.when = 'afterResolve';
        };
        Aspects[POINTCUTS.AFTER_RESOLVE].prototype = Object.create(Aspect.prototype);
        Aspects[POINTCUTS.AFTER_RESOLVE].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                deferred = $q.defer(),
                innerPromise = deferred.promise,
                promise = method.apply(context, args),
                self = this;
            promise.then(function () {
                var callbackArgs = slice.call(arguments);
                innerPromise.then(function () {
                    self.invoke(context, callbackArgs);
                });
                deferred.resolve();
            });
            return innerPromise;
        };

        Aspects[POINTCUTS.ON_REJECT] = function () {
            Aspect.apply(this, arguments);
            this.when = 'onReject';
        };
        Aspects[POINTCUTS.ON_REJECT].prototype = Object.create(Aspect.prototype);
        Aspects[POINTCUTS.ON_REJECT].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                promise = method.apply(context, args),
                self = this;
            if (promise) {
                promise.then(undef, function () {
                    self.invoke(context, slice.call(arguments));
                });
            }
            return promise;
        };

        /**
         * Defines and implements the different advices.
         *
         * @constructor
         * @private
         * @param {Function} advice The advice which should be applied in the specified joint-point(s)
         */
        function AspectCollection(advice) {
            this.before = AspectBuilder.buildAspect(advice, POINTCUTS.BEFORE);
            this.after = AspectBuilder.buildAspect(advice, POINTCUTS.AFTER);
            this.around = AspectBuilder.buildAspect(advice, POINTCUTS.AROUND);
            this.onThrowOf = AspectBuilder.buildAspect(advice, POINTCUTS.ON_THROW);
            this.onResolveOf = AspectBuilder.buildAspect(advice, POINTCUTS.ON_RESOLVE);
            this.afterResolveOf = AspectBuilder.buildAspect(advice, POINTCUTS.AFTER_RESOLVE);
            this.onRejectOf = AspectBuilder.buildAspect(advice, POINTCUTS.ON_REJECT);
        }

        return function (advice) {
            return new AspectCollection(advice);
        };
    }]);

}(undefined));
