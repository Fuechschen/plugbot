var Plugged = require('plugged');
var story = require('storyboard').mainStory;

var config = require('./load_config');

var plugged = new Plugged({
    log: function (msg, verbosity, type) {
        if (verbosity <= config.options.plugged.verbosity)story[type]('plugged', msg);

    }
});

plugged.login(config.login);

module.exports = plugged;