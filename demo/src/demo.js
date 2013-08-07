DemoApp = angular.module('DemoApp', ['AngularAOP']);

DemoApp.controller('ArticlesListCtrl', function ($scope, ArticlesCollection) {
    ArticlesCollection.loadArticles().then(function () {
        try {
            var article = ArticlesCollection.getArticleById(0);
            ArticlesCollection.getSpecialArticles();
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
        if (args.exception) {
            console.log('%cException: ' + args.exception.message + '. ' + args.method + ' called before proper authorization.',
            'color: red; text-weight: bold; font-size: 1.2em;');
        }
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
                for (var i = 0; i < articles.length; i += 1) {
                    if (articles[i].id === id)  {
                        return articles[i];
                    }
                }
                return undefined;
            },
            getSpecialArticles: function () {
                return [
                { id: 3, title: 'Title 4', content: 'Content 4' },
                { id: 4, title: 'Title 5', content: 'Content 5' }
                ];
            }
        };
    return execute(Logger).onThrowOf(execute(Authorization).before(api, {
        methodPattern: /Special/
    }));
});
