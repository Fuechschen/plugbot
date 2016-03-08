module.exports = {
    spampoints: setInterval(function(){
      redis.keys('user:chat:spam:*:points').then(function(keys){
          keys.forEach(function(key){
             redis.set(key, 0);
          });
      });
    }, 60 * 1000)
};