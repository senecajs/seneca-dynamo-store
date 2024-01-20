/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License. */
'use strict'

const Seneca = require('seneca')
const { Required, Open } = Seneca.valid

// AWS utility
const {
  marshall,
  unmarshall
} = require('@aws-sdk/util-dynamodb')

module.exports = dynamo_store

module.exports.errors = {}

const intern = (module.exports.intern = make_intern())

module.exports.defaults = {
  test: false,

  // Provide AWS SDK (via function) externally so that it is not dragged into lambdas.
  sdk: Required(Function),

  // preserve undefined fields when saving
  merge: true,

  aws: Open({}),

  // See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#constructor-property
  client: Open({
    // Latest version of dynamodb supports empty strings
    convertEmptyValues: false,
  }),

  // entity meta data, by canon string
  entity: {},
}

function dynamo_store(options) {
  var seneca = this
  
  const AWS = options.sdk()

  // TODO: need a better way to do this
  options = seneca.util.deep(
    {
      // TODO: use seneca.export once it allows for null values
      generate_id: seneca.export('entity/generate_id'),
    },
    options,
  )

  const ctx = intern.make_ctx(
    {
      name: 'dynamo-store',
    },
    options,
  )

  var store = intern.make_store(ctx)
  let init = seneca.export('entity/init')
  var meta = init(seneca, options, store)

  seneca.add({ init: store.name, tag: meta.tag }, function (msg, reply) {
    ctx.client = new AWS.DynamoDB(
      intern.clean_config(options.aws),
    )
    
    reply()
  })

  var plugin_meta = {
    name: store.name,
    tag: meta.tag,
    exports: {
      get_client: () => {
        return ctx.client
      },
    },
  }

  return plugin_meta
}

