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
    }).catch(function (err) {
        story.error('Failed to load blacklist: ', {attach: err});
    });

    var cckeys = Object.keys(config.defaultCC);

    Promise.all(cckeys.map(function (key) {
        return db.models.CustomCommand.upsert({
            trigger: key,
            message: config.defaultCC[key].msg,
            senderinfo: config.defaultCC[key].sender
        });
    })).then(function () {
        //noinspection JSUnresolvedFunction
        db.models.CustomCommand.findAll({where: {status: true}}).then(function (ccs) {
            return Promise.all(ccs.map(function (cc) {
                if (cc.senderinfo) return redis.hset('customcommands:command:sender', cc.trigger, cc.message);
                else return redis.hset('customcommands:command:nosender', cc.trigger, cc.message);
            }));
        }).then(function (ccs) {
            story.info('Loaded ' + ccs.length + ' customcommands.');
        }).catch(function (err) {
            story.error('Failed to load customcommands: ', {attach: err});
        });
    });

    story.info('Successfully authed to plug.dj');
};