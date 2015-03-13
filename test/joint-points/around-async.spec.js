describe('Around async joint-point', function () {
  'use strict';

  commonJointpointTests(JOINT_POINTS.AROUND_ASYNC);

  it('should invoke the advice after the method was resolved',
    function (done) {
      var onResolve = new Aspects[JOINT_POINTS.AROUND_ASYNC](function () {
        adviceCalled += 1;
        if (adviceCalled === 2) {
          expect(methodCalled).toBeTruthy();
          done();
        }
      });
      var params = {
        method: function () {
          var res = MaybeQ.when(1);
          methodCalled = true;
          expect(adviceCalled).toBe(1);
          return res;
        },
        context: {}
      };
      var adviceCalled = 0;
      var methodCalled = false;
      onResolve._wrapper(params);
    });

});
