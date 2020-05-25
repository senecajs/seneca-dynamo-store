/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License. */
'use strict'


const AWS = require("aws-sdk")


module.exports = dynamo_store

module.exports.errors = {}

const intern = (module.exports.intern = make_intern())


module.exports.defaults = {
  test: false,

  // preserve undefined fields when saving
  merge: true,
  
  aws: {
    region: "region",
    endpoint: "http://localhost:8000",
  },

  // See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#constructor-property
  dc: {
    // Latest version of dynamodb supports empty strings
    convertEmptyValues: false
  },

  // entity meta data, by canon string
  entity: {
  }
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

  
  const ctx = intern.make_ctx({
    name: 'dynamo-store'
  }, options)

  var store = intern.make_store(ctx)
  var meta = seneca.store.init(seneca, options, store)

  
  seneca.add({init:store.name, tag:meta.tag},function(msg, reply) {
    AWS.config.update(options.aws)
    ctx.dc = new AWS.DynamoDB.DocumentClient(options.dc)
    reply()
  })

  var plugin_meta = {
    name: store.name,
    tag: meta.tag,
    exports: {
      get_dc: ()=>{
        return ctx.dc
      }
    },
  }
  
  return plugin_meta
}

function make_intern() {
  return {
    PV: 1, // persistence version, used for data migration

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

    get_table: function(ent) {
      var canon = ent.canon$({ object: true })
      var table = (canon.base ? canon.base + '_' : '') + canon.name
      return table
    },

    has_error: function(seneca, err, ctx, reply) {
      if (err) {
        seneca.log.error('entity', err, { store: ctx.name })
        reply(err)
      }
      return null != err
    },

    make_store: function(ctx) {
      const opts = ctx.options
      
      const store = {
        name: ctx.name,

        close: function(msg, reply) {
          reply()
        },

        save: function(msg, reply) {
          var seneca = this
          var ent = msg.ent

          var update = null != ent.id
          var table = intern.get_table(ent)
          var data = ent.data$(false)
          var q = msg.q || {}
          
          // The merge$ directive has precedence.
          // Explicit `false` value otherwise consider merge `true`. 
          var merge = null == q.merge$ ? false !== opts.merge : false !== q.merge$

          data = intern.inbound(ctx,ent,data)
          
          // Create new Item.
          if (!update) {
            var id = ent.id$

            if (null == id) {
              id = opts.generate_id(ent)
            }

            data.id = id
          }


          if(!update || !merge) {
            var req = {
              TableName: table,
              Item: data
            }

            ctx.dc.put(req, function(err, res) {
              if(intern.has_error(seneca,err,ctx,reply)) return;

              // Reload to get data as per db
              return intern.id_get(ctx,seneca,ent,table,data.id,reply)
            })
          }

          // Update existing Item
          else {

            // Build update structure
            // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property
            var upreq = {
              TableName: table,
              Key: { id: data.id },
              AttributeUpdates:
              Object
                .keys(data)
                .filter(k=> k!='id' && void 0!==data[k] )
                .reduce((o,k)=>(o[k]={Action:'PUT',Value:data[k]},o),{})
            }

            ctx.dc.update(upreq, function(uperr, upres) {
              if(intern.has_error(seneca,uperr,ctx,reply)) return;

              // Reload to get data as per db
              return intern.id_get(ctx,seneca,ent,table,data.id,reply)
            })
          }
        },

        load: function(msg, reply) {
          var seneca = this
          var qent = msg.qent
          var q = msg.q
          var table = intern.get_table(qent)

          var qid = q.id
          
          if(null == qid) {
            var cq = seneca.util.clean(q)
            var cq_key_count = Object.keys(cq).length
            if(0 < cq_key_count ) {
              intern.list(ctx,seneca,qent,table,q,function(err, reslist) {
                if(err) return reply(err)

                return reply(reslist ? reslist[0] : null)
              })
            }
            else {
              return reply()
            }
          }

          // Load by id
          else {
            return intern.id_get(ctx,seneca,qent,table,qid,reply)
          }
        },

        list: function(msg, reply) {
          var seneca = this
          var qent = msg.qent
          var q = msg.q
          var table = intern.get_table(qent)

          intern.list(ctx,seneca,qent,table,q,reply)
        },

        remove: function(msg, reply) {
          var seneca = this
          var qent = msg.qent
          var q = msg.q
          var table = intern.get_table(qent)

          var all = true === q.all$
          var load = true === q.load$

          var qid = q.id

          if(null != qid) {
            return remove_single_by_id(qid)
          }
          else {
            var cq = seneca.util.clean(q)

            if(0 === Object.keys(cq).length && !all) {
              reply(seneca.error('empty-remove-query'))
            }
            
            intern.list(ctx,seneca,qent,table,cq,function(listerr, list) {
              if(intern.has_error(seneca,listerr,ctx,reply)) return;

              if(all) {
                var batchreq = {
                  RequestItems: {}
                }

                batchreq.RequestItems[table] = list.map(item=>({
                  DeleteRequest: {
                    Key: { id: item.id }
                  }
                }))
                
                if(0 === batchreq.RequestItems[table].length) {
                  return reply()
                }
                
                ctx.dc.batchWrite(batchreq, function(batcherr, batchres) {
                  if(intern.has_error(seneca,batcherr,ctx,reply)) return;

                  reply()
                })
              }
              else {
                qid = 0 < list.length ? list[0].id : null
                return remove_single_by_id(qid)
              }
            })
          }

          function remove_single_by_id(qid) {
            if(null != qid) {
              if(load) {
                intern.id_get(ctx,seneca,qent,table,qid,dc_delete)
              }
              else {
                dc_delete()
              }
            }
            else {
              return reply()
            }
          }

          function dc_delete(err, old) {
            if(intern.has_error(seneca,err,ctx,reply)) return;

            var delreq = {
              TableName: table,
              Key: { id: qid },
            }
            
            ctx.dc.delete(delreq, function(delerr, delres) {
              if(intern.has_error(seneca,delerr,ctx,reply)) return;
              
              reply(old)
            })
          }
        },

        native: function(msg, reply) {
          reply({
            dc: ctx.dc
          })
        },
      }

      return store
    },

    id_get: function(ctx,seneca,ent,table,id,reply) {
      var getreq = {
        TableName: table,
        Key: { id: id },
      }

      ctx.dc.get(getreq, function(geterr, getres) {
        if(intern.has_error(seneca,geterr,ctx,reply)) return;

        var data = null == getres.Item ? null : getres.Item
        data = intern.outbound(ctx,ent,data)
        var out_ent = null == data ? null : ent.make$(data)
        reply(null,out_ent)
      })
    },

    list: function(ctx,seneca,qent,table,q,reply) {
      var isarr = Array.isArray
      if(isarr(q)) {
        q = {id:q}
      }
      if('object'!=typeof(q)) {
        q = {id:q}
      }
      
      var scanreq = {
        TableName: table,
        ScanFilter: Object
          .keys(q)
          .reduce((o,k)=>(o[k]={
            ComparisonOperator: isarr(q[k])?'IN':'EQ',
            AttributeValueList:isarr(q[k])?q[k]:[q[k]],
          },o),{})
      }

      ctx.dc.scan(scanreq, function(scanerr, scanres) {
        if(intern.has_error(seneca,scanerr,ctx,reply)) return;

        var out_list = null == scanres.Items ? [] :
            scanres.Items.map(item=>qent.make$(item))
            
        reply(null, out_list)
      })
    },

    inbound: function(ctx,ent,data) {
      if(null == data) return null;
      
      var canon = ent.canon$({object:true})
      var canonkey = canon.base+'/'+canon.name
      var entity = ctx.options.entity[canonkey]

      if(entity) {
        var fields = entity.fields||{}
        Object.keys(fields).forEach(fn=>{
          var fs = fields[fn]||{}
          var type = fs.type
          if('date'===type && data[fn] instanceof Date) {
            data[fn] = data[fn].toISOString()
          }
        })
      }
      return data
    },

    outbound: function(ctx,ent,data) {
      if(null == data) return null;
      
      var canon = ent.canon$({object:true})
      var canonkey = canon.base+'/'+canon.name
      var entity = ctx.options.entity[canonkey]

      if(entity) {
        var fields = entity.fields||{}
        Object.keys(fields).forEach(fn=>{
          var fs = fields[fn]||{}
          var type = fs.type
          if('date'===type && 'string' === typeof(data[fn])) {
            data[fn] = new Date(data[fn])
          }
        })
      }
      return data
    } 

  }
}
