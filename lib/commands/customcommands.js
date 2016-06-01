var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['customcommands', 'customcommand', 'cc'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                if (split.length > 3) {
                    if (split[1] === 'add') {
                        db.models.CustomCommand.findOrCreate({
                            where: {trigger: split[2].toLowerCase()},
                            defaults: {
                                trigger: split[2].toLowerCase(),
                                message: _.rest(split, 3).join(' ').trim(),
                                status: true
                            }
                        }).spread(function (cc) {
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
                        commands.reloadcc.handler(data);
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};