var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['shuffleplaylist','shufflepl'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                plugged.shufflePlaylist(config.playlists.play);
                plugged.sendChat(utils.replace(langfile.shuffle.default, {username: data.username}));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};