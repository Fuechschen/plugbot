let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let db = require('../db/sql_db');

module.exports = {
    names: ['woot', 'w'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                plugged.woot();
                //noinspection JSUnresolvedFunction
                if (data.message.includes('-s') && plugged.getMedia()) db.models.Song.update({autovote: 'w'}, {where: {plugId: plugged.getMedia().id}});
                else if (data.message.includes('-d') && plugged.getMedia()) db.models.Song.update({autovote: 'n'}, {where: {plugId: plugged.getMedia().id}});
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};