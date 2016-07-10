var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require("../db/sql_db.js");

module.exports = {
    names: ['superuser', 'su'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                var split = data.message.split(' ');
                if (split.length > 1) {
                    //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
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