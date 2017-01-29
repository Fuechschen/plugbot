let story = require('storyboard').mainStory,
    Command = require('../CommandBase');


class ClearCommand extends Command {
    constructor(exports) {
        super(exports);
        this.enabled = true;
        this.names = ['clear', 'clearwl'];
    }

    handler(data){
        //noinspection JSUnresolvedFunction
        this.redis.hget('user:roles', data.id).then(perm => {
            perm = parseInt(perm, 10);
            if ((this.config.options.bouncerPlus ? (perm > 1) : (perm > 2))) {
                this.plugged.sendChat(this.utils.replace(this.langfile.bpActions.clear, {username: data.username}), 70);
                this.plugged.setLock(true, true);
                story.info('clear', this.utils.userLogString(data.username, data.id));
            }
        });
        this.plugged.removeChatMessage(data.cid);
    }
}

module.exports = ClearCommand;