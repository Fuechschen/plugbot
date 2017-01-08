class Command {
    constructor(exports) {
        this.plugged = exports.client;
        this.db = exports.db;
        this.redis = exports.redis;
        this.config = exports.config;
        this.langfile = exports.langfile;
        this.utils = exports.utils;
        this.addQueue = exports.addQueue;
        this.afk = exports.afk;
    }

    //noinspection JSMethodCanBeStatic
    handle() {
        return null;
    }
}

module.exports = Command;