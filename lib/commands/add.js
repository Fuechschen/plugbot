var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['add', 'addwl'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    if (((plugged.getWaitlist() !== undefined) ? plugged.getWaitlist().indexOf(user.id) === -1 : false) && (plugged.getCurrentDJ() !== undefined ? plugged.getCurrentDJ().id !== user.id : true )) {
                        plugged.sendChat(utils.replace(langfile.bp_actions.add, {username: data.username}), 45);
                        if (plugged.getWaitlist().length < 50) {
                            plugged.addToWaitlist(user.id);
                        } else {
                            redis.sadd('meta:addqueue', user.id);
                            redis.set('meta:addqueue:user:' + data.id, -1);
                        }
                    }
                } else plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                    username: plugged.getUserByID(data.id),
                    value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                }), 20);
                story.info('add', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};