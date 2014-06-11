'use strict';

describe('Before joint-point', function () {

  beforeEach(function () {
    
  });

  it('should be defined', function () {
    expect(typeof Aspects[JOINT_POINTS.BEFORE]).toBe('function');
  });

  it('should extend Aspect', function () {
    var before = new Aspects[JOINT_POINTS.BEFORE](42);
    expect(before instanceof Aspect).toBeTruthy();
  });

  it('should invoke the advice before the wrapper method', function () {
  });
});