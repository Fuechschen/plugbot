let S = require('string');

let plugged = require('../client');
let utils = require('../utils');
let redis = require('../db/redis_db');
const langfile = require('../../langfile');
const config = require('../load_config');

module.exports = {
    names: ['swap'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                let noLock = false;
                if (data.message.includes(' -nl')) {
                    noLock = true;
                    data.message = data.message.replace(' -nl', '');
                }
                let split = data.message.split('@');
                if (split.length === 3) {
                    //noinspection JSUnresolvedFunction
                    let u1 = plugged.getUserByName(S(split[1]).chompRight(' ').s);
                    //noinspection JSUnresolvedFunction
                    let u2 = plugged.getUserByName(S(split[2]).chompRight(' ').s);
                    if (u1 && u2) {
                        if (utils.wlPosition(u1) !== -1 && utils.wlPosition(u2) !== -1) {
                            let pos = {u1: utils.wlPosition(u1), u2: utils.wlPosition(u2)};
                            plugged.sendChat(utils.replace(langfile.swap.default, {
                                username: data.username,
                                u1: u1.username,
                                u2: u2.username
                            }));
                            plugged.moveDJ(u1.id, pos.u2);
                            plugged.moveDJ(u2.id, pos.u1);
                        } else if (utils.wlPosition(u1) !== -1 && utils.wlPosition(u2) === -1) swapOutWaitlist(u1.id, u2.id);
                        else if (utils.wlPosition(u1) === -1 && utils.wlPosition(u2) !== -1) swapOutWaitlist(u2.id, u1.id);
                        else plugged.sendChat(utils.replace(langfile.swap.noWl, {username: data.username}));

                        function swapOutWaitlist(inWl, outWL) {
                            utils.isWlBanned([inWl, outWL]).then(isB => {
                                if (!isB) {
                                    let pos = utils.wlPosition(inWl);
                                    let lock = plugged.isWaitlistLocked();
                                    plugged.sendChat(utils.replace(langfile.swap.default, {
                                        username: data.username,
                                        u1: u1.username,
                                        u2: u2.username
                                    }));

                                    if (noLock) doIt();
                                    else plugged.setLock(true, false, doIt);

                                    function doIt() {
                                        plugged.removeDJ(inWl, () => {
                                            plugged.addToWaitlist(outWL, () => {
                                                plugged.moveDJ(outWL, pos);
                                                if (!noLock) plugged.setLock(lock, false);
                                            });
                                        });
                                    }
                                } else plugged.sendChat(utils.replace(langfile.error.wlBanned, {
                                    username: data.username,
                                    cmd: 'Swap'
                                }));
                            });
                        }
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'Swap'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.swap.usage, {username: data.username}));
                plugged.deleteMessage(data.cid);
            }
        });
    }
};