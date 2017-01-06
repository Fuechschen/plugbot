let story = require('storyboard').mainStory;
let URL = require('url');
let request = require('request');
let S = require('string');
let validator = require('validator');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require('../db/sql_db');

module.exports = {
    names: ['unblacklist', 'rmbl', 'unbl'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                let split = data.message.trim().split(' ');
                if (split.length === 2) {
                    if (validator.isURL(split[1], {
                            protocols: ['https'],
                            host_whitelist: ['youtube.com', 'youtu.be', 'soundcloud.com', 'www.youtube.com']
                        })) {
                        let url = URL.parse(split[1], true);
                        if (url.hostname === 'youtu.be') {
                            //noinspection JSUnresolvedFunction
                            let cid = S(url.pathname).replaceAll('/', '').s;
                            db.blacklist.remove(1, cid).then(song => {
                                if (song) {
                                    db.blacklist.remove(song.format, song.cid);
                                    plugged.sendChat(utils.replace(langfile.blacklist.unbl.default, {
                                        username: data.username,
                                        song: utils.songtitle(song.author, song.title)
                                    }), 30);
                                    story.info('unbl', `${utils.userLogString(data.username, data.id)} removed ${utils.songtitle(song.author, song.title)}[${song.format}:${song.cid}] from the blacklist.`);
                                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                    username: data.username,
                                    cmd: 'UnBl'
                                }), 20);
                            });
                        } else { //noinspection JSUnresolvedletiable
                            if (url.hostname === 'www.youtube.com' && url.query.v) {
                                //noinspection JSUnresolvedletiable
                                db.models.Song.find({where: {format: 1, cid: url.query.v}}).then(song => {
                                    if (song) {
                                        db.blacklist.remove(song.format, song.cid);
                                        plugged.sendChat(utils.replace(langfile.blacklist.unbl.default, {
                                            username: data.username,
                                            song: utils.songtitle(song.author, song.title)
                                        }), 30);
                                        story.info('unbl', `${utils.userLogString(data.username, data.id)} removed ${utils.songtitle(song.author, song.title)}[${song.format}:${song.cid}] from the blacklist.`);
                                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                        username: data.username,
                                        cmd: 'UnBl'
                                    }), 20);
                                });
                            } else if (url.hostname === 'soundcloud.com') {
                                request.get(`http://api.soundcloud.com/resolve?url=${split[1]}&client_id=${config.apiKeys.soundcloud}`, (err, resp, body) => {
                                    if (!err && resp.statusCode === 200) {
                                        body = JSON.parse(body);
                                        db.models.Song.find({where: {format: 2, cid: body.id}}).then(song => {
                                            if (song) {
                                                db.blacklist.remove(song.format, song.cid);
                                                plugged.sendChat(utils.replace(langfile.blacklist.unbl.default, {
                                                    username: data.username,
                                                    song: utils.songtitle(song.author, song.title)
                                                }), 30);
                                                story.info('unbl', `${utils.userLogString(data.username, data.id)} removed ${utils.songtitle(song.author, song.title)}[${song.format}:${song.cid}] from the blacklist.`);
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
                        let args = split[1].split(':');
                        if (args.length === 2 && ['1', '2'].includes(args[0])) {
                            db.models.Song.find({
                                where: {
                                    is_banned: true,
                                    format: args[0],
                                    cid: args[1]
                                }
                            }).then(song => {
                                if (song) {
                                    db.blacklist.remove(args[0], args[1]);
                                    plugged.sendChat(utils.replace(langfile.blacklist.unbl.default, {
                                        username: data.username,
                                        song: utils.songtitle(song.author, song.title)
                                    }), 30);
                                    story.info('unbl', `${utils.userLogString(data.username, data.id)} removed ${utils.songtitle(song.author, song.title)}[${song.format}:${song.cid}] from the blacklist.`);
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