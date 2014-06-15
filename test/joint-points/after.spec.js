'use strict';

describe('After joint-point', function () {
  it('should be defined', function () {
    expect(typeof Aspects[JOINT_POINTS.AFTER]).toBe('function');
  });

  it('should extend Aspect', function () {
    var before = new Aspects[JOINT_POINTS.AFTER](42);
    expect(before instanceof Aspect).toBeTruthy();
  });

  it('should set appropriate value to when', function () {
    var before = new Aspects[JOINT_POINTS.AFTER](42);
    expect(before.when).toBe(JOINT_POINTS.AFTER);
  });

  it('should invoke the advice with the appropriate context', function () {
    var before = new Aspects[JOINT_POINTS.AFTER](function () {}),
        params = {
        method: function () {
          expect(this).toBe(params.context);
        },
        context: {}
      };
    expect(before._wrapper(params));
  });

  it('should invoke the advice after the method', function () {
    var before = new Aspects[JOINT_POINTS.AFTER](function () {
      adviceCalled = true;
      expect(methodCalled).toBeTruthy();
    }),
    params = {
      method: function () {
        methodCalled = true;
        expect(adviceCalled).toBeFalsy();
      },
      context: {}
    },
    adviceCalled = false,
    methodCalled = false;
    before._wrapper(params);
  });
});
