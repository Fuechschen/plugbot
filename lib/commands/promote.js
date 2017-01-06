let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['promote'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            let split = data.message.trim().split(' ');
            if (perm > 0) {
                if (split.length === 1) plugged.addStaff(data.id, perm);
                else if (split.length === 2 && utils.role(split[1])  && utils.role(split[1]) !== plugged.USERROLE.NONE && utils.role(split[1]) <= perm) {
                    plugged.addStaff(data.id, utils.role(split[1]));
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};