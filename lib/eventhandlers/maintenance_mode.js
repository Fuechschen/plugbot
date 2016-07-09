var story = require('storyboard').mainStory;

var plugged = require('../client');

module.exports = {
    event: plugged.MAINTENANCE_MODE,
    handler: function () {
        story.info('maintenance', 'Plug.dj went into maintenance mode, you may have to restart the bot.');
        throw new Error('Maintenance Mode!');
    }
};