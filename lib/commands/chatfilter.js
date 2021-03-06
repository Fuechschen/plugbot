let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['chatfilter'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                config.chatfilter.enabled = !config.chatfilter.enabled;
                if (config.chatfilter.enabled) plugged.sendChat(utils.replace(langfile.chatfilter.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.chatfilter.disabled, {username: data.username}), 30);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'chatfilter:enabled', (config.chatfilter.enabled ? 1 : 0));
                story.info('chatfilter', `${utils.userLogString(data.username, data.id)}: --> ${config.chatfilter.enabled.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};