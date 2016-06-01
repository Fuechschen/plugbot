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

module.exports = function (user) {
    if (user !== null && user !== undefined) {
        redis.del('user:role:save:' + user.id);
        db.models.User.update({status: false}, {where: {id: user.id}});
        story.info('leave', utils.userLogString(user));
    }
};