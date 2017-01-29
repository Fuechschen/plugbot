let plugged = require('../client');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['staff'],
    enabled: true,
    handler: (data)=> {
        plugged.sendChat(utils.replace(langfile.staff.default, {username: data.username}));
        plugged.removeChatMessage(data.cid);
        //todo add ratelimit
    }
};