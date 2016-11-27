var plugged = require('../client');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var addqueue = require('../addqueue');

module.exports = {
    names: ['play'],
    enabled: true,
    handler: function (data) {
        if (config.options.joinmode) {
            if (!config.state.eventmode) {
                utils.isWlBanned(data.id).then(isBanned => {
                    if (!isBanned) {
                        if (((() => {
                                var waitlist = plugged.getWaitlist() || [];
                                var dj = plugged.getDJ() || {id: -1};
                                if (dj === data.id) return false;
                                else return !waitlist.includes(data.id);
                            })())) {
                            if (plugged.getWaitlist() === undefined || plugged.getWaitlist().length < 50) {
                                plugged.addToWaitlist(data.id);
                            } else {
                                addqueue.add(data.id, 150).then(() => {
                                    plugged.sendChat(utils.replace(langfile.joinmode.add_queue, {
                                        username: data.username
                                    }));
                                });
                            }
                        }
                    } else plugged.sendChat(utils.replace(langfile.joinmode.wlban, {username: data.username}));
                });
            } else plugged.sendChat(utils.replace(langfile.error.eventmode, {username: data.username, cmd: 'Play'}));
        }
        plugged.removeChatMessage(data.cid);
    }
};