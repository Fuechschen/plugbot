var story = require('storyboard').mainStory;
var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['remove', 'rm', 'rem', 'rmwl'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    if (plugged.getWaitlist().includes(user.id) || plugged.getCurrentDJ().id === user.id) {
                        plugged.sendChat(utils.replace(langfile.bp_actions.remove, {username: data.username}), 45);
                        plugged.removeDJ(user.id);
                    }
                } else { //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                        username: plugged.getUserByID(data.id),
                        value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                    }), 20);
                }
                story.info('remove', `${utils.userLogString(data.username, data.id)}: ${utils.userLogString(user)}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};