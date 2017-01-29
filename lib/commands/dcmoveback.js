let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['dcmoveback'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                config.dcmoveback.enabled = !config.dcmoveback.enabled;
                if (config.dcmoveback.enabled) plugged.sendChat(utils.replace(langfile.dcmoveback.enabled, {username: data.username}));
                else plugged.sendChat(utils.replace(langfile.dcmoveback.disabled, {username: data.username}));
                redis.set('meta:config', 'options:dcmoveback', (config.dcmoveback.enabled ? 1 : 0));
                story.info('dcmoveback', `${utils.userLogString(data.username, data.id)}: --> ${config.dcmoveback.enabled.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};