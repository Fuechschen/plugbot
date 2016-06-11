var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['soundcloudguard', 'scguard'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.soundcloudGuard.enabled = !config.soundcloudGuard.enabled;
                if (config.soundcloudGuard.enabled) plugged.sendChat(utils.replace(langfile.soundcloudGuard.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.soundcloudGuard.disabled, {username: data.username}), 60);
                redis.hset('meta:config', 'soundcloudguard:enabled', (config.soundcloudGuard.enabled ? 1 : 0));
                story.info('soundcloudguard', utils.userLogString(data.username, data.id) + ': --> ' + config.soundcloudGuard.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};