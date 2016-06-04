redis.hget('user:roles', data.id).then(function (perm) {
    perm = parseInt(perm, 10);
    if (perm < 1) {
        redis.incr('user:chat:spam:' + data.id + ':points');
        redis.get('user:chat:spam:' + data.id + ':lastmsg').then(function (lastmsg) {
            if (data.message === lastmsg) {
                plugged.removeChatMessage(data.cid);
                redis.incrby('user:chat:spam:' + data.id + ':points', 10);
                redis.expire('user:chat:spam:' + data.id + ':lastmsg', 3600);
            } else {
                redis.set('user:chat:spam:' + data.id + ':lastmsg', data.message).then(function () {
                    redis.expire('user:chat:spam:' + data.id + ':lastmsg', 3600);
                });
            }
            redis.get('user:chat:spam:' + data.id + ':points').then(function (points) {
                if (parseInt(points, 10) >= config.chatfilter.spam.points) {
                    redis.incr('user:chat:spam:' + data.id + ':warns');
                    plugged.removeChatMessage(data.cid);
                    plugged.sendChat(utils.replace(langfile.chatfilter.spam.warn, {username: data.username}), 60);
                }
                redis.get('user:chat:spam:' + data.id + ':warns').then(function (warns) {
                    if (parseInt(warns, 10) > config.chatfilter.spam.warns) {
                        plugged.sendChat(utils.replace(langfile.chatfilter.spam.mute, {username: data.username}), 60);
                        redis.set('user:mute:' + data.id, 1).then(function () {
                            redis.set('user:mute:' + data.id + ':violation', 0);
                            redis.expire('user:mute:' + data.id, config.chatfilter.spam.mute_duration);
                        });
                    } else {
                        if (utils.contains(data.message, config.chatfilter.words.blacklist)) {
                            plugged.removeChatMessage(data.cid);
                            redis.incrby('user:chat:spam:' + data.id + ':points', 10);
                        } else if (utils.containsplug(data.message)) {
                            plugged.removeChatMessage(data.cid);
                            redis.incrby('user:chat:spam:' + data.id + ':points', 20);
                        }
                    }
                });
            });
        });
    }
});