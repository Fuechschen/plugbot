let story = require('storyboard').mainStory;
let Promise = require('bluebird');

let redis = require('../db/redis_db');
let db = require('../db/sql_db');
let utils = require('../utils');
let plugged = require('../client');
const config = require('../load_config');
const langfile = require('../../langfile');
let chatfilter = require('../chatfilters');
let webSockUpdate = require('../../web/index').wsGet('chat');

module.exports = {
    event: plugged.CHAT_COMMAND,
    handler: (data)=> {
        if (data.id !== plugged.getSelf().id) {
            if (config.state.lockdown) {
                //noinspection JSUnresolvedFunction
                redis.hget('user:roles', data.id).then(perm => {
                    perm = parseInt(perm, 10);
                    if (perm < 2) plugged.removeChatMessage(data.cid);
                });
            } else if (config.options.disable_emote) {
                //noinspection JSUnresolvedFunction
                redis.hget('user:roles', data.id).then(perm => {
                    perm = parseInt(perm, 10);
                    if (perm < 1) {
                        plugged.deleteMessage(data.cid);
                    }
                });
            } else {
                redis.exists(`user:mute:${data.id}`).then(exm => {
                    if (exm === 1) {
                        plugged.removeChatMessage(data.cid);
                        //noinspection JSUnresolvedFunction
                        if (!(data.message).startsWith(config.options.command_prefix)) {
                            //noinspection JSUnresolvedFunction
                            redis.incr(`user:mute:${data.id}:violation`).then(() => {
                                redis.get(`user:mute:${data.id}:violation`).then(val => {
                                    if (parseInt(val, 10) > config.chatfilter.spam.mute_violation) {
                                        plugged.sendChat(utils.replace(langfile.chatfilter.spam.hard_mute, {username: data.username}), 60);
                                        plugged.muteUser(data.id, plugged.MUTEDURATION.LONG, plugged.BANREASON.SPAMMING);
                                    }
                                });
                            });
                        }
                    }
                    else if (config.chatfilter.enabled) {
                        //noinspection JSUnresolvedFunction
                        redis.hget('user:roles', data.id).then(role => {
                            role = parseInt(role);
                            if (role < config.chatfilter.ignorerole) {
                                return Promise.all(chatfilter.filters.map(e => e(data)));
                            } else return Promise.resolve();
                        }).then(() => {

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
                                            redis.expire(`user:mute:${data.id}`, config.chatfilter.spam.mute_duration);
                                        });
                                        plugged.sendChat(utils.replace(chatfilter.resolveMsg(filter.type).mute, {username: data.username}));
                                    } else plugged.sendChat(utils.replace(chatfilter.resolveMsg(filter.type).warn, {username: data.username}));
                                });
                            }
                        });
                    }
                });
            }
            //noinspection JSUnresolvedFunction
            if (!(data.message).includes('[AFK]')) {
                db.models.User.update({
                    last_active: new Date(),
                    wl_removes: 0,
                    afk_level: 'active'
                }, {where: {id: data.id}});
            }
        }
        story.info('chat', `${data.username}[${data.id}]: ${data.message}`);
        webSockUpdate({m: data.message, u: {id: data.id, n: plugged.getUserByID(data.id).username}, cid: data.cid});
    }
};