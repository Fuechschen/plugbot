var story = require('storyboard').mainStory;
var request = require('request');
var moment = require("moment");

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');

var youTubeApi = require('../apiConnectors/youTube');
var soundCloudApi = require('../apiConnectors/soundCloud');

var websocketUpdate = require('../../web/index').wsGet('advance');

var timeouts = {
    stuck: null,
    tskip: null
};

module.exports = function (booth, now, prev) {
    booth = utils.clone(booth);
    now = utils.clone(now);
    prev = utils.clone(prev);
    if (booth.dj !== undefined) {
        redis.hexists('media:blacklist', now.media.format + ':' + now.media.cid).then(function (exb) {
            if (exb === 1 && plugged.getMedia().id === now.media.id) {
                redis.hget('media:blacklist', now.media.format + ':' + now.media.cid).then(function (track) {
                    plugged.sendChat(langfile.blacklist.skip_first);
                    plugged.skipDJ(booth.dj, now.historyID);
                    setTimeout(function () {
                        if (track !== '1') {
                            plugged.sendChat(utils.replace(langfile.blacklist.skip_reason, {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(now.media.author, now.media.title),
                                reason: track
                            }), 120);
                        } else {
                            plugged.sendChat(utils.replace(langfile.blacklist.skip, {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(now.media.author, now.media.title)
                            }), 120);
                        }
                    }, 4 * 1000);
                });
            } else {
                redis.exists('media:history:' + now.media.format + ':' + now.media.cid).then(function (exh) {
                    if (exh === 1 && config.history.skipenabled && !config.state.eventmode && plugged.getMedia().id === now.media.id) {
                        plugged.skipDJ(booth.dj, now.historyID);
                        redis.ttl('media:history:' + now.media.format + ':' + now.media.cid).then(function (ttl) {
                            plugged.sendChat(langfile.skip.history.skip);
                            plugged.skipDJ(booth.dj, now.historyID);
                            setTimeout(function () {
                                //noinspection JSUnresolvedFunction
                                plugged.sendChat(utils.replace(langfile.skip.history.default, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title),
                                    time: moment().subtract((config.history.time * 60) - ttl, 'seconds').fromNow()
                                }));
                            }, 4 * 1000);
                        });
                    } else if (config.timeguard.enabled && now.media.duration >= config.timeguard.time && !config.state.eventmode && plugged.getMedia().id === now.media.id) {
                        plugged.sendChat(langfile.skip.timeguard.skip);
                        plugged.skipDJ(booth.dj);
                        setTimeout(function () {
                            plugged.sendChat(utils.replace(langfile.skip.timeguard.default, {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(now.media.author, now.media.title),
                                time: config.timeguard.time
                            }), 60);
                        }, 4 * 1000);
                    } else if (config.titleguard.enabled && utils.contains(utils.songtitle(now.media.author, now.media.title), config.titleguard.not_contain) && !config.state.eventmode) {
                        plugged.sendChat(langfile.titleguard.skip);
                        plugged.skipDJ(booth.dj);
                        setTimeout(function () {
                            plugged.sendChat(utils.replace(langfile.titleguard.contained, {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(now.media.author, now.media.title)
                            }), 60);
                            db.blacklist.add(now.media.format, now.media.cid, langfile.titleguard.bl_reason);
                        }, 4 * 1000);
                    } else if (config.youtubeGuard.enabled && now.media.format === 1 && plugged.getMedia().id === now.media.id) {
                        youTubeApi.check(now.media).spread(function (skip, reasons) {
                            if (skip && plugged.getMedia().id === now.media.id) {
                                plugged.sendChat(langfile.youtubeGuard.skip);
                                plugged.skipDJ(booth.dj);
                                setTimeout(function () {
                                    plugged.sendChat(utils.replace(reasons.skip, {username: plugged.getUserByID(booth.dj).username}), 60);
                                    db.blacklist.add(now.media.format, now.media.cid, reasons.blacklist);
                                }, 4 * 1000);
                            }
                        }).catch(function () {
                            plugged.sendChat(langfile.youtubeGuard.api_unreachable, 30);
                        });
                    } else if (config.soundcloudGuard.enabled && plugged.getMedia().id === now.media.id && now.media.format === 2) {
                        soundCloudApi.check(now.media).spread(function (skip, reasons) {
                            if (skip && plugged.getMedia().id === now.media.id) {
                                plugged.sendChat(langfile.soundcloudGuard.skip);
                                plugged.skipDJ(booth.dj);
                                setTimeout(function () {
                                    plugged.sendChat(utils.replace(reasons.skip, {username: plugged.getUserByID(booth.dj).username}), 60);
                                    db.blacklist.add(now.media.format, now.media.cid, reasons.blacklist);
                                }, 4 * 1000);
                            }
                        }).catch(function () {
                            plugged.sendChat(langfile.soundcloudGuard.api_unreachable, 30);
                        });
                    }
                });
            }
        });
        db.models.Song.findOrCreate({
            where: {cid: now.media.cid, format: now.media.format}, defaults: {
                title: now.media.title,
                author: now.media.author,
                image: now.media.image,
                duration: now.media.duration,
                format: now.media.format,
                plug_id: now.media.id,
                cid: now.media.cid
            }
        }).spread(function (song) {
            song.updateAttributes({
                image: now.media.image,
                title: now.media.title,
                author: now.media.author,
                duration: now.media.duration
            });
            if (song.autovote !== 'n') {
                if (song.autovote === 'w') plugged.woot();
                else if (song.autovote === 'm')plugged.meh();
            }
            if (song.tskip !== null && song.tskip !== undefined && !config.state.eventmode) {
                plugged.sendChat(utils.replace(langfile.tskip.default, {time: song.tskip}), song.tskip);
                 setTimeout(function () {
                    if(plugged.getMedia().id === now.media.id){
                        plugged.sendChat(langfile.tskip.skip, 60);
                        plugged.skipDJ(booth.dj);
                    }
                }, song.tskip * 1000);
            }
        });
        story.info('advance', utils.userLogString(plugged.getUserByID(booth.dj)) + ': ' + utils.mediatitlelog(now.media));
    } else story.info('advance', 'Nobody is playing!');
    clearTimeout(timeouts.stuck);
    clearTimeout(timeouts.tskip);
    if (booth.dj !== undefined) {
        timeouts.stuck = setTimeout(function () {
            if (plugged.getMedia().id === now.media.id) {
                plugged.sendChat(langfile.skip.stuck.default, 30);
                plugged.skipDJ(booth.dj, now.historyID);
            }
        }, (now.media.duration + 5) * 1000);
    }
    if (prev.dj !== undefined) {
        redis.set('media:history:' + prev.media.format + ':' + prev.media.cid, 1).then(function () {
            redis.expire('media:history:' + prev.media.format + ':' + prev.media.cid, config.history.time * 60);
        });
        db.models.Play.create({
            time: new Date,
            woots: prev.score.positive,
            mehs: prev.score.negative,
            grabs: prev.score.grabs
        }).then(function (play) {
            //noinspection JSUnresolvedFunction
            play.setSong(prev.media.id);
            //noinspection JSUnresolvedFunction
            play.setUser(prev.dj.id);
        });
        story.info('score', utils.mediatitlelog(prev.media) + ' woots: ' + prev.score.positive + ' | grabs: ' + prev.score.grabs + ' | mehs: ' + prev.score.negative);
    }
    redis.del('meta:data:rdjskip:votes');
    websocketUpdate({
        m: function () {
            if (now.media.id !== -1) {
                return {
                    cid: now.media.format + ':' + now.media.cid,
                    t: now.media.title,
                    a: now.media.author
                };
            } else return null;
        }(),
        dj: function () {
            if (booth.dj !== -1 && booth.dj !== undefined) {
                var u = plugged.getUserByID(booth.dj);
                return {id: u.id, n: u.username};
            } else return null;

        }()
    });
};