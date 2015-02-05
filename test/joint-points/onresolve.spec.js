describe('On resolve joint-point', function () {
  'use strict';

  commonJointpointTests(JOINT_POINTS.ON_RESOLVE);

  it('should invoke the advice after the method was resolved',
    function () {
      var onResolve = new Aspects[JOINT_POINTS.ON_RESOLVE](function (done) {
        adviceCalled = true;
        expect(methodCalled).toBeTruthy();
        console.log(4242);
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
