let Promise = require('bluebird');
let moment = require('moment');

let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let plugged = require('../client');

module.exports = {
    name: 'History',
    enabled: true,
    check: (booth,now)=> {
        return new Promise((resolve, reject) => {
            if (config.history.skipenabled && !config.state.eventmode) {
                redis.exists(`media:history:${now.media.format}:${now.media.cid}`).then(isHis => {
                    if (isHis === 1) { //noinspection JSUnresolvedFunction
                        redis.ttl(`media:history:${now.media.format}:${now.media.cid}`).then(ttl => {
                            //noinspection JSUnresolvedFunction
                            reject({
                                type: 'history',
                                preskip: langfile.skip.history.skip,
                                afterskip: utils.replace(langfile.skip.history.default, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title),
                                    time: moment().subtract((config.history.time * 60) - ttl, 'seconds').fromNow()
                                }),
                                do_lockskip: config.history.lockskip,
                                blacklist: false
                            });
                        });
                    }
                    else resolve();
                }).catch(resolve);
            } else resolve();
        });
    }
};
