![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/dynamo-store

[![npm version](https://img.shields.io/npm/v/@seneca/dynamo-store.svg)](https://npmjs.com/package/@seneca/dynamo-store)
[![build](https://github.com/senecajs/seneca-dynamo-store/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-dynamo-store/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-dynamo-store/badge.svg)](https://snyk.io/test/github/senecajs/seneca-dynamo-store)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-dynamo-store/badge.svg?branch=master)](https://coveralls.io/github/senecajs/seneca-dynamo-store?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/404faaa89a95635ddfc0/maintainability)](https://codeclimate.com/github/senecajs/seneca-dynamo-store/maintainability)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca
npm install seneca-promisify // dependency
npm install seneca-entity // dependency
npm install @seneca/dynamo-store
npm install aws-sdk
```

### Quick example

```js
const Seneca = require('seneca')

var seneca = Seneca()
  .use('promisify')
  .use('entity')
  .use('dynamo-store')
```

### Detailed Examples

<!--START:action-list-->
<!--END:action-list-->

<!--START:action-desc-->
<!--END:action-desc-->

## Quick Example

```js
const Seneca = require('seneca')

var seneca = Seneca()
  .use('promisify')
  .use('entity')
  .use('dynamo-store')
```

## More Examples

See [test/](test/) for more usage examples.

## Motivation

AWS DynamoDB data store plugin for Seneca.

## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-dynamo-store/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

### Description

This module is a plugin for
the [Seneca framework](http://senecajs.org). It provides a set of
common dynamo-store management actions (`register`, `login` etc.).

### WARNING

The current naive implementation of upserts fails the race condition test. Please be advised.

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

### Running tests

```sh
npm run test
```

## Background

Uses the [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) for DynamoDB operations. **Note:** Work in progress.
