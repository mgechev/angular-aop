(function () {
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

/* global angular */
/**
 * Framework for aspect-oriented programming with AngularJS
 *
 * @author Minko Gechev (@mgechev)
 * @version <%= version =>
 * @license http://opensource.org/licenses/MIT MIT
 */

var AngularAop = angular.module('AngularAOP', []);

//Contains all aspects (pointcut + advice)
var Aspects = {};

  //Defines all joint points
var JOINT_POINTS = {
  BEFORE: 'before',
  BEFORE_ASYNC: 'beforeAsync',
  AFTER: 'after',
  AROUND: 'around',
  AROUND_ASYNC: 'aroundAsync',
  ON_THROW: 'onThrow',
  ON_RESOLVE: 'onResolve',
  AFTER_RESOLVE: 'afterResolve',
  ON_REJECT: 'onReject'
};

var MaybeQ = null;

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = (function (Object, magic) {
    var set;
    function checkArgs(O, proto) {
      if (!(/object|function/).test(typeof O) || O === null) {
        throw new TypeError('can not set prototype on a non-object');
      }
      if (!(/object|function/).test(typeof proto) && proto !== null) {
        throw new TypeError('can only set prototype to an object or null');
      }
    }
    function setPrototypeOf(O, proto) {
      checkArgs(O, proto);
      set.call(O, proto);
      return O;
    }
    try {
      // this works already in Firefox and Safari
      set = Object.getOwnPropertyDescriptor(Object.prototype, magic).set;
      set.call({}, null);
    } catch (oO) {
      if (
        // IE < 11 cannot be shimmed
        Object.prototype !== {}[magic] ||
        // neither can any browser that actually
        // implemented __proto__ correctly
        // (all but old V8 will return here)
        /* jshint proto: true */
        { __proto__: null }.__proto__ === void 0
        // this case means null objects cannot be passed
        // through setPrototypeOf in a reliable way
        // which means here a **Sham** is needed instead
      ) {
        return;
      }
      // nodejs 0.8 and 0.10 are (buggy and..) fine here
      // probably Chrome or some old Mobile stock browser
      set = function (proto) {
        this[magic] = proto;
      };
      // please note that this will **not** work
      // in those browsers that do not inherit
      // __proto__ by mistake from Object.prototype
      // in these cases we should probably throw an error
      // or at least be informed about the issue
      setPrototypeOf.polyfill = setPrototypeOf(
        setPrototypeOf({}, null),
        Object.prototype
      ) instanceof Object;
      // setPrototypeOf.polyfill === true means it works as meant
      // setPrototypeOf.polyfill === false means it's not 100% reliable
      // setPrototypeOf.polyfill === undefined
      // or
      // setPrototypeOf.polyfill ==  null means it's not a polyfill
      // which means it works as expected
      // we can even delete Object.prototype.__proto__;
    }
    return setPrototypeOf;
  }(Object, '__proto__'));
}
// Last chance to pollyfil it...
Object.setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
  obj.__proto__ = proto;
  return obj;
};

/**
 * Service which give access to the pointcuts.
 */
