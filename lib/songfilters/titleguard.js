let Promise = require('bluebird');

let plugged = require('../client');
const langfile = require('../../langfile');
const config = require('../load_config');
let utils = require('../utils');

module.exports = {
    name: 'Titleguard',
    enabled: true,
    check: (booth,now)=> {
        return new Promise((resolve, reject) => {
            if (config.titleguard.enabled && !config.state.eventmode && (utils.contains(utils.songtitle(now.media.author, now.media.title), config.titleguard.not_contain) || (config.titleguard.regex_match !== null ? config.titleguard.regex_match.test(utils.songtitle(now.media.author, now.media.title)) : false))) reject({
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