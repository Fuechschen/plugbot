let Promise = require('bluebird');
let Plugged = require('plugged');
let story = require('storyboard').mainStory;

const config = require('./load_config');

let plugged = new Plugged({
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