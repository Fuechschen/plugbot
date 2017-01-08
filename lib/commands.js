let story = require('storyboard').mainStory,
    fs = require('fs'),
    path = require('path');

let client = require('./client'),
    db = require('./db/sql_db'),
    redis = require('./db/redis_db'),
    config = require('./load_config'),
    utils = require('./utils'),
    langfile = require('../langfile'),
    addQueue = require('./addqueue'),
    afk = require('./afk');


let commands = {},
    filelist = [];

loadCommands();

function loadCommands() {
    fs.readdir(path.resolve(__dirname, 'commands'), (err, files) => {
        if (err) {
            story.fatal('Commands', 'Cannot load commands', {attach: err});
            process.exit(1);
        } else {
            files.forEach(file => {
                try {
                    let command = require(path.resolve(__dirname, 'commands', file));  //eslint-disable-line global-require
                    if (typeof command === 'function') command = new command({
                        client,
                        db,
                        redis,
                        config,
                        utils,
                        langfile,
                        addQueue,
                        afk
                    });
                    if (command.enabled) {
                        command.names.forEach(name => {
                            commands[name] = command;
                        });
                        filelist.push(path.resolve(__dirname, `commands/${file}`));
                        story.debug('Commands', `Loaded command ${command.names[0]}`);
                    } else story.debug('Commands', `Skipping ${command.names[0]}(${file}) since it's disabled.`);
                } catch (e) {
                    story.warn('Commands', `Failed to load command ${file}`, {attach: e});
                }
            });
            story.info('Commands', `Loaded ${filelist.length} commands.`);
        }
    });
}

module.exports = commands;