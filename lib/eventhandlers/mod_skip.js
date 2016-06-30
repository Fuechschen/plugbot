var story = require('storyboard').mainStory;

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var langfile = require('../../langfile');
var wsSkip = require('../../web/index').wsGet('skip');

module.exports = {
    event: plugged.MOD_SKIP,
    handler: function (data) {
        if (data.moderatorID !== plugged.getSelf().id) {
            story.info('skip', utils.userLogString(data.moderator, data.moderatorID));
            //noinspection JSUnresolvedVariable
            redis.get('user:role:save:' + data.mi).then(function (perm) {
                perm = parseInt(perm, 10);
                if (perm < 2) {
                    plugged.sendChat(utils.replace(langfile.skip.no_mod_skip, {username: data.moderator}));
                    plugged.removeStaff(data.moderatorID);
                }
            });
        }
        wsSkip({m: {id: data.moderatorID, n: data.moderator}});
    }
};