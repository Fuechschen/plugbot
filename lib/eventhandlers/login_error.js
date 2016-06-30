var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.LOGIN_ERROR,
    handler: function (err) {
        story.error('Error', 'Error while logging in.', {attach: err});
        process.exit(1);
    }
};