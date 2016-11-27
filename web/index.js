let express = require('express');
let story = require('storyboard').mainStory;
let logger = require('morgan');
let S = require('string');

const config = require('../lib/load_config');

let ws = null;
let app = null;
if (config.web.enabled) {
    let Ws = require(`${config.web.useUWS ? 'u' : ''}ws`).Server;

    app = express();

    let http = require('http').createServer(app);


    app.set('trust proxy', 'loopback');
    app.set('json spaces', 4);

    app.use(logger('short', {
        stream: {
            write: (toLog) => {
                //noinspection JSUnresolvedFunction
                story.info('web', S(toLog).chompRight('\n').s);
            }
        }
    }));

    app.use((req, res, next) => {
        res.set('Access-Control-Allow-Origin', config.web.cors);
        next();
    });

    app.use('/v1', require('./v1'));

    app.get('/', (req, res) => {
        res.json({
            versions: {
                "1": `${config.web.path}/v1`
            }
        });
    });

    app.use((req, res) => {
        res.status(404).json({error: 'Not Found'});
    });

    if (config.web.websocket) {
        if (config.web.port !== null) {
            ws = new Ws({server: http, path: `${config.web.path}/v1/socket`});
            if (!config.web.useUWS) {
                ws.broadcast = data => {
                    ws.clients.forEach(client => {
                        client.send(data);
                    });
                }
            }
            ws.on('connection', socket => {
                let h = setInterval(() => {
                    socket.send(JSON.stringify({t: 'hb', d: {}}));
                }, 30 * 1000);
                socket.on('close', () => {
                    clearInterval(h);
                });
            });
        } else story.warn('web', 'If you want to use the websocket, please provide a port to listen on.');
    }

    if (config.web.port !== null) http.listen(config.web.port || 3000, () => {
        story.info('web', `Listening on port ${config.web.port || 3000}`);
    });
    else story.info('web', 'Not Listening on a port because port is set to null');

}

module.exports = {
    app,
    wsGet: (type) => {
        switch (type) {
            case 'advance':
                return update => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'adv', d: update}));
                };
                break;
            case 'chat':
                return msg => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'chat', d: msg}));
                };
                break;
            case 'skip':
                return user => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'skip', d: user}));
                };
                break;
            case 'userban':
                return ban => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'ban', d: ban}));
                };
                break;
            case 'join':
                return user => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'join', d: user}));
                };
                break;
            case 'leave':
                return user => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'leave', d: user}));
                };
                break;
            case 'waitlist':
                return wl => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'wl', d: wl}));
                };
                break;
            case 'vote':
                return votes => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'v', d: votes}));
                };
                break;
            case 'chatDelete':
                return data => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'chatDelete', d: data}));
                };
                break;
            default:
                return () => {

                };
                break;
        }
    }
};