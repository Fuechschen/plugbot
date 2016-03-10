var storyboard = require('storyboard');

storyboard.config({filter: '*:' + config.options.loglevel});

module.exports = storyboard.mainStory;