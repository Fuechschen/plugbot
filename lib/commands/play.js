var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['play'],
    enabled: true,
    handler: function (data) {
        if(config.options.joinmode){
            if((function () {
                    var waitlist = plugged.getWaitlist() || [];
                    var dj = plugged.getDJ() || {id: -1};
                    if (dj === user.id) return false;
                    else return waitlist.indexOf(user.id) === -1;
                }())){
                if(plugged.getWaitlist() === undefined||plugged.getWaitlist().length<50){
                    plugged.addToWaitlist(data.id);
                }else {
                    redis.zadd('meta:addqueue', 150, user.id).then(function () {
                        plugged.sendChat(utils.replace(langfile.joinmode.add_queue, {
                            username: user.username,
                            mod: data.username
                        }));
                    });
                }
            }
        }
        plugged.removeChatMessage(data.cid);
    }
};