var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');
var addqueue = require('../addqueue');
var userfilters = require('../userfilters').filters;
var wsUpdate = require('../../web/index').wsGet('join');

module.exports = {
    event: [plugged.USER_JOIN, plugged.FRIEND_JOIN],
    handler: function (user) {
        if (user.id !== plugged.getSelf().id) {
            var greetStr = '&{welcome} &{dcmoveback}';
            var greet = false;
            var moveAction = function () {

            };
            redis.set('user:afk:' + user.id, 1).then(function () {
                redis.expire('user:afk:' + user.id, config.afk.time);
            });
            Promise.resolve().then(function () {
                if (config.dcmoveback.enabled && config.dcmoveback.auto && !config.state.eventmode) {
                    return redis.get('user:disconnect:' + user.id).then(function (pos) {
                        if (pos !== null) {
                            pos = parseInt(pos);
                            if (pos !== -1 && pos > utils.wlPosition(user)) {
                                if ((plugged.getWaitlist() === undefined || plugged.getWaitlist().length < 50)) {
                                    moveAction = function () {
                                        if (utils.wlPosition(user) === -1) plugged.addToWaitlist(user.id);
                                        plugged.moveDJ(user.id, pos);
                                        redis.del('user:disconnect:' + user.id);
                                    };
                                    greetStr = utils.replace(greetStr, {dcmoveback: utils.replace(langfile.dcmoveback.move, {pos: (pos + 1).toString()})});
                                    return Promise.resolve();
                                } else {
                                    return addqueue.add(user.id, pos).then(function () {
                                        greetStr = utils.replace(greetStr, {dcmoveback: utils.replace(langfile.dcmoveback.addqueue, {pos: (pos + 1).toString()})});
                                        return redis.del('user:disconnect:' + user.id);
                                    });
                                }
                            } else {
                                greetStr = utils.replace(greetStr, {dcmoveback: ''}).trim();
                                return redis.del('user:disconnect:' + user.id);
                            }
                        } else {
                            greetStr = utils.replace(greetStr, {dcmoveback: ''}).trim();
                            return redis.del('user:disconnect:' + user.id);
                        }
                    });
                } else {
                    greetStr = utils.replace(greetStr, {dcmoveback: ''}).trim();
                    return Promise.resolve();
                }
            }).then(function () {
                return db.models.User.find({where: {id: user.id}}).then(function (usr) {
                    if (usr !== null && usr !== undefined) {
                        if (usr.s_role > 0) redis.hset('user:roles', user.id, usr.s_role);
                        if (!usr.super_user && user.role !== usr.s_role) {
                            if (usr.s_role > 0) plugged.addStaff(user.id, usr.s_role);
                            else plugged.removeStaff(user.id);
                        }
                        if (config.options.welcome.old) {
                            greet = true;
                            greetStr = utils.replace(greetStr, {welcome: utils.replace(langfile.welcome.old, {username: user.username})});
                        } else {
                            greetStr = utils.replace(greetStr, {welcome: ''}).trim();
                        }
                        return usr.updateAttributes({status: true, slug: user.slug, username: user.username});
                    } else {
                        if (config.options.welcome.old) {
                            greet = true;
                            greetStr = utils.replace(greetStr, {welcome: utils.replace(langfile.welcome.new, {username: user.username})});
                        } else {
                            greetStr = utils.replace(greetStr, {welcome: ''}).trim();
                        }
                        return db.models.User.create({
                            id: user.id,
                            username: user.username,
                            slug: user.slug,
                            role: user.role,
                            global_role: user.gRole,
                            badge: user.badge,
                            language: user.language,
                            avatar_id: user.avatarID,
                            blurb: user.blurb
                        });
                    }
                });
            }).then(function () {
                Promise.all(userfilters.map(function (f) {
                    return f(user);
                })).then(function () {
                    setTimeout(function () {
                        plugged.sendChat((greet ? '' : '@' + data.username + ' ') + greetStr.trim());
                        moveAction();
                    }, 4 * 1000);
                }).catch(function (filter) {

                });
            });
            story.info('join', utils.userLogString(user));
            wsUpdate({id:user.id,n:user.username});
        }
    }
};