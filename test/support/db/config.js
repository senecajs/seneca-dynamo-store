module.exports = {
  region: 'region',
  endpoint: process.env.SENECA_DYNAMO_ENDPOINT || 'http://localhost:18001',
  credentials: {
    accessKeyId: 'none',
    secretAccessKey: 'none'
  }

}
