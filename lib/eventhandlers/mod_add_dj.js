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
    if (data.mi !== plugged.getSelf.id) {
        story.info('add', utils.userLogString(data.m, data.mi) + ' added ' + utils.userLogString(data.username, data.id));
    }
};