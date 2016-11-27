let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.SOCK_ERROR,
    handler:()=> {
        story.error('Socket', 'Socket errored. Restarting...');
        process.exit(1);
    }
};