var Promise = require('bluebird');

var detector = require('cld');
var config = require('../load_config');
var langfile = require('../../langfile');

module.exports = {
    name: 'Language',
    type: 'language',
    enabled: true,
    strings: {
        warn: langfile.chatfilter.language.warn
    },
    check: function (data) {
        return new Promise((resolve, reject) => {
            if (config.chatfilter.language.enabled) {
                detector.detect(data.messae, (err, msg) => {
                    if (err) {
                        resolve();
                    } else {
                        if (msg.reliable) {
                            if (config.chatfilter.language.allowed.includes(msg.languages[0].code)) resolve();
                            else reject({type: 'language', points: 0});
                        } else resolve();
                    }
                });
            } else resolve();
        });
    }
};