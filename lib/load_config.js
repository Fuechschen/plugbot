var Promise = require('bluebird');
var story = require('storyboard').mainStory;

var conf;
try {
    conf = require('../config');
} catch (e) {
    throw new Error('No config file. Copy config.example.js to config.js and insert your data.');
}

if (conf.apiKeys.youtube === '' || conf.apiKeys.soundcloud === '') {
    throw new Error('You are missing at least one api-key.');
} else if (conf.sequelize.database === '' || conf.sequelize.options.dialect === '') {
    throw new Error('Your database settings seem to be incorrect.');
} else if (conf.login.email === '' || conf.login.password === '') {
    throw new Error('You need to specify login credentials for the bot.');
} else if (conf.redis === null) {
    throw new Error('config.redis cannot be null. Use redis: undefined if you want to connect to the default port on localhost');
} else if ((typeof conf.redis === 'object' && (conf.redis.host === '' || conf.redis.host === null || conf.redis.host === undefined))) {
    throw new Error('You need specify a redis host.');
} else if (conf.options.room === '') {
    throw new Error('You need to specify a room to join.');
} else if (conf.options.command_prefix === conf.customcommands.trigger) {
    throw new Error('Commandprefix and customcommandtrigger must\'nt be th same');
} else {
    module.exports = conf;

    var redis = new require('ioredis')(conf.redis);
    var loaded = 0;
    Promise.all([
        redis.hexists('meta:config', 'state:eventmode').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'state:eventmode').then(function (val) {
                    conf.state.eventmode = val === '1';
                    load('eventmode', conf.state.eventmode);
                });
            } else load('eventmode', 'not stored')
        }),
        redis.hexists('meta:config', 'voteskip:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'voteskip:enabled').then(function (val) {
                    conf.voteskip.enabled = val === '1';
                    load('voteskip', conf.voteskip.enabled)
                });
            } else load('voteskip', 'not stored')
        }),
        redis.hexists('meta:config', 'timeguard:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'timeguard:enabled').then(function (val) {
                    conf.timeguard.enabled = val === '1';
                    load('timeguard', conf.timeguard.enabled);
                });
            } else load('timeguard', 'not stored');
        }),
        redis.hexists('meta:config', 'history:skipenabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'history:skipenabled').then(function (val) {
                    conf.history.skipenabled = val === '1';
                    load('historyskip', conf.history.skipenabled);
                });
            } else load('historyskip', 'not stored');
        }),
        redis.hexists('meta:config', 'cleverbot:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'cleverbot:enabled').then(function (val) {
                    conf.cleverbot.enabled = val === '1';
                    load('cleverbot', conf.cleverbot.enabled);
                });
            } else load('cleverbot', 'not stored');
        }),
        redis.hexists('meta:config', 'lockskip:move_pos').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'lockskip:move_pos').then(function (val) {
                    conf.lockskip.move_pos = parseInt(val);
                    load('lockskippos', conf.lockskip.move_pos);
                });
            } else load('lockskippos', 'not stored');
        }),
        redis.hexists('meta:config', 'options:bouncer_plus').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'options:bouncer_plus').then(function (val) {
                    conf.options.bouncer_plus = val === '1';
                    load('bouncer+', conf.options.bouncer_plus);
                });
            } else load('bouncer+', 'not stored');
        }),
        redis.hexists('meta:config', 'state:lockdown').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'state:lockdown').then(function (val) {
                    conf.state.lockdown = val === '1';
                    load('lockdown', conf.state.lockdown);
                });
            } else load('lockdown', 'not stored');
        }),
        redis.hexists('meta:config', 'chatfilter:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'chatfilter:enabled').then(function (val) {
                    conf.chatfilter.enabled = val === '1';
                    load('chatfilter', conf.chatfilter.enabled);
                });
            } else load('chatfilter', 'not stored');
        }),
        redis.hexists('meta:config', 'options:dcmoveback').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'options:dcmoveback').then(function (val) {
                    conf.dcmoveback.enabled = val === '1';
                    load('dcmoveback', conf.dcmoveback.enabled);
                });
            } else load('dcmoveback', 'not stored');
        }),
        redis.hexists('meta:config', 'soundcloudguard:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'soundcloudguard:enabled').then(function (val) {
                    conf.soundcloudGuard.enabled = val === '1';
                    load('soundcloudguard', conf.soundcloudGuard.enabled);
                });
            } else load('soundcloudguard', 'not stored');
        }),
        redis.hexists('meta:config', 'youtubeguard:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'youtubeguard:enabled').then(function (val) {
                    conf.youtubeGuard.enabled = val === '1';
                    load('youtubeguard', conf.youtubeGuard.enabled);
                });
            } else load('youtubeguard', 'not stored');
        }),
        redis.hexists('meta:config', 'customcommands:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'customcommands:enabled').then(function (val) {
                    conf.customcommands.enabled = val === '1';
                    load('customcommands', conf.customcommands.enabled);
                });
            } else load('customcommands', 'not stored');
        }),
        redis.hexists('meta:config', 'afk:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'afk:enabled').then(function (val) {
                    conf.afk.enabled = val === '1';
                    load('afk', conf.afk.enabled);
                });
            } else load('afk', 'not stored');
        }),
        redis.hexists('meta:config', 'joinmode:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'joinmode:enabled').then(function (val) {
                    conf.options.joinmode = val === '1';
                    load('joinmode', conf.options.joinmode);
                });
            } else load('joinmode', 'not stored');
        }),
        redis.hexists('meta:config', 'channelblacklist:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'channelblacklist:enabled').then(function (val) {
                    conf.blacklist.channelblacklist = val === '1';
                    load('ChannelBlacklist', conf.blacklist.channelblacklist);
                });
            } else load('ChannelBlacklist', 'not stored');
        }),
        redis.hexists('meta:config', 'titleguard:enabled').then(function (ex) {
            if (ex === 1) {
                redis.hget('meta:config', 'titleguard:enabled').then(function (val) {
                    conf.titleguard.enabled = val === '1';
                    load('titleguard', conf.titleguard.enabled);
                });
            } else load('titleguard', 'not stored');
        })
    ]).then(function () {
        redis.quit();
    }).catch(function (err) {
        story.warn('Error while loading config from redis', {attach: err})
    });

    function load(name, val) {
        loaded = loaded + 1;
        story.debug('config', 'Loaded ' + name + ' [' + val.toString() + '] from Redis. ' + loaded + '/9');
    }
}