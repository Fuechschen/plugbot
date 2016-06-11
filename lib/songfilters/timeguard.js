var Promise = require('bluebird');

var plugged = require('../client');
var langfile = require('../../langfile');
var config = require('../load_config');
var utils = require('../utils');

module.exports = {
    name: 'Timeguard',
    enabled: true,
    check: function (booth, now) {
        return new Promise(function (resolve, reject) {
            if (config.timeguard.enabled && now.media.duration >= config.timeguard.time && !config.state.eventmode) reject({
                type: 'Timeguard',
                preskip: langfile.skip.timeguard.skip,
                afterskip: utils.replace(langfile.skip.timeguard.default, {
                    username: plugged.getUserByID(booth.dj).username,
                    song: utils.songtitle(now.media.author, now.media.title),
                    time: config.timeguard.time
                }),
                do_lockskip: config.timeguard.lockskip,
                blacklist: false
            });
            else resolve();
        });
    }
};