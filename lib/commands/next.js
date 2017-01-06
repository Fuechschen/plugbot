let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['next'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 0) {
                plugged.getPlaylist(config.playlists.play, (err, list) => {
                    if (!err) {
                        if ((plugged.getCurrentDJ() ? plugged.getCurrentDJ().id === plugged.getSelf().id : false)) {
                            plugged.sendChat(utils.replace(langfile.next.default, {
                                username: data.username,
                                title: utils.mediatitle(list[1])
                            }));
                        } else {
                            plugged.sendChat(utils.replace(langfile.next.default, {
                                username: data.username,
                                title: utils.mediatitle(list[0])
                            }));
                        }
                    }
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};