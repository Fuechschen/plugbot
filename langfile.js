module.exports = {
    moment_locale: 'en',
    blacklist: {
        default: '[&{username}: Blacklist]',
        with_reason: '@&{username}, your song "&{song}" was blacklisted by &{mod}: &{reason}',
        without_reason: '@&{username}, your song "&{song}" was blacklisted by &{mod}.',
        skip_reason: '@&{username}, your song "&{song}" is blacklisted: &{reason}',
        skip: '@&{username}, your song "&{song}" is blacklisted',
        reload: '[&{username}: Reloaded Blacklist with &{count} items]',
        reasons: {
            u: 'Song unavailable.',
            n: 'Song nsfw.'
        }
    },
    history: {
        skip: '@&{username}, your song "&{song}"'
    },
    skip: {
        default: '[&{username}: Skip]',
        lockskip: '[&{username}: Lockskip]',
        reasons: {
            u: '@&{username}, your song "&{song}" was unvailable.',
            h: '@&{username}, your song "&{song}" is in the history.',
            n: '@&{username}, your song "&{song}" is nsfw.'
        },
        stuck: {
            default: 'This song seems to stuck. Skipping...'
        },
        history: {
            default: '@&{username}, your song "&{song}" was played &{time} and will be skippped now.',
            enabled: '[&{username}: Historyskip enabled]',
            disabled: '[&{username}: Historyskip disabled]',
            clear: '[&{username}: History cleared]'
        },
        vote: {
            default: '@&{username}, your song "&{song}" recieved to many mehs.',
            enabled: '[&{username}: Voteskip enabled]',
            disabled: '[&{username}: Voteskip disabled]'
        },
        timeguard: {
            skip: '[Timeguard]',
            default: '@&{username}, your song "&{song}" is over the maximum of &{time} seconds.',
            enabled: '[&{username}: Timeguard enabled]',
            disabled: '[&{username}: Timeguard disabled]'
        }
    },
    error: {
        user_not_found: 'User wasn\'t found!',
        argument: '[&{username}: &{cmd}] Error on arguments, please check command syntax.',
        eventmode: '[&{username}: &{cmd}] This command isn\'t available in eventmode.'
    },
    bouncer_plus: {
        enabled: '[&{username}: Bouncer+ enabled]',
        disabled: '[&{username}: Bouncer+ disabled]'
    },
    bp_actions: {
        add: '[&{username}: Add]',
        remove: '[&{username}: Remove]',
        lock: '[&{username}: Lock]',
        unlock: '[&{username}: Unlock]',
        clear: '[&{username}: Clear]',
        cycle: '[&{username}: Cycle]'
    },
    delchat: {
        clear: '[&{username}: Deleted &{count} messages]',
        user: '[&{mod} cleared &{username}\'s chat]'
    },
    kick: {
        default: '[&{mod}: Kicked &{username}]',
        error: '[&{mod}: Kick] You can\'t kick that user.'
    },
    ban: {
        default: '[&{mod}: Banned &{username}]',
        no_staff_ban: '@&{username}, please let our staff decide, who should be permanently banned. (Duration changed to 1 day)',
        staff_ban: '@&{username}, you are not allowed to ban staff memebers. Remove them from the staff list before baning.'
    },
    setstaff: {
        default: '[&{mod}: Set &{username} as &{role}]',
        no_power: '@&{username}, you are not allowed to set staff here.',
        roles: {
            user: 'user',
            rdj: 'resident dj',
            bouncer: 'bouncer',
            manager: 'manager',
            cohost: 'co-host',
            host: 'host',
            undef: 'undefined'
        }
    },
    ping: {
        default: 'Pong!'
    },
    link: {
        default: '[&{username}: Link] &{link}',
        no_media: '[&{username}: Link] For what should i give you a link? There\'s nothing playing...',
        error: '[&{username}: Link] Error while resolving link...'
    },
    chatfilter: {
        spam: {
            warn: '@&{username}, please stop spamming!',
            mute: '@&{username} was muted for spamming.',
            hard_mute: '@&{username} refused to stop spamming, now hard muting him...'
        }
    },
    unmute: {
        default: '[&{mod}: Unmuted &{username}]',
        not_muted: '[&{mod}: Unmute] &{username} isn\'t muted.'
    },
    mute: {
        default: '[&{mod}: Muted &{username}]',
        already_muted: '[&{mod}: Unmute] &{username} is already muted.'
    },
    lockdown : {
        enabled: '[&{username}: Lockdown enabled]',
        disabled: '[&{username}: Lockdown disabled]'
    },
    roomedit: {
        welcomemsg: '[&{username}: Updated welcome message]',
        roomname: '[&{username}: Updated roomname]'
    },
    cleverbot: {
        enabled: '[&{username}: Cleverbot enabled]',
        disabled: '[&{username}: Clever disabled]',
        format: '&{username} &{message}'
    },
    welcome: {
        new: 'Welcome @&{username}. I see this is your fist time joining the room. Remember to obey the rules and have fun!',
        old: 'Welcome back @&{username}.'
    },
    tksip: {
        default: '[TSkip] This song will be automatically skipped after &{time} seconds.',
        skip: '[TSkip]',
        set: '[&{username}: TSkip] Time set to &{time} seconds.',
        clear: '[&{username}: TSkip] Time cleared.',
        cancel: '[&{username}: TSkip] Skip canceld.'
    },
    move: {
        default: '[&{username}: Move]'
    },
    superuser: {
        add: '[&{mod}: SuperUser] Set &{username} as Super-User.',
        remove :'[&{mod}: SuperUser] Removed &{username} as Super-User.'
    },
    eventmode: {
        enabled: '[&{username}: Eventmode enabled]',
        disabled: '[&{username}: Eventmode disabled]'
    },
    countryblocks: {
        skip: '[CountryBlock]',
        default: '@&{username}, your song "&{song}" was automatically blacklisted bacause it\'s blocked in the following countries: "&{countries}"',
        bl_reason: 'Blocked in the following countries: &{countries}'
    }
};