var story = require('storyboard').mainStory;
var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['mute'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    redis.exists('user:mute:' + user.id).then(function (exm) {
                        if (exm === 1) {
                            plugged.sendChat(utils.replace(langfile.mute.already_muted, {
                                username: user.username,
                                mod: data.username
                            }), 30);
                        } else {
                            redis.set('user:mute:' + user.id, 1).then(function () {
                                redis.set('user:mute:' + user.id + ':violation', 0);
                                //noinspection JSUnresolvedFunction
                                redis.expire('user:mute:' + user.id, config.chatfilter.spam.mute_duration);
                            });
                            plugged.sendChat(utils.replace(langfile.mute.default, {
                                username: user.username,
                                mod: data.username
                            }), 60);
                            story.info('mute', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user));
                        }
                    });
                } else { //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
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