'use strict';

describe('Before joint-point', function () {
  commonJointpointTests(JOINT_POINTS.BEFORE);

  it('should invoke the advice before the method', function () {
    var before = new Aspects[JOINT_POINTS.BEFORE](function () {
      adviceCalled = true;
        console.log(arguments);
      expect(methodCalled).toBeFalsy();
    }),
    params = {
      method: function () {
        methodCalled = true;
        expect(adviceCalled).toBeTruthy();
      },
      context: {}
    },
    adviceCalled = false,
    methodCalled = false;
    before._wrapper(params);
  });
});