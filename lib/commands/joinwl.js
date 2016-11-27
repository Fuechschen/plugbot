let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['joinwl'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                plugged.activatePlaylist(config.playlists.play, () => {
                    plugged.joinWaitlist();
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};