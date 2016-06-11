var S = require('string');
var Promise = require('bluebird');

var config = require('./load_config');
var db = require('./db/sql_db');
var plugged = require('./client');
var utils = require('./utils');
var langfile = require('../langfile');

var customcommands = {_reload: reload};

var cckeys = Object.keys(config.defaultCC);

load();

function load() {
    Promise.all(cckeys.map(function (key) {
        return db.models.CustomCommand.upsert({
            trigger: key,
            message: config.defaultCC[key].msg,
            senderinfo: config.defaultCC[key].sender
        });
    })).then(function () {
        //noinspection JSUnresolvedFunction
        return db.models.CustomCommand.findAll({where: {status: true}});
    }).each(function (cc) {
        customcommands[cc.trigger] = {
            trigger: cc.trigger,
            message: cc.message,
            senderinfo: cc.senderinfo,
            allowMention: cc.allowMention,
            handler: function (data) {
                if (cc.allowMention === false) {
                    plugged.sendChat(utils.replace(langfile.customcommand[(cc.senderinfo ? 'default' : 'nosenderinfo')], {
                        username: data.username,
                        trigger: cc.trigger,
                        msg: cc.message
                    }));
                } else {
                    plugged.sendChat(utils.replace(langfile.customcommand[(cc.senderinfo ? 'default' : 'nosenderinfo')], {
                            username: data.username,
                            msg: cc.message,
                            trigger: cc.trigger
                        }) + (data.message.trim() !== config.customcommands.trigger + cc.trigger ? utils.replace(langfile.customcommand.mentionAppend, {mentions: S(data.message).chompLeft(config.customcommands.trigger + cc.trigger).s.trim()}) : ''));
                }
                plugged.deleteMessage(data.cid);
            }
        };
    });
}

function reload() {
    customcommands = {_reload: reload};
    load();
}

module.exports = customcommands;