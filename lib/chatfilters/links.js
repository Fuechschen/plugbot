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
        return new Promise((resolve, reject) => {
            if (config.chatfilter.enabled) {
                var matches = data.message.match(config.chatfilter.links.regex);
                if (matches.length === 0) resolve();
                else {
                    matches = matches.map(match => URL.parse(match));
                    Promise.all(matches.map(match => new Promise((resolve, reject) => {
                        if (config.chatfilter.links.plugdj.hosts.includes(match.hostname) && config.chatfilter.links.plugdj.enabled) {
                            //noinspection JSUnresolvedFunction
                            match.pathname = S(match.pathname).chompRight('/').s;
                            if (!config.chatfilter.links.plugdj.allowed_paths.includes(match.pathname)) reject({
                                type: 'link',
                                points: 10
                            });
                        } else if (config.chatfilter.links.mode === 'blacklist' && config.chatfilter.links.filter.includes(match.hostname)) reject({
                            type: 'link',
                            points: 10
                        });
                        else if (config.chatfilter.links.mode === 'whitelist' && !config.chatfilter.links.filter.includes(match.hostname)) reject({
                            type: 'link',
                            points: 10
                        });
                    }))).then(resolve).catch(reject);
                }
            } else resolve();
        });
    }
};