var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['togglecustomcommands', 'togglecc'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.customcommands.enabled = !config.customcommands.enabled;
                if (config.customcommands.enabled) plugged.sendChat(utils.replace(langfile.customcommands.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.customcommands.disabled, {username: data.username}), 30);
                redis.set('meta:config:customcommands:enabled', (config.state.eventmode ? 1 : 0));
                story.info('customcommands', utils.userLogString(data.username, data.id) + ': --> ' + config.customcommands.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};