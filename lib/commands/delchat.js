let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require('../db/sql_db');

module.exports = {
    names: ['delchat'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                let split = data.message.split(' ');
                if (split.length === 1) {
                    let chats = plugged.getChat();
                    chats.forEach(chat => {
                        plugged.removeChatMessage(chat.cid);
                    });
                    plugged.sendChat(utils.replace(langfile.delchat.clear, {
                        username: data.username,
                        count: chats.length
                    }), 60);
                } else {
                    //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    db.models.User.find({where: {$or: [{username: {$like: `%${S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s}%`}}, {id: _.rest(split, 1)}]}}).then(user => {
                        if (user) {
                            plugged.sendChat(utils.replace(langfile.delchat.user, {
                                mod: data.username,
                                username: user.username
                            }), 45);
                            plugged.getChatByUser(user.username).forEach(msg => {
                                plugged.removeChatMessage(msg.cid);
                            });
                        } else { //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                            plugged.sendChat(utils.replace(langfile.error.userNotFound, {
                                username: plugged.getUserByID(data.id).username,
                                value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                            }), 20);
                        }
                    });
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};