var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['clearhistory'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.sendChat(utils.replace(langfile.skip.history.clear, {username: data.username}), 60);
                //noinspection JSCheckFunctionSignatures
                redis.keys('media:history:*').then(function (keys) {
                    //noinspection JSUnresolvedFunction
                    keys.forEach(function (key) {
                        //noinspection JSUnresolvedFunction
                        redis.del(key);
                    });
                });
                story.info('clearhistory', utils.userLogString(data.username, data.id));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};