function make_intern() {
  return {
    PV: 1, // persistence version, used for data migration
    canon_ref: {},

    // TODO: why is this needed?
    clean_config: function (cfgin) {
      let cfg = { ...cfgin }
      for (let prop in cfg) {
        if (null == cfg[prop]) {
          delete cfg[prop]
        }
      }

      return cfg
    },

    make_msg: function (msg_fn, ctx) {
      return require('./lib/' + msg_fn)(ctx)
    },

    make_ctx: function (initial_ctx, options) {
      return Object.assign(
        {
          options,
          intern,
        },
        initial_ctx,
      )
    },

    // TODO: seneca-entity should provide this
    entity_options: function (ent, ctx) {
      let canonkey = ent.canon$()

      // NOTE: canonkey in options can omit empty canon parts, and zone
      // so that canonkey can match seneca.entity abbreviated canon
      let entopts =
        intern.canon_ref[canonkey] ||
        ctx.options.entity[canonkey] ||
        ctx.options.entity[canonkey.replace(/^-\//, '')] ||
        ctx.options.entity[canonkey.replace(/^-\/-\//, '')] ||
        ctx.options.entity[canonkey.replace(/^[^/]+\/([^/]+\/[^/]+)$/, '$1')]

      intern.canon_ref[canonkey] = entopts

      return entopts
    },

    table: function (ent, ctx) {
      let table_name = null
      let entopts = intern.entity_options(ent, ctx)
      if (
        null != entopts &&
        null != entopts.table &&
        null != entopts.table.name
      ) {
        table_name = entopts.table.name
      } else {
        let canon = ent.canon$({ object: true })
        table_name = (canon.base ? canon.base + '_' : '') + canon.name
      }
      return table_name
    },

    get_table: function (ent, ctx) {
      let entopts = intern.entity_options(ent, ctx)
      let table = entopts && entopts.table

      if (null == table || null == table.name) {
        let canon = ent.canon$({ object: true })
        table = table || {}
        table.name = (canon.base ? canon.base + '_' : '') + canon.name
      }

      return table
    },

    has_error: function (seneca, err, ctx, reply) {
      if (err) {
        seneca.log.error('entity', err, { store: ctx.name })
        reply(err)
      }
      return null != err
    },

    make_store: function (ctx) {
      const opts = ctx.options
      
      const {
        PutItemCommand,
        UpdateItemCommand,
        ScanCommand,
        DeleteItemCommand,
        BatchWriteItemCommand
      } = opts.sdk()

      const store = {
        name: ctx.name,

        close: function (msg, reply) {
          reply()
        },

        save: function (msg, reply) {
          var seneca = this
          var ent = msg.ent

          var update = null != ent.id
          const ti = intern.get_table(ent, ctx)
          var data = ent.data$(false)
          var q = msg.q || {}

          // The merge$ directive has precedence.
          // Explicit `false` value otherwise consider merge `true`.
          var merge =
            null == q.merge$ ? false !== opts.merge : false !== q.merge$

          data = intern.inbound(ctx, ent, data)
  
          // Create new Item.
          if (!update) {
            let new_id = ent.id$

            if (null == new_id) {
              new_id = opts.generate_id(ent)
            }

            const upsert_fields = is_upsert(msg)
            // console.log('UPF', upsert_fields)

            if (null != upsert_fields) {
              do_upsert(ctx, {
                upsert_fields,
                name: ti.name,
                doc: data,
                new_id,
              })
                .then((ups) => {
                  // Reload to get data as per db
                  //
                  return intern.id_get(ctx, seneca, ent, ti, ups.id, reply)
                })
                .catch((err) => {
                  return intern.has_error(seneca, err, ctx, reply)
                })

              return
            }

            data.id = new_id
          }

          if (!update || !merge) {

            var req = {
              TableName: ti.name,
              ConditionExpression: 'attribute_not_exists(id)',
              Item: marshall(data),
            }

            // console.log('PUT', req)
            const dycmd = new PutItemCommand(req)
            
            ctx.client
              .send(dycmd)
              .then(res => {
                // Reload to get data as per db
                let dq = { id: data.id }
                let sortkey = ti.key && ti.key.sort
                if (null != sortkey) {
                  dq[sortkey] = data[sortkey]
                }

                // console.log('QQQ', dq)

                return intern.id_get(ctx, seneca, ent, ti, dq, reply)
              
              })
              .catch(err =>
                intern.has_error(seneca, err, ctx, reply)
              )
            
          }

          // Update existing Item
          else {
            // Build update structure
            // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property

            let up_req = intern.build_req_key(
              {
                TableName: ti.name,
              },
              ti,
              data,
            )

            // cannot update sortkey
            let tb_key = ti.key || { partition: 'id' }

            var upreq = {
              ...up_req,
              AttributeUpdates: Object.keys(data)
                //.filter(k=> k!='id' && void 0!==data[k] )
                .filter(
                  (k) => null == Object.values(tb_key).find((v) => v == k),
                )
                .reduce(
                  (o, k) => ((o[k] = { Action: 'PUT', Value: marshall(data[k]) }), o),
                  {},
                ),
            }
            
            // console.log('UPR', upreq)
            
            const dycmd = new UpdateItemCommand(upreq)
            
            ctx.client
              .send(dycmd)
              .then(upres => {

                // Reload to get data as per db
                return intern.id_get(ctx, seneca, ent, ti, data, reply)
              })
              .catch(uperr =>
                intern.has_error(seneca, uperr, ctx, reply) )
          }

          function is_upsert(msg) {
            const { ent } = msg
            const update = null != ent.id

            if (update) {
              return null
            }

            const { q = {} } = msg

            if (!Array.isArray(q.upsert$)) {
              return null
            } else {
              throw new Error('DO NOT USE - UNDER CONSTRUCTION')
            }

            /* TODO: fix upsert
            const upsert_fields = q.upsert$
              .filter(field => -1 === field.indexOf('$'))

            const public_entdata = ent.data$(false)

            const upsert = upsert_fields.length > 0 &&
              upsert_fields.every((p) => p in public_entdata)

              return upsert ? upsert_fields : null
            */
          }

          async function do_upsert(ctx, args) {
            const { upsert_fields, table, doc, new_id } = args


            // TODO: redesign - will not work
            /*
            const scanned = await ctx.client
              .scan({
                TableName: table,
                ScanFilter: upsert_fields.reduce((acc, k) => {
                  if (null == doc[k]) {
                    acc[k] = {
                      ComparisonOperator: 'NULL',
                    }
                  } else {
                    acc[k] = {
                      ComparisonOperator: 'EQ',
                      AttributeValueList: Array.isArray(doc[k])
                        ? doc[k]
                        : [doc[k]],
                    }
                  }

                  return acc
                }, {}),
              })
              .promise()

            if (0 === scanned.Items.length) {
              await ctx.client
                .put({
                  TableName: table,
                  Item: { ...doc, id: new_id },
                })
                .promise()

              return { id: new_id }
            }

            const [item] = scanned.Items

            await ctx.client
              .update({
                TableName: table,

                Key: { id: item.id },

                AttributeUpdates: Object.keys(doc)
                  .filter((k) => !upsert_fields.includes(k))
                  .reduce((acc, k) => {
                    acc[k] = {
                      Action: 'PUT',
                      Value: doc[k],
                    }

                    return acc
                  }, {}),
              })
              .promise()

            return { id: item.id }
            */
            
            try {
              let dycmd = new ScanCommand({
                TableName: table,
                ScanFilter: upsert_fields.reduce((acc, k) => {
                  if (doc[k] === null || doc[k] === undefined) {
                    acc[k] = {
                      ComparisonOperator: 'NULL',
                    }
                  } else {
                    acc[k] = {
                      ComparisonOperator: 'EQ',
                      AttributeValueList: Array.isArray(doc[k]) ? doc[k] : [doc[k]],
                    }
                  }

                  return acc
                }, {}),
              })
              
              const scanned = await ctx.client.send(dycmd)


              if (scanned.Count === 0) {
                dycmd = new PutItemCommand({
                  TableName: table,
                  Item: marshall({ ...doc, id: new_id }),
                })
                await ctx.client.send(dycmd)

                return { id: new_id }
              }

              const [ item ] = scanned.Items
              
              dycmd = new UpdateItemCommand({
                TableName: table,
                Key: { id: item.id },
                AttributeUpdates: Object.keys(doc)
                  .filter((k) => !upsert_fields.includes(k))
                  .reduce((acc, k) => {
                    acc[k] = {
                      Action: 'PUT',
                      Value: marshall(doc[k]),
                    }
                    return acc
                  }, {}),
              })
              
              await ctx.client.send(dycmd)

              return { id: item.id }
            } catch (err) {
              reply(err, null)
            }
  
          }
          
        },

        load: function (msg, reply) {
          var seneca = this
          var qent = msg.qent
          var q = msg.q
          const ti = intern.get_table(qent, ctx)
          // console.log('TI', ti)

          var qid = q.id

          if (null == qid) {
            if (0 === Object.keys(seneca.util.clean(q)).length) {
              return reply()
            }

            return intern.listent(
              ctx,
              seneca,
              qent,
              ti,
              q,
              function (err, reslist) {
                if (err) return reply(err)

                return reply(reslist ? reslist[0] : null)
              },
            )
          }

          // Load by id
          else {
            return intern.id_get(ctx, seneca, qent, ti, q, reply)
          }
        },

        list: function (msg, reply) {
          var seneca = this
          var qent = msg.qent
          var q = msg.q
          const ti = intern.get_table(qent, ctx)

          intern.listent(ctx, seneca, qent, ti, q, reply)
        },

        remove: function (msg, reply) {
          var seneca = this
          console.log('SENECA DYNAMO REMOVE MSG', msg)

          var qent = msg.qent
          var q = msg.q
          const ti = intern.get_table(qent, ctx)

          var all = true === q.all$
          var load = true === q.load$

          var qid = q.id

          console.log('SENECA DYNAMO REMOVE QUERY', q, qid, all, load)

          if (null != qid) {
            console.log('SENECA DYNAMO REMOVE SINGLE')
            return remove_single_by_id(q)
          } else {
            console.log('SENECA DYNAMO REMOVE BATCH')

            let cq = seneca.util.clean(q)
            // console.log('CQ', cq)

            if (0 === Object.keys(cq).length && !all) {
              reply(seneca.error('empty-remove-query'))
            }

            intern.listent(ctx, seneca, qent, ti, cq, function (listerr, list) {
              if (intern.has_error(seneca, listerr, ctx, reply)) return

              // console.log('QQQ', all, ti.name, list)

              if (all) {
                var batchreq = {
                  RequestItems: {},
                }

                batchreq.RequestItems[ti.name] = list.map((item) => ({
                  DeleteRequest: {
                    Key: { id: { S: item.id } },
                  },
                }))

                if (0 === batchreq.RequestItems[ti.name].length) {
                  return reply()
                }
                
                // console.log('BATCHREQ: ', batchreq)
                
                const dycmd = new BatchWriteItemCommand(batchreq)
                
                ctx.client
                  .send(dycmd)
                  .then(batchres =>
                    reply()
                  )
                  .catch(batcherr =>
                    intern.has_error(seneca, batcherr, ctx, reply)
                  )
                
              } else {
                qid = 0 < list.length ? list[0].id : null
                return remove_single_by_id({ id: qid })
              }
            })
          }

          function remove_single_by_id(q) {
            // console.log('RSID',q)
            if (null != q.id) {
              if (load) {
                intern.id_get(ctx, seneca, qent, ti, q, (err, old) =>
                  dc_delete(q, err, old),
                )
              } else {
                dc_delete(q)
              }
            } else {
              return reply()
            }
          }

          function dc_delete(q, err, old) {
            if (intern.has_error(seneca, err, ctx, reply)) return

            var delreq = intern.build_req_key(
              {
                TableName: ti.name,
              },
              ti,
              q,
            )

            console.log('SENECA DYNAMO REMOVE REQ', delreq)
            
            const dycmd = new DeleteItemCommand(delreq)
            
            ctx.client
              .send(dycmd)
              .then(delres => {
                console.log('SENECA DYNAMO REMOVE RES', delres)
                reply(old)
              })
              .catch(delerr =>
                intern.has_error(seneca, delerr, ctx, reply)
              )
          }
          
        },

        native: function (msg, reply) {
          reply({
            client: ctx.client,
          })
        },
      }

      return store
    },

    // Tmp converter for table parameter
    tableinfo: (table) => {
      let tableInfo = table
      if ('string' === typeof tableInfo) {
        tableInfo = { name: table }
      }
      return tableInfo
    },

    build_req_key(req, table, q) {
  
      req.Key = { id: 'string' === typeof q ? q : q.id }

      let sortkey = table.key && table.key.sort
      if (sortkey) {
        req.Key[sortkey] = q[sortkey]
      }
      req.Key = marshall(req.Key)

      return req
    },

    id_get: function (ctx, seneca, ent, table, q, reply) {
      const { GetItemCommand } = ctx.options.sdk()
      
      let ti = intern.tableinfo(table)

      const getreq = intern.build_req_key(
        {
          TableName: ti.name,
        },
        table,
        q,
      )
      
      const dycmd = new GetItemCommand(getreq)
      // console.log('GETREQ: ', getreq)
      
      ctx.client
        .send(dycmd)
        .then(getres => {
          let data = null == getres.Item ? null : getres.Item
          data = intern.outbound(ctx, ent, data)
          let out_ent = null == data ? null : ent.make$(data)
          reply(null, out_ent)
        })
        .catch(geterr =>
          intern.has_error(seneca, geterr, ctx, reply)
        )
      
    },

    build_cmps(qv, kname, type) {
      if ('object' != typeof qv) {
        //  && !Array.isArray(qv)) {
        return { cmps: [{ c: 'eq$', cmpop: '=', k: kname, v: qv }] }
      }

      let ops = {
        gt$: { cmpop: '>' },
        gte$: { cmpop: '>=' },
        lt$: { cmpop: '<' },
        lte$: { cmpop: '<=' },
        eq$: { cmpop: '=' },
        ne$: { cmpop: '!=' }
      }

      // console.log('QV: ', typeof qv, qv)

      let cmps = []
      
      for (let k in qv) {
        let cmp = ops[k]
        if (cmp) {
          cmp = { ...cmp }
          cmp.k = kname
          cmp.v = qv[k]
          cmp.c = k
          cmps.push(cmp)
        } else if (k.endsWith('$')) {
          throw new Error('Invalid Comparison Operator: ' + k)
        }
      }
      // special case
      if ('sort' == type && 1 < cmps.length) {
        throw new Error(
          'Only one condition per sortkey: ' + cmps.length + ' is given.',
        )
      }

      return { cmps }
    },

    listent: function (ctx, seneca, qent, ti, q, reply) {
      var isarr = Array.isArray
      const { ScanCommand, QueryCommand } = ctx.options.sdk()
      
      if (isarr(q) || 'object' != typeof q) {
        q = { id: q }
      }

      let listop = 'scan'
      const sortkey = ti.key && ti.key.sort

      const listreq = {
        TableName: ti.name,
      }

      let cq = seneca.util.clean(q)
      let fq = cq
      if ('object' == typeof q.sort$ && 0 != Object.keys(q.sort$).length) {
        let sortkey$ = Object.keys(q.sort$)[0]
        let scan_index = {
          1: true, // ascending
          '-1': false, // descending
        }
        let scan_mode = scan_index[q.sort$[sortkey$]]
        if (null == scan_mode) {
          throw new Error('Invalid sort key')
        }
        listreq.ScanIndexForward = scan_mode
      }
      
      // hash and range key must be used together
      if (null != sortkey && null != cq.id && null != cq[sortkey]) {
        listop = 'query'
        listreq.KeyConditionExpression = `id = :hashKey and #${sortkey}n = :rangeKey`
        listreq.ExpressionAttributeValues = {
          ':hashKey': marshall(cq.id),
          ':rangeKey': marshall(cq[sortkey]),
        }
        listreq.ExpressionAttributeNames = {}
        listreq.ExpressionAttributeNames[`#${sortkey}n`] = sortkey
        delete fq.id
        delete fq[sortkey]
      }

      // ignore indexes if using main keys
      else {
        let indexlist = ti.index || []
        for (let indexdef of indexlist) {
          let indexdefkey = indexdef.key || {}
          let pk = indexdefkey.partition
          if (null != pk && null != fq[pk]) {
            listop = 'query'
            listreq.IndexName = indexdef.name
            let fq_pk = intern.build_cmps(fq[pk], pk, 'sort')
            
            // Query key condition not supported
            // other than '='
            listreq.KeyConditionExpression =
              fq_pk.cmps
                .map((c, i) => `#${c.k}nn ${c.cmpop} :${c.k + i}ii`)
                .join(' and ')
                  
            listreq.ExpressionAttributeValues = {}
            fq_pk.cmps.forEach((c, i) => {
              listreq.ExpressionAttributeValues[`:${c.k + i}ii`] = marshall(c.v)
            })
            
            listreq.ExpressionAttributeNames = {}
            listreq.ExpressionAttributeNames[`#${pk}nn`] = pk

            delete fq[pk]

            let sk = indexdefkey.sort
            if (null != sk && null != fq[sk]) {
              let fq_op = intern.build_cmps(fq[sk], sk, 'sort')

              listreq.KeyConditionExpression +=
                ' and ' +
                fq_op.cmps
                  .map((c, i) => `#${c.k}n ${c.cmpop} :${c.k + i}i`)
                  .join(' and ')

              fq_op.cmps.forEach((c, i) => {
                listreq.ExpressionAttributeValues[`:${c.k + i}i`] = marshall(c.v)
              })
              listreq.ExpressionAttributeNames[`#${sk}n`] = sk
              delete fq[sk]
            }

            break // first index found wins
          }
        }
      }

      if (0 < Object.keys(fq).length) {
        listreq.FilterExpression = Object.keys(cq)
          .map((k) => {
            let cq_k = isarr(cq[k]) ? cq[k] : [ cq[k] ]
            return (
              '(' +
              cq_k
                .map((v, i) => {
                  let cq_v = intern.build_cmps(v, k)
                  // console.log('cq_v: ', cq_v)
                  return cq_v.cmps
                    .map(
                      (c, j) => '#' + c.k + ` ${c.cmpop} :` + c.k + i + j + 'n',
                    )
                    .join(' and ')
                })
                .join(' or ') +
              ')'
            )
          })
          .join(' and ')


        listreq.ExpressionAttributeNames = Object.keys(cq).reduce(
          (a, k) => ((a['#' + k] = k ), a),
          listreq.ExpressionAttributeNames || {},
        )

        listreq.ExpressionAttributeValues = Object.keys(cq).reduce((a, k) => {
          let cq_k = isarr(cq[k]) ? cq[k] : [cq[k]]

          cq_k.forEach((v, i) => {
            let cq_v = intern.build_cmps(v, k)
            cq_v.cmps.forEach((c, j) => (a[':' + c.k + i + j + 'n'] = marshall(c.v) ))
          })

          return a
        }, listreq.ExpressionAttributeValues || {})
      }

      if (q.fields$) {
        listreq.ProjectionExpression = q.fields$.map((n) => '#' + n).join(',')
        q.fields$.reduce(
          (a, k) => ((a['#' + k] = k), a),
          (listreq.ExpressionAttributeNames =
            listreq.ExpressionAttributeNames || {}),
        )
      }

      // console.log('LISTREQ', q, listop, listreq)

      let out_list = []
      async function page(paramExclusiveStartKey) {
        if (null != paramExclusiveStartKey) {
          listreq.ExclusiveStartKey = paramExclusiveStartKey
        }
        
        try {
          let Command = listop == 'scan' ? ScanCommand : QueryCommand
          
          const dycmd = new Command(listreq)
          
          const listRes = await ctx.client.send(dycmd)

          if (listRes.Items && listRes.Items.length > 0) {
            listRes.Items.forEach((item) =>
              out_list.push(qent.make$(intern.outbound(ctx, qent, item)))
            )
          }
          // console.log('out_list: ', out_list)

          if (listRes.LastEvaluatedKey) {
            setImmediate(() => page(listRes.LastEvaluatedKey))
          } else {
            return reply(null, out_list)
          }
        } catch (err) {
          intern.has_error(seneca, err, ctx, reply)
        }
     
        /*
        ctx.client[listop](listreq, function (listerr, listres) {
          if (intern.has_error(seneca, listerr, ctx, reply)) return

          if (null != listres.Items) {
            listres.Items.forEach((item) => out_list.push(qent.make$(item)))
          }

          if (listres.LastEvaluatedKey) {
            setImmediate(() => page(listres.LastEvaluatedKey))
          } else {
            return reply(null, out_list)
          }
        })
        */
      }

      page()
    },

    inbound: function (ctx, ent, data) {
      if (null == data) return null
      let entity_options = intern.entity_options(ent, ctx)

      if (entity_options) {
        var fields = entity_options.fields || {}
        Object.keys(fields).forEach((fn) => {
          var fs = fields[fn] || {}
          var type = fs.type
          if ('date' === type && data[fn] instanceof Date) {
            data[fn] = data[fn].toISOString()
          }
        })
      }
      return data
    },

    outbound: function (ctx, ent, data) {
      if (null == data) return null
      let entity_options = intern.entity_options(ent, ctx)
      data = unmarshall(data)

      if (entity_options) {
        var fields = entity_options.fields || {}
        Object.keys(fields).forEach((fn) => {
          var fs = fields[fn] || {}
          var type = fs.type
          if ('date' === type && 'string' === typeof data[fn]) {
            data[fn] = new Date(data[fn])
          }
        })
      }
      return data
    },
  }
}
