let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['togglecustomcommands', 'togglecc'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                config.customcommands.enabled = !config.customcommands.enabled;
                if (config.customcommands.enabled) plugged.sendChat(utils.replace(langfile.customcommands.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.customcommands.disabled, {username: data.username}), 30);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'customcommands:enabled', (config.state.eventmode ? 1 : 0));
                story.info('customcommands', `${utils.userLogString(data.username, data.id)}: --> ${config.customcommands.enabled.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};