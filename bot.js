var chalk = require('chalk');
var utils = require('./lib/utils.js');
var config = require('./lib/load_config.js');
var storyboard = require('storyboard');
var langfile = require('./langfile.js');
var validator = require('validator');
var _ = require('underscore');
var path = require('path');
var S = require('string');
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
redis.exists('meta:data:staff:active').then(function(ex){
   if(ex === 0) redis.set('meta:data:staff:active', 1);
});

utils.loadConfigfromRedis();

var timeouts = {
    stuck: null,
    tskip: null
};

var commands = require('./lib/commands.js');

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
   db.models.CustomCommand.findAll({where: {status: true}}).then(function(ccs){
       ccs.forEach(function(cc){
           if(cc.senderinfo) redis.set('customcommands:command:senderinfo:' + cc.trigger, cc.message);
           else redis.set('customcommands:command:nosenderinfo:' + cc.trigger, cc.message);
       }) ;
        story.info('meta', 'Loaded ' + ccs.length + ' customcommands.');
    });
    story.info('meta', 'Successfully authed to plug.dj');
    utils.loadCleverbot();
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

plugged.on(plugged.CONN_PART, function(err){
    story.error('Error', 'The connection dropped unexpectedly', {attach: err});
    process.exit(1);
});

plugged.on(plugged.PLUG_UPDATE, function(){
    story.error('Update', 'plug.dj gets an update was therefore closed.');
    process.exit(1);
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

    plugged.on(plugged.FRIEND_JOIN, function (user) {
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
                            if (utils.wlPosition(user) === -1) plugged.addToWaitlist(user.id);
                            plugged.moveDJ(user.id, pos);
                        }
                    });
                }
            });
        }
       db.models.User.find({where: {id: user.id}}).then(function (usr) {
            if (usr !== null && usr !== undefined) {
                if (usr.s_role > 0) redis.set('user:role:save:' + user.id, usr.s_role);
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
    });

    plugged.on(plugged.USER_JOIN, function (user) {
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
                            if (utils.wlPosition(user) === -1) plugged.addToWaitlist(user.id);
                            plugged.moveDJ(user.id, pos);
                        }
                    });
                }
            });
        }
       db.models.User.find({where: {id: user.id}}).then(function (usr) {
            if (usr !== null && usr !== undefined) {
                if (usr.s_role > 0) redis.set('user:role:save:' + user.id, usr.s_role);
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
    });

    plugged.on(plugged.USER_LEAVE, function (user) {
        if (user !== null && user !== undefined) {
            redis.del('user:role:save:' + user.id);
           db.models.User.update({status: false}, {where: {id: user.id}});
            story.info('leave', utils.userLogString(user));
        }
    });

    plugged.on(plugged.CHAT, require('./lib/eventhandlers/chat'));

    plugged.on(plugged.CHAT_MENTION, require('./lib/eventhandlers/chat'));

    plugged.on(plugged.MOD_STAFF, function (data) {
        data = data[0];
        if (data.moderatorID !== plugged.getSelf().id) {
            redis.get('user:role:save:' + data.moderatorID).then(function (perm) {
                perm = parseInt(perm, 10);
                if (perm > 2) {
                    redis.set('user:role:save:' + data.id, data.role);
                   db.models.User.update({s_role: data.role}, {where: {id: data.id}});
                } else {
                    redis.get('user:role:save:' + data.id).then(function (permlvl) {
                        permlvl = parseInt(permlvl, 10);
                        var role = utils.role(permlvl);
                        if (role === plugged.USERROLE.NONE) plugged.removeStaff(data.id);
                        else plugged.addStaff(data.id, role);
                        plugged.sendChat(utils.replace(langfile.setstaff.no_power, {username: data.moderator}), 60);
                    });
                }
            });
            story.info('promote', utils.userLogString(data.moderator, data.moderatorID) + ': ' + utils.userLogString(data.username, data.id) + ' --> ' + utils.rolename(data.role));
        }
    });

    plugged.on(plugged.MOD_BAN, function (data) {
        if (data.moderatorID !== plugged.getSelf().id) {
            redis.get('user:role:save:' + data.moderatorID).then(function (perm) {
                perm = parseInt(perm, 10);
                if (perm < 2 && data.duration === plugged.BANDURATION.PERMA) {
                    plugged.sendChat(utils.replace(langfile.ban.no_staff_ban, {username: data.moderator}), 60);
                    plugged.unbanUser(data.id);
                    plugged.banUser(data.id, plugged.BANDURATION.DAY, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                    plugged.removeStaff(data.moderatorID);
                } else {
                    redis.get('user:role:save:' + data.id).then(function (plvl) {
                        plvl = parseInt(plvl, 10);
                        if (plvl > 1) {
                            plugged.sendChat(utils.replace(langfile.ban.staff_ban, {username: data.moderator}), 60);
                            plugged.unbanUser(data.id);
                            plugged.removeStaff(data.moderatorID);
                        }
                    });
                }
            });
            story.info('ban', utils.userLogString(data.moderator, data.moderatorID) + ': ' + data.username + ' --> ' + data.duration);
        }
    });

    plugged.on(plugged.VOTE, function () {
        var score = {woots: 0, mehs: 0, userCount: plugged.getUsers().length};
        plugged.getVotes(false).forEach(function (vote) {
            if (vote.direction === 1) score.woots = score.woots + 1;
            else if (vote.direction === -1) score.mehs = score.mehs - 1;
        });
        if (utils.checkVoteSkip(score) && config.voteskip.enabled && !config.state.eventmode) {
            plugged.sendChat(langfile.skip.vote.skip);
            plugged.skipDJ(plugged.getCurrentDJ().id);
            setTimeout(function () {
                plugged.sendChat(utils.replace(langfile.skip.vote.default, {
                    username: plugged.getCurrentDJ(),
                    song: utils.mediatitle(plugged.getCurrentMedia())
                }), 60);
            }, 4 * 1000);
        }
    });

    plugged.on(plugged.MOD_SKIP, function (data) {
        if (data.mi !== plugged.getSelf().id) {
            story.info('skip', utils.userLogString(data.m, data.mi));
            redis.get('user:role:save:' + data.mi).then(function (perm) {
                perm = parseInt(perm, 10);
                if(perm < 2){
                    plugged.sendChat(utils.replace(langfile.skip.no_mod_skip, {username: data.m}));
                    plugged.removeStaff(data.mi);
                }
            });
        }
    });

    plugged.on(plugged.MOD_ADD_DJ, function (data) {
        if (data.mi !== plugged.getSelf.id) {
            story.info('Add', utils.userLogString(data.m, data.mi) + ' added ' + utils.userLogString(data.username, data.id));
        }
    });

    plugged.on(plugged.WAITLIST_UPDATE, function (waitlist) {
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
                }
            });
        });
        if(waitlist.length < 50){
            redis.exists('meta:addqueue').then(function(ex){
                if(ex === 1){
                    redis.smemebers('meta:addqueue').then(function(q){
                        redis.get('meta:addqueue:user::' + q[0]).then(function(pos){
                            pos = parseInt(pos);
                           redis.srem('meta:addqueue', q[0]).then(function(){
                               plugged.addToWaitlist(q[0], function(err){
                                  if(!err){
                                      if(pos !== -1){
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
    });

    plugged.on(plugged.MAINTENANCE_MODE, function(){
       story.info('maintenance', 'Plug.dj went into maintenance mode, you may have to restart the bot.');
        throw new Error('Maintenance Mode!');
    });
    
    plugged.on(plugged.CHAT_COMMAND, function (data) {
        if (data.id !== plugged.getSelf().id) {
            if (config.state.lockdown) {
                redis.get('user:role:save:' + data.id).then(function (perm) {
                    perm = parseInt(perm, 10);
                    if (perm < 2) plugged.removeChatMessage(data.cid);
                });
            } else if(config.options.disable_emote){
                redis.get('user:role:save:' + data.id).then(function(perm){
                   perm = parseInt(perm, 10);
                    if(perm < 1){
                        plugged.deleteMessage(data.cid);
                    }
                });
            } else {
                redis.exists('user:mute:' + data.id).then(function (exm) {
                    if (exm === 1) {
                        plugged.removeChatMessage(data.cid);
                        if (!S(data.message).startsWith(config.options.command_prefix)) {
                            redis.incr('user:mute:' + data.id + ':violation').then(function () {
                                redis.get('user:mute:' + data.id + ':violation').then(function (val) {
                                    if (parseInt(val, 10) > config.chatfilter.spam.mute_violation) {
                                        plugged.sendChat(utils.replace(langfile.chatfilter.spam.hard_mute, {username: data.username}), 60);
                                        plugged.muteUser(data.id, plugged.MUTEDURATION.LONG, plugged.BANREASON.SPAMMING);
                                    }
                                });
                            });
                        }
                    }
                    else if (config.chatfilter.enabled) {
                        redis.get('user:role:save:' + data.id).then(function (perm) {
                            perm = parseInt(perm, 10);
                            if (perm < 1) {
                                redis.incr('user:chat:spam:' + data.id + ':points');
                                redis.get('user:chat:spam:' + data.id + ':lastmsg').then(function (lastmsg) {
                                    if (data.message === lastmsg) {
                                        plugged.removeChatMessage(data.cid);
                                        redis.incrby('user:chat:spam:' + data.id + ':points', 10);
                                        redis.expire('user:chat:spam:' + data.id + ':lastmsg', 3600);
                                    } else {
                                        redis.set('user:chat:spam:' + data.id + ':lastmsg', data.message).then(function () {
                                            redis.expire('user:chat:spam:' + data.id + ':lastmsg', 3600);
                                        });
                                    }
                                    redis.get('user:chat:spam:' + data.id + ':points').then(function (points) {
                                        if (parseInt(points, 10) >= config.chatfilter.spam.points) {
                                            redis.incr('user:chat:spam:' + data.id + ':warns');
                                            plugged.removeChatMessage(data.cid);
                                            plugged.sendChat(utils.replace(langfile.chatfilter.spam.warn, {username: data.username}), 60);
                                        }
                                        redis.get('user:chat:spam:' + data.id + ':warns').then(function (warns) {
                                            if (parseInt(warns, 10) > config.chatfilter.spam.warns) {
                                                plugged.sendChat(utils.replace(langfile.chatfilter.spam.mute, {username: data.username}), 60);
                                                redis.set('user:mute:' + data.id, 1).then(function () {
                                                    redis.set('user:mute:' + data.id + ':violation', 0);
                                                    redis.expire('user:mute:' + data.id, config.chatfilter.spam.mute_duration);
                                                });
                                            } else {
                                                if (utils.contains(data.message, config.chatfilter.words.blacklist)) {
                                                    plugged.removeChatMessage(data.cid);
                                                    redis.incrby('user:chat:spam:' + data.id + ':points', 10);
                                                } else if (utils.containsplug(data.message)) {
                                                    plugged.removeChatMessage(data.cid);
                                                    redis.incrby('user:chat:spam:' + data.id + ':points', 20);
                                                }
                                            }
                                        });
                                    });
                                });
                            }
                        });
                    }
                });
            }
            if(!S(data.message).contains('[AFK]')){
                redis.set('user:afk:' + data.id, 1).then(function () {
                    redis.expire('user:afk:' + data.id, config.afk.time);
                    redis.set('user:afk:' + data.id + ':removes', 0);
                });
            }
        }
        story.info('chat', data.username + '[' + data.id + ']: ' + data.message);
    });
});