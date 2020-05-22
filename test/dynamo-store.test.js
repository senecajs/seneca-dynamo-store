/* Copyright (c) 2019-2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const Seneca = require('seneca')
const Plugin = require('..')
const PluginValidator = require('seneca-plugin-validator')


var LegacyStoreTest = require('seneca-store-test')


function make_seneca(config) {
  config = Object.assign({seneca:{},plugin:{}}, config)
  return Seneca(Object.assign({legacy:false}, config.seneca))
    .test()

  // make sure mem-store isn't being tested!
    .ignore_plugin('mem-store')

    .use('promisify')
    .use('entity')
    .use('doc')
    .use('..',Object.assign({
      aws: {
        endpoint: process.env.SENECA_DYNAMO_ENDPOINT || "http://localhost:8000",
      }
    }, config.plugin))
}

lab.test('validate', PluginValidator(Plugin, module))

lab.test('happy', async () => {
  var si = make_seneca()
  await si.ready()
  expect(si.find_plugin('dynamo-store$1')).exists()

  // double load works
  si.use('..')
  await si.ready()
  expect(si.find_plugin('dynamo-store$2')).exists()
})

lab.test('export', async () => {
  var si = make_seneca()
  await si.ready()

  var get_dc = si.export('dynamo-store$1/get_dc')
  expect(get_dc()).exists()
})

lab.test('legacy-store-test', async () => {
  var si = make_seneca()
  await si.ready()

  var si_no_merge = make_seneca({plugin:{merge:false}})
  await si.ready()

  LegacyStoreTest.basictest({
    seneca: si,
    senecaMerge: si_no_merge,
    script: lab
  })
})




lab.test('store-core', async () => {
  var si = make_seneca()
  await testrun.store_core({seneca:si,expect,log:console.log})
})

lab.test('store-load', async () => {
  var si = make_seneca()
  await testrun.store_load({seneca:si,expect,log:console.log})
})




const testrun = {
  store_core: async function(opts) {
    var seneca = opts.seneca
    var expect = opts.expect
    var log = opts.log

    
    // S00100: Load non-existent returns null.
    var foo0n = await seneca.entity('test/foo').load$('not-an-id')
    expect(foo0n).equal(null)
    log && log('S00100', foo0n)
    
    // S00200: Create unsaved entity
    var m0 = (Math.random()+'').substring(2)
    var foo0p = seneca.entity('test/foo').make$({m:m0,s:'s0',i:0,b:true})

    log && log('S00200', foo0p)
    expect(foo0p).exists()
    expect(foo0p.id).not.exists()
    expect(foo0p.data$(false)).equals({m:m0,s:'s0',i:0,b:true})

    
    // S00300: Save entity; generates id
    var foo0 = await foo0p.save$()

    log && log('S00300', foo0)
    expect(foo0).exists()
    expect(foo0p != foo0).true()
    expect(foo0.id).string().not.equal('')
    expect(foo0.data$()).includes({
      entity$: {
        base: 'test',
        name: 'foo',
        zone: undefined
      },
      i: 0,
      m: m0,
      s: 's0',
      b: true
    })
    expect(Object.keys(foo0.data$(false)).sort())
      .equals(['b','i', 'id', 'm', 's'])

    
    // S00400: Load existing by id returns entity.
    var foo0o = await seneca.entity('test/foo').load$(foo0.id)

    log && log('S00400', foo0.id, foo0o)
    expect(foo0o).exists()
    expect(foo0o != foo0).true()
    expect(foo0o.data$()).equals(foo0.data$())

    
    // S00500: List by query
    var foolist0 = await seneca.entity('test/foo').list$({m:m0})

    log && log('S00500', m0, foolist0)
    expect(foolist0.length).equals(1)
    expect(foolist0[0].data$()).equals(foo0o.data$())

    
    // S00600: Remove by id 
    var foo0ro = await seneca.entity('test/foo').remove$(foo0.id)

    log && log('S00600', foo0.id, foo0ro)
    expect(foo0ro).equal(null)

    
    // S00700: Load by removed id
    var foo0r = await seneca.entity('test/foo').load$(foo0.id)

    log && log('S00700', foo0.id, foo0r)
    expect(foo0r).equal(null)

    
    // S00800: List removed by query returns []
    var foolist0r = await seneca.entity('test/foo').list$({m:m0})

    log && log('S00800', m0, foolist0r)
    expect(foolist0r.length).equals(0)
    
  },


  store_load: async function(opts) {
    var seneca = opts.seneca
    var expect = opts.expect
    var log = opts.log
    
    // S00900: Load by field
    var m1 = (Math.random()+'').substring(2)
    var foo1 = await seneca.entity('test/foo').make$({m:m1,s:'s1',i:1,b:true}).save$()
    var foo1o = await seneca.entity('test/foo').load$({m:m1})
    
    log && log('S00900', foo1, foo1o)
    expect(foo1).exists()
    expect(foo1o).exists()
    expect(foo1.data$()).equal(foo1o.data$())
  }
}
