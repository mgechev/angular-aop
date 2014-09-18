/* global describe,it,expect,inject,spyOn,afterEach,document */

describe('Angular AOP', function () {
  'use strict';

  it('should define AngularAOP module', function () {
    var module;
    expect(function () {
      module = angular.module('AngularAOP');
    }).not.toThrow();
    expect(typeof module).toBe('object');
  });

  it('should define service called execute with dependencies in "ng"',
    function () {
    var injector = angular.injector(['ng', 'AngularAOP']),
        execute;
    expect(function () {
      execute = injector.get('execute');
    }).not.toThrow();
    expect(typeof execute).toBe('function');
  });

  describe('annotation', function () {
    var module,
        dummyServiceSpyActiveMethod,
        dummyServiceSpyInactiveMethod,
        a1Spy, a2Spy, advices;
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
          'DummyService': [{
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
          'DummyService': [{
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

    it('should be able to filter methods based on ' +
      'pattern matching the method args',
      function () {

//      module.config(function (executeProvider, $provide) {
//        executeProvider.annotate($provide, {
//          'DummyService': [{
//            jointPoint: 'before',
//            advice: 'A1',
//            argsPattern: [/^simple/]
//          }]
//        });
//      });


      var ds = angular.injector(['ng', 'Test']).get('DummyService');
      ds.inactive();
      expect(dummyServiceSpyInactiveMethod).toHaveBeenCalled();
      expect(a1Spy).not.toHaveBeenCalled();

      ds.active();
      expect(dummyServiceSpyActiveMethod).toHaveBeenCalled();
      expect(a1Spy).toHaveBeenCalled();

    });

    afterEach(function () {
      angular.bootstrap(document, ['Test']);
    });

  });

  describe('The API', function () {

    beforeEach(function () {
      angular.mock.module('AngularAOP');
    });

    describe('forceObject', function () {

      it('should not wrap function\'s methods if "forceObject"' +
        'property is set to false',

        inject(function (execute) {
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
      }));


      it('should wrap function\'s methods if "forceObject"' +
        'property is set to true',

        inject(function (execute) {
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
      }));

    });

  });

});