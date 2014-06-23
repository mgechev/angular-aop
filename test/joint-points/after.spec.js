describe('After joint-point', function () {
  'use strict';

  commonJointpointTests(JOINT_POINTS.AFTER);

  it('should invoke the advice after the method', function () {
    var after = new Aspects[JOINT_POINTS.AFTER](function () {
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
    after._wrapper(params);
  });
});
