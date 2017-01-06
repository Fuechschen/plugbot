let Promise = require('bluebird');
let story = require('storyboard').mainStory;

let conf;
try {
    conf = require('../config');
} catch (e) {
    throw new Error('No config file. Copy config.example.js to config.js and insert your data.');
}

if (conf.apiKeys.youtube === '' || conf.apiKeys.soundcloud === '') throw new Error('You are missing at least one api-key.');
else if (conf.sequelize.database === '' || conf.sequelize.options.dialect === '') throw new Error('Your database settings seem to be incorrect.');
else if (conf.login.email === '' || conf.login.password === '') throw new Error('You need to specify login credentials for the bot.');
else if (conf.redis === null) throw new Error('config.redis cannot be null. Use redis: undefined if you want to connect to the default port on localhost');
else if ((typeof conf.redis === 'object' && (conf.redis.host === '' || conf.redis.host === null || conf.redis.host === undefined))) throw new Error('You need specify a redis host.');
else if (conf.options.room === '') throw new Error('You need to specify a room to join.');
else if (conf.options.command_prefix === conf.customcommands.trigger) throw new Error('Commandprefix and customcommandtrigger must\'nt be th same');
else {
    module.exports = conf;

    let redis = new require('./db/redis_db');
    let loaded = 0;
    //noinspection JSUnresolvedFunction
    Promise.all([
        redis.hexists('meta:config', 'state:eventmode').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'state:eventmode').then(val => {
                    conf.state.eventmode = val === '1';
                    load('eventmode', conf.state.eventmode);
                });
            } else load('eventmode', 'not stored')
        }),
        redis.hexists('meta:config', 'voteskip:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'voteskip:enabled').then(val => {
                    conf.voteskip.enabled = val === '1';
                    load('voteskip', conf.voteskip.enabled)
                });
            } else load('voteskip', 'not stored')
        }),
        redis.hexists('meta:config', 'timeguard:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'timeguard:enabled').then(val => {
                    conf.timeguard.enabled = val === '1';
                    load('timeguard', conf.timeguard.enabled);
                });
            } else load('timeguard', 'not stored');
        }),
        redis.hexists('meta:config', 'history:skipenabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'history:skipenabled').then(val => {
                    conf.history.skipenabled = val === '1';
                    load('historyskip', conf.history.skipenabled);
                });
            } else load('historyskip', 'not stored');
        }),
        redis.hexists('meta:config', 'cleverbot:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'cleverbot:enabled').then(val => {
                    conf.cleverbot.enabled = val === '1';
                    load('cleverbot', conf.cleverbot.enabled);
                });
            } else load('cleverbot', 'not stored');
        }),
        redis.hexists('meta:config', 'lockskip:move_pos').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'lockskip:move_pos').then(val => {
                    conf.lockskip.move_pos = parseInt(val);
                    load('lockskippos', conf.lockskip.move_pos);
                });
            } else load('lockskippos', 'not stored');
        }),
        redis.hexists('meta:config', 'options:bouncer_plus').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'options:bouncer_plus').then(val => {
                    conf.options.bouncer_plus = val === '1';
                    load('bouncer+', conf.options.bouncer_plus);
                });
            } else load('bouncer+', 'not stored');
        }),
        redis.hexists('meta:config', 'state:lockdown').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'state:lockdown').then(val => {
                    conf.state.lockdown = val === '1';
                    load('lockdown', conf.state.lockdown);
                });
            } else load('lockdown', 'not stored');
        }),
        redis.hexists('meta:config', 'chatfilter:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'chatfilter:enabled').then(val => {
                    conf.chatfilter.enabled = val === '1';
                    load('chatfilter', conf.chatfilter.enabled);
                });
            } else load('chatfilter', 'not stored');
        }),
        redis.hexists('meta:config', 'options:dcmoveback').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'options:dcmoveback').then(val => {
                    conf.dcmoveback.enabled = val === '1';
                    load('dcmoveback', conf.dcmoveback.enabled);
                });
            } else load('dcmoveback', 'not stored');
        }),
        redis.hexists('meta:config', 'soundcloudguard:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'soundcloudguard:enabled').then(val => {
                    conf.soundcloudGuard.enabled = val === '1';
                    load('soundcloudguard', conf.soundcloudGuard.enabled);
                });
            } else load('soundcloudguard', 'not stored');
        }),
        redis.hexists('meta:config', 'youtubeguard:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'youtubeguard:enabled').then(val => {
                    conf.youtubeGuard.enabled = val === '1';
                    load('youtubeguard', conf.youtubeGuard.enabled);
                });
            } else load('youtubeguard', 'not stored');
        }),
        redis.hexists('meta:config', 'customcommands:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'customcommands:enabled').then(val => {
                    conf.customcommands.enabled = val === '1';
                    load('customcommands', conf.customcommands.enabled);
                });
            } else load('customcommands', 'not stored');
        }),
        redis.hexists('meta:config', 'afk:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'afk:enabled').then(val => {
                    conf.afk.enabled = val === '1';
                    load('afk', conf.afk.enabled);
                });
            } else load('afk', 'not stored');
        }),
        redis.hexists('meta:config', 'joinmode:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'joinmode:enabled').then(val => {
                    conf.options.joinmode = val === '1';
                    load('joinmode', conf.options.joinmode);
                });
            } else load('joinmode', 'not stored');
        }),
        redis.hexists('meta:config', 'channelblacklist:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'channelblacklist:enabled').then(val => {
                    conf.blacklist.channelblacklist = val === '1';
                    load('ChannelBlacklist', conf.blacklist.channelblacklist);
                });
            } else load('ChannelBlacklist', 'not stored');
        }),
        redis.hexists('meta:config', 'youtube:block:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'youtubeguard:block:enabled').then(val => {
                    conf.youtubeGuard.block = val === '1';
                    load('YouTubeBlock', conf.youtubeGuard.block);
                });
            } else load('YouTubeBlock', 'not stored');
        }),
        redis.hexists('meta:config', 'soundcloud:block:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'soundcloudguard:block:enabled').then(val => {
                    conf.soundcloudGuard.block = val === '1';
                    load('SoundCloudBlock', conf.soundcloudGuard.block);
                });
            } else load('SoundCloudBlock', 'not stored');
        }),
        redis.hexists('meta:config', 'titleguard:enabled').then(ex => {
            if (ex) {
                //noinspection JSUnresolvedFunction
                redis.hget('meta:config', 'titleguard:enabled').then(val => {
                    conf.titleguard.enabled = val === '1';
                    load('titleguard', conf.titleguard.enabled);
                });
            } else load('titleguard', 'not stored');
        })
    ]).catch(err => {
        story.warn('Error while loading config from redis', {attach: err})
    });

    function load(name, val) {
        loaded = loaded + 1;
        story.debug('config', `Loaded ${name} [${val.toString()}] from Redis. ${loaded}/9`);
    }
}