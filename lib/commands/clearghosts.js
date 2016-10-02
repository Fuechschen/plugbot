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
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                plugged.sendChat(utils.replace(langfile.clearghosts.default, {username: data.username}));
                setTimeout(() => {
                    db.models.User.findAll({
                        where: {
                            status: true,
                            last_active: {$lt: moment().subtract(50, 'hours').toDate()}
                        }
                    }).then(users => Promise.all(users.map(user => new Promise(resolve => {
                        plugged.banUser(user.id, plugged.BANDURATION.HOUR, plugged.BANREASON.VIOLATING_COMMUNITY_RULES, err => {
                            if (err) resolve(-1);
                            resolve(user.id);
                        })
                    })))).then(uids => {
                        Promise.all(uids.map(uid => new Promise(resolve => {
                            if (uid !== -1) plugged.unbanUser(uid);
                            resolve();
                        })))
                    });
                }, 15 * 1000);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};