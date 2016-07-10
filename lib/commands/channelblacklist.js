var story = require('storyboard').mainStory;
var _ = require('underscore');

var db = require('../db/sql_db');
var redis = require('../db/redis_db');
var plugged = require('../client');
var utils = require('../utils');
var config = require('../load_config');
var langfile = require('../../langfile');

module.exports = {
    names: ['channelblacklist', 'cbl'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                if (split.length > 1) {
                    var cmd = split[1];
                    switch (cmd) {
                        default:
                            plugged.sendChat(utils.replace(langfile.error.argument, {
                                username: data.username,
                                cmd: 'ChannelBlacklist'
                            }), 20);
                            break;
                        case 'toggle':
                            if (!config.state.eventmode) {
                                config.blacklist.channelblacklist = !config.blacklist.channelblacklist;
                                if (config.blacklist.channelblacklist) plugged.sendChat(utils.replace(langfile.blacklist.channelblacklist.enabled, {username: data.username}), 30);
                                else plugged.sendChat(utils.replace(langfile.blacklist.channelblacklist.disabled, {username: data.username}), 30);
                                //noinspection JSUnresolvedFunction
                                redis.hset('meta:config', 'channelblacklist:enabled', (config.blacklist.channelblacklist ? 1 : 0));
                                story.info('ChannelBlacklist', utils.userLogString(data.username, data.id) + ': --> ' + config.blacklist.channelblacklist.toString());
                            } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                                username: data.username,
                                cmd: 'ChannelBlacklist'
                            }));
                            break;
                        case 'add':
                            var r = _.rest(split, 3).join(' ').trim();
                            //noinspection JSDuplicatedDeclaration
                            var cid = split[2];
                            db.channelblacklist.add(cid, (r.length > 0 ? r : null)).then(function () {
                                plugged.sendChat(utils.replace(langfile.blacklist.channelblacklist.add, {
                                    username: data.username,
                                    cid: cid
                                }));
                            });
                            break;
                        case 'rem':
                            //noinspection JSDuplicatedDeclaration
                            var cid = split[2];
                            db.channelblacklist.remove(cid).then(function () {
                                plugged.sendChat(utils.replace(langfile.blacklist.channelblacklist.remove, {
                                    username: data.username,
                                    cid: cid
                                }));
                            });
                            break;
                    }
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'ChannelBlacklist'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};