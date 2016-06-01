var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['lock'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.sendChat(utils.replace(langfile.bp_actions.lock, {username: data.username}), 70);
                plugged.setLock(true, false);
                story.info('lock', utils.userLogString(data.username, data.id));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};