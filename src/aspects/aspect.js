'use strict';

function Aspect(advice) {
  this._advice = advice;
  this._wrapperFunc = null;
}

Aspect.prototype.setWrapper = function (w) {
  this._wrapperFunc = w;
};

Aspect.prototype._wrapper = function () {
  throw 'Not implemented';
};

Aspect.prototype.invoke = function (params) {
  var aspectData = {};
  aspectData.when = this.when;
  aspectData.method = params.methodName;
  aspectData.args = params.args;
  aspectData.exception = params.exception;
  aspectData.result = params.result;
  aspectData.resolveArgs = params.resolveArgs;
  aspectData.rejectArgs = params.rejectArgs;
  aspectData.result = this._advice.call(params.context, aspectData);
  return aspectData;
};
