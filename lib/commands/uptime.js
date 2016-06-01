var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

var startime = require('moment')();

module.exports = {
    names:['uptime'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 0) {
                plugged.sendChat(utils.replace(langfile.uptime.default, {
                    username: data.username,
                    time: startTime.fromNow()
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};