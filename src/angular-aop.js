/* global Aspects     : true */
/* global JOINT_POINTS: true */
/* global MaybeQ      : true */

/**
 * Framework for aspect-oriented programming with AngularJS
 *
 * @author Minko Gechev (@mgechev)
 * @version <%= version =>
 * @license http://opensource.org/licenses/MIT MIT
 */

'use strict';

var AngularAop = angular.module('AngularAOP', []),

  //Contains all aspects (pointcut + advice)
  Aspects = {},

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

  MaybeQ = null;

/*jslint devel: true, indent: 2 */
// 15.2.3.2
if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = (function (Object, magic) {
    var set;
    function checkArgs(O, proto) {
      if (typeof O !== 'object' || O === null) {
        throw new TypeError('can not set prototype on a non-object');
      }
      if (typeof proto !== 'object' && proto !== null) {
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
        {__proto__: null}.__proto__ === void 0
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


/**
 * Service which give access to the pointcuts.
 */
AngularAop.provider('execute', function executeProvider() {

  //Default regular expression for matching arguments and method names
  var defaultRule = /.*/,

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

    //Builds specified aspect
    AspectBuilder = {
      buildAspect: function (advice, jointPoint) {
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
          if (obj.hasOwnProperty(prop) &&
            typeof obj[prop] === 'function' &&
            this._matchRules(obj, prop, rules)) {
            obj[prop] =
              this._getFunctionAspect(obj[prop], jointPoint, advice, prop);
          }
        }
        return obj;
      },
      _matchRules: function (obj, prop, rules) {
        var methodPattern = rules.methodPattern || defaultRule,
          argsPatterns = rules.argsPatterns || [],
          method = obj[prop],
          tokens = this._parseMethod(method, prop);
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
        var result = { method: prop },
            parts = method.toString()
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
    this.before = AspectBuilder.buildAspect(advice, JOINT_POINTS.BEFORE);
    this.beforeAsync =
        AspectBuilder.buildAspect(advice, JOINT_POINTS.BEFORE_ASYNC);
    this.after = AspectBuilder.buildAspect(advice, JOINT_POINTS.AFTER);
    this.around = AspectBuilder.buildAspect(advice, JOINT_POINTS.AROUND);
    this.aroundAsync =
        AspectBuilder.buildAspect(advice, JOINT_POINTS.AROUND_ASYNC);
    this.onThrowOf = AspectBuilder.buildAspect(advice, JOINT_POINTS.ON_THROW);
    this.onResolveOf =
        AspectBuilder.buildAspect(advice, JOINT_POINTS.ON_RESOLVE);
    this.afterResolveOf =
        AspectBuilder.buildAspect(advice, JOINT_POINTS.AFTER_RESOLVE);
    this.onRejectOf =
        AspectBuilder.buildAspect(advice, JOINT_POINTS.ON_REJECT);
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
              $injector.get(annotation.advice) : annotation.advice,
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