let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['soundcloudguard', 'scguard'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                config.soundcloudGuard.enabled = !config.soundcloudGuard.enabled;
                if (config.soundcloudGuard.enabled) plugged.sendChat(utils.replace(langfile.soundcloudGuard.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.soundcloudGuard.disabled, {username: data.username}), 60);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'soundcloudguard:enabled', (config.soundcloudGuard.enabled ? 1 : 0));
                story.info('soundcloudguard', `${utils.userLogString(data.username, data.id)}: --> ${config.soundcloudGuard.enabled.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};