'use strict';

Aspects[JOINT_POINTS.AFTER_RESOLVE] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.AFTER_RESOLVE;
};

Aspects[JOINT_POINTS.AFTER_RESOLVE].prototype =
        Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.AFTER_RESOLVE].prototype._wrapper = function (params) {
  var args = params.args,
    context = params.context,
    method = params.method,
    deferred = MaybeQ.defer(),
    innerPromise = deferred.promise,
    promise = method.apply(context, args),
    self = this;
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