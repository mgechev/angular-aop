/* global describe,it,expect,spyOn,afterEach,
 document,angular,beforeEach,JOINT_POINTS */

describe('Angular AOP', function () {
  'use strict';

  it('should define AngularAOP module', function () {
    var module;
    expect(function () {
      module = angular.module('AngularAOP');
    }).not.toThrow();
    expect(typeof module).toBe('object');
  });

  it('should define appropriate interface of the provider', function () {
    var api = [
      '$get', 'annotate'
    ];
    api = api.concat(Object.keys(JOINT_POINTS));
    angular.module('demo', ['ng', 'AngularAOP'])
    .config(function (executeProvider) {
      api.forEach(function (key) {
        expect(executeProvider[key]).not.toBeUndefined();
      });
    });
    angular.bootstrap({}, ['demo']);
  });

  it('should define service called execute with dependencies in "ng"',
    function () {
    var injector = angular.injector(['ng', 'AngularAOP']);
    var execute;
    expect(function () {
      execute = injector.get('execute');
    }).not.toThrow();
    expect(typeof execute).toBe('function');
  });

  describe('annotation', function () {
    var module;
    var dummyServiceSpyActiveMethod;
    var dummyServiceSpyInactiveMethod;
    var a1Spy;
    var a2Spy;
    var advices;

    beforeEach(function () {
      module = angular.module('Test', ['AngularAOP']);
      advices = {
        a1: function () {},
        a2: function () {}
      };

      a1Spy = spyOn(advices, 'a1');
      a2Spy = spyOn(advices, 'a2');

      module.factory('A1', function () {
        return advices.a1;
      });

      module.factory('A2', function () {
        return advices.a2;
      });

      module.factory('DummyService', function () {
        var api = {
          active: function (simpleArg) {
            return simpleArg;
          },
          inactive: function () {}
        };
        dummyServiceSpyActiveMethod =
          spyOn(api, 'active');
        dummyServiceSpyInactiveMethod =
          spyOn(api, 'inactive');
        return api;
      });
    });

    it('should be able to annotate services in the config callback',
      function () {
      module.config(function (executeProvider, $provide) {
        executeProvider.annotate($provide, {
          DummyService: [{
            jointPoint: 'before',
            advice: 'A1'
          }]
        });
      });
      var ds = angular.injector(['ng', 'Test']).get('DummyService');
      ds.active();
      expect(dummyServiceSpyActiveMethod).toHaveBeenCalled();
      expect(a1Spy).toHaveBeenCalled();
    });

    it('should be able to filter methods based on' +
       'pattern matching the method name',
      function () {

      module.config(function (executeProvider, $provide) {
        executeProvider.annotate($provide, {
          DummyService: [{
            jointPoint: 'before',
            advice: 'A1',
            methodPattern: /^a/
          }]
        });
      });

      var ds = angular.injector(['ng', 'Test']).get('DummyService');
      ds.inactive();
      expect(dummyServiceSpyInactiveMethod).toHaveBeenCalled();
      expect(a1Spy).not.toHaveBeenCalled();

      ds.active();
      expect(dummyServiceSpyActiveMethod).toHaveBeenCalled();
      expect(a1Spy).toHaveBeenCalled();
    });

// Cannot test with spys
    it('should be able to filter methods based on ' +
      'pattern matching the method args',
      function () {

      module.config(function (executeProvider, $provide) {
        executeProvider.annotate($provide, {
          DummyService: [{
            jointPoint: 'before',
            advice: 'A1',
            argsPatterns: [/^simple/]
          }]
        });
      });

      var ds = angular.injector(['ng', 'Test']).get('DummyService');
      ds.inactive();
      expect(dummyServiceSpyInactiveMethod).toHaveBeenCalled();
//      expect(a1Spy).not.toHaveBeenCalled();

      ds.active();
      expect(dummyServiceSpyActiveMethod).toHaveBeenCalled();
      expect(a1Spy).toHaveBeenCalled();

    });

    afterEach(function () {
      angular.bootstrap(document, ['Test']);
    });

  });

  describe('The API', function () {

    var module;
    beforeEach(function () {
      module = angular.module('Test', ['AngularAOP']);
    });

    describe('forceObject', function () {
      it('should not wrap function\'s methods if "forceObject" ' +
        'property is set to false', function () {
        var injector = angular.injector(['ng', 'AngularAOP']);
        var execute = injector.get('execute');
        var target = function () {
          targetCalled = true;
        };
        var targetCalled = false;
        target.method = function () {
        };
        target.anotherMethod = function () {
        };
        var parentObj = {};
        parentObj.advice = function () {
        };
        var adviceSpy = spyOn(parentObj, 'advice');
        var aspect = execute(parentObj.advice).around(target, {
          forceObject: false
        });
        aspect.method();
        expect(adviceSpy).not.toHaveBeenCalled();
        expect(targetCalled).toBeFalsy();
        aspect();
        expect(adviceSpy).toHaveBeenCalled();
        expect(targetCalled).toBeTruthy();
      });

      it('should wrap function\'s methods if "forceObject" ' +
        'property is set to true', function () {

        var injector = angular.injector(['ng', 'AngularAOP']);
        var execute = injector.get('execute');
        var target = function () {
        };
        var targetCalled = false;
        target.method = function () {
          targetCalled = true;
        };
        target.anotherMethod = function () {
        };
        var parentObj = {};
        parentObj.advice = function () {
        };
        var adviceSpy = spyOn(parentObj, 'advice');
        var aspect = execute(parentObj.advice).around(target, {
          forceObject: true
        });
        aspect();
        expect(adviceSpy).not.toHaveBeenCalled();
        expect(targetCalled).toBeFalsy();
        aspect.method();
        expect(adviceSpy).toHaveBeenCalled();
        expect(targetCalled).toBeTruthy();
      });

      // To refactor with spies
      it('should allow wrapping prototype methods when "deep" is specified',
          function () {
            var app = angular.module('demo', ['AngularAOP', 'ng']);
            var loggerCalled = false;
            var wovenCalled = false;
            app.factory('Logger', function () {
              return function () {
                loggerCalled = true;
              };
            });
            function DummyService() {}
            DummyService.prototype.foo = function () {
              wovenCalled = true;
            };
            app.service('DummyService', DummyService);
            app.config(function ($provide, executeProvider) {
              executeProvider.annotate($provide, {
                DummyService: [{
                  jointPoint: 'after',
                  advice: 'Logger',
                  deep: true
                }]
              });
            });
            var injector = angular.injector(['demo']);
            var Dummy = injector.get('DummyService');
            Dummy.foo();
            expect(wovenCalled).toBeTruthy();
            expect(loggerCalled).toBeTruthy();
          });

    });

  });

});
