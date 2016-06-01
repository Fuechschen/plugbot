var story = require('storyboard').mainStory;
var request = require('request');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['catfact', 'catfacts'],
    handler: function (data) {
        request('http://catfacts-api.appspot.com/api/facts', function (error, response, body) {
            if (!error && body != null) {
                plugged.sendChat(utils.replace(langfile.catfact.default, {
                    username: data.username,
                    fact: JSON.parse(body).facts[0]
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};