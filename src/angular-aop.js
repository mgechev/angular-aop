(function (undef) {

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

            //Defines all advice types
            ADVICE_TYPES = {
                BEFORE: 'Before',
                AFTER: 'After',
                AROUND: 'Around',
                ON_THROW: 'OnThrow',
                ON_RESOLVE: 'OnResolve',
                AFTER_RESOLVE: 'AfterResolve',
                ON_REJECT: 'OnReject'
            },

            //Contains all advices
            Advices = {},

            //Builds specified advice
            AdviceBuilder = {
                buildAdvice: function (aspect, adviceType) {
                    var self = this;
                    return function (jp, rules) {
                        if (typeof jp === 'function') {
                            return self._getFunctionAdvice(jp, adviceType, aspect);
                        } else if (jp) {
                            return self._getObjectAdvice(jp, rules || {}, adviceType, aspect);
                        }
                    };
                },
                _getFunctionAdvice: function (method, adviceType, aspect) {
                    var advice = new Advices[adviceType](aspect);
                        wrapper = function $angularAOPWrapper() {
                            var args = slice.call(arguments);
                            args = [this, method].concat(args);
                            return advice._wrapper.apply(advice, args);
                        };
                    wrapper.originalMethod = method;
                    advice.setAdvice(wrapper);
                    return wrapper;
                },
                _getObjectAdvice: function (obj, rules, adviceType, aspect) {
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop) &&
                            typeof obj[prop] === 'function' &&
                            this._matchRules(obj, prop, rules)) {
                            obj[prop] = this._getFunctionAdvice(obj[prop], adviceType, aspect);
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
                    while (tokens.name === '$angularAOPWrapper') {
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
                    result.name = parts[1];
                    return result;
                }
            };



        function Advice(aspect) {
            this._aspect = aspect;
            this._advice = null;
        }

        Advice.prototype.setAdvice = function (advice) {
            this._advice = advice;
        };

        Advice.prototype._wrapper = function () {
            throw 'Not implemented';
        };

        Advice.prototype.invoke = function (context, args, extraParams) {
            var method,
                params = angular.extend({}, extraParams),
                advice = this._advice;
            while (advice.originalMethod)
                advice = advice.originalMethod;
            for (var prop in context) {
                var temp = context[prop];
                while (temp.originalMethod)
                    temp = temp.originalMethod;
                if (temp === advice)
                    method = prop;
            }
            params.name = this.name;
            params.method = method;
            params.args = args;
            return this._aspect.call(context, params);
        };

        Advices[ADVICE_TYPES.BEFORE] = function () {
            Advice.apply(this, arguments);
            this.name = 'before';
        };
        Advices[ADVICE_TYPES.BEFORE].prototype = Object.create(Advice.prototype);
        Advices[ADVICE_TYPES.BEFORE].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift();
            this.invoke(context, args);
            return method.apply(context, args);
        };

        Advices[ADVICE_TYPES.AFTER] = function () {
            Advice.apply(this, arguments);
            this.name = 'after';
        };
        Advices[ADVICE_TYPES.AFTER].prototype = Object.create(Advice.prototype);
        Advices[ADVICE_TYPES.AFTER].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                result = method.apply(context, args),
                aspectArgs = [result];
            this.invoke(context, aspectArgs.concat(args));
            return result;
        };

        Advices[ADVICE_TYPES.AROUND] = function () {
            Advice.apply(this, arguments);
            this.name = 'around';
        };
        Advices[ADVICE_TYPES.AROUND].prototype = Object.create(Advice.prototype);
        Advices[ADVICE_TYPES.AROUND].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                aspectArgs, result;
            this.invoke(context, args);
            result = method.apply(context, args);
            aspectArgs = [result];
            this.invoke(context, aspectArgs.concat(args));
            return result;
        };

        Advices[ADVICE_TYPES.ON_THROW] = function () {
            Advice.apply(this, arguments);
            this.name = 'onThrow';
        };
        Advices[ADVICE_TYPES.ON_THROW].prototype = Object.create(Advice.prototype);
        Advices[ADVICE_TYPES.ON_THROW].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                aspectArgs = args,
                result;
            try {
                result = method.call(context, args);
            } catch (e) {
                this.invoke(context, aspectArgs, { exception: e });
            }
            return result;
        };

        Advices[ADVICE_TYPES.ON_RESOLVE] = function () {
            Advice.apply(this, arguments);
            this.name = 'onResolve';
        };
        Advices[ADVICE_TYPES.ON_RESOLVE].prototype = Object.create(Advice.prototype);
        Advices[ADVICE_TYPES.ON_RESOLVE].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                promise = method.apply(context, args),
                self = this;
            promise.then(function () {
                self.invoke(context, slice.call(arguments));
            });
            return promise;
        };

        Advices[ADVICE_TYPES.AFTER_RESOLVE] = function () {
            Advice.apply(this, arguments);
            this.name = 'afterResolve';
        };
        Advices[ADVICE_TYPES.AFTER_RESOLVE].prototype = Object.create(Advice.prototype);
        Advices[ADVICE_TYPES.AFTER_RESOLVE].prototype._wrapper = function () {
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

        Advices[ADVICE_TYPES.ON_REJECT] = function () {
            Advice.apply(this, arguments);
            this.name = 'onReject';
        };
        Advices[ADVICE_TYPES.ON_REJECT].prototype = Object.create(Advice.prototype);
        Advices[ADVICE_TYPES.ON_REJECT].prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                promise = method.apply(context, args),
                self = this;
            promise.then(undef, function () {
                self.invoke(context, slice.call(arguments));
            });
            return promise;
        };

        /**
         * Defines and implements the different advices.
         *
         * @constructor
         * @private
         * @param {Function} aspect The join point to which the advice should be applied
         */
        function AdviceCollection(aspect) {
            this.before = AdviceBuilder.buildAdvice(aspect, ADVICE_TYPES.BEFORE);
            this.after = AdviceBuilder.buildAdvice(aspect, ADVICE_TYPES.AFTER);
            this.onThrowOf = AdviceBuilder.buildAdvice(aspect, ADVICE_TYPES.ON_THROW);
            this.onResolveOf = AdviceBuilder.buildAdvice(aspect, ADVICE_TYPES.ON_RESOLVE);
            this.afterResolveOf = AdviceBuilder.buildAdvice(aspect, ADVICE_TYPES.AFTER_RESOLVE);
            this.onRejectOf = AdviceBuilder.buildAdvice(aspect, ADVICE_TYPES.ON_REJECT);
        }

        return function (aspect) {
            return new AdviceCollection(aspect);
        };
    }]);

}(undefined));
