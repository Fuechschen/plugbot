var story = require('storyboard').mainStory;

module.exports = function (c) {
    story.warn('Connection', 'Connection is about to drop. Count: ' + c);
};