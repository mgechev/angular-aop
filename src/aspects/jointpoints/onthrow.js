'use strict';

Aspects[JOINT_POINTS.ON_THROW] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.ON_THROW;
};

Aspects[JOINT_POINTS.ON_THROW].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.ON_THROW].prototype._wrapper = function (params) {
  var args = params.args,
    result;
  try {
    result = params.method.apply(params.context, args);
  } catch (e) {
    params.exception = e;
    this.invoke(params);
  }
  return result;
};