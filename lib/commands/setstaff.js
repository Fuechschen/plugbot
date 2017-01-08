let story = require('storyboard').mainStory;
let S = require('string');
let _ = require('underscore');

let plugged = require('../client');
let redis = require('../db/redis_db');
let utils = require('../utils');
const langfile = require('../../langfile');
let db = require("../db/sql_db.js");

module.exports = {
    names: ['setstaff'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 2) {
                let split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                let user = plugged.getUserByName(S(_.rest(split, 2).join(' ')).chompLeft('@').chompRight(' ').s);
                let role = utils.role(split[1]);
                if (user && role) {
                    plugged.sendChat(utils.replace(langfile.setstaff.default, {
                        mod: data.username,
                        username: user.username,
                        role: utils.rolename(role)
                    }), 45);
                    if (role === plugged.USERROLE.NONE) plugged.removeStaff(user.id);
                    else plugged.addStaff(user.id, role);
                    db.models.User.update({sRole: utils.permlevel(role)}, {where: {id: user.id}});
                    redis.set(`user:role:save:${user.id}`, utils.permlevel(role));
                    story.info('promote', `${utils.userLogString(data.username, data.id)}: ${utils.userLogString(user)} --> ${utils.rolename(role)}`);
                } else { //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    plugged.sendChat(utils.replace(langfile.error.user_not_found, {
                        username: plugged.getUserByID(data.id),
                        value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                    }), 20);
                }
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};