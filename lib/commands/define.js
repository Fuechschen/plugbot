let request = require('request');
let _ = require('underscore');

let plugged = require('../client');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names:['define'],
    enabled: true,
    handler: (data)=> {
        if (config.apiKeys.wordnik !== null && config.apiKeys.wordnik !== undefined && config.apiKeys.wordnik !== '') {
            //noinspection JSCheckFunctionSignatures
            let msg = _.rest(data.message.split(' '), 1).join(' ').trim();
            if (msg.length > 0) {
                let uri = `http://api.wordnik.com/v4/word.json/${msg}/definitions?limit=200&includeRelated=true&useCanonical=true&includeTags=false&api_key=${config.apiKeys.wordnik}`;
                request.get(uri, (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        let definition = JSON.parse(body);
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