let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['clear', 'clearwl'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if ((config.options.bouncerPlus ? (perm > 1) : (perm > 2))) {
                plugged.sendChat(utils.replace(langfile.bp_actions.clear, {username: data.username}), 70);
                plugged.setLock(true, true);
                story.info('clear', utils.userLogString(data.username, data.id));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};