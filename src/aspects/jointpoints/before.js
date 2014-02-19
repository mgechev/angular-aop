'use strict';

Aspects[JOINT_POINTS.BEFORE] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.BEFORE;
};

Aspects[JOINT_POINTS.BEFORE].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.BEFORE].prototype._wrapper = function (params) {
  return params.method.apply(params.context, this.invoke(params).args);
};