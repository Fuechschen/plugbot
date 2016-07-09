var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.CONN_WARNING,
    handler: function (c) {
        story.warn('Connection', 'Connection is about to drop. Count: ' + c);
    }
};