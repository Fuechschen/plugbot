let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['unban'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                let username = S(_.rest(data.message.split(' '))).chompRight(' ').chompLeft('@').s;
                plugged.getBans((err, bans)=> {
                    if (err) {
                        //todo
                    } else {
                        let ban = bans.filter(ban=>ban.username === username);
                        if (ban) {
                            plugged.unbanUser(ban.id, (err)=> {
                                if (!err) {
                                    //todo
                                }
                            })
                        } else {
                            //todo
                        }
                    }
                })
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};