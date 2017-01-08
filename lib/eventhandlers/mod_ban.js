let story = require('storyboard').mainStory;

let redis = require('../db/redis_db');
let utils = require('../utils');
let plugged = require('../client');
const langfile = require('../../langfile');
let wsBan = require('../../web/index').wsGet('userbane');

module.exports = {
    event: plugged.MOD_BAN,
    handler: (data)=> {
        if (data.moderatorID !== plugged.getSelf().id) {
            redis.get(`user:role:save:${data.moderatorID}`).then(perm => {
                perm = parseInt(perm, 10);
                if (perm < 2 && data.duration === plugged.BANDURATION.PERMA) {
                    plugged.sendChat(utils.replace(langfile.ban.noStaffBan, {username: data.moderator}), 60);
                    plugged.unbanUser(data.id);
                    plugged.banUser(data.id, plugged.BANDURATION.DAY, plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                    plugged.removeStaff(data.moderatorID);
                } else {
                    //noinspection JSUnresolvedFunction
                    redis.hget('user:roles', data.id).then(plvl => {
                        plvl = parseInt(plvl, 10);
                        if (plvl > 1) {
                            plugged.sendChat(utils.replace(langfile.ban.staffBan, {username: data.moderator}), 60);
                            plugged.unbanUser(data.id);
                            plugged.removeStaff(data.moderatorID);
                        }
                    });
                }
            });
            story.info('ban', `${utils.userLogString(data.moderator, data.moderatorID)}: ${data.username} --> ${data.duration}`);
            //noinspection JSUnresolvedletiable
            wsBan({
                m: {id: data.moderatorID, n: data.moderator},
                u: (() => {
                    let u = plugged.getUserByName(data.username, true);
                    return (u ? {id: u.id, n: u.username} : {n: u.username});
                })(),
                d: data.duration
            });
        }
    }
};