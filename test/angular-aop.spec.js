/* global describe,it,expect */

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

});