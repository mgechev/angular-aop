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
                self._wrapper.apply(self, args);
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

        /**
         * Defines and implements the different advices.
         *
         * @constructor
         * @private
         * @param {Function} aspect The join point to which the advice should be applied
         */
        function Advices(aspect) {

            this.before = new Before(aspect).getAdvice();
            this.after = new After(aspect).getAdvice();
            this.around = new Around(aspect).getAdvice();

            this.onThrowOf = function (jointPoint) {
                return function () {
                    var args = slice.call(arguments),
                        aspectArgs = args;
                    try {
                        jointPoint.call(this, args);
                    } catch (e) {
                        aspectArgs.unshift(e);
                        self._aspect.apply(this, aspectArgs);
                    }
                };
            };

            this.onResolveOf = function (jointPoint) {
                return function () {
                    var args = slice.call(arguments),
                        promise = jointPoint.apply(this, args);
                    promise.then(function () {
                        self._aspect.apply(this, slice.call(arguments));
                    });
                    return promise;
                };
            };

            this.afterResolveOf = function (jointPoint) {
                return function () {
                    var deferred = $q.defer(),
                        innerPromise = deferred.promise,
                        args = slice.call(arguments),
                        promise = jointPoint.apply(this, args);
                    promise.then(function () {
                        var callbackArgs = slice.call(arguments);
                        innerPromise.then(function () {
                            self._aspect.apply(this, callbackArgs);
                        });
                        deferred.resolve();
                    });
                    return innerPromise;
                };
            };

            this.onRejectOf = function (jointPoint) {
                return function () {
                    var args = slice.call(arguments),
                        promise = jointPoint.apply(this, args);
                    promise.then(undef, function () {
                        self._aspect.apply(this, slice.call(arguments));
                    });
                    return promise;
                };
            };
        }

        return function (aspect) {
            return new Advices(aspect);
        };
    }]);

}(undefined));

/**
 * Simple aspect which logs all the arguments it recieves
 */
AngularAop.factory('Logger', function () {
    return function () {
        console.log(arguments);
    };
});
