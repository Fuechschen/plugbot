let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['wlunban'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                let split = data.message.split(' ');
                if (split.length >= 2) {
                    //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    let user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user) {
                        plugged.sendChat(utils.replace(langfile.wlban.unban, {
                            username: user.username,
                            mod: data.username
                        }));
                        //noinspection JSUnresolvedFunction
                        redis.del(`user:waitlist:ban:${user.id}`);
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};