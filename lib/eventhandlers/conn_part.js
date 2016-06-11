var story = require('storyboard').mainStory;

module.exports = function (err) {
    story.error('Error', 'The connection dropped unexpectedly', {attach: err});
    process.exit(1);
};