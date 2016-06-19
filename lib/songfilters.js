var Promise = require('bluebird');
var fs = require('fs');
var story = require('storyboard').mainStory;
var path = require('path');
var _ = require('underscore');

var songfilters = [];

loadsongfilters();

function loadsongfilters() {
    fs.readdir(path.resolve(__dirname, 'songfilters'), function (err, files) {
        if (err) {
            story.fatal('SongFilters', 'Cannot load songfilters', {attach: err});
            songfilters.push(Promise.resolve());
        } else {
            if (files.length === 0) songfilters.push(Promise.resolve);
            else {
                files.forEach(function (file) {
                    try {
                        var filter = require(path.resolve(__dirname, 'songfilters', file));
                        if (filter.enabled) {
                            songfilters.push(filter.check);
                            story.debug('SongFilters', 'Loaded singfilter ' + filter.name);
                        } else story.debug('SongFilters', 'Skipping ' + filter.name + ' since it\'s disabled.');
                    } catch (e) {
                        story.warn('SongFilters', 'Failed to load songfilter.', {attach: e});
                    }
                });
            }
            story.info('SongFilters', 'Loaded ' + (songfilters.length) + ' songfilters.');
        }
    });
}

module.exports = songfilters;
