var Promise = require('bluebird');
var Plugged = require('plugged');
var story = require('storyboard').mainStory;

var config = require('./load_config');

var plugged = new Plugged({
    log: (msg, verbosity, type)=> {
        switch (type) {
            case "magenta":
                type = "debug";
                break;
            case "red":
                type = "error";
                break;
            case "yellow":
                type = "warn";
                break;
            default:
                type = "info";
                break;
        }

        if (verbosity <= config.options.plugged.verbosity) story[type]('plugged', msg);

    }
});

Promise.promisifyAll(plugged, {suffix: 'Promise'});

plugged.login(config.login);

module.exports = plugged;