var CronJob = require('cron').CronJob;
var Promise = require('bluebird');
var moment = require('moment');

var db = require('./db/sql_db');
var langfile = require('../langfile');
var config = require('./load_config');

module.exports = {
    cron: new CronJob('0 */10 * * * *', function () {
        //todo
    }, null, true),
    isAfk: function (user) {
        if (typeof user === 'object') user = user.id;
        return new Promise(function (resolve, reject) {
            db.models.User.find({
                where: {
                    id: user,
                    last_active: {$lt: moment().subtract(config.afk.time,'seconds').toDate()}
                }
            }).then(function (user) {
                resolve((user !== null && user !== undefined));
            }).catch(reject);
        });
    }
};