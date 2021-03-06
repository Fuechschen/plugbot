let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['lockdown'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                config.state.lockdown = !config.state.lockdown;
                if (config.state.lockdown) plugged.sendChat(utils.replace(langfile.lockdown.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.lockdown.disabled, {username: data.username}), 60);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'state:lockdown', (config.state.lockdown ? 1 : 0));
                story.info('lockdown', `${utils.userLogString(data.username, data.id)}: --> ${config.state.lockdown}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};