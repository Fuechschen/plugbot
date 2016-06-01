var _ = require('underscore');
var story = require('storyboard').mainStory;
var S = require('string');
var request = require('request');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');

module.exports = function (booth, now, prev) {
    booth = utils.clone(booth);
    now = utils.clone(now);
    prev = utils.clone(prev);
    if (booth.dj !== undefined) {
        redis.exists('media:blacklist:' + now.media.format + ':' + now.media.cid).then(function (exb) {
            if (exb === 1 && plugged.getCurrentMedia().id === now.media.id) {
                redis.get('media:blacklist:' + now.media.format + ':' + now.media.cid).then(function (track) {
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
                    if (exh === 1 && config.history.skipenabled && !config.state.eventmode && plugged.getCurrentMedia().id === now.media.id) {
                        plugged.skipDJ(booth.dj, now.historyID);
                        redis.ttl('media:history:' + now.media.format + ':' + now.media.cid).then(function (ttl) {
                            plugged.sendChat(langfile.skip.history.skip);
                            plugged.skipDJ(booth.dj, now.historyID);
                            setTimeout(function () {
                                plugged.sendChat(utils.replace(langfile.skip.history.default, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(now.media.author, now.media.title),
                                    time: moment().subtract((config.history.time * 60) - ttl, 'seconds').fromNow()
                                }));
                            }, 4 * 1000);
                        });
                    } else if (config.timeguard.enabled && now.media.duration >= config.timeguard.time && !config.state.eventmode && plugged.getCurrentMedia().id === now.media.id) {
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
                            utils.blacklistmedia(now.media, langfile.titleguard.bl_reason);
                        }, 4 * 1000);
                    } else if (config.youtubeGuard.enabled && now.media.format === 1 && plugged.getCurrentMedia().id === now.media.id) {
                        request.get('https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=' + now.media.cid + '&key=' + config.apiKeys.youtube, function (error, resp, body) {
                            if (!error && resp.statusCode === 200 && plugged.getCurrentMedia().id === now.media.id) {
                                body = JSON.parse(body);
                                if (body.items.length > 0) {
                                    if (body.items[0] !== undefined) {
                                        if (utils.checkRegionRestriction(body.items[0]) !== false) {
                                            if (plugged.getCurrentMedia().id === now.media.id) {
                                                var intersection = utils.checkRegionRestriction(body.items[0]);
                                                plugged.sendChat(langfile.youtubeGuard.skip);
                                                plugged.skipDJ(booth.dj);
                                                setTimeout(function () {
                                                    plugged.sendChat(utils.replace(langfile.youtubeGuard.blocked.default, {
                                                        username: plugged.getUserByID(booth.dj).username,
                                                        song: utils.mediatitle(now.media),
                                                        countries: intersection.join(' ')
                                                    }), 60);
                                                    utils.blacklistmedia(now.media, utils.replace(langfile.youtubeGuard.blocked.bl_reason, {countries: intersection.join(' ')}));
                                                }, 4 * 1000);
                                            }
                                        } else if (body.items[0].status.uploadStatus === 'deleted') {
                                            plugged.sendChat(langfile.youtubeGuard.skip);
                                            plugged.skipDJ(booth.dj);
                                            setTimeout(function () {
                                                plugged.sendChat(utils.replace(langfile.youtubeGuard.deleted.default, {
                                                    username: plugged.getUserByID(booth.dj).username,
                                                    song: utils.mediatitle(now.media)
                                                }), 60);
                                                utils.blacklistmedia(now.media, langfile.youtubeGuard.deleted.bl_reason);
                                            }, 4 * 1000);
                                        } else if (body.items[0].status.uploadStatus === 'rejected') {
                                            plugged.sendChat(langfile.youtubeGuard.skip);
                                            plugged.skipDJ(booth.dj);
                                            setTimeout(function () {
                                                plugged.sendChat(utils.replace(langfile.youtubeGuard.rejected.default, {
                                                    username: plugged.getUserByID(booth.dj).username,
                                                    song: utils.mediatitle(now.media),
                                                    reason: langfile.youtubeGuard.rejected.reasons[body.items[0].status.rejectionReason]
                                                }), 60);
                                                utils.blacklistmedia(now.media, utils.replace(langfile.youtubeGuard.rejected.bl_reason, {reason: langfile.youtubeGuard.rejected.reasons[body.items[0].status.rejectionReason]}));
                                            }, 4 * 1000);
                                        } else if (body.items[0].status.privacyStatus === 'private') {
                                            plugged.sendChat(langfile.youtubeGuard.skip);
                                            plugged.skipDJ(booth.dj);
                                            setTimeout(function () {
                                                plugged.sendChat(utils.replace(langfile.youtubeGuard.private.default, {
                                                    username: plugged.getUserByID(booth.dj).username,
                                                    song: utils.mediatitle(now.media)
                                                }), 60);
                                                utils.blacklistmedia(now.media, langfile.youtubeGuard.private.bl_reason);
                                            }, 4 * 1000);
                                        } else if (body.items[0].status.embeddable === false) {
                                            plugged.sendChat(langfile.youtubeGuard.skip);
                                            plugged.skipDJ(booth.dj);
                                            setTimeout(function () {
                                                plugged.sendChat(utils.replace(langfile.youtubeGuard.embeddable.default, {
                                                    username: plugged.getUserByID(booth.dj).username,
                                                    song: utils.mediatitle(now.media)
                                                }), 60);
                                                utils.blacklistmedia(now.media, langfile.youtubeGuard.embeddable.bl_reason);
                                            }, 4 * 1000);
                                        }
                                    }
                                } else {
                                    plugged.sendChat(langfile.youtubeGuard.skip);
                                    plugged.skipDJ(booth.dj);
                                    setTimeout(function () {
                                        plugged.sendChat(utils.replace(langfile.youtubeGuard.deleted.default, {
                                            username: plugged.getUserByID(booth.dj).username,
                                            song: utils.mediatitle(now.media)
                                        }), 60);
                                        utils.blacklistmedia(now.media, langfile.youtubeGuard.deleted.bl_reason);
                                    }, 4 * 1000);
                                }
                            } else story.warn('YoutubeApi', 'Error during youtube-api call.', {
                                attach: {
                                    err: error,
                                    response: resp
                                }
                            });
                        });
                    } else if (config.soundcloudGuard.enabled && plugged.getCurrentMedia().id === now.media.id && now.media.format === 2) {
                        request.get('https://api.soundcloud.com/tracks/' + now.media.cid + '?client_id=' + config.apiKeys.soundcloud, function (err, resp) {
                            if (!err && plugged.getCurrentMedia().id === now.media.id) {
                                if (resp.statusCode === 404) {
                                    plugged.sendChat(langfile.soundcloudGuard.skip);
                                    plugged.skipDJ(booth.dj);
                                    setTimeout(function () {
                                        plugged.sendChat(utils.replace(langfile.soundcloudGuard.deleted.default, {
                                            username: plugged.getUserByID(booth.dj).username,
                                            song: utils.mediatitle(now.media)
                                        }), 60);
                                        utils.blacklistmedia(now.media, langfile.soundcloudGuard.deleted.bl_reason);
                                    }, 4 * 1000);
                                } else if (resp.statusCode === 403) {
                                    plugged.sendChat(langfile.soundcloudGuard.skip);
                                    plugged.skipDJ(booth.dj);
                                    setTimeout(function () {
                                        plugged.sendChat(utils.replace(langfile.soundcloudGuard.private.default, {
                                            username: plugged.getUserByID(booth.dj).username,
                                            song: utils.mediatitle(now.media)
                                        }), 60);
                                        utils.blacklistmedia(now.media, langfile.soundcloudGuard.private.bl_reason);
                                    }, 4 * 1000);
                                }
                            }
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
        }).then(function (song) {
            song = song[0];
            song.updateAttributes({
                image: now.media.image,
                title: now.media.title,
                author: now.media.author,
                duration: now.media.duration
            });
            if (song.tskip !== null && song.tskip !== undefined && !config.state.eventmode) {
                plugged.sendChat(utils.replace(langfile.tskip.default, {time: song.tskip}), song.tskip + 10);
                timeouts.tksip = setTimeout(function () {
                    plugged.sendChat(langfile.tskip.skip, 60);
                    plugged.skipDJ(booth.dj);
                }, song.tskip * 1000);
            }
        });
        story.info('advance', utils.userLogString(plugged.getUserByID(booth.dj)) + ': ' + utils.mediatitlelog(now.media));
    } else story.info('advance', 'Nobody is playing!');
    clearTimeout(timeouts.stuck);
    clearTimeout(timeouts.tskip);
    if (booth.dj !== undefined) {
        timeouts.stuck = setTimeout(function () {
            plugged.sendChat(langfile.skip.stuck.default, 30);
            plugged.skipDJ(booth.dj, now.historyID);
        }, (now.media.duration + 5) * 1000);
    }
    if (prev.dj !== undefined) {
        redis.set('media:history:' + prev.media.format + ':' + prev.media.cid, 1).then(function () {
            redis.expire('media:history:' + prev.media.format + ':' + prev.media.cid, config.history.time * 60);
        });
        db.models.Song.find({where: {plug_id: prev.media.id}}).then(function (song) {
            db.models.User.find({where: {id: prev.dj.id}}).then(function (user) {
                db.models.Play.create({
                    time: new Date,
                    woots: prev.score.positive,
                    mehs: prev.score.negative,
                    grabs: prev.score.grabs
                }).then(function (play) {
                    play.setSong(song);
                    play.setUser(user);
                });
            });
        });
        story.info('score', utils.mediatitlelog(prev.media) + ' woots: ' + prev.score.positive + ' | grabs: ' + prev.score.grabs + ' | mehs: ' + prev.score.negative);
    }
    redis.del('meta:data:rdjskip:votes');
};