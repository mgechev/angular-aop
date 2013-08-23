DemoApp = angular.module('DemoApp', ['AngularAOP']);

DemoApp.controller('ArticlesListCtrl', function ($scope, ArticlesCollection) {
    ArticlesCollection.foo()
    .then(function (arg) {
        console.log('resolved', arg);
    }, function () {
        console.log('rejected');
    });
//    ArticlesCollection.getSpecialArticles();
//    ArticlesCollection.loadArticles().then(function () {
//        try {
//            var article = ArticlesCollection.getArticleById(0);
//        } catch (e) {
//            console.error(e.message);
//        }
//    });
});

DemoApp.factory('Authorization', function (User) {
    return function () {
        if (User.getUsername() !== 'foo' &&
            User.getPassword() !== 'bar') {
            throw new Error('Not authorized');
        }
    };
});

DemoApp.factory('Logger', function () {
    return function (args) {
        if (args.exception) {
            console.log('%cException: ' + args.exception.message + '. ' + args.method + ' called before proper authorization.',
            'color: red; text-weight: bold; font-size: 1.2em;');
        }
        var throwData = (args.exception) ? ' and threw: ' + args.exception.message : '';
        console.log('Method: ' + args.method + ', Pointcut: ' + args.when + ', with arguments: ' +
                    angular.toJson(args.args) + throwData + ' and resolve data: ' +
                    angular.toJson(args.resolveArgs) + ', reject data: ' + angular.toJson(args.rejectArgs));
    };
});

DemoApp.service('User', function () {

    this._username = null;
    this._password = null;

    this.setUsername = function (user) {
        this._username = user;
    };

    this.setPassword = function (pass) {
        this._password = pass;
    };

    this.getUsername = function () {
        return this._username;
    };

    this.getPassword = function () {
        return this._password;
    };
});

DemoApp.factory('ArticlesCollection', function ($q, $timeout, execute, Logger, Authorization) {

    var sampleArticles = [
            { id: 0, title: 'Title 1', content: 'Content 1' },
            { id: 1, title: 'Title 2', content: 'Content 2' },
            { id: 2, title: 'Title 3', content: 'Content 3' }
        ],
        privateArticles = [
            { id: 3, title: 'Title 4', content: 'Content 4' },
            { id: 4, title: 'Title 5', content: 'Content 5' }
        ],
        api = {
            loadArticles: function () {
                var deferred = $q.defer();
                $timeout(function () {
                    deferred.resolve(sampleArticles);
                }, 1000);
                return deferred.promise;
            },
            getArticleById: function (id) {
                for (var i = 0; i < sampleArticles.length; i += 1) {
                    if (sampleArticles[i].id === id)  {
                        return sampleArticles[i];
                    }
                }
                return undefined;
            },
            getSpecialArticles: function () {
                return privateArticles;
            }
        };
    var api2 = {
        foo: function () {
            var deferred = $q.defer();
            console.log('Inside the function');
            $timeout(function () {
                deferred.reject('Message');
            }, 1000);
            return deferred.promise;
        },
        bar: function () {
            console.log('bar');
        }
    };
    api2 = execute(Logger).onThrowOf(api2);
    api2 = execute(Logger).around(api2, {
        methodPattern: /^f/
    });
    api2 = execute(Logger).afterResolveOf(api2);
    api2 = execute(Logger).onRejectOf(api2);
    api2 = execute(Logger).after(api2);
    return api2;
//    return execute(Logger).onThrowOf(execute(Authorization).before(api, {
//        methodPattern: /Special/
//    }));
});
