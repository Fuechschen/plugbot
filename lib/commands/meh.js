var S = require('string');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require('../db/sql_db');

module.exports = {
    names:['meh', 'm'],
    enabled: true,
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                plugged.meh();
                if(S(data.message).contains('-s') && plugged.getMedia() !== undefined){
                    db.models.Song.update({autovote: 'm'}, {where: {plug_id: plugged.getMedia().id}});
                } else if (S(data.message).contains('-d') && plugged.getMedia() !== undefined) {
                    db.models.Song.update({autovote: 'n'}, {where: {plug_id: plugged.getMedia().id}});
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};