var Promise = require('bluebird');
var story = require('storyboard').mainStory;

var redis = require('../db/redis_db');
var ytApi = require('../apiConnectors/youTube');
var langfile = require('../../langfile');
var config = require('../load_config');
var utils = require('../utils');
var plugged = require('../client');
var db = require('../db/sql_db');

module.exports = {
    name: 'ChannelBlacklist',
    enabled: true,
    check: function (booth, now) {
        return new Promise(function (resolve, reject) {
            if (config.blacklist.channelblacklist && !config.state.eventmode && now.media.format === 1) {
                ytApi.getSong(now.media).then(function (media) {
                    //noinspection JSUnresolvedFunction,JSUnresolvedVariable
                    redis.hget('media:channelblacklist', media.snippet.channelId).then(function (bl) {
                        if (bl === null) {
                            resolve();
                        } else {
                            if (bl === '1') reject({
                                type: 'channelblacklist',
                                preskip: langfile.blacklist.skip_first,
                                afterskip: utils.replace(langfile.blacklist.channelblacklist.skip, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title)
                                }),
                                do_lockskip: config.blacklist.lockskip,
                                blacklist: false
                            });
                            else reject({
                                type: 'channelblacklist',
                                preskip: langfile.blacklist.skip_first,
                                afterskip: utils.replace(langfile.blacklist.channelblacklist.skip_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title),
                                    reason: bl
                                }),
                                do_lockskip: config.blacklist.lockskip,
                                blacklist: false
                            });
                        }
                        //noinspection JSUnresolvedVariable
                        db.models.Channel.upsert({cid: media.snippet.channelId, name: media.snippet.channelTitle});
                    });
                }).catch(function (err) {
                    story.debug('ChannelBlacklist', '', {attach: err});
                    resolve();
                });
            } else resolve();
        });
    }
};