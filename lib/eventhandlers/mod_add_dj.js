let story = require('storyboard').mainStory;

let utils = require('../utils');
let plugged = require('../client');

module.exports = {
    event: plugged.MOD_ADD_DJ,
    handler: (data)=> {
        if (data.mi !== plugged.getSelf.id) {
            story.info('add', `${utils.userLogString(data.m, data.mi)} added ${utils.userLogString(data.username, data.id)}`);
        }
    }
};