let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.KILL_SESSION,
    handler:  (err) =>{
        story.error('Error', 'Session was killed. Restarting...', {attach: err});
        process.exit(1);
    }
};