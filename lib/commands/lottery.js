let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['lottery'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                let split = data.message.trim().split(' ');
                let t = (split.length < 2) ? 2 : parseInt(split[1]);
                if (!isNaN(t)) {
                    plugged.sendChat(utils.replace(langfile.lottery.default, {username: data.username, time: t}));
                    if (t > 1) setTimeout(() => {
                        plugged.sendChat(utils.replace(langfile.lottery.one_minute, {username: data.username}));
                    }, (t - 1) * 60 * 1000);
                    setTimeout(() => {
                        let wl = utils.clone(plugged.getWaitlist());
                        choose();
                        function choose() {
                            let usr = wl[_.random(0, wl.length - 1)];
                            redis.exists(`user:afk:${usr}`).then(ex => {
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