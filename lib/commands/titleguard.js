var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['titleguard'],
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.titleguard.enabled = !config.titleguard.enabled;
                if (config.titleguard.enabled) plugged.sendChat(utils.replace(langfile.titleguard.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.titleguard.disabled, {username: data.username}), 60);
                redis.hset('meta:config', 'titleguard:enabled', (config.youtubeGuard.enabled ? 1 : 0));
                story.info('titleguard', utils.userLogString(data.username, data.id) + ': --> ' + config.titleguard.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};