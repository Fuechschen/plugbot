var Sequelize = require('sequelize');
var path = require('path');
var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var config = require('../load_config');
var redis = require('./redis_db');

config.sequelize.options.logging = function (toLog) {
    story.debug('sql', toLog);
};

var sequelize = new Sequelize(config.sequelize.database, config.sequelize.username, config.sequelize.password, config.sequelize.options);
var models = {
    User: sequelize.import(path.join(__dirname, 'models', 'User')),
    Play: sequelize.import(path.join(__dirname, 'models', 'Play')),
    Song: sequelize.import(path.join(__dirname, 'models', 'Song')),
    CustomCommand: sequelize.import(path.join(__dirname, 'models', 'CustomCommand')),
    Channel: sequelize.import(path.join(__dirname, 'models', 'Channel'))
};

models.Play.belongsTo(models.Song);
models.Song.hasMany(models.Play);
models.Play.belongsTo(models.User);
models.User.hasMany(models.Play);

sequelize.sync();

module.exports = {
    models: models,
    sequelize: sequelize,
    channelblacklist: {
        add: function (cid, reason) {
            return db.models.Channel.upsert({
                cid: cid,
                is_banned: true,
                ban_reason: (reason !== null && reason !== undefined ? reason : null)
            }).then(function () {
                return redis.hset('media:blacklist', cid, (reason !== null && reason !== undefined ? reason : '1'))
            })
        },
        remove: function (cid) {
            return db.models.Channel.update({
                is_banned: false,
                ban_reason: null
            }, {where: {cid: cid}}).then(function () {
                return redis.hdel('media:channelblacklist', cid);
            });
        }
    },
    blacklist: {
        add: function (format, cid, reason) {
            if (typeof format === 'object') {
                reason = cid;
                cid = format.cid;
                format = format.format
            }
            if (reason === undefined || reason === null) reason = 1;
            return new Promise(function (resolve, reject) {
                redis.hset('media:blacklist', format + ':' + cid, reason).then(function () {
                    return models.Song.findOrCreate({
                        where: {
                            format: format,
                            cid: cid
                        }, defaults: {
                            format: format,
                            cid: cid,
                            idBanned: true,
                            ban_reason: (reason === 1) ? null : reason
                        }
                    });
                }).spread(function (track) {
                    return track.updateAttributes({
                        is_banned: true,
                        ban_reason: (reason === 1) ? null : reason
                    });
                }).then(resolve).catch(reject);
            });
        },
        remove: function (format, cid) {
            return new Promise(function (resolve, reject) {
                models.Song.find({where: {format: format, cid: cid}}).then(function (song) {
                    if (song !== null && song !== undefined) {
                        return song.update({ban_reason: null, is_banned: false})
                    } else reject('not_found');
                }).then(function () {
                    return redis.hdel('media:blacklist', format + ':' + cid);
                }).then(resolve).catch(reject);
            });
        }
    }
};