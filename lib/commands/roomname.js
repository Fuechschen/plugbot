let story = require('storyboard').mainStory;
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['roomname'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                let split = data.message.trim().split(' ');
                if (split.length > 1) {
                    let meta = plugged.getRoomMeta();
                    //noinspection JSCheckFunctionSignatures
                    plugged.updateRoomInfo(_.rest(split, 1).join(' ').trim(), meta.description, meta.welcome);
                    plugged.sendChat(utils.replace(langfile.roomedit.roomname, {username: data.username}), 30);
                    //noinspection JSCheckFunctionSignatures
                    story.info('roomname', `${utils.userLogString(data.username, data.id)}: --> ${_.rest(split, 1).join(' ').trim()}`);
                } else plugged.sendChat(utils.replace(langfile.error.argument, {
                    username: data.username,
                    cmd: 'Welcome'
                }), 30);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};