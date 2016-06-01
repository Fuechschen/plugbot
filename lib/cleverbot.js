var story = require('storyboard').mainStory;

var config = require('../config');

var cleverbot = null;

try {
    var Cleverbot = require('cleverbot-node');
    cleverbot = new Cleverbot;
    cleverbot.prepare();
    story.info('cleverbot', 'Cleverbot loaded and ready.');
} catch (e) {
    cleverbot = null;
    story.info('cleverbot', 'Unable to load cleverbot-integration.');
    story.debug('cleverbot', 'Unable to load cleverbot-integration.', {attach: e});
}

module.exports = function (data) {
    if (cleverbot !== null && cleverbot !== undefined && config.cleverbot.enabled) {
        cleverbot.write(data.message.replace('@' + plugged.getSelf().username, '').trim(), function (resp) {
            story.debug('cleverbot', resp.message);
            plugged.sendChat(utils.replace(langfile.cleverbot.format, {
                username: data.username,
                message: resp.message
            }));
        });
    }
};