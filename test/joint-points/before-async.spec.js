describe('After joint-point', function () {
  'use strict';

  commonJointpointTests(JOINT_POINTS.BEFORE_ASYNC);

  it('should invoke the method after the advice\'s result was resolved',
    function () {
      var resolved = MaybeQ.when(1);
      var beforeAsync = new Aspects[JOINT_POINTS.BEFORE_ASYNC](function () {
        adviceCalled = true;
        expect(methodCalled).toBeFalsy();
        return resolved;
      });
      var params = {
        method: function () {
          console.log(42);
          methodCalled = true;
          expect(adviceCalled).toBeTruthy();
        },
        context: {}
      };
      var adviceCalled = false;
      var methodCalled = false;
      beforeAsync._wrapper(params);
    });

  it('should invoke the method after the advice\'s result was rejected',
    function () {
      var rejected = MaybeQ.reject(1);
      var beforeAsync = new Aspects[JOINT_POINTS.BEFORE_ASYNC](function () {
        adviceCalled = true;
        expect(methodCalled).toBeFalsy();
        return rejected;
      });
      var params = {
        method: function () {
          methodCalled = true;
          expect(adviceCalled).toBeTruthy();
        },
        context: {}
      };
      var adviceCalled = false;
      var methodCalled = false;
      beforeAsync._wrapper(params);
    });
});
