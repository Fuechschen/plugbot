var story = require('storyboard').mainStory;
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['welcomemsg'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                var split = data.message.trim().split(' ');
                if (split.length > 1) {
                    var meta = plugged.getRoomMeta();
                    if (split[1] === 'none' && split.length === 2) {
                        plugged.updateRoomInfo(meta.name, meta.description, '');
                    } else {
                        //noinspection JSCheckFunctionSignatures
                        plugged.updateRoomInfo(meta.name, meta.description, _.rest(split, 1).join(' ').trim());
                    }
                    plugged.sendChat(utils.replace(langfile.roomedit.welcomemsg, {username: data.username}), 30);
                    //noinspection JSCheckFunctionSignatures
                    story.info('welcomemsg', utils.userLogString(data.username, data.id) + ': --> ' + _.rest(split, 1).join(' ').trim());
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'Welcome'
                }), 30);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};