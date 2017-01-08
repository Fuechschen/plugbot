let story = require('storyboard').mainStory;
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require('../db/sql_db');

module.exports = {
    names: ['blacklist', 'bl'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            redis.exists('meta:state:skipable').then(ex => {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    let booth = utils.clone(plugged.getBooth());
                    let media = utils.clone(plugged.getMedia());
                    plugged.sendChat(utils.replace(langfile.blacklist.default, {username: data.username}), 60);
                    if (config.blacklist.lockskip) {
                        //noinspection JSUnresolvedFunction
                        plugged.setCyclePromise(true).then(() => //noinspection JSUnresolvedFunction
                        plugged.skipDJPromise(booth.dj)).then(() => {
                            if (config.lockskip.movePos) plugged.moveDJ(booth.dj, config.lockskip.movePos);
                            return Promise.resolve();
                        }).then(() => {
                            if (booth.shouldCycle !== plugged.doesWaitlistCycle()) { //noinspection JSUnresolvedFunction
                                return plugged.setCyclePromise(booth.shouldCycle);
                            }
                           return Promise.resolve();
                        }).catch(err => {
                            story.error('Error while lockskipping.', {attach: err});
                        });
                    } else plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1, 'EX', 2);
                    let split = data.message.trim().split(' ');
                    //noinspection JSCheckFunctionSignatures
                    let reason = utils.blacklistReason(_.rest(split, 1).join(' ').trim());
                    db.blacklist.add(media.format, media.cid, reason).then(() => {
                        setTimeout(() => {
                            if (split.length > 1) {
                                plugged.sendChat(utils.replace(langfile.blacklist.with_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    mod: data.username,
                                    song: utils.songtitle(media.author, media.title),
                                    reason
                                }), 60);
                                db.models.Song.update({
                                    isBanned: true,
                                    banReason: reason
                                }, {where: {plugId: media.id}});
                            } else {
                                plugged.sendChat(utils.replace(langfile.blacklist.without_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(media.author, media.title),
                                    mod: data.username
                                }), 60);
                                db.models.Song.update({isBanned: true}, {where: {plugId: media.id}});
                            }
                        }, 4 * 1000);
                    });
                    story.info('blacklist', `${utils.userLogString(data.username, data.id)}: ${utils.mediatitlelog(media)} played by ${utils.userLogString(plugged.getUserByID(booth.dj))}`);
                }
            });
        });
        plugged.removeChatMessage(data.cid);
    }
};