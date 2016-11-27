let Promise = require('bluebird');

let plugged = require('../client');
const langfile = require('../../langfile');
const config = require('../load_config');
let utils = require('../utils');
let youTubeApi = require('../apiConnectors/youTube');

module.exports = {
    name: 'YouTubeGuard',
    enabled: true,
    check: (booth,now)=> {
        return new Promise((resolve, reject) => {
            if (now.media.format === 1) {
                if (config.youtubeGuard.block) reject({
                    type: 'youtubeguard',
                    preskip: langfile.youtubeGuard.skip,
                    afterskip: utils.replace(langfile.youtubeGuard.block, {username: plugged.getUserByID(booth.dj).username}),
                    do_lockskip: config.youtubeGuard.lockskip,
                    blacklist: false
                });
                else if (config.youtubeGuard.enabled && now.media.format === 1) {
                    youTubeApi.check(now.media).spread((skip, reasons, blacklist) => {
                        if (skip) reject({
                            type: 'youtubeguard',
                            preskip: langfile.youtubeGuard.skip,
                            afterskip: utils.replace(reasons.skip, {username: plugged.getUserByID(booth.dj).username}),
                            do_lockskip: config.youtubeGuard.lockskip,
                            blacklist: (!!blacklist),
                            bl_reason: (reasons.blacklist ? reasons.blacklist : undefined)
                        });
                        else resolve();
                    }).catch(resolve);
                } else resolve();
            } else resolve();
        });
    }
};