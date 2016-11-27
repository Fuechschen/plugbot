let story = require('storyboard').mainStory;
let _ = require('underscore');

let db = require('../db/sql_db');
let redis = require('../db/redis_db');
let plugged = require('../client');
let utils = require('../utils');
const config = require('../load_config');
const langfile = require('../../langfile');

module.exports = {
    names: ['channelblacklist', 'cbl'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                let split = data.message.split(' ');
                if (split.length > 1) {
                    let cmd = split[1];
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
                                story.info('ChannelBlacklist', `${utils.userLogString(data.username, data.id)}: --> ${config.blacklist.channelblacklist.toString()}`);
                            } else plugged.sendChat(utils.replace(langfile.error.eventmode, {
                                username: data.username,
                                cmd: 'ChannelBlacklist'
                            }));
                            break;
                        case 'add':
                            let r = _.rest(split, 3).join(' ').trim();
                            //noinspection JSDuplicatedDeclaration
                            let cid = split[2];
                            db.channelblacklist.add(cid, (r.length > 0 ? r : null)).then(() => {
                                plugged.sendChat(utils.replace(langfile.blacklist.channelblacklist.add, {
                                    username: data.username,
                                    cid
                                }));
                            });
                            break;
                        case 'rem':
                            //noinspection JSDuplicatedDeclaration
                            db.channelblacklist.remove(split[2]).then(() => {
                                plugged.sendChat(utils.replace(langfile.blacklist.channelblacklist.remove, {
                                    username: data.username,
                                    cid:split[2]
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