var AngularAop = angular.module('AngularAOP', []);

(function (undef) {
    /**
     * Service which give access to the pointcuts.
     */
    AngularAop.factory('execute', ['$q', function Base($q) {

        var slice = Array.prototype.slice;

        function Advice(aspect) {
            this._aspect = aspect;
        }

        Advice.prototype.getAdvice = function () {
            var self = this;
            return function (jointPoint) {
                if (typeof jointPoint === 'function') {
                    return self._getFunctionAdvice(jointPoint);
                } else if (jointPoint) {
                    return self._getObjectAdvice(jointPoint);
                }
            };
        };

        Advice.prototype._getFunctionAdvice = function (jointPoint) {
            var self = this;
            return function () {
                var args = slice.call(arguments);
                args = [this, jointPoint].concat(args);
                return self._wrapper.apply(self, args);
            };
        };

        Advice.prototype._getObjectAdvice = function (jointPoint) {
            for (var prop in jointPoint) {
                if (jointPoint.hasOwnProperty(prop) &&
                    typeof jointPoint[prop] === 'function') {
                    jointPoint[prop] = this._getFunctionAdvice(jointPoint[prop]);
                }
            }
            return jointPoint;
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
                jointPoint = args.shift();
            this._aspect.apply(context, args);
            return jointPoint.apply(context, args);
        };

        function After() {
            Advice.apply(this, arguments);
        }
        After.prototype = Object.create(Advice.prototype);
        After.prototype._wrapper = function () {
            var args = slice.call(arguments),
                context = args.shift(),
                jointPoint = args.shift(),
                result = jointPoint.apply(context, args),
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
                jointPoint = args.shift(),
                aspectArgs, result;
            this._aspect.apply(context, args);
            result = jointPoint.apply(context, args);
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
                jointPoint = args.shift(),
                aspectArgs = args;
            try {
                jointPoint.call(context, args);
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
                jointPoint = args.shift(),
                promise = jointPoint.apply(context, args),
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
                jointPoint = args.shift(),
                deferred = $q.defer(),
                innerPromise = deferred.promise,
                promise = jointPoint.apply(context, args),
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
                jointPoint = args.shift(),
                promise = jointPoint.apply(context, args),
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
