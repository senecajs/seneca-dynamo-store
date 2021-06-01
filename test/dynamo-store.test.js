/* Copyright (c) 2019-2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Code = require('@hapi/code')
const expect = Code.expect

const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())

const Seneca = require('seneca')
const Plugin = require('..')
const PluginValidator = require('seneca-plugin-validator')

const LegacyStoreTest = require('seneca-store-test')

function make_seneca(config) {
  config = Object.assign({ seneca: {}, plugin: {} }, config)
  return (
    Seneca(Object.assign({ legacy: false }, config.seneca))
      .test()

      // make sure mem-store isn't being tested!
      .ignore_plugin('mem-store')

      .use('promisify')
      .use('entity')
      .use('doc')
      .use(
        '..',
        Object.assign(
          {
            aws: {
              endpoint:
                process.env.SENECA_DYNAMO_ENDPOINT || 'http://localhost:18000',
              accessKeyId: 'none',
              secretAccessKey: 'none',
            },
          },
          config.plugin
        )
      )
  )
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

lab.describe('legacy-store-test', () => {
  const plugin = {
    entity: {
      'moon/bar': {
        // for special handling
        fields: {
          wen: {
            type: 'date'
          }
        }
      }
    }
  }


  const si = make_seneca({ plugin })

  lab.before(() => si.ready())


  const si_no_merge = make_seneca({
    plugin: Object.assign({ merge: false }, plugin)
  })

  lab.before(() => si_no_merge.ready())


  lab.describe('basic tests', () => {
    LegacyStoreTest.basictest({
      seneca: si,
      senecaMerge: si_no_merge,
      script: lab
    })
  })

  lab.describe('limit tests', () => {
    LegacyStoreTest.limitstest({
      seneca: si,
      script: lab
    })
  })

  /*
  lab.describe('sort tests', () => {
    LegacyStoreTest.sorttest({
      seneca: si,
      script: lab
    })
  })
  */
})

var plugin = {
  entity: {
    'test/foo': {
      // for special handling
      fields: {
        d1: {
          type: 'date',
        },
      },
    },
  },
}

lab.test('store-core', async () => {
  var si = make_seneca({ plugin })
  await testrun.store_core({ seneca: si, expect, log: console.log })
})

lab.test('store-load', async () => {
  var si = make_seneca({ plugin })
  await testrun.store_load({ seneca: si, expect, log: console.log })
})

lab.test('store-save', async () => {
  var si = make_seneca({ plugin })
  await testrun.store_save({ seneca: si, expect, log: console.log })
})

// TODO: list: IN queries

