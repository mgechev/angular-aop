/* global Aspects, JOINT_POINTS, Aspect */
'use strict';

Aspects[JOINT_POINTS.ON_RESOLVE] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.ON_RESOLVE;
};

Aspects[JOINT_POINTS.ON_RESOLVE].prototype =
        Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.ON_RESOLVE].prototype._wrapper = function (params) {
  var args = params.args;
  var context = params.context;
  var method = params.method;
  var promise = method.apply(context, args);
  var self = this;
  if (promise && typeof promise.then === 'function') {
    promise.then(function () {
      params.resolveArgs = arguments;
      self.invoke(params);
    });
  }
  return promise;
};
