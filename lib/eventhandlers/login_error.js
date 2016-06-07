var story = require('storyboard').mainStory;

module.exports = function (err) {
    story.error('Error', 'Error while logging in.', {attach: err});
    process.exit(1);
};