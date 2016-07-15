var story = require('storyboard').mainStory;

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var langfile = require('../../langfile');

module.exports = {
    event: plugged.MOD_STAFF,
    handler: function (data) {
        data = data[0];
        if (data.moderatorID !== plugged.getSelf().id) {
            redis.hget('user:roles' , data.moderatorID).then(function (perm) {
                perm = parseInt(perm, 10);
                if (perm > 2) {
                    redis.hset('user:roles', data.id, data.role);
                    db.models.User.update({s_role: data.role}, {where: {id: data.id}});
                } else {
                    //noinspection JSUnresolvedFunction
                    redis.hget('user:roles', data.id).then(function (permlvl) {
                        permlvl = parseInt(permlvl, 10);
                        var role = utils.role(permlvl);
                        if (role === plugged.USERROLE.NONE) plugged.removeStaff(data.id);
                        else plugged.addStaff(data.id, role);
                        plugged.sendChat(utils.replace(langfile.setstaff.no_power, {username: data.moderator}), 60);
                    });
                }
            });
            story.info('promote', utils.userLogString(data.moderator, data.moderatorID) + ': ' + utils.userLogString(data.username, data.id) + ' --> ' + utils.rolename(data.role));
        }
    }
};