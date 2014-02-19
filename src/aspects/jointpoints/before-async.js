'use strict';

Aspects[JOINT_POINTS.BEFORE_ASYNC] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.BEFORE_ASYNC;
};

Aspects[JOINT_POINTS.BEFORE_ASYNC].prototype =
      Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.BEFORE_ASYNC].prototype._wrapper = function (params) {
  var aspectData = this.invoke(params);
  return MaybeQ.when(aspectData.result)
  .then(function () {
    return params.method.apply(params.context, aspectData.args);
  }, function () {
    return params.method.apply(params.context, aspectData.args);
  });
};