const testrun = {
  store_core: async function (opts) {
    var seneca = opts.seneca
    var expect = opts.expect
    var log = opts.log

    // S00010: Clear test/foo
    await seneca.entity('test/foo').remove$({ all$: true })
    var foolist = await seneca.entity('test/foo').list$()

    log && log('S00010', foolist)
    expect(foolist.length).equal(0)

    // S00100: Load non-existent returns null.
    var foo0n = await seneca.entity('test/foo').load$('not-an-id')

    log && log('S00100', foo0n)
    expect(foo0n).equal(null)

    // S00200: Create unsaved entity
    var m0 = (Math.random() + '').substring(2)
    var foo0p = seneca.entity('test/foo').make$({
      m: m0,
      s: 's0',
      i: 0,
      b: true,
      o: { x: 1, y: null },
      a: [2, null],
      oc: { y: 3, z: { q: 4, u: ['a', 'b'], v: [{ w: 5 }] } },
      ac: [{ x: 6, y: 7 }, { x: 8, z: 9 }, { u: [{ a: 1 }] }],
    })

    log && log('S00200', foo0p)
    expect(foo0p).exists()
    expect(foo0p.id).not.exists()
    expect(foo0p.data$(false)).equals({
      m: m0,
      s: 's0',
      i: 0,
      b: true,
      o: { x: 1, y: null },
      a: [2, null],
      oc: { y: 3, z: { q: 4, u: ['a', 'b'], v: [{ w: 5 }] } },
      ac: [{ x: 6, y: 7 }, { x: 8, z: 9 }, { u: [{ a: 1 }] }],
    })

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
        zone: undefined,
      },
      i: 0,
      m: m0,
      s: 's0',
      b: true,
      o: { x: 1, y: null },
      a: [2, null],
      oc: { y: 3, z: { q: 4, u: ['a', 'b'], v: [{ w: 5 }] } },
      ac: [{ x: 6, y: 7 }, { x: 8, z: 9 }, { u: [{ a: 1 }] }],
    })
    expect(Object.keys(foo0.data$(false)).sort()).equals([
      'a',
      'ac',
      'b',
      'i',
      'id',
      'm',
      'o',
      'oc',
      's',
    ])

    // S00400: Load existing by id returns entity.
    var foo0o = await seneca.entity('test/foo').load$(foo0.id)

    log && log('S00400', foo0.id, foo0o)
    expect(foo0o).exists()
    expect(foo0o != foo0).true()
    expect(foo0o.data$()).equals(foo0.data$())

    // S00500: List by query
    var foolist0 = await seneca.entity('test/foo').list$({ m: m0 })

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
    var foolist0r = await seneca.entity('test/foo').list$({ m: m0 })

    log && log('S00800', m0, foolist0r)
    expect(foolist0r.length).equals(0)
  },

  store_load: async function (opts) {
    var seneca = opts.seneca
    var expect = opts.expect
    var log = opts.log

    // S01000: Load by field
    var m1 = (Math.random() + '').substring(2)
    var foo1 = await seneca
      .entity('test/foo')
      .make$({ m: m1, s: 's1', i: 1, b: true })
      .save$()
    var foo1o = await seneca.entity('test/foo').load$({ m: m1 })

    log && log('S01000', foo1, foo1o)
    expect(foo1).exists()
    expect(foo1o).exists()
    expect(foo1.data$()).equal(foo1o.data$())

    // S01100: Load by two fields
    var foo1om = await seneca.entity('test/foo').load$({ m: m1, s: 's1' })

    log && log('S01100', foo1om)
    expect(foo1om).exists()
    expect(foo1.data$()).equal(foo1om.data$())

    // S01200: Load with no fields finds nothing
    var foo1n = await seneca.entity('test/foo').load$({})

    log && log('S01200', foo1n)
    expect(foo1n).equal(null)
  },

  store_save: async function (opts) {
    var seneca = opts.seneca
    var expect = opts.expect
    var log = opts.log

    // S10000: new entity: null saved, undefined ignored
    var m0 = (Math.random() + '').substring(2)
    var foo0 = await seneca
      .entity('test/foo')
      .make$({
        m: m0,
        s1: null,
        s2: undefined,
        b: true,
      })
      .save$()
    var foo0o = await seneca.entity('test/foo').load$(foo0.id)

    log && log('S10000', foo0, foo0o)
    expect(foo0o.data$(false)).equal({
      id: foo0o.id,
      m: m0,
      s1: null,
      b: true,
    })

    // S10100: existing entity: null saved, undefined ignored
    var m1 = (Math.random() + '').substring(2)
    var foo1 = await seneca
      .entity('test/foo')
      .make$({
        m: m1,
        s1: 's1~' + m1,
        s2: 's2~' + m1,
      })
      .save$()
    var foo1o = await seneca.entity('test/foo').load$(foo1.id)
    foo1o.s1 = null
    foo1o.s2 = undefined
    var foo1o2 = await foo1o.save$()

    log && log('S10100', foo1, foo1o, foo1o2)
    expect(foo1o2.data$(false)).equal({
      id: foo1o.id,
      m: m1,
      s1: null,
      s2: 's2~' + m1,
    })

    // S10200: new item, edge cases: empty string, Date
    var m2 = (Math.random() + '').substring(2)
    var d1 = new Date()
    var foo2 = await seneca
      .entity('test/foo')
      .make$({
        m: m2,
        s1: '',
        d1: d1,
      })
      .save$()

    log && log('S10200', foo2)
    expect(foo2.data$(false)).includes({
      id: foo2.id,
      m: m2,
      s1: '',
    })
    expect(foo2.d1.toISOString()).equals(d1.toISOString())
    expect(foo2.fields$()).equals(['id', 'm', 'd1', 's1'])

    // S10205: existing item, edge cases: empty string, Date
    var d1a = new Date()
    foo2.d1 = d1a
    var foo2o = await foo2.save$()

    log && log('S10205', foo2)
    expect(foo2o.data$(false)).includes({
      id: foo2.id,
      m: m2,
      s1: '',
    })
    expect(foo2o.d1.toISOString()).equals(d1a.toISOString())
    expect(foo2o.fields$()).equals(['id', 'm', 'd1', 's1'])
  },
}
