var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');
var wsUpdate = require('../../web/index').wsGet('vote');

module.exports = {
    event: plugged.VOTE,
    handler: function (vote) {
        var score = {woots: 0, mehs: 0, userCount: plugged.getUsers().length};
        plugged.getVotes(false).forEach(vote => {
            if (vote.direction === 1) score.woots = score.woots + 1;
            else if (vote.direction === -1) score.mehs = score.mehs - 1;
        });
        if ((() => {
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
            })() && config.voteskip.enabled && !config.state.eventmode) {
            plugged.sendChat(langfile.skip.vote.skip);
            plugged.skipDJ(plugged.getCurrentDJ().id);
            setTimeout(() => {
                plugged.sendChat(utils.replace(langfile.skip.vote.default, {
                    username: plugged.getCurrentDJ(),
                    song: utils.mediatitle(plugged.getMedia())
                }), 60);
            }, 4 * 1000);
        }
        wsUpdate({s: score, v: {dir: vote.direction, u: {id: vote.id, n: plugged.getUserByID(vote.id).username}}});
    }
};