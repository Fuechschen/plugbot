var story = require('storyboard').mainStory;
var S = require('string');
var Promise = require('bluebird');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');
var chatfilter = require('../chatfilters');

module.exports = {
    event: plugged.CHAT_COMMAND,
    handler: function (data) {
        if (data.id !== plugged.getSelf().id) {
            if (config.state.lockdown) {
                redis.hget('user:roles', data.id).then(function (perm) {
                    perm = parseInt(perm, 10);
                    if (perm < 2) plugged.removeChatMessage(data.cid);
                });
            } else if (config.options.disable_emote) {
                redis.hget('user:roles', data.id).then(function (perm) {
                    perm = parseInt(perm, 10);
                    if (perm < 1) {
                        plugged.deleteMessage(data.cid);
                    }
                });
            } else {
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
                    }
                    else if (config.chatfilter.enabled) {
                        redis.hget('user:roles', data.id).then(function (role) {
                            role = parseInt(role);
                            if (role < config.chatfilter.ignorerole) {
                                return Promise.all(chatfilter.filters.map(function (e) {
                                    return e(data);
                                }));
                            } else return Promise.resolve();
                        }).then(function () {

                        }).catch(function (filter) {
                            story.debug('Chatfilters', '', {attach: filter});
                            plugged.deleteMessage(data.cid);
                            if (filter.points > 0) {
                                redis.hincrby('spam:user:spampoints', data.id, filter.points).then(function (points) {
                                    if (points > config.chatfilter.spam.points) {
                                        redis.set('user:mute:' + data.id, 1).then(function () {
                                            redis.set('user:mute:' + data.id + ':violation', 0);
                                            redis.expire('user:mute:' + data.id, config.chatfilter.spam.mute_duration);
                                        });
                                        plugged.sendChat(utils.replace(chatfilter.resolveMsg(filter.type).mute, {username: data.username}));
                                    } else plugged.sendChat(utils.replace(chatfilter.resolveMsg(filter.type).warn, {username: data.username}));
                                });
                            }
                        });
                    }
                });
            }
            if (!S(data.message).contains('[AFK]')) {
                db.models.User.update({last_active: new Date(), wl_removes: 0}, {where: {id: data.id}});
            }
        }
        story.info('chat', data.username + '[' + data.id + ']: ' + data.message);
    }
};