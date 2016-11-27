let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.MAINTENANCE_MODE,
    handler: () => {
        story.info('maintenance', 'Plug.dj went into maintenance mode, you may have to restart the bot.');
        throw new Error('Maintenance Mode!');
    }
};