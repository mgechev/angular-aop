<img src="https://travis-ci.org/mgechev/angular-aop.svg?branch=master" alt="">

# Online demo

If you prefer learning by doing (trial and error), come [right this way](http://plnkr.co/edit/R9juR0oe4xT5AHQs5uDF?p=preview).

# API

AngularAOP allows you to apply aspect-oriented programming in your AngularJS applications.

If you notice that you have cross-cutting concerns you can isolate them in individual services and apply them as follows:

```javascript
myModule.config(function ($provide, executeProvider) {
  executeProvider.annotate($provide, {
    ServiceToWove: [{
      jointPoint: JOINT_POINT,
      advice: ADVICE_NAME,
      methodPattern: /Special/
      argsPattern: [/arg1/, /arg2/]
    }, {
      jointPoint: JOINT_POINT
      advice: ADVICE_NAME
    }]
  });
});
```

The joint-points supported in the current version of the framework are:

- `after` - the advice will be invoked after the target method
- `afterResolveOf` - the advice will be invoked after the promise returned by target method has been resolved and after the resolve callback attached to the promise is invoked
- `aroundAsync` - the advice will be invoked before the target method was invoked and after the promise returned by it was resolved
- `around` - the advice will be invoked before the target method was invoked and after it was invoked
- `beforeAsync` - the target method will be called after the promise returned by the advice was resolved
- `before` - the target method will be invoked after the advice
- `onRejectOf` - the advice will be invoked when the promise returned by the target method was rejected
- `onResolveOf` - the advice will be invoked after the promise returned by the target method was resolved but before the resolve callback attached to the promise is invoked
- `onThrowOf` - the advice will be called if the target method throws an error

For additional information about Aspect-Oriented Programming and AngularAOP visit the [project's documentation](https://github.com/mgechev/angular-aop/tree/master/docs) and [this blog post](http://blog.mgechev.com/2013/08/07/aspect-oriented-programming-with-javascript-angularjs/).

# Known issues

## Circular dependency

This is not issue in AngularAOP but something which should be considered when using Dependency Injection.

Note that if the `$injector` tries to get a service that depends on itself, either directly or indirectly you will get error "Circular dependency". To fix this, construct your dependency chain such that there are no circular dependencies. Check the [following article](http://misko.hevery.com/2008/08/01/circular-dependency-in-constructors-and-dependency-injection/), it can give you a basic idea how to procceed.

# Change log

## v0.1.0

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

## v0.1.1

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

## v0.2.0

Added `forceObject` property to the rules. This way issues like [#12](https://github.com/mgechev/angular-aop/issues/12) will not be reproducable since we can force the framework to wrap the target's method, insted of the target itself (in case the target is a function with "static" methods").

Issues fixed:

- Once a function is wrapped into an aspect its methods are preserved. We add the target to be prototype of the wrapper, this way using the prototype chain the required methods could be found.

## v0.2.1

Added tests for:

- Before async joint-point
- On resolve joint-point

Add JSCS and update Gruntfile.js

## v0.3.0

- `deep` config property, which allows adding wrappers to prototype methods
- Fix `forceObject`

# Roadmap

1. *Use proper execution context inside the target services. This will fix the issue of invoking non-woven internal methods.*
2. Use constants for the joint-point's names
3. Write solid amount of tests
4. More flexible way of defining pointcuts (patching `$provide.provider` might be required)

# Contributors

[<img alt="mgechev" src="https://avatars.githubusercontent.com/u/455023?v=3&s=117" width="117">](https://github.com/mgechev) |[<img alt="Wizek" src="https://avatars.githubusercontent.com/u/491672?v=3&s=117" width="117">](https://github.com/Wizek) |[<img alt="slobo" src="https://avatars.githubusercontent.com/u/167772?v=3&s=117" width="117">](https://github.com/slobo) |[<img alt="bitdeli-chef" src="https://avatars.githubusercontent.com/u/3092978?v=3&s=117" width="117">](https://github.com/bitdeli-chef) |[<img alt="christianacca" src="https://avatars.githubusercontent.com/u/886590?v=3&s=117" width="117">](https://github.com/christianacca) |[<img alt="peernohell" src="https://avatars.githubusercontent.com/u/119765?v=3&s=117" width="117">](https://github.com/peernohell) |
:---: |:---: |:---: |:---: |:---: |:---: |
[mgechev](https://github.com/mgechev) |[Wizek](https://github.com/Wizek) |[slobo](https://github.com/slobo) |[bitdeli-chef](https://github.com/bitdeli-chef) |[christianacca](https://github.com/christianacca) |[peernohell](https://github.com/peernohell) |


# License

AngularAOP is distributed under the terms of the MIT license.

