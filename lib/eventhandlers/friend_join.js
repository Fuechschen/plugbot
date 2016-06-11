var story = require('storyboard').mainStory;
var request = require('request');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');

module.exports = function (user) {
    redis.set('user:chat:spam:' + user.id + ':points', 0);
    redis.exists('user:chat:spam:' + user.id + ':warns').then(function (ex) {
        if (ex === 0) redis.set('user:chat:spam:' + user.id + ':warns', 0);
    });
    redis.set('user:afk:' + user.id, 1).then(function () {
        redis.expire('user:afk:' + user.id, config.afk.time);
    });
    if (config.options.dcmoveback && !config.state.eventmode) {
        redis.exists('user:waitlist:position:' + user.id).then(function (ex) {
            if (ex === 1) {
                redis.get('user:waitlist:position:' + user.id).then(function (pos) {
                    pos = parseInt(pos, 10);
                    if (pos !== -1 && pos <= utils.wlPosition(user)) {
                        if ((plugged.getWaitlist() === undefined || plugged.getWaitlist().length < 50)) {
                            if (utils.wlPosition(user) === -1) plugged.addToWaitlist(user.id);
                            plugged.moveDJ(user.id, pos);
                        } else {
                            //todo addqueue
                        }
                    }
                });
            }
        });
    }
    db.models.User.find({where: {id: user.id}}).then(function (usr) {
        if (usr !== null && usr !== undefined) {
            if (usr.s_role > 0) redis.hset('user:roles' ,user.id, usr.s_role);
            if (!usr.super_user && user.role !== usr.s_role) {
                if (usr.s_role > 0) plugged.addStaff(user.id, usr.s_role);
                else plugged.removeStaff(user.id);
            }
            usr.updateAttributes({status: true, slug: user.slug, username: user.username});
            if (config.options.welcome.old) setTimeout(function () {
                plugged.sendChat(utils.replace(langfile.welcome.old, {username: user.username}), 60);
            }, 6 * 1000)
        } else {
            if (config.options.welcome.new) setTimeout(function () {
                plugged.sendChat(utils.replace(langfile.welcome.new, {username: user.username}), 60);
            }, 6 * 1000);
            db.models.User.create({
                id: user.id,
                username: user.username,
                slug: user.slug,
                role: user.role,
                global_role: user.gRole,
                badge: user.badge,
                language: user.language,
                avatar_id: user.avatarID,
                blurb: user.blurb
            });
        }
    });
    story.info('join', utils.userLogString(user));
};