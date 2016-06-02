var request = require('request');
var story = require('storyboard').mainStory;
var fs = require('fs');
var path = require('path');
var decache = require('decache');

var langfile = require('../langfile');
var db = require('./db/sql_db');
var plugged = require('./client');
var redis = require('./db/redis_db');
var utils = require('./utils');

var commands = {};
var filelist = [];

loadCommands();

commands.reloadcommands = {
    handler: function (data) {
        redis.hget('user:roles', data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                filelist.forEach(function (e) {
                    decache(e);
                });
                commands = {};
                loadCommands();
                plugged.sendChat(utils.replace(langfile.commands.reload_commands, {username: data.username}), 45);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};

function loadCommands() {
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
                    filelist.push(path.resolve(__dirname, 'commands/' + file));
                    story.debug('Loaded command ' + command.names[0]);
                } catch (e) {
                    story.warn('Failed to load command.', {attach: e});
                }
            });
            story.info('Loaded ' + (files.length + 1) + ' commands.');
        }
    });
}

module.exports = commands;