var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require('../db/sql_db');

module.exports = {
    names: ['reloadblacklist', 'reloadbl'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                redis.del('media:blacklist').then(function () {
                    //noinspection JSUnresolvedFunction
                    db.models.Song.findAll({where: {isBanned: true}}).then(function (songs) {
                        songs.forEach(function (song) {
                            redis.hset('media:blacklist', song.format + ':' + song.cid, ((song.ban_reason !== undefined && song.ban_reason !== null) ? song.ban_reason : 1));
                        });
                        plugged.sendChat(utils.replace(langfile.blacklist.reload, {
                            username: data.username,
                            count: songs.length
                        }));
                    });
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};