AngularAop.provider('execute', function executeProvider() {

  //Default regular expression for matching arguments and method names
  var defaultRule = /.*/;

  var slice = Array.prototype.slice;

    //Cross-browser trim function
  var trim = (function () {
      var trimFunction;
      if (typeof String.prototype.trim === 'function') {
        trimFunction = String.prototype.trim;
      } else {
        if (this === null) {
          return '';
        }
        var strVal = this.toString();
        trimFunction = function () {
          return strVal
            .replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        };
      }
      return trimFunction;
    }());

    //Builds specified aspect
  var AspectBuilder = {
      createAspectFactory: function (advice, jointPoint) {
        var self = this;
        return function (target, rules) {
          if (typeof target === 'function' && !rules.forceObject) {
            return self._getFunctionAspect(target, jointPoint, advice);
          } else if (target) {
            return self._getObjectAspect(target, rules || {},
                                         jointPoint, advice);
          }
        };
      },
      _getFunctionAspect: function (method, jointPoint, advice, methodName) {
        methodName = methodName || this._getMethodName(method);
        var aspect = new Aspects[jointPoint](advice);
        var wrapper = function __angularAOPWrapper__() {
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
        Object.setPrototypeOf(wrapper, method);
        aspect.setWrapper(wrapper);
        return wrapper;
      },
      _getMethodName: function (method) {
        while (method.originalMethod) {
          method = method.originalMethod;
        }
        return (/function\s+(.*?)\s*\(/).exec(method.toString())[1];
      },
      _getObjectAspect: function (obj, rules, jointPoint, advice) {
        for (var prop in obj) {
          if ((obj.hasOwnProperty(prop) || rules.deep) &&
            typeof obj[prop] === 'function' &&
            this._matchRules(obj, prop, rules)) {
            obj[prop] =
              this._getFunctionAspect(obj[prop], jointPoint, advice, prop);
          }
        }
        return obj;
      },
      _matchRules: function (obj, prop, rules) {
        var methodPattern = rules.methodPattern || defaultRule;
        var argsPatterns = rules.argsPatterns || [];
        var method = obj[prop];
        var tokens = this._parseMethod(method, prop);
        while (tokens.when === '__angularAOPWrapper__') {
          method = method.originalMethod;
          tokens = this._parseMethod(method, prop);
        }
        return methodPattern.test(tokens.method) &&
                this._matchArguments(argsPatterns, tokens);
      },
      _matchArguments: function (argsPatterns, tokens) {
        if (tokens.args.length < argsPatterns.length) {
          return false;
        }
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
        var result = { method: prop };
        var  parts = method.toString()
              //stripping the comments
              .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '')
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

  /**
   * Defines and implements the different advices.
   *
   * @constructor
   * @private
   * @param {Function} advice The advice which should be
   *                          applied in the specified joint-point(s)
   */
  function AspectCollection(advice) {
    if (typeof advice !== 'function') {
      throw new Error('The advice should be a function');
    }
    this[JOINT_POINTS.BEFORE] =
      AspectBuilder.createAspectFactory(advice, JOINT_POINTS.BEFORE);
    this[JOINT_POINTS.BEFORE_ASYNC] =
      AspectBuilder.createAspectFactory(advice, JOINT_POINTS.BEFORE_ASYNC);
    this[JOINT_POINTS.AFTER] =
      AspectBuilder.createAspectFactory(advice, JOINT_POINTS.AFTER);
    this[JOINT_POINTS.AROUND] =
      AspectBuilder.createAspectFactory(advice, JOINT_POINTS.AROUND);
    this[JOINT_POINTS.AROUND_ASYNC] =
      AspectBuilder.createAspectFactory(advice, JOINT_POINTS.AROUND_ASYNC);
    this[JOINT_POINTS.ON_THROW] =
      AspectBuilder.createAspectFactory(advice, JOINT_POINTS.ON_THROW);
    this[JOINT_POINTS.ON_RESOLVE] =
        AspectBuilder.createAspectFactory(advice, JOINT_POINTS.ON_RESOLVE);
    this[JOINT_POINTS.AFTER_RESOLVE] =
        AspectBuilder.createAspectFactory(advice, JOINT_POINTS.AFTER_RESOLVE);
    this[JOINT_POINTS.ON_REJECT] =
        AspectBuilder.createAspectFactory(advice, JOINT_POINTS.ON_REJECT);
  }

  function applyAspects($provide, target, aspects) {
    angular.forEach(aspects, function (aspect) {
      decorate($provide, target, aspect);
    });
  }

  function decorate($provide, target, annotation) {
    $provide.decorator(target, ['$q', '$injector', '$delegate',
            function ($q, $injector, $delegate) {
      var advice = (typeof annotation.advice === 'string') ?
              $injector.get(annotation.advice) : annotation.advice;
      var jointPoint = annotation.jointPoint;
      var methodPattern = annotation.methodPattern;
      var argsPatterns = annotation.argsPattern;
      var aspect = new AspectCollection(advice);
      MaybeQ = $q;
      if (typeof aspect[jointPoint] !== 'function') {
        throw new Error('No such joint-point ' + jointPoint);
      }
      return aspect[jointPoint]($delegate, {
        methodPattern: methodPattern,
        argsPatterns: argsPatterns,
        forceObject: annotation.forceObject,
        deep: annotation.deep
      });
    }]);
  }

  var api = {

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

  angular.extend(api, JOINT_POINTS);

  return api;
});

/* global Aspects, JOINT_POINTS, Aspect */
Aspects[JOINT_POINTS.AFTER] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.AFTER;
};

Aspects[JOINT_POINTS.AFTER].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.AFTER].prototype._wrapper = function (params) {
  var context = params.context;
  var result = params.method.apply(context, params.args);
  params.result = result;
  return this.invoke(params).result || result;
};

/* global Aspects, JOINT_POINTS, Aspect, MaybeQ */
Aspects[JOINT_POINTS.AFTER_RESOLVE] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.AFTER_RESOLVE;
};

Aspects[JOINT_POINTS.AFTER_RESOLVE].prototype =
        Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.AFTER_RESOLVE].prototype._wrapper = function (params) {
  var args = params.args;
  var context = params.context;
  var method = params.method;
  var deferred = MaybeQ.defer();
  var innerPromise = deferred.promise;
  var promise = method.apply(context, args);
  var self = this;
  if (!promise || typeof promise.then !== 'function') {
    throw new Error('The woven method doesn\'t return a promise');
  }
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

/* global Aspects, JOINT_POINTS, Aspect, MaybeQ */
Aspects[JOINT_POINTS.AROUND_ASYNC] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.AROUND_ASYNC;
};

