var AngularAop = angular.module('AngularAOP', []);

/**
 * Service which give access to the pointcuts.
 */
AngularAop.factory('execute', function Base() {
    var slice = Array.prototype.slice;

    /**
     * Defines and implements the different advices.
     *
     * @constructor
     * @private
     * @param {Function} aspect The join point to which the advice should be applied
     */    
    function Advices(aspect) {
        
        /**
         * Keeps a reference to the outer, parent context.
         */        
        var self = this;

        /**
         * The the aspect which will be applied.
         */
        this._aspect = aspect;
        
        this.before = function (jointPoint) {
            return function () {
                var args = slice.call(arguments);
                self._aspect.apply(this, args);
                return jointPoint.apply(this, args);
            };
        };
        
        this.after = function (jointPoint) {
            return function () {
                var args = slice.call(arguments),
                    result = jointPoint.apply(this, args),
                    aspectArgs;
                aspectArgs = [result];
                self._aspect.apply(this, aspectArgs.concat(args));
                return result;
            };
        };
        
        this.around = function (jointPoint) {
            return function () {
                var args = slice.call(arguments),
                    aspectArgs,
                    result;
                self._aspect.apply(this, aspectArgs);
                result = jointPoint.apply(this, args);
                aspectArgs = [result];
                self._aspect.apply(this, aspectArgs.concat(args));
                return result;
            };
        };
        
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
        
        this.onRejectOf = function (jointPoint) {
            return function () {
                var args = slice.call(arguments),
                    promise = jointPoint.apply(this, args);
                promise.then(function () {}, function () {
                    self._aspect.apply(this, slice.call(arguments));
                });
                return promise;
            };
        };
    }
    
    return function (aspect) {
        return new Advices(aspect);
    };
});

/**
 * Simple aspect which logs all the arguments it recieves
 */
AngularAop.factory('Logger', function () {
    return function () {
        console.log(arguments);
    };
});
