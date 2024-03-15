/* Copyright (c) 2019-2022 Richard Rodger and other contributors, MIT License */
'use strict'

// const AWS_SDK = require('@aws-sdk/client-dynamodb')

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

      .use('promisify')
      // make sure mem-store isn't being tested!
      .use('entity', { mem_store: false })
      .use('doc')
      .use(
        '..',
        Object.assign(
          {
            // sdk: () => AWS_SDK,
            aws: {
              region: 'region',
              endpoint:
                process.env.SENECA_DYNAMO_ENDPOINT || 'http://localhost:18000',
              credentials: {
                accessKeyId: 'none',
                secretAccessKey: 'none',
              },
            },
          },
          config.plugin,
        ),
      )
  )
}

lab.test('validate', PluginValidator(Plugin, module))

lab.test('happy', async () => {
  const si = make_seneca()
  await si.ready()
  expect(si.find_plugin('dynamo-store$1')).exists()

  // double load works
  si.use('..')
  await si.ready()
  expect(si.find_plugin('dynamo-store$2')).exists()
})

lab.test('no-dups', async () => {
  const si = make_seneca()
  await si.ready()
  si.quiet()

  let list = await si.entity('uniq01').list$()
  for (let item of list) {
    await item.remove$()
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
lab.describe('special-query', () => {
  const plugin = {
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
  }

  const si = make_seneca({ plugin })

  lab.before(() => si.ready())
  
  let list = null
  
  lab.test('clear', async () => {
    list = await si.entity('query01').list$()
    for (let item of list) {
      // console.log('REMOVE', list)
      await item.remove$({ id: item.id, sk0: item.sk0 })
    }
    list = await si.entity('query01').list$()
    expect(list.length).equal(0)
  })

  lab.test('generate items', async () => {
    list = [
      { id$: 'q0', sk0: 'a', ip0: 'A', ip1: 'AA', is1: 0, d: 10 },
      { id$: 'q1', sk0: 'a', ip0: 'B', ip1: 'AA', is1: 0, d: 10 },
      { id$: 'q2', sk0: 'b', ip0: 'B', ip1: 'AA', is1: 0, d: 10 },
      { id$: 'q3', sk0: 'c', ip0: 'C', ip1: 'AA', is1: 1, d: 10 },
      { id$: 'q4', sk0: 'c', ip0: 'C', ip1: 'AA', is1: 2, d: 10 },
      { id$: 'q5', sk0: 'c', ip0: 'C', ip1: 'BB', is1: 0, d: 10 }
    ]
  
    for(let item of list) {
      await si
        .entity('query01')
        .data$(item)
        .save$()
    }
    
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
  
  })
  
  lab.test('query', async () => {
  
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
  
  })
  
  lab.test('entity id exists', async () => {
    let foo0 = await si.entity('foo')
    await foo0.save$({ d: 12 })
    expect(foo0.id, 'entity id exists').exists()
  })
  
})

lab.describe('comparison-query', () => {
  const plugin = {
    entity: {
      query02: {
        table: {
          name: 'query02',
          key: {
            partition: 'id',
          },
          index: [
            {
              name: 'gsi_2',
              key: {
                partition: 'ip2',
              },
            },
            {
              name: 'gsi_3',
              key: {
                partition: 'ip3',
                sort: 'is2',
              },
            },
          ],
        },
      },
    },
  }

  const si = make_seneca({ plugin })

  lab.before(() => si.ready())
  
  let list = null
  let qop = {}
  
  lab.test('clear', async () => {
    list = await si.entity('query02').list$()
    for (let item of list) {
      // console.log('REMOVE', list)
      await item.remove$({ id: item.id })
    }
    list = await si.entity('query02').list$()
    expect(list.length).equal(0)
  })
  
  lab.test('generate items', async () => {
    // generate items for cmpops test
    list = [
      { id$: 'q3', sk1: 'c', ip2: 'C', ip3: 'AA', is2: 1, d: 10 },
      { id$: 'q0', sk1: 'a', ip2: 'A', ip3: 'AA', is2: 0, d: 10 },
      { id$: 'q1', sk1: 'a', ip2: 'B', ip3: 'AA', is2: 0, d: 10 },
      { id$: 'q2', sk1: 'b', ip2: 'B', ip3: 'AA', is2: 0, d: 10 },
      { id$: 'q4', sk1: 'c', ip2: 'C', ip3: 'AA', is2: 2, d: 10 },
      { id$: 'q5', sk1: 'c', ip2: 'C', ip3: 'BB', is2: 0, d: 10 },
      { id$: 'q7', sk1: 'c', ip2: 'C', ip3: 'BB', is2: 3, d: 12 },
      { id$: 'q6', sk1: 'c', ip2: 'C', ip3: 'BB', is2: 2, d: 11 },
      { id$: 'q8', sk1: 'c', ip2: 'C', ip3: 'BB', is2: 1, d: 13 },
    ]
    for(let item of list) {
      await si.entity('query02')
        .data$(item)
        .save$()
       
      // idempotent
      let id = item.id$
      delete item.id$
      await si.entity('query02')
        .data$({...item })
        .save$({ id, })
    }
    list = await si.entity('query02').list$()
    
    expect(list.map((ent) => ent.id).sort()).equal([
      'q0',
      'q1',
      'q2',
      'q3',
      'q4',
      'q5',
      'q6',
      'q7',
      'q8',
    ])
    
  })
  
  lab.test('sort-index-key comparison', async () => {
    // sort-key comparison
    qop = { ip3: 'AA', is2: { lte$: 1 } }
    list = await si.entity('query02').list$(qop)
    // console.log('LIST: ', list)
    expect(list.map((ent) => ent.is2)).equal([0, 0, 0, 1])
    
    qop = { d: { eq$: 10 } }
    list = await si.entity('query02').list$(qop)
    // console.log('LIST: ', list)
    expect(list.length).equal(6)

    qop = { d: { gte$: 10 }, ip3: 'BB', is2: { gt$: 0 } }
    list = await si.entity('query02').list$(qop)
    // console.log('LIST: ', list)
    expect(list.length).equal(3)
  })
  
  lab.test('ASC sort$: 1', async () => {
    // ascending
    qop = { d: { gte$: 10 }, ip3: 'BB', is2: { lte$: 3 }, sort$: { is2: 1 } }
    list = await si.entity('query02').list$(qop)
    // console.log('LIST: ', list)
    expect(list.map((ent) => ent.is2)).equal([0, 1, 2, 3])
    
    // table key.sort
    qop = {
      d: { eq$: 10 },
      // sk1: { eq$: 'c' },
      ip3: 'AA',
      is2: { lte$: 3 },
      sort$: { sk1: 1 },
    }
    list = await si.entity('query02').list$(qop)
    // console.log(list)
    expect(list.map(item => item.sk1)).equal([
      'a',
      'a',
      'b',
      'c',
      'c',
    ])
    
    // table.key.sort and hashKey
    qop = {
      id: 'q0',
      sort$: { sk1: 1 },
    }
    list = await si.entity('query02').list$(qop)
    // console.log("LIST: ", list)
    expect(list.length).equal(1)
  
  })
  
  lab.test('DESC sort$: -1', async () => {
    // descending
    qop = { d: { gte$: 10 }, ip3: 'BB', is2: { gte$: 0 }, sort$: { is2: -1 } }
    list = await si.entity('query02').list$(qop)
    // console.log('LIST: ', list)
    expect(list.map((ent) => ent.is2)).equal([3, 2, 1, 0])
  })
  
  lab.test('more complicated tests', async () => {
    qop = { ip3: 'AA', is2: { lte$: 1, gt$: 2 } } // KeyCondition error
    qop = { ip3: 'AA', is2: { lte$: 1 } }
    qop = {
      d: { gt$: 10, lt$: 13 },
      ip3: 'BB',
      is2: { lte$: 3 },
      sort$: { is2: 1 },
    }
    list = await si.entity('query02').list$(qop)
    // console.log("LIST: ", list)
    expect(list.map((ent) => ent.d)).equal([11, 12])

    qop = { sk1: { gt$: 'a', lt$: 'c' } }
    list = await si.entity('query02').list$(qop)
    // console.log('LIST: ', list)
    expect(list.map((ent) => ent.sk1)).equal(['b'])

    list = await si
      .entity('query02')
      .list$({ d: [{ lt$: 11, gt$: 9 }, { eq$: 11 }] })
    // console.log("LIST: ", list)
    expect(list.length).equal(7)
  
  })

})

lab.describe('simple-sort', () => {
  const plugin = {
    entity: {
      query03: {
        table: {
          name: 'query03',
          key: {
            partition: 'id'
          },
          index: [
            {
              name: 'kind-t_c-index',
              key: {
                partition: 'kind',
                sort: 't_c',
              },
            },
            {
              name: 'kind-when-index',
              key: {
                partition: 'kind',
                sort: 'when',
              },
            },
          ],
        },
      },
    },
  }

  const si = make_seneca({ plugin })

  lab.before(() => si.ready())
  
  let list = null
  let qop = {}
  
  lab.test('clear', async () => {
    list = await si.entity('query03').list$()
    for (let item of list) {
      // console.log('REMOVE', list)
      await item.remove$({ id: item.id })
    }
    list = await si.entity('query03').list$()
    expect(list.length).equal(0)
  })
  
  lab.test('generate items', async () => {
    // generate items for cmpops test
    list = [
      { id$: 'q3', kind: '1', t_c: 10, when: 1 },
      { id$: 'q0', kind: '1', t_c: 12, when: 3 },
      { id$: 'q1', kind: '1', t_c: 11, when: 5 },
      { id$: 'q2', kind: '1', t_c: 13, when: 7 },
      { id$: 'q4', kind: '1', t_c: 16, when: 6 },
      { id$: 'q5', kind: '1', t_c: 15, when: 4 },
      { id$: 'q7', kind: '1', t_c: 14, when: 2 },
      { id$: 'q6', kind: '1', t_c: 18, when: 8 },
      { id$: 'q8', kind: '1', t_c: 17, when: 0 },
    ]
    for(let item of list) {
      await si.entity('query03')
        .data$(item)
        .save$()
    }
    list = await si.entity('query03').list$()
    
    expect(list.map((ent) => ent.t_c).sort())
      .equal(Array(9).fill(0).map((v, i) => i+10))
      
    
    // special case: see query04
    // id = :hashkey and sortkeyn = :rangeKey
    // console.log ( await si.entity('query03').list$({id: 'q3', sort$: { t_c: 10 }}) )
    
  })
  
  lab.test('sort-with-index-table', async () => {
  
    list = await si.entity('query03').list$({ kind: '1', sort$: { t_c: 1 } })
    expect(list.map((ent) => ent.t_c))
      .equal(Array(9).fill(0).map((v, i) => i+10))
    
    list = await si.entity('query03').list$({ kind: '1', sort$: { t_c: -1 } })
    expect(list.map((ent) => ent.t_c))
      .equal(Array(9).fill(0).map((v, i) => 18-i))
    
    list = await si.entity('query03').list$({ kind: '1', sort$: { when: -1 } })
    
    
    expect(list.map((ent) => ent.when))
      .equal(Array(9).fill(0).map((v, i) => 8-i))
      
    list = await si.entity('query03').list$({ kind: '1', sort$: { when: 1 } })
    
    
    expect(list.map((ent) => ent.when))
      .equal(Array(9).fill(0).map((v, i) => i))
  })

})


lab.describe('invalid-operators', () => {
  const plugin = {
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
  }

  const si = make_seneca({ plugin })

  lab.before(() => (si.ready(), si.quiet()) )
  
  lab.test('invalid-queries-operators', async () => {
    
    let invalid_query = [
      { d: { notAValidOp: 123 } },
      { d: { notAValidOp$: 123 } },
    ]
    
    for(let query of invalid_query) {
      let err = null
      try {
        await si.entity('query01').list$(query)
      } catch (e) {
        err = e
      }
      expect(err).not.equal(null)
    }
    
  })

})

lab.test('injection-fails', async () => {
  const si = make_seneca({
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

  /*
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

*/
})

lab.test('export', async () => {
  const si = make_seneca()
  await si.ready()

  const get_client = si.export('dynamo-store$1/get_client')
  expect(get_client()).exists()
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
  
  LegacyStoreTest.test.keyvalue(lab, {
    seneca: si,
    senecaMerge: si_merge,
    script: lab,
    ent0: 'ENT0',
  })
  
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

let plugin = {
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
  const si = make_seneca({ plugin })
  await testrun.store_core({ seneca: si, expect, xlog: console.log })
})

lab.test('store-load', async () => {
  const si = make_seneca({ plugin })
  await testrun.store_load({ seneca: si, expect, xlog: console.log })
})

lab.test('store-save', async () => {
  const si = make_seneca({ plugin })
  await testrun.store_save({ seneca: si, expect, xlog: console.log })
})

lab.test('custom-table', async () => {
  const si = make_seneca({ plugin })
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
    const seneca = opts.seneca
    const expect = opts.expect
    const log = opts.log

    // S00010: Clear test/foo
    await seneca.entity('test/foo').remove$({ all$: true })
    let foolist = await seneca.entity('test/foo').list$()

    log && log('S00010', foolist)
    expect(foolist.length).equal(0)

    // S00100: Load non-existent returns null.
    let foo0n = await seneca.entity('test/foo').load$('not-an-id')

    log && log('S00100', foo0n)
    expect(foo0n).equal(null)

    // S00200: Create unsaved entity
    let m0 = (Math.random() + '').substring(2)
    let foo0p = seneca.entity('test/foo').make$({
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
    let foo0 = await foo0p.save$()

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
    let foo0o = await seneca.entity('test/foo').load$(foo0.id)

    log && log('S00400', foo0.id, foo0o)
    expect(foo0o).exists()
    expect(foo0o != foo0).true()
    expect(foo0o.data$()).equals(foo0.data$())

    // S00500: List by query
    let foolist0 = await seneca.entity('test/foo').list$({ m: m0 })

    log && log('S00500', m0, foolist0)
    expect(foolist0.length).equals(1)
    expect(foolist0[0].data$()).equals(foo0o.data$())

    // S00600: Remove by id
    let foo0ro = await seneca.entity('test/foo').remove$(foo0.id)

    log && log('S00600', foo0.id, foo0ro)
    expect(foo0ro).equal(null)

    // S00700: Load by removed id
    let foo0r = await seneca.entity('test/foo').load$(foo0.id)

    log && log('S00700', foo0.id, foo0r)
    expect(foo0r).equal(null)

    // S00800: List removed by query returns []
    let foolist0r = await seneca.entity('test/foo').list$({ m: m0 })

    log && log('S00800', m0, foolist0r)
    expect(foolist0r.length).equals(0)
  },

  store_load: async function (opts) {
    const seneca = opts.seneca
    const expect = opts.expect
    const log = opts.log

    // S01000: Load by field
    let m1 = (Math.random() + '').substring(2)
    let foo1 = await seneca
      .entity('test/foo')
      .make$({ m: m1, s: 's1', i: 1, b: true })
      .save$()
    let foo1o = await seneca.entity('test/foo').load$({ m: m1 })

    log && log('S01000', foo1, foo1o)
    expect(foo1).exists()
    expect(foo1o).exists()
    expect(foo1.data$()).equal(foo1o.data$())

    // S01100: Load by two fields
    let foo1om = await seneca.entity('test/foo').load$({ m: m1, s: 's1' })

    log && log('S01100', foo1om)
    expect(foo1om).exists()
    expect(foo1.data$()).equal(foo1om.data$())

    // S01200: Load with no fields finds nothing
    let foo1n = await seneca.entity('test/foo').load$({})

    log && log('S01200', foo1n)
    expect(foo1n).equal(null)
  },

  store_save: async function (opts) {
    const seneca = opts.seneca
    const expect = opts.expect
    const log = opts.log

    // S10000: new entity: null saved, undefined ignored
    let m0 = (Math.random() + '').substring(2)
    let foo0 = await seneca
      .entity('test/foo')
      .make$({
        m: m0,
        s1: null,
        s2: undefined,
        b: true,
      })
      .save$()
    let foo0o = await seneca.entity('test/foo').load$(foo0.id)

    log && log('S10000', foo0, foo0o)
    expect(foo0o.data$(false)).equal({
      id: foo0o.id,
      m: m0,
      s1: null,
      b: true,
    })

    // S10100: existing entity: null saved, undefined ignored
    let m1 = (Math.random() + '').substring(2)
    let foo1 = await seneca
      .entity('test/foo')
      .make$({
        m: m1,
        s1: 's1~' + m1,
        s2: 's2~' + m1,
      })
      .save$()
    let foo1o = await seneca.entity('test/foo').load$(foo1.id)
    foo1o.s1 = null
    foo1o.s2 = undefined
    let foo1o2 = await foo1o.save$()

    log && log('S10100', foo1, foo1o, foo1o2)
    expect(foo1o2.data$(false)).equal({
      id: foo1o.id,
      m: m1,
      s1: null,
      s2: 's2~' + m1,
    })

    // S10200: new item, edge cases: empty string, Date
    let m2 = (Math.random() + '').substring(2)
    let d1 = new Date()
    let foo2 = await seneca
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
    let d1a = new Date()
    foo2.d1 = d1a
    let foo2o = await foo2.save$()

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
