let redis = require('../db/redis_db');
const config = require('../load_config');
let utils = require('../utils');
let plugged = require('../client');
let addqueue = require('../addqueue');
const langfile = require('../../langfile');

module.exports = {
    names: ['dc', 'disconnected'],
    enabled: true,
    handler: (data)=> {
        if (config.dcmoveback.enabled) {
            redis.get(`user:disconnect:${data.id}`).then(pos => {
                if (pos !== null) {
                    pos = parseInt(pos);
                    if (pos !== -1 && pos > utils.wlPosition(data.id)) {
                        if ((plugged.getWaitlist() === undefined || plugged.getWaitlist().length < 50)) {
                            plugged.sendChat(utils.replace(langfile.dcmoveback.command.move, {
                                username: data.username,
                                pos: (pos + 1).toString()
                            }));
                            if (utils.wlPosition(data.id) === -1) plugged.addToWaitlist(data.id);
                            plugged.moveDJ(data.id, pos);
                            //noinspection JSUnresolvedFunction
                            redis.del(`user:disconnect:${data.id}`);
                        } else {
                            addqueue.add(data.id, pos).then(() => {
                                plugged.sendChat(utils.replace(langfile.dcmoveback.command.addqueue, {
                                    username: data.username,
                                    pos: (pos + 1).toString()
                                }));
                                //noinspection JSUnresolvedFunction
                                redis.del(`user:disconnect:${data.id}`);
                            });
                        }
                    } else {
                        //noinspection JSUnresolvedFunction
                        redis.del(`user:disconnect:${data.id}`);
                        plugged.sendChat(utils.replace(langfile.dcmoveback.command.on_wl, {username: data.username}));
                    }
                } else {
                    plugged.sendChat(utils.replace(langfile.dcmoveback.command.no_dc, {username: data.username}));
                }
            });
        }
        plugged.deleteMessage(data.cid);
    }
};