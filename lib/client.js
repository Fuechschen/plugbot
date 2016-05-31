var Plugged = require('plugged');

var config = require('./load_config');

var plugged = new Plugged();

plugged.login(config.login);

module.exports = plugged;