let story = require('storyboard').mainStory;
let Promise = require('bluebird');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['lockskip', 'ls'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            redis.exists('meta:state:skipable').then(ex => {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    plugged.sendChat(utils.replace(langfile.skip.lockskip, {username: data.username}), 70);
                    let booth = utils.clone(plugged.getBooth());
                    let media = utils.clone(plugged.getMedia());
                    //noinspection JSUnresolvedFunction
                    plugged.setCyclePromise(true).then(() => //noinspection JSUnresolvedFunction
                        plugged.skipDJPromise(booth.dj)).then(() => {
                        redis.set('meta:state:skipable', 1, 'EX', 2);
                        if (config.lockskip.movePos) plugged.moveDJ(booth.dj, config.lockskip.movePos);
                        return Promise.resolve();
                    }).then(() => {
                        if (booth.shouldCycle !== plugged.doesWaitlistCycle()) { //noinspection JSUnresolvedFunction
                            return plugged.setCyclePromise(booth.shouldCycle);
                        }
                        return Promise.resolve();
                    }).then(() => {
                        let split = data.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]]) {
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