var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['clear', 'clearwl'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if ((config.options.bouncer_plus ? (perm > 1) : (perm > 2))) {
                plugged.sendChat(utils.replace(langfile.bp_actions.clear, {username: data.username}), 70);
                plugged.setLock(true, true);
                story.info('clear', utils.userLogString(data.username, data.id));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};