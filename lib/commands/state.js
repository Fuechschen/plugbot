var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['state'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
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
                    }),
                    utils.replace(langfile.state.format, {
                        key: langfile.state.keys.titleguard,
                        val: config.titleguard.enabled.toString()
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