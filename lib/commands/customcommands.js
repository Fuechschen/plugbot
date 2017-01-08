let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require('../db/sql_db');
let commands = require('../commands');

module.exports = {
    names:['customcommands', 'customcommand', 'cc'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                let split = data.message.trim().split(' ');
                if (split.length > 3) {
                    if (split[1] === 'add') {
                        //noinspection JSCheckFunctionSignatures
                        db.models.CustomCommand.findOrCreate({
                            where: {trigger: split[2].toLowerCase()},
                            defaults: {
                                trigger: split[2].toLowerCase(),
                                message: _.rest(split, 3).join(' ').trim(),
                                status: true
                            }
                        }).spread(cc => {
                            //noinspection JSCheckFunctionSignatures
                            cc.updateAttributes({message: _.rest(split, 3).join(' ').trim()});
                        });
                        plugged.sendChat(utils.replace(langfile.customcommand.created, {
                            username: data.username,
                            trigger: split[2].toLowerCase()
                        }));
                    }
                } else if (split.length > 2) {
                    if (split[1] === 'enable') {
                        db.models.CustomCommand.update({status: true}, {where: {trigger: split[2].toLowerCase()}});
                        plugged.sendChat(utils.replace(langfile.customcommand.cc_enabled, {
                            username: data.username,
                            trigger: split[2].toLowerCase()
                        }));
                    } else if (split[1] === 'disable') {
                        db.models.CustomCommand.update({status: false}, {where: {trigger: split[2].toLowerCase()}});
                        plugged.sendChat(utils.replace(langfile.customcommand.cc_disabled, {
                            username: data.username,
                            trigger: split[2].toLowerCase()
                        }));
                    } else if (split[1] === 'senderenable') {
                        db.models.CustomCommand.update({senderinfo: true}, {where: {trigger: split[2].toLowerCase()}});
                        plugged.sendChat(utils.replace(langfile.customcommand.senderinfo_enabled, {
                            username: data.username,
                            trigger: split[2].toLowerCase()
                        }));
                    } else if (split[1] === 'senderdisable') {
                        db.models.CustomCommand.update({senderinfo: false}, {where: {trigger: split[2].toLowerCase()}});
                        plugged.sendChat(utils.replace(langfile.customcommand.senderinfo_disabled, {
                            username: data.username,
                            trigger: split[2].toLowerCase()
                        }));
                    }
                } else if (split.length === 2) {
                    if (split[1] === 'reload') {
                        //noinspection JSUnresolvedletiable
                        commands.reloadcc.handler(data);
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};