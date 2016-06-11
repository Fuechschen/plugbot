var request = require('request');
var _ = require('underscore');
var Promise = require('bluebird');
var story = require('storyboard').mainStory;

var utils = require('../utils');
var langfile = require('../../langfile');
var config = require('../load_config');

function checkRegionRestriction(body) {
    //noinspection JSUnresolvedVariable
    if (body.contentDetails.regionRestriction !== undefined) {
        //noinspection JSUnresolvedVariable
        if (body.contentDetails.regionRestriction.allowed !== undefined) {
            //noinspection JSUnresolvedVariable
            var allowedintersection = _.intersection(body.contentDetails.regionRestriction.allowed, config.youtubeGuard.countryblocks.countries);
            if (allowedintersection.length !== config.youtubeGuard.countryblocks.countries.length) {
                //noinspection JSUnresolvedFunction,JSUnresolvedVariable
                return _.diffrence(config.youtubeGuard.countryblocks.countries, body.contentDetails.regionRestriction.allowed)
            } else return false;
        } else if (body.contentDetails.regionRestriction.blocked !== undefined) {
            //noinspection JSUnresolvedVariable
            var blockintersection = _.intersection(body.contentDetails.regionRestriction.blocked, config.youtubeGuard.countryblocks.countries);
            if (blockintersection.length !== 0) {
                return blockintersection;
            } else return false;
        } else return false;
    } else return false;
}

module.exports = {
    check: function (media) {
        return new Promise(function (resolve, reject) {
            request.get('https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=' + media.cid + '&key=' + config.apiKeys.youtube, function (error, resp, body) {
                if (!error && resp.statusCode === 200) {
                    body = JSON.parse(body);
                    if (body.items.length > 0) {
                        if (body.items[0] !== undefined) {
                            if (checkRegionRestriction(body.items[0]) !== false) {
                                var intersection = checkRegionRestriction(body.items[0]);
                                resolve([true, {
                                    skip: utils.replace(langfile.youtubeGuard.blocked.default, {
                                        song: utils.mediatitle(media),
                                        countries: intersection.join(' ')
                                    }),
                                    blacklist: utils.replace(langfile.youtubeGuard.blocked.bl_reason, {countries: intersection.join(' ')})
                                }]);
                            } else if (body.items[0].status.uploadStatus === 'deleted') {
                                resolve([true, {
                                    skip: utils.replace(langfile.youtubeGuard.deleted.default, {
                                        song: utils.mediatitle(media)
                                    }), blacklist: langfile.youtubeGuard.deleted.bl_reason
                                }]);
                            } else if (body.items[0].status.uploadStatus === 'rejected') {
                                resolve([true, {
                                    skip: utils.replace(langfile.youtubeGuard.rejected.default, {
                                        song: utils.mediatitle(media),
                                        reason: langfile.youtubeGuard.rejected.reasons[body.items[0].status.rejectionReason]
                                    }),
                                    blacklist: utils.replace(langfile.youtubeGuard.rejected.bl_reason, {reason: langfile.youtubeGuard.rejected.reasons[body.items[0].status.rejectionReason]})
                                }]);
                            } else if (body.items[0].status.privacyStatus === 'private') {
                                resolve([true, {
                                    skip: utils.replace(langfile.youtubeGuard.private.default, {
                                        song: utils.mediatitle(media)
                                    }), blacklist: langfile.youtubeGuard.private.bl_reason
                                }]);
                            } else if (body.items[0].status.embeddable === false) {
                                resolve([true, {
                                    skip: utils.replace(langfile.youtubeGuard.embeddable.default, {
                                        song: utils.mediatitle(media)
                                    }), blacklist: langfile.youtubeGuard.embeddable.bl_reason
                                }]);
                            } else resolve([false]);
                        }
                    } else {
                        resolve([true, {
                            skip: utils.replace(langfile.youtubeGuard.deleted.default, {
                                song: utils.mediatitle(media)
                            }), blacklist: langfile.youtubeGuard.deleted.bl_reason
                        }]);
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