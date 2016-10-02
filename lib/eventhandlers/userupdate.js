var Promise = require('bluebird');

var plugged = require('../client');
var db = require('../db/redis_db');
var userfilters = require('../userfilters');

module.exports = {
    event: plugged.USER_UPDATE,
    handler: function (data) {
        if (data.level !== undefined) db.models.User.update({level: data.level}, {where: {id: data.id}});
        else if (data.avatarID !== undefined) db.models.User.update({avatar_id: data.avatarID}, {where: {id: data.id}});
        else if (data.username !== undefined) {
            var user = plugged.getUserByID(data.id);
            user.username = data.username;
            Promise.all(userfilters.map(e => e(user))).then(() => {
                if (userfilters.timeouts[data.id] !== undefined)clearTimeout(userfilters.timeouts[data.id]);
            }).catch(filter => {
                plugged.sendChat(filter.chat);
                if (userfilters.timeouts[data.id] === undefined) filter.action();
            });
        }
    }
};