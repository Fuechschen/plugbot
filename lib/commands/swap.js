var S = require('string');

var plugged = require('../client');
var utils = require('../utils');
var langfile = require('../../langfile');
var config = require('../load_config');

module.exports = {
    names: ['swap'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                if(data.message.includes(' -nl')) {var noLock = true;data.message=data.message.replace(' -nl','')}
                var split = data.message.split('@');
                if (split.length === 3) {
                    //noinspection JSUnresolvedFunction
                    var u1 = plugged.getUserByName(S(split[1]).chompRight(' ').s);
                    //noinspection JSUnresolvedFunction
                    var u2 = plugged.getUserByName(S(split[2]).chompRight(' ').s);
                    if (u1 !== undefined && u2 !== undefined) {
                        if (utils.wlPosition(u1) !== -1 && utils.wlPosition(u2) !== -1) {
                            var pos = {u1: utils.wlPosition(u1), u2: utils.wlPosition(u2)};
                            plugged.sendChat(utils.replace(langfile.swap.default, {
                                username: data.username,
                                u1: u1.username,
                                u2: u2.username
                            }));
                            plugged.moveDJ(u1.id, pos.u2);
                            plugged.moveDJ(u2.id, pos.u1)
                        } else if (utils.wlPosition(u1) !== -1 && utils.wlPosition(u2) === -1) swapOutWaitlist(u1.id, u2.id);
                        else if (utils.wlPosition(u1) === -1 && utils.wlPosition(u2) !== -1) swapOutWaitlist(u2.id, u1.id);
                        else plugged.sendChat(utils.replace(langfile.swap.no_wl, {username: data.username}));

                        function swapOutWaitlist(inWl, outWL) {
                            utils.isWlBanned([inWl, outWL]).then(function (isB) {
                                if (!isB) {
                                    var pos = utils.wlPosition(inWl);
                                    var lock = plugged.isWaitlistLocked();
                                    plugged.sendChat(utils.replace(langfile.swap.default, {
                                        username: data.username,
                                        u1: u1.username,
                                        u2: u2.username
                                    }));

                                    if(noLock)doIt();
                                    else plugged.setLock(true,false,doIt);

                                    function doIt(){
                                        plugged.removeDJ(inWl, function () {
                                            plugged.addToWaitlist(outWL, function () {
                                                plugged.moveDJ(outWL, pos);
                                                if(!noLock)plugged.setLock(lock, false);
                                            });
                                        });
                                    }
                                } else plugged.sendChat(utils.replace(langfile.error.wl_banned, {
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