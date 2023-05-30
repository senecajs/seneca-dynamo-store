/* Copyright (c) 2019-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const AWS_SDK = require('aws-sdk')

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
            sdk: () => AWS_SDK,
            aws: {
              region: 'region',
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

lab.test('no-dups', async () => {
  var si = make_seneca()
  await si.ready()
  si.quiet()

  let list = await si.entity('uniq01').list$()
  for (let entry of list) {
    await entry.remove$()
  }

  let a0 = await si.entity('uniq01').save$({ id$: 'a0', x: 1, d: Date.now() })
  expect(a0.id).equal('a0')

  try {
    let a0d = await si.entity('uniq01').save$({ id$: 'a0', x: 2 })
    // console.log(a0d)
  } catch (e) {
    // console.log(e)
    expect(e).exist()
  }

  list = await si.entity('uniq01').list$()
  // console.log(list)
  expect(list.length).equal(1)
})

// See support/db/create-database-tables for table def
lab.test('special-query', async () => {
  var si = make_seneca({
    plugin: {
      entity: {
        query01: {
          table: {
            name: 'query01',
            key: {
              partition: 'id',
              sort: 'sk0',
            },
            index: [
              {
                name: 'gsi_0',
                key: {
                  partition: 'ip0',
                },
              },
              {
                name: 'gsi_1',
                key: {
                  partition: 'ip1',
                  sort: 'is1',
                },
              },
            ],
          },
        },
      },
    },
  })
  await si.ready()
  // si.quiet()

  // console.log('FIRST',await si.entity('query01').load$({id:'q0',sk0:'a'}))

  let list = await si.entity('query01').list$({})
  // console.log('EXISTING', list)

  for (let entry of list) {
    // console.log('REMOVE', list)
    await entry.remove$({ id: entry.id, sk0: entry.sk0 })
  }

  // id: PartionKey
  // sk: SortKey
  // ip0: Index0 PartionKey
  // ip1: Index1 PartionKey
  // is1: Index1 SortKey
  // d: plain data
  await si
    .entity('query01')
    .save$({ id$: 'q0', sk0: 'a', ip0: 'A', ip1: 'AA', is1: 0, d: 10 })

  await si
    .entity('query01')
    .save$({ id$: 'q1', sk0: 'a', ip0: 'B', ip1: 'AA', is1: 0, d: 10 })
  await si
    .entity('query01')
    .save$({ id$: 'q2', sk0: 'b', ip0: 'B', ip1: 'AA', is1: 0, d: 10 })
  await si
    .entity('query01')
    .save$({ id$: 'q3', sk0: 'c', ip0: 'C', ip1: 'AA', is1: 1, d: 10 })
  await si
    .entity('query01')
    .save$({ id$: 'q4', sk0: 'c', ip0: 'C', ip1: 'AA', is1: 2, d: 10 })
  await si
    .entity('query01')
    .save$({ id$: 'q5', sk0: 'c', ip0: 'C', ip1: 'BB', is1: 0, d: 10 })

  list = await si.entity('query01').list$()
  // console.log('ALL', list)
  expect(list.map((ent) => ent.id).sort()).equal([
    'q0',
    'q1',
    'q2',
    'q3',
    'q4',
    'q5',
  ])

  let q = { id: 'q0', sk0: 'a' }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0'])

  q = { id: 'q0', sk0: 'a', d: 10 }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0'])

  q = { sk0: 'a' }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0', 'q1'])

  q = { sk0: 'a', d: 10 }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0', 'q1'])

  q = { ip0: 'A' }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0'])

  q = { ip0: 'A', d: 10 }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0'])

  q = { ip1: 'AA' }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0', 'q1', 'q2', 'q3', 'q4'])

  q = { ip1: 'AA', d: 10 }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0', 'q1', 'q2', 'q3', 'q4'])

  q = { ip1: 'AA', is1: 0 }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0', 'q1', 'q2'])

  q = { ip1: 'AA', is1: 0, d: 10 }
  list = await si.entity('query01').list$(q)
  // console.log('Q', q, list)
  expect(list.map((ent) => ent.id).sort()).equal(['q0', 'q1', 'q2'])

  // console.log('END')
})

lab.test('comparison-query', async () => {
  var si = make_seneca({
    plugin: {
      entity: {
        query01: {
          table: {
            name: 'query01',
            key: {
              partition: 'id',
              sort: 'sk0',
            },
            index: [
              {
                name: 'gsi_0',
                key: {
                  partition: 'ip0',
                },
              },
              {
                name: 'gsi_1',
                key: {
                  partition: 'ip1',
                  sort: 'is1',
                },
              },
            ],
          },
        },
      },
    },
  })

  await si.ready()
  si.quiet()

  await si
    .entity('query01')
    .save$({ id$: 'q7', sk0: 'c', ip0: 'C', ip1: 'BB', is1: 3, d: 12 })
  await si
    .entity('query01')
    .save$({ id$: 'q6', sk0: 'c', ip0: 'C', ip1: 'BB', is1: 2, d: 11 })
  await si
    .entity('query01')
    .save$({ id$: 'q8', sk0: 'c', ip0: 'C', ip1: 'BB', is1: 1, d: 13 })

  // sort-key comparison
  let qop = { ip1: 'AA', is1: { $lt: 1 } }
  let list = await si.entity('query01').list$(qop) 
  // console.log('LIST: ', list)
  expect(list.length).equal(4)
  
  qop = { d: { $ne: 10 } }
  list = await si.entity('query01').list$(qop)
  // console.log('LIST: ', list)
  expect(list.length).equal(6)

  qop = { d: { $gt: 10 }, ip1: 'BB', is1: { $gte: 0 } }
  list = await si.entity('query01').list$(qop)
  // console.log('LIST: ', list)
  expect(list.length).equal(3)
  
  // descending
  qop = { d: { $gt: 10 }, ip1: 'BB', is1: { $gt: 0 }, $sort: -1 }
  list = await si.entity('query01').list$(qop)
  // console.log('LIST: ', list)
  expect(list.map((ent) => ent.is1)).equal([3, 2, 1, 0])

  // ascending
  qop = { d: { $gt: 10 }, ip1: 'BB', is1: { $lt: 3 }, $sort: 1 }
  list = await si.entity('query01').list$(qop)
  // console.log('LIST: ', list)
  expect(list.map((ent) => ent.is1)).equal([0, 1, 2, 3])

})

lab.test('invalid-operators', async () => {
  let list = []
  let qop = {}
  let err

  err = null
  try {
    qop = { d: { $gte: 10, $lte: 10 } }
    list = await si.entity('query01').list$(qop)
  }catch(e) {
    err = e
  }
  expect(err).not.equal(null)

  err = null
  qop = { d: { $notAValidOp: 123 } }
  try {
    list = await si.entity('query01').list$(qop)
  }catch(e) {
    err = e
  }
  expect(err).not.equal(null)

})

lab.test('injection-fails', async () => {

  var si = make_seneca({
    plugin: {
      entity: {
        query01: {
          table: {
            name: 'query01',
            key: {
              partition: 'id',
              sort: 'sk0',
            },
            index: [
              {
                name: 'gsi_0',
                key: {
                  partition: 'ip0',
                },
              },
              {
                name: 'gsi_1',
                key: {
                  partition: 'ip1',
                  sort: 'is1',
                },
              },
            ],
          },
        },
      },
    },
  })

  await si.ready()
  si.quiet()


  let qop = {}
  let list = []

  let q_no_results = [
    { d: { $ne: '10 or 1 = 1' } },
    { ip1: '*', is1: 1 }
  ]

  let q_validation_error = [
    { 'd or 1': { $ne: 10 } }, // inject into FilterExpression
    { ip1: 'BB', 'is1 or 1': 1 }, // ExpressionAttributeValues/Names
    { ip1: 'BB', is1: ' and 1 = 1' }, // ExpressionAttributeValues/Names
  ]


  for(let q of q_validation_error) {
    let err = null
    try {
      list = await si.entity('query01').list$(q)
    }catch(e) {
      err = e
      // console.error('e: ', e)
      // expect(e).exist()
    }
    expect(err).not.equal(null)
  }

  for(let q of q_no_results) {
    list = await si.entity('query01').list$(q)
    expect(list.length).equal(0)
  }


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
            type: 'date',
          },
        },
      },
    },
  }

  const si = make_seneca({ plugin })

  lab.before(() => si.ready())

  const si_merge = make_seneca({
    plugin: Object.assign({ merge: false }, plugin),
  })

  lab.before(() => si_merge.ready())

  LegacyStoreTest.basictest({
    seneca: si,
    senecaMerge: si_merge,
    script: lab,
  })

  // TODO: fix implmentation
  // LegacyStoreTest.upserttest({
  //   seneca: si,
  //   script: lab
  // })
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

    // Custom table name
    'test/custom': {
      table: {
        name: 'custom01',
      },
    },
  },
}

lab.test('store-core', async () => {
  var si = make_seneca({ plugin })
  await testrun.store_core({ seneca: si, expect, xlog: console.log })
})

lab.test('store-load', async () => {
  var si = make_seneca({ plugin })
  await testrun.store_load({ seneca: si, expect, xlog: console.log })
})

lab.test('store-save', async () => {
  var si = make_seneca({ plugin })
  await testrun.store_save({ seneca: si, expect, xlog: console.log })
})

lab.test('custom-table', async () => {
  var si = make_seneca({ plugin })
  let c0 = await si
    .entity('test/custom')
    .data$({ w: Date.now(), x: 1, y: 'a' })
    .save$()

  let c0o = await si.entity('test/custom').load$(c0.id)
  expect(c0o.w).equal(c0.w)

  let c0s = await si
    .entity('test/custom')
    .list$({ fields$: ['x'], x: 1, y: 'a' })
  // console.log(c0s)
  expect(c0s.length).above(0)
  expect(c0s[0].w).not.exist()

  let c0sA = await si.entity('test/custom').list$()
  // console.log(c0sA)
  expect(c0sA.length).above(0)

  let c0oA = await si.entity('test/custom').load$({ w: c0.w })
  // console.log(c0oA)
  // console.log(c0)
  expect(c0oA.id).equal(c0.id)

  let cl0 = await si.entity('test/custom').list$({ x: 1, y: 'a' })
  expect(cl0.length).above(0)

  let cl1 = await si.entity('test/custom').list$({ x: [1], y: 'a' })
  expect(cl1.length).above(0)
})

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
