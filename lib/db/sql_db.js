var Sequelize = require('sequelize');
var path = require('path');
var story = require('storyboard').mainStory;

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
    CustomCommand: sequelize.import(path.join(__dirname, 'models', 'CustomCommand'))
};

models.Play.belongsTo(models.Song);
models.Song.hasMany(models.Play);
models.Play.belongsTo(models.User);
models.User.hasMany(models.Play);

sequelize.sync();

module.exports = {
    models: models,
    sequelize: sequelize, 
    blacklist: {
        add: function(format, cid, reason){
            if(typeof format === 'object') {
                reason = cid;
                cid = format.cid;
                format = format.format
            }
            if(reason === undefined || reason === null) reason = 1;
            redis.set('media:blacklist:' + format + ':' + cid, reason);
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
            }).spread(function (track) {
                return track.updateAttributes({
                    isBanned: true,
                    ban_reason: (reason === 1) ? null : reason
                });
            });
        },
        remove: function (format, cid) {
            redis.del('media:blacklist:' + format + ':' + cid);
            return models.Song.update({isBanned: false, ban_reason: null}, {where: {cid: cid, format: format}});
        }
    }
};