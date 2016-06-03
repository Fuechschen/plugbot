var app = require('express').Router();
var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var plugged = require('../lib/client');
var db = require('../lib/db/sql_db');

app.get('/', function (req, res) {
    res.json({
        plug_data: {
            all: '/v1/all',
            users: '/v1/users',
            media: '/v1/media',
            history: '/v1/history',
            room: '/v1/room'
        },
        bot_data: {
            customCommands: '/v1/customcommands',
            bestVotedSongs: '/v1/highscore'
        }
    })
});

app.get('/users', function (req, res) {
    res.json(plugged.getUsers().map(function (e) {
        return {id: e.id, username: e.username, slug: e.slug, gRole: e.gRole, role: e.role, level: e.level}
    }));
});

app.get('/media', function (req, res) {
    res.json(plugged.getMedia());
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

app.get('/all', function (req, res) {
    plugged.getRoomHistory(function (err, history) {
        res.json({
            room: function () {
                var meta = plugged.getRoomMeta();
                meta.favorite = undefined;
                meta.dj = (plugged.getDJ() !== undefined ? (plugged.getDJ().id !== -1 ? plugged.getDJ() : null) : null);
                return meta;
            }(),
            media: plugged.getMedia(),
            users: plugged.getUsers().map(function (e) {
                return {id: e.id, username: e.username, slug: e.slug, gRole: e.gRole, role: e.role, level: e.level};
            }),
            history: (err ? null : history.map(function (e) {
                e.room = undefined;
                return e;
            }))
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
                    p.song = {
                        id: songs[i].plug_id,
                        author: songs[i].author,
                        title: songs[i].title,
                        format: songs[i].format,
                        cid: songs[i].cid,
                        duration: songs[i].duration,
                        image: songs[i].image
                    };
                    data.push(p);
                });
                res.json({data:data});
            });
        });
    });
});

module.exports = app;