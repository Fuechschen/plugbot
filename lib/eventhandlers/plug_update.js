let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.PLUG_UPDATE,
    handler:() =>{
        story.error('Update', 'plug.dj gets an update was therefore closed.');
        process.exit(1);
    }
};