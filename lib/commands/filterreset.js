let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['filterreset'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                let split = data.message.split(' ');
                if (split.length > 2) {
                    //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    let user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined) {
                        //noinspection JSUnresolvedFunction
                        redis.hset('spam:user:spampoints', user.id, 0).then(() => //noinspection JSUnresolvedFunction
                        redis.del(`user:lastmessage:${user.id}`)).then(() => //noinspection JSUnresolvedFunction
                        redis.hset('user:spampoints', user.id, 0)).then(() => {

                        });
                        
                        redis.set(`user:chat:spam:${user.id}:warns`, 0).then(() => {
                            plugged.sendChat(utils.replace(langfile.filterreset.default, {
                                username: user.username,
                                mod: data.username
                            }));
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'FilterReset'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'FilterReset'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};