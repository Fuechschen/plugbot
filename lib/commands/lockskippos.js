let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['lockskippos', 'lspos'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                let split = data.message.trim().split(' ');
                if (split.length === 2) {
                    let pos = parseInt(split[1]);
                    if (!isNaN(pos) && pos > 0 && pos < 51) {
                        config.lockskip.movePos = pos;
                        plugged.sendChat(utils.replace(langfile.skip.lockskippos, {
                            username: data.username,
                            pos
                        }), 30);
                        story.info('locksippos', `${utils.userLogString(data.username, data.id)} set Lockskippos to ${pos}`);
                        //noinspection JSUnresolvedFunction
                        redis.hset('meta:config', 'lockskip:move_pos', pos);
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'LockSkipPos'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'LockSkipPos'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};