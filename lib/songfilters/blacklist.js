let Promise = require('bluebird');

let redis = require('../db/redis_db');
const langfile = require('../../langfile');
const config = require('../load_config');
let utils = require('../utils');
let plugged = require('../client');

module.exports = {
    name: 'Blacklist',
    enabled: true,
    check: (booth, now) => {
        return new Promise((resolve, reject) => {
            //noinspection JSUnresolvedFunction
            redis.hget('media:blacklist', `${now.media.format}:${now.media.cid}`).then(blentry => {
                if (blentry === null) resolve();
                else reject({
                    type: 'blacklist',
                    preskip: langfile.blacklist.skipFirst,
                    afterskip: (() => {
                        if (blentry !== '1') return utils.replace(langfile.blacklist.skipReason, {
                            username: plugged.getUserByID(booth.dj).username,
                            song: utils.songtitle(now.media.author, now.media.title),
                            reason: blentry
                        });
                        return utils.replace(langfile.blacklist.skip, {
                            username: plugged.getUserByID(booth.dj).username,
                            song: utils.songtitle(now.media.author, now.media.title)
                        });
                    })(),
                    doLockskip: config.blacklist.lockskip,
                    blacklist: false
                });
            }).catch(resolve);
        });
    }
};