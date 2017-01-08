let story = require('storyboard').mainStory;
let Promise = require('bluebird');

let redis = require('../db/redis_db');
let db = require('../db/sql_db');
let utils = require('../utils');
let plugged = require('../client');
const config = require('../load_config');
const langfile = require('../../langfile');
let addqueue = require('../addqueue');
let userfilters = require('../userfilters').filters;
let wsUpdate = require('../../web/index').wsGet('join');

module.exports = {
    event: [plugged.USER_JOIN, plugged.FRIEND_JOIN],
    handler: (user) => {
        if (user.id !== plugged.getSelf().id) {
            let greetStr = '&{welcome} &{dcmoveback}';
            let greet = false;
            let sendit = false;
            let moveAction = () => {

            };
            redis.set(`user:afk:${user.id}`, 1).then(() => {
                //noinspection JSUnresolvedFunction
                redis.expire(`user:afk:${user.id}`, config.afk.time);
            });
            Promise.resolve().then(() => {
                if (config.dcmoveback.enabled && config.dcmoveback.auto && !config.state.eventmode) {
                    return redis.get(`user:disconnect:${user.id}`).then(pos => {
                        if (pos !== null) {
                            pos = parseInt(pos);
                            if (pos !== -1 && pos > utils.wlPosition(user)) {
                                if ((plugged.getWaitlist() === undefined || plugged.getWaitlist().length < 50)) {
                                    moveAction = () => {
                                        if (utils.wlPosition(user) === -1) plugged.addToWaitlist(user.id);
                                        plugged.moveDJ(user.id, pos);
                                        //noinspection JSUnresolvedFunction
                                        redis.del(`user:disconnect:${user.id}`);
                                    };
                                    greetStr = utils.replace(greetStr, {dcmoveback: utils.replace(langfile.dcmoveback.move, {pos: (pos + 1).toString()})});
                                    sendit = true;
                                    return Promise.resolve();
                                }
                                return addqueue.add(user.id, pos).then(() => {
                                    greetStr = utils.replace(greetStr, {dcmoveback: utils.replace(langfile.dcmoveback.addqueue, {pos: (pos + 1).toString()})});
                                    sendit = true;
                                    //noinspection JSUnresolvedFunction
                                    return redis.del(`user:disconnect:${user.id}`);
                                });
                            }
                            greetStr = utils.replace(greetStr, {dcmoveback: ''}).trim();
                            //noinspection JSUnresolvedFunction
                            return redis.del(`user:disconnect:${user.id}`);

                        }
                        greetStr = utils.replace(greetStr, {dcmoveback: ''}).trim();
                        //noinspection JSUnresolvedFunction
                        return redis.del(`user:disconnect:${user.id}`);
                    });
                }
                greetStr = utils.replace(greetStr, {dcmoveback: ''}).trim();
                return Promise.resolve();
            }).then(() => db.models.User.find({where: {id: user.id}}).then(usr => {
                if (usr) {
                    if (usr.sRole > 0) { //noinspection JSUnresolvedFunction
                        redis.hset('user:roles', user.id, usr.sRole);
                    }
                    if (!usr.superUser && user.role !== usr.sRole) {
                        if (usr.sRole > 0) plugged.addStaff(user.id, usr.sRole);
                        else plugged.removeStaff(user.id);
                    }
                    if (config.options.welcome.old) {
                        greet = true;
                        greetStr = utils.replace(greetStr, {welcome: utils.replace(langfile.welcome.old, {username: user.username})});
                        sendit = true;
                    } else {
                        greetStr = utils.replace(greetStr, {welcome: ''}).trim();
                    }
                    return usr.updateAttributes({status: true, slug: user.slug, username: user.username});
                }
                if (config.options.welcome.old) {
                    greet = true;
                    greetStr = utils.replace(greetStr, {welcome: utils.replace(langfile.welcome.new, {username: user.username})});
                    sendit = true;
                } else greetStr = utils.replace(greetStr, {welcome: ''}).trim();
                return db.models.User.create({
                    id: user.id,
                    username: user.username,
                    slug: user.slug,
                    role: user.role,
                    globalRole: user.gRole,
                    badge: user.badge,
                    language: user.language,
                    avatarId: user.avatarID,
                    blurb: user.blurb
                });
            })).then(() => {
                Promise.all(userfilters.map(f => f(user))).then(() => {
                    setTimeout(() => {
                        if (sendit) {
                            plugged.sendChat((greet ? '' : '@' + user.username + ' ') + greetStr.trim());
                        }
                        moveAction();
                    }, 4 * 1000);
                }).catch(filter => {
                    //todo actually kick unwanted users
                    filter.hasOwnProperty('key');
                });
            });
            story.info('join', utils.userLogString(user));
            wsUpdate({id: user.id, n: user.username});
        }
    }
};