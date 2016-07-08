var Promise = require('bluebird');
var URL = require('url');
var S = require('string');

var langfile = require('../../langfile');
var config = require('../load_config');

module.exports = {
    name: 'Link',
    type: 'link',
    enabled: true,
    strings: {
        warn: langfile.chatfilter.link.warn,
        mute: langfile.chatfilter.link.mute
    },
    check: function (data) {
        return new Promise(function (resolve, reject) {
            if (config.chatfilter.enabled) {
                var matches = data.message.match(config.chatfilter.links.regex);
                if (matches.length === 0) resolve();
                else {
                    matches = matches.map(function (match) {
                        return URL.parse(match);
                    });
                    for (var i in matches) {
                        if (config.chatfilter.links.plugdj.hosts.indexOf(matches[i].hostname) !== -1 && config.chatfilter.links.plugdj.enabled) {
                            matches[i].pathname = S(matches[i].pathname).chompRight('/').s;
                            if (config.chatfilter.links.plugdj.allowed_paths.indexOf(matches[i].pathname) === -1) {
                                reject({type: 'link', points: 10});
                                return;
                            }
                        } else if (config.chatfilter.links.mode === 'blacklist' && config.chatfilter.links.filter.indexOf(matches[i].hostname) !== -1) {
                            reject({type: 'link', points: 10});
                            return;
                        } else if (config.chatfilter.links.mode === 'whitelist' && config.chatfilter.links.filter.indexOf(matches[i].hostname) === -1) {
                            reject({type: 'link', points: 10});
                            return;
                        }
                    }
                    resolve();
                }
            } else resolve();
        });
    }
};