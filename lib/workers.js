module.exports = {
    spampoints: setInterval(function () {
        redis.keys('user:chat:spam:*:points').then(function (keys) {
            keys.forEach(function (key) {
                redis.get(key).then(function (k) {
                    k = parseInt(k, 10);
                    redis.set(key, (k >= 30 ? k - 30 : 0));
                });
            });
        });
    }, 60 * 1000),
    warnpoints: setInterval(function () {
        redis.keys('user:chat:spam:*:warns').then(function (keys) {
            keys.forEach(function (key) {
                redis.get(key).then(function (k) {
                    k = parseInt(k, 10);
                    redis.set(key, (k > 1 ? k - 1 : 0));
                });
            });
        });
    }, 900 * 1000),
    afk: setInterval(function () {
        if(config.afk.enabled){
            var afks = [];
            var wl = utils.clone(plugged.getWaitlist());
            check(0);

            function check (index) {
                redis.exists('user:afk:' + wl[index]).then(function (ex) {
                    if (ex === 0 && wl[index] !== plugged.getSelf().id) afks.push(wl[index]);
                    if (wl.length > index + 1) check(index + 1);
                    else utils.afk.warn_1(afks);
                });
            }
        }
    }, _.random(120, 600) * 1000),
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