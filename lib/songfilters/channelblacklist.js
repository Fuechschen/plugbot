var Promise = require('bluebird');

var redis = require('../db/redis_db');
var ytApi = require('../apiConnectors/youTube');
var langfile = require('../../langfile');
var config = require('../load_config');
var utils = require('../utils');

module.exports = {
    name: 'ChannelBlacklist',
    enabled: true,
    check: function (booth, now) {
        return new Promise(function (resolve, reject) {
            if (config.blacklist.channelblacklist && !config.state.eventmode) {
                ytApi.getSong(now.media).then(function (media) {
                    redis.hget('media:channelblacklist', media.snippet.channelId).then(function (bl) {
                        if (bl === null) resolve();
                        else {
                            if (bl === '1') reject({
                                type: 'channelblacklist',
                                preskip: langfile.blacklist.default,
                                afterskip: utils.replace(langfile.blacklist.channelblacklist.skip, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title)
                                }),
                                do_lockskip: config.blacklist.lockskip,
                                blacklist: false
                            });
                            else reject({
                                type: 'channelblacklist',
                                preskip: langfile.blacklist.default,
                                afterskip: utils.replace(langfile.blacklist.channelblacklist.skip_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title),
                                    reason: bl
                                }),
                                do_lockskip: config.blacklist.lockskip,
                                blacklist: false
                            });
                        }
                    });
                }).catch(resolve);
            } else resolve();
        });
    }
};