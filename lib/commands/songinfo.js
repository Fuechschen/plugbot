let request = require('request');
let URL = require('url');
let S = require('string');
let validator = require('validator');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require("../db/sql_db.js");

module.exports = {
    names: ['songinfo', 'sinfo'],
    enabled: true,
    handler: (data) => {
        let split = data.message.trim().split(' ');
        if (split.length === 2) {
            if (validator.isURL(split[1], {
                    protocols: ['https'],
                    host_whitelist: ['youtube.com', 'youtu.be', 'soundcloud.com', 'www.youtube.com'] //eslint-disable-line camelcase
                })) {
                let url = URL.parse(split[1], true);
                if (url.hostname === 'youtu.be') {
                    //noinspection JSUnresolvedFunction
                    lookup(`1:${S(url.pathname).replaceAll('/', '').s}`);
                } else { //noinspection JSUnresolvedletiable
                    if (url.hostname === 'www.youtbe.com' && url.query.v) {
                        //noinspection JSUnresolvedletiable
                        lookup(`1:${url.query.v}`);
                    } else if (url.hostname === 'soundcloud.com') {
                        request.get(`https://api.soundcloud.com/resolve?client_id=${config.apiKeys.soundcloud}&url=${split[1]}`, (err, resp, body) => {
                            if (!err && resp.statusCode === 200) {
                                body = JSON.parse(body);
                                lookup(`2:${body.id}`);
                            }
                        });
                    } else plugged.sendChat(utils.replace(langfile.error.argument, {
                        cmd: 'SongInfo',
                        username: data.username
                    }));
                }
            } else lookup(split[1]);
        } else lookup(`${plugged.getMedia().format}:${plugged.getMedia().cid}`);


        function lookup(sid) {
            //noinspection JSUnresolvedFunction
            if (sid.length > 8 && S(sid).contains(':')) {
                let sp = sid.split(':');
                db.models.Song.find({where: {cid: sp[1], format: sp[0]}}).then(song => {
                    if (song) {
                        redis.exists(`media:blacklist:${song.format}:${song.cid}`).then(bl => {
                            redis.exists(`media:history:${song.format}:${song.cid}`).then(his => {
                                plugged.sendChat(utils.replace(langfile.songinfo.default, {
                                    username: data.username,
                                    title: utils.songtitle(song.author, song.title),
                                    bl: (bl === 1) ? ((song.banReason) ? `${true.toString()} ${utils.replace(langfile.songinfo.blReason, {reason: song.banReason})}` : true.toString()) : false.toString(),
                                    his: (his === 1).toString(),
                                    sid
                                }));
                            });
                        });
                        //todo send not found
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