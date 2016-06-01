var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['leave'],
    handler: function (data) {
        redis.exists('meta:roulette:active').then(function (ex) {
            if (ex === 1) {
                redis.sismember('meta:roulette:users', data.id).then(function (mem) {
                    if (mem === 1) redis.srem('meta:roulette:users', data.id).then(function () {
                        plugged.sendChat(utils.replace(langfile.roulette.leave, {username: data.username}));
                    });
                    else plugged.sendChat(utils.replace(langfile.roulette.not_joined, {username: data.username}));
                });
            } else plugged.sendChat(utils.replace(langfile.roulette.no_roulette, {username: data.username}));
        });
        plugged.removeChatMessage(data.cid);
    }
};