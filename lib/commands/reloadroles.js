let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require("../db/sql_db.js");

module.exports = {
    names: ['reloadroles'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                Promise.all(plugged.getChatByUser().map(user => db.models.find({where: {id: user.id}}))).then(users => Promise.all(users.map(user => //noinspection JSUnresolvedFunction
                redis.hset('user:roles', user.id, user.sRole)))).then(() => {
                    plugged.sendChat(utils.replace(langfile.reloadroles.default, {username: data.username}), 30);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};