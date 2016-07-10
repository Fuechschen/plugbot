var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require("../db/sql_db.js");
var customcommands = require('../customcommands');

module.exports = {
    names: ['reloadcustomcommands', 'reloadcc'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                customcommands._reload();
                plugged.sendChat(utils.replace(langfile.customcommand.reload, {
                    username: data.username
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};