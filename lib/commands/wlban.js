let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['wlban'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                let split = data.message.split(' ');
                if (split.length >= 2) {
                    //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    let user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user) {
                        plugged.sendChat(utils.replace(langfile.wlban.default, {
                            username: user.username,
                            mod: data.username
                        }));
                        redis.set(`user:waitlist:ban:${user.id}`, 1);
                        if (utils.wlPosition(user.id) !== -1) plugged.removeDJ(user.id);
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};