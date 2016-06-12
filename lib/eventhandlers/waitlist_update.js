var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var langfile = require('../../langfile');
var addQueue = require('../addqueue');

module.exports = function (oldWaitlist, newWaitlist) {
    oldWaitlist = utils.clone(oldWaitlist);
    newWaitlist = utils.clone(newWaitlist);
    setTimeout(function () {
        Promise.all(plugged.getUsers().map(function (user) {
            console.log(user,utils.wlPosition(user, newWaitlist));
            return redis.hset('user:waitlist:lastposition', user.id, utils.wlPosition(user, newWaitlist));
        })).then(function () {
            return Promise.all(newWaitlist.map(function (id) {
                return redis.exists('user:waitlist:ban:' + id).then(function (ex) {
                    if (ex === 1) {
                        plugged.sendChat(utils.replace(langfile.wlban.remove, {username: plugged.getUserByID(id).username}));
                        plugged.removeDJ(id);
                        story.info('waitlist', utils.userLogString(plugged.getUserByID(id)) + ' joined the waitlist but is banned from the waitlist.');
                        return redis.hdel('user:waitlist:lastposition', id);
                    } else return Promise.resolve();
                });
            }));
        }).then(function () {
            addQueue.wlUpdate(plugged.getWaitlist());
        });
    }, 1000);
};