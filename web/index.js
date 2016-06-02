var express = require('express');
var story = require('storyboard').mainStory;
var logger = require('morgan');
var S = require('string');

var config = require('../lib/load_config');

var app = express();

var http = require('http').createServer(app);

app.set('trust proxy', 'loopback');
app.set('json spaces', 4);

app.use(logger('short', {
    stream: {
        write: function (toLog) {
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
    res.redirect(config.web.root_redirect);
});

app.use(function (req, res) {
    res.status(404).send('Not Found');
});

if (config.web.port !== null) http.listen(config.web.port || 3000, function () {
    story.info('web', 'Listening on port ' + (config.web.port || 3000));
});

module.exports = app;