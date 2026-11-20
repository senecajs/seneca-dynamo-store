# Changes

## 7.0.0 2026-11-20

6.2.1 was prepared but not published; its changes are part of this
version.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was
  `>=3||>=4.0.0-rc2`). Seneca 3 users stay on `@seneca/dynamo-store@6`.
* Node.js 24 or later (`engines.node` `>=24`).
* The entity peer dependency is `@seneca/entity` `^29.0.0` (was
  `seneca-entity` `>=26`). Load it before the store, by its full name.
  Without it the store now stops at load with a message that says to
  load `@seneca/entity` first.
* The `seneca-promisify` peer dependency is removed; Seneca 4 has the
  promise API built in (D4).
* Option defaults are built with the `valid` builders that Seneca passes
  in, so the module no longer requires `seneca` when it is loaded. The
  options are unchanged.
* Tests use `@seneca/entity` 29, `@seneca/store-test` 7 and
  `seneca-plugin-validator` 0.7, load plugins by full name (B14), wait
  with `await seneca.ready()`, and were run on Seneca 4.0.0 against
  DynamoDB Local 3.3.1. Removed the development dependencies
  `seneca-entity`, `seneca-store-test` and `seneca-promisify`.
* README and docs: install `seneca@^4` and `@seneca/entity`, no
  `seneca-promisify`, Node.js 24 (trap T18).
* `files` lists `CHANGES.md` instead of `dynamo-store-docs.js` and
  `lib`, which do not exist; `publishConfig.access` is `public`.


## 6.2.1 2026-10-08 (not published)

* Support the Seneca 4 prerelease (tested on 4.0.0-rc5 and 4.0.0); Node 24 and 22.
* Tests: @hapi/lab 26, DynamoDB Local 3.3.1 through docker-compose (`npm run services:up`), tables created in `pretest`, endpoint from `SENECA_DYNAMO_ENDPOINT` (default `http://localhost:18001`).
* Dependencies: current AWS SDK v3, seneca-entity 28, seneca-store-test 6; removed seneca-doc, coveralls, seneca-msg-test, Travis.
* Documentation reorganised into docs/ (Diataxis).
* No behaviour change.


## 1.0.0 2021-09-28

* Update deps.


## 0.9.2 2021-09-27

* Fix Fix paging


## 0.9.1 2021-09-27

* Fix paging


## 0.9.0 2021-09-27

* Paging


## 0.8.2 2021-09-27

* Fix ProjectionExpression names


## 0.8.0 2021-09-27

* Support field$ directive on lists
* Update deps


## 0.0.1 2020-05-01

* Reboot store




