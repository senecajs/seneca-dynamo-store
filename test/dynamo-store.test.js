/* Copyright (c) 2019-2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const Seneca = require('seneca')
const Plugin = require('..')
const PluginValidator = require('seneca-plugin-validator')


function make_seneca() {
  return Seneca({legacy:false})
    .test()
    .use('promisify')
    .use('entity')
    .use('doc')
    .use('..')
}

lab.test('validate', PluginValidator(Plugin, module))

lab.test('happy', async () => {
  var si = make_seneca()
  await si.ready()
  expect(si.find_plugin('dynamo-store')).exists()

  // double load works
  si.use('..')
  await si.ready()
  expect(si.find_plugin('dynamo-store')).exists()
})

lab.test('export', async () => {
  var si = make_seneca()
  await si.ready()
})
