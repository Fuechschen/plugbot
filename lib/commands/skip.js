var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['skip', 'fs'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                perm = parseInt(perm, 10);
                var booth = utils.clone(plugged.getBooth());
                var media = utils.clone(plugged.getMedia());
                if (perm > 1 && ex === 0) {
                    plugged.sendChat(utils.replace(langfile.skip.default, {username: data.username}), 70);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 2);
                    });
                    setTimeout(function () {
                        var split = data.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]] !== undefined) {
                            plugged.sendChat(utils.replace(langfile.skip.reasons[split[1]], {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(media.author, media.title)
                            }), 60);
                        }
                    }, 4 * 1000);
                    story.info('skip', utils.userLogString(data.username, data.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                } else if (perm === 1 && ex === 0 && config.rdjskip.enabled) {
                    redis.sismember('meta:data:rdjskip:votes', data.id).then(function (is) {
                        if (is === 0) {
                            redis.get('meta:data:staff:active').then(function (active) {
                                active = parseInt(active, 10);
                                if (active <= config.rdjskip.max_staff_active) {
                                    redis.scard('meta:data:rdjskip:votes').then(function (card) {
                                        if (card + 1 >= config.rdjskip.votes) {
                                            plugged.sendChat(utils.replace(langfile.rdjskip.skip, {username: data.username}));
                                            story.info('skip', utils.userLogString(data.username, data.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                                        } else {
                                            redis.sadd('meta:data:rdjskip:votes', data.id).then(function () {
                                                plugged.sendChat(utils.replace(langfile.rdjskip.default, {username: data.username}));
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
        plugged.removeChatMessage(data.cid);
    }
};