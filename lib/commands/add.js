var story = require('storyboard').mainStory;
var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var addqueue = require('../addqueue');

module.exports = {
    names: ['add', 'addwl'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                var user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user !== undefined) {
                    utils.isWlBanned(user).then(function (isBanned) {
                        if (!isBanned) {
                            if (function () {
                                    var waitlist = plugged.getWaitlist() || [];
                                    var dj = plugged.getDJ() || {id: -1};
                                    if (dj === user.id) return false;
                                    else return waitlist.indexOf(user.id) === -1;
                                }()) {
                                plugged.sendChat(utils.replace(langfile.bp_actions.add, {username: data.username}), 45);
                                if (plugged.getWaitlist() === undefined || plugged.getWaitlist().length < 50) {
                                    plugged.addToWaitlist(user.id, function (err) {
                                        if (err)story.error('add', 'Error adding user to the waitlist.', {attach: err});
                                    });
                                } else addqueue.add(user.id, 100).then(function () {
                                    plugged.sendChat(utils.replace(langfile.bp_actions.add_queue, {
                                        username: user.username,
                                        mod: data.username
                                    }));
                                });
                            }
                        } else plugged.sendChat(utils.replace(langfile.error.wl_banned, {
                            username: data.username,
                            cmd: 'Add'
                        }));
                    });
                } else { //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                        username: plugged.getUserByID(data.id),
                        value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                    }), 20);
                }
                story.info('add', utils.userLogString(data.username, data.id) + ': ' + utils.userLogString(user));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};