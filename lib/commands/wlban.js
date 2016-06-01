var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['wlban'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.split(' ');
                if (split.length >= 2) {
                    var user = plugged.getUserByName(S(_.initial(_.rest(split, 1)).join(' ')).chompLeft('@').chompRight(' ').s);
                    if (user !== undefined) {
                        plugged.sendChat(utils.replace(langfile.wlban.default, {
                            username: user.username,
                            mod: data.username
                        }));
                        redis.set('user:waitlist:ban:' + data.id, 1);
                        if (utils.wlPosition(user.id) !== -1) plugged.removeDJ(user.id);
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};