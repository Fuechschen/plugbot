let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.PLUG_MESSAGE,
    handler:  (msg) =>{
        story.info('plug', msg);
    }
};