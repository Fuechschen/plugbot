let Promise = require('bluebird');
let story = require('storyboard').mainStory;

let redis = require('../db/redis_db');
let ytApi = require('../apiConnectors/youTube');
const langfile = require('../../langfile');
const config = require('../load_config');
let utils = require('../utils');
let plugged = require('../client');
let db = require('../db/sql_db');

module.exports = {
    name: 'ChannelBlacklist',
    enabled: true,
    check: (booth,now)=> {
        return new Promise((resolve, reject) => {
            if (config.blacklist.channelblacklist && !config.state.eventmode && now.media.format === 1) {
                ytApi.getSong(now.media).then(media => {
                    //noinspection JSUnresolvedFunction,JSUnresolvedletiable
                    redis.hget('media:channelblacklist', media.snippet.channelId).then(bl => {
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
                                doLockskip: config.blacklist.lockskip,
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
                                doLockskip: config.blacklist.lockskip,
                                blacklist: false
                            });
                        }
                        //noinspection JSUnresolvedletiable
                        db.models.Channel.upsert({cid: media.snippet.channelId, name: media.snippet.channelTitle});
                    });
                }).catch(err => {
                    story.debug('ChannelBlacklist', '', {attach: err});
                    resolve();
                });
            } else resolve();
        });
    }
};