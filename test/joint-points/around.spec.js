'use strict';

describe('Around joint-point', function () {
  it('should be defined', function () {
    expect(typeof Aspects[JOINT_POINTS.AROUND]).toBe('function');
  });

  it('should extend Aspect', function () {
    var before = new Aspects[JOINT_POINTS.AROUND](42);
    expect(before instanceof Aspect).toBeTruthy();
  });

  it('should set appropriate value to when', function () {
    var before = new Aspects[JOINT_POINTS.AROUND](42);
    expect(before.when).toBe(JOINT_POINTS.AROUND);
  });
});
