let story = require('storyboard').mainStory,
    S = require('string'),
    _ = require('underscore'),
    Command = require('../CommandBase');

class AddCommand extends Command {
    constructor(exports) {
        super(exports);
        this.names = ['add', 'addwl'];
        this.enabled = true;
    }

    handler(data) {
        //noinspection JSUnresolvedFunction
        this.redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (this.config.options.bouncerPlus ? (perm > 1) : (perm > 2)) {
                let split = data.message.split(' ');
                //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                let user = this.plugged.getUserByName(S(_.rest(split, 1).join(' ')).chompLeft('@').chompRight(' ').s);
                if (user) {
                    this.utils.isWlBanned(user).then(isBanned => {
                        if (!isBanned) {
                            if ((() => {
                                    let waitlist = this.plugged.getWaitlist() || [];
                                    let dj = this.plugged.getDJ() || {id: -1};
                                    if (dj === user.id) return false;
                                    return !waitlist.includes(user.id);
                                })()) {
                                this.plugged.sendChat(this.utils.replace(this.langfile.bpActions.add, {username: data.username}), 45);
                                if (this.plugged.getWaitlist() === undefined || this.plugged.getWaitlist().length < 50) {
                                    this.plugged.addToWaitlist(user.id, err => {
                                        if (err) story.error('add', 'Error adding user to the waitlist.', {attach: err});
                                    });
                                } else this.addQueue.add(user.id, 100).then(() => {
                                    this.plugged.sendChat(this.utils.replace(this.langfile.bpActions.addQueue, {
                                        username: user.username,
                                        mod: data.username
                                    }));
                                });
                            }
                        } else this.plugged.sendChat(this.utils.replace(this.langfile.error.wlBanned, {
                            username: data.username,
                            cmd: 'Add'
                        }));
                    });
                } else { //noinspection JSCheckFunctionSignatures,JSUnresolvedFunction
                    this.plugged.sendChat(this.utils.replace(this.langfile.error.userNotFound, {
                        username: this.plugged.getUserByID(data.id),
                        value: S(_.rest(split, 1).join(' ')).chompLeft('@').s
                    }), 20);
                }
                story.info('add', `${this.utils.userLogString(data.username, data.id)}: ${this.utils.userLogString(user)}`);
            }
        });
        this.plugged.removeChatMessage(data.cid);
    }
}

module.exports = AddCommand;