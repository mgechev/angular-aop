describe('On resolve joint-point', function () {
  'use strict';

  commonJointpointTests(JOINT_POINTS.ON_RESOLVE);

  it('should invoke the advice after the method was resolved',
    function (done) {
      var onResolve = new Aspects[JOINT_POINTS.ON_RESOLVE](function () {
        adviceCalled = true;
        expect(methodCalled).toBeTruthy();
        done();
      });
      var params = {
        method: function () {
          var res = MaybeQ.when(1);
          methodCalled = true;
          expect(adviceCalled).toBeFalsy();
          return res;
        },
        context: {}
      };
      var adviceCalled = false;
      var methodCalled = false;
      onResolve._wrapper(params);
    });
});
