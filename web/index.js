var express = require('express');
var story = require('storyboard').mainStory;
var logger = require('morgan');
var S = require('string');

var config = require('../lib/load_config');

var ws = null;
var app = null;
if (config.web.enabled) {
    var Ws = require((config.web.useUWS ? 'u' : '') + 'ws').Server;

    app = express();

    var http = require('http').createServer(app);


    app.set('trust proxy', 'loopback');
    app.set('json spaces', 4);

    app.use(logger('short', {
        stream: {
            write: function (toLog) {
                //noinspection JSUnresolvedFunction
                story.info('web', S(toLog).chompRight('\n').s);
            }
        }
    }));

    app.use(function (req, res, next) {
        res.set('Access-Control-Allow-Origin', config.web.cors);
        next();
    });

    app.use('/v1', require('./v1'));

    app.get('/', function (req, res) {
        res.json({
            versions: {
                "1": config.web.path + '/v1'
            }
        });
    });

    app.use(function (req, res) {
        res.status(404).json({error: 'Not Found'});
    });

    if (config.web.websocket) {
        if (config.web.port !== null) {
            ws = new Ws({server: http, path: config.web.path + '/v1/socket'});
            if (!config.web.useUWS) {
                ws.broadcast = function (data) {
                    ws.clients.forEach(function (client) {
                        client.send(data);
                    });
                }
            }
            ws.on('connection', function (socket) {
                var h = setInterval(function () {
                    socket.send(JSON.stringify({t: 'hb', d: {}}));
                }, 30 * 1000);
                socket.on('close', function () {
                    clearInterval(h);
                });
            });
        } else story.warn('web', 'If you want to use the websocket, please provide a port to listen on.');
    }

    if (config.web.port !== null) http.listen(config.web.port || 3000, function () {
        story.info('web', 'Listening on port ' + (config.web.port || 3000));
    });
    else story.info('web', 'Not Listening on a port because port is set to null');

}

module.exports = {
    app: app,
    wsGet: function (type) {
        switch (type) {
            case 'advance':
                return function (update) {
                    if (ws !== null)ws.broadcast(JSON.stringify({t: 'adv', d: update}));
                };
                break;
            case 'chat':
                return function (msg) {
                    if (ws !== null)ws.broadcast(JSON.stringify({t: 'chat', d: msg}));
                };
                break;
            case 'skip':
                return function (user) {
                    if (ws !== null)ws.broadcast(JSON.stringify({t: 'skip', d: user}));
                };
                break;
            case 'userban':
                return function (ban) {
                    if (ws !== null)ws.broadcast(JSON.stringify({t: 'ban', d: ban}));
                };
                break;
            case 'join':
                return function (user) {
                    if (ws !== null)ws.broadcast(JSON.stringify({t: 'join', d: user}));
                };
                break;
            case 'leave':
                return function (user) {
                    if (ws !== null)ws.broadcast(JSON.stringify({t: 'leave', d: user}));
                };
                break;
            case 'waitlist':
                return function (wl) {
                    if (ws !== null)ws.broadcast(JSON.stringify({t: 'wl', d: wl}));
                };
                break;
            case 'vote':
                return function (votes) {
                    if (ws !== null)ws.broadcast(JSON.stringify({t: 'v', d: votes}));
                };
                break;
            case 'chatDelete':
                return function (data) {
                    if (ws !== null)ws.broadcast(JSON.stringify({t: 'chatDelete', d: d}));
                };
                break;
            default:
                return function () {

                };
                break;
        }
    }
};