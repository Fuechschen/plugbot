var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['everyone'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                plugged.sendChat(utils.replace(langfile.everyone.default, {
                    username: data.username,
                    msg: _.rest(split, 1).join(' ').trim()
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};