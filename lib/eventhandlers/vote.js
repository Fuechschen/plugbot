var _ = require('underscore');
var story = require('storyboard').mainStory;
var S = require('string');
var request = require('request');

var redis = require('../db/redis_db');
var db = require('../db/sql_db');
var utils = require('../utils');
var plugged = require('../client');
var config = require('../load_config');
var langfile = require('../../langfile');

module.exports = function () {
    var score = {woots: 0, mehs: 0, userCount: plugged.getUsers().length};
    plugged.getVotes(false).forEach(function (vote) {
        if (vote.direction === 1) score.woots = score.woots + 1;
        else if (vote.direction === -1) score.mehs = score.mehs - 1;
    });
    if (utils.checkVoteSkip(score) && config.voteskip.enabled && !config.state.eventmode) {
        plugged.sendChat(langfile.skip.vote.skip);
        plugged.skipDJ(plugged.getCurrentDJ().id);
        setTimeout(function () {
            plugged.sendChat(utils.replace(langfile.skip.vote.default, {
                username: plugged.getCurrentDJ(),
                song: utils.mediatitle(plugged.getCurrentMedia())
            }), 60);
        }, 4 * 1000);
    }
};