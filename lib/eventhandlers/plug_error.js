var story = require('storyboard').mainStory;

module.exports = function (err) {
    story.error('Error', 'plug.dj encountered an error.', {attach: err});
    process.exit(1);
};