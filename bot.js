var config = require('./lib/load_config.js');
var storyboard = require('storyboard');
var langfile = require('./langfile.js');
var moment = require('moment');

storyboard.config({filter: '*:' + config.options.loglevel});
storyboard.mainStory.info('Starting plugbot version ' + require('./package.json').version);

moment.locale(langfile.moment_locale);

var plugged = require('./lib/client');
var redis = require('./lib/db/redis_db');
var db = require('./lib/db/sql_db');

redis.del('user:roles');

redis.exists('meta:data:staff:active').then(function (ex) {
    if (ex === 0) redis.set('meta:data:staff:active', 1);
});

plugged.on(plugged.LOGIN_SUCCESS, require('./lib/eventhandlers/login_success'));
plugged.on(plugged.LOGIN_ERROR, require('./lib/eventhandlers/login_error'));

plugged.on(plugged.CONN_SUCCESS, require('./lib/eventhandlers/conn_success'));
plugged.on(plugged.CONN_PART, require('./lib/eventhandlers/conn_part'));
plugged.on(plugged.CONN_ERROR, require('./lib/eventhandlers/conn_error'));
plugged.on(plugged.CONN_WARNING, require('./lib/eventhandlers/conn_warning'));

plugged.on(plugged.PLUG_MESSAGE, require('./lib/eventhandlers/plug_message'));
plugged.on(plugged.PLUG_ERROR, require('./lib/eventhandlers/plug_error'));
plugged.on(plugged.KILL_SESSION, require('./lib/eventhandlers/kill_session'));
plugged.on(plugged.PLUG_UPDATE, require('./lib/eventhandlers/plug_update'));
plugged.on(plugged.MAINTENANCE_MODE, require('./lib/eventhandlers/maintenance_mode'));

plugged.on(plugged.JOINED_ROOM, require('./lib/eventhandlers/joined_room'));

plugged.on(plugged.ADVANCE, require('./lib/eventhandlers/advance'));
plugged.on(plugged.WAITLIST_UPDATE, require('./lib/eventhandlers/waitlist_update'));

plugged.on(plugged.FRIEND_JOIN, require('./lib/eventhandlers/user_join'));
plugged.on(plugged.USER_JOIN, require('./lib/eventhandlers/user_join'));

plugged.on(plugged.USER_LEAVE, require('./lib/eventhandlers/user_leave'));

plugged.on(plugged.CHAT, require('./lib/eventhandlers/chat'));
plugged.on(plugged.CHAT_MENTION, require('./lib/eventhandlers/chat'));
plugged.on(plugged.CHAT_COMMAND, require('./lib/eventhandlers/chat_command'));

plugged.on(plugged.VOTE, require('./lib/eventhandlers/vote'));

plugged.on(plugged.MOD_STAFF, require('./lib/eventhandlers/mod_staff'));
plugged.on(plugged.MOD_BAN, require('./lib/eventhandlers/mod_ban'));
plugged.on(plugged.MOD_SKIP, require('./lib/eventhandlers/mod_skip'));
plugged.on(plugged.MOD_ADD_DJ, require('./lib/eventhandlers/mod_add_dj'));

module.exports = {plugged: plugged, app: (config.web.enabled ? require('./web/index').app : null)};
