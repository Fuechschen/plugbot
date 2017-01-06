let story = require('storyboard').mainStory;

let db = require('../db/sql_db');
let redis = require('../db/redis_db');
let plugged = require('../client');
const config = require('../load_config');
const langfile = require('../../langfile');

module.exports = {
    event: plugged.JOINED_ROOM,
    handler: () => {
        story.info(`Joined room ${config.options.room}`);
        //noinspection JSUnresolvedFunction
        redis.hget('meta:options', 'isRestart').then(is => {
            if (is !== null && is === '1') {
                plugged.sendChat(langfile.restart.back_up, 45);
                //noinspection JSUnresolvedFunction
                redis.hdel('meta:options', 'isRestart');
            }
        });
        plugged.getUsers().forEach(user => {
            db.models.User.findOrCreate({
                where: {id: user.id},
                defaults: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    avatar_id: user.avatarID,
                    badge: user.badge
                }
            }).spread(usr => {
                //noinspection JSUnresolvedFunction
                redis.hset('user:roles', user.id, usr.s_role);
                if (!usr.super_user && user.role !== usr.s_role) {
                    if (usr.s_role > 0) plugged.addStaff(user.id, usr.s_role);
                    else plugged.removeStaff(user.id);
                }
                usr.updateAttributes({
                    status: true,
                    username: user.username,
                    role: user.role
                });
            });
        });

        db.models.User.find({where: {id: plugged.getSelf().id}}).then(usr => {
            if (usr) {
                if (usr.s_role > 0) { //noinspection JSUnresolvedFunction
                    redis.hset('user:roles', plugged.getSelf().id, usr.s_role);
                }
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
    }
};