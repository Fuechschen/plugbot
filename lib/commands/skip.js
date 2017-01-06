let story = require('storyboard').mainStory;

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['skip', 'fs'],
    enabled: true,
    handler: (data) => {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            redis.exists('meta:state:skipable').then(ex => {
                perm = parseInt(perm, 10);
                let booth = utils.clone(plugged.getBooth());
                let media = utils.clone(plugged.getMedia());
                if (perm > 1 && ex === 0) {
                    plugged.sendChat(utils.replace(langfile.skip.default, {username: data.username}), 70);
                    plugged.skipDJ(booth.dj);
                    redis.set('meta:state:skipable', 1, 'EX', 2);
                    setTimeout(() => {
                        let split = data.message.trim().split(' ');
                        if (langfile.skip.reasons[split[1]]) {
                            plugged.sendChat(utils.replace(langfile.skip.reasons[split[1]], {
                                username: plugged.getUserByID(booth.dj).username,
                                song: utils.songtitle(media.author, media.title)
                            }), 60);
                        }
                    }, 4 * 1000);
                    story.info('skip', `${utils.userLogString(data.username, data.id)}: ${utils.mediatitlelog(media)} played by ${utils.userLogString(plugged.getUserByID(booth.dj))}`);
                } else if (perm === 1 && ex === 0 && config.rdjskip.enabled) {
                    //noinspection JSUnresolvedFunction
                    redis.sismember('meta:data:rdjskip:votes', data.id).then(is => {
                        if (is === 0) {
                            redis.get('meta:data:staff:active').then(active => {
                                active = parseInt(active, 10);
                                if (active <= config.rdjskip.max_staff_active) {
                                    //noinspection JSUnresolvedFunction
                                    redis.scard('meta:data:rdjskip:votes').then(card => {
                                        if (card + 1 >= config.rdjskip.votes) {
                                            plugged.sendChat(utils.replace(langfile.rdjskip.skip, {username: data.username}));
                                            story.info('skip', `${utils.userLogString(data.username, data.id)}: ${utils.mediatitlelog(media)} played by ${utils.userLogString(plugged.getUserByID(booth.dj))}`);
                                        } else {
                                            //noinspection JSUnresolvedFunction
                                            redis.sadd('meta:data:rdjskip:votes', data.id).then(() => {
                                                plugged.sendChat(utils.replace(langfile.rdjskip.default, {username: data.username}));
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
        plugged.removeChatMessage(data.cid);
    }
};