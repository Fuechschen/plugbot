let request = require('request');

let plugged = require('../client');
const config = require('../load_config');
let utils = require('../utils');
const langfile = require('../../langfile');

module.exports = {
    names: ['link'],
    enabled: true,
    handler: (data)=> {
        if (plugged.getMedia().id !== -1) {
            let m = utils.clone(plugged.getMedia());
            if (m.format === 1) plugged.sendChat(utils.replace(langfile.link.default, {
                username: data.username,
                link: `https://youtu.be/${m.cid}`
            }));
            else {
                request.get(`https://api.soundcloud.com/tracks/${m.cid}?client_id=${config.apiKeys.soundcloud}`, (err, resp, body) => {
                    if (!err && resp.statusCode === 200) {
                        let json = JSON.parse(body);
                        //noinspection JSUnresolvedletiable
                        plugged.sendChat(utils.replace(langfile.link.default, {
                            username: data.username,
                            link: json.permalink_url
                        }));
                    } else plugged.sendChat(utils.replace(langfile.link.error, {username: data.username}));
                });
            }
        } else plugged.sendChat(utils.replace(langfile.link.noMedia, {username: data.username}));
        plugged.removeChatMessage(data.cid);
    }
};