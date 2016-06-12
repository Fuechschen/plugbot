var _ = require('underscore');

var redis = require('./db/redis_db');
var config = require('./load_config');
var plugged = require('./client');
var utils = require('./utils');

module.exports = {
    staffactive: setInterval(function(){
        var active = 0;
        var stafflist = plugged.getStaffOnline();
        function checkstaff(index){
            if(stafflist[index].role > 1){
                redis.get('user:afk:' + stafflist[index].id).then(function(ex){
                   if(ex === 1){
                       active = active + 1
                   }
                    if(stafflist[index + 1] !== undefined) checkstaff(index + 1);
                    else setvar();
                });
            } else if(stafflist[index + 1] !== undefined) checkstaff(index + 1);
            else setvar();
        }

        function setvar(){
            redis.set('meta:data:staff:active', active);
        }
    }, 180 * 1000)
};