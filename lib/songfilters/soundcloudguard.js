let Promise = require('bluebird');

let plugged = require('../client');
const langfile = require('../../langfile');
const config = require('../load_config');
let utils = require('../utils');
let soundCloudApi = require('../apiConnectors/soundCloud');

module.exports = {
    name: 'SoundCloudGuard',
    enabled: true,
    check: (booth,now)=> {
        return new Promise((resolve, reject) => {
            if(now.media.format === 2){
                if (config.soundcloudGuard.block) reject({
                    type: 'soundcloudguard',
                    preskip: langfile.soundcloudGuard.skip,
                    afterskip: utils.replace(langfile.soundcloudGuard.block, {username: plugged.getUserByID(booth.dj).username}),
                    doLockskip: config.soundcloudGuard.lockskip,
                    blacklist: false
                });
                else if (config.soundcloudGuard.enabled) {
                    soundCloudApi.check(now.media).spread((skip, reasons) => {
                        if (skip) reject({
                            type: 'soundcloudguard',
                            preskip: langfile.soundcloudGuard.skip,
                            afterskip: utils.replace(reasons.skip, {username: plugged.getUserByID(booth.dj).username}),
                            doLockskip: config.soundcloudGuard.lockskip,
                            blacklist: true,
                            blReason: reasons.blacklist
                        });
                        else resolve();
                    }).catch(resolve);
                } else resolve();
            } else resolve();
        });
    }
};