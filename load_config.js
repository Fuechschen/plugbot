var conf = require('./config.js');

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
    conf.loadfromRedis = function (redis) {
        redis.get('meta:config:state:eventmode').then(function(event){
            conf.state.eventmode = ((event !== null) ? (event === 1) : conf.state.eventmode);
        });
        redis.get('meta:config:voteskip:enabled').then(function(voteskip){
            conf.voteskip.enabled = ((voteskip !== null) ? (voteskip === 1) : conf.voteskip.enabled);
        });
        redis.get('meta:config:cleverbot:enabled').then(function(cleverbot){
            conf.cleverbot.enabled = ((cleverbot !== null) ? (cleverbot === 1) : conf.cleverbot.enabled);
        });
        redis.get('meta:config:history:skipenabled').then(function(historyskip){
           conf.history.skipenabled = ((historyskip !== null) ? (historyskip === 1) : conf.history.skipenabled);
        });
        redis.get('meta:config:lockskip:move_pos').then(function(lockskippos){
            conf.lockskip.move_pos = ((lockskippos === null) ? conf.lockskip.move_pos : lockskippos);
        });
        redis.get('meta:config:options:bouncer_plus').then(function(bouncer_plus){
            conf.options.bouncer_plus = ((bouncer_plus !== null) ? (bouncer_plus === 1) : conf.options.bouncer_plus);
        });
        redis.get('meta:config:timeguard:enabled').then(function(timeguard){
            conf.timeguard.enabled = ((timeguard !== null) ? (timeguard === 1) : conf.timeguard.enabled);
        });
    };
    module.exports = conf;
}