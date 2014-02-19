'use strict';

Aspects[JOINT_POINTS.ON_REJECT] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.ON_REJECT;
};

Aspects[JOINT_POINTS.ON_REJECT].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.ON_REJECT].prototype._wrapper = function (params) {
  var args = params.args,
    context = params.context,
    method = params.method,
    promise = method.apply(context, args),
    self = this;
  if (promise && typeof promise.then === 'function') {
    promise.then(undefined, function () {
      params.rejectArgs = arguments;
      self.invoke(params);
    });
  }
  return promise;
};