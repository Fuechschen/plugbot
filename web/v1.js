var app = require('express').Router();
var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var plugged = require('../lib/client');
var db = require('../lib/db/sql_db');
var utils = require('../lib/utils');
var config = require('../lib/load_config');

app.get('/', function (req, res) {
    res.json({
        plug_data: {
            all: config.web.path + '/v1/all',
            users: config.web.path + '/v1/users',
            media: config.web.path + '/v1/media',
            history: config.web.path + '/v1/history',
            room: config.web.path + '/v1/room',
            waitlist: config.web.path + '/v1/waitlist'
        },
        bot_data: {
            customCommands: config.web.path + '/v1/customcommands',
            bestVotedSongs: config.web.path + '/v1/highscore',
            blacklist: config.web.path + '/v1/blacklist',
            channelblacklist: config.web.path + '/v1/channelblacklist',
            check: config.web.path + '/v1/check?s={string}',
            user: config.web.path + '/v1/user?id={userid}&name={username}'
        },
        socket: config.web.path + '/v1/socket'
    })
});

app.get('/users', function (req, res) {
    res.json(plugged.getUsers().map(function (e) {
        return {id: e.id, username: e.username, slug: e.slug, gRole: e.gRole, role: e.role, level: e.level}
    }));
});

app.get('/media', function (req, res) {
    res.json({data: (plugged.getMedia().id !== -1 ? plugged.getMedia() : null)});
});

app.get('/history', function (req, res) {
    plugged.getRoomHistory(function (err, history) {
        if (err)res.status(500).end();
        else res.json(history.map(function (e) {
                e.room = undefined;
                return e;
            })
        );
    });
});

app.get('/room', function (req, res) {
    res.json(function () {
        var meta = plugged.getRoomMeta();
        meta.favorite = undefined;
        meta.dj = (plugged.getDJ() !== undefined ? (plugged.getDJ().id !== -1 ? plugged.getDJ() : null) : null);
        return meta;
    }());
});

app.get('/waitlist', function (req, res) {
    res.json({
        data: plugged.getWaitlist().map(function (id) {
            return plugged.getUserByID(id);
        })
    });
});

app.get('/all', function (req, res) {
    plugged.getRoomHistory(function (err, history) {
        res.json({
            room: function () {
                var meta = plugged.getRoomMeta();
                meta.favorite = undefined;
                meta.dj = (plugged.getDJ() !== undefined ? (plugged.getDJ().id !== -1 ? plugged.getDJ() : null) : null);
                return meta;
            }(),
            media: (plugged.getMedia().id !== -1 ? plugged.getMedia() : null),
            users: plugged.getUsers().map(function (e) {
                return {id: e.id, username: e.username, slug: e.slug, gRole: e.gRole, role: e.role, level: e.level};
            }),
            history: (err ? null : history.map(function (e) {
                e.room = undefined;
                return e;
            })),
            waitlist: plugged.getWaitlist().map(function (id) {
                return plugged.getUserByID(id);
            })
        })
    });
});

app.get('/customcommands', function (req, res) {
    //noinspection JSUnresolvedFunction
    db.models.CustomCommand.findAll().map(function (e) {
        return {id: e.id, trigger: e.trigger, message: e.message, enabled: e.status};
    }).then(function (ccs) {
        res.json({data: ccs});
    }).catch(function (err) {
        story.warn('web', 'Error getting CustomCommands', {attach: err});
        res.status(500).end();
    });
});

app.get('/highscore', function (req, res) {
    var limit = parseInt(req.query.limit) || 10;
    //noinspection JSUnresolvedFunction
    db.models.Play.findAll({order: [['woots', 'DESC']], limit: limit}).then(function (plays) {
        Promise.all(plays.map(function (e) {
            return e.getUser();
        })).then(function (users) {
            Promise.all(plays.map(function (e) {
                //noinspection JSUnresolvedFunction
                return e.getSong();
            })).then(function (songs) {
                var data = [];
                plays.forEach(function (play, i) {
                    var p = {
                        id: play.id,
                        score: {woots: play.woots, mehs: play.mehs, grabs: play.grabs},
                        time: play.time
                    };
                    p.user = {id: users[i].id, username: users[i].username};
                    p.song = (songs[i] !== null ? {
                        id: songs[i].plug_id,
                        author: songs[i].author,
                        title: songs[i].title,
                        format: songs[i].format,
                        cid: songs[i].cid,
                        duration: songs[i].duration,
                        image: songs[i].image
                    } : null);
                    data.push(p);
                });
                res.json({data: data});
            });
        });
    });
});

app.get('/blacklist', function (req, res) {
    //noinspection JSUnresolvedFunction
    db.models.Song.findAll({where: {is_banned: true}}).then(function (songs) {
        res.json({
            data: songs.map(function (song) {
                return {
                    id: song.id,
                    author: song.author,
                    title: song.title,
                    format: song.format,
                    cid: song.cid,
                    image: song.image,
                    isBanned: song.is_banned,
                    banReason: song.ban_reason
                };
            })
        });
    }).catch(function () {
        res.status(500).json({error: 'SQL Error'});
    });
});

app.get('/channelblacklist', function (req, res) {
    db.models.Channel.findAll({where: {is_banned: true}}).then(function (channels) {
        res.json({
            data: channels.map(function (c) {
                return {
                    name: c.name,
                    channel_id: c.cid,
                    is_banned: c.is_banned,
                    ban_reason: c.ban_reason
                };
            })
        });
    }).catch(function () {
        res.status(500).json({error: 'SQL Error'});
    });
});

app.get('/check', function (req, res) {
    if (req.query.s !== undefined) {
        utils.resolveCID(req.query.s).then(function (cid) {
            var split = cid.split(':');
            db.models.Song.find({where: {format: split[0], cid: split[1]}}).then(function (song) {
                if (song !== undefined && song !== null) {
                    res.json({
                        data: {
                            id: song.id,
                            author: song.author,
                            title: song.title,
                            format: song.format,
                            cid: song.cid,
                            image: song.image,
                            is_banned: song.is_banned,
                            banReason: (song.is_banned ? song.ban_reason : null)
                        }
                    });
                } else res.status(404).json({error: 'song not found'});
            }).catch(function () {
                res.status(500).json({error: 'SQL Error'});
            });
        }).catch(function (error) {
            res.json({error: error.message});
        });
    } else res.status(400).json({error: 'invalid query'});
});

app.get('/user', function (req, res) {
    var search = {};
    if (req.query.id !== undefined) search.id = req.query.id;
    if (req.query.name !== undefined && req.query.id === undefined) search.username = req.query.name;

    if (req.query.id === undefined && req.query.name === undefined) res.status(400).json({error: 'invalid query'});
    else {
        db.models.User.find({where: search}).then(function (user) {
            if (user !== undefined && user !== null) {
                res.json({
                    data: {
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar_id,
                        badge: user.badge,
                        grole: user.global_role,
                        role: user.s_role,
                        level: user.level,
                        status: user.status
                    }
                });
            } else res.statusCode(404).json({error: 'User not found'});
        }).catch(function () {
            res.status(500).json({error: 'SQL Error'});
        })
    }
});

module.exports = app;