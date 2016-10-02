var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var db = require('../db/sql_db');
var utils = require('../utils');
var langfile = require('../../langfile');
var redis = require('../db/redis_db');
var config = require('../load_config');
var plugged = require('../client');
var wsUpdate = require('../../web/index').wsGet('leave');

module.exports = {
    event: plugged.USER_LEAVE,
    handler: function (user) {
        if (user !== null && user !== undefined) {
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