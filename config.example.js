module.exports = {
    login: {
        email: '',
        password: ''
    },
    options: {
        room: '',
        bouncer_plus: true,
        loglevel: 'INFO',
        dcmoveback: true,
        welcome: {
            new: true,
            old: true
        }
    },
    redis: {
        host: '',
        db: 2
    },
    sequelize: {
        database: '',
        username: '',
        password: '',
        options: {
            dialect: 'mariadb',
            host: '',
            port: 3306,
            storage: undefined,
            logging: utils.dblog
        }

    },
    history: {
        skipenabled: false,
        time: 120
    },
    lockskip: {
        move_pos: 1
    },
    voteskip: {
        enabled: true,
        condition: {
            min: 3,
            max: 10,
            ratio: 0.5
        }
    },
    apiKeys: {
        youtube: '',
        soundcloud: ''
    },
    state: {
        eventmode: false,
        lockdown: false
    },
    cleverbot: {
        enabled: true
    },
    timeguard: {
        enabled: true,
        time: 600
    },
    chatfilter: {
        enabled: true,
        spam: {
            points: 30,
            warns: 2,
            mute_violation: 4,
            mute_duration: 4000
        },
        links: {
            plugdj: true
        },
        words: {
            blacklist: []
        }
    },
    youtubeGuard: {
        enabled: true,
        countryblocks: {
            countries: ['DE']
        }
    },
    playlists: {
        play: 0,
        none: 0
    },
    afk: {
        time: 3600,
        warn: 120,
        remove: 120,
        kick: 2
    },
    pm2: {
        pid: 'bot'
    }
};