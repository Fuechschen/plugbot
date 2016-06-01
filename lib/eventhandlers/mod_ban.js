var _ = require('underscore');
var story = require('storyboard').mainStory;
var S = require('string');
var request = require('request');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');

module.exports = function (data) {
    if (data.moderatorID !== plugged.getSelf().id) {
        redis.get('user:role:save:' + data.moderatorID).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm < 2 && data.duration === plugged.BANDURATION.PERMA) {
                plugged.sendChat(utils.replace(langfile.ban.no_staff_ban, {username: data.moderator}), 60);
                plugged.unbanUser(data.id);
                plugged.banUser(data.id, plugged.BANDURATION.DAY, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                plugged.removeStaff(data.moderatorID);
            } else {
                redis.get('user:role:save:' + data.id).then(function (plvl) {
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
    }
};