let story = require('storyboard').mainStory;
let Promise = require('bluebird');

let redis = require('../db/redis_db');
let db = require('../db/sql_db');
let utils = require('../utils');
let plugged = require('../client');
const langfile = require('../../langfile');
let addQueue = require('../addqueue');
let wsUpdate = require('../../web/index').wsGet('waitlist');

module.exports = {
    event: plugged.WAITLIST_UPDATE,
    handler: (oldWaitlist, newWaitlist) => {
        //todo examine who was removed
        //oldWaitlist = utils.clone(oldWaitlist);
        newWaitlist = utils.clone(newWaitlist);
        setTimeout(() => {
            Promise.all(plugged.getUsers().map(user => //noinspection JSUnresolvedFunction
                redis.hset('user:waitlist:lastposition', user.id, utils.wlPosition(user, newWaitlist)))).then(() => Promise.all(newWaitlist.map(id => redis.exists(`user:waitlist:ban:${id}`).then(ex => {
                if (ex === 1) {
                    plugged.sendChat(utils.replace(langfile.wlban.remove, {username: plugged.getUserByID(id).username}));
                    plugged.removeDJ(id);
                    story.info('waitlist', `${utils.userLogString(plugged.getUserByID(id))} joined the waitlist but is banned from the waitlist.`);
                    //noinspection JSUnresolvedFunction
                    return redis.hdel('user:waitlist:lastposition', id);
                } else return Promise.resolve();
            })))).then(() => {
                addQueue.wlUpdate(plugged.getWaitlist());
            });
        }, 1000);
        wsUpdate(newWaitlist.map(id => ({
            id,
            n: plugged.getUserByID(id).username
        })));
    }
};