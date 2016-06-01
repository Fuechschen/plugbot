var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['lockskippos', 'lspos'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                if (split.length === 2) {
                    var pos = parseInt(split[1]);
                    if (!isNaN(pos) && pos > 0 && pos < 51) {
                        config.lockskip.move_pos = pos;
                        plugged.sendChat(utils.replace(langfile.skip.lockskippos, {
                            username: data.username,
                            pos: pos
                        }), 30);
                        story.info('locksippos', utils.userLogString(data.username, data.id) + ' set Lockskippos to ' + pos);
                        redis.set('meta:config:lockskip:move_pos', pos);
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        username: data.username,
                        cmd: 'LockSkipPos'
                    }), 20);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'LockSkipPos'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};