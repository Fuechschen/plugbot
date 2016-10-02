var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var langfile = require('../../langfile');

module.exports = {
    names: ['leavewl'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                plugged.leaveWaitlist(() => {
                    plugged.activatePlaylist(config.playlists.none);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};