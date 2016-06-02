var story = require('storyboard').mainStory;

var plugged = require('../client');
var redis = require('../db/redis_db');
var config = require('../../config');
var utils = require('../utils');
var langfile = require('../../langfile');
var db = require("../db/sql_db.js");

//todo use hash
module.exports = {
    names: ['reloadcustomcommands', 'reloadcc'],
    handler: function (data) {
        redis.hget('user:roles',data.id).then(function (perm) {
            perm = parseInt(perm, 10);
            if (config.options.bouncer_plus ? (perm > 1) : (perm > 2)) {
                redis.keys('customcommands:command:*').then(function (keys) {
                    keys.forEach(function (key) {
                        redis.del(key);
                    });
                    setTimeout(function () {
                        //noinspection JSUnresolvedFunction
                        db.models.CustomCommand.findAll({where: {status: true}}).then(function (ccs) {
                            ccs.forEach(function (cc) {
                                if (cc.senderinfo) redis.set('customcommands:command:senderinfo:' + cc.trigger, cc.message);
                                else redis.set('customcommands:command:nosenderinfo:' + cc.trigger, cc.message);
                            });
                            story.info('Loaded ' + ccs.length + ' customcommands.');
                            plugged.sendChat(utils.replace(langfile.customcommand.reload, {
                                username: data.username,
                                count: ccs.length
                            }));
                        });
                    }, 300);
                });
            }
        });
        plugged.removeChatMessage(data.cid);
    }
};