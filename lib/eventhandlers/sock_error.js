var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.SOCK_ERROR,
    handler: function () {
        story.error('Socket', 'Socket errored. Restarting...');
        process.exit(1);
    }
};