var commands = {};

commands.skip = commands.fs = {
    handler: function (msg) {
        redis.get('user:role:save:' + msg.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                if (perm > 1 && ex === 0) {
                    var booth = plugged.getBooth();
                    var media = plugged.getCurrentMedia();
                    plugged.sendChat(utils.replace(langfile.skip.default, {username: msg.username}), 70);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 4);
                    });
                    setTimeout(function () {
                        var split = msg.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]] !== undefined) {
                            plugged.sendChat(utils.replace(langfile.skip.reasons[split[1]], {
                                username: plugged.getUserByID(booth.id).username,
                                song: utils.songtitle(media.author, media.title)
                            }), 60);
                        }
                    }, 4 * 1000);
                    story.info('skip', utils.userLogString(msg.username, msg.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                }
            });
        });
        plugged.deleteMessage(msg.cid);
    }
};

commands.bl = commands.blacklist = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                if (perm > 1 && ex === 0) {
                    var booth = plugged.getBooth();
                    var media = plugged.getCurrentMedia();
                    plugged.sendChat(utils.replace(langfile.blacklist.default, {username: data.username}), 60);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 4);
                    });
                    var split = data.message.trim().split(' ');
                    var reason = utils.blacklistReason(_.rest(split, 1));
                    redis.set('media:blacklist:' + media.format + ':' + media.cid, ((split.length > 1 ? reason : 1))).then(function () {
                        setTimeout(function () {
                            if (split.length > 1) {
                                plugged.sendChat(utils.replace(langfile.blacklist.with_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    mod: data.username,
                                    song: utils.songtitle(media.author, media.title),
                                    reason: reason
                                }), 60);
                                models.Song.update({isBanned: true, reason: reason}, {where: {plug_id: media.id}});
                            } else {
                                plugged.sendChat(utils.replace(langfile.blacklist.without_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    song: utils.songtitle(media.author, media.title),
                                    mod: data.username
                                }), 60);
                                models.Song.update({isBanned: true}, {where: {plug_id: media.id}});
                            }
                        }, 4 * 1000);
                    });
                    story.info('blacklist', utils.userLogString(data.username, data.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                }
            });
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.ls = commands.lockskip = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                if (perm > 1 && ex === 0) {
                    plugged.sendChat(utils.replace(langfile.skip.lockskip, {username: data.username}), 70);
                    var booth = plugged.getBooth();
                    var media = plugged.getCurrentMedia();
                    plugged.setLock(true, false);
                    plugged.setCycle(true);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 4);
                    });
                    if (booth.shouldCycle !== plugged.doesWaitlistCycle) plugged.setCycle(booth.shouldCycle);
                    if (booth.isLocked !== plugged.isWaitlistLocked) plugged.setLock(booth.isLocked, false);
                    if (config.lockskip.move_pos !== undefined) plugged.moveDJ(booth.dj, config.lockskip.move_pos);
                    setTimeout(function () {
                        var split = data.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]] !== undefined) {
                            plugged.sendChat(utils.replace(langfile.skip.reasons[split[1]], {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(media.author, media.title)
                            }), 60);
                        }
                    }, 4 * 1000);
                    story.info('lockskip', utils.userLogString(data.username, data.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                }
            });
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.add = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    if (_.findIndex(plugged.getWaitlist(), {id: user.id}) === -1 && (plugged.getCurrentDJ() !== undefined ? plugged.getCurrentDJ().id !== user.id : true )) {
                        plugged.sendChat(utils.replace(langfile.bp_actions.add, {username: data.username}), 45);
                        plugged.addToWaitlist(user.id);
                    }
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
                story.info('add', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.rem = commands.remove = commands.rm = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 1) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    if (_.findIndex(plugged.getWaitlist(), {id: user.id}) !== -1 || plugged.getCurrentDJ().id === user.id) {
                        plugged.sendChat(utils.replace(langfile.bp_actions.remove, {username: data.username}), 45);
                        plugged.removeDJ(user.id);
                    }
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
                story.info('remove', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.lock = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.sendChat(utils.replace(langfile.bp_actions.lock, {username: data.username}), 70);
                plugged.setLock(true, false);
                story.info('lock', utils.userLogString(data.username, data.id));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.unlock = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if ((config.options.bouncer_plus ? (perm > 1) : (perm > 2))) {
                plugged.sendChat(utils.replace(langfile.bp_actions.unlock, {username: data.username}), 70);
                plugged.setLock(false, false);
                story.info('unlock', utils.userLogString(data.username, data.id));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.clear = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if ((config.options.bouncer_plus ? (perm > 1) : (perm > 2))) {
                plugged.sendChat(utils.replace(langfile.bp_actions.clear, {username: data.username}), 70);
                plugged.setLock(true, true);
                story.info('clear', utils.userLogString(data.username, data.id));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.cycle = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.sendChat(utils.replace(langfile.bp_actions.cycle, {username: data.username}), 70);
                var cycle = plugged.doesWaitlistCycle()
                plugged.setCycle(!cycle);
                story.info('cycle', utils.userLogString(data.username, data.id) + ': --> ' + !plugged.doesWaitlistCycle());
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.delchat = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 1) {
                var split = data.message.split(' ');
                if (split.length === 1) {
                    var chats = plugged.getChat();
                    chats.forEach(function (chat) {
                        plugged.deleteMessage(chat.cid);
                    });
                    plugged.sendChat(utils.replace(langfile.delchat.clear, {
                        username: data.username,
                        count: chats.length
                    }), 60);
                } else {
                    models.User.find({where: {$or: [{username: {$like: '%' + S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s + '%'}}, {id: _.rest(split, 1)}]}}).then(function (user) {
                        if (user !== null && user !== undefined) {
                            plugged.sendChat(utils.replace(langfile.delchat.user, {
                                mod: data.username,
                                username: user.username
                            }), 45);
                            plugged.getChatByUser(user.username).forEach(function (msg) {
                                plugged.deleteMessage(msg.cid);
                            });
                        } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                            username: plugged.getUserByID(data.id).username,
                            value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                        }), 20);
                    })
                }
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.kick = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 1) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    redis.get('user:role:save:' + user.id).then(function (role) {
                        if (role >= perm) plugged.sendChat(utils.replace(langfile.kick.error, {
                            mod: data.username,
                            username: user.username
                        }), 20);
                        else {
                            plugged.sendChat(utils.replace(langfile.kick.default, {
                                mod: data.username,
                                username: user.username
                            }), 60);
                            plugged.banUser(user.id, plugged.BANDURATION.HOUR, plugged.BANREASON.VIOLATING_COMMUNITY_RULES, function () {
                                setTimeout(function () {
                                    plugged.unbanUser(user.id);
                                }, 15 * 1000);
                            });
                            story.info('lockskip', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(plugged.getUserByID(user)));
                        }
                    });
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.setstaff = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 2) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 2).join(' ')).chompLeft('@').chompRight(' ').s);
                var role = utils.role(split[1]);
                if (user !== undefined && role !== undefined) {
                    plugged.sendChat(utils.replace(langfile.setstaff.default, {
                        mod: data.username,
                        username: user.username,
                        role: utils.rolename(role)
                    }), 45);
                    if (role === plugged.USERROLE.NONE) plugged.removeStaff(user.id);
                    else plugged.addStaff(user.id, role);
                    models.User.update({s_role: utils.permlevel(role)}, {where: {id: user.id}});
                    redis.set('user:role:save:' + user.id, utils.permlevel(role));
                    story.info('promote', util.userLogString(data.username, data.id) + ': ' + utils.userLogString(user) + ' --> ' + utils.rolename(role));
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands['bouncer+'] = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 2) {
                config.options.bouncer_plus = !config.options.bouncer_plus;
                if (config.options.bouncer_plus) plugged.sendChat(utils.replace(langfile.bouncer_plus.enabled, {username: data.username}), 45);
                else plugged.sendChat(utils.replace(langfile.bouncer_plus.disabled, {username: data.username}), 45);
                redis.set('meta:config:options:bouncer_plus', (config.options.bouncer_plus ? 1 : 0));
                story.info('bouncer+', utils.userLogString(data.username, data.id) + ': --> ' + config.options.bouncer_plus);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.demote = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 0) plugged.removeStaff(data.id);
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.promote = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 0) plugged.addStaff(data.id, perm);
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.ping = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 0) plugged.sendChat(langfile.ping.default, 30);
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.historyskip = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (config.state.eventmode) {
                    config.history.skipenabled = !config.history.skipenabled;
                    if (config.history.skipenabled) plugged.sendChat(utils.replace(langfile.skip.history.enabled, {username: data.username}), 30);
                    else plugged.sendChat(utils.replace(langfile.skip.history.disabled, {username: data.username}), 30);
                    redis.set('meta:config:history:skipenabled', (config.history.skipenabled ? 1 : 0));
                    story.info('historyskip', utils.userLogString(data.username, data.id) + ': --> ' + config.history.skipenabled);
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Historyskip'
                }));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.voteskip = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.voteskip.enabled = !config.voteskip.enabled;
                    if (config.voteskip.enabled) plugged.sendChat(utils.replace(langfile.skip.vote.enabled, {username: data.username}), 30);
                    else plugged.sendChat(utils.replace(langfile.skip.vote.disabled, {username: data.username}), 30);
                    redis.set('meta:config:voteskip:enabled', (config.voteskip.enabled ? 1 : 0));
                    story.info('voteskip', utils.userLogString(data.username, data.id) + ': --> ' + config.voteskip.enabled);
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Voteskip'
                }));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.eventmode = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.state.eventmode = !config.state.eventmode;
                if (config.stateeventmode) plugged.sendChat(utils.replace(langfile.eventmode.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.eventmode.disabled, {username: data.username}), 30);
                redis.set('meta:config:state:eventmode', (config.state.eventmode ? 1 : 0));
                story.info('eventmode', utils.userLogString(data.username, data.id) + ': --> ' + config.voteskip.enabled);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.clearhistory = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.sendChat(utils.replace(langfile.skip.history.clear, {username: data.username}), 60);
                redis.keys('media:history:*').then(function (keys) {
                    keys.forEach(function (key) {
                        redis.del(key);
                    });
                });
                story.info('clearhistory', utils.userLogString(data.username, data.id));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.reloadblacklist = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                redis.keys('media:blacklist:*').then(function (keys) {
                    keys.forEach(function (key) {
                        redis.del(key);
                    });
                    models.Song.findAll({where: {isBanned: true}}).then(function (songs) {
                        songs.forEach(function (song) {
                            redis.set('media:blacklist:' + song.format + ':' + song.cid, ((song.ban_reason !== undefined && song.ban_reason !== null) ? song.ban_reason : 1));
                        });
                        plugged.sendChat(utils.replace(langfile.blacklist.reload, {
                            username: data.username,
                            count: songs.length
                        }));
                    });
                });
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.link = {
    handler: function (data) {
        if (plugged.getCurrentMedia().id !== -1) {
            var m = plugged.getCurrentMedia();
            if (m.format === 1) plugged.sendChat(utils.replace(langfile.link.default, {
                username: data.username,
                link: 'https://youtu.be/' + m.cid
            }));
            else {
                request.get('https://api.soundcloud.com/tracks/' + m.cid + '?client_id=' + config.apiKeys.soundcloud, function (err, resp, body) {
                    if (!err && resp.statusCode === 200) {
                        var json = JSON.parse(body);
                        plugged.sendChat(utils.replace(langfile.link.default, {
                            username: data.username,
                            link: json.permalink_url
                        }));
                    } else plugged.sendChat(utils.replace(langfile.link.error, {username: data.username}));
                });
            }
        } else plugged.sendChat(utils.replace(langfile.link.no_media, {username: data.username}));
    }
};

