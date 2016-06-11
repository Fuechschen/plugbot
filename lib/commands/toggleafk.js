var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['toggleafk'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.afk.enabled = !config.afk.enabled;
                if (config.afk.enabled) plugged.sendChat(utils.replace(langfile.afk.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.afk.disabled, {username: data.username}), 30);
                redis.hset('meta:config', 'afk:enabled', (config.afk.enabled ? 1 : 0));
                story.info('afk', utils.userLogString(data.username, data.id) + ': --> ' + config.afk.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};