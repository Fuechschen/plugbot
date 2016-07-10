var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['filterreset'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                if (split.length > 2) {
                    //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    var user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined) {
                        //noinspection JSUnresolvedFunction
                        redis.hset('spam:user:spampoints', user.id, 0).then(function () {
                            //noinspection JSUnresolvedFunction
                            return redis.del('user:lastmessage:' + user.id);
                        }).then(function () {
                            //noinspection JSUnresolvedFunction
                            return redis.hset('user:spampoints', user.id, 0);
                        }).then(function () {

                        });
                        
                        redis.set('user:chat:spam:' + user.id + ':warns', 0).then(function () {
                            plugged.sendChat(utils.replace(langfile.filterreset.default, {
                                username: user.username,
                                mod: data.username
                            }));
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'FilterReset'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'FilterReset'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};