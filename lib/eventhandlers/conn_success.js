let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.CONN_SUCCESS,
    handler:  ()=> {
        story.debug('Connection', 'Connection established');
    }
};