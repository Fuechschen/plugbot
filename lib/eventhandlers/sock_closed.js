var story = require('storyboard').mainStory;

module.exports = function () {
    story.info('Socket', 'Socket was closed. Restarting...');
    process.exit(1);
};