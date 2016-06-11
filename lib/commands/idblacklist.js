var story = require('storyboard').mainStory;
var S = require('string');
var _ = require('underscore');
var URL = require('url');
var request = require('request');
var validator = require('validator');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require('../db/sql_db');

//todo fix
module.exports = {
    names: ['idblacklist', 'idbl'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                var split = data.message.trim().split(' ');
                if (split.length >= 2) {
                    if (validator.isURL(split[1], {
                            protocols: ['https'],
                            host_whitelist: ['youtube.com', 'youtu.be', 'soundcloud.com', 'www.youtube.com']
                        })) {
                        var url = URL.parse(split[1], true);
                        if (url.hostname === 'youtu.be') {
                            //noinspection JSUnresolvedFunction
                            blackl('1:' + S(url.pathname).replaceAll('/', '').s);
                        } else { //noinspection JSUnresolvedVariable
                            if (url.hostname === 'www.youtbe.com' && url.query.v !== undefined) {
                                //noinspection JSUnresolvedVariable
                                blackl('1:' + url.query.v)
                            } else if (url.hostname === 'soundcloud.com') {
                                request.get('https://api.soundcloud.com/resolve?client_id=' + config.apiKeys.soundcloud + '&url=' + split[1], function (err, resp, body) {
                                    if (!err && resp.statusCode === 200) {
                                        body = JSON.parse(body);
                                        blackl('2:' + body.id);
                                    }
                                });
                            } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                cmd: 'Blacklist',
                                username: data.username
                            }));
                        }
                    } else blackl(split[1]);

                    function blackl(sid) {
                        var mid = sid[1].split(':');
                        if (mid.length === 2) {
                            //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                            db.models.Song.findOrCreate({
                                where: {cid: mid[1], format: mid[0]},
                                defaults: {
                                    cid: mid[1],
                                    format: mid[0],
                                    is_banned: true,
                                    ban_reason: (split.length === 2 ? undefined : _.rest(split, 2).join(' ').trim())
                                }
                            }).spread(function (song) {
                                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                                song.updateAttributes({
                                    is_banned: true,
                                    ban_reason: (split.length === 2 ? undefined : utils.blacklistReason(_.rest(split, 2).join(' ').trim()))
                                });
                                //noinspection JSCheckFunctionSignatures
                                redis.set('media:blacklist:' + song.format + ':' + song.cid, (split.length === 2 ? 1 : _.rest(split, 2).join(' ').trim()));
                                plugged.sendChat(utils.replace(langfile.blacklist.idbl.default, {
                                    username: data.username,
                                    song: utils.songtitle(song.author, song.title)
                                }), 30);
                                story.info('blacklist', utils.userLogString(data.username, data.id) + ' added ' + utils.songtitle(song.author, song.title) + '[' + song.format + ':' + song.cid + '] to the blacklist');
                            });
                        } else plugged.sendChat(utils.replace(langfile.error.argument, {
                            username: data.username,
                            cmd: 'Blacklist'
                        }), 20);
                    }
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'Blacklist'
                }), 20);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};