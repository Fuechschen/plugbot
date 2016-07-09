var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.PLUG_ERROR,
    handler: function (err) {
        story.error('Error', 'plug.dj encountered an error.', {attach: err});
        process.exit(1);
    }
};