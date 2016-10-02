var story = require('storyboard').mainStory;
var Promise = require('bluebird');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['lockskip', 'ls'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            redis.exists('meta:state:skipable').then(ex => {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    plugged.sendChat(utils.replace(langfile.skip.lockskip, {username: data.username}), 70);
                    var booth = utils.clone(plugged.getBooth());
                    var media = utils.clone(plugged.getMedia());
                    //noinspection JSUnresolvedFunction
                    plugged.setCyclePromise(true).then(() => //noinspection JSUnresolvedFunction
                    plugged.skipDJPromise(booth.dj)).then(() => {
                        redis.set('meta:state:skipable', 1, 'EX', 2);
                        if (config.lockskip.move_pos !== undefined) plugged.moveDJ(booth.dj, config.lockskip.move_pos);
                        return Promise.resolve();
                    }).then(() => {
                        if (booth.shouldCycle !== plugged.doesWaitlistCycle()) { //noinspection JSUnresolvedFunction
                            return plugged.setCyclePromise(booth.shouldCycle);
                        }
                        else Promise.resolve();
                    }).then(() => {
                        var split = data.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]] !== undefined) {
                            plugged.sendChat(utils.replace(langfile.skip.reasons[split[1]], {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(media.author, media.title)
                            }), 60);
                        }
                    }).catch(err => {
                        story.error('Error while lockskipping.', {attach: err});
                    });
                    story.info('lockskip', `${utils.userLogString(data.username, data.id)}: ${utils.mediatitlelog(media)} played by ${utils.userLogString(plugged.getUserByID(booth.dj))}`);
                }
            });
        });
        plugged.removeChatMessage(data.cid);
    }
};