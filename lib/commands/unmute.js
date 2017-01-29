let story = require('storyboard').mainStory;
let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['unmute'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                let split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                let user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user) {
                    redis.exists(`user:mute:${user.id}`).then(exm => {
                        if (exm === 1) {
                            //noinspection JSUnresolvedFunction
                            redis.del(`user:mute:${user.id}`).then(() => {
                                //noinspection JSUnresolvedFunction
                                redis.del(`user:mute:${user.id}:violation`);
                                plugged.unmuteUser(user.id);
                            });
                            plugged.sendChat(utils.replace(langfile.unmute.default, {
                                username: user.username,
                                mod: data.username
                            }), 60);
                            story.info('unmute', `${utils.userLogString(data.username, data.id)}: ${utils.userLogString(user)}`);
                        } else plugged.sendChat(utils.replace(langfile.unmute.notMuted, {
                            mod: data.username,
                            username: user.username
                        }), 30);
                    });
                } else { //noinspection JSUnresolvedFunction
                    plugged.sendChat(utils.replace(langfile.error.userNotFound, {
                        username: plugged.getUserByID(data.id),
                        value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                    }), 20);
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};