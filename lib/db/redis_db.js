let Redis = require('ioredis');

const config = require('../load_config');

let redis = new Redis(config.redis);

module.exports = redis;