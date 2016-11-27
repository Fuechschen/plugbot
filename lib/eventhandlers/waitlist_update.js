var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var langfile = require('../../langfile');
var addQueue = require('../addqueue');
var wsUpdate = require('../../web/index').wsGet('waitlist');

module.exports = {
    event: plugged.WAITLIST_UPDATE,
    handler: function (oldWaitlist, newWaitlist) {
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