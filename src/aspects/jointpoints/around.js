'use strict';

Aspects[JOINT_POINTS.AROUND] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.AROUND;
};

Aspects[JOINT_POINTS.AROUND].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.AROUND].prototype._wrapper = function (params) {
  var context = params.context,
      method = params.method,
      result;
  result = method.apply(context, this.invoke(params).args);
  params.result = result;
  return this.invoke(params).result || result;
};