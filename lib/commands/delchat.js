var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require('../db/sql_db');

module.exports = {
    names: ['delchat'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.split(' ');
                if (split.length === 1) {
                    var chats = plugged.getChat();
                    chats.forEach(function (chat) {
                        plugged.removeChatMessage(chat.cid);
                    });
                    plugged.sendChat(utils.replace(langfile.delchat.clear, {
                        username: data.username,
                        count: chats.length
                    }), 60);
                } else {
                    //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    db.models.User.find({where: {$or: [{username: {$like: '%' + S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s + '%'}}, {id: _.rest(split, 1)}]}}).then(function (user) {
                        if (user !== null && user !== undefined) {
                            plugged.sendChat(utils.replace(langfile.delchat.user, {
                                mod: data.username,
                                username: user.username
                            }), 45);
                            plugged.getChatByUser(user.username).forEach(function (msg) {
                                plugged.removeChatMessage(msg.cid);
                            });
                        } else { //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                            plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                                username: plugged.getUserByID(data.id).username,
                                value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                            }), 20);
                        }
                    })
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};