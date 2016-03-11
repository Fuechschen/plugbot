var cleverbot;

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
                r = undefined;
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
                r = langfile.setstaff.roles.manager;
                break;
            case plugged.USERROLE.COHOST:
                r = langfile.setstaff.roles.cohost;
                break;
            case plugged.USERROLE.HOST:
                r = langfile.setstaff.roles.host;
                break;
            default:
                r = langfile.setstaff.roles.undef;
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
        redis.exists('meta:config:state:eventmode').then(function (ex) {
            if (ex) {
                redis.get('meta:config:state:eventmode').then(function (val) {
                    config.state.eventmode = val === '1';
                    load('eventmode', config.state.eventmode);
                });
            } else load('eventmode', 'not stored')
        });
        redis.exists('meta:config:voteskip:enabled').then(function (ex) {
            if (ex) {
                redis.get('meta:config:voteskip:enabled').then(function (val) {
                    config.voteskip.enabled = val === '1';
                    load('voteskip', config.voteskip.enabled)
                });
            } else load('voteskip', 'not stored')
        });
        redis.exists('meta:config:timeguard:enabled').then(function (ex) {
            if (ex) {
                redis.get('meta:config:timeguard:enabled').then(function (val) {
                    config.timeguard.enabled = val === '1';
                    load('timeguard', config.timeguard.enabled);
                });
            } else load('timeguard', 'not stored');
        });
        redis.exists('meta:config:history:skipenabled').then(function (ex) {
            if (ex) {
                redis.get('meta:config:history:skipenabled').then(function (val) {
                    config.history.skipenabled = val === '1';
                    load('historyskip', config.history.skipenabled);
                });
            } else load('historyskip', 'not stored');
        });
        redis.exists('meta:config:cleverbot:enabled').then(function (ex) {
            if (ex) {
                redis.get('meta:config:cleverbot:enabled').then(function (val) {
                    config.cleverbot.enabled = val === '1';
                    load('cleverbot', config.cleverbot.enabled);
                });
            } else load('cleverbot', 'not stored');
        });
        redis.exists('meta:config:lockskip:move_pos').then(function (ex) {
            if (ex) {
                redis.get('meta:config:lockskip:move_pos').then(function (val) {
                    config.lockskip.move_pos = parseInt(val);
                    load('lockskippos', config.lockskip.move_pos);
                });
            } else load('lockskippos', 'not stored');
        });
        redis.exists('meta:config:options:bouncer_plus').then(function (ex) {
            if (ex) {
                redis.get('meta:config:options:bouncer_plus').then(function (val) {
                    config.options.bouncer_plus = val === '1';
                    load('bouncer+', config.options.bouncer_plus);
                });
            } else load('bouncer+', 'not stored');
        });
        redis.exists('meta:config:state:lockdown').then(function (ex) {
            if (ex) {
                redis.get('meta:config:state:lockdown').then(function (val) {
                    config.state.lockdown = val === '1';
                    load('lockdown', config.state.lockdown);
                });
            } else load('lockdown', 'not stored');
        });
        redis.exists('meta:config:chatfilter:enabled').then(function (ex) {
            if (ex) {
                redis.get('meta:config:chatfilter:enabled').then(function (val) {
                    config.chatfilter.enabled = val === '1';
                    load('chatfilter', config.chatfilter.enabled);
                });
            } else load('chatfilter', 'not stored');
        });

        function load(name, val) {
            loaded = loaded + 1;
            story.debug('meta', 'Loaded ' + name + ' [' + val + '] from Redis. ' + loaded + '/8');
        }
    },
    sendToCleverbot: function (data) {
        if (cleverbot !== undefined && config.cleverbot.enabled) {
            cleverbot.write(data.message.replace('@' + plugged.getSelf().username, '').trim(), function (resp) {
                story.debug('cleverbot', resp.message);
                plugged.sendChat(utils.replace(langfile.cleverbot.format, {
                    username: data.username,
                    message: resp.message
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
    userLogString: function (user, id) {
        return (typeof user === 'object' ? user.username + '[' + user.id + ']' : user + '[' + id + ']');
    },
    mediatitlelog: function (media) {
        return media.author + ' - ' + media.title + '[' + media.id + '|' + media.format + '|' + media.cid + ']';
    },
    clone: function (obj, options) {
        options = options || {};
        if (options.deep === undefined) options.deep = false;
        if (options.exclude === undefined) options.exclude = [];
        function copy(obj, level) {
            if (obj == null || typeof obj !== 'object') return obj;
            var clone, i;
            if (obj instanceof Array) {
                clone = [];
                for (i = 0; i < obj.length; i++) {
                    if (!obj.hasOwnProperty(i)) continue;
                    if (options.deep && level < 4) clone.push(copy(obj[i], level + 1));
                    else clone.push(obj[i]);
                }
            } else {
                clone = {};
                for (i in obj) {
                    if (!obj.hasOwnProperty(i)) continue;
                    if (options.exclude[level] !== undefined && options.exclude[level].indexOf(i) !== -1) continue;
                    if (options.deep && level < 4) clone[i] = copy(obj[i], level + 1);
                    else clone[i] = obj[i];
                }
            }
            return clone;
        }

        return copy(obj, 0);
    },
    checkRegionRestriction: function (body) {
        if (body.contentDetails.regionRestriction !== undefined) {
            if (body.contentDetails.regionRestriction.allowed !== undefined) {
                var allowedintersection = _.intersection(body.contentDetails.regionRestriction.allowed, config.youtubeGuard.countryblocks.countries);
                if (allowedintersection.length !== config.youtubeGuard.countryblocks.countries.length) {
                    return _.diffrence(config.youtubeGuard.countryblocks.countries, body.contentDetails.regionRestriction.allowed)
                } else return false;
            } else if (body.contentDetails.regionRestriction.blocked !== undefined) {
                var blockintersection = _.intersection(body.contentDetails.regionRestriction.blocked, config.youtubeGuard.countryblocks.countries);
                if (blockintersection.length !== 0) {
                    return blockintersection;
                } else return false;
            } else return false;
        } else return false;
    },
    dblog: function (msg) {
        story.debug('db', msg);
    },
    contains: function (string, array) {
        var str = S(string);
        for (var i = 0; i < array.length; i++) {
            if(str.contains(array[i])) return true;
        }
        return false;
    },
    containsplug: function (string) {
        return S(string).contains('https://plug.dj/');
        //return  string.match(/https?:\/\/plug\.dj\/.+/i).length === string.match(/https?:\/\/[sb][ul][po][pg]o?r?t?\.?plug\.dj\//i).length
    },
    loadCleverbot: function(){
        try {
            var Cleverbot = require('cleverbot-node');
            cleverbot = new Cleverbot;
            cleverbot.prepare();
            story.info('cleverbot', 'Cleverbot loaded and ready.');
        } catch (e) {
            cleverbot = undefined;
            story.info('cleverbot', 'Unable to load cleverbot-integration.');
            story.debug('cleverbot', 'Unable to load cleverbot-integration.', {attach: e});
        }
    }
};