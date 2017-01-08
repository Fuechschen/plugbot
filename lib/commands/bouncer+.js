let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['bouncer+'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                config.options.bouncerPlus = !config.options.bouncerPlus;
                if (config.options.bouncerPlus) plugged.sendChat(utils.replace(langfile.bouncerPlus.enabled, {username: data.username}), 45);
                else plugged.sendChat(utils.replace(langfile.bouncerPlus.disabled, {username: data.username}), 45);
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'options:bouncer_plus', (config.options.bouncerPlus ? 1 : 0));
                story.info('bouncer+', `${utils.userLogString(data.username, data.id)}: --> ${config.options.bouncerPlus.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};