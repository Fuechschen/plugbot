var story = require('storyboard').mainStory;
var S = require('string');
var request = require('request');
var fs = require('fs');
var Promise = require('bluebird');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var cleverbot = require('../cleverbot');
var langfile = require('../../langfile');

var commands = require('../commands');
var chatfilter = require('../chatfilters');


module.exports = function (data) {
    if (data.id !== plugged.getSelf().id) {
        if (config.state.lockdown) {
            redis.hget('user:roles', data.id).then(function (perm) {
                perm = parseInt(perm, 10);
                if (perm < 1) plugged.removeChatMessage(data.cid);
                else handleAsCommand();
            });
        } else {
            //noinspection JSUnresolvedFunction
            redis.exists('user:mute:' + data.id).then(function (exm) {
                if (exm === 1) {
                    plugged.removeChatMessage(data.cid);
                    //noinspection JSUnresolvedFunction
                    if (!S(data.message).startsWith(config.options.command_prefix)) {
                        redis.incr('user:mute:' + data.id + ':violation').then(function () {
                            redis.get('user:mute:' + data.id + ':violation').then(function (val) {
                                if (parseInt(val, 10) > config.chatfilter.spam.mute_violation) {
                                    plugged.sendChat(utils.replace(langfile.chatfilter.spam.hard_mute, {username: data.username}), 60);
                                    plugged.muteUser(data.id, plugged.MUTEDURATION.LONG, plugged.BANREASON.SPAMMING);
                                }
                            });
                        });
                    }
                } else if (config.chatfilter.enabled) {
                    Promise.all(chatfilter.filters.map(function (e) {
                        return e(data);
                    })).then(function () {
                        handleAsCommand();
                    }).catch(function (filter) {
                        plugged.deleteMessage(data.cid);
                        if (filter.points > 0) {
                            redis.hincrby('spam:user:spampoints', data.id, filter.points).then(function (points) {
                                if (points > config.chatfilter.spam.points) {
                                    redis.set('user:mute:' + user.id, 1).then(function () {
                                        redis.set('user:mute:' + user.id + ':violation', 0);
                                        redis.expire('user:mute:' + user.id, config.chatfilter.spam.mute_duration);
                                    });
                                    plugged.sendChat(utils.replace(chatfilter.resolveMsg(data.type).mute, {username: data.username}));
                                } else plugged.sendChat(utils.replace(chatfilter.resolveMsg(data.type).warn, {username: data.username}));
                            });
                        }
                    });
                } else handleAsCommand();
            });
        }
        //noinspection JSUnresolvedFunction
        if (!S(data.message).contains('[AFK]')) {
            redis.set('user:afk:' + data.id, 1).then(function () {
                redis.expire('user:afk:' + data.id, config.afk.time);
                redis.set('user:afk:' + data.id + ':removes', 0);
            });
        }
    }
    story.info('chat', data.username + '[' + data.id + ']: ' + data.message);

    function handleAsCommand() {
        //noinspection JSUnresolvedFunction
        if (S(data.message).startsWith(config.options.command_prefix)) {
            //noinspection JSUnresolvedFunction
            var split = S(data.message).chompLeft(config.options.command_prefix).s.split(' ');
            if (commands[split[0].toLowerCase()] !== undefined) {
                commands[split[0].toLowerCase()].handler(data);
                story.info('command', utils.userLogString(data.username, data.id) + ': ' + split[0] + ' [' + data.message + ']');
            }
        } else {
            //noinspection JSUnresolvedFunction
            if (S(data.message).startsWith(config.customcommands.trigger) && config.customcommands.enabled) {
                //noinspection JSUnresolvedFunction
                redis.exists('customcommands:command:senderinfo:' + S(data.message).chompLeft(config.customcommands.trigger).s).then(function (ex) {
                    if (ex === 1) {
                        //noinspection JSUnresolvedFunction
                        redis.get('customcommands:command:senderinfo:' + S(data.message).chompLeft(config.customcommands.trigger).s).then(function (cc) {
                            //noinspection JSUnresolvedFunction
                            plugged.sendChat(utils.replace(langfile.customcommand.default, {
                                username: data.username,
                                trigger: S(data.message).chompLeft(config.customcommands.trigger).s,
                                msg: utils.replace(cc, {
                                    username: data.username,
                                    botname: plugged.getSelf().username,
                                    roomname: plugged.getRoomMeta().name,
                                    guests: plugged.getRoomMeta().guests,
                                    usercount: plugged.getRoomMeta().population
                                })
                            }));
                        });
                        plugged.deleteMessage(data.cid);
                    } else {
                        //noinspection JSUnresolvedFunction
                        redis.exists('customcommands:command:nosenderinfo:' + S(data.message).chompLeft(config.customcommands.trigger).s).then(function (ex) {
                            if (ex === 1) {
                                //noinspection JSUnresolvedFunction
                                redis.get('customcommands:command:nosenderinfo:' + S(data.message).chompLeft(config.customcommands.trigger).s).then(function (cc) {
                                    plugged.sendChat(utils.replace(langfile.customcommand.nosenderinfo, {
                                        msg: utils.replace(cc, {
                                            username: data.username,
                                            botname: plugged.getSelf().username,
                                            roomname: plugged.getRoomMeta().name,
                                            guests: plugged.getRoomMeta().guests,
                                            usercount: plugged.getRoomMeta().population
                                        })
                                    }));
                                });
                                plugged.deleteMessage(data.cid);
                            } else sendToCleverbot();
                        });
                    }
                });
            }
        }
    }

    function sendToCleverbot() {
        if (config.cleverbot.enabled && S(data.message).contains('@' + plugged.getSelf().username)) {
            cleverbot(data);
        }
    }
};
