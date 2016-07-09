var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.SOCK_CLOSED,
    handler: function () {
        story.info('Socket', 'Socket was closed. Restarting...');
        process.exit(1);
    }
};