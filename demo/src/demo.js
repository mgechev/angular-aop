DemoApp = angular.module('DemoApp', ['AngularAOP']);


DemoApp.controller('ArticlesListCtrl', function ($scope, ArticlesCollection) {
  ArticlesCollection.getSpecialArticles();
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

DemoApp.provider('Logger', function () {
  return {
    $get: function () {
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
    }
  }
});


DemoApp.provider('LoggerAsync', function () {
  return {
    $get: function ($timeout) {
      return function (args) {
        return $timeout(function () {
          console.log('Async logger', args);
        }, 1000);
      };
    }
  }
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

DemoApp.provider('ArticlesCollection', function () {
  return {
    $get: function ($q, $timeout, execute, Logger, Authorization) {
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
      return api;
    }
  };
});

DemoApp.config(function ($provide, executeProvider) {
  executeProvider.annotate($provide, {
    'ArticlesCollection': [{
      jointPoint: 'aroundAsync',
      advice: 'LoggerAsync',
      methodPattern: /Special/
    }]
  });
});