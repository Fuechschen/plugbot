let CronJob = require('cron').CronJob,
    Promise = require('bluebird'),
    moment = require('moment'),
    story = require('storyboard').mainStory;

const langfile = require('../langfile'),
    config = require('./load_config');

let db = require('./db/sql_db'),
    utils = require('./utils'),
    plugged = require('./client'),
    redis = require('./db/redis_db');

module.exports = {
    crons: {
        afk: new CronJob('0 */10 * * * *', () => {
            let promise;
            if (config.afk.enabled) {
                //noinspection JSUnresolvedFunction
                promise = db.models.User.findAll({where: {afkLevel: 'warned2', status: true}}).then(users => {
                    users = users.filter(user => utils.wlPosition(user.id) !== -1);
                    let kicks = [];
                    let removes = [];
                    users.forEach(user => {
                        if (user.wlRemoves >= config.afk.kick) kicks.push(user);
                        else removes.push(user);
                    });
                    kicks.forEach(user => {
                        if (user.sRole > 1) {
                            plugged.sendChat(utils.replace(langfile.afk.kick, {username: user.username}));
                            plugged.banUser(user.id, plugged.BANDURATION.HOUR, plugged.BANREASON.VIOLATING_COMMUNITY_RULES, () => {
                                setTimeout(() => {
                                    plugged.unbanUser(user.id);
                                }, 10000);
                            });
                        } else removes.push(user);
                    });
                    plugged.sendChat(utils.replace(langfile.afk.remove, {
                        usernames: removes.map(user => utils.replace(langfile.afk.usernames, {username: user.username})).join('').trim()
                    }));
                    removes.forEach(user => plugged.removeDJ(user.id));
                    //noinspection JSUnresolvedFunction
                    return db.models.User.findAll({where: {afkLevel: 'warned', status: true}});
                }).then(users => {
                    users = users.filter(user => utils.wlPosition(user.id) !== -1);
                    plugged.sendChat(utils.replace(langfile.afk.warn2, {
                        username: users.map(user => utils.replace(langfile.afk.usernames, {username: user.username})).join('').trim()
                    }));
                    return Promise.all(users.map(user => user.update({afkLevel: 'warned2'}))).then(() => //noinspection JSUnresolvedFunction
                        db.models.User.findAll({where: {afkLevel: 'afk', status: true}}));
                }).then(users => {
                    users = users.filter(user => utils.wlPosition(user.id) !== -1);
                    plugged.sendChat(utils.replace(langfile.afk.warn1, {
                        username: users.map(user => utils.replace(langfile.afk.usernames, {username: user.username})).join('').trim()
                    }));
                    return Promise.all(users.map(user => user.update({afkLevel: 'warned'})));
                });
            } else promise = Promise.resolve();
            promise.then(() => //noinspection JSUnresolvedFunction
                db.models.User.update({afkLevel: 'afk'}, {
                    where: {
                        status: true,
                        lastActive: {$lt: moment().subtract(config.afk.time, 'seconds').toDate()}
                    }
                })).catch(err => {
                story.error('AFK-Removal', {attach: err});
            });
        }, null, true),
        activestaff: new CronJob('0 */20 * * * *', () => {
            let active = 0;
            let stafflist = plugged.getStaffOnline();
            if (stafflist[0]) checkstaff(0);

            function checkstaff(index) {
                if (stafflist[index].role > 1) {
                    redis.get(`user:afk:${stafflist[index].id}`).then(ex => {
                        if (ex === 1) {
                            active = active + 1;
                        }
                        if (stafflist[index + 1]) checkstaff(index + 1);
                        else setlet();
                    });
                } else if (stafflist[index + 1]) checkstaff(index + 1);
                else setlet();
            }

            function setlet() {
                redis.set('meta:data:staff:active', active);
            }
        }, null, true)
    },
    isAfk: (user) => {
        if (typeof user === 'object') user = user.id;
        return new Promise((resolve, reject) => {
            //noinspection JSUnresolvedFunction
            db.models.User.find({
                where: {
                    id: user,
                    lastActive: {$lt: moment().subtract(config.afk.time, 'seconds').toDate()}
                }
            }).then(user => {
                resolve((!!user));
            }).catch(reject);
        });
    }
};