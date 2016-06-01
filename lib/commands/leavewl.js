var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var langfile = require('../../langfile');

module.exports = {
    names: ['leavewl'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                plugged.leaveWaitlist(function () {
                    plugged.activatePlaylist(config.playlists.none);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};