function commonJointpointTests(jointPoint) {
  'use strict';

  var KEYS = ['when', 'method', 'args', 'exception',
        'result', 'resolveArgs', 'rejectArgs'];

  it('should be defined', function () {
    expect(typeof Aspects[jointPoint]).toBe('function');
  });

  it('should extend Aspect', function () {
    var after = new Aspects[jointPoint](42);
    expect(after instanceof Aspect).toBeTruthy();
  });

  it('should set appropriate value to when', function () {
    var after = new Aspects[jointPoint](42);
    expect(after.when).toBe(jointPoint);
  });

  it('should invoke the advice with the appropriate context', function () {
    var after = new Aspects[jointPoint](function () {}),
        params = {
        method: function () {
          expect(this).toBe(params.context);
        },
        context: {}
      };
    expect(after._wrapper(params));
  });

  it('should invoke the advice with appropriate object', function () {
    var after = new Aspects[jointPoint](function (args) {
          var keys = Object.keys(args);
          KEYS.forEach(function (k) {
            expect(keys.indexOf(k) >= 0).toBeTruthy();
          });
        }),
        params = {
        method: function () {
          expect(this).toBe(params.context);
        },
        context: {}
      };
    expect(after._wrapper(params));
  });
}
