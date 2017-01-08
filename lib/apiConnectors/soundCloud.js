let request = require('request');
let Promise = require('bluebird');
let story = require('storyboard').mainStory;

const config = require('../load_config');
const langfile = require('../../langfile');
let utils = require('../utils');

module.exports = {
    check: (media) => {
        return new Promise((resolve, reject) => {
            request.get(`https://api.soundcloud.com/tracks/${media.cid}?client_id=${config.apiKeys.soundcloud}`, (err, resp) => {
                if (!err) {
                    if (resp.statusCode === 404) {
                        resolve([true, {
                            skip: utils.replace(langfile.soundcloudGuard.deleted.default, {

                                song: utils.mediatitle(media)
                            }),
                            blacklist: langfile.soundcloudGuard.deleted.blReason
                        }]);
                    } else if (resp.statusCode === 403) {
                        resolve([true, {
                            skip: utils.replace(langfile.soundcloudGuard.private.default, {
                                song: utils.mediatitle(media)
                            }),
                            blacklist: langfile.soundcloudGuard.private.blReason
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