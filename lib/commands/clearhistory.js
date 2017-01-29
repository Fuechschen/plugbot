let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['clearhistory'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                plugged.sendChat(utils.replace(langfile.skip.history.clear, {username: data.username}), 60);
                //noinspection JSCheckFunctionSignatures
                redis.keys('media:history:*').then(keys => {
                    //noinspection JSUnresolvedFunction
                    keys.forEach(key => {
                        //noinspection JSUnresolvedFunction
                        redis.del(key);
                    });
                });
                story.info('clearhistory', utils.userLogString(data.username, data.id));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};