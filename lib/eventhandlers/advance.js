let Promise = require('bluebird');

let story = require('storyboard').mainStory;
let redis = require('../db/redis_db');
let db = require('../db/sql_db');
let utils = require('../utils');
let plugged = require('../client');
const config = require('../load_config');
const langfile = require('../../langfile');
let songfilters = require('../songfilters');

let websocketUpdate = require('../../web/index').wsGet('advance');

let timeouts = {
    stuck: null,
    tskip: null
};

module.exports = {
    event: plugged.ADVANCE,
    handler: (booth, now, prev) => {
        booth = utils.clone(booth);
        now = utils.clone(now);
        prev = utils.clone(prev);
        if (booth.dj) {
            Promise.all(songfilters.map(e => e(booth, now))).catch(error => {
                if (plugged.getMedia().id === now.media.id) {
                    plugged.sendChat(error.preskip);
                    if (error.doLockskip) {
                        //noinspection JSUnresolvedFunction
                        plugged.setCyclePromise(true).then(() => //noinspection JSUnresolvedFunction
                            plugged.skipDJPromise(booth.dj)).then(() => {
                            if (config.lockskip.movePos) plugged.moveDJ(booth.dj, config.lockskip.movePos);
                            return Promise.resolve();
                        }).then(() => {
                            if (booth.shouldCycle !== plugged.doesWaitlistCycle()) { //noinspection JSUnresolvedFunction
                                return plugged.setCyclePromise(booth.shouldCycle);
                            }
                            return Promise.resolve();
                        }).then(() => {
                            plugged.sendChat(error.afterskip);
                            if (error.blacklist) db.blacklist.add(now.media.format, now.media.cid, error.blReason || undefined);
                        }).catch(err => {
                            story.error('Error while lockskipping.', {attach: err});
                        });
                    } else {
                        plugged.skipDJ(booth.dj);
                        setTimeout(() => {
                            plugged.sendChat(error.afterskip);
                            if (error.blacklist) db.blacklist.add(now.media.format, now.media.cid, error.blReason || undefined);
                        }, 4 * 1000);
                    }
                }
            });
            db.models.Song.findOrCreate({
                where: {
                    cid: now.media.cid,
                    format: now.media.format
                },
                defaults: {
                    title: now.media.title,
                    author: now.media.author,
                    image: now.media.image,
                    duration: now.media.duration,
                    format: now.media.format,
                    plugId: now.media.id,
                    cid: now.media.cid
                }
            }).spread(song => {
                song.updateAttributes({
                    image: now.media.image,
                    title: now.media.title,
                    author: now.media.author,
                    duration: now.media.duration
                });
                if (song.autovote !== 'n') {
                    if (song.autovote === 'w') plugged.woot();
                    else if (song.autovote === 'm') plugged.meh();
                }
                if (song.tskip !== null && song.tskip && !config.state.eventmode) {
                    plugged.sendChat(utils.replace(langfile.tskip.default, {time: song.tskip}), song.tskip * 1000);
                    setTimeout(() => {
                        if (plugged.getMedia().id === now.media.id) {
                            plugged.sendChat(langfile.tskip.skip, 60 * 1000);
                            plugged.skipDJ(booth.dj);
                        }
                    }, song.tskip * 1000);
                }
            });
            story.info('advance', `${utils.userLogString(plugged.getUserByID(booth.dj))}: ${utils.mediatitlelog(now.media)}`);
        } else story.info('advance', 'Nobody is playing!');
        clearTimeout(timeouts.stuck);
        clearTimeout(timeouts.tskip);
        if (booth.dj) {
            timeouts.stuck = setTimeout(() => {
                if (plugged.getMedia().id === now.media.id) {
                    plugged.sendChat(langfile.skip.stuck.default, 30);
                    plugged.skipDJ(booth.dj, now.historyID);
                }
            }, (now.media.duration + 5) * 1000);
        }
        if (prev.dj) {
            redis.set(`media:history:${prev.media.format}:${prev.media.cid}`, 1).then(() => {
                //noinspection JSUnresolvedFunction
                redis.expire(`media:history:${prev.media.format}:${prev.media.cid}`, config.history.time * 60);
            });
            db.sequelize.transaction(t => db.models.Play.create({
                time: new Date,
                woots: prev.score.positive,
                mehs: prev.score.negative,
                grabs: prev.score.grabs
            }, {transaction: t}).then(play => //noinspection JSUnresolvedFunction
                play.setSong(prev.media.id, {transaction: t}).then(() => //noinspection JSUnresolvedFunction
                    play.setUser(prev.dj.id, {transaction: t})))).catch(() => {
                story.debug('SQL', 'Transaction errored while creating play. You skipped too fast...');
            });
            story.info('score', `${utils.mediatitlelog(prev.media)} woots: ${prev.score.positive} | grabs: ${prev.score.grabs} | mehs: ${prev.score.negative}`);
        }
        //noinspection JSUnresolvedFunction
        redis.del('meta:data:rdjskip:votes');
        websocketUpdate({
            m: (() => {
                if (now.media.id !== -1) {
                    return {
                        cid: `${now.media.format}:${now.media.cid}`,
                        t: now.media.title,
                        a: now.media.author
                    };
                }
                return null;
            })(),
            dj: (() => {
                if (booth.dj !== -1 && booth.dj) {
                    let u = plugged.getUserByID(booth.dj);
                    return {id: u.id, n: u.username};
                }
                return null;
            })()
        });
    }
};