let plugged = require('../client');
let redis = require('../db/redis_db');

module.exports = {
    names: ['demote'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 0) plugged.removeStaff(data.id);
        });
        plugged.removeChatMessage(data.cid);
    }
};