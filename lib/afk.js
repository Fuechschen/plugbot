var CronJob = require('cron').CronJob;
var Promise = require('bluebird');
var moment = require('moment');
var story = require('storyboard').mainStory;

var db = require('./db/sql_db');
var langfile = require('../langfile');
var config = require('./load_config');
var utils = require('./utils');
var plugged = require('./client');
var redis = require('./db/redis_db');

module.exports = {
    crons: {
        afk: new CronJob('0 */10 * * * *', function () {
            var promise;
            if (config.afk.enabled) {
                //noinspection JSUnresolvedFunction
                promise = db.models.User.findAll({where: {afk_level: 'warned2', status: true}}).then(function (users) {
                    users = users.filter(function (user) {
                        return utils.wlPosition(user.id) !== -1;
                    });
                    var kicks = [];
                    var removes = [];
                    users.forEach(function (user) {
                        if (user.wl_removes >= config.afk.kick)kicks.push(user);
                        else removes.push(user);
                    });
                    kicks.forEach(function (user) {
                        if (user.s_role > 1) {
                            plugged.sendChat(utils.replace(langfile.afk.kick, {username: user.username}));
                            plugged.banUser(user.id, plugged.BANDURATION.HOUR, plugged.BANREASON.VIOLATING_COMMUNITY_RULES, function () {
                                setTimeout(function () {
                                    plugged.unbanUser(user.id);
                                }, 10000);
                            });
                        } else removes.push(user);
                    });
                    plugged.sendChat(utils.replace(langfile.afk.remove, {
                        usernames: removes.map(function (user) {
                            return utils.replace(langfile.afk.usernames, {username: user.username});
                        }).join('').trim()
                    }));
                    removes.forEach(function (user) {
                        plugged.removeDJ(user.id);
                    });
                    //noinspection JSUnresolvedFunction
                    return db.models.User.findAll({where: {afk_level: 'warned', status: true}});
                }).then(function (users) {
                    users = users.filter(function (user) {
                        return utils.wlPosition(user.id) !== -1;
                    });
                    plugged.sendChat(utils.replace(langfile.afk.warn_2, {
                        username: users.map(function (user) {
                            return utils.replace(langfile.afk.usernames, {username: user.username});
                        }).join('').trim()
                    }));
                    return Promise.all(users.map(function (user) {
                        user.update({afk_level: 'warned2'});
                    })).then(function () {
                        //noinspection JSUnresolvedFunction
                        return db.models.User.findAll({where: {afk_level: 'afk', status: true}});
                    });
                }).then(function (users) {
                    users = users.filter(function (user) {
                        return utils.wlPosition(user.id) !== -1;
                    });
                    plugged.sendChat(utils.replace(langfile.afk.warn_1, {
                        username: users.map(function (user) {
                            return utils.replace(langfile.afk.usernames, {username: user.username});
                        }).join('').trim()
                    }));
                    return Promise.all(users.map(function (user) {
                        user.update({afk_level: 'warned'});
                    }));
                });
            } else promise = Promise.resolve();
            promise.then(function () {
                //noinspection JSUnresolvedFunction
                return db.models.User.update({afk_level: 'afk'}, {
                    where: {
                        status: true,
                        last_active: {$lt: moment().subtract(config.afk.time, 'seconds').toDate()}
                    }
                });
            }).catch(function (err) {
                story.error('AFK-Removal', {attach: err});
            });
        }, null, true),
        activestaff: new CronJob('0 */20 * * * *', function () {
            var active = 0;
            var stafflist = plugged.getStaffOnline();

            function checkstaff(index) {
                if (stafflist[index].role > 1) {
                    redis.get('user:afk:' + stafflist[index].id).then(function (ex) {
                        if (ex === 1) {
                            active = active + 1
                        }
                        if (stafflist[index + 1] !== undefined) checkstaff(index + 1);
                        else setvar();
                    });
                } else if (stafflist[index + 1] !== undefined) checkstaff(index + 1);
                else setvar();
            }

            function setvar() {
                redis.set('meta:data:staff:active', active);
            }
        }, null, true)
    },
    isAfk: function (user) {
        if (typeof user === 'object') user = user.id;
        return new Promise(function (resolve, reject) {
            //noinspection JSUnresolvedFunction
            db.models.User.find({
                where: {
                    id: user,
                    last_active: {$lt: moment().subtract(config.afk.time, 'seconds').toDate()}
                }
            }).then(function (user) {
                resolve((user !== null && user !== undefined));
            }).catch(reject);
        });
    }
};