window.TestApp = angular.module('TestApp', ['AngularAOP']);
TestApp.controller('TestCtrl', function ($scope, TestService, TestServiceWrapper) {
    $scope.name = 'foo';
//    TestService.noSense();
//    TestService.noSensePromise(42);
//    TestService.noSensePromiseAfter(42).then(function () {
//       console.log('Callback');
//    });
    TestService.noSenseBefore(42);
    TestService.noSenseAfter(45);
    TestService.noSenseAround(1337);

    TestServiceWrapper.foo(42);
    TestServiceWrapper.bar(42);
});

TestApp.service('TestService', function ($rootScope, $q, execute, Logger) {
    return {
        noSense: execute(Logger).onThrowOf(function () {
            var nothing = null  ;
            nothing.call();
        }),
        noSensePromise: execute(Logger).onResolveOf(function (arg) {
            var deferred = $q.defer();
            setTimeout(function () {
                $rootScope.$apply(function () {
                    deferred.resolve('Test promise with ' + arg);
                });
            }, 1000);
            return deferred.promise;
        }),
        noSenseBefore: execute(Logger).before(function () {
            return 'Something';
        }),
        noSenseAfter: execute(Logger).after(function () {
            return 'Something after';
        }),
        noSenseAround: execute(Logger).around(function () {
            return 'Something around';
        }),
        noSensePromiseAfter: execute(Logger).afterResolveOf(function (arg) {
            var deferred = $q.defer();
            setTimeout(function () {
                $rootScope.$apply(function () {
                    deferred.resolve('Test promise with ' + arg);
                });
            }, 1000);
            return deferred.promise;
        })
    };
});

TestApp.service('TestServiceWrapper', function (Logger, execute) {
    var api = {
        foo: function () {
            return 'foo';
        },
        bar: function () {
            return 'bar';
        }
    };
    return execute(Logger).after(api);
});


