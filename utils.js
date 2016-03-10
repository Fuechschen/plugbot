var cleverbot;
try {
    var Cleverbot = required('cleverbot-node');
    cleverbot = new Cleverbot;
    cleverbot.prepare();
} catch (e) {
    cleverbot = undefined;
}
module.exports = {
    replace: function (str, replacer) {
        var keys = _.keys(replacer);
        var string = S(str);
        keys.forEach(function (key) {
            string = string.replaceAll('&{' + key + '}', replacer[key] || '');
        });
        return string.s;
    },
    songtitle: function (author, title) {
        return author + ' - ' + title;
    },
    mediatitle: function (media) {
        return media.author + ' - ' + media.title;
    },
    role: function (role) {
        var r;
        switch (role) {
            case 'none':
                r = plugged.USERROLE.NONE;
                break;
            case 'rdj':
                r = plugged.USERROLE.RESIDENTDJ;
                break;
            case 'bouncer':
                r = plugged.USERROLE.BOUNCER;
                break;
            case 'manager':
                r = plugged.USERROLE.MANAGER;
                break;
            case 'co-host':
                r = plugged.USERROLE.COHOST;
                break;
            case 'host':
                r = plugged.USERROLE.HOST;
                break;
            case 0:
                r = plugged.USERROLE.NONE;
                break;
            case 1:
                r = plugged.USERROLE.RESIDENTDJ;
                break;
            case 2:
                r = plugged.USERROLE.BOUNCER;
                break;
            case 3:
                r = plugged.USERROLE.MANAGER;
                break;
            case 4:
                r = plugged.USERROLE.COHOST;
                break;
            case 5:
                r = plugged.USERROLE.HOST;
                break;
            default:
                r = plugged.USERROLE.NONE;
                break;
        }
        return r;
    },
    permlevel: function (role) {
        var r;
        switch (role) {
            case plugged.USERROLE.NONE:
                r = 0;
                break;
            case plugged.USERROLE.RESIDENTDJ:
                r = 1;
                break;
            case plugged.USERROLE.BOUNCER:
                r = 2;
                break;
            case plugged.USERROLE.MANAGER:
                r = 3;
                break;
            case plugged.USERROLE.COHOST:
                r = 4;
                break;
            case plugged.USERROLE.HOST:
                r = 5;
                break;
            default:
                r = undefined;
                break;
        }
        return r;
    },
    rolename: function (role) {
        var r;
        switch (role) {
            case plugged.USERROLE.NONE:
                r = langfile.setstaff.roles.user;
                break;
            case plugged.USERROLE.RESIDENTDJ:
                r = langfile.setstaff.roles.rdj;
                break;
            case plugged.USERROLE.BOUNCER:
                r = langfile.setstaff.roles.bouncer;
                break;
            case plugged.USERROLE.MANAGER:
                r = plugged.setstaff.roles.manager;
                break;
            case plugged.USERROLE.COHOST:
                r = plugged.setstaff.roles.cohost;
                break;
            case plugged.USERROLE.HOST:
                r = plugged.setstaff.roles.host;
                break;
            default:
                r = plugged.setstaff.roles.undef;
                break;
        }
        return r;
    },
    blacklistReason: function (str) {
        var string = S(str);
        var keys = _.keys(langfile.blacklist.reasons);
        keys.forEach(function (key) {
            string = string.replaceAll('#' + key, langfile.blacklist.reasons[key]);
        });
        return string;
    },
    loadConfigfromRedis: function () {
        var loaded = 0;
        redis.get('meta:config:state:eventmode').then(function (event) {
            config.state.eventmode = ((event !== null) ? (event === 1) : config.state.eventmode);
            loaded = loaded + 1;
        });
        redis.get('meta:config:voteskip:enabled').then(function (voteskip) {
            config.voteskip.enabled = ((voteskip !== null) ? (voteskip === 1) : config.voteskip.enabled);
            loaded = loaded + 1;
        });
        redis.get('meta:config:cleverbot:enabled').then(function (cleverbot) {
            config.cleverbot.enabled = ((cleverbot !== null) ? (cleverbot === 1) : config.cleverbot.enabled);
            loaded = loaded + 1;
        });
        redis.get('meta:config:history:skipenabled').then(function (historyskip) {
            config.history.skipenabled = ((historyskip !== null) ? (historyskip === 1) : config.history.skipenabled);
            loaded = loaded + 1;
        });
        redis.get('meta:config:lockskip:move_pos').then(function (lockskippos) {
            config.lockskip.move_pos = ((lockskippos === null) ? config.lockskip.move_pos : lockskippos);
            loaded = loaded + 1;
        });
        redis.get('meta:config:options:bouncer_plus').then(function (bouncer_plus) {
            config.options.bouncer_plus = ((bouncer_plus !== null) ? (bouncer_plus === 1) : config.options.bouncer_plus);
            loaded = loaded + 1;
        });
        redis.get('meta:config:timeguard:enabled').then(function (timeguard) {
            config.timeguard.enabled = ((timeguard !== null) ? (timeguard === 1) : config.timeguard.enabled);
            loaded = loaded + 1;
        });
        while(true){
            if(!loaded < 7){
                story.info('meta', 'Loaded configuration from redis.');
                return;
            }
        }

    },
    sendToCleverbot: function (data) {
        if (cleverbot !== undefined) {
            cleverbot.write(data.message.replace('@' + plugged.getSelf().username, '').trim(), function (resp) {
                plugged.sendChat(this.replace(langfile.cleverbot.format, {
                    username: data.username,
                    messgae: resp.message
                }));
            });
        }
    },
    checkVoteSkip: function (score) {
        switch (typeof config.voteskip.condition) {
            default:
                return false;
                break;
            case 'number':
                if (score.mehs >= config.voteskip.condition) return true;
                break;
            case 'function':
                if (config.voteskip.condition(score)) return true;
                break;
            case 'object':
                if (config.voteskip.condition.max <= score.mehs) return true;
                else if (config.voteskip.condition.min <= score.mehs)return ((score.mehs / score.userCount) >= config.voteskip.condition.ratio);
                else return false;
                break;
        }
    },
    userLogString: function(user, id){
        return (typeof user === 'object' ? user.username + '[' + user.id + ']' : user + '[' + id + ']');
    },
    mediatitlelog: function(media){
        return media.author + ' - ' + media.title + '[' + media.id + '|' + media.format + '|' + media.cid + ']';
    }
};