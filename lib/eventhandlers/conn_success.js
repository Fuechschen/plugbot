var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.CONN_SUCCESS,
    handler: function () {
        story.debug('Connection', 'Connection established');
    }
};