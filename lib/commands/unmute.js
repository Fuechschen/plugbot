var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['unmute'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    redis.exists('user:mute:' + user.id).then(function (exm) {
                        if (exm === 1) {
                            redis.del('user:mute:' + user.id).then(function () {
                                redis.del('user:mute:' + user.id + ':violation');
                                plugged.unmuteUser(user.id);
                            });
                            plugged.sendChat(utils.replace(langfile.unmute.default, {
                                username: user.username,
                                mod: data.username
                            }), 60);
                            story.info('unmute', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user));
                        } else plugged.sendChat(utils.replace(langfile.unmute.not_muted, {
                            mod: data.username,
                            username: user.username
                        }), 30);
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