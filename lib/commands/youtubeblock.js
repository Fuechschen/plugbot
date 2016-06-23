var story = require('storyboard').mainStory;

var config = require('../load_config');
var redis = require('../db/redis_db');
var utils = require('../utils');
var plugged = require('../client');

module.exports = {
    names: ['youtubeblock', 'ytblock'],
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.youtubeGuard.block = !config.youtubeGuard.block;
                if (config.youtubeGuard.block) plugged.sendChat(utils.replace(langfile.youtubeGuard.block_enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.youtubeGuard.block_disabled, {username: data.username}), 60);
                redis.hset('meta:config', 'youtubeguard:enabled', (config.youtubeGuard.block ? 1 : 0));
                story.info('youtubeblock', utils.userLogString(data.username, data.id) + ': --> ' + config.youtubeGuard.block.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};