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
    }, 900 * 1000)
};