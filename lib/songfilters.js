let Promise = require('bluebird');
let fs = require('fs');
let story = require('storyboard').mainStory;
let path = require('path');

let songfilters = [];

loadsongfilters();

function loadsongfilters() {
    fs.readdir(path.resolve(__dirname, 'songfilters'), (err, files) => {
        if (err) {
            story.fatal('SongFilters', 'Cannot load songfilters', {attach: err});
            songfilters.push(Promise.resolve());
        } else {
            if (files.length === 0) songfilters.push(Promise.resolve);
            else {
                files.forEach(file => {
                    try {
                        let filter = require(path.resolve(__dirname, 'songfilters', file));  //eslint-disable-line global-require
                        if (filter.enabled) {
                            songfilters.push(filter.check);
                            story.debug('SongFilters', `Loaded singfilter ${filter.name}`);
                        } else story.debug('SongFilters', `Skipping ${filter.name} since it's disabled.`);
                    } catch (e) {
                        story.warn('SongFilters', 'Failed to load songfilter.', {attach: e});
                    }
                });
            }
            story.info('SongFilters', `Loaded ${songfilters.length} songfilters.`);
        }
    });
}

module.exports = songfilters;
