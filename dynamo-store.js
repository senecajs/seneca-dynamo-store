/* Copyright (c) 2020-2021 Richard Rodger and other contributors, MIT License. */
'use strict'

const AWS = require('aws-sdk')

module.exports = dynamo_store

module.exports.errors = {}

const intern = (module.exports.intern = make_intern())

// TODO: default:true should the default in both cases, as
// lambda is now the most common case.
module.exports.defaults = {
  test: false,

  // preserve undefined fields when saving
  merge: true,

  aws: {
    default: false,
    region: 'region',
    endpoint: 'http://localhost:8000',
  },

  // See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#constructor-property
  dc: {
    // Latest version of dynamodb supports empty strings
    convertEmptyValues: false,

    default: false,
  },

  // entity meta data, by canon string
  entity: {},
}

function dynamo_store(options) {
  var seneca = this

  // TODO: need a better way to do this
  options = seneca.util.deep(
    {
      // TODO: use seneca.export once it allows for null values
      generate_id: seneca.root.private$.exports['entity/generate_id'],
    },
    options
  )

  const ctx = intern.make_ctx(
    {
      name: 'dynamo-store',
    },
    options
  )

  var store = intern.make_store(ctx)
  var meta = seneca.store.init(seneca, options, store)

  seneca.add({ init: store.name, tag: meta.tag }, function (msg, reply) {
    if (!options.aws.default) {
      AWS.config.update(intern.clean_config(options.aws))
    }

    if (options.dc.default) {
      ctx.dc = new AWS.DynamoDB.DocumentClient()
    } else {
      ctx.dc = new AWS.DynamoDB.DocumentClient(intern.clean_config(options.dc))
    }

    reply()
  })

  var plugin_meta = {
    name: store.name,
    tag: meta.tag,
    exports: {
      get_dc: () => {
        return ctx.dc
      },
    },
  }

  return plugin_meta
}

