var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['cleanwl'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var wl = utils.clone(plugged.getWaitlist());
                var booth = utils.clone(plugged.getBooth());
                plugged.sendChat(utils.replace(langfile.cleanwl.default, {username: data.username}));
                plugged.setLock(true, true);
                for (var i = 0; i < wl.length; i++) {
                    plugged.addToWaitlist(wl[i]);
                }
                if (!booth.isLocked) plugged.setLock(false);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};