describe('On throw joint-point', function () {
  'use strict';

  commonJointpointTests(JOINT_POINTS.ON_THROW);

  it('should invoke the advice after throw of error', function () {
    var onThrow = new Aspects[JOINT_POINTS.ON_THROW](function () {
      adviceCalled = true;
      expect(methodCalled).toBeTruthy();
    }),
    params = {
      method: function () {
        methodCalled = true;
        expect(adviceCalled).toBeFalsy();
        throw 'Error';
      },
      context: {}
    },
    adviceCalled = false,
    methodCalled = false;
    onThrow._wrapper(params);
  });
});
