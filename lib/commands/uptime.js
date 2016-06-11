var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

var startTime = require('moment')();

module.exports = {
    names: ['uptime'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 0) {
                //noinspection JSUnresolvedFunction
                plugged.sendChat(utils.replace(langfile.uptime.default, {
                    username: data.username,
                    time: startTime.fromNow()
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};