commands.unmute = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    redis.exists('user:mute:' + user.id).then(function (exm) {
                        if (exm === 1) {
                            redis.del('user:mute:' + user.id).then(function () {
                                redis.del('user:mute:' + user.id + ':violation');
                                plugged.unmuteUser(user.id);
                            });
                            plugged.sendChat(utils.replace(langfile.unmute.default, {
                                username: user.username,
                                mod: data.username
                            }), 60);
                            story.info('unmute', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user));
                        } else plugged.sendChat(utils.replace(langfile.unmute.not_muted, {
                            mod: data.username,
                            username: user.username
                        }), 30);
                    });
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.mute = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    redis.exists('user:mute:' + user.id).then(function (exm) {
                        if (exm === 1) {
                            plugged.sendChat(utils.replace(langfile.mute.already_muted, {
                                username: user.username,
                                mod: data.username
                            }), 30);
                        } else {
                            redis.set('user:mute:' + user.id, 1).then(function () {
                                redis.set('user:mute:' + user.id + ':violation', 0);
                                redis.expire('user:mute:' + user.id, config.chatfilter.spam.mute_duration);
                            });
                            plugged.sendChat(utils.replace(langfile.mute.default, {
                                username: user.username,
                                mod: data.username
                            }), 60);
                            story.info('mute', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user));
                        }
                    });
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.ban = {
    handler: function (data) {
        //todo
    }
};

