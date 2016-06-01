var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['wlunban'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                if (split.length >= 2) {
                    //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    var user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined) {
                        plugged.sendChat(utils.replace(langfile.wlban.unban, {
                            username: user.username,
                            mod: data.username
                        }));
                        redis.del('user:waitlist:ban:' + user.id);
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};