var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['historyskip'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.history.skipenabled = !config.history.skipenabled;
                    if (config.history.skipenabled) plugged.sendChat(utils.replace(langfile.skip.history.enabled, {username: data.username}), 30);
                    else plugged.sendChat(utils.replace(langfile.skip.history.disabled, {username: data.username}), 30);
                    redis.set('meta:config:history:skipenabled', (config.history.skipenabled ? 1 : 0));
                    story.info('historyskip', utils.userLogString(data.username, data.id) + ': --> ' + config.history.skipenabled.toString());
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Historyskip'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};