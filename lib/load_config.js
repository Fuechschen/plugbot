var conf;
try {
    conf = require('../config.js');
} catch (e) {
    throw new Error('No config file. Copy config.example.js to config.js and insert your data.');
}

if (conf.apiKeys.youtube === '' || conf.apiKeys.soundcloud === '') {
    throw new Error('You are missing at least one api-key.');
} else if (conf.sequelize.database === '' || conf.sequelize.options.dialect === '') {
    throw new Error('Your database settings seem to be incorrect.');
} else if (conf.login.email === '' || conf.login.password === '') {
    throw new Error('You need to specify login credentials for the bot.');
} else if (conf.redis.host === '') {
    throw new Error('You need specify a redis host.');
} else if (conf.options.room === '') {
    throw new Error('You need to specify a room to join.');
} else {
    module.exports = conf;
}