let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['toggleafk'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                config.afk.enabled = !config.afk.enabled;
                if (config.afk.enabled) plugged.sendChat(utils.replace(langfile.afk.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.afk.disabled, {username: data.username}), 30);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'afk:enabled', (config.afk.enabled ? 1 : 0));
                story.info('afk', `${utils.userLogString(data.username, data.id)}: --> ${config.afk.enabled.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};