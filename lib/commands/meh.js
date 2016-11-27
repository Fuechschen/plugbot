let S = require('string');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require('../db/sql_db');

module.exports = {
    names: ['meh', 'm'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.meh();
                //noinspection JSUnresolvedFunction
                if (S(data.message).contains('-s') && plugged.getMedia() !== undefined) {
                    db.models.Song.update({autovote: 'm'}, {where: {plug_id: plugged.getMedia().id}});
                } else { //noinspection JSUnresolvedFunction
                    if (S(data.message).contains('-d') && plugged.getMedia() !== undefined) {
                        db.models.Song.update({autovote: 'n'}, {where: {plug_id: plugged.getMedia().id}});
                    }
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};