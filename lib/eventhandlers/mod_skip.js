let story = require('storyboard').mainStory;

let redis = require('../db/redis_db');
let utils = require('../utils');
let plugged = require('../client');
const langfile = require('../../langfile');
let wsSkip = require('../../web/index').wsGet('skip');

module.exports = {
    event: plugged.MOD_SKIP,
    handler: (data)=> {
        if (data.moderatorID !== plugged.getSelf().id) {
            redis.set('meta:state:skipable', 1, 'EX', 2);
            story.info('skip', utils.userLogString(data.moderator, data.moderatorID));
            //noinspection JSUnresolvedletiable
            redis.get(`user:role:save:${data.mi}`).then(perm => {
                perm = parseInt(perm, 10);
                if (perm < 2) {
                    plugged.sendChat(utils.replace(langfile.skip.no_mod_skip, {username: data.moderator}));
                    plugged.removeStaff(data.moderatorID);
                }
            });
        }
        wsSkip({m: {id: data.moderatorID, n: data.moderator}});
    }
};