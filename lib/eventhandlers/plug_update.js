var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.PLUG_UPDATE,
    handler: function () {
        story.error('Update', 'plug.dj gets an update was therefore closed.');
        process.exit(1);
    }
};