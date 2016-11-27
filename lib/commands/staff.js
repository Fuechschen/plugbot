let S = require('string');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require('../db/sql_db');

module.exports = {
    names: ['staff'],
    enabled: true,
    handler: (data)=> {
        plugged.sendChat(utils.replace(langfile.staff.default, {username: data.username}));
        plugged.removeChatMessage(data.cid);
    }
};