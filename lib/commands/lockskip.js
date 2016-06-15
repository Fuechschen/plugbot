var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['lockskip', 'ls'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    plugged.sendChat(utils.replace(langfile.skip.lockskip, {username: data.username}), 70);
                    var booth = utils.clone(plugged.getBooth());
                    var media = utils.clone(plugged.getMedia());
                    plugged.setLock(true, false);
                    plugged.setCycle(true);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 2);
                    });
                    if (booth.shouldCycle !== plugged.doesWaitlistCycle()) plugged.setCycle(booth.shouldCycle);
                    if (booth.isLocked !== plugged.isWaitlistLocked()) plugged.setLock(booth.isLocked, false);
                    if (config.lockskip.move_pos !== undefined) plugged.moveDJ(booth.dj, config.lockskip.move_pos);
                    setTimeout(function () {
                        var split = data.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]] !== undefined) {
                            plugged.sendChat(utils.replace(langfile.skip.reasons[split[1]], {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(media.author, media.title)
                            }), 60);
                        }
                    }, 4 * 1000);
                    story.info('lockskip', utils.userLogString(data.username, data.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                }
            });
        });
        plugged.removeChatMessage(data.cid);
    }
};