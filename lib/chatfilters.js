let Promise = require('bluebird');
let fs = require('fs');
let story = require('storyboard').mainStory;
let path = require('path');
let CronJob = require('cron').CronJob;

let redis = require('./db/redis_db');
const config = require('./load_config');

let chatfilters = [];

let strings = {};

loadChatfilters();

function loadChatfilters() {
    fs.readdir(path.resolve(__dirname, 'chatfilters'), (err, files) => {
        if (err) {
            story.fatal('ChatFilters', 'Cannot load chatfilters', {attach: err});
            chatfilters.push(Promise.resolve());
        } else {
            if (files.length === 0) chatfilters.push(Promise.resolve);
            else {
                files.forEach(file => {
                    try {
                        let filter = require(path.resolve(__dirname, 'chatfilters', file));  //eslint-disable-line global-require
                        if (filter.enabled) {
                            chatfilters.push(filter.check);
                            strings[filter.type] = filter.strings;
                            story.debug('ChatFilters', `Loaded chatfilter ${filter.name}`);
                        } else story.debug('ChatFilters', `Skipping ${filter.name} since it's disabled.`);
                    } catch (e) {
                        story.warn('ChatFilters', 'Failed to load chatfilter.', {attach: e});
                    }
                });
            }
            story.info('ChatFilters', `Loaded ${chatfilters.length} chatfilters.`);
        }
    });
}

module.exports = {
    filters: chatfilters,
    resolveMsg:  (type)=> strings[type],
    _: {strings},
    cron: new CronJob('0 1 * * * *', () => {
        //noinspection JSUnresolvedFunction
        redis.hkeys('spam:user:spampoints').then(keys => Promise.all(keys.map(key => //noinspection JSUnresolvedFunction
        redis.hincrby('spam:user:spampoints', key, (0 - config.chatfilter.spam.points)).then(point => {
            if (point < 0) { //noinspection JSUnresolvedFunction
                return redis.hset('spam:user:spampoints', key, 0);
            }
            return Promise.resolve();
        }))));
    }, null, true)
};