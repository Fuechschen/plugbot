var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['reloadroles'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.getUsers().forEach(function (user) {
                    redis.del('user:role:save:' + user.id).then(function () {
                        db.models.User.find({where: {id: user.id}}).then(function (usr) {
                            redis.set('user:role:save:' + user.id, usr.s_role);
                            if (plugged.getUserRole(user.id) > usr.s_role) {
                                if (s_role === 0) plugged.removeStaff(user.id);
                                else plugged.addStaff(user.id, s_role);
                            }
                        });
                    });
                });
                plugged.sendChat(utils.replace(langfile.reloadroles.default, {username: data.username}), 30);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};