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

  it('should set appropriate value to when', function () {
    var before = new Aspects[JOINT_POINTS.BEFORE](42);
    expect(before.when).toBe(JOINT_POINTS.BEFORE);
  });

  it('should invoke the advice with the appropriate context', function () {
    var before = new Aspects[JOINT_POINTS.BEFORE](function () {}),
        params = {
        method: function () {
          expect(this).toBe(params.context);
        },
        context: {}
      };
    expect(before._wrapper(params));
  });
});