let express = require('express'),
    story = require('storyboard').mainStory,
    logger = require('morgan'),
    httpServer = require('http');

const config = require('../lib/load_config');

let ws = null,
    app = null;

if (config.web.enabled) {
    let Ws = require(`${config.web.useUWS ? 'u' : ''}ws`).Server;  //eslint-disable-line global-require

    app = express();

    let http = httpServer.createServer(app);


    app.set('trust proxy', 'loopback');
    app.set('json spaces', 4);

    app.use(logger('short', {
        stream: {
            write: (toLog) => {
                //noinspection JSUnresolvedFunction
                story.info('web', (toLog).replace(new RegExp('\n', 'g'), ''));
            }
        }
    }));

    app.use((req, res, next) => {
        res.set('Access-Control-Allow-Origin', config.web.cors);
        next();
    });

    app.use('/v1', require('./v1'));   //eslint-disable-line global-require

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
                };
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
            case 'chat':
                return msg => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'chat', d: msg}));
                };
            case 'skip':
                return user => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'skip', d: user}));
                };
            case 'userban':
                return ban => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'ban', d: ban}));
                };
            case 'join':
                return user => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'join', d: user}));
                };
            case 'leave':
                return user => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'leave', d: user}));
                };
            case 'waitlist':
                return wl => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'wl', d: wl}));
                };
            case 'vote':
                return votes => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'v', d: votes}));
                };
            case 'chatDelete':
                return data => {
                    if (ws !== null) ws.broadcast(JSON.stringify({t: 'chatDelete', d: data}));
                };
            default:
                return () => {

                };
        }
    }
};