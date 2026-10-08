![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/dynamo-store

An AWS DynamoDB entity store for Seneca: `save$`, `load$`, `list$` and
`remove$` on seneca-entity entities become DynamoDB `PutItem`,
`UpdateItem`, `GetItem`, `Query`, `Scan` and `DeleteItem` calls through
the AWS SDK v3. Works with Seneca 3 and Seneca 4 (tested on
4.0.0-rc5 and 4.0.0), Node 22 and 24.

[![npm version](https://img.shields.io/npm/v/@seneca/dynamo-store.svg)](https://npmjs.com/package/@seneca/dynamo-store)
[![build](https://github.com/senecajs/seneca-dynamo-store/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-dynamo-store/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-dynamo-store/badge.svg)](https://snyk.io/test/github/senecajs/seneca-dynamo-store)
[![Maintainability](https://api.codeclimate.com/v1/badges/404faaa89a95635ddfc0/maintainability)](https://codeclimate.com/github/senecajs/seneca-dynamo-store/maintainability)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca seneca-entity seneca-promisify @seneca/dynamo-store
npm install @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb
```

## Quick Example

```js
const Seneca = require('seneca')

const seneca = Seneca()
  .use('promisify')
  .use('entity')
  .use('@seneca/dynamo-store', {
    aws: { region: 'eu-west-1' },
  })

seneca.ready(async () => {
  // table shop_product must exist, partition key: id (string)
  const apple = await seneca.entity('shop/product').data$({ name: 'apple' }).save$()
  console.log(await seneca.entity('shop/product').load$(apple.id))
})
```

## More Examples

* [Getting started](docs/tutorials/getting-started.md): a complete program against DynamoDB Local.
* [Configure tables, keys and indexes](docs/how-to/configure-tables.md)
* [Run the tests locally](docs/how-to/run-tests-locally.md)
* [Use with Seneca 4](docs/how-to/migrate-from-seneca-3.md)
* Runnable code: [docs/examples](docs/examples/getting-started.js)

## Motivation

Seneca entities give business logic one data API whatever the database.
This plugin lets that API use DynamoDB, including sort keys and
secondary indexes. See [How the store works](docs/explanation/how-it-works.md).

## Support

* Questions and bugs: [GitHub issues](https://github.com/senecajs/seneca-dynamo-store/issues)
* Seneca documentation: [senecajs.org](http://senecajs.org)
* Commercial support: [Voxgig](https://www.voxgig.com)

## API

| Topic | Reference |
| ----- | --------- |
| Options (`aws`, `merge`, `entity`, `marshall`, ...) | [Options](docs/reference/options.md) |
| Store patterns and query directives | [Messages](docs/reference/messages.md) |
| Query operators, Query versus Scan | [Queries](docs/reference/queries.md) |
| `get_client` export | [Exports](docs/reference/api.md) |

The full list is in the [documentation index](docs/README.md).

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open
participation. To run the tests (Node 24 or 22, Docker):

```sh
npm install
npm run services:up    # DynamoDB Local on port 18001
npm test               # devDependency seneca@^4.0.0-rc5
npm run services:down
```

Details: [Run the tests locally](docs/how-to/run-tests-locally.md).
CI workflow changes are delivered as patches in [.patches](.patches/README.md).

## Background

The store started in 2020 on the AWS SDK v2 DocumentClient and moved to
the AWS SDK v3 in version 6.

| Version | Seneca | Node |
| ------- | ------ | ---- |
| 6.2.1 | 3.x, 4.x | 22, 24 |
| 6.2.0 | 3.x | 16+ |

License: [MIT](LICENSE).
