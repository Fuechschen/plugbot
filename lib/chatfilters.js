var Promise = require('bluebird');
var fs = require('fs');
var story = require('storyboard').mainStory;
var path = require('path');
var CronJob = require('cron').CronJob;

var redis = require('./db/redis_db');
var config = require('./load_config');

var chatfilters = [];

var strings = {};

loadChatfilters();

function loadChatfilters() {
    fs.readdir(path.resolve(__dirname, 'chatfilters'), function (err, files) {
        if (err) {
            story.fatal('ChatFilters', 'Cannot load chatfilters', {attach: err});
            chatfilters.push(Promise.resolve());
        } else {
            if (files.length === 0) chatfilters.push(Promise.resolve);
            else {
                files.forEach(function (file) {
                    try {
                        var filter = require(path.resolve(__dirname, 'chatfilters', file));
                        if (filter.enabled) {
                            chatfilters.push(filter.check);
                            strings[filter.type] = filter.strings;
                            story.debug('ChatFilters', 'Loaded chatfilter ' + filter.name);
                        } else story.debug('ChatFilters', 'Skipping ' + filter.name + ' since it\'s disabled.');
                    } catch (e) {
                        story.warn('ChatFilters', 'Failed to load chatfilter.', {attach: e});
                    }
                });
            }
            story.info('ChatFilters', 'Loaded ' + (chatfilters.length) + ' chatfilters.');
        }
    });
}

module.exports = {
    filters: chatfilters,
    resolveMsg: function (type) {
        return strings[type];
    },
    _: {
        strings: strings
    },
    cron: new CronJob('0 1 * * * *', function () {
        //noinspection JSUnresolvedFunction
        redis.hkeys('spam:user:spampoints').then(function (keys) {
            return Promise.all(keys.map(function (key) {
                //noinspection JSUnresolvedFunction
                return redis.hincrby('spam:user:spampoints', key, (0 - config.chatfilter.spam.points)).then(function (point) {
                    if (point < 0) { //noinspection JSUnresolvedFunction
                        return redis.hset('spam:user:spampoints', key, 0);
                    }
                    else return Promise.resolve();
                });
            }));
        });
    }, null, true)
};