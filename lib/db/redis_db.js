var Redis = require('ioredis');

var config = require('../load_config');

var redis;

if (config.options.redis_substitute) {
    var moment = require('moment');
    var Promise = require('bluebird');
    var _ = require('underscore');
    var Cron = require('cron').CronJob;

    var db = require('./sql_db');

    var cron = new Cron('', function () {
        db.models.Redis_Key.findAll({
            where: {
                expires: {$ne: null},
                $and: {expires: {$lt: new Date()}}
            }
        }).then(function (elements) {
            return Promise.all(elements.map(function (element) {
                return element.destroy();
            }));
        });
    }, null, true);

    redis = {
        set: function (key, val, expire) {
            return db.models.Redis_Key.upsert({
                key: key,
                type: 'string',
                data: val.toString(),
                expires: (expire !== undefined ? moment().add(expire, 'seconds').toDate() : null)
            });
        },
        get: function (key) {
            return db.models.Redis_Key.find({
                where: {
                    key: key,
                    type: 'string',
                    $or: [{expires: null}, {expires: {$gt: new Date()}}]
                }
            }).then(function (value) {
                if (value !== undefined && value !== null)return Promise.resolve(value.data);
                else return Promise.resolve(null);
            });
        },
        exists: function (key) {
            return Promise.all(arguments.map(function (key) {
                return db.models.Redis_Key.find({
                    where: {
                        key: key,
                        $or: [{expires: null}, {expires: {$gt: new Date()}}]
                    }
                }).then(function (rkey) {
                    if (rkey !== undefined && rkey !== null)return Promise.resolve(true);
                    else return Promise.resolve(false);
                });
            })).then(function (bool) {
                return Promise.resolve(_.without(bool, false).length);
            });
        },
        del: function (key) {
            //todo return deleted rows count
            arguments.forEach(function (key) {
                db.models.Redis_Key.destroy({where: {key: key}});
            });
            return Promise.resolve();
        },
        incr: function (key) {
            return db.models.Redis_Key.find({
                where: {
                    key: key,
                    type: 'string',
                    $or: [{expires: null}, {expires: {$gt: new Date()}}]
                }
            }).then(function (value) {
                if (value !== undefined && value !== null) {
                    return db.sequelize.transaction(function (t) {
                        return value.update({data: (parseInt(value.data) + 1).toString()}, {transaction: t}).then(function (value) {
                            return Promise.resolve(value.data);
                        });
                    });
                }
                else return Promise.reject(new Error('no int'));
            });
        },
        incrby: function (key, increment) {
            return db.models.Redis_Key.find({
                where: {
                    key: key,
                    type: 'string',
                    $or: [{expires: null}, {expires: {$gt: new Date()}}]
                }
            }).then(function (value) {
                if (value !== undefined && value !== null) {
                    return db.sequelize.transaction(function (t) {
                        return value.update({data: (parseInt(value.data) + increment).toString()}, {transaction: t}).then(function (value) {
                            return Promise.resolve(value.data);
                        });
                    });
                }
                else return Promise.reject(new Error('no int'));
            });
        },
        expire: function (key, time) {
            return db.models.Redis_Key.update({expires: moment().add(time, 'seconds').toDate()}, {where: {key: key}});
        },
        ttl: function (key) {
            return db.models.Redis_Key.find({
                where: {
                    key: key,
                    $or: [{expires: null}, {expires: {$gt: new Date()}}]
                }
            }).then(function (rkey) {
                if (rkey !== null && rkey !== undefined) {
                    if (rkey.expires !== null) {
                        return Promise.resolve(moment(rkey.expires).diff(moment(), 'seconds'));
                    } else return Promise.resolve(-1);
                } else return Promise.resolve(-2);
            })
        },
        hset: function (key, hashkey, value) {
            return db.sequelize.transaction(function (t) {
                return db.models.Redis_Key.find({
                    where: {
                        key: key,
                        type: 'hash',
                        $or: [{expires: null}, {expires: {$gt: new Date()}}]
                    }
                }, {transaction: t}).then(function (key) {
                    if (key !== null && key !== undefined)return Promise.resolve(key);
                    else return db.models.Redis_Key.create({key: key, type: 'hash'}, {transaction: t});
                }).then(function (key) {
                    return key.getHash_Elements({where: {key: hashkey}}, {transaction: t}).spread(function (helement) {
                        if (helement !== null && helement !== undefined)return helement.update({data: value.toString()}, {transaction: t});
                        else return db.models.Redis_Hash_Element.create({
                            key: hashkey,
                            data: value
                        }, {transaction: t}).then(function (helement) {
                            return helement.setRedis_Key(key, {transaction: t});
                        })
                    });
                });
            });
        },
        hget: function (key, hashkey) {
            return db.models.Redis_Key.find({
                where: {
                    key: key,
                    type: 'hash',
                    $or: [{expires: null}, {expires: {$gt: new Date()}}]
                }
            }).then(function (rkey) {
                if (rkey !== null && rkey !== undefined)return rkey.getHash_Elements({where: {key: hashkey}}).spread(function (value) {
                    if (value !== null && value !== undefined)return Promise.resolve(value.data);
                    else return Promise.resolve(null);
                });
                else return Promise.resolve(null);
            });
        },
        hexists: function (key, hashkey) {
            return db.models.Redis_Key.find({
                where: {
                    key: key,
                    type: 'hash',
                    $or: [{expires: null}, {expires: {$gt: new Date()}}]
                }
            }).then(function (rkey) {
                if (rkey !== undefined && rkey !== null) return rkey.getHash_Elements({where: {key: hashkey}}).spread(function (helement) {
                    if (helement !== undefined && helement !== null)return Promise.resolve(1);
                    else return Promise.resolve(0);
                });
                else return Promise.resolve(0);
            });
        },
        hkeys: function (key) {
            return db.models.Redis_Key.find({
                where: {
                    key: key,
                    type: 'hash',
                    $or: [{expires: null}, {expires: {$gt: new Date()}}]
                }
            }).then(function (rkey) {
                if (rkey !== null && rkey !== undefined)returnrkey.getHash_Elemts().then(function (helements) {
                    return Promise.resolve(helements.map(function (helement) {
                        return helement.key;
                    }));
                });
                else return Promise.resolve([]);
            });
        },
        hgetall: function (key) {
            return db.models.Redis_Key.find({
                where: {
                    key: key,
                    type: 'hash',
                    $or: [{expires: null}, {expires: {$gt: new Date()}}]
                }
            }).then(function (rkey) {
                if (rkey !== null && rkey !== undefined) {
                    return rkey.getHash_Elements().then(function (helements) {
                        var ret = {};
                        helements.forEach(function (helement) {
                            ret[helement.key] = helement.data;
                        });
                        return Promise.resolve(ret);
                    });
                }
                else return Promise.resolve(null);
            });
        },
        hincrby: function (key, hashkey, increment) {
            increment = increment || 1;
            db.models.Redis_Key.find({
                where: {
                    key: key,
                    type: 'hash',
                    $or: [{expires: null}, {expires: {$gt: new Date()}}]
                }
            }).then(function (rkey) {
                if (rkey !== null && rkey !== undefined) {
                    return rkey.getHash_Elements({where: {key: hashkey}}).spread(function (helement) {
                        if (helement !== undefined && helement !== null) {
                            return helement.update({data: (parseInt(helement.data) + increment).toString()}).then(function (value) {
                                return Promise.resolve(value.data);
                            });
                        } else {
                            return db.sequelize.transaction(function (t) {
                                return db.models.Redis_Hash_Element.create({
                                    key: hashkey,
                                    data: (0 + increment).toString()
                                }, {transaction: t}).then(function (helement) {
                                    return helement.setRedis_Key(rkey, {transaction: t});
                                });
                            });
                        }
                    });
                } else {
                    //todo create hash
                }
            })
        }
    }
}
else redis = new Redis(config.redis);

module.exports = redis;