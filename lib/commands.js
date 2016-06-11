var request = require('request');
var story = require('storyboard').mainStory;
var fs = require('fs');
var path = require('path');

var langfile = require('../langfile');
var db = require('./db/sql_db');
var utils = require('./utils');

var commands = {};
var filelist = [];

loadCommands();

function loadCommands() {
    fs.readdir(path.resolve(__dirname, 'commands'), function (err, files) {
        if (err) {
            story.fatal('Cannot load commands', {attach: err});
            process.exit(1);
        } else {
            files.forEach(function (file) {
                try {
                    var command = require(path.resolve(__dirname, 'commands', file));
                    command.names.forEach(function (name) {
                        commands[name] = command;
                    });
                    filelist.push(path.resolve(__dirname, 'commands/' + file));
                    story.debug('Loaded command ' + command.names[0]);
                } catch (e) {
                    story.warn('Failed to load command.', {attach: e});
                }
            });
            story.info('Loaded ' + (files.length) + ' commands.');
        }
    });
}

module.exports = commands;