var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var config = require('../load_config');
var utils = require('../utils');
var plugged = require('../client');
var addqueue = require('../addqueue');
var langfile = require('../../langfile');

module.exports = {
    names: ['dc', 'disconnected'],
    enabled: true,
    handler: function (data) {
        if (config.dcmoveback.enabled) {
            redis.get('user:disconnect:' + user.id).then(function (pos) {
                if (pos !== null) {
                    pos = parseInt(pos);
                    if (pos !== -1 && pos > utils.wlPosition(user)) {
                        if ((plugged.getWaitlist() === undefined || plugged.getWaitlist().length < 50)) {
                            plugged.sendChat(utils.replace(langfile.dcmoveback.command.move, {
                                username: data.username,
                                pos: (pos + 1).toString()
                            }));
                            if (utils.wlPosition(user) === -1) plugged.addToWaitlist(user.id);
                            plugged.moveDJ(user.id, pos);
                            redis.del('user:disconnect:' + user.id);
                        } else {
                            addqueue.add(user.id, pos).then(function () {
                                plugged.sendChat(utils.replace(langfile.dcmoveback.command.addqueue, {
                                    username: data.username,
                                    pos: (pos + 1).toString()
                                }));
                                redis.del('user:disconnect:' + user.id);
                            });
                        }
                    } else {
                        redis.del('user:disconnect:' + user.id);
                        plugged.sendChat(utils.replace(langfile.dcmoveback.command.on_wl, {username: data.username}));
                    }
                } else {
                    plugged.sendChat(utils.replace(langfile.dcmoveback.command.no_dc, {username: data.username}));
                }
            });
        }
        plugged.deleteMessage(data.cid);
    }
};