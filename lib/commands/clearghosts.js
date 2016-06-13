var Promise = require('bluebird');
var moment = require('moment');

var db = require('../db/sql_db');
var plugged = require('../client');
var redis = require('../db/redis_db');
var langfile = require('../../langfile');
var utils = require('../utils');

module.exports = {
    names: ['clearghosts'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                plugged.sendChat(utils.replace(langfile.clearghosts.default, {username: data.username}));
                setTimeout(function () {
                    db.models.User.findAll({
                        where: {
                            status: true,
                            last_active: {$lt: moment().subtract(50, 'hours').toDate()}
                        }
                    }).then(function (users) {
                        return Promise.all(users.map(function (user) {
                            return new Promise(function (resolve) {
                                plugged.banUser(user.id, plugged.BANDURATION.HOUR, plugged.BANREASON.VIOLATING_COMMUNITY_RULES, function (err) {
                                    if (err) resolve(-1);
                                    resolve(user.id);
                                })
                            });
                        }));
                    }).then(function (uids) {
                        Promise.all(uids.map(function (uid) {
                            return new Promise(function (resolve) {
                                if (uid !== -1) plugged.unbanUser(uid);
                                resolve();
                            });
                        }))
                    });
                }, 15 * 1000);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};