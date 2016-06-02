var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['move', 'mv'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                if (split.length > 2) {
                    var pos = parseInt(split[split.length - 1]);
                    var user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined && !isNaN(pos)) {
                        plugged.sendChat(utils.replace(langfile.move.default, {username: data.username}));
                        if (plugged.getWaitlist().indexOf(user.id) === -1) {
                            if (plugged.getWaitlist().length < 50) {
                                plugged.addToWaitlist(user.id);
                                plugged.moveDJ(user.id, pos - 1);
                            } else {
                                redis.zadd('meta:addqueue', pos - 1, user.id).then(function () {
                                    plugged.sendChat(utils.replace(langfile.move.addqueue, {
                                        username: user.username,
                                        mod: data.useranme,
                                        pos: pos
                                    }));
                                });
                            }
                        } else plugged.moveDJ(user.id, pos - 1);
                        story.info('move', utils.userLogString(data.username, data.id) + ' moved ' + utils.userLogString(user) + ' to ' + pos);
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'Move'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'Move'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};