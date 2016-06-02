var app = require('express').Router();

var plugged = require('../lib/client');

app.get('/', function (req, res) {
    res.json({
        urls: {
            all: '/v1/all',
            users: '/v1/users',
            media: '/v1/media',
            history: '/v1/history',
            room: '/v1/room'
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

module.exports = app;