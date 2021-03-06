let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require("../db/sql_db.js");

module.exports = {
    names: ['superuser', 'su'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                let split = data.message.split(' ');
                if (split.length > 1) {
                    //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    let user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user) {
                        db.models.User.find({where: {id: user.id}}).then(usr => {
                            usr.updateAttributes({superUser: !usr.superUser});
                            if (usr.superUser) plugged.sendChat(utils.replace(langfile.superuser.add, {
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