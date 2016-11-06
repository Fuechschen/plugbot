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
    check: (data)=> {
        return new Promise((resolve, reject) => {
            //noinspection JSUnresolvedFunction
            redis.hincrby('user:spampoints', data.id, 1).then(points => {
                if (points > 60) reject({type: 'spam', points: 10});
                else resolve();
            });
        });
    },
    cron: new CronJob('0 0 * * * *', () => {
        //noinspection JSUnresolvedFunction
        redis.hkeys('user:spampoints').then(keys => {
            Promise.all(keys.map(key => //noinspection JSUnresolvedFunction
                redis.hincrby('user:spampoints', key, -60).then(p => {
                    if (p < 0) { //noinspection JSUnresolvedFunction
                        return redis.hset('user:spampoints', key, 0);
                    }
                    else return Promise.resolve();
                })));
        });
    }, null, true)
};