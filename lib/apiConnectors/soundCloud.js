var request = require('request');
var Promise = require('bluebird');
var story = require('storyboard').mainStory;

var config = require('../load_config');
var langfile = require('../../langfile');
var utils = require('../utils');

module.exports = {
    check: function (media) {
        return new Promise((resolve, reject) => {
            request.get(`https://api.soundcloud.com/tracks/${media.cid}?client_id=${config.apiKeys.soundcloud}`, (err, resp) => {
                if (!err) {
                    if (resp.statusCode === 404) {
                        resolve([true, {
                            skip: utils.replace(langfile.soundcloudGuard.deleted.default, {

                                song: utils.mediatitle(media)
                            }), blacklist: langfile.soundcloudGuard.deleted.bl_reason
                        }]);
                    } else if (resp.statusCode === 403) {
                        resolve([true, {
                            skip: utils.replace(langfile.soundcloudGuard.private.default, {
                                song: utils.mediatitle(media)
                            }), blacklist: langfile.soundcloudGuard.private.bl_reason
                        }]);
                    } else resolve([false]);
                } else {
                    reject(err);
                    story.warn('SoundCloudApi', 'Error durring Api-call', {attach: err});
                }
            });
        });
    }
};