var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['swap'],
    enabled: true,
    handler: function (data) {
        var split = data.message.split('@');
        if (split.length === 3) {
            var u1 = plugged.getUserByName(S(split[1]).chompRight(' ').s);
            var u2 = plugged.getUserByName(split[2]);
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
                else {
                    //todo send not in waitlist
                }

                function swapOutWaitlist(inWl, outWL) {
                    var pos = utils.wlPosition(inWl);
                    var lock = plugged.isWaitlistLocked();
                    plugged.sendChat(utils.replace(langfile.swap.default, {
                        username: data.username,
                        u1: u1.username,
                        u2: u2.username
                    }));
                    plugged.setLock(true, false, function () {
                        plugged.removeDJ(inWl, function () {
                            plugged.addToWaitlist(outWL, function () {
                                plugged.moveDJ(outWL, pos);
                                plugged.setLock(lock, false);
                            });
                        });
                    });
                }
            } else {
                //todo send error args
            }
        } else {
            //todo send wrong args
        }
    }
};