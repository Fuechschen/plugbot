let Promise = require('bluebird');

let detector = require('cld');
const config = require('../load_config');
const langfile = require('../../langfile');

module.exports = {
    name: 'Language',
    type: 'language',
    enabled: true,
    strings: {
        warn: langfile.chatfilter.language.warn
    },
    check: (data)=> {
        return new Promise((resolve, reject) => {
            if (config.chatfilter.language.enabled) {
                detector.detect(data.messae, (err, msg) => {
                    if (err)return resolve();
                    if (!msg.reliable)return resolve();
                    if (config.chatfilter.language.allowed.includes(msg.languages[0].code))return resolve();

                    reject({type: 'language', points: 0});
                });
            } else resolve();
        });
    }
};