var Promise = require('bluebird');

var config = require('../load_config');
var plugged = require('../client');
var utils = require('../utils');
var langfile = require('../../langfile');
var timeouts = require('../chatfilters').timeouts;

config.userfilter.username_disallowed = config.userfilter.username_disallowed.map(function (e) {
    return new RegExp(e);
});

module.exports = {
    name: 'Username',
    check: function (user) {
        return new Promise(function (resolve, reject) {
            if (config.userfilter.enabled) {
                for (var i in config.userfilter.username_disallowed) {
                    if (user.username.match(config.userfilter.username_disallowed[i])) {
                        reject({
                            type: 'username',
                            chat: utils.replace(langfile.userfilter.username.warn, {username: user.username}),
                            action: function () {
                                timeouts[user.id] = setTimeout(function () {
                                    plugged.sendChat(utils.replace(langfile.userfilter.username.ban, {username: user.username}));
                                    plugged.banUser(user.id, plugged.BANDURATION.PERMA, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                                    timeouts[user.id] = undefined;
                                }, 60 * 1000);
                            }
                        });
                        return;
                    }
                }
                resolve();
            } else resolve();
        });
    }
};