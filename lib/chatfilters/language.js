var story = require('storyboard').mainStory;
var _ = require('underscore');
var Promise = require('bluebird');

var detector = require('cld');
var config = require('../load_config');

module.exports = {
    name: 'Language',
    enabled: true,
    strings: {
        language: {
            warn: langfile.chatfilter.language.warn
        }
    },
    check: function (data) {
        return new Promise(function (resolve, reject) {
            if (config.chatfilter.language.enabled) {
                detector.detect(data.messae, function (err, msg) {
                    if (err) {
                        resolve();
                    } else {
                        if (msg.reliable) {
                            if (config.chatfilter.language.allowed.indexOf(msg.languages[0].code) !== -1) resolve();
                            else reject({type: 'language', points: 0});
                        } else resolve();
                    }
                });
            } else resolve();
        });
    }
};