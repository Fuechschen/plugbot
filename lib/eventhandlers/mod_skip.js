var _ = require('underscore');
var story = require('storyboard').mainStory;
var S = require('string');
var request = require('request');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');

module.exports = function (data) {
    if (data.moderatorID !== plugged.getSelf().id) {
        story.info('skip', utils.userLogString(data.moderator, data.moderatorID));
        redis.get('user:role:save:' + data.mi).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm < 2) {
                plugged.sendChat(utils.replace(langfile.skip.no_mod_skip, {username: data.moderator}));
                plugged.removeStaff(data.moderatorID);
            }
        });
    }
};