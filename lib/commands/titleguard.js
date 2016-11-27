let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['titleguard'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.titleguard.enabled = !config.titleguard.enabled;
                if (config.titleguard.enabled) plugged.sendChat(utils.replace(langfile.titleguard.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.titleguard.disabled, {username: data.username}), 60);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'titleguard:enabled', (config.youtubeGuard.enabled ? 1 : 0));
                story.info('titleguard', `${utils.userLogString(data.username, data.id)}: --> ${config.titleguard.enabled.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};