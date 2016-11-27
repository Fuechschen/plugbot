let moment = require('moment');
let storyboard = require('storyboard');
let fs = require('fs');

const config = require('./lib/load_config.js');
const langfile = require('./langfile.js');
let plugged = require('./lib/client');
let redis = require('./lib/db/redis_db');
let story = storyboard.mainStory;

storyboard.config({filter: `*:${config.options.loglevel}`});
storyboard.addListener(require('storyboard/lib/listeners/console').default);
story.info(`Starting plugbot version ${require('./package.json').version}`);

moment.locale(langfile.moment_locale);

//noinspection JSUnresolvedFunction
redis.del('user:roles');

redis.exists('meta:data:staff:active').then(ex => {
    if (ex === 0) redis.set('meta:data:staff:active', 1);
});

fs.readdir('./lib/eventhandlers', (err, files) => {
    if (err) {
        story.fatal('Cannot load eventhandlers.', {attach: err});
        process.exit(1);
    } else {
        files.forEach(file => {
            try {
                let h = require(`./lib/eventhandlers/${file}`);
                if (Array.isArray(h.event)) {
                    h.event.forEach(event => {
                        plugged.on(event, h.handler);
                    });
                } else plugged.on(h.event, h.handler);
                story.debug('EventHandlers', `Loaded Handler for Event ${Array.isArray(h.event) ? h.event.join() : h.event}`);
            } catch (e) {
                story.error(`Failed to load eventhandler ${file}`, {attach: e});
                process.exit(1);
            }
        });
    }
});

module.exports = {plugged, app: (config.web.enabled ? require('./web/index').app : null)};
