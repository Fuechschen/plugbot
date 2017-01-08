let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['voteskip'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.voteskip.enabled = !config.voteskip.enabled;
                    if (config.voteskip.enabled) plugged.sendChat(utils.replace(langfile.skip.vote.enabled, {username: data.username}), 30);
                    else plugged.sendChat(utils.replace(langfile.skip.vote.disabled, {username: data.username}), 30);
                    //noinspection JSUnresolvedFunction
                    redis.hset('meta:config','voteskip:enabled', (config.voteskip.enabled ? 1 : 0));
                    story.info('voteskip', `${utils.userLogString(data.username, data.id)}: --> ${config.voteskip.enabled.toString()}`);
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Voteskip'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};