![Seneca](http://senecajs.org/files/assets/seneca-logo.png)

> A [Seneca.js][] dynamo-store management plugin.

# @seneca/dynamo-store
[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Maintainability][codeclimate-badge]][codeclimate-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter][gitter-badge]][gitter-url]


| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|


## Description

This module is a plugin for
the [Seneca framework](http://senecajs.org). It provides a set of
common dynamo-store management actions (`register`, `login` etc.).


## Install

```sh
npm install seneca
npm install seneca-promisify // dependency
npm install seneca-entity // dependency
npm install @seneca/dynamo-store
```

### Quick example

Register a dynamo-store and then create an automatic login for testing.

```js
const Seneca = require('seneca')

var seneca = Seneca()
  .use('promisify')
  .use('entity')
  .use('dynamo-store')

var out = await seneca.post('sys:dynamo-store,register:dynamo-store', {
  handle: 'alice'
})

console.log('DYNAMO-STORE:', out.dynamo-store)

out = await seneca.post('sys:dynamo-store,login:dynamo-store', {
  handle: 'alice',
  auto: true
})

console.log('LOGIN:', out.login)

```

### Detailed Examples

Because Seneca treats messages as first-class citizens, 90% of unit
testing can be implemented with message scenarios that also provide
detailed usage examples:

* [register_get](test/register_get.calls.js)
* [password](test/password.calls.js)
* [adjust](test/adjust.calls.js)
* [verify](test/verify.calls.js)
* [login](test/login.calls.js)
* [logout](test/logout.calls.js)
* [change](test/change.calls.js)
* [final](test/final.calls.js)


<!--START:action-list-->


## Action Patterns

* [adjust:dynamo-store,sys:dynamo-store](#-adjustdynamo-storesysdynamo-store-)
* [auth:dynamo-store,sys:dynamo-store](#-authdynamo-storesysdynamo-store-)
* [change:pass,sys:dynamo-store](#-changepasssysdynamo-store-)
* [change:handle,sys:dynamo-store](#-changehandlesysdynamo-store-)
* [change:email,sys:dynamo-store](#-changeemailsysdynamo-store-)
* [change:password,sys:dynamo-store](#-changepasswordsysdynamo-store-)
* [check:verify,sys:dynamo-store](#-checkverifysysdynamo-store-)
* [check:exists,sys:dynamo-store](#-checkexistssysdynamo-store-)
* [cmd:encrypt,hook:password,sys:dynamo-store](#-cmdencrypthookpasswordsysdynamo-store-)
* [cmd:pass,hook:password,sys:dynamo-store](#-cmdpasshookpasswordsysdynamo-store-)
* [get:dynamo-store,sys:dynamo-store](#-getdynamo-storesysdynamo-store-)
* [list:dynamo-store,sys:dynamo-store](#-listdynamo-storesysdynamo-store-)
* [list:login,sys:dynamo-store](#-listloginsysdynamo-store-)
* [list:verify,sys:dynamo-store](#-listverifysysdynamo-store-)
* [login:dynamo-store,sys:dynamo-store](#-logindynamo-storesysdynamo-store-)
* [logout:dynamo-store,sys:dynamo-store](#-logoutdynamo-storesysdynamo-store-)
* [make:verify,sys:dynamo-store](#-makeverifysysdynamo-store-)
* [register:dynamo-store,sys:dynamo-store](#-registerdynamo-storesysdynamo-store-)
* [remove:dynamo-store,sys:dynamo-store](#-removedynamo-storesysdynamo-store-)
* [sys:dynamo-store,update:dynamo-store](#-sysdynamo-storeupdatedynamo-store-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `adjust:dynamo-store,sys:dynamo-store` &raquo;

Adjust dynamo-store status idempotently (activated, etc.).


#### Parameters


* _active_ : boolean <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store found',
  dynamo-store: 'dynamo-store entity'
}
```


----------
### &laquo; `auth:dynamo-store,sys:dynamo-store` &raquo;

Authenticate a login using token


#### Parameters


* _token_ : string <i><small>{presence:required}</small></i>
* _dynamo-store_fields_ : array <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if login is active',
  dynamo-store: 'dynamo-store entity',
  login: 'dynamo-store entity'
}
```


----------
### &laquo; `change:pass,sys:dynamo-store` &raquo;

Change dynamo-store password.


#### Parameters


* _pass_ : string
* _repeat_ : string <i><small>{presence:optional}</small></i>
* _verify_ : string <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if changed',
  dynamo-store: 'dynamo-store entity'
}
```


----------
### &laquo; `change:handle,sys:dynamo-store` &raquo;

Change dynamo-store handle.


#### Parameters


* _new_handle_ : string
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if changed',
  dynamo-store: 'dynamo-store entity'
}
```


----------
### &laquo; `change:email,sys:dynamo-store` &raquo;

Change dynamo-store email.


#### Parameters


* _new_email_ : string
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if changed',
  dynamo-store: 'dynamo-store entity'
}
```


----------
### &laquo; `change:password,sys:dynamo-store` &raquo;

Change dynamo-store password.


#### Parameters


* _pass_ : string
* _repeat_ : string <i><small>{presence:optional}</small></i>
* _verify_ : string <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if changed',
  dynamo-store: 'dynamo-store entity'
}
```


----------
### &laquo; `check:verify,sys:dynamo-store` &raquo;

Check a verfication entry.


#### Parameters


* _kind_ : string <i><small>{presence:optional}</small></i>
* _code_ : string <i><small>{presence:optional}</small></i>
* _now_ : number <i><small>{presence:optional}</small></i>
* _expiry_ : boolean <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if valid',
  why: 'string coded reason if not valid'
}
```


----------
### &laquo; `check:exists,sys:dynamo-store` &raquo;

Check dynamo-store exists.


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store exists',
  dynamo-store: 'dynamo-store entity'
}
```


----------
### &laquo; `cmd:encrypt,hook:password,sys:dynamo-store` &raquo;

Encrypt a plain text password string.




#### Examples



* `cmd:encrypt,hook:password,sys:dynamo-store,pass:foofoobarbar`
  * Result: {ok:true, pass:_encrypted-string_, salt:_string_}
#### Parameters


* _salt_ : string <i><small>{presence:optional}</small></i>
* _pass_ : string <i><small>{presence:optional}</small></i>
* _password_ : string <i><small>{presence:optional}</small></i>
* _rounds_ : number <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if encryption succeeded',
  pass: 'encrypted password string',
  salt: 'salt value string'
}
```


----------
### &laquo; `cmd:pass,hook:password,sys:dynamo-store` &raquo;

Validate a plain text password string.




#### Examples



* `cmd:pass,hook:password,sys:dynamo-store,pass:goodpassword`
  * Result: {ok:true}
#### Parameters


* _salt_ : string
* _pass_ : string
* _proposed_ : string
* _rounds_ : number <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if password is valid',
  why: 'string coded reason if not valid'
}
```


----------
### &laquo; `get:dynamo-store,sys:dynamo-store` &raquo;

Get dynamo-store details


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store found',
  dynamo-store: 'dynamo-store entity'
}
```


----------
### &laquo; `list:dynamo-store,sys:dynamo-store` &raquo;

List dynamo-stores


#### Parameters


* _active_ : boolean <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store found',
  items: 'dynamo-store entity item list'
}
```


----------
### &laquo; `list:login,sys:dynamo-store` &raquo;

List logins for a dynamo-store


#### Parameters


* _active_ : boolean <i><small>{presence:optional}</small></i>
* _login_q_ : object <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store found',
  items: 'dynamo-store entity item list'
}
```


----------
### &laquo; `list:verify,sys:dynamo-store` &raquo;

Create a verification entry (multiple use cases).


#### Parameters


* _kind_ : string
* _code_ : string <i><small>{presence:optional}</small></i>
* _once_ : boolean <i><small>{presence:optional}</small></i>
* _valid_ : boolean <i><small>{presence:optional}</small></i>
* _custom_ : object <i><small>{presence:optional}</small></i>
* _expire_point_ : number <i><small>{presence:optional}</small></i>
* _expire_duration_ : number <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store found',
  verify: 'verify entity'
}
```


----------
### &laquo; `login:dynamo-store,sys:dynamo-store` &raquo;

Login dynamo-store


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>
* _auto_ : boolean <i><small>{presence:optional}</small></i>
* _pass_ : string <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store logged in',
  dynamo-store: 'dynamo-store entity',
  login: 'login entity'
}
```


----------
### &laquo; `logout:dynamo-store,sys:dynamo-store` &raquo;

Login dynamo-store


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>
* _token_ : string <i><small>{presence:optional}</small></i>
* _login_in_ : string <i><small>{presence:optional}</small></i>
* _login_q_ : object <i><small>{presence:optional,default:{}}</small></i>
* _load_logins_ : boolean <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store logged in',
  count: 'number of logouts'
}
```


----------
### &laquo; `make:verify,sys:dynamo-store` &raquo;

Create a verification entry (multiple use cases).


#### Parameters


* _kind_ : string
* _code_ : string <i><small>{presence:optional}</small></i>
* _once_ : boolean <i><small>{presence:optional}</small></i>
* _valid_ : boolean <i><small>{presence:optional}</small></i>
* _custom_ : object <i><small>{presence:optional}</small></i>
* _expire_point_ : number <i><small>{presence:optional}</small></i>
* _expire_duration_ : number <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store found',
  verify: 'verify entity'
}
```


----------
### &laquo; `register:dynamo-store,sys:dynamo-store` &raquo;

Register a new dynamo-store


#### Parameters


* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_ : object <i><small>{unknown:true}</small></i>
* _dynamo-store_data_ : object <i><small>{unknown:true}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store registration succeeded',
  dynamo-store: 'dynamo-store entity'
}
```


----------
### &laquo; `remove:dynamo-store,sys:dynamo-store` &raquo;

Remove a dynamo-store


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store removed',
  dynamo-store: 'dynamo-store entity'
}
```


----------
### &laquo; `sys:dynamo-store,update:dynamo-store` &raquo;

Update a dynamo-store


#### Parameters


* _dynamo-store_ : object <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _dynamo-store_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if dynamo-store updated',
  dynamo-store: 'dynamo-store entity'
}
```


----------


<!--END:action-desc-->



## License

Copyright (c) 2010-2020, Richard Rodger and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[Seneca.js]: https://www.npmjs.com/package/seneca
[travis-badge]: https://travis-ci.org/senecajs/seneca-dynamo-store.svg
[travis-url]: https://travis-ci.org/senecajs/seneca-dynamo-store
[coveralls-badge]: https://coveralls.io/repos/github/senecajs/seneca-dynamo-store/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/senecajs/seneca-dynamo-store?branch=master
[codeclimate-badge]: https://api.codeclimate.com/v1/badges/404faaa89a95635ddfc0/maintainability
[codeclimate-url]: https://codeclimate.com/github/senecajs/seneca-dynamo-store/maintainability
[npm-badge]: https://img.shields.io/npm/v/@seneca/dynamo-store.svg
[npm-url]: https://npmjs.com/package/@seneca/dynamo-store
[david-badge]: https://david-dm.org/senecajs/seneca-dynamo-store.svg
[david-url]: https://david-dm.org/senecajs/seneca-dynamo-store
[gitter-badge]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/senecajs/seneca
[Senecajs org]: https://github.com/senecajs/
