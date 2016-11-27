let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.LOGIN_ERROR,
    handler:  (err)=> {
        story.error('Error', 'Error while logging in.', {attach: err});
        process.exit(1);
    }
};