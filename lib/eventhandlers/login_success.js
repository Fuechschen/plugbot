var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var plugged = require('../client');
var db = require('../db/sql_db');
var redis = require('../db/redis_db');
var config = require('../load_config');

module.exports = {
    event: plugged.LOGIN_SUCCESS,
    handler: function () {
        plugged.cacheChat(true);
        plugged.getAuthToken(function (err, token) {
            if (!err) {
                redis.set('meta:auth:save:jar', JSON.stringify(plugged.getJar())).then(function () {
                    redis.set('meta:auth:save:token', token).then(function () {
                        //noinspection JSUnresolvedFunction
                        redis.expire('meta:auth:save:token', 604800);
                    });
                    //noinspection JSUnresolvedFunction
                    redis.expire('meta:auth:save:jar', 604800);
                });
            }
        });
        if (db.ready) plugged.connect(config.options.room);
        else db.emitter.on('ready', ()=> {
            plugged.connect(config.options.room)
        });

        story.info('Successfully authed to plug.dj');
    }
};