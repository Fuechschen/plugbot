var Promise = require('bluebird');

var redis = require('./db/redis_db');
var plugged = require('./client');
var langfile = require('../langfile');

module.exports = {
    add: function (uid, pos) {
        if (typeof uid === 'object') uid = uid.id;
        return redis.zadd('meta:addqueue', pos - 1, uid).then(function () {
            return redis.get('meta:isAddQueueLock').then(function (isLock) {
                if ((isLock === '0' || isLock === null) && plugged.isWaitlistLocked() === false) {
                    plugged.setLock(true, false);
                    return redis.set('meta:isAddQueueLock', 1);
                } else return Promise.resolve();
            });
        });
    },
    wlUpdate: function (waitlist) {
        if (waitlist.length < 50) {
            redis.exists('meta:addqueue').then(function (ex) {
                if (ex === 1) {
                    redis.zrange('meta:addqueue', 0, 0, 'WITHSCORES').then(function (result) {
                        var pos = parseInt(result[1]);
                        var uid = parseInt(result[0]);
                        if (plugged.getUserByID(uid) !== undefined) {
                            plugged.sendChat(utils.replace(langfile.addqueue.default, {username: plugged.getUserByID(uid).username}));
                            plugged.addToWaitlist(uid, function (err) {
                                if (!err && pos < 50) {
                                    plugged.moveDJ(uid, pos);
                                    redis.zrem('meta:addqueue', uid).then(function () {
                                        redis.exists('meta:addqueue').then(function (ex) {
                                            if (ex === 0) {
                                                redis.get('meta:isAddQueueLock').then(function (isLock) {
                                                    if (isLock === '1' && plugged.isWaitlistLocked() === true) {
                                                        plugged.setLock(false, false);
                                                        redis.set('meta:isAddQueueLock', 0);
                                                    }
                                                });
                                            }
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }
};