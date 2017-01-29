let story = require('storyboard').mainStory;

const config = require('../load_config');
let redis = require('../db/redis_db');
let utils = require('../utils');
let plugged = require('../client');
const langfile = require('../../langfile');

module.exports = {
    names: ['youtubeblock', 'ytblock'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                config.youtubeGuard.block = !config.youtubeGuard.block;
                if (config.youtubeGuard.block) plugged.sendChat(utils.replace(langfile.youtubeGuard.blockEnabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.youtubeGuard.blockDisabled, {username: data.username}), 60);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'youtubeguard:block:enabled', (config.youtubeGuard.block ? 1 : 0));
                story.info('youtubeblock', `${utils.userLogString(data.username, data.id)}: --> ${config.youtubeGuard.block.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};