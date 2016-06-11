var story = require('storyboard').mainStory;

module.exports = function (err) {
    story.error('Error', 'Session was killed. Restarting...', {attach: err});
    process.exit(1);
};