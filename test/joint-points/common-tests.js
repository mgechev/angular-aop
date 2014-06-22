function commonJointpointTests(jointPoint) {
  'use strict';

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

  it('should invoke the advice with appropriate parameters', function () {
    var after = new Aspects[jointPoint](function (args) {
          expect(args.when).toBe(jointPoint);
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
