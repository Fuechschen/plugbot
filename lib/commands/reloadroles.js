var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require("../db/sql_db.js");

module.exports = {
    names: ['reloadroles'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                Promise.all(plugged.getChatByUser().map(user => db.models.find({where: {id: user.id}}))).then(users => Promise.all(users.map(user => //noinspection JSUnresolvedFunction
                redis.hset('user:roles', user.id, user.s_role)))).then(() => {
                    plugged.sendChat(utils.replace(langfile.reloadroles.default, {username: data.username}), 30);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};