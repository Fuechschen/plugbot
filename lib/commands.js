var request = require('request');
var story = require('storyboard').mainStory;
var S = require('string');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var langfile = require('../langfile');
var redis = require('./db/redis_db');
var config = require('./load_config');
var utils = require('./utils');
var plugged = require('./client');
var db = require('./db/sql_db');

var commands = {};

fs.readdir(path.resolve(__dirname, 'commands'), function (err, files) {
    if (err) {
        story.fatal('Cannot load commands', {attach: err});
        process.exit(1);
    } else {
        files.forEach(function (file) {
            try {
                var command = require(path.resolve(__dirname, 'commands/' + file));
                command.names.forEach(function (name) {
                    commands[name] = command;
                });
                story.debug('Loaded command ' + command.names[0]);
            } catch (e) {
                story.warn('Failed to load command.', {attach: e});
            }
        });
        story.info('Loaded ' + (files.length + 1) + ' commands.');
    }
});

module.exports = commands;