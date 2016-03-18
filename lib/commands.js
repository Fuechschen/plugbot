var commands = {};

commands.skip = commands.fs = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                perm = parseInt(perm, 10);
                var booth = utils.clone(plugged.getBooth());
                var media = utils.clone(plugged.getCurrentMedia());
                if (perm > 1 && ex === 0) {
                    plugged.sendChat(utils.replace(langfile.skip.default, {username: data.username}), 70);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 2);
                    });
                    setTimeout(function () {
                        var split = data.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]] !== undefined) {
                            plugged.sendChat(utils.replace(langfile.skip.reasons[split[1]], {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(media.author, media.title)
                            }), 60);
                        }
                    }, 4 * 1000);
                    story.info('skip', utils.userLogString(data.username, data.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                } else if (perm === 1 && ex === 0 && config.rdjskip.enabled) {
                    redis.sismember('meta:data:rdjskip:votes', data.id).then(function (is) {
                        if (is === 0) {
                            redis.get('meta:data:staff:active').then(function (active) {
                                active = parseInt(active, 10);
                                if (active <= config.rdjskip.max_staff_active) {
                                    redis.scard('meta:data:rdjskip:votes').then(function (card) {
                                        if (card + 1 >= config.rdjskip.votes) {
                                            plugged.sendChat(utils.replace(langfile.rdjskip.skip, {username: data.username}));
                                            story.info('skip', utils.userLogString(data.username, data.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                                        } else {
                                            redis.sadd('meta:data:rdjskip:votes', data.id).then(function () {
                                                plugged.sendChat(utils.replace(langfile.rdjskip.default, {username: data.username}));
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.bl = commands.blacklist = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    var booth = utils.clone(plugged.getBooth());
                    var media = utils.clone(plugged.getCurrentMedia());
                    plugged.sendChat(utils.replace(langfile.blacklist.default, {username: data.username}), 60);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 2);
                    });
                    var split = data.message.trim().split(' ');
                    var reason = utils.blacklistReason(_.rest(split, 1).join(' ').trim());
                    redis.set('media:blacklist:' + media.format + ':' + media.cid, ((split.length > 1 ? reason : 1))).then(function () {
                        setTimeout(function () {
                            if (split.length > 1) {
                                plugged.sendChat(utils.replace(langfile.blacklist.with_reason, {
                                    username: plugged.getUserByID(booth.dj).username,
                                    mod: data.username,
                                    song: utils.songtitle(media.author, media.title),
                                    reason: reason
                                }), 60);
                                models.Song.update({isBanned: true, ban_reason: reason}, {where: {plug_id: media.id}});
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.ls = commands.lockskip = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    plugged.sendChat(utils.replace(langfile.skip.lockskip, {username: data.username}), 70);
                    var booth = utils.clone(plugged.getBooth());
                    var media = utils.clone(plugged.getCurrentMedia());
                    plugged.setLock(true, false);
                    plugged.setCycle(true);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 2);
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.cs = commands.cycleskip = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            redis.exists('meta:state:skipable').then(function (ex) {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    var booth = utils.clone(plugged.getBooth());
                    var media = utils.clone(plugged.getCurrentMedia());
                    plugged.sendChat(utils.replace(langfile.skip.cycleskip, {username: data.username}), 70);
                    plugged.setCycle(false);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1).then(function () {
                        redis.expire('meta:state:skipable', 2);
                    });
                    if (booth.shouldCycle !== plugged.doesWaitlistCycle) plugged.setCycle(booth.shouldCycle);
                    setTimeout(function () {
                        var split = data.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]] !== undefined) {
                            plugged.sendChat(utils.replace(langfile.skip.reasons[split[1]], {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(media.author, media.title)
                            }), 60);
                        }
                    }, 4 * 1000);
                    story.info('cycleskip', utils.userLogString(data.username, data.id) + ': ' + utils.mediatitlelog(media) + ' played by ' + utils.userLogString(plugged.getUserByID(booth.dj)));
                }
            });
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.add = commands.addwl = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    if (((plugged.getWaitlist() !== undefined) ? plugged.getWaitlist().indexOf(user.id) === -1 : false) && (plugged.getCurrentDJ() !== undefined ? plugged.getCurrentDJ().id !== user.id : true )) {
                        plugged.sendChat(utils.replace(langfile.bp_actions.add, {username: data.username}), 45);
                        if (plugged.getWaitlist().length < 50) {
                            plugged.addToWaitlist(user.id);
                        } else {
                            redis.sadd('meta:addqueue', user.id);
                            redis.set('meta:addqueue:user:' + data.id, -1);
                        }
                    }
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
                story.info('add', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.rem = commands.remove = commands.rm = commands.rmwl = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    if (plugged.getWaitlist().indexOf(user.id) !== -1 || plugged.getCurrentDJ().id === user.id) {
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.lock = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.sendChat(utils.replace(langfile.bp_actions.lock, {username: data.username}), 70);
                plugged.setLock(true, false);
                story.info('lock', utils.userLogString(data.username, data.id));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.unlock = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if ((config.options.bouncer_plus ? (perm > 1) : (perm > 2))) {
                plugged.sendChat(utils.replace(langfile.bp_actions.unlock, {username: data.username}), 70);
                plugged.setLock(false, false);
                story.info('unlock', utils.userLogString(data.username, data.id));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.clear = commands.clearwl = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if ((config.options.bouncer_plus ? (perm > 1) : (perm > 2))) {
                plugged.sendChat(utils.replace(langfile.bp_actions.clear, {username: data.username}), 70);
                plugged.setLock(true, true);
                story.info('clear', utils.userLogString(data.username, data.id));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.cycle = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.sendChat(utils.replace(langfile.bp_actions.cycle, {username: data.username}), 70);
                var cycle = plugged.doesWaitlistCycle();
                plugged.setCycle(!cycle);
                story.info('cycle', utils.userLogString(data.username, data.id) + ': --> ' + (!cycle).toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.delchat = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.split(' ');
                if (split.length === 1) {
                    var chats = plugged.getChat();
                    chats.forEach(function (chat) {
                        plugged.removeChatMessage(chat.cid);
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
                                plugged.removeChatMessage(msg.cid);
                            });
                        } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                            username: plugged.getUserByID(data.id).username,
                            value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                        }), 20);
                    })
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.kick = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.setstaff = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
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
                    story.info('promote', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user) + ' --> ' + utils.rolename(role));
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands['bouncer+'] = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                config.options.bouncer_plus = !config.options.bouncer_plus;
                if (config.options.bouncer_plus) plugged.sendChat(utils.replace(langfile.bouncer_plus.enabled, {username: data.username}), 45);
                else plugged.sendChat(utils.replace(langfile.bouncer_plus.disabled, {username: data.username}), 45);
                redis.set('meta:config:options:bouncer_plus', (config.options.bouncer_plus ? 1 : 0));
                story.info('bouncer+', utils.userLogString(data.username, data.id) + ': --> ' + config.options.bouncer_plus.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.demote = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 0) plugged.removeStaff(data.id);
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.promote = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            var split = data.message.trim().split(' ');
            console.log(plugged.getUserByID(data.id).role);
            if (perm > 0) {
                if (split.length === 1) plugged.addStaff(data.id, perm);
                else if (split.length === 2 && utils.role(split[1]) !== undefined && utils.role(split[1]) !== plugged.USERROLE.NONE && utils.role(split[1]) <= perm) {
                    plugged.addStaff(data.id, utils.role(split[1]));
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.ping = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 0) plugged.sendChat(utils.replace(langfile.ping.default, {username: data.username}), 30);
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.pong = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 0) plugged.sendChat(utils.replace(langfile.ping.pong, {username: data.username}), 30);
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.historyskip = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.history.skipenabled = !config.history.skipenabled;
                    if (config.history.skipenabled) plugged.sendChat(utils.replace(langfile.skip.history.enabled, {username: data.username}), 30);
                    else plugged.sendChat(utils.replace(langfile.skip.history.disabled, {username: data.username}), 30);
                    redis.set('meta:config:history:skipenabled', (config.history.skipenabled ? 1 : 0));
                    story.info('historyskip', utils.userLogString(data.username, data.id) + ': --> ' + config.history.skipenabled.toString());
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Historyskip'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.voteskip = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.voteskip.enabled = !config.voteskip.enabled;
                    if (config.voteskip.enabled) plugged.sendChat(utils.replace(langfile.skip.vote.enabled, {username: data.username}), 30);
                    else plugged.sendChat(utils.replace(langfile.skip.vote.disabled, {username: data.username}), 30);
                    redis.set('meta:config:voteskip:enabled', (config.voteskip.enabled ? 1 : 0));
                    story.info('voteskip', utils.userLogString(data.username, data.id) + ': --> ' + config.voteskip.enabled.toString());
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Voteskip'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.eventmode = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.state.eventmode = !config.state.eventmode;
                if (config.state.eventmode) {
                    var str = S(data.message);
                    if (str.contains('-c') || str.contains('--clear')) {
                        plugged.sendChat(utils.replace(langfile.eventmode.clear, {username: data.username}));
                        if (plugged.getBooth().isLocked) plugged.setLock(false);
                        plugged.setLock(true, true);
                    } else if (str.contains('-l') || str.contains('--lock')) {
                        plugged.sendChat(utils.replace(langfile.eventmode.lock, {username: data.username}));
                        plugged.setLock(true, false);
                    } else plugged.sendChat(utils.replace(langfile.eventmode.enabled, {username: data.username}));
                    if(str.contains('-dc') || str.contains('--disable-cycle')) plugged.setCycle(false);
                    else if(str.contains('-ec') || str.contains('--enable-cycle')) plugged.setCycle(true);
                }
                else plugged.sendChat(utils.replace(langfile.eventmode.disabled, {username: data.username}));
                redis.set('meta:config:state:eventmode', (config.state.eventmode ? 1 : 0));
                story.info('eventmode', utils.userLogString(data.username, data.id) + ': --> ' + config.state.eventmode.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.clearhistory = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.reloadblacklist = commands.reloadbl = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                redis.keys('media:blacklist:*').then(function (keys) {
                    keys.forEach(function (key) {
                        redis.del(key);
                    });
                    setTimeout(function () {
                        models.Song.findAll({where: {isBanned: true}}).then(function (songs) {
                            songs.forEach(function (song) {
                                redis.set('media:blacklist:' + song.format + ':' + song.cid, ((song.ban_reason !== undefined && song.ban_reason !== null) ? song.ban_reason : 1));
                            });
                            plugged.sendChat(utils.replace(langfile.blacklist.reload, {
                                username: data.username,
                                count: songs.length
                            }));
                        });
                    }, 300);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.reloadcc = commands.reloadcustomcommands = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                redis.keys('customcommands:command:*').then(function (keys) {
                    keys.forEach(function (key) {
                        redis.del(key);
                    });
                    setTimeout(function () {
                        models.CustomCommand.findAll({where: {status: true}}).then(function (ccs) {
                            ccs.forEach(function (cc) {
                                if (cc.senderinfo) redis.set('customcommands:command:senderinfo:' + cc.trigger, cc.message);
                                else redis.set('customcommands:command:nosenderinfo:' + cc.trigger, cc.message);
                            });
                            story.info('meta', 'Loaded ' + ccs.length + ' customcommands.');
                            plugged.sendChat(utils.replace(langfile.customcommand.reload, {
                                username: data.username,
                                count: ccs.length
                            }));
                        });
                    }, 300);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.link = {
    handler: function (data) {
        if (plugged.getCurrentMedia().id !== -1) {
            var m = utils.clone(plugged.getCurrentMedia());
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.youtubeguard = commands.ytguard = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.youtubeGuard.enabled = !config.youtubeGuard.enabled;
                if (config.youtubeGuard.enabled) plugged.sendChat(utils.replace(langfile.youtubeGuard.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.youtubeGuard.disabled, {username: data.username}), 60);
                redis.set('meta:config:youtubeguard:enabled', (config.youtubeGuard.enabled ? 1 : 0));
                story.info('youtubeguard', utils.userLogString(data.username, data.id) + ': --> ' + config.timeguard.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.soundcloudguard = commands.scguard = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.soundcloudGuard.enabled = !config.soundcloudGuard.enabled;
                if (config.soundcloudGuard.enabled) plugged.sendChat(utils.replace(langfile.soundcloudGuard.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.soundcloudGuard.disabled, {username: data.username}), 60);
                redis.set('meta:config:soundcloudguard:enabled', (config.soundcloudGuard.enabled ? 1 : 0));
                story.info('soundcloudguard', utils.userLogString(data.username, data.id) + ': --> ' + config.timeguard.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.unmute = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.mute = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.ban = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            //todo
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.unban = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                //todo
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.lockdown = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.state.lockdown = !config.state.lockdown;
                if (config.state.lockdown) plugged.sendChat(utils.replace(langfile.lockdown.enabled, {username: data.username}), 60);
                else plugged.sendChat(utils.replace(langfile.lockdown.disabled, {username: data.username}), 60);
                redis.set('meta:config:state:lockdown', (config.state.lockdown ? 1 : 0));
                story.info('lockdown', utils.userLogString(data.username, data.id) + ': --> ' + config.state.lockdown);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.timeguard = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if (!config.state.eventmode) {
                    config.timeguard.enabled = !config.timeguard.enabled;
                    if (config.timeguard.enabled) plugged.sendChat(utils.replace(langfile.skip.timeguard.enabled, {username: data.username}), 60);
                    else plugged.sendChat(utils.replace(langfile.skip.timeguard.disabled, {username: data.username}), 60);
                    redis.set('meta:config:timeguard:enabled', (config.timeguard.enabled ? 1 : 0));
                    story.info('timeguard', utils.userLogString(data.username, data.id) + ': --> ' + config.timeguard.enabled.toString());
                } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                    username: data.username,
                    cmd: 'Timeguard'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.welcomemsg = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.roomname = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.cleverbot = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.cleverbot.enabled = !config.cleverbot.enabled;
                if (config.cleverbot.enabled) plugged.sendChat(utils.replace(langfile.cleverbot.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.cleverbot.disabled, {username: data.username}), 30);
                redis.set('meta:config:cleverbot:enabled', (config.cleverbot.enabled ? 1 : 0));
                story.info('cleverbot', utils.userLogString(data.username, data.id) + ': --> ' + config.cleverbot.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.idbl = commands.idblacklist = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
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
                                ban_reason: (split.length === 2 ? undefined : utils.blacklistReason(_.rest(split, 2).join(' ').trim()))
                            });
                            redis.set('media:blacklist:' + song.format + ':' + song.cid, (split.length === 2 ? 1 : _.rest(split, 2).join(' ').trim()));
                            plugged.sendChat(utils.replace(langfile.blacklist.idbl.default, {
                                username: data.username,
                                song: utils.songtitle(song.author, song.title)
                            }), 30);
                            story.info('blacklist', utils.userLogString(data.username, data.id) + ' added ' + utils.songtitle(song.author, song.title) + '[' + song.format + ':' + song.cid + '] to the blacklist');
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'Blacklist'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'Blacklist'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.move = commands.mv = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                if (split.length > 2) {
                    var pos = parseInt(split[split.length - 1]);
                    var user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined && !isNaN(pos)) {
                        plugged.sendChat(utils.replace(langfile.move.default, {username: data.username}));
                        if (plugged.getWaitlist().indexOf(user.id) === -1) {
                            if (plugged.getWaitlist().length < 50) {
                                plugged.addToWaitlist(user.id);
                                plugged.moveDJ(user.id, pos - 1);
                            } else {
                                redis.sadd('meta:addqueue', user.id);
                                redis.set('meta:addqueue:user:' + user.id, pos - 1);
                            }
                        } else plugged.moveDJ(user.id, pos - 1);
                        story.info('move', utils.userLogString(data.username, data.id) + ' moved ' + utils.userLogString(user) + ' to ' + pos);
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.superuser = commands.su = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
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
        plugged.removeChatMessage(data.cid);
    }
};

commands.leavewl = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                plugged.leaveWaitlist(function () {
                    plugged.activatePlaylist(config.playlists.none);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.joinwl = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                plugged.activatePlaylist(config.playlists.play, function () {
                    plugged.joinWaitlist();
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.unbl = commands.rmbl = commands.unblacklist = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                if (split.length === 2) {
                    var args = split[1].split(':');
                    if (args.length === 2 && ['1', '2'].indexOf(args[1])) {
                        models.Song.find({
                            where: {
                                isBanned: true,
                                format: args[0],
                                cid: args[1]
                            }
                        }).then(function (song) {
                            if (song !== null && song !== undefined) {
                                song.updateAttributes({isBanned: false, ban_reason: null});
                                plugged.sendChat(utils.replace(langfile.blacklist.unbl.default, {
                                    username: data.username,
                                    song: utils.songtitle(song.author, song.title)
                                }), 30);
                                story.info('unbl', utils.userLogString(data.username, data.id) + ' removed ' + utils.songtitle(song.author, song.title) + '[' + song.format + ':' + song.cid + '] from the blacklist.');
                            } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                username: data.username,
                                cmd: 'UnBl'
                            }), 20);
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'UnBl'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'UnBl'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.chatfilter = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.chatfilter.enabled = !config.chatfilter.enabled;
                if (config.chatfilter.enabled) plugged.sendChat(utils.replace(langfile.chatfilter.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.chatfilter.disabled, {username: data.username}), 30);
                redis.set('meta:config:chatfilter:enabled', (config.chatfilter.enabled ? 1 : 0));
                story.info('chatfilter', utils.userLogString(data.username, data.id) + ': --> ' + config.chatfilter.enabled.toString);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.lockskippos = commands.lspos = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                if (split.length === 2) {
                    var pos = parseInt(split[1]);
                    if (!isNaN(pos) && pos > 0 && pos < 51) {
                        config.lockskip.move_pos = pos;
                        plugged.sendChat(utils.replace(langfile.skip.lockskippos, {
                            username: data.username,
                            pos: pos
                        }), 30);
                        story.info('locksippos', utils.userLogString(data.username, data.id) + ' set Lockskippos to ' + pos);
                        redis.set('meta:config:lockskip:move_pos', pos);
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'LockSkipPos'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'LockSkipPos'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.chatlvl = commands.chatlevel = commands.clvl = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                if (split.length === 2) {
                    var lvl = parseInt(split[1]);
                    if (!isNaN(lvl) && [1, 2, 3].indexOf(lvl) !== -1) {
                        plugged.sendChat(utils.replace(langfile.chatlevel.default, {username: data.username}));
                        plugged.setMinChatLevel(lvl);
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'ChatLevel'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'ChatLevel'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.state = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var strings = [
                    utils.replace(langfile.state.default, {username: data.username}),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.eventmode,
                        val: config.state.eventmode.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.historyskip,
                        val: config.history.skipenabled.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.voteskip,
                        val: config.voteskip.enabled.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.timeguard,
                        val: config.timeguard.enabled.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.bouncer_plus,
                        val: config.options.bouncer_plus.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.chatfilter,
                        val: config.chatfilter.enabled.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.lockdown,
                        val: config.state.lockdown.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.lockskippos,
                        val: config.lockskip.move_pos
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.dcmoveback,
                        val: config.options.dcmoveback.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.cleverbot,
                        val: config.cleverbot.enabled.toString()
                    })
                ];
                strings.forEach(function (str) {
                    plugged.sendChat(str);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.filterreset = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                if (split.length > 2) {
                    var user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined) {
                        redis.set('user:chat:spam:' + user.id + ':points', 0).then(function () {
                            redis.set('user:chat:spam:' + user.id + ':warns', 0).then(function () {
                                plugged.sendChat(utils.replace(langfile.filterreset.default, {
                                    username: user.username,
                                    mod: data.username
                                }));
                            });
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'FilterReset'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'FilterReset'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.reloadroles = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.getUsers().forEach(function (user) {
                    redis.del('user:role:save:' + user.id).then(function () {
                        models.User.find({where: {id: user.id}}).then(function (usr) {
                            redis.set('user:role:save:' + user.id, usr.s_role);
                            if (plugged.getUserRole(user.id) > usr.s_role) {
                                if (s_role === 0) plugged.removeStaff(user.id);
                                else plugged.addStaff(user.id, s_role);
                            }
                        });
                    });
                });
                plugged.sendChat(utils.replace(langfile.reloadroles.default, {username: data.username}), 30);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.dcmoveback = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.options.dcmoveback = !config.options.dcmoveback;
                if (config.options.dcmoveback) plugged.sendChat(utils.replace(langfile.dcmoveback.enabled, {username: data.username}));
                else plugged.sendChat(utils.replace(langfile.dcmoveback.disabled, {username: data.username}));
                redis.set('meta:config:options:dcmoveback', (config.options.dcmoveback ? 1 : 0));
                story.info('dcmoveback', utils.userLogString(data.username, data.id) + ': --> ' + config.options.dcmoveback.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.restart = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                try {
                    var pm2 = require('pm2');
                    pm2.connect(function () {
                        plugged.sendChat(utils.replace(langfile.restart.default, {username: data.username}));
                        setTimeout(function () {
                            pm2.restart(config.pm2.pid, function (err) {
                                plugged.sendChat(utils.replace(langfile.restart.error, {username: data.username}));
                                story.warn('restart', 'Error while restarting.', {attach: err});
                            });
                        }, 3 * 1000);
                    });
                } catch (e) {
                    plugged.sendChat(utils.replace(langfile.restart.error, {username: data.username}));
                    story.warn('restart', 'Error while restarting.', {attach: e});
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.cleanwl = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var wl = utils.clone(plugged.getWaitlist());
                var booth = utils.clone(plugged.getBooth());
                plugged.sendChat(utils.replace(langfile.cleanwl.default, {username: data.username}));
                plugged.setLock(true, true);
                for (var i = 0; i < wl.length; i++) {
                    plugged.addToWaitlist(wl[i]);
                }
                if (!booth.isLocked) plugged.setLock(false);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.wlban = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.split(' ');
                if (split.length >= 2) {
                    var user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined) {
                        plugged.sendChat(utils.replace(langfile.wlban.default, {
                            username: user.username,
                            mod: data.username
                        }));
                        redis.set('user:waitlist:ban:' + data.id, 1);
                        if (utils.wlPosition(user.id) !== -1) plugged.removeDJ(user.id);
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.wlunban = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                if (split.length >= 2) {
                    var user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined) {
                        plugged.sendChat(utils.replace(langfile.wlban.unban, {
                            username: user.username,
                            mod: data.username
                        }));
                        redis.del('user:waitlist:ban:' + user.id);
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.define = {
    handler: function (data) {
        if (config.apiKeys.wordnik !== null && config.apiKeys.wordnik !== undefined && config.apiKeys.wordnik !== '') {
            var msg = _.rest(data.message.split(' '), 1).join(' ').trim();
            if (msg.length > 0) {
                var uri = 'http://api.wordnik.com/v4/word.json/' + msg + '/definitions?limit=200&includeRelated=true&useCanonical=true&includeTags=false&api_key=' + config.apiKeys.wordnik;
                request.get(uri, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var definition = JSON.parse(body);
                        if (definition.length === 0) plugged.sendChat(utils.replace(langfile.define.no_definition_found, {
                            username: data.username,
                            word: msg
                        }));
                        else plugged.sendChat(utils.replace(langfile.define.default, {
                            username: data.username,
                            definition: definition[0].text,
                            word: msg
                        }));
                    }
                });
            }
        }
        plugged.removeChatMessage(data.cid);
    }
};

commands.cc = commands.customcommands = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                if (split.length > 3) {
                    if (split[1] === 'add') {
                        models.CustomCommand.findOrCreate({
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
                        models.CustomCommand.update({status: true}, {where: {trigger: split[2].toLowerCase()}});
                        plugged.sendChat(utils.replace(langfile.customcommand.cc_enabled, {
                            username: data.username,
                            trigger: split[2].toLowerCase()
                        }));
                    } else if (split[1] === 'disable') {
                        models.CustomCommand.update({status: false}, {where: {trigger: split[2].toLowerCase()}});
                        plugged.sendChat(utils.replace(langfile.customcommand.cc_disabled, {
                            username: data.username,
                            trigger: split[2].toLowerCase()
                        }));
                    } else if (split[1] === 'senderenable') {
                        models.CustomCommand.update({senderinfo: true}, {where: {trigger: split[2].toLowerCase()}});
                        plugged.sendChat(utils.replace(langfile.customcommand.senderinfo_enabled, {
                            username: data.username,
                            trigger: split[2].toLowerCase()
                        }));
                    } else if (split[1] === 'senderdisable') {
                        models.CustomCommand.update({senderinfo: false}, {where: {trigger: split[2].toLowerCase()}});
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

commands.togglecc = commands.togglecustomcommands = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.customcommands.enabled = !config.customcommands.enabled;
                if (config.customcommands.enabled) plugged.sendChat(utils.replace(langfile.customcommands.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.customcommands.disabled, {username: data.username}), 30);
                redis.set('meta:config:customcommands:enabled', (config.state.eventmode ? 1 : 0));
                story.info('customcommands', utils.userLogString(data.username, data.id) + ': --> ' + config.customcommands.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.meh = commands.m = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.meh();
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.woot = commands.w = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.woot();
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.uptime = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 0) {
                plugged.sendChat(utils.replace(langfile.uptime.default, {
                    username: data.username,
                    time: startTime.fromNow()
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.songinfo = commands.sinfo = {
    handler: function (data) {
        var split = data.message.trim().split(' ');
        var sid = ((split.length === 2) ? split[1] : plugged.getMedia().format + ':' + plugged.getMedia().cid);
        if (sid.length > 8 && S(sid).contains(':')) {
            var sp = sid.split(':');
            models.Song.find({where: {cid: sp[1], format: sp[0]}}).then(function (song) {
                if (song !== null && song !== undefined) {
                    redis.exists('media:blacklist:' + song.format + ':' + song.cid).then(function (bl) {
                        redis.exists('media:history:' + song.format + ':' + song.cid).then(function (his) {
                            plugged.sendChat(utils.replace(langfile.songinfo.default, {
                                username: data.username,
                                title: utils.songtitle(song.author, song.title),
                                bl: (bl === 1) ? ((song.ban_reason !== undefined && song.ban_reason !== null) ? true.toString() + ' ' + utils.replace(langfile.songinfo.bl_reason, {reason: song.ban_reason}) : true.toString()) : false.toString(),
                                his: (his === 1).toString(),
                                sid: sid
                            }));
                        });
                    });
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    cmd: 'SongInfo',
                    username: data.username
                }));
            });
        } else plugged.sendChat(utils.replace(langfile.error.argument, {cmd: 'SongInfo', username: data.username}));
        plugged.removeChatMessage(data.cid);
    }
};

commands.catfact = commands.catfacts = {
    handler: function (data) {
        request('http://catfacts-api.appspot.com/api/facts', function (error, response, body) {
            if (!error && body != null) {
                plugged.sendChat(utils.replace(langfile.catfact.default, {
                    username: data.username,
                    fact: JSON.parse(body).facts[0]
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.next = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 0) {
                plugged.getPlaylist(config.playlists.play, function (err, list) {
                    if (!err) {
                        if ((plugged.getCurrentDJ() !== undefined ? plugged.getCurrentDJ().id === plugged.getSelf().id : false)) {
                            plugged.sendChat(utils.replace(langfile.next.default, {
                                username: data.username,
                                title: utils.mediatitle(list[1])
                            }));
                        } else {
                            plugged.sendChat(utils.replace(langfile.next.default, {
                                username: data.username,
                                title: utils.mediatitle(list[0])
                            }));
                        }
                    }
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.shuffleplaylist = commands.shufflepl = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                plugged.shufflePlaylist(config.playlists.play);
                plugged.sendChat(utils.replace(langfile.shuffle.default, {username: data.username}));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.join = {
    handler: function (data) {
        redis.exists('meta:roulette:active').then(function (ex) {
            if (ex === 1) {
                redis.sismember('meta:roulette:users', data.id).then(function (mem) {
                    if (mem === 0) redis.sadd('meta:roulette:users', data.id).then(function () {
                        plugged.sendChat(utils.replace(langfile.roulette.join, {username: data.username}));
                    });
                    else plugged.sendChat(utils.replace(langfile.roulette.already_joined, {username: data.username}));
                });
            } else plugged.sendChat(utils.replace(langfile.roulette.no_roulette, {username: data.username}));
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.leave = {
    handler: function (data) {
        redis.exists('meta:roulette:active').then(function (ex) {
            if (ex === 1) {
                redis.sismember('meta:roulette:users', data.id).then(function (mem) {
                    if (mem === 1) redis.srem('meta:roulette:users', data.id).then(function () {
                        plugged.sendChat(utils.replace(langfile.roulette.leave, {username: data.username}));
                    });
                    else plugged.sendChat(utils.replace(langfile.roulette.not_joined, {username: data.username}));
                });
            } else plugged.sendChat(utils.replace(langfile.roulette.no_roulette, {username: data.username}));
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.roulette = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                redis.exists('meta:roulette:active').then(function (exa) {
                    if (exa === 0) {
                        var split = data.message.trim().split(' ');
                        var m = (split.length < 2) ? NaN : parseInt(split[1]);
                        var t = (split.length < 3) ? 2 : parseInt(split[2]);
                        if (!isNaN(t) && !isNaN(m)) {
                            redis.set('meta:roulette:active', 1);
                            plugged.sendChat(utils.replace(langfile.roulette.default, {
                                username: data.username,
                                time: t,
                                moves: m
                            }));
                            setTimeout(function () {
                                redis.del('meta:roulette:active');
                                redis.scard('meta:roulette:users').then(function (memcount) {
                                    if (memcount === 0) {
                                        plugged.sendChat(utils.replace(langfile.roulette.no_joins, {username: data.username}));
                                    } else {
                                        plugged.sendChat(utils.replace(langfile.roulette.started, {
                                            username: data.username,
                                            users: memcount
                                        }));
                                        if (memcount < m) m = memcount;
                                        var users = [];
                                        getusers(m);
                                        function getusers(count) {
                                            redis.spop('meta:roulette:users').then(function (usr) {
                                                users.push(plugged.getUserByID(usr));
                                                if (count - 1 > 0) getusers(count - 1);
                                                else {
                                                    plugged.sendChat(langfile.roulette.lucky_winners);
                                                    users.forEach(function (user) {
                                                        plugged.sendChat(utils.replace(langfile.roulette.winner, {username: user.username}));
                                                    });
                                                    users.forEach(function (user) {
                                                        plugged.moveDJ(user.id, _.random(0, plugged.getWaitlist().length - 1));
                                                    });
                                                    redis.del('meta:roulette:users');
                                                }
                                            });
                                        }
                                    }
                                });
                            }, t * 60 * 1000);
                        } else plugged.sendChat(utils.replace(langfile.error.argument, {
                            username: data.username,
                            cmd: 'Lottery'
                        }));
                    }
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.lottery = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                var t = (split.length < 2) ? 2 : parseInt(split[1]);
                if (!isNaN(t)) {
                    plugged.sendChat(utils.replace(langfile.lottery.default, {username: data.username, time: t}));
                    if (t > 1) setTimeout(function () {
                        plugged.sendChat(utils.replace(langfile.lottery.one_minute, {username: data.username}));
                    }, (t - 1) * 60 * 1000);
                    setTimeout(function () {
                        var wl = utils.clone(plugged.getWaitlist());
                        choose();
                        function choose() {
                            var usr = wl[_.random(0, wl.length - 1)];
                            redis.exists('user:afk:' + usr).then(function (ex) {
                                if (ex === 1) {
                                    plugged.sendChat(utils.replace(langfile.lottery.winner, {
                                        username: plugged.getUserByID(usr).username,
                                        mod: data.username
                                    }));
                                    plugged.moveDJ(usr, 0);
                                } else {
                                    if (wl.length === 1) plugged.sendChat(utils.replace(langfile.lottery.no_winner, {username: data.username}));
                                    else {
                                        wl = _.without(wl, usr);
                                        choose();
                                    }
                                }
                            });
                        }
                    }, t * 60 * 1000);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'Lottery'
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.everyone = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                plugged.sendChat(utils.replace(langfile.everyone.default, {
                    username: data.username,
                    msg: _.rest(split, 1).join(' ').trim()
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

commands.toggleafk = {
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                config.afk.enabled = !config.afk.enabled;
                if (config.afk.enabled) plugged.sendChat(utils.replace(langfile.afk.enabled, {username: data.username}), 30);
                else plugged.sendChat(utils.replace(langfile.afk.disabled, {username: data.username}), 30);
                redis.set('meta:config:afk:enabled', (config.afk.enabled ? 1 : 0));
                story.info('afk', utils.userLogString(data.username, data.id) + ': --> ' + config.afk.enabled.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

module.exports = commands;