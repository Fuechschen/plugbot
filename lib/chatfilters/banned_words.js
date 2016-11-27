let Promise = require('bluebird');

const config = require('../load_config');
const langfile = require('../../langfile');
let utils = require('../utils');

module.exports = {
    name: 'BannedWords',
    type: 'bannedword',
    enabled: true,
    strings: {
        warn: langfile.chatfilter.bannedword.warn,
        mute: langfile.chatfilter.bannedword.mute
    },
    check: (data)=> {
        return new Promise((resolve, reject) => {
            if (utils.contains(data.message, config.chatfilter.words.blacklist)) reject({
                type: 'bannedword',
                points: 5
            });
            else resolve();
        });
    }
};