var story = require('storyboard').mainStory;

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');

module.exports = function (waitlist) {
    waitlist = utils.clone(waitlist);
    plugged.getUsers().forEach(function (user) {
        redis.set('user:waitlist:position' + user.id, utils.wlPosition(user, waitlist)).then(function () {
            redis.expire('user:waitlist:position:' + user.id, config.afk.time);
        });
    });
    waitlist.forEach(function (id) {
        redis.exists('user:waitlist:ban:' + id).then(function (ex) {
            if (ex === 1) {
                plugged.sendChat(utils.replace(langfile.wlban.remove, {username: plugged.getUserByID(id).username}));
                plugged.removeDJ(id);
                story.info('waitlist', utils.userLogString(plugged.getUserByID(id)) + ' joined the waitlist but is banned from the waitlist.');
            }
        });
    });
    if (waitlist.length < 50) {
        redis.exists('meta:addqueue').then(function (ex) {
            if (ex === 1) {
                redis.zrange('meta:addqueue', 0, 0, 'WITHSCORES').then(function (result) {
                    var pos = parseInt(result[1]);
                    var uid = parseInt(result[0]);
                    if (plugged.getUserByID(uid) !== undefined) {
                        plugged.sendChat(utils.replace(langfile.addqueue.default, {username: plugged.getUserByID(uid).username}));
                        plugged.addToWaitlist(uid, function (err) {
                            if (!err && pos < 50) {
                                plugged.moveDJ(uid, pos);
                                redis.zrem('meta:addqueue', uid);
                            }
                        })
                    }
                });
            }
        });
    }
};