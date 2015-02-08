describe('After resolve joint-point', function () {
  'use strict';

  commonJointpointTests(JOINT_POINTS.AFTER_RESOLVE);

  it('should invoke the advice after the method was resolved',
    function (done) {
      var onResolve = new Aspects[JOINT_POINTS.AFTER_RESOLVE](function () {
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

  it('should invoke the advice before the attached to promise' +
      'method was invoked',
      function (done) {
        var onResolve = new Aspects[JOINT_POINTS.AFTER_RESOLVE](function () {
          adviceCalled = true;
          expect(methodCalled).toBeTruthy();
          expect(resolvedPoitcut).toBeTruthy();
          done();
        });
        var params = {
          method: function () {
            var res = MaybeQ.when(1);
            methodCalled = true;
            expect(adviceCalled).toBeFalsy();
            expect(resolvedPoitcut).toBeFalsy();
            return res;
          },
          context: {}
        };
        var adviceCalled = false;
        var methodCalled = false;
        var resolvedPoitcut = false;
        onResolve._wrapper(params)
        .then(function () {
          expect(adviceCalled).toBeFalsy();
          expect(methodCalled).toBeTruthy();
          resolvedPoitcut = true;
        });
      });
});
