let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.CONN_WARNING,
    handler:  (c) =>{
        story.warn('Connection', `Connection is about to drop. Count: ${c}`);
    }
};