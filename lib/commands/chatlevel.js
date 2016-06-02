var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['chatlevel', 'chatlvl', 'clvl'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                if (split.length === 2) {
                    var lvl = parseInt(split[1]);
                    if (!isNaN(lvl) && [1, 2, 3].indexOf(lvl) !== -1) {
                        plugged.sendChat(utils.replace(langfile.chatlevel.default, {username: data.username}));
                        //noinspection JSUnresolvedFunction
                        plugged.setMinChatLevel(lvl);
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'ChatLevel'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'ChatLevel'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};