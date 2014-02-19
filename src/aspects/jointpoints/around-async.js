'use strict';

Aspects[JOINT_POINTS.AROUND_ASYNC] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.AROUND_ASYNC;
};

Aspects[JOINT_POINTS.AROUND_ASYNC].prototype =
      Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.AROUND_ASYNC].prototype._wrapper = function (params) {
  var context = params.context,
      method = params.method,
      aspectData = this.invoke(params),
      self = this,
      result;

  function afterBefore() {
    result = method.apply(context, aspectData.result);
    params.result = result;
    return self.invoke(params).result || result;
  }

  return MaybeQ.when(aspectData.result)
    .then(afterBefore, afterBefore);
};