var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['roulette'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                redis.exists('meta:roulette:active').then(function (exa) {
                    if (exa === 0) {
                        var split = data.message.trim().split(' ');
                        var m = (split.length < 2) ? NaN : parseInt(split[1]);
                        var t = (split.length < 3) ? 2 : parseInt(split[2]);
                        if (!isNaN(t) && !isNaN(m)) {
                            redis.set('meta:roulette:active', 1);
                            plugged.sendChat(utils.replace(langfile.roulette.default, {
                                username: data.username,
                                time: t,
                                moves: m
                            }));
                            setTimeout(function () {
                                redis.del('meta:roulette:active');
                                redis.scard('meta:roulette:users').then(function (memcount) {
                                    if (memcount === 0) {
                                        plugged.sendChat(utils.replace(langfile.roulette.no_joins, {username: data.username}));
                                    } else {
                                        plugged.sendChat(utils.replace(langfile.roulette.started, {
                                            username: data.username,
                                            users: memcount
                                        }));
                                        if (memcount < m) m = memcount;
                                        var users = [];
                                        getusers(m);
                                        function getusers(count) {
                                            redis.spop('meta:roulette:users').then(function (usr) {
                                                users.push(plugged.getUserByID(usr));
                                                if (count - 1 > 0) getusers(count - 1);
                                                else {
                                                    plugged.sendChat(langfile.roulette.lucky_winners);
                                                    users.forEach(function (user) {
                                                        plugged.sendChat(utils.replace(langfile.roulette.winner, {username: user.username}));
                                                    });
                                                    users.forEach(function (user) {
                                                        plugged.moveDJ(user.id, _.random(0, plugged.getWaitlist().length - 1));
                                                    });
                                                    redis.del('meta:roulette:users');
                                                }
                                            });
                                        }
                                    }
                                });
                            }, t * 60 * 1000);
                        } else plugged.sendChat(utils.replace(langfile.error.argument, {
                            username: data.username,
                            cmd: 'Roulette'
                        }));
                    }
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};