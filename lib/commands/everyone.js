let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['everyone'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                let split = data.message.trim().split(' ');
                //noinspection JSCheckFunctionSignatures
                plugged.sendChat(utils.replace(langfile.everyone.default, {
                    username: data.username,
                    msg: _.rest(split, 1).join(' ').trim()
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};