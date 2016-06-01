var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['superuser', 'su'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                var split = data.message.split(' ');
                if (split.length > 1) {
                    var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined) {
                        db.models.User.find({where: {id: user.id}}).then(function (usr) {
                            usr.updateAttributes({super_user: !usr.super_user});
                            if (usr.super_user) plugged.sendChat(utils.replace(langfile.superuser.add, {
                                mod: data.username,
                                username: user.username
                            }), 20);
                            else plugged.sendChat(utils.replace(langfile.superuser.remove, {
                                mod: data.username,
                                username: user.username
                            }), 20);
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'SuperUser'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'SuperUser'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};