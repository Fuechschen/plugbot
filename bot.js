config = require('./load_config.js');
langfile = require('./langfile.js');
_ = require('underscore');
path = require('path');
S = require('string');
moment = require('moment');
utils = require('./utils.js');
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
config.loadfromRedis(redis);

timeouts = {
    stuck: null
};
plugged = new Plugged();
plugged.login(config.login);
commands = require('./commands.js');
workers = require('./workers.js');
plugged.on(plugged.LOGIN_SUCCESS, function () {
    plugged.cacheChat(true);
    plugged.connect(config.options.room);
});

plugged.on(plugged.CONN_ERROR, function (err) {
    console.log(err);
});

plugged.on(plugged.LOGIN_ERROR, function (err) {
    console.log(err);
});

plugged.on(plugged.JOINED_ROOM, function () {
    plugged.getUsers().forEach(function (user) {
        models.User.find({where: {id: user.id}}).then(function (usr) {
            if (usr !== null && usr !== undefined) {
                if (usr.s_role > 0) redis.set('user:role:save:' + user.id, usr.s_role);
                if (!usr.super_user && user.role !== usr.s_role) {
                    if (usr.s_role > 0) plugged.addStaff(user.id, usr.s_role);
                    else plugged.removeStaff(user.id);
                }
                usr.updateAttributes({status: true});
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
        clearTimeout(timeouts.stuck);
        if (booth.dj !== undefined) {
            redis.exists('media:blacklist:' + now.media.format + ':' + now.media.id).then(function (exb) {
                if (exb === 1) {
                    redis.get('media:blacklist:' + now.media.format + ':' + now.media.id).then(function (track) {
                        plugged.skipDJ(booth.dj, now.historyID);
                        if (track !== 1) {
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
                    });
                } else {
                    redis.exists('media:history:' + now.media.format + ':' + now.media.id).then(function (exh) {
                        if (exh === 1 && config.history.skipenabled) {
                            plugged.skipDJ(booth.dj, now.historyID);
                            redis.ttl('media:history:' + now.media.format + ':' + now.media.id).then(function (ttl) {
                                plugged.skipDJ(booth.dj, now.historyID);
                                plugged.sendChat(utils.replace(langfile.skip.history.default, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title),
                                    time: moment().subtract((config.history.time * 60) - ttl, 'seconds').fromNow()
                                }));
                            });
                        } else {

                        }
                    });
                }
            });
            timeouts.stuck = setTimeout(function () {
                plugged.sendChat(langfile.skip.stuck.default, 30);
                plugged.skipDJ(booth.dj, now.historyID);
            }, (now.media.duration + 5) * 1000);
        }
        if(prev.dj !== undefined){
            redis.set('media:history:' + prev.media.format + ':' + prev.media.id, 1).then(function () {
                redis.expire('media:history:' + prev.media.format + ':' + prev.media.id, config.history.time * 60);
            });
            models.Song.find({where: {plug_id: now.media.id}}).then(function (song) {
                if (song !== null && song !== undefined) {
                    song.updateAttributes({
                        title: now.media.title,
                        author: now.media.author,
                        image: now.media.image,
                        duration: now.media.duration,
                        format: now.media.format,
                        plug_id: now.media.id,
                        cid: now.media.cid
                    });
                    createPlay(song);
                } else {
                    models.Song.create({
                        title: now.media.title,
                        author: now.media.author,
                        image: now.media.image,
                        duration: now.media.duration,
                        format: now.media.format,
                        plug_id: now.media.id,
                        cid: now.media.cid
                    }).then(function (newsong) {
                        createPlay(newsong);
                    });
                }

                function createPlay(sng) {
                    models.User.find({where: {id: prev.dj.id}}).then(function (user) {
                        models.Play.create({
                            time: new Date,
                            woots: prev.score.positive,
                            mehs: prev.score.negative,
                            grabs: prev.score.grabs
                        }).then(function (play) {
                            play.setSong(sng);
                            play.setUser(user);
                        });
                    })
                }
            });
        }
    });

    plugged.on(plugged.FRIEND_JOIN, function (user) {
        models.User.find({where: {id: user.id}}).then(function (usr) {
            if (usr !== null && usr !== undefined) {
                if (usr.s_role > 0) redis.set('user:role:save:' + user.id, usr.s_role);
                if (!usr.super_user && user.role !== usr.s_role) {
                    if (usr.s_role > 0) plugged.addStaff(user.id, usr.s_role);
                    else plugged.removeStaff(user.id);
                }
                usr.updateAttributes({status: true});
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

    plugged.on(plugged.USER_JOIN, function (user) {
        redis.set('user:chat:spam:' + user.id + ':points', 0);
        redis.set('user:chat:spam:' + user.id + ':warns', 0);
        models.User.find({where: {id: user.id}}).then(function (usr) {
            if (usr !== null && usr !== undefined) {
                if (usr.s_role > 0) redis.set('user:role:save:' + user.id, usr.s_role);
                if (!usr.super_user && user.role !== usr.s_role) {
                    if (usr.s_role > 0) plugged.addStaff(user.id, usr.s_role);
                    else plugged.removeStaff(user.id);
                }
                usr.updateAttributes({status: true});
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

    plugged.on(plugged.USER_LEAVE, function (user) {
        redis.del('user:role:save:' + user.id);
        models.User.update({status: false}, {where: {id: user.id}});
    });

    plugged.on(plugged.CHAT, function (data) {
        if (data.id !== plugged.getSelf().id) {
            redis.exists('user:mute:' + data.id).then(function (exm) {
                if (exm === 1) plugged.deleteMessage(data.cid);
                if (S(data.message).startsWith('!')) {
                    var split = S(data.message.trim()).chompLeft('!').s.split(' ');
                    if (commands[split[0]] !== undefined) {
                        commands[split[0]].handler(data);
                    }
                }
            });
            redis.get('user:role:save:' + data.id).then(function(perm){
                if(perm < 2){
                    redis.incr('user:chat:spam:' + data.id + ':points');
                    redis.get('user:chat:spam:' + data.id + ':lastmsg').then(function(lastmsg){
                        if(data.message === lastmsg){
                            plugged.deleteMessage(data.cid);
                            redis.incrby('user:chat:spam:' + data.id + ':points', 3)
                        }
                        redis.get('user:chat:spam:' +  data.id + ':points').then(function(points){
                           if(points >= config.chatfilter.spam.points){
                               redis.incr('user:chat:spam:' + data.id + ':warns');
                               plugged.deleteMessage(data.cid);
                               plugged.sendChat(utils.replace(langfile.chatfilter.spam.warn, {username: data.username}));
                           }
                            redis.get('user:chat:spam:' + data.id + ':warns').then(function(warns){
                               if(warns > config.chatfilter.spam.warns){
                                   plugged.sendChat(utils.replace(langfile.chatfilter.spam.mute, {username: data.username}));
                                   redis.set('user:mute:' + data.id, 1);
                               }
                            });
                        });
                    });
                }
            });
        }
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
            })
        }
    });

    plugged.on(plugged.VOTE, function () {
        var score = {woots: 0, mehs: 0};
        plugged.getVotes(false).forEach(function (vote) {
            if (vote.direction === 1) score.woots = score.woots + 1;
            else if (vote.direction === -1) score.mehs = score.mehs - 1;
        });
        //todo voteskip
    });
});