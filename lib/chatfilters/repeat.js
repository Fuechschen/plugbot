var Promise = require('bluebird');
var langfile = require('../../langfile');

var redis = require('../db/redis_db');

module.exports = {
    name: 'Repeat',
    type: 'repeat',
    enabled: true,
    strings: {
        warn: langfile.chatfilter.repeat.warn,
        mute: langfile.chatfilter.repeat.mute
    },
    check: (data)=> {
        return new Promise((resolve, reject) => {
            redis.get(`user:lastmessage:${data.id}`).then(lmsg => {
                if (lmsg === data.message) reject({type: 'repeat', points: 10});
                else {
                    resolve();
                    redis.set(`user:lastmessage:${data.id}`, data.message).then(() => {
                        //noinspection JSUnresolvedFunction
                        return redis.expire(`user:lastmessage:${data.id}`, 600);
                    });
                }
            })
        });
    }
};