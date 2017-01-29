let story = require('storyboard').mainStory;

let plugged = require('../client');
let db = require('../db/sql_db');
let redis = require('../db/redis_db');
const config = require('../load_config');

module.exports = {
    event: plugged.LOGIN_SUCCESS,
    handler: () => {
        plugged.cacheChat(true);
        plugged.getAuthToken((err, token) => {
            if (!err) {
                redis.set('meta:auth:save:jar', JSON.stringify(plugged.getJar())).then(() => {
                    redis.set('meta:auth:save:token', token).then(() => {
                        //noinspection JSUnresolvedFunction
                        redis.expire('meta:auth:save:token', 604800);
                    });
                    //noinspection JSUnresolvedFunction
                    redis.expire('meta:auth:save:jar', 604800);
                });
            }
        });
        if (db.ready) plugged.connect(config.options.room);
        else db.emitter.on('ready', () => plugged.connect(config.options.room));
        story.info('Successfully authed to plug.dj');
    }
};