let story = require('storyboard').mainStory;
let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['kick'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                let split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                let user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    redis.get(`user:role:save:${user.id}`).then(role => {
                        if (role >= perm) plugged.sendChat(utils.replace(langfile.kick.error, {
                            mod: data.username,
                            username: user.username
                        }), 20);
                        else {
                            plugged.sendChat(utils.replace(langfile.kick.default, {
                                mod: data.username,
                                username: user.username
                            }), 60);
                            plugged.banUser(user.id, plugged.BANDURATION.HOUR, plugged.BANREASON.VIOLATING_COMMUNITY_RULES, () => {
                                setTimeout(() => {
                                    plugged.unbanUser(user.id);
                                }, 15 * 1000);
                            });
                            story.info('lockskip', `${utils.userLogString(data.username, data.id)}: ${utils.userLogString(plugged.getUserByID(user))}`);
                        }
                    });
                } else { //noinspection JSUnresolvedFunction
                    plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                        username: plugged.getUserByID(data.id),
                        value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                    }), 20);
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};