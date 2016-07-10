var Redis = require('ioredis');

var config = require('../load_config');

var redis;

if (config.options.redis_substitute) {
    var moment = require('moment');
    var Promise = require('bluebird');

    var db = require('./sql_db');

    redis = {
        set: function (key, val, expire) {
            return db.models.Redis_Keys.upsert({
                key: key,
                type: 'string',
                data: val.toString(),
                expires: (expire !== undefined ? moment().add(expire, 'seconds').toDate() : null)
            });
        },
        del: function (key) {
            //todo return deleted rows count
            arguments.forEach(function (key) {
                db.models.Redis_Keys.destroy({where: {key: key}});
            });
            return Promise.resolve();
        },
        expire: function (key, time) {
            return db.models.Redis_Keys.update({expires: moment().add(time, 'seconds').toDate()}, {where: {key: key}});
        }
    }
}
else redis = new Redis(config.redis);

module.exports = redis;