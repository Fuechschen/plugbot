let story = require('storyboard').mainStory;
let S = require('string');

let plugged = require('../client');
let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['eventmode'],
    enabled: true,
    handler: (data)=> {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                let str = S(data.message);
                config.state.eventmode = !config.state.eventmode;
                if (config.state.eventmode) {
                    //noinspection JSUnresolvedFunction
                    if (str.contains('-c') || str.contains('--clear')) {
                        plugged.sendChat(utils.replace(langfile.eventmode.clear, {username: data.username}));
                        if (plugged.getBooth().isLocked) plugged.setLock(false);
                        plugged.setLock(true, true);
                    } else { //noinspection JSUnresolvedFunction
                        if (str.contains('-l') || str.contains('--lock')) {
                            plugged.sendChat(utils.replace(langfile.eventmode.lock, {username: data.username}));
                            plugged.setLock(true, false);
                        } else plugged.sendChat(utils.replace(langfile.eventmode.enabled, {username: data.username}));
                    }
                    //noinspection JSUnresolvedFunction
                    if (str.contains('-dc') || str.contains('--disable-cycle')) plugged.setCycle(false);
                    else { //noinspection JSUnresolvedFunction
                        if (str.contains('-ec') || str.contains('--enable-cycle')) plugged.setCycle(true);
                    }
                }
                else {
                    plugged.sendChat(utils.replace(langfile.eventmode.disabled, {username: data.username}));
                    //noinspection JSUnresolvedFunction
                    if (str.contains('-u') || str.contains('--unlock')) plugged.setLock(false);
                    //noinspection JSUnresolvedFunction
                    if (str.contains('-dc') || str.contains('--disable-cycle')) plugged.setCycle(false);
                    else { //noinspection JSUnresolvedFunction
                        if (str.contains('-ec') || str.contains('--enable-cycle')) plugged.setCycle(true);
                    }
                }
                //noinspection JSUnresolvedFunction
                redis.hset('meta:config', 'state:eventmode', (config.state.eventmode ? 1 : 0));
                story.info('eventmode', `${utils.userLogString(data.username, data.id)}: --> ${config.state.eventmode.toString()}`);
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};