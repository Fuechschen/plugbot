var Promise = require('bluebird');
var fs = require('fs');
var story = require('storyboard').mainStory;
var path = require('path');

var userfilters = [];

loadfilters();

function loadfilters () {
    fs.readdir(path.resolve(__dirname, 'userfilters'), function (err, files) {
        if (err) {
            story.fatal('UserFilters', 'Cannot load userfilters', {attach: err});
            userfilters.push(Promise.resolve);
        } else {
            if (files.length === 0) userfilters.push(Promise.resolve);
            else {
                files.forEach(function (file) {
                    try {
                        var filter = require(path.resolve(__dirname, 'userfilters', file));
                        if (filter.enabled) {
                            userfilters.push(filter.check);
                            story.debug('UserFilters', 'Loaded userfilter ' + filter.name);
                        } else story.debug('UserFilters', 'Skipping ' + filter.name + ' since it\'s disabled.');
                    } catch (e) {
                        story.warn('UserFilters', 'Failed to load userfilter.', {attach: e});
                    }
                });
            }
            story.info('UserFilters', 'Loaded ' + (userfilters.length) + ' userfilters.');
        }
    });
}

module.exports = {filters: userfilters, timeouts: {}};
