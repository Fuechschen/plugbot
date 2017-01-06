let story = require('storyboard').mainStory;
let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let addqueue = require('../addqueue');

module.exports = {
    names: ['add', 'addwl'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                let split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                let user = plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user) {
                    utils.isWlBanned(user).then(isBanned => {
                        if (!isBanned) {
                            if ((() => {
                                    let waitlist = plugged.getWaitlist() || [];
                                    let dj = plugged.getDJ() || {id: -1};
                                    if (dj === user.id) return false;
                                    else return !waitlist.includes(user.id);
                                })()) {
                                plugged.sendChat(utils.replace(langfile.bp_actions.add, {username: data.username}), 45);
                                if (plugged.getWaitlist() === undefined || plugged.getWaitlist().length < 50) {
                                    plugged.addToWaitlist(user.id, err => {
                                        if (err) story.error('add', 'Error adding user to the waitlist.', {attach: err});
                                    });
                                } else addqueue.add(user.id, 100).then(() => {
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
                story.info('add', `${utils.userLogString(data.username, data.id)}: ${utils.userLogString(user)}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};