Aspects[JOINT_POINTS.AROUND_ASYNC].prototype =
      Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.AROUND_ASYNC].prototype._wrapper = function (params) {
  var context = params.context;
  var method = params.method;
  var aspectData = this.invoke(params);
  var self = this;
  var result;

  function afterBefore() {
    result = method.apply(context, aspectData.result);
    params.result = result;
    return self.invoke(params).result || result;
  }

  return MaybeQ.when(aspectData.result)
    .then(afterBefore, afterBefore);
};

/* global Aspects, JOINT_POINTS, Aspect */
Aspects[JOINT_POINTS.AROUND] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.AROUND;
};

Aspects[JOINT_POINTS.AROUND].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.AROUND].prototype._wrapper = function (params) {
  var context = params.context;
  var method = params.method;
  var result;
  result = method.apply(context, this.invoke(params).args);
  params.result = result;
  return this.invoke(params).result || result;
};

/* global Aspects, JOINT_POINTS, Aspect, MaybeQ */
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

/* global Aspects, JOINT_POINTS, Aspect */
Aspects[JOINT_POINTS.BEFORE] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.BEFORE;
};

Aspects[JOINT_POINTS.BEFORE].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.BEFORE].prototype._wrapper = function (params) {
  return params.method.apply(params.context, this.invoke(params).args);
};

/* global Aspects, JOINT_POINTS, Aspect */
Aspects[JOINT_POINTS.ON_REJECT] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.ON_REJECT;
};

Aspects[JOINT_POINTS.ON_REJECT].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.ON_REJECT].prototype._wrapper = function (params) {
  var args = params.args;
  var context = params.context;
  var method = params.method;
  var promise = method.apply(context, args);
  var self = this;
  if (promise && typeof promise.then === 'function') {
    promise.then(undefined, function () {
      params.rejectArgs = arguments;
      self.invoke(params);
    });
  }
  return promise;
};

/* global Aspects, JOINT_POINTS, Aspect */
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

/* global Aspects, JOINT_POINTS, Aspect */
Aspects[JOINT_POINTS.ON_THROW] = function () {
  Aspect.apply(this, arguments);
  this.when = JOINT_POINTS.ON_THROW;
};

Aspects[JOINT_POINTS.ON_THROW].prototype = Object.create(Aspect.prototype);

Aspects[JOINT_POINTS.ON_THROW].prototype._wrapper = function (params) {
  var args = params.args;
  var result;
  try {
    result = params.method.apply(params.context, args);
  } catch (e) {
    params.exception = e;
    this.invoke(params);
  }
  return result;
};

}());