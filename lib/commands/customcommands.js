var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require('../db/sql_db');
var commands = require('../commands');

module.exports = {
    names:['customcommands', 'customcommand', 'cc'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
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
                        }).spread(function (cc) {
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
                        //noinspection JSUnresolvedVariable
                        commands.reloadcc.handler(data);
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};