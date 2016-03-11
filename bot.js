chalk = require('chalk');
utils = require('./utils.js');
config = require('./load_config.js');
story = require('./logger.js');
langfile = require('./langfile.js');
_ = require('underscore');
path = require('path');
S = require('string');
moment = require('moment');
request = require('request');
var Plugged = require('plugged');
var Sequelize = require('sequelize');
var IoRedis = require('ioredis');


sequelize = new Sequelize(config.sequelize.database, config.sequelize.username, config.sequelize.password, config.sequelize.options);
models = {
    User: sequelize.import(path.join(__dirname, 'models', 'User')),
    Play: sequelize.import(path.join(__dirname, 'models', 'Play')),
    Song: sequelize.import(path.join(__dirname, 'models', 'Song'))
};
models.Play.belongsTo(models.Song);
models.Song.hasMany(models.Play);
models.Play.belongsTo(models.User);
models.User.hasMany(models.Play);
sequelize.sync();

moment.locale(langfile.moment_locale);

redis = new IoRedis(config.redis);
redis.keys('user:role:save:*').then(function (keys) {
    keys.forEach(function (key) {
        redis.del(key);
    });
});

utils.loadConfigfromRedis();

timeouts = {
    stuck: null,
    tskip: null
};
plugged = new Plugged();
/*redis.get('meta:auth:save:token').then(function (token) {
 redis.get('meta:auth:save:jar').then(function (jar) {
 if (jar !== null && token !== null) {
 plugged.setJar(JSON.parse(jar));
 } else {
 token = undefined;
 }*/
plugged.login(config.login);//, token);
//    });
//});
commands = require('./commands.js');
workers = require('./workers.js');
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
        models.Song.findAll({where: {isBanned: true}}).then(function (songs) {
            songs.forEach(function (song) {
                redis.set('media:blacklist:' + song.format + ':' + song.cid, ((song.ban_reason !== undefined && song.ban_reason !== null) ? song.ban_reason : 1));
            });
            story.info('meta', 'Loaded blacklist with ' + songs.length + ' entries.');
        });
    });
    story.info('meta', 'Successfully authed to plug.dj');
    utils.loadCleverbot();
});

plugged.on(plugged.CONN_ERROR, function (err) {
    story.error('Error', 'Error while connecting to plug.dj.', {attach: err});
});

plugged.on(plugged.LOGIN_ERROR, function (err) {
    story.error('Error', 'Error while logging in.', {attach: err});
});

plugged.on(plugged.PLUG_ERROR, function (err) {
    story.error('Error', 'plug.dj encountered an error.', {attach: err});
});

