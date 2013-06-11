DemoApp = angular.module('DemoApp', ['AngularAOP']);

DemoApp.controller('LoginCtrl', function ($scope, LoginService) {
    LoginService.register('Register', 'method');
    LoginService.login('Login', 'method');
    LoginService.logout('Logout', 'method');
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
            register: function (user, pass) {
                throw Error('register is not implemented');
            },
            login: function (user, pass) {
                console.log('Login called');
                return 'Login';
            },
            logout: function (username, password) {
                console.log('Logout called');
                return 'Logout';
            }
        };
        api = execute(Logger).after(api, {
            methodPattern: /^l/,
            argsPatterns: [/^user/, /^pass$/]
        });
        api = execute(Logger).onThrowOf(api, {
            methodPattern: /^reg/
        });
    return api;
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
        console.log('%cLogger: ' + angular.toJson(args), 'color: #5EAFFF; font-style: italic;');
    };
});
