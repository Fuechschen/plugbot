var story = require('storyboard').mainStory;
var S = require('string');
var request = require('request');
var URL = require('url');
var validator = require('validator');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['removehistory', 'rmh'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var split = data.message.trim().split(' ');
                if (split.length === 2) {
                    if (validator.isURL(split[1], {
                            protocols: ['https'],
                            host_whitelist: ['youtube.com', 'youtu.be', 'soundcloud.com', 'www.youtube.com']
                        })) {
                        var url = URL.parse(split[1], true);
                        if (url.hostname === 'youtu.be') {
                            //noinspection JSUnresolvedFunction
                            remove('1:' + S(url.pathname).replaceAll('/', '').s);
                        } else { //noinspection JSUnresolvedVariable
                            if (url.hostname === 'www.youtbe.com' && url.query.v !== undefined) {
                                //noinspection JSUnresolvedVariable
                                remove('1:' + url.query.v)
                            } else if (url.hostname === 'soundcloud.com') {
                                request.get('https://api.soundcloud.com/resolve?client_id=' + config.apiKeys.soundcloud + '&url=' + split[1], function (err, resp, body) {
                                    if (!err && resp.statusCode === 200) {
                                        body = JSON.parse(body);
                                        remove('2:' + body.id);
                                    }
                                });
                            } else plugged.sendChat(utils.replace(langfile.error.argument, {
                                cmd: 'RemoveHistory',
                                username: data.username
                            }));
                        }
                    } else remove(split[1]);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    cmd: 'RemoveHistory',
                    username: data.username
                }));

                function remove(mid) {
                    //noinspection JSUnresolvedFunction
                    redis.del('media:history:' + mid).then(function (r) {
                        if (r === 1) {
                            plugged.sendChat(utils.replace(langfile.skip.history.remove, {username: data.username}));
                            story.info('History', utils.userLogString(data.username, data.id) + ' removed ' + mid + ' from the history.');
                        }
                        else plugged.sendChat(utils.replace(langfile.error.argument, {
                            cmd: 'RemoveHistory',
                            username: data.username
                        }));
                    });
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};