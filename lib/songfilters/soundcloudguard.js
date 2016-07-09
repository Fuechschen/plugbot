var Promise = require('bluebird');

var plugged = require('../client');
var langfile = require('../../langfile');
var config = require('../load_config');
var utils = require('../utils');
var soundCloudApi = require('../apiConnectors/soundCloud');

module.exports = {
    name: 'SoundCloudGuard',
    enabled: true,
    check: function (booth, now) {
        return new Promise(function (resolve, reject) {
            if(now.media.format === 2){
                if (config.soundcloudGuard.block) reject({
                    type: 'soundcloudguard',
                    preskip: langfile.soundcloudGuard.skip,
                    afterskip: utils.replace(langfile.soundcloudGuard.block, {username: plugged.getUserByID(booth.dj).username}),
                    do_lockskip: config.soundcloudGuard.lockskip,
                    blacklist: false
                });
                else if (config.soundcloudGuard.enabled) {
                    soundCloudApi.check(now.media).spread(function (skip, reasons) {
                        if (skip) reject({
                            type: 'soundcloudguard',
                            preskip: langfile.soundcloudGuard.skip,
                            afterskip: utils.replace(reasons.skip, {username: plugged.getUserByID(booth.dj).username}),
                            do_lockskip: config.soundcloudGuard.lockskip,
                            blacklist: true,
                            bl_reason: reasons.blacklist
                        });
                        else resolve();
                    }).catch(resolve);
                } else resolve();
            } else resolve();
        });
    }
};