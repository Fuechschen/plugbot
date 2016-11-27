let plugged = require('../client');
let redis = require('../db/redis_db');

module.exports = {
    names: ['disable'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                let split = data.message.split(' ');
                if (split.length === 2) {
                    if (split[1] === 'afk')plugged.sendChat('!afkdisable', 5 * 1000);
                    else if (split[1] === 'join')plugged.sendChat('!joindisable', 5 * 1000);
                } else {
                    plugged.sendChat('!joindisable', 5 * 1000);
                    plugged.sendChat('!afkdisable', 5 * 1000);
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};