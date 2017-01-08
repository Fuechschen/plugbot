let S = require('string'),
    _ = require('underscore'),
    Command = require('../CommandBase');

class BanCommand extends Command {
    constructor(exports) {
        super(exports);
        this.names = ['ban'];
        this.enabled = true;
    }

    handler(data) {
        //noinspection JSUnresolvedFunction
        this.redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (perm > 1) {
                let split = data.message.split(' ');
                if (split.length > 2) {
                    let duration;
                    if (split[1] === 'h') duration = this.plugged.BANDURATION.HOUR;
                    else if (split[1] === 'd') duration = this.plugged.BANDURATION.DAY;
                    else if (split[1] === 'p' || split[1] === 'f') {
                        if (this.config.options.bouncerPlus) {
                            duration = this.plugged.BANDURATION.PERMA;
                        }
                        else return;
                    }
                    else  return this.plugged.sendChat(this.utils.replace(this.langfile.error.argument, {
                            username: data.username,
                            cmd: 'Ban'
                        }), 20);
                    //noinspection JSUnresolvedFunction
                    let user = this.plugged.getUserByName(S(_.rest(split, 2).join(' ')).chompLeft('@').chompRight(' ').s) ||this. plugged.getUserByID(split[2]);
                    if (user) {
                        this.plugged.sendChat(this.utils.replace(this.langfile.ban.default, {
                            mod: data.username,
                            username: user.username,
                            duration: this.langfile.ban.duration[duration]
                        }));
                        this.plugged.banUser(user.id, duration, this.plugged.BANREASON.VIOLATING_COMMUNITY_RULES);
                    } else { //noinspection JSUnresolvedFunction
                        this.plugged.sendChat(this.utils.replace(this.langfile.error.userNotFound, {
                            username: this.plugged.getUserByID(data.id),
                            value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                        }), 20);
                    }
                } else this.plugged.sendChat(this.utils.replace(this.langfile.error.argument, {
                    username: data.username,
                    cmd: 'Ban'
                }), 20);
            }
        });
        this.plugged.removeChatMessage(data.cid);
    }
}

module.exports = BanCommand;