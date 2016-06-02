var story = require('storyboard').mainStory;
var S = require('string');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names: ['eventmode'],
    handler: function (data) {
        redis.get('user:role:save:' + data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var str = S(data.message);
                config.state.eventmode = !config.state.eventmode;
                if (config.state.eventmode) {
                    if (str.contains('-c') || str.contains('--clear')) {
                        plugged.sendChat(utils.replace(langfile.eventmode.clear, {username: data.username}));
                        if (plugged.getBooth().isLocked) plugged.setLock(false);
                        plugged.setLock(true, true);
                    } else if (str.contains('-l') || str.contains('--lock')) {
                        plugged.sendChat(utils.replace(langfile.eventmode.lock, {username: data.username}));
                        plugged.setLock(true, false);
                    } else plugged.sendChat(utils.replace(langfile.eventmode.enabled, {username: data.username}));
                    if (str.contains('-dc') || str.contains('--disable-cycle')) plugged.setCycle(false);
                    else if (str.contains('-ec') || str.contains('--enable-cycle')) plugged.setCycle(true);
                }
                else {
                    plugged.sendChat(utils.replace(langfile.eventmode.disabled, {username: data.username}));
                    if (str.contains('-u') || str.contains('--unlock')) plugged.setLock(false);
                    if (str.contains('-dc') || str.contains('--disable-cycle')) plugged.setCycle(false);
                    else if (str.contains('-ec') || str.contains('--enable-cycle')) plugged.setCycle(true);
                }
                redis.set('meta:config:state:eventmode', (config.state.eventmode ? 1 : 0));
                story.info('eventmode', utils.userLogString(data.username, data.id) + ': --> ' + config.state.eventmode.toString());
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};