var Promise = require('bluebird');
var moment = require('moment');

var redis = require('../db/redis_db');
var config = require('../load_config');
var utils = require('../utils');
var langfile = require('../../langfile');
var plugged = require('../client');

module.exports = {
    name: 'History',
    enabled: true,
    check: function (booth, now) {
        return new Promise(function (resolve, reject) {
            if (config.history.skipenabled && !config.state.eventmode) {
                redis.exists('media:history:' + now.media.format + ':' + now.media.cid).then(function (isHis) {
                    if (isHis === 1) reject({
                        type: 'History',
                        preskip: langfile.skip.history.skip,
                        afterskip: utils.replace(langfile.skip.history.default, {
                            username: plugged.getUserByID(booth.dj).username,
                            song: utils.songtitle(now.media.author, now.media.title),
                            time: moment().subtract((config.history.time * 60) - ttl, 'seconds').fromNow()
                        }),
                        do_lockskip: config.history.lockskip,
                        blacklist: false
                    });
                    else resolve();
                }).catch(resolve);
            } else resolve();
        });
    }
};
