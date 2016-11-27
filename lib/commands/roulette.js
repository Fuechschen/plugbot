let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['roulette'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                redis.exists('meta:roulette:active').then(exa => {
                    if (exa === 0) {
                        let split = data.message.trim().split(' ');
                        let m = (split.length < 2) ? NaN : parseInt(split[1]);
                        let t = (split.length < 3) ? 2 : parseInt(split[2]);
                        if (!isNaN(t) && !isNaN(m)) {
                            redis.set('meta:roulette:active', 1);
                            plugged.sendChat(utils.replace(langfile.roulette.default, {
                                username: data.username,
                                time: t,
                                moves: m
                            }));
                            setTimeout(() => {
                                //noinspection JSUnresolvedFunction
                                redis.del('meta:roulette:active');
                                //noinspection JSUnresolvedFunction
                                redis.scard('meta:roulette:users').then(memcount => {
                                    if (memcount === 0) {
                                        plugged.sendChat(utils.replace(langfile.roulette.no_joins, {username: data.username}));
                                    } else {
                                        plugged.sendChat(utils.replace(langfile.roulette.started, {
                                            username: data.username,
                                            users: memcount
                                        }));
                                        if (memcount < m) m = memcount;
                                        let users = [];
                                        getusers(m);
                                        function getusers(count) {
                                            //noinspection JSUnresolvedFunction
                                            redis.spop('meta:roulette:users').then(usr => {
                                                users.push(plugged.getUserByID(usr));
                                                if (count - 1 > 0) getusers(count - 1);
                                                else {
                                                    plugged.sendChat(langfile.roulette.lucky_winners);
                                                    users.forEach(user => {
                                                        plugged.sendChat(utils.replace(langfile.roulette.winner, {username: user.username}));
                                                    });
                                                    users.forEach(user => {
                                                        plugged.moveDJ(user.id, _.random(0, plugged.getWaitlist().length - 1));
                                                    });
                                                    //noinspection JSUnresolvedFunction
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