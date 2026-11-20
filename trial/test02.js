
const Seneca = require('seneca')

var s0 = Seneca().test()
    .use('@seneca/entity')
    .use('doc')
    .use('..', {
      aws: {
        endpoint: 'http://localhost:18000'
      }
    })

run()

async function run() {
  var t01 = s0.entity('table01').make$().data$({
    id: 't6wq1o',
    //bar: 'b1',
    foo: 'a2',
  })
  console.log('A', t01)
  
  var t01o = await t01.save$()
  console.log('B', t01o)
}
