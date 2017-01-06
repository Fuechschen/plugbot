let story = require('storyboard').mainStory;
let Promise = require('bluebird');

let db = require('../db/sql_db');
let utils = require('../utils');
const langfile = require('../../langfile');
let redis = require('../db/redis_db');
const config = require('../load_config');
let plugged = require('../client');
let wsUpdate = require('../../web/index').wsGet('leave');

module.exports = {
    event: plugged.USER_LEAVE,
    handler:  (user)=> {
        if (user) {
            //noinspection JSUnresolvedFunction
            redis.hget('user:waitlist:lastposition', user.id).then(pos => {
                pos = parseInt(pos);
                if (pos !== -1) {
                    return redis.set(`user:disconnect:${user.id}`, pos).then(() => //noinspection JSUnresolvedFunction
                    redis.expire(`user:disconnect:${user.id}`, config.dcmoveback.timeout));
                } else return Promise.resolve();
            }).then(() => db.models.User.update({status: false}, {where: {id: user.id}}));
            story.info('leave', utils.userLogString(user));
            wsUpdate({id: user.id, n: user.username});
        }
    }
};