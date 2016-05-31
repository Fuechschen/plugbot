var Redis = require('ioredis');

var config = require('../load_config');

var redis = new Redis(config.redis);

module.exports = redis;