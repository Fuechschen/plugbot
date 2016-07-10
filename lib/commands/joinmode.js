var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../load_config');
var langfile = require('../../langfile');
var utils = require('../utils');

module.exports = {
    names: ['joinmode'],
    enabled:true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.options.joinmode = !config.options.joinmode;
                    if (config.options.joinmode) plugged.sendChat(utils.replace(langfile.joinmode.enabled, {username: data.username}), 30);
                    else plugged.sendChat(utils.replace(langfile.joinmode.disabled, {username: data.username}), 30);
                    //noinspection JSUnresolvedFunction
                    redis.hset('meta:config', 'joinmode:enabled', (config.options.joinmode? 1 : 0));
                    story.info('joinmode', utils.userLogString(data.username, data.id) + ': --> ' + config.options.joinmode.toString());
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Joinmode'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};
