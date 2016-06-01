var story = require('storyboard').mainStory;
var S = require('string');
var _ = require('underscore');

var redis = require('./db/redis_db');
var config = require('./load_config');
var plugged = require('./client');

var cleverbot;

module.exports = {
    replace: function (str, replacer) {
        var keys = _.keys(replacer);
        var string = S(str);
        keys.forEach(function (key) {
            string = string.replaceAll('&{' + key + '}', replacer[key] || '');
        });
        return string.s;
    },
    songtitle: function (author, title) {
        return author + ' - ' + title;
    },
    mediatitle: function (media) {
        return media.author + ' - ' + media.title;
    },
    role: function (role) {
        var r;
        switch (role) {
            case 'none':
                r = plugged.USERROLE.NONE;
                break;
            case 'rdj':
                r = plugged.USERROLE.RESIDENTDJ;
                break;
            case 'bouncer':
                r = plugged.USERROLE.BOUNCER;
                break;
            case 'manager':
                r = plugged.USERROLE.MANAGER;
                break;
            case 'co-host':
                r = plugged.USERROLE.COHOST;
                break;
            case 'host':
                r = plugged.USERROLE.HOST;
                break;
            case 0:
                r = plugged.USERROLE.NONE;
                break;
            case 1:
                r = plugged.USERROLE.RESIDENTDJ;
                break;
            case 2:
                r = plugged.USERROLE.BOUNCER;
                break;
            case 3:
                r = plugged.USERROLE.MANAGER;
                break;
            case 4:
                r = plugged.USERROLE.COHOST;
                break;
            case 5:
                r = plugged.USERROLE.HOST;
                break;
            default:
                r = undefined;
                break;
        }
        return r;
    },
    permlevel: function (role) {
        var r;
        switch (role) {
            case plugged.USERROLE.NONE:
                r = 0;
                break;
            case plugged.USERROLE.RESIDENTDJ:
                r = 1;
                break;
            case plugged.USERROLE.BOUNCER:
                r = 2;
                break;
            case plugged.USERROLE.MANAGER:
                r = 3;
                break;
            case plugged.USERROLE.COHOST:
                r = 4;
                break;
            case plugged.USERROLE.HOST:
                r = 5;
                break;
            default:
                r = undefined;
                break;
        }
        return r;
    },
    rolename: function (role) {
        var r;
        switch (role) {
            case plugged.USERROLE.NONE:
                r = langfile.setstaff.roles.user;
                break;
            case plugged.USERROLE.RESIDENTDJ:
                r = langfile.setstaff.roles.rdj;
                break;
            case plugged.USERROLE.BOUNCER:
                r = langfile.setstaff.roles.bouncer;
                break;
            case plugged.USERROLE.MANAGER:
                r = langfile.setstaff.roles.manager;
                break;
            case plugged.USERROLE.COHOST:
                r = langfile.setstaff.roles.cohost;
                break;
            case plugged.USERROLE.HOST:
                r = langfile.setstaff.roles.host;
                break;
            default:
                r = langfile.setstaff.roles.undef;
                break;
        }
        return r;
    },
    blacklistReason: function (str) {
        var string = S(str);
        var keys = _.keys(langfile.blacklist.reasons);
        keys.forEach(function (key) {
            string = string.replaceAll('#' + key, langfile.blacklist.reasons[key]);
        });
        return string.s;
    },
    checkVoteSkip: function (score) {
        switch (typeof config.voteskip.condition) {
            default:
                return false;
                break;
            case 'number':
                if (score.mehs >= config.voteskip.condition) return true;
                break;
            case 'function':
                if (config.voteskip.condition(score)) return true;
                break;
            case 'object':
                if (config.voteskip.condition.max <= score.mehs) return true;
                else if (config.voteskip.condition.min <= score.mehs)return ((score.mehs / score.userCount) >= config.voteskip.condition.ratio);
                else return false;
                break;
        }
    },
    userLogString: function (user, id) {
        return (typeof user === 'object' ? user.username + '[' + user.id + ']' : user + '[' + id + ']');
    },
    mediatitlelog: function (media) {
        return media.author + ' - ' + media.title + '[' + media.id + '|' + media.format + '|' + media.cid + ']';
    },
    clone: function (obj, options) {
        options = options || {};
        if (options.deep === undefined) options.deep = false;
        if (options.exclude === undefined) options.exclude = [];
        function copy (obj, level) {
            if (obj == null || typeof obj !== 'object') return obj;
            var clone, i;
            if (obj instanceof Array) {
                clone = [];
                for (i = 0; i < obj.length; i++) {
                    if (!obj.hasOwnProperty(i)) continue;
                    if (options.deep && level < 4) clone.push(copy(obj[i], level + 1));
                    else clone.push(obj[i]);
                }
            } else {
                clone = {};
                for (i in obj) {
                    if (!obj.hasOwnProperty(i)) continue;
                    if (options.exclude[level] !== undefined && options.exclude[level].indexOf(i) !== -1) continue;
                    if (options.deep && level < 4) clone[i] = copy(obj[i], level + 1);
                    else clone[i] = obj[i];
                }
            }
            return clone;
        }

        return copy(obj, 0);
    },
    contains: function (string, array) {
        var str = S(string.toLowerCase());
        for (var i = 0; i < array.length; i++) {
            if (str.contains(array[i])) return true;
        }
        return false;
    },
    containsplug: function (string) {
        return S(string).contains('https://plug.dj/');
        //return  string.match(/https?:\/\/plug\.dj\/.+/i).length === string.match(/https?:\/\/[sb][ul][po][pg]o?r?t?\.?plug\.dj\//i).length
    },
    wlPosition: function (user, wl) {
        wl = wl || plugged.getWaitlist();
        return wl.indexOf(user.id);
    },
    afk: {
        warn_1: function (arr) {
            var usernames = '';
            for (var i = 0; i < arr.length; i++) {
                usernames += utils.replace(langfile.afk.usernames, {username: plugged.getUserByID(arr[i]).username});
            }
            plugged.sendChat(utils.replace(langfile.afk.warn_1, {usernames: usernames}));
            setTimeout(function () {
                utils.afk.warn_2(arr);
            }, config.afk.warn * 1000);
        },
        warn_2: function (arr) {
            var afks = [];
            checkafks(0);

            function checkafks (index) {
                redis.exists('user:afk:' + arr[index]).then(function (ex) {
                    if (ex === 1) afks.push(arr[index]);
                    if (arr.length > index + 1) checkafks(index + 1);
                    else {
                        var usernames = '';
                        for (var i = 0; i < afks.length; i++) {
                            usernames += utils.replace(langfile.afk.usernames, {username: plugged.getUserByID(afks[i]).username});
                        }
                        plugged.sendChat(utils.replace(langfile.afk.warn_2, {usernames: usernames}));
                        setTimeout(function () {
                            utils.afk.remove(afks);
                        }, config.afk.remove * 1000);
                    }
                });
            }
        },
        remove: function (arr) {
            var kicks = [];
            var removes = [];
            decide(0);

            function decide (index) {
                redis.exists('user:afk:' + arr[index]).then(function (ex) {
                    if (ex === 1) {
                        redis.get('user:afk:' + arr[index] + ':removes').then(function (rems) {
                            rems = parseInt(rems, 10);
                            if (rems >= config.afk.kick) kicks.push(arr[index]);
                            else removes.push(arr[index]);
                            if (arr.length > index + 1) decide(index + 1);
                            else doitnow();
                        })
                    }
                });
            }

            function doitnow () {
                kicks.forEach(function (id) {
                    kickafk(id)
                });
                var usernames = '';
                for (var i = 0; i < removes.length; i++) {
                    usernames += utils.replace(langfile.afk.usernames, {username: plugged.getUserByID(removes[i]).username});
                }
                plugged.sendChat(utils.replace(langfile.afk.remove, {usernames: usernames}));
                removes.forEach(function (id) {
                    plugged.removeDJ(id);
                });
            }

            function kickafk (id) {
                plugged.sendChat(utils.replace(langfile.afk.kick, {username: plugged.getUserByID(id).username}));
                plugged.banUser(id, plugged.BANDURATION.HOUR, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                setTimeout(function () {
                    plugged.unbanUser(id);
                }, 10 * 1000);
            }
        }
    }
};