var S = require('string');
var _ = require('underscore');

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');

module.exports = {
    names:['unban'],
    enabled: true,
    handler: function (data) {
        //noinspection JSUnresolvedFunction
        redis.hget('user:roles',data.id).then(perm => {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                var username = S(_.rest(data.message.split(' '))).chompRight(' ').chompLeft('@').s;
                plugged.getBans((err,bans)=>{
                    if(err){
                        //todo
                    }else{
                        var ban = bans.filter(ban=>ban.username===username);
                        if(ban){
                            plugged.unbanUser(ban.id,(err)=>{
                                if(!err){
                                    //todo
                                }
                            })
                        }else{
                            //todo
                        }
                    }
                })
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};