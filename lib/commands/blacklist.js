var story = require('storyboard').mainStory;
var _ = require('underscore');


var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require('../db/sql_db');

module.exports = {
    names: ['blacklist', 'bl'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            redis.exists('meta:state:skipable').then(ex => {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    var booth = utils.clone(plugged.getBooth());
                    var media = utils.clone(plugged.getMedia());
                    plugged.sendChat(utils.replace(langfile.blacklist.default, {username: data.username}), 60);
                    if (config.blacklist.lockskip) {
                        //noinspection JSUnresolvedFunction
                        plugged.setCyclePromise(true).then(() => //noinspection JSUnresolvedFunction
                        plugged.skipDJPromise(booth.dj)).then(() => {
                            if (config.lockskip.move_pos !== undefined) plugged.moveDJ(booth.dj, config.lockskip.move_pos);
                            return Promise.resolve();
                        }).then(() => {
                            if (booth.shouldCycle !== plugged.doesWaitlistCycle()) { //noinspection JSUnresolvedFunction
                                return plugged.setCyclePromise(booth.shouldCycle);
                            }
                            else Promise.resolve();
                        }).catch(err => {
                            story.error('Error while lockskipping.', {attach: err});
                        });
                    } else plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1, 'EX', 2);
                    var split = data.message.trim().split(' ');
                    //noinspection JSCheckFunctionSignatures
                    var reason = utils.blacklistReason(_.rest(split, 1).join(' ').trim());
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
                                    is_banned: true,
                                    ban_reason: reason
                                }, {where: {plug_id: media.id}});
                            } else {
                                plugged.sendChat(utils.replace(langfile.blacklist.without_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(media.author, media.title),
                                    mod: data.username
                                }), 60);
                                db.models.Song.update({is_banned: true}, {where: {plug_id: media.id}});
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