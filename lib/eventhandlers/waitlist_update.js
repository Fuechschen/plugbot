var _ = require('underscore');
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
        redis.set('user:waitlist:position:' + user.id, utils.wlPosition(user, waitlist)).then(function () {
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
                redis.smemebers('meta:addqueue').then(function (q) {
                    redis.get('meta:addqueue:user:' + q[0]).then(function (pos) {
                        pos = parseInt(pos);
                        redis.srem('meta:addqueue', q[0]).then(function () {
                            plugged.addToWaitlist(q[0], function (err) {
                                if (!err) {
                                    if (pos !== -1) {
                                        plugged.moveDJ(q[0], pos);
                                    }
                                } else redis.sadd('meta:addqueue', q[0]);
                            });
                        })
                    });
                });
            }
        });
    }
};