var story = require('storyboard').mainStory;

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var langfile = require('../../langfile');
var wsBan = require('../../web/index').wsGet('userbane');

module.exports = {
    event: plugged.MOD_BAN,
    handler: function (data) {
        if (data.moderatorID !== plugged.getSelf().id) {
            redis.get('user:role:save:' + data.moderatorID).then(function (perm) {
                perm = parseInt(perm, 10);
                if (perm < 2 && data.duration === plugged.BANDURATION.PERMA) {
                    plugged.sendChat(utils.replace(langfile.ban.no_staff_ban, {username: data.moderator}), 60);
                    plugged.unbanUser(data.id);
                    plugged.banUser(data.id, plugged.BANDURATION.DAY, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                    plugged.removeStaff(data.moderatorID);
                } else {
                    //noinspection JSUnresolvedFunction
                    redis.hget('user:roles', data.id).then(function (plvl) {
                        plvl = parseInt(plvl, 10);
                        if (plvl > 1) {
                            plugged.sendChat(utils.replace(langfile.ban.staff_ban, {username: data.moderator}), 60);
                            plugged.unbanUser(data.id);
                            plugged.removeStaff(data.moderatorID);
                        }
                    });
                }
            });
            story.info('ban', utils.userLogString(data.moderator, data.moderatorID) + ': ' + data.username + ' --> ' + data.duration);
            //noinspection JSUnresolvedVariable
            wsBan({
                m: {id: moderatorID, n: data.moderator},
                u: function () {
                    var u = plugged.getUserByName(data.username, true);
                    return (u !== undefined ? {id: u.id, n: u.username} : {n: username});
                }(),
                d: data.duration
            });
        }
    }
};