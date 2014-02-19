'use strict';

Aspects[JOINT_POINTS.AFTER] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.AFTER;
};

Aspects[JOINT_POINTS.AFTER].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.AFTER].prototype._wrapper = function (params) {
  var context = params.context,
    result = params.method.apply(context, params.args);
  params.result = result;
  return this.invoke(params).result || result;
};