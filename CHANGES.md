## 6.2.1 2026-10-08

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




