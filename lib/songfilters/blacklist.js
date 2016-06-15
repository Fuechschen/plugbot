var Promise = require('bluebird');

var redis = require('../db/redis_db');
var langfile = require('../../langfile');
var config = require('../load_config');
var utils = require('../utils');
var plugged = require('../client');

module.exports = {
    name: 'Blacklist',
    enabled: true,
    check: function (booth, now) {
        return new Promise(function (resolve, reject) {
            redis.hget('media:blacklist', now.media.format + ':' + now.media.cid).then(function (blentry) {
                if (blentry === null) resolve();
                else reject({
                    type: 'blacklist',
                    preskip: langfile.blacklist.skip_first,
                    afterskip: function () {
                        if (blentry !== '1') return utils.replace(langfile.blacklist.skip_reason, {
                            username: plugged.getUserByID(booth.dj).username,
                            song: utils.songtitle(now.media.author, now.media.title),
                            reason: blentry
                        });
                        else return utils.replace(langfile.blacklist.skip, {
                            username: plugged.getUserByID(booth.dj).username,
                            song: utils.songtitle(now.media.author, now.media.title)
                        });
                    }(),
                    do_lockskip: config.blacklist.lockskip,
                    blacklist: false
                });
            }).catch(resolve);
        });
    }
};