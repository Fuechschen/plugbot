let story = require('storyboard').mainStory;
let fs = require('fs');
let path = require('path');


let commands = {};
let filelist = [];

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