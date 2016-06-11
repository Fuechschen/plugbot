var story = require('storyboard').mainStory;

module.exports = function (msg) {
    story.info('plug', msg);
};