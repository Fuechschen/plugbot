var Promise = require('bluebird');
var cronJob = require('cron').CronJob;

var config = require('../load_config');
var langfile = require('../../langfile');
var redis = require('../db/redis_db');

module.exports = {
    name: 'Spam',
    enabled: true,
    strings: {
        spam: {
            mute: langfile.chatfilter.spam.mute,
            warn: langfile.chatfilter.spam.warn
        }
    },
    check: function (data) {
        return new Promise(function (resolve, reject) {
            redis.hincrby('user:spampoints', data.id, 1).then(function (points) {
                if (points > 60) reject({type: 'spam.warn', points: 10});
                else resolve();
            });
        });
    }
};