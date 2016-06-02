var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['promote'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            var split = data.message.trim().split(' ');
            if (perm > 0) {
                if (split.length === 1) plugged.addStaff(data.id, perm);
                else if (split.length === 2 && utils.role(split[1]) !== undefined && utils.role(split[1]) !== plugged.USERROLE.NONE && utils.role(split[1]) <= perm) {
                    plugged.addStaff(data.id, utils.role(split[1]));
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};