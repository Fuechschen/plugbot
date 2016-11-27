let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.CONN_ERROR,
    handler:  (err) =>{
        story.error('Error', 'The connection dropped unexpectedly', {attach: err});
        process.exit(1);
    }
};