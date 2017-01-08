let Promise = require('bluebird');

const config = require('../load_config');
let plugged = require('../client');
let utils = require('../utils');
const langfile = require('../../langfile');
let timeouts = require('../chatfilters').timeouts;

config.userfilter.usernameDisallowed = config.userfilter.usernameDisallowed.map(e => new RegExp(e));

module.exports = {
    name: 'Username',
    enabled: true,
    check: (user) => {
        return new Promise((resolve, reject) => {
            if (config.userfilter.enabled) {
                for (let i in config.userfilter.usernameDisallowed) {
                    if (user.username.match(config.userfilter.usernameDisallowed[i])) {
                        return reject({
                            type: 'username',
                            chat: utils.replace(langfile.userfilter.username.warn, {username: user.username}),
                            action: () => {
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
                    action: () => {
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