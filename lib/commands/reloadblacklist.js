var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require('../db/sql_db');

module.exports = {
    names: ['reloadblacklist', 'reloadbl'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                redis.keys('media:blacklist:*').then(function (keys) {
                    keys.forEach(function (key) {
                        redis.del(key);
                    });
                    setTimeout(function () {
                        db.models.Song.findAll({where: {isBanned: true}}).then(function (songs) {
                            songs.forEach(function (song) {
                                redis.set('media:blacklist:' + song.format + ':' + song.cid, ((song.ban_reason !== undefined && song.ban_reason !== null) ? song.ban_reason : 1));
                            });
                            plugged.sendChat(utils.replace(langfile.blacklist.reload, {
                                username: data.username,
                                count: songs.length
                            }));
                        });
                    }, 300);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};