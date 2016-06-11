var story = require('storyboard').mainStory;

module.exports = function (err) {
    story.error('Error', 'Error while connecting to plug.dj.', {attach: err});
    process.exit(1);
};