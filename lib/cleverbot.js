let story = require('storyboard').mainStory;

const config = require('./load_config');
let plugged = require('./client');
let utils = require('./utils');
const langfile = require('../langfile');

let cleverbot = null,
    ready = false;

try {
    let Cleverbot = require('cleverbot-node'); //eslint-disable-line global-require
    cleverbot = new Cleverbot;
    Cleverbot.prepare(() => {
        story.info('cleverbot', 'Cleverbot loaded and ready.');
        ready = true;
    });
} catch (e) {
    cleverbot = null;
    story.info('cleverbot', 'Unable to load cleverbot-integration.');
    story.debug('cleverbot', 'Unable to load cleverbot-integration.', {attach: e});
}

module.exports = (data) => {
    if (cleverbot && ready && config.cleverbot.enabled) {
        cleverbot.write(data.message.replace(`@${plugged.getSelf().username}`, '').trim(), (resp) => {
            story.debug('cleverbot', resp.message);
            plugged.sendChat(utils.replace(langfile.cleverbot.format, {
                username: data.username,
                message: resp.message
            }));
        });
    }
};