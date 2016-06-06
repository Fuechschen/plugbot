var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['youtubeguard', 'ytguard'],
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.youtubeGuard.enabled = !config.youtubeGuard.enabled;
                if (config.youtubeGuard.enabled) plugged.sendChat(utils.replace(langfile.youtubeGuard.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.youtubeGuard.disabled, {username: data.username}), 60);
                redis.hset('meta:config', 'youtubeguard:enabled', (config.youtubeGuard.enabled ? 1 : 0));
                story.info('youtubeguard', utils.userLogString(data.username, data.id) + ': --> ' + config.youtubeGuard.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};