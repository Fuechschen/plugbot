var moment = require('moment');
var storyboard = require('storyboard');
var fs = require('fs');

var config = require('./lib/load_config.js');
var langfile = require('./langfile.js');
var db = require('./lib/db/sql_db');
var plugged = require('./lib/client');
var redis = require('./lib/db/redis_db');
var story = storyboard.mainStory;

storyboard.config({filter: '*:' + config.options.loglevel});
storyboard.addListener(require('storyboard/lib/listeners/console').default);
storyboard.mainStory.info('Starting plugbot version ' + require('./package.json').version);

moment.locale(langfile.moment_locale);

//noinspection JSUnresolvedFunction
redis.del('user:roles');

redis.exists('meta:data:staff:active').then(function (ex) {
    if (ex === 0) redis.set('meta:data:staff:active', 1);
});

fs.readdir('./lib/eventhandlers', function (err, files) {
    if (err) {
        story.fatal('Cannot load eventhandlers.', {attach: err});
        process.exit(1);
    } else {
        files.forEach(function (file) {
            try {
                var h = require('./lib/eventhandlers/' + file);
                if (Array.isArray(h.event)) {
                    h.event.forEach(function (event) {
                        plugged.on(event, h.handler);
                    });
                } else plugged.on(h.event, h.handler);
                story.debug('EventHandlers', 'Loaded Handler for Event ' + (Array.isArray(h.event) ? h.event.join() : h.event));
            } catch (e) {
                story.error('Failed to load eventhandler ' + file, {attach: e});
                process.exit(1);
            }
        });
    }
});

module.exports = {plugged: plugged, app: (config.web.enabled ? require('./web/index').app : null)};
