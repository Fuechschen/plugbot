var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['bouncer+'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                config.options.bouncer_plus = !config.options.bouncer_plus;
                if (config.options.bouncer_plus) plugged.sendChat(utils.replace(langfile.bouncer_plus.enabled, {username: data.username}), 45);
                else plugged.sendChat(utils.replace(langfile.bouncer_plus.disabled, {username: data.username}), 45);
                redis.set('meta:config:options:bouncer_plus', (config.options.bouncer_plus ? 1 : 0));
                story.info('bouncer+', utils.userLogString(data.username, data.id) + ': --> ' + config.options.bouncer_plus.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};