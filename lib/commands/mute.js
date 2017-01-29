let story = require('storyboard').mainStory;
let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['mute'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                let split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                let user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user) {
                    redis.exists(`user:mute:${user.id}`).then(exm => {
                        if (exm === 1) {
                            plugged.sendChat(utils.replace(langfile.mute.alreadyMuted, {
                                username: user.username,
                                mod: data.username
                            }), 30);
                        } else {
                            redis.set(`user:mute:${user.id}`, 1).then(() => {
                                redis.set(`user:mute:${user.id}:violation`, 0);
                                //noinspection JSUnresolvedFunction
                                redis.expire(`user:mute:${user.id}`, config.chatfilter.spam.muteDuration);
                            });
                            plugged.sendChat(utils.replace(langfile.mute.default, {
                                username: user.username,
                                mod: data.username
                            }), 60);
                            story.info('mute', `${utils.userLogString(data.username, data.id)}: ${utils.userLogString(user)}`);
                        }
                    });
                } else { //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
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