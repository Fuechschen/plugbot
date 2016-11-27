var S = require('string');
var _ = require('underscore');
var Promise = require('bluebird');
var request = require('request');
var validator = require('validator');
var URL = require('url');

var redis = require('./db/redis_db');
var config = require('./load_config');
var plugged = require('./client');
var langfile = require('../langfile');

var utils = {
    replace: (str, replacer)=> {
        var keys = _.keys(replacer);
        var string = S(str);
        keys.forEach(key => {
            //noinspection JSUnresolvedFunction
            string = string.replaceAll(`&{${key}}`, replacer[key] || '');
        });
        //noinspection JSUnresolvedVariable
        return string.s;
    },
    songtitle: (author, title)=> `${author} - ${title}`,
    mediatitle: (media)=> `${media.author} - ${media.title}`,
    role: (role)=> {
        if (role === 'none' || role === 0) return plugged.USERROLE.NONE;
        else if (role === 'rdj' || role === 1) return plugged.USERROLE.RESIDENTDJ;
        else if (role === 'bouncer' || role === 2) return plugged.USERROLE.BOUNCER;
        else if (role === 'manager' || role === 3) return plugged.USERROLE.MANAGER;
        else if (role === 'co-host' || role === 4) return plugged.USERROLE.COHOST;
        else if (role === 'host' || role === 5) return plugged.USERROLE.HOST;
        else return undefined;
    },
    permlevel: (role)=> {
        if (role === plugged.USERROLE.NONE) return 0;
        else if (role === plugged.USERROLE.RESIDENTDJ) return 1;
        else if (role === plugged.USERROLE.BOUNCER) return 2;
        else if (role === plugged.USERROLE.MANAGER) return 3;
        else if (role === plugged.USERROLE.COHOST) return 4;
        else if (role === plugged.USERROLE.HOST) return 5;
        else return undefined;
    },
    rolename: (role)=> {
        if (role === plugged.USERROLE.NONE) return langfile.setstaff.roles.user;
        else if (role === plugged.USERROLE.RESIDENTDJ) return langfile.setstaff.roles.rdj;
        else if (role === plugged.USERROLE.BOUNCER) return langfile.setstaff.roles.bouncer;
        else if (role === plugged.USERROLE.MANAGER) return langfile.setstaff.roles.manager;
        else if (role === plugged.USERROLE.COHOST) return langfile.setstaff.roles.cohost;
        else if (role === plugged.USERROLE.HOST) return langfile.setstaff.roles.host;
        else return langfile.setstaff.roles.undef;
    },
    blacklistReason: (str)=> {
        var string = S(str);
        var keys = _.keys(langfile.blacklist.reasons);
        keys.forEach(key => {
            //noinspection JSUnresolvedFunction
            string = string.replaceAll(`#${key}`, langfile.blacklist.reasons[key]);
        });
        //noinspection JSUnresolvedVariable
        return string.s;
    },
    userLogString: (user, id)=> (typeof user === 'object' ? `${user.username}[${user.id}]` : `${user}[${id}]`),
    mediatitlelog: (media)=> `${media.author} - ${media.title}[${media.id}|${media.format}|${media.cid}]`,
    clone: (obj, options = {})=> {
        if (options.deep === undefined) options.deep = false;
        if (options.exclude === undefined) options.exclude = [];
        function copy(obj, level) {
            if (obj == null || typeof obj !== 'object') return obj;
            var clone, i;
            if (obj instanceof Array) {
                clone = [];
                for (i = 0; i < obj.length; i++) {
                    //noinspection JSCheckFunctionSignatures
                    if (!obj.hasOwnProperty(i)) continue;
                    if (options.deep && level < 4) clone.push(copy(obj[i], level + 1));
                    else clone.push(obj[i]);
                }
            } else {
                clone = {};
                for (i in obj) {
                    if (!obj.hasOwnProperty(i)) continue;
                    if (options.exclude[level] !== undefined && options.exclude[level].includes(i)) continue;
                    if (options.deep && level < 4) clone[i] = copy(obj[i], level + 1);
                    else clone[i] = obj[i];
                }
            }
            return clone;
        }

        return copy(obj, 0);
    },
    contains: (string, array)=> {
        //noinspection JSUnresolvedFunction
        var str = S(string.toLowerCase());
        for (var i = 0; i < array.length; i++) {
            //noinspection JSUnresolvedFunction
            if (str.contains(array[i])) return true;
        }
        return false;
    },
    wlPosition: (user, wl = plugged.getWaitlist())=> {
        if (typeof user === 'object') user = user.id;
        return wl.indexOf(user);
    },
    isWlBanned: (user)=> {
        return new Promise((resolve, reject) => {
            if (Array.isArray(user)) {
                Promise.all(user.map(u => {
                    if (typeof user === 'object') u = u.id;
                    return redis.exists(`user:waitlist:ban:${u}`);
                })).then(ex => {
                    resolve(!ex.includes(1));
                });
            } else {
                if (typeof user === 'object') user = user.id;
                redis.exists(`user:waitlist:ban:${user}`).then(ex => {
                    resolve(ex === '1');
                }).catch(reject);
            }
        });
    },
    resolveCID: (input)=> {
        return new Promise((resolve, reject) => {
            if (validator.isURL(input, {
                    protocols: ['https'],
                    host_whitelist: ['youtube.com', 'youtu.be', 'soundcloud.com', 'www.youtube.com']
                })) {
                var url = URL.parse(input, true);
                if (url.hostname === 'youtu.be') {
                    //noinspection JSUnresolvedFunction
                    resolve(`1:${S(url.pathname).replaceAll('/', '').s}`);
                } else { //noinspection JSUnresolvedVariable
                    if ((url.hostname === 'www.youtbe.com' || url.hostname === 'youtube.com') && url.query.v !== undefined) {
                        //noinspection JSUnresolvedVariable
                        resolve(`1:${url.query.v}`)
                    } else if (url.hostname === 'soundcloud.com') {
                        request.get(`https://api.soundcloud.com/resolve?client_id=${config.apiKeys.soundcloud}&url=${input}`, (err, resp, body) => {
                            if (!err && resp.statusCode === 200) {
                                body = JSON.parse(body);
                                resolve(`2:${body.id}`);
                            } else reject(new Error('SoundCloudApiError'));
                        });
                    } else reject(new Error('invalid input'));
                }
            } else if ((/[12]:[A-Za-z0-9]{1,12}/).test(input)) resolve(input);
            else reject(new Error('invalid input'));
        });
    }
};

module.exports = utils;