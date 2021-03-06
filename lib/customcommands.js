let S = require('string'),
    Promise = require('bluebird');

const config = require('./load_config'),
    langfile = require('../langfile');

let db = require('./db/sql_db'),
    plugged = require('./client'),
    utils = require('./utils');

let _reload = () => {
        customcommands = {_reload};
        load();
    },
    customcommands = {_reload};

let cckeys = Object.keys(config.defaultCC);

load();

function load() {
    Promise.all(cckeys.map(key => db.models.CustomCommand.upsert({
        trigger: key,
        message: config.defaultCC[key].msg,
        senderinfo: config.defaultCC[key].sender
    }))).then(() => //noinspection JSUnresolvedFunction
        db.models.CustomCommand.findAll({where: {status: true}})).each(cc => {
        customcommands[cc.trigger] = {
            trigger: cc.trigger,
            message: cc.message,
            senderinfo: cc.senderinfo,
            allowMention: cc.allowMention,
            handler: (data) => {
                if (cc.allowMention === false) {
                    plugged.sendChat(utils.replace(langfile.customcommand[(cc.senderinfo ? 'default' : 'nosenderinfo')], {
                        username: data.username,
                        trigger: cc.trigger,
                        msg: cc.message
                    }));
                } else {
                    //noinspection JSUnresolvedFunction
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

module.exports = customcommands;