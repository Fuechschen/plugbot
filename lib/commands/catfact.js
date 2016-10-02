var request = require('request');

var plugged = require('../client');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['catfact', 'catfacts'],
    enabled: true,
    handler: function (data) {
        request('http://catfacts-api.appspot.com/api/facts', (error, response, body) => {
            if (!error && body != null) {
                //noinspection JSUnresolvedVariable
                plugged.sendChat(utils.replace(langfile.catfact.default, {
                    username: data.username,
                    fact: JSON.parse(body).facts[0]
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};