function make_intern() {
  return {
    PV: 1, // persistence version, used for data migration

    // TODO: why is this needed?
    clean_config: function (cfgin) {
      let cfg = { ...cfgin }
      for (let prop in cfg) {
        if (null == cfg[prop]) {
          delete cfg[prop]
        }
      }

      // console.log('SENECA DYNAMO STORE CLEAN CONFIG', cfgin, cfg)

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
        initial_ctx
      )
    },

    // TODO: seneca-entity should provide this
    entity_options: function (ent, ctx) {
      let canonkey = ent.canon$()

      // NOTE: canonkey in options can omit empty canon parts, and zone
      // so that canonkey can match seneca.entity abbreviated canon
      let entopts =
        ctx.options.entity[canonkey] ||
        ctx.options.entity[canonkey.replace(/^-\//, '')] ||
        ctx.options.entity[canonkey.replace(/^-\/-\//, '')] ||
        ctx.options.entity[canonkey.replace(/^[^/]+\/([^/]+\/[^/]+)$/, '$1')]

      // TODO: use a separate cache for resolved canon ref
      ctx.options.entity[canonkey] = ctx.options.entity[canonkey] || entopts

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

    has_error: function (seneca, err, ctx, reply) {
      if (err) {
        seneca.log.error('entity', err, { store: ctx.name })
        reply(err)
      }
      return null != err
    },

    make_store: function (ctx) {
      const opts = ctx.options

      const store = {
        name: ctx.name,

        close: function (msg, reply) {
          reply()
        },

        save: function (msg, reply) {
          var seneca = this
          var ent = msg.ent

          var update = null != ent.id
          var table = intern.table(ent, ctx)
          var data = ent.data$(false)
          var q = msg.q || {}

          // The merge$ directive has precedence.
          // Explicit `false` value otherwise consider merge `true`.
          var merge =
            null == q.merge$ ? false !== opts.merge : false !== q.merge$

          data = intern.inbound(ctx, ent, data)

          // Create new Item.
          if (!update) {
            var id = ent.id$

            if (null == id) {
              id = opts.generate_id(ent)
            }

            data.id = id
          }

          if (!update || !merge) {
            var req = {
              TableName: table,
              Item: data,
            }

            ctx.dc.put(req, function (err, res) {
              if (intern.has_error(seneca, err, ctx, reply)) return

              // Reload to get data as per db
              return intern.id_get(ctx, seneca, ent, table, data.id, reply)
            })
          }

          // Update existing Item
          else {
            // Build update structure
            // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property
            var upreq = {
              TableName: table,
              Key: { id: data.id },
              AttributeUpdates: Object.keys(data)
                //.filter(k=> k!='id' && void 0!==data[k] )
                .filter((k) => k != 'id')
                .reduce(
                  (o, k) => ((o[k] = { Action: 'PUT', Value: data[k] }), o),
                  {}
                ),
            }

            ctx.dc.update(upreq, function (uperr, upres) {
              if (intern.has_error(seneca, uperr, ctx, reply)) return

              // Reload to get data as per db
              return intern.id_get(ctx, seneca, ent, table, data.id, reply)
            })
          }
        },

        load: function (msg, reply) {
          var seneca = this
          var qent = msg.qent
          var q = msg.q
          var table = intern.table(qent, ctx)

          var qid = q.id

          if (null == qid) {
            if (0 === Object.keys(seneca.util.clean(q)).length) {
              return reply()
            }

            return intern.list(
              ctx,
              seneca,
              qent,
              table,
              q,
              function (err, reslist) {
                if (err) return reply(err)

                return reply(reslist ? reslist[0] : null)
              }
            )
          }

          // Load by id
          else {
            return intern.id_get(ctx, seneca, qent, table, qid, reply)
          }
        },

        list: function (msg, reply) {
          var seneca = this
          var qent = msg.qent
          var q = msg.q
          var table = intern.table(qent, ctx)

          intern.list(ctx, seneca, qent, table, q, reply)
        },

        remove: function (msg, reply) {
          var seneca = this
          var qent = msg.qent
          var q = msg.q
          var table = intern.table(qent, ctx)

          var all = true === q.all$
          var load = true === q.load$

          var qid = q.id

          if (null != qid) {
            return remove_single_by_id(qid)
          } else {
            var cq = seneca.util.clean(q)

            if (0 === Object.keys(cq).length && !all) {
              reply(seneca.error('empty-remove-query'))
            }

            intern.list(ctx, seneca, qent, table, cq, function (listerr, list) {
              if (intern.has_error(seneca, listerr, ctx, reply)) return

              if (all) {
                var batchreq = {
                  RequestItems: {},
                }

                batchreq.RequestItems[table] = list.map((item) => ({
                  DeleteRequest: {
                    Key: { id: item.id },
                  },
                }))

                if (0 === batchreq.RequestItems[table].length) {
                  return reply()
                }

                ctx.dc.batchWrite(batchreq, function (batcherr, batchres) {
                  if (intern.has_error(seneca, batcherr, ctx, reply)) return

                  reply()
                })
              } else {
                qid = 0 < list.length ? list[0].id : null
                return remove_single_by_id(qid)
              }
            })
          }

          function remove_single_by_id(qid) {
            if (null != qid) {
              if (load) {
                intern.id_get(ctx, seneca, qent, table, qid, dc_delete)
              } else {
                dc_delete()
              }
            } else {
              return reply()
            }
          }

          function dc_delete(err, old) {
            if (intern.has_error(seneca, err, ctx, reply)) return

            var delreq = {
              TableName: table,
              Key: { id: qid },
            }

            ctx.dc.delete(delreq, function (delerr, delres) {
              if (intern.has_error(seneca, delerr, ctx, reply)) return

              reply(old)
            })
          }
        },

        native: function (msg, reply) {
          reply({
            dc: ctx.dc,
          })
        },
      }

      return store
    },

    id_get: function (ctx, seneca, ent, table, id, reply) {
      var getreq = {
        TableName: table,
        Key: { id: id },
      }

      ctx.dc.get(getreq, function (geterr, getres) {
        if (intern.has_error(seneca, geterr, ctx, reply)) return

        var data = null == getres.Item ? null : getres.Item
        data = intern.outbound(ctx, ent, data)
        var out_ent = null == data ? null : ent.make$(data)
        reply(null, out_ent)
      })
    },

    list: function (ctx, seneca, qent, table, q, reply) {
      var isarr = Array.isArray
      if (isarr(q) || 'object' != typeof q) {
        q = { id: q }
      }

      var scanreq = {
        TableName: table,
      }

      let cq = seneca.util.clean(q)
      if (0 < Object.keys(cq).length) {
        scanreq.FilterExpression = Object.keys(cq)
          .map((k) =>
            isarr(cq[k])
              ? '(' +
                cq[k]
                  .map((v, i) => '#' + k + ' = :' + k + i + 'n')
                  .join(' or ') +
                ')'
              : '#' + k + ' = :' + k + 'n'
          )
          .join(' and ')

        scanreq.ExpressionAttributeNames = Object.keys(cq).reduce(
          (a, k) => ((a['#' + k] = k), a),
          {}
        )

        scanreq.ExpressionAttributeValues = Object.keys(cq).reduce(
          (a, k) => (
            isarr(cq[k])
              ? cq[k].map((v, i) => (a[':' + k + i + 'n'] = v))
              : (a[':' + k + 'n'] = cq[k]),
            a
          ),
          {}
        )
      }

      if (q.fields$) {
        scanreq.ProjectionExpression = q.fields$.map((n) => '#' + n).join(',')
        q.fields$.reduce(
          (a, k) => ((a['#' + k] = k), a),
          (scanreq.ExpressionAttributeNames =
            scanreq.ExpressionAttributeNames || {})
        )
      }

      // console.dir(scanreq,{depth:null})

      let out_list = []
      function page(paramExclusiveStartKey) {
        if (null != paramExclusiveStartKey) {
          scanreq.ExclusiveStartKey = paramExclusiveStartKey
        }
        ctx.dc.scan(scanreq, function (scanerr, scanres) {
          if (intern.has_error(seneca, scanerr, ctx, reply)) return

          if (null != scanres.Items) {
            scanres.Items.map((item) => out_list.push(qent.make$(item)))
          }

          if (scanres.LastEvaluatedKey) {
            setImmediate(page, scanres.ExclusiveStartKey)
          } else {
            return reply(null, out_list)
          }
        })
      }

      page()
    },

    inbound: function (ctx, ent, data) {
      if (null == data) return null

      // var canon = ent.canon$({ object: true })
      // var canonkey = canon.base + '/' + canon.name
      // var entity_options = ctx.options.entity[canonkey]

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

      // var canon = ent.canon$({ object: true })
      // var canonkey = canon.base + '/' + canon.name
      // var entity_options = ctx.options.entity[canonkey]

      let entity_options = intern.entity_options(ent, ctx)

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
