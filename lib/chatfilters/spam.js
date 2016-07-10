var Promise = require('bluebird');
var CronJob = require('cron').CronJob;

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
            //noinspection JSUnresolvedFunction
            redis.hincrby('user:spampoints', data.id, 1).then(function (points) {
                if (points > 60) reject({type: 'spam', points: 10});
                else resolve();
            });
        });
    },
    cron: new CronJob('0 0 * * * *', function () {
        //noinspection JSUnresolvedFunction
        redis.hkeys('user:spampoints').then(function (keys) {
            Promise.all(keys.map(function (key) {
                //noinspection JSUnresolvedFunction
                return redis.hincrby('user:spampoints', key, -60).then(function (p) {
                    if (p < 0) { //noinspection JSUnresolvedFunction
                        return redis.hset('user:spampoints',key, 0);
                    }
                    else return Promise.resolve();
                });
            }));
        });
    }, null, true)
};