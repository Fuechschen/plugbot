let S = require('string');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let db = require('../db/sql_db');

module.exports = {
    names: ['meh', 'm'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                plugged.meh();
                //noinspection JSUnresolvedFunction
                if (S(data.message).contains('-s') && plugged.getMedia()) {
                    db.models.Song.update({autovote: 'm'}, {where: {plugId: plugged.getMedia().id}});
                } else { //noinspection JSUnresolvedFunction
                    if (S(data.message).contains('-d') && plugged.getMedia()) {
                        db.models.Song.update({autovote: 'n'}, {where: {plugId: plugged.getMedia().id}});
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};