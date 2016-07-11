var Redis = require('ioredis');

var config = require('../load_config');

var redis;

if (config.options.redis_substitute) {
    var moment = require('moment');
    var Promise = require('bluebird');
    var _ = require('underscore');
    var Cron = require('cron').CronJob;
    var S = require('string');

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
        set: function (key, val, extype, expire) {
            return db.models.Redis_Key.upsert({
                key: key,
                type: 'string',
                data: val.toString(),
                expires: (expire !== undefined ? moment().add(expire, (extype === 'EX' ? 'seconds' : 'milliseconds')).toDate() : null)
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
        keys: function (pattern) {
            return db.models.Redis_Key.findAll({where: {key: {$like: S(pattern).replaceAll('*', '%').s}}}).then(function (rkeys) {
                return Promise.resolve(rkeys.map(function (rkey) {
                    return rkey.key;
                }));
            });
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
        },
        zadd: function (key, score, member) {
            return db.sequelize.transaction(function (t) {
                return db.models.Redis_Key.findOrCreate({
                    where: {key: key},
                    defaults: {key: key, type: 'sorted_set'}
                }, {transaction: t}).spread(function (rkey) {
                    if (rkey.type !== 'sorted_set')return Promise.reject('wrong key type');
                    else {
                        return db.models.Redis_Sorted_Set_Element.findOrCreate({
                            where: {data: member.toString()},
                            defaults: {data: member.toString(), weigth: score}
                        }).spread(function (e, c) {
                            if (!c) return e.update({weigth: score});
                            else {
                                return e.setRedis_Key(rkey);
                            }
                        });
                    }
                })
            });
        },
        zrem: function (key, member) {
            return db.sequelize.transaction(function (t) {
                return db.models.Redis_Key.find({where: {key: key, type: 'sorted_set'}}).then(function (rkey) {
                    if (rkey !== null && rkey !== undefined) {
                        return rkey.getSorted_Set_Elements({where: {data: memeer.toString()}}).spread(function (e) {
                            return e.destroy();
                        });
                    } else return Promise.resolve(0);
                })
            });
        },
        zrange: function (key, start, stop, withscores) {
            return db.models.Redis_Key.find({where: {key: key, type: 'sorted_set'}}).then(function (rkey) {
                if (rkey !== null && rkey !== undefined) {
                    return rkey.getSorted_Set_Elements().then(function (ele) {
                        var ret = [];
                        ele.forEach(function (e) {
                            ret.push(e.data);
                            if (withscores === 'WITHSCORES')ret.push(e.weigth);
                        });
                        return Promise.resolve(ret);
                    });
                } else Promise.resolve([]);
            });
        }
    }
}
else redis = new Redis(config.redis);

module.exports = redis;