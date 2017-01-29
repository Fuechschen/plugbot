let plugged = require('../client');
let redis = require('../db/redis_db');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['ping'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 0) plugged.sendChat(utils.replace(langfile.ping.default, {username: data.username}), 30);
        });
        plugged.removeChatMessage(data.cid);
    }
};