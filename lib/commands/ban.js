var story = require('storyboard').mainStory;
var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['ban'],
    enabled: false,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.split(' ');
                if (split.length > 2) {
                    var duration;
                    if (split[1] === 'h')duration = plugged.BANDURATION.HOUR;
                    else if (split[1] === 'd')duration = plugged.BANDURATION.DAY;
                    else if (split[1] === 'p' || split[1] === 'f')duration = plugged.BANDURATION.PERMA;
                    else return plugged.sendChat(utils.replace(langfile.error.argument, {
                            username: data.username,
                            cmd: 'Ban'
                        }), 20);
                    //noinspection JSUnresolvedFunction
                    var user = plugged.getUserByName(S(_.rest(split, 2).join(' ')).chompLeft('@').chompRight(' ').s) || plugged.getUserByID(split[2]);
                    if (user) {
                        plugged.sendChat(utils.replace(langfile.ban.default, {
                            mod: data.username,
                            username: user.username
                        }));
                        plugged.banUser(user.id, duration, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                    } else { //noinspection JSUnresolvedFunction
                        plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                            username: plugged.getUserByID(data.id),
                            value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                        }), 20);
                    }
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'Ban'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};