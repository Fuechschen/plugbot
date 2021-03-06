let story = require('storyboard').mainStory;
let S = require('string');
let Promise = require('bluebird');

let redis = require('../db/redis_db');
let db = require('../db/sql_db');
let utils = require('../utils');
let plugged = require('../client');
const config = require('../load_config');
let cleverbot = require('../cleverbot');
const langfile = require('../../langfile');
let webSockUpdate = require('../../web/index').wsGet('chat');

let commands = require('../commands');
let customcommands = require('../customcommands');
let chatfilter = require('../chatfilters');

module.exports = {
    event: [plugged.CHAT, plugged.CHAT_MENTION],
    handler: (data) => {
        if (data.id !== plugged.getSelf().id) {
            if (config.state.lockdown) {
                //noinspection JSUnresolvedFunction
                redis.hget('user:roles', data.id).then(perm => {
                    perm = parseInt(perm, 10);
                    if (perm < 1) plugged.removeChatMessage(data.cid);
                    else handleAsCommand();
                });
            } else {
                //noinspection JSUnresolvedFunction
                redis.exists(`user:mute:${data.id}`).then(exm => {
                    if (exm === 1) {
                        plugged.removeChatMessage(data.cid);
                        //noinspection JSUnresolvedFunction
                        if (!(data.message).startsWith(config.options.commandPrefix)) {
                            //noinspection JSUnresolvedFunction
                            redis.incr(`user:mute:${data.id}:violation`).then(() => {
                                redis.get(`user:mute:${data.id}:violation`).then(val => {
                                    if (parseInt(val, 10) > config.chatfilter.spam.muteViolation) {
                                        plugged.muteUser(data.id, plugged.MUTEDURATION.LONG, plugged.BANREASON.SPAMMING, err => {
                                            if (!err) plugged.sendChat(utils.replace(langfile.chatfilter.spam.hardMute, {username: data.username}), 60);
                                        });
                                    }
                                });
                            });
                        }
                    } else if (config.chatfilter.enabled) {
                        //noinspection JSUnresolvedFunction
                        redis.hget('user:roles', data.id).then(role => {
                            role = parseInt(role);
                            if (role < config.chatfilter.ignorerole) {
                                return Promise.all(chatfilter.filters.map(e => e(data)));
                            }
                            return Promise.resolve();
                        }).then(() => {
                            handleAsCommand();
                        }).catch(filter => {
                            story.debug('Chatfilters', '', {attach: filter});
                            plugged.deleteMessage(data.cid);
                            if (filter.points > 0) {
                                //noinspection JSUnresolvedFunction
                                redis.hincrby('spam:user:spampoints', data.id, filter.points).then(points => {
                                    if (points > config.chatfilter.spam.points) {
                                        redis.set(`user:mute:${data.id}`, 1).then(() => {
                                            redis.set(`user:mute:${data.id}:violation`, 0);
                                            //noinspection JSUnresolvedFunction
                                            redis.expire(`user:mute:${data.id}`, config.chatfilter.spam.muteDuration);
                                        });
                                        plugged.sendChat(utils.replace(chatfilter.resolveMsg(filter.type).mute, {username: data.username}));
                                    } else plugged.sendChat(utils.replace(chatfilter.resolveMsg(filter.type).warn, {username: data.username}));
                                });
                            }
                        });
                    } else handleAsCommand();
                });
            }
            //noinspection JSUnresolvedFunction
            if (!(data.message).includes('[AFK]')) {
                db.models.User.update({
                    lastActive: new Date(),
                    wlRemoves: 0,
                    afkLevel: 'active'
                }, {where: {id: data.id}});
            }
        }
        story.info('chat', `${data.username}[${data.id}]: ${data.message}`);
        webSockUpdate({m: data.message, u: {id: data.id, n: plugged.getUserByID(data.id).username}, cid: data.cid});

        function handleAsCommand() {
            //noinspection JSUnresolvedFunction
            if ((data.message).startsWith(config.options.commandPrefix)) {
                //noinspection JSUnresolvedFunction
                let split = S(data.message).chompLeft(config.options.commandPrefix).s.split(' ');
                if (commands[split[0].toLowerCase()]) {
                    commands[split[0].toLowerCase()].handler(data);
                    story.info('command', `${utils.userLogString(data.username, data.id)}: ${split[0]} [${data.message}]`);
                }
            } else {
                //noinspection JSUnresolvedFunction
                if ((data.message).startsWith(config.customcommands.trigger) && config.customcommands.enabled) {
                    //noinspection JSUnresolvedFunction
                    let splt = S(data.message).chompLeft(config.customcommands.trigger).s.split(' ');
                    if (customcommands[splt[0].toLowerCase()]) {
                        customcommands[splt[0].toLowerCase()].handler(data);
                        story.info('customcommand', `${utils.userLogString(data.username, data.id)}: ${splt[0]} [${data.message}]`);
                    }
                    sendToCleverbot();
                }
                sendToCleverbot();
            }
        }

        function sendToCleverbot() {
            //noinspection JSUnresolvedFunction
            if (config.cleverbot.enabled && (data.message).includes(`@${plugged.getSelf().username}`)) {
                cleverbot(data);
            }
        }
    }
};
