var Promise = require('bluebird');

var plugged = require('../client');
var langfile = require('../../langfile');
var config = require('../load_config');
var utils = require('../utils');
var youTubeApi = require('../apiConnectors/youTube');

module.exports = {
    name: 'YouTubeGuard',
    enabled: true,
    check: function (booth, now) {
        return new Promise(function (resolve, reject) {
            if (config.youtubeGuard.enabled && now.media.format === 1) {
                youTubeApi.check(now.media).spread(function (skip, reasons) {
                    if (skip) reject({
                        type: 'youtubeguard',
                        preskip: langfile.youtubeGuard.skip,
                        afterskip: utils.replace(reasons.skip, {username: plugged.getUserByID(booth.dj).username}),
                        do_lockskip: config.youtubeGuard.lockskip,
                        blacklist: true,
                        bl_reason: reasons.blacklist
                    });
                    else resolve();
                }).catch(resolve);
            } else resolve();
        });
    }
};