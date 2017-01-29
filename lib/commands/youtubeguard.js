let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['youtubeguard', 'ytguard'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                config.youtubeGuard.enabled = !config.youtubeGuard.enabled;
                if (config.youtubeGuard.enabled) plugged.sendChat(utils.replace(langfile.youtubeGuard.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.youtubeGuard.disabled, {username: data.username}), 60);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'youtubeguard:enabled', (config.youtubeGuard.enabled ? 1 : 0));
                story.info('youtubeguard', `${utils.userLogString(data.username, data.id)}: --> ${config.youtubeGuard.enabled.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};