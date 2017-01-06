let Sequelize = require('sequelize');
let path = require('path');
let story = require('storyboard').mainStory;
let Promise = require('bluebird');
let EventEmitter = require('events');

const config = require('../load_config');
let redis = require('./redis_db');

class Database {
    constructor() {
        this.ready = false;
        this.emitter = new EventEmitter();
        let that = this;
        config.sequelize.options.logging = toLog => {
            if (config.options.sql_debug) story.debug('sql', toLog);
        };
        this.sequelize = new Sequelize(config.sequelize.database, config.sequelize.username, config.sequelize.password, config.sequelize.options);

        this.models = {
            User: that.sequelize.import(path.join(__dirname, 'models', 'User')),
            Play: that.sequelize.import(path.join(__dirname, 'models', 'Play')),
            Song: that.sequelize.import(path.join(__dirname, 'models', 'Song')),
            CustomCommand: that.sequelize.import(path.join(__dirname, 'models', 'CustomCommand')),
            Channel: that.sequelize.import(path.join(__dirname, 'models', 'Channel'))
        };

        this.models.Play.belongsTo(this.models.Song);
        this.models.Play.belongsTo(this.models.User);
        this.models.Song.hasMany(this.models.Play);
        this.models.User.hasMany(this.models.Play);

        this.channelblacklist = {
            add: (cid, reason) => {
                return that.models.Channel.upsert({
                    cid,
                    is_banned: true,
                    ban_reason: (reason ? reason : null)
                }).then(() => //noinspection JSUnresolvedFunction
                    redis.hset(
                        'media:blacklist',
                        cid,
                        reason ? reason : '1'
                    ))
            },
            remove: (cid) => {
                return that.models.Channel.update({
                    is_banned: false,
                    ban_reason: null
                }, {where: {cid}}).then(() => //noinspection JSUnresolvedFunction
                    redis.hdel('media:channelblacklist', cid));
            }
        };
        this.blacklist = {
            add: (format, cid, reason) => {
                if (typeof format === 'object') {
                    reason = cid;
                    cid = format.cid;
                    format = format.format
                }
                if (reason === undefined || reason === null) reason = 1;
                return new Promise((resolve, reject) => {
                    //noinspection JSUnresolvedFunction
                    redis.hset('media:blacklist', `${format}:${cid}`, reason).then(() => that.models.Song.findOrCreate({
                        where: {
                            format,
                            cid
                        }, defaults: {
                            format,
                            cid,
                            idBanned: true,
                            ban_reason: (reason === 1) ? null : reason
                        }
                    })).spread(track => track.updateAttributes({
                        is_banned: true,
                        ban_reason: (reason === 1) ? null : reason
                    })).then(resolve).catch(reject);
                });
            },
            remove: (format, cid) => {
                return new Promise((resolve, reject) => {
                    that.models.Song.find({where: {format, cid}}).then(song => {
                        if (song) {
                            return song.update({ban_reason: null, is_banned: false})
                        } else reject('not_found');
                    }).then(() => //noinspection JSUnresolvedFunction
                        redis.hdel('media:blacklist', `${format}:${cid}`)).then(resolve).catch(reject);
                });
            }
        };

        this.sequelize.validate().then(() => {
            story.debug('Database-Connection active.');
            return that.sequelize.sync();
        }).then(() => //noinspection JSUnresolvedFunction
            redis.del('media:blacklist').then(() => //noinspection JSUnresolvedFunction
                that.models.Song.findAll({where: {is_banned: true}})).then(songs => Promise.all(songs.map(song => //noinspection JSUnresolvedFunction
                redis.hset(
                    'media:blacklist',
                    `${song.format}:${song.cid}`,
                    (song.ban_reason) ? song.ban_reason : 1
                )))).then(songs => {
                story.info(`Loaded blacklist with ${songs.length} entries.`);
                //noinspection JSUnresolvedFunction
                return that.models.Channel.findAll({where: {is_banned: true}});
            }).then(channels => Promise.all(channels.map(channel => {
                //noinspection JSUnresolvedFunction
                redis.hset('media:channelblacklist', channel.cid, (channel.reason !== null ? channel.reason : 1));
            }))).then(() => {
                that.ready = true;
                that.emitter.emit('ready');
            }).catch(err => {
                story.error('Failed to load blacklist: ', {attach: err});
            })).catch(err => {
            story.error('Could not connect to database', {attach: err});
            process.exit(1);
        });
    }
}

module.exports = new Database();