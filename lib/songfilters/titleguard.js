var Promise = require('bluebird');

var plugged = require('../client');
var langfile = require('../../langfile');
var config = require('../load_config');
var utils = require('../utils');

module.exports = {
    name: 'Titleguard',
    enabled: true,
    check: function (booth, now) {
        return new Promise((resolve, reject) => {
            if (config.titleguard.enabled && utils.contains(utils.songtitle(now.media.author, now.media.title), config.titleguard.not_contain) && !config.state.eventmode) reject({
                type: 'titleguard',
                preskip: langfile.titleguard.skip,
                afterskip: utils.replace(langfile.titleguard.contained, {
                    username: plugged.getUserByID(booth.dj).username,
                    song: utils.songtitle(now.media.author, now.media.title)
                }),
                do_lockskip: config.titleguard.lockskip,
                blacklist: false
            });
            else resolve();
        });
    }
};