/* global Aspects, JOINT_POINTS, Aspect, MaybeQ */
'use strict';

Aspects[JOINT_POINTS.AFTER_RESOLVE] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.AFTER_RESOLVE;
};

Aspects[JOINT_POINTS.AFTER_RESOLVE].prototype =
        Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.AFTER_RESOLVE].prototype._wrapper = function (params) {
  var args = params.args;
  var context = params.context;
  var method = params.method;
  var deferred = MaybeQ.defer();
  var innerPromise = deferred.promise;
  var promise = method.apply(context, args);
  var self = this;
  if (!promise || typeof promise.then !== 'function') {
    throw new Error('The woven method doesn\'t return a promise');
  }
  promise.then(function () {
    params.resolveArgs = arguments;
    innerPromise.then(function () {
      self.invoke(params);
    });
    deferred.resolve.apply(deferred, arguments);
  }, function () {
    deferred.reject.apply(innerPromise, arguments);
  });
  return innerPromise;
};
