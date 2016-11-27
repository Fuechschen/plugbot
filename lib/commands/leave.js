let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['leave'],
    enabled: true,
    handler: (data)=> {
        redis.exists('meta:roulette:active').then(ex => {
            if (ex === 1) {
                //noinspection JSUnresolvedFunction
                redis.sismember('meta:roulette:users', data.id).then(mem => {
                    if (mem === 1) { //noinspection JSUnresolvedFunction
                        redis.srem('meta:roulette:users', data.id).then(() => {
                            plugged.sendChat(utils.replace(langfile.roulette.leave, {username: data.username}));
                        });
                    }
                    else plugged.sendChat(utils.replace(langfile.roulette.not_joined, {username: data.username}));
                });
            } else plugged.sendChat(utils.replace(langfile.roulette.no_roulette, {username: data.username}));
        });
        plugged.removeChatMessage(data.cid);
    }
};