commands.unban = {
    handler: function (data) {
        //todo
    }
};

commands.lockdown = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.state.lockdown = !config.state.lockdown;
                if (config.state.lockdown) plugged.sendChat(utils.replace(langfile.lockdown.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.lockdown.disabled, {username: data.username}), 60);
                redis.set('meta:config:state:lockdown', (config.state.lockdown ? 1 : 0));
                story.info('lockdown', utils.userLogString(data.username, data.id) + ': --> ' + config.state.lockdown);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.timeguard = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (config.state.eventmode) {
                    config.timeguard.enabled = !config.timeguard.enabled;
                    if (config.timeguard.enabled) plugged.sendChat(utils.replace(langfile.skip.timeguard.enabled, {username: data.username}), 60);
                    else plugged.sendChat(utils.replace(langfile.skip.timeguard.disabled, {username: data.username}), 60);
                    redis.set('meta:config:timeguard:enabled', (config.timeguard.enabled ? 1 : 0));
                    story.info('timeguard', utils.userLogString(data.username, data.id) + ': --> ' + config.timeguard.enabled);
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Timeguard'
                }));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.welcomemsg = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 2) {
                var split = data.message.trim().split(' ');
                if (split.length > 1) {
                    var meta = plugged.getRoomMeta();
                    if (split[1] === 'none' && split.length === 2) {
                        plugged.updateRoomInfo(meta.name, meta.description, '');
                    } else {
                        plugged.updateRoomInfo(meta.name, meta.description, _.rest(split, 1).join(' ').trim());
                    }
                    plugged.sendChat(utils.replace(langfile.roomedit.welcomemsg, {username: data.username}), 30);
                    story.info('welcomemsg', utils.userLogString(data.username, data.id) + ': --> ' + _.rest(split, 1).join(' ').trim());
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: Welcome
                }), 30);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.roomname = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 2) {
                var split = data.message.trim().split(' ');
                if (split.length > 1) {
                    var meta = plugged.getRoomMeta();
                    plugged.updateRoomInfo(_.rest(split, 1).join(' ').trim(), meta.description, meta.welcome);
                    plugged.sendChat(utils.replace(langfile.roomedit.roomname, {username: data.username}), 30);
                    story.info('roomname', utils.userLogString(data.username, data.id) + ': --> ' + _.rest(split, 1).join(' ').trim());
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: Welcome
                }), 30);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.cleverbot = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.cleverbot.enabled = !config.cleverbot.enabled;
                if (config.cleverbot.enabled) plugged.sendChat(utils.replace(langfile.cleverbot.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.cleverbot.disabled, {username: data.username}), 30);
                redis.set('meta:config:cleverbot:enabled', (config.cleverbot.enabled ? 1 : 0));
                story.info('cleverbot', utils.userLogString(data.username, data.id) + ': --> ' + config.cleverbot.enabled);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.idbl = commands.idblacklist = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 1) {
                var split = data.message.trim().split(' ');
                if (split.length > 1) {
                    var mid = split[1].split(':');
                    if (mid.length === 2) {
                        models.Song.findOrCreate({
                            where: {cid: mid[1], format: mid[0]},
                            defaults: {
                                cid: mid[1],
                                format: mid[0],
                                isBanned: true,
                                ban_reason: (split.length === 2 ? undefined : _.rest(split, 2).join(' ').trim())
                            }
                        }).spread(function (song) {
                            song.updateAttributes({
                                isBanned: true,
                                ban_reason: (split.length === 2 ? undefined : _.rest(split, 2).join(' ').trim())
                            });
                            redis.set('media:blacklist:' + song.format + ':' + song.cid, (split.length === 2 ? 1 : _.rest(split, 2).join(' ').trim()));
                        })
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'Blacklist'
                    }));
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'Blacklist'
                }));
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.tskip = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 1) {
                var split = data.message.trim().split(' ');
                if (split[1] === 'set') {
                    var time = parseInt(split[2]);
                    if (!isNaN(time)) {
                        clearTimeout(timeouts.tksip);
                        timeouts.tskip = setTimeout(function () {
                            plugged.sendChat(langfile.tksip.skip, 60);
                            plugged.skipDJ(plugged.getCurrentDJ().id);
                        }, moment(plugged.getStartTime()).add(time, 'seconds').diff(moment(), 'seconds') * 1000);
                        plugged.sendChat(utils.replace(langfile.tskip.set, {username: data.username, time: time}));
                        models.Song.update({tskip: time}, {
                            where: {
                                format: plugged.getCurrentMedia().format,
                                cid: plugged.getCurrentMedia().cid
                            }
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'TSkip'
                    }), 20);
                } else if (perm > 2) {
                    if (split[1] === 'cancel') {
                        clearTimeout(timeouts.tskip);
                        plugged.sendChat(utils.replace(langfile.tskip.cancel, {username: data.username}), 30);
                    } else if (split[1] === 'clear') {
                        clearTimeout(timeouts.tskip);
                        plugged.sendChat(utils.replace(langfile.tskip.clear, {username: data.username}), 30);
                        models.Song.update({tskip: null}, {
                            where: {
                                format: plugged.getCurrentMedia().format,
                                cid: plugged.getCurrentMedia().cid
                            }
                        });
                    }
                }
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.move = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                if (split.length > 2) {
                    var pos = parseInt(split[split.length - 1]);
                    var user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined && !isNaN(pos)) {
                        plugged.sendChat(utils.replace(langfile.move.default, {username: data.username}));
                        if (plugged.getWaitlist().indexOf(user) === -1) plugged.addToWaitlist(user.id);
                        plugged.moveDJ(user.id, pos)
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'Move'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'Move'
                }), 20);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

commands.superuser = commands.su = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            if (perm > 2) {
                var split = data.message.split(' ');
                if (split.length > 1) {
                    var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined) {
                        models.User.find({where: {id: user.id}}).then(function (usr) {
                            usr.updateAttributes({super_user: !usr.super_user});
                            if (usr.super_user) plugged.sendChat(utils.replace(langfile.superuser.add, {
                                mod: data.username,
                                username: user.username
                            }), 20);
                            else plugged.sendChat(utils.replace(langfile.superuser.remove, {
                                mod: data.username,
                                username: user.username
                            }), 20);
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'SuperUser'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'SuperUser'
                }), 20);
            }
        });
        plugged.deleteMessage(data.cid);
    }
};

module.exports = commands;