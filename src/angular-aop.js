var AngularAop = angular.module('AngularAOP', []);

(function (undef) {
    /**
     * Service which give access to the pointcuts.
     */
    AngularAop.factory('execute', ['$q', function Base($q) {

        var slice = Array.prototype.slice,
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
            defaultRule = /.*/;

        function Advice(aspect) {
            this._aspect = aspect;
        }

        Advice.prototype.getAdvice = function () {
            var self = this;
            return function (jp, rules) {
                if (typeof jp === 'function') {
                    return self._getFunctionAdvice(jp);
                } else if (jp) {
                    return self._getObjectAdvice(jp, rules || {});
                }
            };
        };

        Advice.prototype._getFunctionAdvice = function (method) {
            var self = this,
                wrapper = function $angularAOPWrapper() {
                    var args = slice.call(arguments);
                    args = [this, method].concat(args);
                    return self._wrapper.apply(self, args);
                };
            wrapper.originalMethod = method;
            return wrapper;
        };

        Advice.prototype._getObjectAdvice = function (obj, rules) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop) &&
                    typeof obj[prop] === 'function' &&
                    this._matchRules(obj, prop, rules)) {
                    obj[prop] = this._getFunctionAdvice(obj[prop]);
                }
            }
            return obj;
        };

        Advice.prototype._matchRules = function (obj, prop, rules) {
            var methodPattern = rules.methodPattern || defaultRule,
                argsPatterns = rules.argsPatterns || [],
                method = obj[prop],
                tokens = this._parseMethod(method, prop),
                passed = true;
            while (tokens.name === '$angularAOPWrapper') {
                method = obj[prop].originalMethod;
                tokens = this._parseMethod(method, prop);
            }
            return methodPattern.test(tokens.method) && this._matchArguments(argsPatterns, tokens);
        };

        Advice.prototype._matchArguments = function (argsPatterns, tokens) {
            var passed = true;
            tokens.args.forEach(function (arg, idx) {
                var rule = argsPatterns[idx] || defaultRule;
                if (!rule.test(arg)) {
                    passed = false;
                    return;
                }
            });
            return passed;
        };

        Advice.prototype._parseMethod = function (method, prop) {
            var result = { method: prop },
                parts = method.toString().match(/function\s+([^\(]*)\s*\(([^\)]*)\)/) || [];
            if (parts && parts[2]) {
                result.args = parts[2].split(',').map(function (arg) {
                    return arg.trim();
                });
            } else {
                result.args = [];
            }
            result.name = parts[1];
            return result;
        };

        Advice.prototype._wrapper = function () {
            throw 'Not implemented';
        };

        function Before() {
            Advice.apply(this, arguments);
        }
        Before.prototype = Object.create(Advice.prototype);
        Before.prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift();
            this._aspect.apply(context, args);
            return method.apply(context, args);
        };

        function After() {
            Advice.apply(this, arguments);
        }
        After.prototype = Object.create(Advice.prototype);
        After.prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                result = method.apply(context, args),
                aspectArgs = [result];
            this._aspect.apply(context, aspectArgs.concat(args));
            return result;
        };

        function Around() {
            Advice.apply(this, arguments);
        }
        Around.prototype = Object.create(Advice.prototype);
        Around.prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                aspectArgs, result;
            this._aspect.apply(context, args);
            result = method.apply(context, args);
            aspectArgs = [result];
            this._aspect.apply(context, aspectArgs.concat(args));
            return result;
        };

        function OnThrow() {
            Advice.apply(this, arguments);
        }
        OnThrow.prototype = Object.create(Advice.prototype);
        OnThrow.prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                aspectArgs = args;
            try {
                method.call(context, args);
            } catch (e) {
                aspectArgs.unshift(e);
                this._aspect.apply(context, aspectArgs);
            }
        };

        function OnResolve() {
            Advice.apply(this, arguments);
        }
        OnResolve.prototype = Object.create(Advice.prototype);
        OnResolve.prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                promise = method.apply(context, args),
                self = this;
            promise.then(function () {
                self._aspect.apply(context, slice.call(arguments));
            });
            return promise;
        };

        function AfterResolve() {
            Advice.apply(this, arguments);
        }
        AfterResolve.prototype = Object.create(Advice.prototype);
        AfterResolve.prototype._wrapper = function () {
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
                    self._aspect.apply(context, callbackArgs);
                });
                deferred.resolve();
            });
            return innerPromise;
        };

        function OnReject() {
            Advice.apply(this, arguments);
        }
        OnReject.prototype = Object.create(Advice.prototype);
        OnReject.prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                method = args.shift(),
                promise = method.apply(context, args),
                self = this;
            promise.then(undef, function () {
                self._aspect.apply(context, slice.call(arguments));
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
            this.before = new Before(aspect).getAdvice();
            this.after = new After(aspect).getAdvice();
            this.around = new Around(aspect).getAdvice();
            this.onThrowOf = new OnThrow(aspect).getAdvice();
            this.onResolveOf = new OnResolve(aspect).getAdvice();
            this.afterResolveOf = new AfterResolve(aspect).getAdvice();
            this.onRejectOf = new OnReject(aspect).getAdvice();
        }

        return function (aspect) {
            return new AdviceCollection(aspect);
        };
    }]);

}(undefined));
