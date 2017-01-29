let story = require('storyboard').mainStory;

const config = require('../load_config');
let redis = require('../db/redis_db');
let utils = require('../utils');
let plugged = require('../client');
const langfile = require('../../langfile');

module.exports = {
    names: ['soundcloudblock', 'scblock'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                config.soundcloudGuard.block = !config.soundcloudGuard.block;
                if (config.soundcloudGuard.block) plugged.sendChat(utils.replace(langfile.soundcloudGuard.blockEnabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.soundcloudGuard.blockDisabled, {username: data.username}), 60);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'soundcloudguard:block:enabled', (config.soundcloudGuard.block ? 1 : 0));
                story.info('soundcloudblock', `${utils.userLogString(data.username, data.id)}: --> ${config.soundcloudGuard.block.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};