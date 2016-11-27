let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require("../db/sql_db.js");
let customcommands = require('../customcommands');

module.exports = {
    names: ['reloadcustomcommands', 'reloadcc'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
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