plugged.on(plugged.JOINED_ROOM, function () {
    story.info('meta', 'Joined room ' + config.options.room);
    plugged.getUsers().forEach(function (user) {
        redis.set('user:chat:spam:' + user.id + ':points', 0);
        models.User.find({where: {id: user.id}}).then(function (usr) {
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
                models.User.create({
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

    models.User.find({where: {id: plugged.getSelf().id}}).then(function (usr) {
        if (usr !== null && usr !== undefined) {
            if (usr.s_role > 0) redis.set('user:role:save:' + plugged.getSelf().id, usr.s_role);
            usr.updateAttributes({status: true});
        } else {
            models.User.create({
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

    plugged.on(plugged.ADVANCE, function (booth, now, prev) {
        booth = utils.clone(booth);
        now = utils.clone(now);
        prev = utils.clone(prev);
        if (booth.dj !== undefined) {
            redis.exists('media:blacklist:' + now.media.format + ':' + now.media.cid).then(function (exb) {
                if (exb === 1 && plugged.getCurrentMedia().id === now.media.id) {
                    redis.get('media:blacklist:' + now.media.format + ':' + now.media.cid).then(function (track) {
                        plugged.sendChat(langfile.blacklist.skip_first);
                        plugged.skipDJ(booth.dj, now.historyID);
                        setTimeout(function () {
                            if (track !== '1') {
                                plugged.sendChat(utils.replace(langfile.blacklist.skip_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title),
                                    reason: track
                                }), 120);
                            } else {
                                plugged.sendChat(utils.replace(langfile.blacklist.skip, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title)
                                }), 120);
                            }
                        }, 4 * 1000);
                    });
                } else {
                    redis.exists('media:history:' + now.media.format + ':' + now.media.cid).then(function (exh) {
                        if (exh === 1 && config.history.skipenabled && !config.state.eventmode && plugged.getCurrentMedia().id === now.media.id) {
                            plugged.skipDJ(booth.dj, now.historyID);
                            redis.ttl('media:history:' + now.media.format + ':' + now.media.cid).then(function (ttl) {
                                plugged.sendChat(langfile.skip.history.skip);
                                plugged.skipDJ(booth.dj, now.historyID);
                                setTimeout(function () {
                                    plugged.sendChat(utils.replace(langfile.skip.history.default, {
                                        username: plugged.getUserByID(booth.dj).username,
                                        song: utils.songtitle(now.media.author, now.media.title),
                                        time: moment().subtract((config.history.time * 60) - ttl, 'seconds').fromNow()
                                    }));
                                }, 4 * 1000);
                            });
                        } else if (config.timeguard.enabled && now.media.duration >= config.timeguard.time && !config.state.eventmode && plugged.getCurrentMedia().id === now.media.id) {
                            plugged.sendChat(langfile.skip.timeguard.skip);
                            plugged.skipDJ(booth.dj);
                            setTimeout(function () {
                                plugged.sendChat(utils.replace(langfile.skip.timeguard.default, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title),
                                    time: config.timeguard.time
                                }), 60);
                            }, 4 * 1000);
                        } else if (config.youtubeGuard.enabled && now.media.format === 1 && plugged.getCurrentMedia().id === now.media.id) {
                            request.get('https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=' + now.media.cid + '&key=' + config.apiKeys.youtube, function (error, resp, body) {
                                if (!error && resp.statusCode === 200) {
                                    body = JSON.parse(body);
                                    if (body.items.length > 0) {
                                        if (body.items[0] !== undefined) {
                                            if (utils.checkRegionRestriction(body.items[0]) !== false) {
                                                if (plugged.getCurrentMedia().id === now.media.id) {
                                                    var intersection = utils.checkRegionRestriction(body.items[0]);
                                                    plugged.sendChat(langfile.youtubeGuard.skip);
                                                    plugged.skipDJ(booth.dj);
                                                    setTimeout(function () {
                                                        plugged.sendChat(utils.replace(langfile.youtubeGuard.blocked.default, {
                                                            username: plugged.getUserByID(booth.dj).username,
                                                            song: utils.mediatitle(now.media),
                                                            countries: intersection.join(' ')
                                                        }), 60);
                                                        models.Song.findOrCreate({
                                                            where: {
                                                                format: now.media.format,
                                                                cid: now.media.cid,
                                                                plug_id: now.media.id
                                                            }, defaults: {
                                                                format: now.media.format,
                                                                cid: now.media.cid,
                                                                plug_id: now.media.id,
                                                                idBanned: true,
                                                                ban_reason: utils.replace(langfile.youtubeGuard.blocked.bl_reason, {countries: intersection.join(' ')})
                                                            }
                                                        }).spread(function (track) {
                                                            track.updateAttributes({
                                                                isBanned: true,
                                                                ban_reason: utils.replace(langfile.youtubeGuard.blocked.bl_reason, {countries: intersection.join(' ')})
                                                            });
                                                        });
                                                    }, 4 * 1000);
                                                }
                                            } else if (body.items[0].status.uploadStatus === 'deleted') {
                                                plugged.sendChat(langfile.youtubeGuard.skip);
                                                plugged.skipDJ(booth.dj);
                                                setTimeout(function () {
                                                    plugged.sendChat(utils.replace(langfile.youtubeGuard.deleted.default, {
                                                        username: plugged.getUserByID(booth.dj).username,
                                                        song: utils.mediatitle(now.media)
                                                    }), 60);
                                                    models.Song.findOrCreate({
                                                        where: {
                                                            format: now.media.format,
                                                            cid: now.media.cid,
                                                            plug_id: now.media.id
                                                        }, defaults: {
                                                            format: now.media.format,
                                                            cid: now.media.cid,
                                                            plug_id: now.media.id,
                                                            idBanned: true,
                                                            ban_reason: langfile.youtubeGuard.deleted.bl_reason
                                                        }
                                                    }).spread(function (track) {
                                                        track.updateAttributes({
                                                            isBanned: true,
                                                            ban_reason: langfile.youtubeGuard.deleted.bl_reason
                                                        });
                                                    });
                                                }, 4 * 1000);
                                            } else if (body.items[0].status.uploadStatus === 'rejected') {
                                                plugged.sendChat(langfile.youtubeGuard.skip);
                                                plugged.skipDJ(booth.dj);
                                                setTimeout(function () {
                                                    plugged.sendChat(utils.replace(langfile.youtubeGuard.rejected.default, {
                                                        username: plugged.getUserByID(booth.dj).username,
                                                        song: utils.mediatitle(now.media),
                                                        reason: langfile.youtubeGuard.rejected.reasons[body.items[0].status.rejectionReason]
                                                    }), 60);
                                                    models.Song.findOrCreate({
                                                        where: {
                                                            format: now.media.format,
                                                            cid: now.media.cid,
                                                            plug_id: now.media.id
                                                        }, defaults: {
                                                            format: now.media.format,
                                                            cid: now.media.cid,
                                                            plug_id: now.media.id,
                                                            idBanned: true,
                                                            ban_reason: utils.replace(langfile.youtubeGuard.rejected.bl_reason, {reason: langfile.youtubeGuard.rejected.reasons[body.items[0].status.rejectionReason]})
                                                        }
                                                    }).spread(function (track) {
                                                        track.updateAttributes({
                                                            isBanned: true,
                                                            ban_reason: utils.replace(langfile.youtubeGuard.rejected.bl_reason, {reason: langfile.youtubeGuard.rejected.reasons[body.items[0].status.rejectionReason]})
                                                        });
                                                    });
                                                }, 4 * 1000);
                                            } else if (body.items[0].status.privacyStatus === 'private') {
                                                plugged.sendChat(langfile.youtubeGuard.skip);
                                                plugged.skipDJ(booth.dj);
                                                setTimeout(function () {
                                                    plugged.sendChat(utils.replace(langfile.youtubeGuard.private.default, {
                                                        username: plugged.getUserByID(booth.dj).username,
                                                        song: utils.mediatitle(now.media)
                                                    }), 60);
                                                    models.Song.findOrCreate({
                                                        where: {
                                                            format: now.media.format,
                                                            cid: now.media.cid,
                                                            plug_id: now.media.id
                                                        }, defaults: {
                                                            format: now.media.format,
                                                            cid: now.media.cid,
                                                            plug_id: now.media.id,
                                                            idBanned: true,
                                                            ban_reason: langfile.youtubeGuard.private.bl_reason
                                                        }
                                                    }).spread(function (track) {
                                                        track.updateAttributes({
                                                            isBanned: true,
                                                            ban_reason: langfile.youtubeGuard.private.bl_reason
                                                        });
                                                    });
                                                }, 4 * 1000);
                                            } else if (body.items[0].status.embeddable === false) {
                                                plugged.sendChat(langfile.youtubeGuard.skip);
                                                plugged.skipDJ(booth.dj);
                                                setTimeout(function () {
                                                    plugged.sendChat(utils.replace(langfile.youtubeGuard.embeddable.default, {
                                                        username: plugged.getUserByID(booth.dj).username,
                                                        song: utils.mediatitle(now.media)
                                                    }), 60);
                                                    models.Song.findOrCreate({
                                                        where: {
                                                            format: now.media.format,
                                                            cid: now.media.cid,
                                                            plug_id: now.media.id
                                                        }, defaults: {
                                                            format: now.media.format,
                                                            cid: now.media.cid,
                                                            plug_id: now.media.id,
                                                            idBanned: true,
                                                            ban_reason: langfile.youtubeGuard.embeddable.bl_reason
                                                        }
                                                    }).spread(function (track) {
                                                        track.updateAttributes({
                                                            isBanned: true,
                                                            ban_reason: langfile.youtubeGuard.embeddable.bl_reason
                                                        });
                                                    });
                                                }, 4 * 1000);
                                            }
                                        }
                                    }
                                } else story.warn('YoutubeApi', 'Error during youtube-api call.', {
                                    attach: {
                                        err: error,
                                        response: resp
                                    }
                                });
                            });
                        }
                    });
                }
            });
            models.Song.findOrCreate({
                where: {cid: now.media.cid, format: now.media.format}, defaults: {
                    title: now.media.title,
                    author: now.media.author,
                    image: now.media.image,
                    duration: now.media.duration,
                    format: now.media.format,
                    plug_id: now.media.id,
                    cid: now.media.cid
                }
            }).then(function (song) {
                song = song[0];
                song.updateAttributes({
                    image: now.media.image,
                    title: now.media.title,
                    author: now.media.author,
                    duration: now.media.duration
                });
                if (song.tskip !== null && song.tskip !== undefined && !config.state.eventmode) {
                    plugged.sendChat(utils.replace(langfile.tskip.default, {time: song.tskip}), song.tskip + 10);
                    timeouts.tksip = setTimeout(function () {
                        plugged.sendChat(langfile.tskip.skip, 60);
                        plugged.skipDJ(booth.dj);
                    }, song.tskip * 1000);
                }
            });
            story.info('advance', utils.userLogString(plugged.getUserByID(booth.dj)) + ': ' + utils.mediatitlelog(now.media));
        } else story.info('advance', 'Nobody is playing!');
        clearTimeout(timeouts.stuck);
        clearTimeout(timeouts.tskip);
        if (booth.dj !== undefined) {
            timeouts.stuck = setTimeout(function () {
                plugged.sendChat(langfile.skip.stuck.default, 30);
                plugged.skipDJ(booth.dj, now.historyID);
            }, (now.media.duration + 5) * 1000);
        }
        if (prev.dj !== undefined) {
            redis.set('media:history:' + prev.media.format + ':' + prev.media.cid, 1).then(function () {
                redis.expire('media:history:' + prev.media.format + ':' + prev.media.cid, config.history.time * 60);
            });
            models.Song.find({where: {plug_id: now.media.id}}).then(function (song) {
                models.User.find({where: {id: prev.dj.id}}).then(function (user) {
                    models.Play.create({
                        time: new Date,
                        woots: prev.score.positive,
                        mehs: prev.score.negative,
                        grabs: prev.score.grabs
                    }).then(function (play) {
                        play.setSong(song);
                        play.setUser(user);
                    });
                });
            });
            story.info('score', utils.mediatitlelog(prev.media) + ' woots: ' + prev.score.positive + ' | grabs: ' + prev.score.grabs + ' | mehs: ' + prev.score.negative);
        }

    });

    plugged.on(plugged.FRIEND_JOIN, function (user) {
        redis.set('user:chat:spam:' + user.id + ':points', 0);
        redis.exists('user:chat:spam:' + user.id + ':warns').then(function (ex) {
            if (ex === 0) redis.set('user:chat:spam:' + user.id + ':warns', 0);
        });
        models.User.find({where: {id: user.id}}).then(function (usr) {
            if (usr !== null && usr !== undefined) {
                if (usr.s_role > 0) redis.set('user:role:save:' + user.id, usr.s_role);
                if (usr.super_user === false && user.role !== usr.s_role) {
                    if (usr.s_role > 0) plugged.addStaff(user.id, usr.s_role);
                    else plugged.removeStaff(user.id);
                }
                usr.updateAttributes({status: true});
                if (config.options.welcome.old) setTimeout(function () {
                    plugged.sendChat(utils.replace(langfile.welcome.old, {username: user.username}), 60);
                }, 6 * 1000)
            } else {
                if (config.options.welcome.new) setTimeout(function () {
                    plugged.sendChat(utils.replace(langfile.welcome.new, {username: user.username}), 60);
                }, 6 * 1000);
                models.User.create({
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
        models.User.find({where: {id: user.id}}).then(function (usr) {
            if (usr !== null && usr !== undefined) {
                if (usr.s_role > 0) redis.set('user:role:save:' + user.id, usr.s_role);
                if (!usr.super_user && user.role !== usr.s_role) {
                    if (usr.s_role > 0) plugged.addStaff(user.id, usr.s_role);
                    else plugged.removeStaff(user.id);
                }
                usr.updateAttributes({status: true});
                if (config.options.welcome.old) setTimeout(function () {
                    plugged.sendChat(utils.replace(langfile.welcome.old, {username: user.username}), 60);
                }, 6 * 1000)
            } else {
                if (config.options.welcome.new) setTimeout(function () {
                    plugged.sendChat(utils.replace(langfile.welcome.new, {username: user.username}), 60);
                }, 6 * 1000);
                models.User.create({
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
        redis.del('user:role:save:' + user.id);
        models.User.update({status: false}, {where: {id: user.id}});
        story.info('leave', utils.userLogString(user));
    });

    plugged.on(plugged.CHAT, function (data) {
        if (data.id !== plugged.getSelf().id) {
            if (S(data.message).startsWith('!')) {
                var split = S(data.message).chompLeft('!').s.split(' ');
                if (commands[split[0]] !== undefined) {
                    commands[split[0]].handler(data);
                    story.info('command', utils.userLogString(data.username, data.id) + ': ' + split[0] + ' [' + data.message + ']');
                }
            }
            if (config.state.lockdown) {
                redis.get('user:role:save:' + data.id).then(function (perm) {
                    if (perm < 2) plugged.removeChatMessage(data.cid);
                });
            } else {
                if (config.cleverbot.enabled && S(data.message).contains('@' + plugged.getSelf().username)) {
                    utils.sendToCleverbot(data);
                }
                redis.exists('user:mute:' + data.id).then(function (exm) {
                    if (exm === 1) {
                        plugged.removeChatMessage(data.cid);
                        if (!S(data.message).startsWith('!')) {
                            redis.incr('user:mute:' + data.id + ':violation').then(function () {
                                redis.get('user:mute:' + data.id + ':violation').then(function (val) {
                                    if (val > config.chatfilter.spam.mute_violation) {
                                        plugged.sendChat(utils.replace(langfile.chatfilter.spam.hard_mute, {username: data.username}), 60);
                                        plugged.muteUser(data.id, plugged.MUTEDURATION.LONG, plugged.BANREASON.SPAMMING);
                                    }
                                });
                            });
                        }
                    }
                    else if (config.chatfilter.enabled) {
                        redis.get('user:role:save:' + data.id).then(function (perm) {
                            if (perm < 2) {
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
                                        if (points >= config.chatfilter.spam.points) {
                                            redis.incr('user:chat:spam:' + data.id + ':warns');
                                            plugged.removeChatMessage(data.cid);
                                            plugged.sendChat(utils.replace(langfile.chatfilter.spam.warn, {username: data.username}), 60);
                                        }
                                        redis.get('user:chat:spam:' + data.id + ':warns').then(function (warns) {
                                            if (warns > config.chatfilter.spam.warns) {
                                                plugged.sendChat(utils.replace(langfile.chatfilter.spam.mute, {username: data.username}), 60);
                                                redis.set('user:mute:' + data.id, 1).then(function () {
                                                    redis.set('user:mute:' + data.id + ':violation', 0);
                                                    redis.expire('user:mute:' + data.id, config.chatfilter.spam.mute_duration);
                                                });
                                            } else {
                                                if (utils.contains(data.message, config.chatfilter.words.blacklist)) {
                                                    plugged.removeChatMessage(data.cid);
                                                    redis.incrby('user:chat:spam:' + data.id + ':points', 7);
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
        }
        story.info('chat', data.username + '[' + data.id + ']: ' + data.message);
    });

    plugged.on(plugged.CHAT_MENTION, function (data) {
        if (data.id !== plugged.getSelf().id) {
            if (S(data.message).startsWith('!')) {
                var split = S(data.message).chompLeft('!').s.split(' ');
                if (commands[split[0]] !== undefined) {
                    commands[split[0]].handler(data);
                    story.info('command', utils.userLogString(data.username, data.id) + ': ' + split[0] + ' [' + data.message + ']');
                }
            }
            if (config.state.lockdown) {
                redis.get('user:role:save:' + data.id).then(function (perm) {
                    if (perm < 2) plugged.removeChatMessage(data.cid);
                });
            } else {
                redis.exists('user:mute:' + data.id).then(function (exm) {
                    if (exm === 1) {
                        plugged.removeChatMessage(data.cid);
                        if (!S(data.message).startsWith('!')) {
                            redis.incr('user:mute:' + data.id + ':violation').then(function () {
                                redis.get('user:mute:' + data.id + ':violation').then(function (val) {
                                    if (val > config.chatfilter.spam.mute_violation) {
                                        plugged.sendChat(utils.replace(langfile.chatfilter.spam.hard_mute, {username: data.username}), 60);
                                        plugged.muteUser(data.id, plugged.MUTEDURATION.LONG, plugged.BANREASON.SPAMMING);
                                    }
                                });
                            });
                        }
                    } else {
                        redis.get('user:role:save:' + data.id).then(function (perm) {
                            if (perm < 2) {
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
                                        if (points >= config.chatfilter.spam.points) {
                                            redis.incr('user:chat:spam:' + data.id + ':warns');
                                            plugged.removeChatMessage(data.cid);
                                            plugged.sendChat(utils.replace(langfile.chatfilter.spam.warn, {username: data.username}), 60);
                                        }
                                        redis.get('user:chat:spam:' + data.id + ':warns').then(function (warns) {
                                            if (warns > config.chatfilter.spam.warns) {
                                                plugged.sendChat(utils.replace(langfile.chatfilter.spam.mute, {username: data.username}), 60);
                                                redis.set('user:mute:' + data.id, 1).then(function () {
                                                    redis.set('user:mute:' + data.id + ':violation', 0);
                                                    redis.expire('user:mute:' + data.id, config.chatfilter.spam.mute_duration);
                                                });
                                            } else {
                                                if (utils.contains(data.message, config.chatfilter.words.blacklist)) {
                                                    plugged.removeChatMessage(data.cid);
                                                    redis.incrby('user:chat:spam:' + data.id + ':points', 7);
                                                } else if (utils.containsplug(data.message)) {
                                                    plugged.removeChatMessage(data.cid);
                                                    redis.incrby('user:chat:spam:' + data.id + ':points', 20);
                                                } else if (!S(data.message).startsWith('!')) {
                                                    utils.sendToCleverbot(data);
                                                }
                                            }
                                        });
                                    });
                                });
                            } else if (!S(data.message).startsWith('!')) {
                                utils.sendToCleverbot(data);
                            }
                        });
                    }
                });
            }
        }
        story.info('chat', data.username + '[' + data.id + ']: ' + data.message);
    });

    plugged.on(plugged.MOD_STAFF, function (data) {
        data = data[0];
        if (data.moderatorID !== plugged.getSelf().id) {
            redis.get('user:role:save:' + data.moderatorID).then(function (perm) {
                if (perm > 2) {
                    redis.set('user:role:save:' + data.id, data.role);
                    models.User.update({s_role: data.role}, {where: {id: data.id}});
                } else {
                    redis.get('user:role:save:' + data.id).then(function (permlvl) {
                        var role = utils.role(permlvl);
                        if (role === plugged.USERROLE.NONE) plugged.removeStaff(data.id);
                        else plugged.addStaff(data.id, role);
                        plugged.sendChat(utils.replace(langfile.setstaff.no_power, {username: data.moderator}), 60);
                    });
                }
            });
            story.info('promote', util.userLogString(data.moderator, data.moderatorID) + ': ' + utils.userLogString(data.username, data.id) + ' --> ' + utils.rolename(data.role));
        }
    });

    plugged.on(plugged.MOD_BAN, function (data) {
        if (data.moderatorID !== plugged.getSelf().id) {
            redis.get('user:role:save:' + data.moderatorID).then(function (perm) {
                if (perm < 2 && data.duration === plugged.BANDURATION.PERMA) {
                    plugged.sendChat(utils.replace(langfile.ban.no_staff_ban, {username: data.moderator}), 60);
                    plugged.unbanUser(data.id);
                    plugged.banUser(data.id, plugged.BANDURATION.DAY, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                } else {
                    redis.get('user:role:save:' + data.id).then(function (plvl) {
                        if (plvl > 1) {
                            plugged.sendChat(utils.replace(langfile.ban.staff_ban, {username: data.moderator}), 60);
                            plugged.unbanUser(data.id);
                        }
                    });
                }
            });
            story.info('ban', util.userLogString(data.moderator, data.moderatorID) + ': ' + data.username + ' --> ' + data.duration);
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
        }
    });
});