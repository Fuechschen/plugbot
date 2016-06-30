var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.CONN_ERROR,
    handler: function (err) {
        story.error('Error', 'Error while connecting to plug.dj.', {attach: err});
        process.exit(1);
    }
};