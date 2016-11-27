var S = require('string');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require('../db/sql_db');

module.exports = {
    names: ['staff'],
    enabled: true,
    handler: function (data) {
        plugged.sendChat(utils.replace(langfile.staff.default, {username: data.username}));
        plugged.removeChatMessage(data.cid);
    }
};