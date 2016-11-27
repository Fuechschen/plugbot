let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['unlock'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if ((config.options.bouncer_plus ? (perm > 1) : (perm > 2))) {
                plugged.sendChat(utils.replace(langfile.bp_actions.unlock, {username: data.username}), 70);
                plugged.setLock(false, false);
                story.info('unlock', utils.userLogString(data.username, data.id));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};