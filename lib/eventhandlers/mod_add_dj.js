var story = require('storyboard').mainStory;

var utils = require('../utils');
var plugged = require('../client');
var langfile = require('../../langfile');

module.exports = {
    event: plugged.MOD_ADD_DJ,
    handler: function (data) {
        if (data.mi !== plugged.getSelf.id) {
            story.info('add', `${utils.userLogString(data.m, data.mi)} added ${utils.userLogString(data.username, data.id)}`);
        }
    }
};