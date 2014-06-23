describe('Around joint-point', function () {
  'use strict';

  commonJointpointTests(JOINT_POINTS.AROUND);

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
