var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['restart'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                try {
                    var pm2 = require('pm2');
                    pm2.connect(function () {
                        plugged.sendChat(utils.replace(langfile.restart.default, {username: data.username}));
                        setTimeout(function () {
                            pm2.restart(config.pm2.pid, function (err) {
                                plugged.sendChat(utils.replace(langfile.restart.error, {username: data.username}));
                                story.warn('restart', 'Error while restarting.', {attach: err});
                            });
                        }, 3 * 1000);
                    });
                } catch (e) {
                    plugged.sendChat(utils.replace(langfile.restart.error, {username: data.username}));
                    story.warn('restart', 'Error while restarting.', {attach: e});
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};