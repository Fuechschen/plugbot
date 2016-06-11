var story = require('storyboard').mainStory;

module.exports = function () {
    story.info('maintenance', 'Plug.dj went into maintenance mode, you may have to restart the bot.');
    throw new Error('Maintenance Mode!');
};