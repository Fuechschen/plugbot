let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');


//todo use env variables
module.exports = {
    names: ['restart'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                let now = data.message.includes('-n') || data.message.includes('--now');
                try {
                    let pm2 = require('pm2'); //eslint-disable-line global-require
                    pm2.connect(() => {
                        plugged.sendChat(utils.replace(langfile.restart.default, {username: data.username}));
                        setTimeout(() => {
                            //noinspection JSUnresolvedFunction
                            redis.hset('meta:options', 'isRestart', 1).then(() => {
                                pm2.restart(config.pm2.pid, err => {
                                    plugged.sendChat(utils.replace(langfile.restart.error, {username: data.username}));
                                    story.warn('restart', 'Error while restarting.', {attach: err});
                                    //noinspection JSUnresolvedFunction
                                    redis.hdel('meta:options', 'isRestart');
                                });
                            });
                        }, now ? 0 : 3 * 1000);
                    });
                } catch (e) {
                    plugged.sendChat(utils.replace(langfile.restart.error, {username: data.username}));
                    story.warn('restart', 'Error while restarting.', {attach: e});
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};