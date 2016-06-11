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
        command_prefix: '!',
        disable_emote: true,
        joinmode: true,
        welcome: {
            new: true,
            old: true
        },
        plugged: {
            verbosity: 1
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
            storage: undefined
        }
    },
    history: {
        skipenabled: false,
        time: 120,
        lockskip: true
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
        soundcloud: '',
        wordnik: ''
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
        time: 600,
        lockskip: false
    },
    blacklist: {
        lockskip: true
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
        },
        language: {
            enabled: false,
            allowed: []
        }
    },
    youtubeGuard: {
        enabled: true,
        countryblocks: {
            countries: ['DE']
        },
        lockskip: true
    },
    soundcloudGuard: {
        enabled: true,
        lockskip: true
    },
    titleguard: {
        enabled: true,
        not_contain: ['big dick'],
        lockskip: false
    },
    playlists: {
        play: 0,
        none: 0
    },
    afk: {
        enabled: false,
        time: 3600,
        warn: 120,
        remove: 120,
        kick: 2
    },
    pm2: {
        pid: 'bot'
    },
    rdjskip: {
        enabled: true,
        max_staff_active: 2,
        votes: 3
    },
    customcommands: {
        enabled: true,
        trigger: '.'
    },
    web: {
        enabled: false,
        port: 3000,
        cors: '*',
        websocket: false,                                       
        useUWS: true,
        path: ''
    },
    defaultCC: {
        commands: {
            msg: 'You need my commands? https://git.io/vawDs',
            sender: true
        },
        bot: {
            msg: 'I\'m powered by Fuechschen\'s plugbot: https://git.io/vawDB',
            sender: true
        },
        license: {
            msg: 'My software is licensed under the MIT License: https://git.io/vawDl',
            sender: true
        },
        tskip:{
            msg: 'TSKIP automatically skips songs after a certain amount of time to avoid playing outros, etc.',
            sender:true
        }
    }
};