var story = require('storyboard').mainStory;
var URL = require('url');
var request = require('request');
var S = require('string');
var validator = require('validator');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require('../db/sql_db');

module.exports = {
    names: ['unblacklist', 'rmbl', 'unbl'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                if (split.length === 2) {
                    if (validator.isURL(split[1], {
                            protocols: ['https'],
                            host_whitelist: ['youtube.com', 'youtu.be', 'soundcloud.com', 'www.youtube.com']
                        })) {
                        var url = URL.parse(split[1], true);
                        if (url.hostname === 'youtu.be') {
                            //noinspection JSUnresolvedFunction
                            var cid = S(url.pathname).replaceAll('/', '').s;
                            db.blacklist.remove(1, cid).then(function (song) {
                                if (song !== null && song !== undefined) {
                                    db.blacklist.remove(song.format, song.cid);
                                    plugged.sendChat(utils.replace(langfile.blacklist.unbl.default, {
                                        username: data.username,
                                        song: utils.songtitle(song.author, song.title)
                                    }), 30);
                                    story.info('unbl', utils.userLogString(data.username, data.id) + ' removed ' + utils.songtitle(song.author, song.title) + '[' + song.format + ':' + song.cid + '] from the blacklist.');
                                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                    username: data.username,
                                    cmd: 'UnBl'
                                }), 20);
                            });
                        } else { //noinspection JSUnresolvedVariable
                            if (url.hostname === 'www.youtube.com' && url.query.v !== undefined) {
                                //noinspection JSUnresolvedVariable
                                db.models.Song.find({where: {format: 1, cid: url.query.v}}).then(function (song) {
                                    if (song !== undefined && song !== null) {
                                        db.blacklist.remove(song.format, song.cid);
                                        plugged.sendChat(utils.replace(langfile.blacklist.unbl.default, {
                                            username: data.username,
                                            song: utils.songtitle(song.author, song.title)
                                        }), 30);
                                        story.info('unbl', utils.userLogString(data.username, data.id) + ' removed ' + utils.songtitle(song.author, song.title) + '[' + song.format + ':' + song.cid + '] from the blacklist.');
                                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                        username: data.username,
                                        cmd: 'UnBl'
                                    }), 20);
                                });
                            } else if (url.hostname === 'soundcloud.com') {
                                request.get('http://api.soundcloud.com/resolve?url=' + split[1] + '&client_id=' + config.apiKeys.soundcloud, function (err, resp, body) {
                                    if (!err && resp.statusCode === 200) {
                                        body = JSON.parse(body);
                                        db.models.Song.find({where: {format: 2, cid: body.id}}).then(function (song) {
                                            if (song !== undefined && song !== null) {
                                                utils.unblacklist(song.format, song.cid);
                                                plugged.sendChat(utils.replace(langfile.blacklist.unbl.default, {
                                                    username: data.username,
                                                    song: utils.songtitle(song.author, song.title)
                                                }), 30);
                                                story.info('unbl', utils.userLogString(data.username, data.id) + ' removed ' + utils.songtitle(song.author, song.title) + '[' + song.format + ':' + song.cid + '] from the blacklist.');
                                            } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                                username: data.username,
                                                cmd: 'UnBl'
                                            }), 20);
                                        })
                                    }
                                });
                            } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                username: data.username,
                                cmd: 'UnBl'
                            }), 20);
                        }
                    } else {
                        var args = split[1].split(':');
                        if (args.length === 2 && ['1', '2'].indexOf(args[0]) !== -1) {
                            db.models.Song.find({
                                where: {
                                    isBanned: true,
                                    format: args[0],
                                    cid: args[1]
                                }
                            }).then(function (song) {
                                if (song !== null && song !== undefined) {
                                    db.blacklist.remove(args[0], args[1]);
                                    plugged.sendChat(utils.replace(langfile.blacklist.unbl.default, {
                                        username: data.username,
                                        song: utils.songtitle(song.author, song.title)
                                    }), 30);
                                    story.info('unbl', utils.userLogString(data.username, data.id) + ' removed ' + utils.songtitle(song.author, song.title) + '[' + song.format + ':' + song.cid + '] from the blacklist.');
                                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                    username: data.username,
                                    cmd: 'UnBl'
                                }), 20);
                            });
                        } else plugged.sendChat(utils.replace(langfile.error.argument, {
                            username: data.username,
                            cmd: 'UnBl'
                        }), 20);
                    }
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'UnBl'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};