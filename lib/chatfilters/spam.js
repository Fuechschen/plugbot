var Promise = require('bluebird');
var CronJob = require('cron').CronJob;

var config = require('../load_config');
var langfile = require('../../langfile');
var redis = require('../db/redis_db');

module.exports = {
    name: 'Spam',
    type: 'spam',
    enabled: true,
    strings: {
        mute: langfile.chatfilter.spam.mute,
        warn: langfile.chatfilter.spam.warn
    },
    check: function (data) {
        return new Promise(function (resolve, reject) {
            redis.hincrby('user:spampoints', data.id, 1).then(function (points) {
                if (points > 60) reject({type: 'spam', points: 10});
                else resolve();
            });
        });
    },
    cron: new CronJob('0 0 * * * *', function () {
        redis.hkeys('user:spampoints').then(function (keys) {
            Promise.all(keys.map(function (key) {
                return redis.hincrby('user:spampoints', key, -60).then(function (p) {
                    if (p < 0) return redis.hset(key, 0);
                    else return Promise.resolve();
                });
            }));
        });
    }, null, true)
};