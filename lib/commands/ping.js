var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['ping'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 0) plugged.sendChat(utils.replace(langfile.ping.default, {username: data.username}), 30);
        });
        plugged.removeChatMessage(data.cid);
    }
};