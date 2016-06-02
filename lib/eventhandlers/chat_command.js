var _ = require('underscore');
var story = require('storyboard').mainStory;
var S = require('string');
var request = require('request');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');

module.exports = function (data) {
    if (data.id !== plugged.getSelf().id) {
        if (config.state.lockdown) {
            redis.hget('user:roles',data.id).then(function (perm) {
                perm = parseInt(perm, 10);
                if (perm < 2) plugged.removeChatMessage(data.cid);
            });
        } else if (config.options.disable_emote) {
            redis.hget('user:roles',data.id).then(function (perm) {
                perm = parseInt(perm, 10);
                if (perm < 1) {
                    plugged.deleteMessage(data.cid);
                }
            });
        } else {
            redis.exists('user:mute:' + data.id).then(function (exm) {
                if (exm === 1) {
                    plugged.removeChatMessage(data.cid);
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
                }
                else if (config.chatfilter.enabled) {
                    redis.hget('user:roles',data.id).then(function (perm) {
                        perm = parseInt(perm, 10);
                        if (perm < 1) {
                            redis.incr('user:chat:spam:' + data.id + ':points');
                            redis.get('user:chat:spam:' + data.id + ':lastmsg').then(function (lastmsg) {
                                if (data.message === lastmsg) {
                                    plugged.removeChatMessage(data.cid);
                                    redis.incrby('user:chat:spam:' + data.id + ':points', 10);
                                    redis.expire('user:chat:spam:' + data.id + ':lastmsg', 3600);
                                } else {
                                    redis.set('user:chat:spam:' + data.id + ':lastmsg', data.message).then(function () {
                                        redis.expire('user:chat:spam:' + data.id + ':lastmsg', 3600);
                                    });
                                }
                                redis.get('user:chat:spam:' + data.id + ':points').then(function (points) {
                                    if (parseInt(points, 10) >= config.chatfilter.spam.points) {
                                        redis.incr('user:chat:spam:' + data.id + ':warns');
                                        plugged.removeChatMessage(data.cid);
                                        plugged.sendChat(utils.replace(langfile.chatfilter.spam.warn, {username: data.username}), 60);
                                    }
                                    redis.get('user:chat:spam:' + data.id + ':warns').then(function (warns) {
                                        if (parseInt(warns, 10) > config.chatfilter.spam.warns) {
                                            plugged.sendChat(utils.replace(langfile.chatfilter.spam.mute, {username: data.username}), 60);
                                            redis.set('user:mute:' + data.id, 1).then(function () {
                                                redis.set('user:mute:' + data.id + ':violation', 0);
                                                redis.expire('user:mute:' + data.id, config.chatfilter.spam.mute_duration);
                                            });
                                        } else {
                                            if (utils.contains(data.message, config.chatfilter.words.blacklist)) {
                                                plugged.removeChatMessage(data.cid);
                                                redis.incrby('user:chat:spam:' + data.id + ':points', 10);
                                            } else if (utils.containsplug(data.message)) {
                                                plugged.removeChatMessage(data.cid);
                                                redis.incrby('user:chat:spam:' + data.id + ':points', 20);
                                            }
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        }
        if (!S(data.message).contains('[AFK]')) {
            redis.set('user:afk:' + data.id, 1).then(function () {
                redis.expire('user:afk:' + data.id, config.afk.time);
                redis.set('user:afk:' + data.id + ':removes', 0);
            });
        }
    }
    story.info('chat', data.username + '[' + data.id + ']: ' + data.message);
};