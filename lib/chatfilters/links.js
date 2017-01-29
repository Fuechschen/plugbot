let Promise = require('bluebird');
let URL = require('url');
let S = require('string');

const langfile = require('../../langfile');
const config = require('../load_config');

module.exports = {
    name: 'Link',
    type: 'link',
    enabled: true,
    strings: {
        warn: langfile.chatfilter.link.warn,
        mute: langfile.chatfilter.link.mute
    },
    check:  (data)=> {
        return new Promise((resolve, reject) => {
            if (config.chatfilter.enabled) {
                let matches = data.message.match(config.chatfilter.links.regex);
                if (matches.length === 0) resolve();
                else {
                    matches = matches.map(match => URL.parse(match));
                    Promise.all(matches.map(match => new Promise((resolve, reject) => {
                        if (config.chatfilter.links.plugdj.hosts.includes(match.hostname) && config.chatfilter.links.plugdj.enabled) {
                            //noinspection JSUnresolvedFunction
                            match.pathname = S(match.pathname).chompRight('/').s;
                            if (!config.chatfilter.links.plugdj.allowedPaths.includes(match.pathname)) reject({
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