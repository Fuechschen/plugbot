var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['dcmoveback'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.options.dcmoveback = !config.options.dcmoveback;
                if (config.options.dcmoveback) plugged.sendChat(utils.replace(langfile.dcmoveback.enabled, {username: data.username}));
                else plugged.sendChat(utils.replace(langfile.dcmoveback.disabled, {username: data.username}));
                redis.set('meta:config', 'options:dcmoveback', (config.options.dcmoveback ? 1 : 0));
                story.info('dcmoveback', utils.userLogString(data.username, data.id) + ': --> ' + config.options.dcmoveback.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};