let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['timeguard'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.timeguard.enabled = !config.timeguard.enabled;
                    if (config.timeguard.enabled) plugged.sendChat(utils.replace(langfile.skip.timeguard.enabled, {username: data.username}), 60);
                    else plugged.sendChat(utils.replace(langfile.skip.timeguard.disabled, {username: data.username}), 60);
                    //noinspection JSUnresolvedFunction
                    redis.hset('meta:config', 'timeguard:enabled', (config.timeguard.enabled ? 1 : 0));
                    story.info('timeguard', `${utils.userLogString(data.username, data.id)}: --> ${config.timeguard.enabled.toString()}`);
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Timeguard'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};