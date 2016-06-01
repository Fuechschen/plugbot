var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['blacklist', 'bl'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    var booth = utils.clone(plugged.getBooth());
                    var media = utils.clone(plugged.getMedia());
                    plugged.sendChat(utils.replace(langfile.blacklist.default, {username: data.username}), 60);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 2);
                    });
                    var split = data.message.trim().split(' ');
                    var reason = utils.blacklistReason(_.rest(split, 1).join(' ').trim());
                    db.blacklist.add(media.format, media.cid, reason).then(function () {
                        setTimeout(function () {
                            if (split.length > 1) {
                                plugged.sendChat(utils.replace(langfile.blacklist.with_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    mod: data.username,
                                    song: utils.songtitle(media.author, media.title),
                                    reason: reason
                                }), 60);
                                db.models.Song.update({
                                    isBanned: true,
                                    ban_reason: reason
                                }, {where: {plug_id: media.id}});
                            } else {
                                plugged.sendChat(utils.replace(langfile.blacklist.without_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(media.author, media.title),
                                    mod: data.username
                                }), 60);
                                db.models.Song.update({isBanned: true}, {where: {plug_id: media.id}});
                            }
                        }, 4 * 1000);
                    });
                    story.info('blacklist', utils.userLogString(data.username, data.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                }
            });
        });
        plugged.removeChatMessage(data.cid);
    }
};