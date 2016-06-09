var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['meh', 'm'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.meh();
                if(S(data.message).contains('-s') && plugged.getMedia() !== undefined){
                    db.models.Song.update({autovote: 'w'}, {where: {plug_id: plugged.getMedia().id}});
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};