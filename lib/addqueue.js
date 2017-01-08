let Promise = require('bluebird');

let redis = require('./db/redis_db');
let plugged = require('./client');
const langfile = require('../langfile');
let utils = require('./utils');

module.exports = {
    add: (uid, pos)=> {
        if (typeof uid === 'object') uid = uid.id;
        //noinspection JSUnresolvedFunction
        return redis.zadd('meta:addqueue', pos - 1, uid).then(() => redis.get('meta:isAddQueueLock').then(isLock => {
            if ((isLock === '0' || isLock === null) && plugged.isWaitlistLocked() === false) {
                plugged.setLock(true, false);
                return redis.set('meta:isAddQueueLock', 1);
            }
            return Promise.resolve();
        }));
    },
    wlUpdate: (waitlist)=> {
        if (waitlist.length < 50) {
            redis.exists('meta:addqueue').then(ex => {
                if (ex === 1) {
                    //noinspection JSUnresolvedFunction
                    redis.zrange('meta:addqueue', 0, 0, 'WITHSCORES').then(result => {
                        let pos = parseInt(result[1]);
                        let uid = parseInt(result[0]);
                        if (plugged.getUserByID(uid)) {
                            plugged.sendChat(utils.replace(langfile.addqueue.default, {username: plugged.getUserByID(uid).username}));
                            plugged.addToWaitlist(uid, err => {
                                if (!err && pos < 50) {
                                    plugged.moveDJ(uid, pos);
                                    //noinspection JSUnresolvedFunction
                                    redis.zrem('meta:addqueue', uid).then(() => {
                                        return redis.exists('meta:addqueue');
                                    }).then(ex => {
                                        if (ex === 0) {
                                            redis.get('meta:isAddQueueLock').then(isLock => {
                                                if (isLock === '1' && plugged.isWaitlistLocked() === true) {
                                                    plugged.setLock(false, false);
                                                    redis.set('meta:isAddQueueLock', 0);
                                                }
                                            });
                                        }
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