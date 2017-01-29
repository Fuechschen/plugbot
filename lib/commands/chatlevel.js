let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names:['chatlevel', 'chatlvl', 'clvl'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                let split = data.message.trim().split(' ');
                if (split.length === 2) {
                    let lvl = parseInt(split[1]);
                    if (!isNaN(lvl) && [1, 2, 3].includes(lvl)) {
                        plugged.sendChat(utils.replace(langfile.chatlevel.default, {username: data.username}));
                        //noinspection JSUnresolvedFunction
                        plugged.setMinChatLevel(lvl);
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'ChatLevel'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'ChatLevel'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};