var Promise = require('bluebird');

var config = require('../load_config');
var plugged = require('../client');
var utils = require('../utils');
var langfile = require('../../langfile');
var timeouts = require('../chatfilters').timeouts;

config.userfilter.username_disallowed = config.userfilter.username_disallowed.map(e => new RegExp(e));

module.exports = {
    name: 'Username',
    enabled: true,
    check: function (user) {
        return new Promise((resolve, reject) => {
            if (config.userfilter.enabled) {
                for (var i in config.userfilter.username_disallowed) {
                    if (user.username.match(config.userfilter.username_disallowed[i])) {
                        return reject({
                            type: 'username',
                            chat: utils.replace(langfile.userfilter.username.warn, {username: user.username}),
                            action: function () {
                                timeouts[user.id] = setTimeout(() => {
                                    plugged.sendChat(utils.replace(langfile.userfilter.username.ban, {username: user.username}));
                                    plugged.banUser(user.id, plugged.BANDURATION.PERMA, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                                    timeouts[user.id] = undefined;
                                }, 60 * 1000);
                            }
                        });
                    }
                }
                if (config.userfilter.regex.test(user.username)) return reject({
                    type: 'username',
                    chat: utils.replace(langfile.userfilter.username.warn, {username: user.username}),
                    action: function () {
                        timeouts[user.id] = setTimeout(() => {
                            plugged.sendChat(utils.replace(langfile.userfilter.username.ban, {username: user.username}));
                            plugged.banUser(user.id, plugged.BANDURATION.PERMA, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                            timeouts[user.id] = undefined;
                        }, 60 * 1000);
                    }
                });
                resolve();
            } else resolve();
        });
    }
};