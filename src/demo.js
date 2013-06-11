DemoApp = angular.module('DemoApp', ['AngularAOP']);

DemoApp.controller('LoginCtrl', function ($scope, LoginService) {
    LoginService.login(42);
    LoginService.logout();
    LoginService.loadUser();
});

DemoApp.factory('LoginService', function ($q, $rootScope, execute, Logger) {
    var username, password,
        api = {
            loadUser: execute(Logger).onResolveOf(function () {
                var deferred = $q.defer();
                setTimeout(function () {
                    $rootScope.$apply(function () {
                        deferred.resolve({
                            username: 'demouser',
                            password: 'demopass'
                        });
                    });
                }, 500);
                return deferred.promise;
            }),
            login: function (param) {
                if (!username || !password) {
                    throw new Error('No username or password');
                }
            },
            logout: function () {
                throw 'Not implemented';
            }
        };
    return execute(Logger).onThrowOf(api, /login|logout/);
});

DemoApp.factory('Logger', function () {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        angular.forEach(args, function (arg, idx) {
            if (arg instanceof Error) {
                console.log('%cException thrown: ' + args[0].message, 'color: red; font-weight: bold; font-size: 1.2em;');
                args.splice(idx, 1);
            }
        });
        console.log(angular.toJson(args));
    };
});
