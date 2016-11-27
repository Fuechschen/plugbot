let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.SOCK_CLOSED,
    handler:  () =>{
        story.info('Socket', 'Socket was closed. Restarting...');
        process.exit(1);
    }
};