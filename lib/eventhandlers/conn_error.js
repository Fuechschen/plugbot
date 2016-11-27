let story = require('storyboard').mainStory;

let plugged = require('../client');

module.exports = {
    event: plugged.CONN_ERROR,
    handler:  (err)=> {
        story.error('Error', 'Error while connecting to plug.dj.', {attach: err});
        process.exit(1);
    }
};