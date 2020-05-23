/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License. */
'use strict'


const AWS = require("aws-sdk")


module.exports = dynamo_store

module.exports.errors = {}

const intern = (module.exports.intern = make_intern())


module.exports.defaults = {
  test: false,

  aws: {
    region: "region",
    endpoint: "http://localhost:8000",
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
    ctx.dc = new AWS.DynamoDB.DocumentClient()
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
        // console.log('HERR', typeof(err), require('util').isError(err), err)
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

          // Create new Item.
          if (!update) {
            var id = ent.id$

            if (null == id) {
              id = opts.generate_id(ent)
            }

            data.id = id

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
                .filter(k=>k!='id')
                .reduce((o,k)=>(o[k]={Action:'PUT',Value:data[k]},o),{})
            }

            //console.log(upreq)
            
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
          
          if(null == qid) {
            return reply()
          }

          // Remove single by id
          else {
            var delreq = {
              TableName: table,
              Key: { id: qid },
            }

            ctx.dc.delete(delreq, function(geterr, getres) {
              if(intern.has_error(seneca,geterr,ctx,reply)) return;

              reply()
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

      //console.log(getreq)
      
      ctx.dc.get(getreq, function(geterr, getres) {
        //console.log('TTT', geterr, getres)
        if(intern.has_error(seneca,geterr,ctx,reply)) return;

        var out_ent = null == getres.Item ? null : ent.make$(getres.Item)
        reply(out_ent)
      })
    },

    list: function(ctx,seneca,qent,table,q,reply) {
      var scanreq = {
        TableName: table,
        ScanFilter: Object
          .keys(q)
          .reduce((o,k)=>(o[k]={
            ComparisonOperator: 'EQ',
            AttributeValueList:[q[k]],
          },o),{})
      }

      ctx.dc.scan(scanreq, function(scanerr, scanres) {
        if(intern.has_error(seneca,scanerr,ctx,reply)) return;

        var out_list = null == scanres.Items ? [] :
            scanres.Items.map(item=>qent.make$(item))
            
        reply(null, out_list)
      })
    },

  }
}
