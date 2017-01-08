let request = require('request');
let _ = require('underscore');
let Promise = require('bluebird');
let story = require('storyboard').mainStory;

let utils = require('../utils');
const langfile = require('../../langfile');
const config = require('../load_config');

function checkRegionRestriction(body) {
    //noinspection JSUnresolvedletiable
    if (body.contentDetails.regionRestriction) {
        //noinspection JSUnresolvedletiable
        if (body.contentDetails.regionRestriction.allowed) {
            //noinspection JSUnresolvedletiable
            let allowedintersection = _.intersection(body.contentDetails.regionRestriction.allowed, config.youtubeGuard.countryblocks.countries);
            if (allowedintersection.length !== config.youtubeGuard.countryblocks.countries.length) {
                //noinspection JSUnresolvedFunction,JSUnresolvedletiable
                return _.diffrence(config.youtubeGuard.countryblocks.countries, body.contentDetails.regionRestriction.allowed)
            } else return false;
        } else { //noinspection JSUnresolvedletiable
            if (body.contentDetails.regionRestriction.blocked) {
                //noinspection JSUnresolvedletiable
                let blockintersection = _.intersection(body.contentDetails.regionRestriction.blocked, config.youtubeGuard.countryblocks.countries);
                if (blockintersection.length !== 0) {
                    return blockintersection;
                } else return false;
            } else return false;
        }
    } else return false;
}

module.exports = {
    getSong: (media) => {
        return new Promise((resolve, reject) => {
            request.get(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status,snippet&id=${media.cid}&key=${config.apiKeys.youtube}`, (err, resp, body) => {
                if (err) reject(err);
                if (resp.statusCode !== 200)return reject(new Error('Invalid status code'));

                body = JSON.parse(body);
                if (body.items.length > 0) resolve(body.items[0]);
                else reject(new Error('not found'));
            });
        });
    },
    check: (media) => {
        return new Promise((resolve, reject) => {
            request.get(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${media.cid}&key=${config.apiKeys.youtube}`, (error, resp, body) => {
                if (!error) {
                    if (resp.statusCode === 200) {
                        body = JSON.parse(body);
                        if (body.items.length > 0) {
                            if (body.items[0]) {
                                if (checkRegionRestriction(body.items[0]) !== false) {
                                    let intersection = checkRegionRestriction(body.items[0]);
                                    resolve([true, {
                                        skip: utils.replace(langfile.youtubeGuard.blocked.default, {
                                            song: utils.mediatitle(media),
                                            countries: intersection.join(' ')
                                        }),
                                        blacklist: utils.replace(langfile.youtubeGuard.blocked.blReason, {countries: intersection.join(' ')})
                                    }]);
                                } else if (body.items[0].status.uploadStatus === 'deleted') {
                                    resolve([true, {
                                        skip: utils.replace(langfile.youtubeGuard.deleted.default, {
                                            song: utils.mediatitle(media)
                                        }), blacklist: langfile.youtubeGuard.deleted.blReason
                                    }]);
                                } else if (body.items[0].status.uploadStatus === 'rejected') {
                                    resolve([true, {
                                        skip: utils.replace(langfile.youtubeGuard.rejected.default, {
                                            song: utils.mediatitle(media),
                                            reason: langfile.youtubeGuard.rejected.reasons[body.items[0].status.rejectionReason]
                                        }),
                                        blacklist: utils.replace(langfile.youtubeGuard.rejected.blReason, {reason: langfile.youtubeGuard.rejected.reasons[body.items[0].status.rejectionReason]})
                                    }]);
                                } else if (body.items[0].status.privacyStatus === 'private') {
                                    resolve([true, {
                                        skip: utils.replace(langfile.youtubeGuard.private.default, {
                                            song: utils.mediatitle(media)
                                        }), blacklist: langfile.youtubeGuard.private.blReason
                                    }]);
                                } else if (body.items[0].status.embeddable === false) {
                                    resolve([true, {
                                        skip: utils.replace(langfile.youtubeGuard.embeddable.default, {
                                            song: utils.mediatitle(media)
                                        }), blacklist: langfile.youtubeGuard.embeddable.blReason
                                    }]);
                                } else resolve([false]);
                            }
                        } else {
                            resolve([true, {
                                skip: utils.replace(langfile.youtubeGuard.deleted.default, {
                                    song: utils.mediatitle(media)
                                }), blacklist: langfile.youtubeGuard.deleted.blReason
                            }]);
                        }
                    } else if (resp.statusCode === 503) {
                        resolve([true, {
                            skip: utils.replace(langfile.youtubeGuard.ytUnavailable.default, {
                                song: utils.mediatitle(media)
                            })
                        }, false])
                    }
                } else {
                    reject(new Error('api unreachable'));
                    story.warn('YoutubeApi', 'Error during youtube-api call.', {
                        attach: {
                            err: error,
                            response: resp
                        }
                    });
                }
            });
        });
    }
};