var story = require('storyboard').mainStory;

var config = require('../load_config');
var redis = require('../db/redis_db');
var utils = require('../utils');
var plugged = require('../client');

module.exports = {
    names: ['soundcloudblock', 'scblock'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.soundcloudGuard.block = !config.soundcloudGuard.block;
                if (config.soundcloudGuard.block) plugged.sendChat(utils.replace(langfile.soundcloudGuard.block_enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.soundcloudGuard.block_disabled, {username: data.username}), 60);
                redis.hset('meta:config', 'soundcloudguard:enabled', (config.soundcloudGuard.block ? 1 : 0));
                story.info('soundcloudblock', utils.userLogString(data.username, data.id) + ': --> ' + config.soundcloudGuard.block.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};