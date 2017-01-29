let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names:['state'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                let strings = [
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
                        key: langfile.state.keys.bouncerPlus,
                        val: config.options.bouncerPlus.toString()
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
                        val: config.lockskip.movePos
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.dcmoveback,
                        val: config.dcmoveback.enabled.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.cleverbot,
                        val: config.cleverbot.enabled.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.titleguard,
                        val: config.titleguard.enabled.toString()
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.joinmode,
                        val: config.options.joinmode.toString()
                    })
                ];
                strings.forEach(str => {
                    plugged.sendChat(str);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};