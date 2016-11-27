let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['join'],
    enabled: true,
    handler: (data)=> {
        redis.exists('meta:roulette:active').then(ex => {
            if (ex === 1) {
                //noinspection JSUnresolvedFunction
                redis.sismember('meta:roulette:users', data.id).then(mem => {
                    if (mem === 0) { //noinspection JSUnresolvedFunction
                        redis.sadd('meta:roulette:users', data.id).then(() => {
                            plugged.sendChat(utils.replace(langfile.roulette.join, {username: data.username}));
                        });
                    }
                    else plugged.sendChat(utils.replace(langfile.roulette.already_joined, {username: data.username}));
                });
            } else plugged.sendChat(utils.replace(langfile.roulette.no_roulette, {username: data.username}));
        });
        plugged.removeChatMessage(data.cid);
    }
};