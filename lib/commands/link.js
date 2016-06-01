var story = require('storyboard').mainStory;
var request = require('request');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['link'],
    handler: function (data) {
        if (plugged.getMedia().id !== -1) {
            var m = utils.clone(plugged.getMedia());
            if (m.format === 1) plugged.sendChat(utils.replace(langfile.link.default, {
                username: data.username,
                link: 'https://youtu.be/' + m.cid
            }));
            else {
                request.get('https://api.soundcloud.com/tracks/' + m.cid + '?client_id=' + config.apiKeys.soundcloud, function (err, resp, body) {
                    if (!err && resp.statusCode === 200) {
                        var json = JSON.parse(body);
                        plugged.sendChat(utils.replace(langfile.link.default, {
                            username: data.username,
                            link: json.permalink_url
                        }));
                    } else plugged.sendChat(utils.replace(langfile.link.error, {username: data.username}));
                });
            }
        } else plugged.sendChat(utils.replace(langfile.link.no_media, {username: data.username}));
        plugged.removeChatMessage(data.cid);
    }
};