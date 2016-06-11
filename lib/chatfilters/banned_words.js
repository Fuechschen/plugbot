var Promise = require('bluebird');

var config = require('../load_config');
var langfile = require('../../langfile');
var utils = require('../utils');

module.exports = {
    name: 'BannedWords',
    enabled: true,
    strings: {
        bannedword: {
            warn: langfile.chatfilter.bannedword.warn,
            mute: langfile.chatfilter.bannedword.mute
        }
    },
    check: function (data) {
        return new Promise(function (resolve, reject) {
            if (utils.contains(data.msg, config.chatfilter.words.blacklist)) reject({type: 'bannedword', points: 5});
            else resolve(); 
        });
    }
};