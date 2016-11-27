let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require('../db/sql_db');

module.exports = {
    names: ['reloadblacklist', 'reloadbl'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                //noinspection JSUnresolvedFunction
                redis.del('media:blacklist').then(() => {
                    //noinspection JSUnresolvedFunction
                    db.models.Song.findAll({where: {is_banned: true}}).then(songs => {
                        songs.forEach(song => {
                            //noinspection JSUnresolvedFunction
                            redis.hset('media:blacklist', `${song.format}:${song.cid}`, ((song.ban_reason !== undefined && song.ban_reason !== null) ? song.ban_reason : 1));
                        });
                        plugged.sendChat(utils.replace(langfile.blacklist.reload, {
                            username: data.username,
                            count: songs.length
                        }));
                    });
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};