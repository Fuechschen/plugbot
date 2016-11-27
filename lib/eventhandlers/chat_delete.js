let plugged = require('../client');
let wsUpdate = require('../../web/index').wsGet('chatDelete');

module.exports = {
    event: plugged.CHAT_DELETE,
    handler: (del) => {
        wsUpdate({mod: {id: del.moderatorID, n: plugged.getUserByID(del.moderatorID).username}, cid: del.cid});
    }
};