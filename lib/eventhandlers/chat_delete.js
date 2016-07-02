var plugged = require('../client');
var wsUpdate = require('../../web/index').wsGet('chatDelete');

module.exports = {
    event: plugged.CHAT_DELETE,
    handler: function (del) {
        wsUpdate({mod: {id: del.moderatorID, n: plugged.getUserByID(del.id).username}, cid: del.cid});
    }
};