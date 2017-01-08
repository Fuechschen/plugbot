let Promise = require('bluebird');

let plugged = require('../client');
const langfile = require('../../langfile');
const config = require('../load_config');
let utils = require('../utils');

module.exports = {
    name: 'Timeguard',
    enabled: true,
    check: (booth,now)=> {
        return new Promise((resolve, reject) => {
            if (config.timeguard.enabled && now.media.duration >= config.timeguard.time && !config.state.eventmode) reject({
                type: 'Timeguard',
                preskip: langfile.skip.timeguard.skip,
                afterskip: utils.replace(langfile.skip.timeguard.default, {
                    username: plugged.getUserByID(booth.dj).username,
                    song: utils.songtitle(now.media.author, now.media.title),
                    time: config.timeguard.time
                }),
                doLockskip: config.timeguard.lockskip,
                blacklist: false
            });
            else resolve();
        });
    }
};