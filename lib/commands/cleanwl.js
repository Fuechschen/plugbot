let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names:['cleanwl'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                let wl = utils.clone(plugged.getWaitlist());
                let booth = utils.clone(plugged.getBooth());
                plugged.sendChat(utils.replace(langfile.cleanwl.default, {username: data.username}));
                plugged.setLock(true, true);
                for (let i = 0; i < wl.length; i++) {
                    plugged.addToWaitlist(wl[i]);
                }
                if (!booth.isLocked) plugged.setLock(false);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};