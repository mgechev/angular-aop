/**
 * Framework for aspect-oriented programming with AngularJS
 *
 * @author Minko Gechev (@mgechev)
 * @version 0.1.1
 * @license http://opensource.org/licenses/MIT MIT
 */
;(function (undef) {

  var AngularAop = angular.module('AngularAOP', []);

  /**
   * Service which give access to the pointcuts.
   */
  AngularAop.provider('execute', function executeProvider() {

    var MaybeQ = null,

      slice = Array.prototype.slice,

      //Cross-browser trim function
      trim = (function () {
        var trimFunction;
        if (typeof String.prototype.trim === 'function') {
          trimFunction = String.prototype.trim;
        } else {
          trimFunction = function () {
            return this === null ?
              '' :
              (this + '').replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
          };
        }
        return trimFunction;
      }()),

      //Default regular expression for matching arguments and method names
      defaultRule = /.*/;

      //Defines all joint points
      JOINT_POINTS = {
        BEFORE: 'Before',
        BEFORE_ASYNC: 'BeforeAsync',
        AFTER: 'After',
        AROUND: 'Around',
        AROUND_ASYNC: 'AroundAsync',
        ON_THROW: 'OnThrow',
        ON_RESOLVE: 'OnResolve',
        AFTER_RESOLVE: 'AfterResolve',
        ON_REJECT: 'OnReject'
      },

      //Contains all aspects (pointcut + advice)
      Aspects = {},

      //Builds specified aspect
      AspectBuilder = {
        buildAspect: function (advice, jointPoint) {
          var self = this;
          return function (target, rules) {
            if (typeof target === 'function') {
              return self._getFunctionAspect(target, jointPoint, advice);
            } else if (target) {
              return self._getObjectAspect(target, rules || {}, jointPoint, advice);
            }
          };
        },
        _getFunctionAspect: function (method, jointPoint, advice, methodName) {
          methodName = methodName || this._getMethodName(method);
          var aspect = new Aspects[jointPoint](advice),
            wrapper = function __angularAOPWrapper__() {
              var args = slice.call(arguments);
              args = {
                args: args,
                context: this,
                method: method,
                methodName: methodName
              };
              return aspect._wrapper.call(aspect, args);
            };
          wrapper.originalMethod = method;
          aspect.setWrapper(wrapper);
          return wrapper;
        },
        _getMethodName: function (method) {
          while (method.originalMethod)
            method = method.originalMethod;
          return (/function\s+(.*?)\s*\(/).exec(method.toString())[1];
        },
        _getObjectAspect: function (obj, rules, jointPoint, advice) {
          for (var prop in obj) {
            if (obj.hasOwnProperty(prop) &&
              typeof obj[prop] === 'function' &&
              this._matchRules(obj, prop, rules)) {
              obj[prop] = this._getFunctionAspect(obj[prop], jointPoint, advice, prop);
            }
          }
          return obj;
        },
        _matchRules: function (obj, prop, rules) {
          var methodPattern = rules.methodPattern || defaultRule,
            argsPatterns = rules.argsPatterns || [],
            method = obj[prop],
            tokens = this._parseMethod(method, prop),
            passed = true;
          while (tokens.when === '__angularAOPWrapper__') {
            method = method.originalMethod;
            tokens = this._parseMethod(method, prop);
          }
          return methodPattern.test(tokens.method) && this._matchArguments(argsPatterns, tokens);
        },
        _matchArguments: function (argsPatterns, tokens) {
          if (tokens.args.length < argsPatterns.length) return false;
          var passed = true;
          angular.forEach(tokens.args, function (arg, idx) {
            var rule = argsPatterns[idx] || defaultRule;
            if (!rule.test(arg)) {
              passed = false;
              return;
            }
          });
          return passed;
        },
        _parseMethod: function (method, prop) {
          var result = { method: prop },
              parts = method.toString()
                .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '') //stripping the comments
                .match(/function\s+([^\(]*)\s*\(([^\)]*)\)/) || [];
          if (parts && parts[2]) {
            result.args = [];
            angular.forEach(parts[2].split(','), function (arg) {
              result.args.push(trim.call(arg));
            });
          } else {
            result.args = [];
          }
          result.when = parts[1];
          return result;
        }
      };

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
      var wrapper = this._wrapperFunc,
        aspectData = {};
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

    Aspects[JOINT_POINTS.BEFORE] = function () {
      Aspect.apply(this, arguments);
      this.when = JOINT_POINTS.BEFORE;
    };
    Aspects[JOINT_POINTS.BEFORE].prototype = Object.create(Aspect.prototype);
    Aspects[JOINT_POINTS.BEFORE].prototype._wrapper = function (params) {
      return params.method.apply(params.context, this.invoke(params).args);
    };

    Aspects[JOINT_POINTS.BEFORE_ASYNC] = function () {
      Aspect.apply(this, arguments);
      this.when = JOINT_POINTS.BEFORE_ASYNC;
    };
    Aspects[JOINT_POINTS.BEFORE_ASYNC].prototype = Object.create(Aspect.prototype);
    Aspects[JOINT_POINTS.BEFORE_ASYNC].prototype._wrapper = function (params) {
      var aspectData = this.invoke(params);
      return MaybeQ.when(aspectData.result)
      .then(function (result) {
        return params.method.apply(params.context, aspectData.args);
      }, function (error) {
        return params.method.apply(params.context, aspectData.args);
      });
    };

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

    Aspects[JOINT_POINTS.AROUND] = function () {
      Aspect.apply(this, arguments);
      this.when = JOINT_POINTS.AROUND;
    };
    Aspects[JOINT_POINTS.AROUND].prototype = Object.create(Aspect.prototype);
    Aspects[JOINT_POINTS.AROUND].prototype._wrapper = function (params) {
      var args = params.args,
          context = params.context,
          method = params.method,
          result;
      result = method.apply(context, this.invoke(params).args);
      params.result = result;
      return this.invoke(params).result || result;
    };

    Aspects[JOINT_POINTS.AROUND_ASYNC] = function () {
      Aspect.apply(this, arguments);
      this.when = JOINT_POINTS.AROUND_ASYNC;
    };
    Aspects[JOINT_POINTS.AROUND_ASYNC].prototype = Object.create(Aspect.prototype);
    Aspects[JOINT_POINTS.AROUND_ASYNC].prototype._wrapper = function (params) {
      var args = params.args,
          context = params.context,
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

    Aspects[JOINT_POINTS.ON_RESOLVE] = function () {
      Aspect.apply(this, arguments);
      this.when = JOINT_POINTS.ON_RESOLVE;
    };
    Aspects[JOINT_POINTS.ON_RESOLVE].prototype = Object.create(Aspect.prototype);
    Aspects[JOINT_POINTS.ON_RESOLVE].prototype._wrapper = function (params) {
      var args = params.args,
          context = params.context,
          method = params.method,
          promise = method.apply(context, args),
          self = this;
      if (promise && typeof promise.then === 'function') {
        promise.then(function () {
          params.resolveArgs = arguments;
          self.invoke(params);
        });
      }
      return promise;
    };

    Aspects[JOINT_POINTS.AFTER_RESOLVE] = function () {
      Aspect.apply(this, arguments);
      this.when = JOINT_POINTS.AFTER_RESOLVE;
    };
    Aspects[JOINT_POINTS.AFTER_RESOLVE].prototype = Object.create(Aspect.prototype);
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
        promise.then(undef, function () {
          params.rejectArgs = arguments;
          self.invoke(params);
        });
      }
      return promise;
    };

    /**
     * Defines and implements the different advices.
     *
     * @constructor
     * @private
     * @param {Function} advice The advice which should be applied in the specified joint-point(s)
     */
    function AspectCollection(advice) {
      if (typeof advice !== 'function') {
        throw new Error('The advice should be a function');
      }
      this.before = AspectBuilder.buildAspect(advice, JOINT_POINTS.BEFORE);
      this.beforeAsync = AspectBuilder.buildAspect(advice, JOINT_POINTS.BEFORE_ASYNC);
      this.after = AspectBuilder.buildAspect(advice, JOINT_POINTS.AFTER);
      this.around = AspectBuilder.buildAspect(advice, JOINT_POINTS.AROUND);
      this.aroundAsync = AspectBuilder.buildAspect(advice, JOINT_POINTS.AROUND_ASYNC);
      this.onThrowOf = AspectBuilder.buildAspect(advice, JOINT_POINTS.ON_THROW);
      this.onResolveOf = AspectBuilder.buildAspect(advice, JOINT_POINTS.ON_RESOLVE);
      this.afterResolveOf = AspectBuilder.buildAspect(advice, JOINT_POINTS.AFTER_RESOLVE);
      this.onRejectOf = AspectBuilder.buildAspect(advice, JOINT_POINTS.ON_REJECT);
    }

    function applyAspects($provide, target, aspects) {
      angular.forEach(aspects, function (aspect){
        decorate($provide, target, aspect);
      });
    }

    function decorate($provide, target, annotation) {
      $provide.decorator(target, ['$q', '$injector', '$delegate', function ($q, $injector, $delegate) {
        var advice = (typeof annotation.advice === 'string') ? $injector.get(annotation.advice) : annotation.advice,
            jointPoint = annotation.jointPoint,
            methodPattern = annotation.methodPattern,
            argsPatterns = annotation.argsPattern,
            aspect = new AspectCollection(advice);
        MaybeQ = $q;
        if (typeof aspect[jointPoint] !== 'function') {
          throw new Error('No such joint-point ' + jointPoint);
        }
        return aspect[jointPoint]($delegate, {
          methodPattern: methodPattern,
          argsPatterns: argsPatterns
        });
      }]);
    }

    return {

      annotate: function ($provide, annotations) {
        var aspects;
        for (var target in annotations) {
          aspects = annotations[target];
          if (!angular.isArray(aspects)) {
            aspects = [aspects];
          }
          applyAspects($provide, target, aspects);
        }
      },

      $get: ['$q', function ($q) {
        MaybeQ = $q;
        return function (advice) {
          return new AspectCollection(advice);
        };
      }]

    };
  });

}());