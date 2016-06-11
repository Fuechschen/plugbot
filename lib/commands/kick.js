var story = require('storyboard').mainStory;
var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['kick'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    redis.get('user:role:save:' + user.id).then(function (role) {
                        if (role >= perm) plugged.sendChat(utils.replace(langfile.kick.error, {
                            mod: data.username,
                            username: user.username
                        }), 20);
                        else {
                            plugged.sendChat(utils.replace(langfile.kick.default, {
                                mod: data.username,
                                username: user.username
                            }), 60);
                            plugged.banUser(user.id, plugged.BANDURATION.HOUR, plugged.BANREASON.VIOLATING_COMMUNITY_RULES, function () {
                                setTimeout(function () {
                                    plugged.unbanUser(user.id);
                                }, 15 * 1000);
                            });
                            story.info('lockskip', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(plugged.getUserByID(user)));
                        }
                    });
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};