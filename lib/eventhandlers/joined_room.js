var story = require('storyboard').mainStory;

var db = require('../db/sql_db');
var redis = require('../db/redis_db');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');

module.exports = function () {
    story.info('Joined room ' + config.options.room);
    redis.hget('meta:options', 'isRestart').then(function (is) {
        if (is !== null && is === '1') {
            plugged.sendChat(langfile.restart.back_up, 45);
            redis.hdel('meta:options', 'isRestart');
        }
    });
    plugged.getUsers().forEach(function (user) {
        redis.set('user:chat:spam:' + user.id + ':points', 0);
        db.models.User.find({where: {id: user.id}}).then(function (usr) {
            if (usr !== null && usr !== undefined) {
                if (usr.s_role > 0) redis.hset('user:roles', user.id, usr.s_role);
                if (!usr.super_user && user.role !== usr.s_role) {
                    if (usr.s_role > 0) plugged.addStaff(user.id, usr.s_role);
                    else plugged.removeStaff(user.id);
                }
                usr.updateAttributes({
                    status: true,
                    username: user.username,
                    role: user.role
                });
            } else {
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
    });

    db.models.User.find({where: {id: plugged.getSelf().id}}).then(function (usr) {
        if (usr !== null && usr !== undefined) {
            if (usr.s_role > 0) redis.hset('user:roles', plugged.getSelf().id, usr.s_role);
            usr.updateAttributes({status: true});
        } else {
            db.models.User.create({
                id: plugged.getSelf().id,
                username: plugged.getSelf().username,
                slug: plugged.getSelf().slug,
                role: plugged.getSelf().role,
                s_role: plugged.getSelf().role,
                global_role: plugged.getSelf().gRole,
                badge: plugged.getSelf().badge,
                language: plugged.getSelf().language,
                avatar_id: plugged.getSelf().avatarID,
                blurb: plugged.getSelf().blurb
            });
        }
    });

    //todo rework with cron jobs
    var workers = require('../workers.js');
};