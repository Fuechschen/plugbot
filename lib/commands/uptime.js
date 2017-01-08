let plugged = require('../client');
let redis = require('../db/redis_db');
let utils = require('../utils');
const langfile = require('../../langfile');

let startTime = require('moment')();

module.exports = {
    names: ['uptime'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 0) {
                //noinspection JSUnresolvedFunction
                plugged.sendChat(utils.replace(langfile.uptime.default, {
                    username: data.username,
                    time: startTime.fromNow()
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};