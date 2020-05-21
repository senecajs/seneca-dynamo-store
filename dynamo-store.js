/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License. */
'use strict'


module.exports = dynamo_store

module.exports.errors = {}

const intern = (module.exports.intern = make_intern())


module.exports.defaults = {
  test: false,

}

function dynamo_store(options) {
  //var seneca = this
  //var ctx = intern.make_ctx({}, options)

  return {
    name: 'dynamo-store',
    exports: {
    },
  }
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

    
  }
}
