var story = require('storyboard').mainStory;
var request = require('request');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['songinfo', 'sinfo'],
    handler: function (data) {
        var split = data.message.trim().split(' ');
        var sid;
        if (split.length === 2) {
            if (validator.isURL(split[1], {
                    protocols: ['https'],
                    host_whitelist: ['youtube.com', 'youtu.be', 'soundcloud.com', 'www.youtube.com']
                })) {
                var url = URL.parse(split[1], true);
                if (url.hostname === 'youtu.be') {
                    lookup('1:' + S(url.pathname).replaceAll('/', '').s);
                } else if (url.hostname === 'www.youtbe.com' && url.query.v !== undefined) {
                    lookup('1:' + url.query.v)
                } else if (url.hostname === 'soundcloud.com') {
                    request.get('https://api.soundcloud.com/resolve?client_id=' + config.apiKeys.soundcloud + '&url=' + split[1], function (err, resp, body) {
                        if (!err && resp.statusCode === 200) {
                            body = JSON.parse(body);
                            lookup('2:' + body.id);
                        }
                    });
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    cmd: 'SongInfo',
                    username: data.username
                }));
            } else lookup(split[1]);
        } else lookup(plugged.getMedia().format + ':' + plugged.getMedia().cid);


        function lookup(sid) {
            if (sid.length > 8 && S(sid).contains(':')) {
                var sp = sid.split(':');
                db.models.Song.find({where: {cid: sp[1], format: sp[0]}}).then(function (song) {
                    if (song !== null && song !== undefined) {
                        redis.exists('media:blacklist:' + song.format + ':' + song.cid).then(function (bl) {
                            redis.exists('media:history:' + song.format + ':' + song.cid).then(function (his) {
                                plugged.sendChat(utils.replace(langfile.songinfo.default, {
                                    username: data.username,
                                    title: utils.songtitle(song.author, song.title),
                                    bl: (bl === 1) ? ((song.ban_reason !== undefined && song.ban_reason !== null) ? true.toString() + ' ' + utils.replace(langfile.songinfo.bl_reason, {reason: song.ban_reason}) : true.toString()) : false.toString(),
                                    his: (his === 1).toString(),
                                    sid: sid
                                }));
                            });
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        cmd: 'SongInfo',
                        username: data.username
                    }));
                });
            } else plugged.sendChat(utils.replace(langfile.error.argument, {cmd: 'SongInfo', username: data.username}));
        }

        plugged.removeChatMessage(data.cid);
    }
};