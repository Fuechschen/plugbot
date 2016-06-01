var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['joinwl'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                plugged.activatePlaylist(config.playlists.play, function () {
                    plugged.joinWaitlist();
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};