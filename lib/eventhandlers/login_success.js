var plugged = require('../client');
var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var db = require('../db/sql_db');
var redis = require('../db/redis_db');
var config = require('../load_config');

module.exports = function () {
    plugged.cacheChat(true);
    plugged.connect(config.options.room);
    plugged.getAuthToken(function (err, token) {
        if (!err) {
            redis.set('meta:auth:save:jar', JSON.stringify(plugged.getJar())).then(function () {
                redis.set('meta:auth:save:token', token).then(function () {
                    redis.expire('meta:auth:save:token', 604800);
                });
                redis.expire('meta:auth:save:jar', 604800);
            });
        }
    });
    redis.del('media:blacklist').then(function () {
        //noinspection JSUnresolvedFunction
        return db.models.Song.findAll({where: {is_banned: true}});
    }).then(function (songs) {
        return Promise.all(songs.map(function (song) {
            return redis.hset('media:blacklist', song.format + ':' + song.cid, ((song.ban_reason !== undefined && song.ban_reason !== null) ? song.ban_reason : 1));
        }));
    }).then(function (songs) {
        story.info('Loaded blacklist with ' + songs.length + ' entries.');
        return db.models.Channel.findAll({where: {is_banned: true}});
    }).then(function (channels) {
        return Promise.all(channels.map(function (channel) {
            redis.hset('media:channelblacklist', channel.cid, (channel.reason !== null ? channel.reason : 1));
        }));
    }).catch(function (err) {
        story.error('Failed to load blacklist: ', {attach: err});
    });

    story.info('Successfully authed to plug.dj');
};