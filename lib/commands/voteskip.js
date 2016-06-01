var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['voteskip'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.voteskip.enabled = !config.voteskip.enabled;
                    if (config.voteskip.enabled) plugged.sendChat(utils.replace(langfile.skip.vote.enabled, {username: data.username}), 30);
                    else plugged.sendChat(utils.replace(langfile.skip.vote.disabled, {username: data.username}), 30);
                    redis.set('meta:config:voteskip:enabled', (config.voteskip.enabled ? 1 : 0));
                    story.info('voteskip', utils.userLogString(data.username, data.id) + ': --> ' + config.voteskip.enabled.toString());
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Voteskip'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};