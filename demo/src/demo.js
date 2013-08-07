DemoApp = angular.module('DemoApp', ['AngularAOP']);

DemoApp.controller('ArticlesListCtrl', function ($scope, ArticlesCollection) {
    ArticlesCollection.loadArticles().then(function () {
        try {
            var article = ArticlesCollection.getArticleById(0);
        } catch (e) {
            console.error(e.message);
        }
    });
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
        args.args.forEach(function (arg, idx) {
            if (arg instanceof Error) {
                console.log('%cException: ' + arg.message, 'color: red; text-weight: bold; font-size: 1.2em;');
                args.args.splice(idx, 1);
            }
        });
        var throwData = (args.exception) ? ' and threw: ' + args.exception.message : '';
        console.log('Method: ' + args.method + ', Pointcut: ' + args.when + ', with arguments: ' +
                    angular.toJson(args.args) + throwData);
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

DemoApp.service('ArticlesCollection', function ($q, $timeout, execute, Logger, Authorization) {

    var articles = null,
        api = {
            loadArticles: function () {
                var deferred = $q.defer();
                $timeout(function () {
                    articles = [
                    {
                        id: 0,
                        title: 'Title 1',
                        content: 'Content 1'
                    },
                    {
                        id: 1,
                        title: 'Title 2',
                        content: 'Content 2'
                    },
                    {
                        id: 2,
                        title: 'Title 3',
                        content: 'Content 3'
                    }
                    ];
                    deferred.resolve(articles);
                }, 1000);
                return deferred.promise;
            },
            getArticleById: function (id) {
                var articles = this._articles;
                for (var i = 0; i < articles.length; i += 1) {
                    if (articles[i].id === id)  {
                        return articles[i];
                    }
                }
                return undefined;
            }
        };
    execute(Logger).before(api);
    execute(Logger).after(api);
    execute(Logger).onThrowOf(api);
    return api;
});
