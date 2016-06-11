var Promise = require('bluebird');
var langfile = require('../../langfile');

var redis = require('../db/redis_db');

module.exports = {
    name: 'Repeat',
    enabled: true,
    strings: {
        repeat: {
            warn: langfile.chatfilter.repeat.warn,
            mute: langfile.chatfilter.repeat.mute
        }
    },
    check: function (data) {
        return new Promise(function (resolve, reject) {
            redis.get('user:lastmessage:' + data.id).then(function (lmsg) {
                if (lmsg === data.msg) reject({type: 'repeat', points: 10});
                else {
                    resolve();
                    redis.set('user:lastmessage:' + data.id).then(function () {
                        redis.expire('user:lastmessage:' + data.id, 600);
                    });
                }
            })
        });
    }
};