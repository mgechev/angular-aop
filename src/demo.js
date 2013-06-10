window.TestApp = angular.module('TestApp', ['AngularAOP']);
TestApp.controller('TestCtrl', function ($scope, TestService) {
    $scope.name = 'foo';
//    TestService.noSense();
//    TestService.noSensePromise(42);
    TestService.noSensePromiseAfter(42).then(function () {
       console.log('Callback');
    });
    TestService.noSenseAfter(42);
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
        noSenseAfter: execute(Logger).before(execute(Logger).after(function (arg) {                
            return 'Something';
        })),
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


