let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.PLUG_ERROR,
    handler: (err) =>{
        story.error('Error', 'plug.dj encountered an error.', {attach: err});
        process.exit(1);
    }
};