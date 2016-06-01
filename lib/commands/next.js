var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['next'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 0) {
                plugged.getPlaylist(config.playlists.play, function (err, list) {
                    if (!err) {
                        if ((plugged.getCurrentDJ() !== undefined ? plugged.getCurrentDJ().id === plugged.getSelf().id : false)) {
                            plugged.sendChat(utils.replace(langfile.next.default, {
                                username: data.username,
                                title: utils.mediatitle(list[1])
                            }));
                        } else {
                            plugged.sendChat(utils.replace(langfile.next.default, {
                                username: data.username,
                                title: utils.mediatitle(list[0])
                            }));
                        }
                    }
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};