'use strict';

describe('Around joint-point', function () {
  it('should be defined', function () {
    expect(typeof Aspects[JOINT_POINTS.AROUND]).toBe('function');
  });

  it('should extend Aspect', function () {
    var around = new Aspects[JOINT_POINTS.AROUND](42);
    expect(around instanceof Aspect).toBeTruthy();
  });

  it('should set appropriate value to when', function () {
    var around = new Aspects[JOINT_POINTS.AROUND](42);
    expect(around.when).toBe(JOINT_POINTS.AROUND);
  });

  it('should invoke the advice with the appropriate context', function () {
    var around = new Aspects[JOINT_POINTS.AROUND](function () {}),
        params = {
        method: function () {
          expect(this).toBe(params.context);
        },
        context: {}
      };
    expect(around._wrapper(params));
  });

  it('should invoke the advice around the method', function () {
    var around = new Aspects[JOINT_POINTS.AROUND](function () {
      adviceCalled += 1;
      if (adviceCalled === 2) {
        expect(methodCalled).toBeTruthy();
      } else {
        expect(methodCalled).toBeFalsy();
      }
    }),
    params = {
      method: function () {
        methodCalled = true;
        expect(adviceCalled).toBe(1);
      },
      context: {}
    },
    adviceCalled = 0,
    methodCalled = false;
    around._wrapper(params);
  });

});
