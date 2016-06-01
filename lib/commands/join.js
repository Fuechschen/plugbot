var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['join'],
    handler: function (data) {
        redis.exists('meta:roulette:active').then(function (ex) {
            if (ex === 1) {
                redis.sismember('meta:roulette:users', data.id).then(function (mem) {
                    if (mem === 0) redis.sadd('meta:roulette:users', data.id).then(function () {
                        plugged.sendChat(utils.replace(langfile.roulette.join, {username: data.username}));
                    });
                    else plugged.sendChat(utils.replace(langfile.roulette.already_joined, {username: data.username}));
                });
            } else plugged.sendChat(utils.replace(langfile.roulette.no_roulette, {username: data.username}));
        });
        plugged.removeChatMessage(data.cid);
    }
};