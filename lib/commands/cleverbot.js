var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['cleverbot'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.cleverbot.enabled = !config.cleverbot.enabled;
                if (config.cleverbot.enabled) plugged.sendChat(utils.replace(langfile.cleverbot.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.cleverbot.disabled, {username: data.username}), 30);
                redis.hset('meta:config', 'cleverbot:enabled', (config.cleverbot.enabled ? 1 : 0));
                story.info('cleverbot', utils.userLogString(data.username, data.id) + ': --> ' + config.cleverbot.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};