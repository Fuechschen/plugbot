let request = require('request');

let plugged = require('../client');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names:['catfact', 'catfacts'],
    enabled: true,
    handler: (data)=> {
        request('http://catfacts-api.appspot.com/api/facts', (error, response, body) => {
            if (!error && body != null) {
                //noinspection JSUnresolvedletiable
                plugged.sendChat(utils.replace(langfile.catfact.default, {
                    username: data.username,
                    fact: JSON.parse(body).facts[0]
                }));
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};