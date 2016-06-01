var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['define'],
    handler: function (data) {
        if (config.apiKeys.wordnik !== null && config.apiKeys.wordnik !== undefined && config.apiKeys.wordnik !== '') {
            var msg = _.rest(data.message.split(' '), 1).join(' ').trim();
            if (msg.length > 0) {
                var uri = 'http://api.wordnik.com/v4/word.json/' + msg + '/definitions?limit=200&includeRelated=true&useCanonical=true&includeTags=false&api_key=' + config.apiKeys.wordnik;
                request.get(uri, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var definition = JSON.parse(body);
                        if (definition.length === 0) plugged.sendChat(utils.replace(langfile.define.no_definition_found, {
                            username: data.username,
                            word: msg
                        }));
                        else plugged.sendChat(utils.replace(langfile.define.default, {
                            username: data.username,
                            definition: definition[0].text,
                            word: msg
                        }));
                    }
                });
            }
        }
        plugged.removeChatMessage(data.cid);
    }
};