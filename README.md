Table of Contents
========
* [About AngularAOP](#about-angularaop)
* [Online demo](#online-demo)
* [Usage](#usage)
* [What's new](#whats-new)
  * [v0.1.0](#v010)
  * [v0.1.1](#v011)
* [Roadmap](#roadmap)
* [License](#license)

About AngularAOP
===========

*AngularAOP* is simple framework for Aspect-Oriented Programming with AngularJS.
AOP fits great with AngularJS because of the framework architecture and also because it solves many cross-cutting concerns.

AngularAOP allows the usage of different aspects on a single method of given service or applying given aspect to all service's methods.

Few sample usages of AOP with AngularJS are:

* Logging
* Forcing authorization policies
* Caching
* Applying exception handling policies
* Instrumentation to gather performance statistics
* Retry logic, circuit breakers

Some of these use cases are suggested by [Christian Crowhurst](https://github.com/christianacca).

This micro-framework is only 1.5KB (minified and gzipped).

Online demo
============

If you prefer learning by doing (trial and error), come [right this way](http://plnkr.co/edit/R9juR0oe4xT5AHQs5uDF?p=preview).

Usage
======

For using AngularAOP you need to load the `AngularAOP` module:
```js
angular.module('myModule', ['AngularAOP']);
```

Your cross-cutting concerns can be defined in separate services. For example here is a definition of logging service which logs the method calls and thrown exception:

```js
DemoApp.factory('Logger', function () {
  return function (args) {
    if (args.exception) {
      console.log('%cException: ' + args.exception.message + '. '
          + args.method + ' called before proper authorization.',
          'color: red; text-weight: bold; font-size: 1.2em;');
    }
    var throwData = (args.exception) ? ' and threw: ' + args.exception.message : '';
    console.log('Method: ' + args.method + ', Pointcut: ' + args.when + ', with arguments: ' +
           angular.toJson(args.args) + throwData);
  };
});
```

The definition of that service doesn't differ from the usual service definition.

Let's look closer at the `args` argument of the logging service.
It has few properties which we use for logging:

* `result` - The result returned by the user function (when the joint point permit this).
* `exception` - `Error` object thrown inside the method to which the aspect was applied.
* `method` - The name of the method to which the aspect was applied.
* `when` - When the advice was applied i.e. when the actual logging was occurred.
* `arguments` - The arguments of the method to which the advice was applied.
* `resolveArgs` - The arguments passed to the resolve callback, when promise related aspects are used
* `rejectArgs` - The arguments passed to the reject callback, when promise related aspects are used


Let's look at one more declaration of aspect:

```js
DemoApp.factory('Authorization', function (User) {
  return function () {
    if (User.getUsername() !== 'foo' &&
        User.getPassword() !== 'bar') {
      throw new Error('Not authorized');
    }
  };
});
```

This is another common example for using AOP - authorization. The given service just checks whether user's user name and password are equal respectively to `foo` and `bar`, if they are not equal to these values the service throws an `Error('Not authorized')`.

We may want to apply authorization for reading news:

```js
DemoApp.service('ArticlesCollection', function ($q, $timeout, execute, Logger, Authorization) {

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
      getPrivateArticles: function () {
        return privateArticles;
      }
    };
  return api;
});
```

This is simple service which contains two kinds of articles (simple object literals): `sampleArticles` and `privateArticles`.
The `api` object is the actual service public interface.

We may want to apply authorization to the private articles, before the `getPrivateArticles` method return its result.
The usual way to do it is:

```js
getPrivateArticles: function () {
  Authorization();
  return privateArticles;
}
```

We may also want to apply authorization to the `getArticleById` method, so:

```js
getArticleById: function (id) {
  Authorization();
  for (var i = 0; i < sampleArticles.length; i += 1) {
    if (sampleArticles[i].id === id)  {
      return sampleArticles[i];
    }
  }
  return undefined;
}
```

We have two duplicate lines of code. At this moment it's not a big deal but we may want to add logging and see special error message in the console when `Error` is thrown:


```js
//...
getPrivateArticles: function () {
  try {
    Authorization();
    return privateArticles;
  } catch (e) {
    console.log('%cException: ' + e.message + '. getPrivateArticles called before proper authorization.',
        'color: red; text-weight: bold; font-size: 1.2em;');
  }
},
getArticleById: function (id) {
  try {
    Authorization();
    for (var i = 0; i < sampleArticles.length; i += 1) {
      if (sampleArticles[i].id === id)  {
        return sampleArticles[i];
      }
    }
  } catch (e) {
     console.log('%cException: ' + e.message + '. getArticleById called before proper authorization.',
        'color: red; text-weight: bold; font-size: 1.2em;');
  }
  return undefined;
}
//...
```

Now we have a lot of duplicates and if we want to change something in the code which authorizes the user and logs the error we should change it in both places. We may have service with large interface which requires logging and authorization (or something else) in all of its methods or big part of them. In this case we need something more powerful and the Aspect-Oriented Programming gives us the tools for that.

We can achieve the same effect as in the code above just by applying `Authorization` and `Logger` service to the `api` object:

```js
return execute(Logger).onThrowOf(execute(Authorization).before(api, {
  methodPattern: /Special|getArticleById/
}));
```

This code will invoke the `Authorization` service before executing the methods which match the pattern: `/Special|getArticleById/` when an `Error` is thrown the `Logger` will log it with detailed information.
Notice that `onThrowOf`, `before` and all the methods listed bellow return object with the same methods so chaining is possible.
We can also match the methods not only by their names but also by their arguments:


```js
return execute(Logger).onThrowOf(execute(Authorization).before(api, {
  methodPattern: /Special|getArticleById/,
  argsPatterns: [/^user$/, /^[Ii]d(_num)?$/]
}));
```

Now the aspects will be applied only to the methods which match both the `methodPattern` and `argsPatterns` rules.

Currently `execute` supports the following pointcuts:

* `before` - executes given service before the matched methods are invoked.
* `after` - executes given service after the matched methods are invoked.
* `around` - executes given service before and after the matched methods are invoked.
* `onThrowOf` - executes when an `Error` is thrown by method from the given set of matched methods.
* `onResolveOf` - executes after promise returned by a method from the given set of matched methods is resolved but before the resolve callback is invoked.
* `afterResolveOf` - executes after promise returned by a method from the given set of matched methods is resolved but after the resolve callback is invoked.
* `onRejectOf` - executes after promise returned by a method from the given set of matched methods is rejected.

Aspects can be applied not only to objects but also to functions:

```js
DemoApp.factory('ArticlesCollection', function ($q, $timeout, execute, Logger, Authorization) {
  return execute(Logger).before(function () {
    //body
  });
});
```

What's new
=========

##v0.1.0

New way of annotating. Now you can annotate in your config callback:

```js
DemoApp.config(function ($provide, executeProvider) {
  executeProvider.annotate($provide, {
    ArticlesCollection: {
      jointPoint: 'before',
      advice: 'Logger',
      methodPattern: /Special/,
      argsPatterns: [/arg1/, /arg2/, ..., /argn/]
    }
  });
});
```

##v0.1.1

Multiple aspects can be applied to single service through the new way of annotation:

```js
DemoApp.config(function ($provide, executeProvider) {
  executeProvider.annotate($provide, {
    ArticlesCollection: [{
      jointPoint: 'before',
      advice: 'Logger',
    }, {
      //aspect 2
    }, {
      //aspect 3
    }, ... , {
      //aspect n
    }]
  });
});
```

**Note:** In this way you won't couple your target methods/objects with the aspect at all but your target service must be defined as provider.

Roadmap
=======

1. *Use proper execution context inside the target services. This will fix the issue of invoking non-woven internal methods.*
2. Write solid amount of tests
3. Support of asynchronous advices
4. More flexible way of defining pointcuts (regexps?)
5. To put all aspect definitions outside the local scope of the provider for easier testing

License
=======

AngularAOP is distributed under the terms of the MIT license.
