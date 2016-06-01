var utils = require('./lib/utils.js');
var config = require('./lib/load_config.js');
var storyboard = require('storyboard');
var langfile = require('./langfile.js');
var validator = require('validator');
var _ = require('underscore');
var path = require('path');
var moment = require('moment');
var request = require('request');

var plugged = require('./lib/client');
var redis = require('./lib/db/redis_db');
var db = require('./lib/db/sql_db');

var story = storyboard.mainStory;
storyboard.config({filter: '*:' + config.options.loglevel});

moment.locale(langfile.moment_locale);


redis.keys('user:role:save:*').then(function (keys) {
    keys.forEach(function (key) {
        redis.del(key);
    });
});
redis.exists('meta:data:staff:active').then(function (ex) {
    if (ex === 0) redis.set('meta:data:staff:active', 1);
});

//todo rework with cron jobs
var workers = require('./lib/workers.js');
plugged.on(plugged.LOGIN_SUCCESS, function () {
    plugged.cacheChat(true);
    plugged.connect(config.options.room);
    plugged.getAuthToken(function (err, token) {
        if (!err) {
            redis.set('meta:auth:save:jar', JSON.stringify(plugged.getJar())).then(function () {
                redis.set('meta:auth:save:token', token).then(function () {
                    redis.expire('meta:auth:save:token', 604800);
                });
                redis.expire('meta:auth:save:jar', 604800);
            });
        }
    });
    redis.keys('media:blacklist:*').then(function (keys) {
        keys.forEach(function (key) {
            redis.del(key);
        });
        db.models.Song.findAll({where: {isBanned: true}}).then(function (songs) {
            songs.forEach(function (song) {
                redis.set('media:blacklist:' + song.format + ':' + song.cid, ((song.ban_reason !== undefined && song.ban_reason !== null) ? song.ban_reason : 1));
            });
            story.info('meta', 'Loaded blacklist with ' + songs.length + ' entries.');
        });
    });
    db.models.CustomCommand.findAll({where: {status: true}}).then(function (ccs) {
        ccs.forEach(function (cc) {
            if (cc.senderinfo) redis.set('customcommands:command:senderinfo:' + cc.trigger, cc.message);
            else redis.set('customcommands:command:nosenderinfo:' + cc.trigger, cc.message);
        });
        story.info('meta', 'Loaded ' + ccs.length + ' customcommands.');
    });
    story.info('meta', 'Successfully authed to plug.dj');
});

plugged.on(plugged.CONN_ERROR, function (err) {
    story.error('Error', 'Error while connecting to plug.dj.', {attach: err});
    process.exit(1);
});

plugged.on(plugged.LOGIN_ERROR, function (err) {
    story.error('Error', 'Error while logging in.', {attach: err});
    process.exit(1);
});

plugged.on(plugged.PLUG_ERROR, function (err) {
    story.error('Error', 'plug.dj encountered an error.', {attach: err});
    process.exit(1);
});

plugged.on(plugged.CONN_PART, function (err) {
    story.error('Error', 'The connection dropped unexpectedly', {attach: err});
    process.exit(1);
});

plugged.on(plugged.PLUG_UPDATE, function () {
    story.error('Update', 'plug.dj gets an update was therefore closed.');
    process.exit(1);
});

plugged.on(plugged.MAINTENANCE_MODE, function () {
    story.info('maintenance', 'Plug.dj went into maintenance mode, you may have to restart the bot.');
    throw new Error('Maintenance Mode!');
});

plugged.on(plugged.JOINED_ROOM, function () {
    story.info('meta', 'Joined room ' + config.options.room);
    plugged.getUsers().forEach(function (user) {
        redis.set('user:chat:spam:' + user.id + ':points', 0);
        db.models.User.find({where: {id: user.id}}).then(function (usr) {
            if (usr !== null && usr !== undefined) {
                if (usr.s_role > 0) redis.set('user:role:save:' + user.id, usr.s_role);
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
            if (usr.s_role > 0) redis.set('user:role:save:' + plugged.getSelf().id, usr.s_role);
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

    plugged.on(plugged.ADVANCE, require('./lib/eventhandlers/advance'));

    plugged.on(plugged.FRIEND_JOIN, require('./lib/eventhandlers/friend_join'));

    plugged.on(plugged.USER_JOIN, require('./lib/eventhandlers/user_join'));

    plugged.on(plugged.USER_LEAVE, require('./lib/eventhandlers/user_leave'));

    plugged.on(plugged.CHAT, require('./lib/eventhandlers/chat'));

    plugged.on(plugged.CHAT_MENTION, require('./lib/eventhandlers/chat'));

    plugged.on(plugged.MOD_STAFF, require('./lib/eventhandlers/mod_staff'));

    plugged.on(plugged.MOD_BAN, require('./lib/eventhandlers/mod_ban'));

    plugged.on(plugged.VOTE, require('./lib/eventhandlers/vote'));

    plugged.on(plugged.MOD_SKIP, require('./lib/eventhandlers/mod_skip'));

    plugged.on(plugged.MOD_ADD_DJ, require('./lib/eventhandlers/mod_add_dj'));

    plugged.on(plugged.WAITLIST_UPDATE, require('./lib/eventhandlers/waitlist_update'));

    plugged.on(plugged.CHAT_COMMAND, require('./lib/eventhandlers/chat_command'));
});