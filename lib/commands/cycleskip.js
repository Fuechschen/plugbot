let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['cycleskip', 'cs'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            redis.exists('meta:state:skipable').then(ex => {
                perm = parseInt(perm, 10);
                if (perm > 1 && ex === 0) {
                    let booth = utils.clone(plugged.getBooth());
                    let media = utils.clone(plugged.getMedia());
                    plugged.sendChat(utils.replace(langfile.skip.cycleskip, {username: data.username}), 70);
                    plugged.setCycle(false);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1, 'EX', 2);
                    if (booth.shouldCycle !== plugged.doesWaitlistCycle) plugged.setCycle(booth.shouldCycle);
                    setTimeout(() => {
                        let split = data.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]]) {
                            plugged.sendChat(utils.replace(langfile.skip.reasons[split[1]], {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(media.author, media.title)
                            }), 60);
                        }
                    }, 4 * 1000);
                    story.info('cycleskip', `${utils.userLogString(data.username, data.id)}: ${utils.mediatitlelog(media)} played by ${utils.userLogString(plugged.getUserByID(booth.dj))}`);
                }
            });
        });
        plugged.removeChatMessage(data.cid);
    }
};