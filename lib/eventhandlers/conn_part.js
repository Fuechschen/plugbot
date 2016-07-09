var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.CONN_ERROR,
    handler: function (err) {
        story.error('Error', 'The connection dropped unexpectedly', {attach: err});
        process.exit(1);
    }
};