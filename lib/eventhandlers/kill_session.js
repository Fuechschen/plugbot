var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.KILL_SESSION,
    handler: function (err) {
        story.error('Error', 'Session was killed. Restarting...', {attach: err});
        process.exit(1);
    }
};