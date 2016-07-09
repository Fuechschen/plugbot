var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.PLUG_MESSAGE,
    handler: function (msg) {
        story.info('plug', msg);
    }
};