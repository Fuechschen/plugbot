var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['setstaff'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 2).join(' ')).chompLeft('@').chompRight(' ').s);
                var role = utils.role(split[1]);
                if (user !== undefined && role !== undefined) {
                    plugged.sendChat(utils.replace(langfile.setstaff.default, {
                        mod: data.username,
                        username: user.username,
                        role: utils.rolename(role)
                    }), 45);
                    if (role === plugged.USERROLE.NONE) plugged.removeStaff(user.id);
                    else plugged.addStaff(user.id, role);
                    db.models.User.update({s_role: utils.permlevel(role)}, {where: {id: user.id}});
                    redis.set('user:role:save:' + user.id, utils.permlevel(role));
                    story.info('promote', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user) + ' --> ' + utils.rolename(role));
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};