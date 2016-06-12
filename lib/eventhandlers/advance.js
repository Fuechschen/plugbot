var Promise = require('bluebird');

var story = require('storyboard').mainStory;
var request = require('request');
var moment = require("moment");
var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');
var songfilters = require('../songfilters');

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
        Promise.all(songfilters.map(function (e) {
            return e(booth, now);
        })).catch(function (error) {
            story.debug('SongFilters', '', {attach: error});
            if (plugged.getMedia().id === now.media.id) {
                plugged.sendChat(error.preskip);
                if (error.do_lockskip) {
                    plugged.setLock(true, false);
                    plugged.setCycle(true);
                    plugged.skipDJ(booth.dj);
                    if (booth.shouldCycle !== plugged.doesWaitlistCycle()) plugged.setCycle(booth.shouldCycle);
                    if (booth.isLocked !== plugged.isWaitlistLocked()) plugged.setLock(booth.isLocked, false);
                    if (config.lockskip.move_pos !== undefined) plugged.moveDJ(booth.dj, config.lockskip.move_pos);
                } else plugged.skipDJ(booth.dj);
                setTimeout(function () {
                    plugged.sendChat(error.afterskip);
                    if (error.blacklist) db.blacklist.add(now.media.format, now.media.cid, error.bl_reason || undefined);
                }, 4 * 1000);
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
                plugged.sendChat(utils.replace(langfile.tskip.default, {time: song.tskip}), song.tskip * 1000);
                setTimeout(function () {
                    if (plugged.getMedia().id === now.media.id) {
                        plugged.sendChat(langfile.tskip.skip, 60 * 1000);
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