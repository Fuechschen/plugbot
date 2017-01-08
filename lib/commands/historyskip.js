let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['historyskip'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.history.skipenabled = !config.history.skipenabled;
                    if (config.history.skipenabled) plugged.sendChat(utils.replace(langfile.skip.history.enabled, {username: data.username}), 30);
                    else plugged.sendChat(utils.replace(langfile.skip.history.disabled, {username: data.username}), 30);
                    //noinspection JSUnresolvedFunction
                    redis.hset('meta:config', 'history:skipenabled', (config.history.skipenabled ? 1 : 0));
                    story.info('historyskip', `${utils.userLogString(data.username, data.id)}: --> ${config.history.skipenabled.toString()}`);
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Historyskip'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};