module.exports = {
    momentLocale: 'en',
    blacklist: {
        default: '/me [&{username}: Blacklist]',
        withReason: '@&{username}, your song "&{song}" was blacklisted by &{mod}: &{reason}',
        withoutReason: '@&{username}, your song "&{song}" was blacklisted by &{mod}.',
        skipReason: '@&{username}, your song "&{song}" is blacklisted: &{reason}',
        skip: '@&{username}, your song "&{song}" is blacklisted',
        skipFirst: '/me [Blacklist]',
        reload: '[&{username}: Reloaded Blacklist with &{count} items]',
        reasons: {
            u: 'Song unavailable.',
            n: 'Song nsfw.',
            t: 'Song doesn\'t fit the room theme.'
        },
        unbl: {
            default: '[&{username}: UnBl] Removed "&{song}" from the blacklist.'
        },
        idbl: {
            default: '/me [&{username}: Blacklist] Added "&{song}" to the blacklist.'
        },
        channelblacklist: {
            enabled: '[&{username}: ChannelBlacklist enabled]',
            disabled: '[&{username}: ChannelBlacklist disabled]',
            skip: '@&{username}, your song "&{song}" was skipped because the uploaders channel is blacklisted in this room.',
            skipReason: '@&{username}, your song "&{song}" was skipped because the uploaders channel is blacklisted in this room: &{reason}',
            add: '[&{username}: ChannelBlacklist] Added "&{cid}" to the channelblacklist.',
            remove: '[&{username}: ChannelBlacklist] Removed "&{cid}" from the channelblacklist.'
        }
    },
    skip: {
        default: '/me [&{username}: Skip]',
        lockskip: '/me [&{username}: Lockskip]',
        lockskippos: '[&{username}: Set Lockskip-Position to &{pos}]',
        cycleskip: '/me [&{username}: CycleSkip]',
        reasons: {
            u: '@&{username}, your song "&{song}" was unvailable.',
            h: '@&{username}, your song "&{song}" is in the history.',
            n: '@&{username}, your song "&{song}" is nsfw.'
        },
        stuck: {
            default: 'This song seems to stuck. Skipping...'
        },
        history: {
            skip: '/me [History]',
            default: '@&{username}, your song "&{song}" was played &{time} and will be skippped now.',
            enabled: '[&{username}: Historyskip enabled]',
            disabled: '[&{username}: Historyskip disabled]',
            clear: '[&{username}: History cleared]',
            remove: '[&{username}: RemoveHistory]'
        },
        vote: {
            skip: '/me [Voteskip]',
            default: '@&{username}, your song "&{song}" recieved to many mehs.',
            enabled: '[&{username}: Voteskip enabled]',
            disabled: '[&{username}: Voteskip disabled]'
        },
        timeguard: {
            skip: '/me [Timeguard]',
            default: '@&{username}, your song "&{song}" is over the maximum of &{time} seconds.',
            enabled: '[&{username}: Timeguard enabled]',
            disabled: '[&{username}: Timeguard disabled]'
        },
        noModSkip: '@&{username} but why?'
    },
    error: {
        userNotFound: 'User wasn\'t found!',
        argument: '[&{username}: &{cmd}] Error on arguments, please check command syntax.',
        eventmode: '[&{username}: &{cmd}] This command isn\'t available in eventmode.',
        wlBanned: '[&{username}: &{cmd}] Cannot execute the command since the user isn\t allowed to join the waitlist'
    },
    bouncerPlus: {
        enabled: '[&{username}: Bouncer+ enabled]',
        disabled: '[&{username}: Bouncer+ disabled]'
    },
    bpActions: {
        add: '/me [&{username}: Add]',
        addQueue: '/me [&{mod}: Add] &{username} has been added to the AddQueue',
        remove: '/me [&{username}: Remove]',
        lock: '/me [&{username}: Lock]',
        unlock: '/me [&{username}: Unlock]',
        clear: '/me [&{username}: Clear]',
        cycle: '/me [&{username}: Cycle]'
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
        default: '[&{mod}: Banned &{username}&{duration}]',
        noStaffBan: '@&{username}, please let our staff decide, who should be permanently banned. (Duration changed to 1 day)',
        staffBan: '@&{username}, you are not allowed to ban staff members. Remove them from the staff list before baning.',
        duration: {
            h: ' for one hour',
            d: ' for one day',
            f: ' permanently'
        }
    },
    setstaff: {
        default: '[&{mod}: Set &{username} as &{role}]',
        noPower: '@&{username}, you are not allowed to set staff here.',
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
        default: '[&{username}: Ping] Pong!',
        pong: '[&{username}: Pong] Ping!'
    },
    link: {
        default: '[&{username}: Link] &{link}',
        noMedia: '[&{username}: Link] For what should i give you a link? There\'s nothing playing...',
        error: '[&{username}: Link] Error while resolving link...'
    },
    chatfilter: {
        enabled: '[&{username}: Chatfilter enabled]',
        disabled: '[&{username}: Chatfilter disabled]',
        spam: {
            warn: '@&{username}, please stop spamming!',
            mute: '@&{username} was muted for spamming.',
            hardMute: '@&{username} refused to stop spamming, now hard muting him...'
        },
        repeat: {
            warn: '@&{username}, please don\'t repeat yourself.',
            mute: '@&{username} was muted for repeating himself over and over.'
        },
        bannedword: {
            warn: '@&{username}, you used a word which is on our blacklist.',
            mute: '@&{username} was muted for using blacklisted words.'
        },
        language: {
            warn: '@&{username}, please have look at our rules. You are speaking the wrong language!'
        },
        link: {
            warn: '@&{username}, please stop sending these links.',
            mute: '@&{username} didn\'t stop to send links, now he can\'t...'
        }
    },
    unmute: {
        default: '[&{mod}: Unmuted &{username}]',
        notMuted: '[&{mod}: Unmute] &{username} isn\'t muted.'
    },
    mute: {
        default: '[&{mod}: Muted &{username}]',
        alreadyMuted: '[&{mod}: Unmute] &{username} is already muted.'
    },
    lockdown: {
        enabled: '[&{username}: Lockdown enabled]',
        disabled: '[&{username}: Lockdown disabled]'
    },
    roomedit: {
        welcomemsg: '[&{username}: Updated welcome message]',
        roomname: '[&{username}: Updated roomname]'
    },
    cleverbot: {
        enabled: '[&{username}: Cleverbot enabled]',
        disabled: '[&{username}: Cleverbot disabled]',
        format: '@&{username} &{message}'
    },
    welcome: {
        new: 'Welcome @&{username}. I see this is your fist time joining the room. Remember to obey the rules and have fun!',
        old: 'Welcome back @&{username}.'
    },
    tksip: {
        default: '[TSkip] This song will be automatically skipped after &{time} seconds.',
        skip: '/me [TSkip]',
        set: '[&{username}: TSkip] Time set to &{time} seconds.',
        clear: '[&{username}: TSkip] Time cleared.',
        cancel: '[&{username}: TSkip] Skip canceld.'
    },
    move: {
        default: '/me [&{username}: Move]',
        addQueue: '[&{mod}: Move] &{username} will be added to position &{pos} as soon as a spot is available.'
    },
    superuser: {
        add: '[&{mod}: SuperUser] Set &{username} as Super-User.',
        remove: '[&{mod}: SuperUser] Removed &{username} as Super-User.'
    },
    eventmode: {
        enabled: '[&{username}: Eventmode enabled]',
        disabled: '[&{username}: Eventmode disabled]',
        clear: '[&{username}: Eventmode] We\'re now going into eventmode. Waitlist will be locked and cleared! You will not be able to get your spot back @djs.',
        lock: '[&{username}: Eventmode] We\'re now switching to eventmode. Waitlist will be locked! @djs'
    },
    youtubeGuard: {
        skip: '/me [YouTubeGuard]',
        apiUnreachable: '@staff, I couldn\'t reach YouTube to check the avability of the current song. Please check.',
        block: '@&{username}, YouTube is currently blocked in this room.',
        blockEnabled: '[&{username}: YouTubeBlock enabled]',
        blockDisabled: '[&{username}: YouTubeBlock disabled]',
        blocked: {
            default: '@&{username}, your song "&{song}" was automatically added to the blacklist because it\'s blocked in the following countries: "&{countries}"',
            blReason: 'Blocked in the following countries: &{countries}'
        },
        deleted: {
            default: '@&{username}, your song "&{song}" was automatically added to the blacklist because it has been deleted.',
            blReason: 'Video was deleted.'
        },
        rejected: {
            default: '@&{username}, your song "&{song}" was automatically added to the blacklist because it has been rejected by YouTube with the following reason: &{reason}',
            blReason: 'Rejected by YouTube: &{reason}',
            reasons: {
                claim: 'The video was claimed.',
                copyright: 'The video contained content with copyright.',
                duplicate: 'The video was an duplicate of an other video',
                inappropriate: 'The video contains inappropoiate content.',
                length: 'The video is too long',
                termsOfUse: 'The Video violates the terms of use.',
                trademark: 'An trademark was used unallowed',
                uploaderAccountClosed: 'The Uploader\'s account has been closed',
                uploaderAccountSuspended: 'The Uploader\'s account has been suspendend'
            }
        },
        private: {
            default: '@&{username}, your song "&{song}" was automatically added to the blacklist because the publisher made it private. Contact a staffmemeber when you think it\'s available again to remove it from the blacklist.',
            blReason: 'Video is set to private.'
        },
        embeddable: {
            default: '@&{username}, your song "&{song}" was automatically added to the blacklist because it\'s set as not embeddable on plug.dj.',
            blReason: 'Video not embeddable'
        },
        ytUnavailable: {
            default: '@&{username}, YouTube seems to be unavailable. Your song "&{song}" has therefore be skipped.'
        },
        enabled: '[&{username}: YouTubeGuard enabled]',
        disabled: '[&{username}: YouTubeGuard disabled]'
    },
    soundcloudGuard: {
        skip: '/me [SoundCloudGuard]',
        apiUnreachable: '@staff, I couldn\'t reach SoundCloud to check the avability of the current song. Please check.',
        block: '@&{username}, SoundCloud is currently blocked in this room.',
        blockEnabled: '[&{username}: SoundCloudBlock enabled]',
        blockDisabled: '[&{username}: SoundCloudBlock disabled]',
        deleted: {
            default: '@&{username}, your song "&{song}" was automatically added to the blacklist because it has been deleted.',
            blReason: 'Song was deleted.'
        },
        private: {
            default: '@&{username}, your song "&{song}" was automatically added to the blacklist because it was set to private.',
            blReason: 'Song is private.'
        },
        enabled: '[&{username}: SoundCloudGuard enabled]',
        disabled: '[&{username}: SoundCloudGuard disabled]'
    },
    state: {
        default: '[&{username}: State]',
        format: '[&{key}] --> &{val}',
        keys: {
            eventmode: 'Eventmode',
            historyskip: 'Historyskip',
            voteskip: 'Voteskip',
            timeguard: 'Timeguard',
            chatfilter: 'Chatfilter',
            bouncerPlus: 'Bouncer+',
            cleverbot: 'Cleverbot',
            lockdown: 'Lockdown',
            lockskippos: 'LockSkipPos',
            dcmoveback: 'DCMoveback',
            titleguard: 'TitleGuard',
            joinmode: 'Joinmode'
        }
    },
    filterreset: {
        default: '[&{mod}: FilterReset] Reset spamscore for &{username}.'
    },
    afk: {
        warn1: '&{usernames} Looks like you are afk. Please chat within the next 4 minutes or you will be removed from the waitlist.',
        warn2: '&{usernames} You are still inactive. This is your last warning. Chat or you will be removed from the waitlist.',
        remove: '&{usernames} You will now be removed from the waitlist for being afk.',
        kick: '[Kicking @&{username} for autojoining the waitlist]',
        usernames: '@&{username} ',
        afkMsg: {
            default: '@&{username}, &{user} is AFK [&{msg}]',
            noMsg: '@&{username}, &{user} is AFK.'
        },
        enabled: '[&{username}: AFKRemoval enabled]',
        disabled: '[&{username}: AFKR disabled]'
    },
    reloadroles: {
        default: '[&{username}: ReloadRoles] Roles reloaded.'
    },
    dcmoveback: {
        default: '[DCMoveback]',
        enabled: '[&{username}: DCMoveback enabled]',
        disabled: '[&{username}: DCMoveback disabled]',
        move: 'You should be at position &{pos}.',
        addQueue: 'You should be at position &{pos} and will be added as soon there is a spot free.',
        command: {
            move: '[&{username}: DCMoveback] You should be at position &{pos}.',
            addQueue: '[&{username}: DCMoveback] You should be at position &{pos}. You will be added as soon as there is a free spot.',
            noDc: '[&{username}: DCMoveback] I haven\'t seen you disconnect.',
            onWl: '[&{username}: DCMoveback] You are already on a higher position than when you disconnected.'
        }
    },
    restart: {
        error: '[&{username}: Restart] Error while restarting...',
        default: '[&{username}: Restart]',
        backUp: '[Restart done]'
    },
    cleanwl: {
        default: '[&{username}: Clean Waitlist] @djs, the waitlist will now be cleared and rebuilt afterwards to remove ghost djs.'
    },
    wlban: {
        default: '[&{mod}: WLBan] @&{username}, you were banned from the waitlist. You will now be removed everytime you try to join.',
        remove: '@&{username}, you are banned from the waitlist and are therefore not allowed to join the waitlist.',
        unban: '[&{mod}: WLUnban] @&{username} was unbanned from the waitlist.'
    },
    define: {
        noDefinitionFound: "[&{username}: Define] No definition for &{word} found",
        default: "[&{username}: Define] [ &{word} ] &{definition}"
    },
    rdjskip: {
        default: '[&{username}: Skip] Vote added!',
        skip: '[&{username}: Skip] Our residents decided to skip the current dj.'
    },
    customcommand: {
        default: '[&{username}: .&{trigger}] &{msg}',
        nosenderinfo: '&{msg}',
        mentionAppend: '  [&{mentions}]',
        reload: '[&{username}: ReloadCC]',
        enabled: '[&{username}: CustomCommands enabled]',
        disabled: '[&{username}: CustomCommands disabled]',
        created: '[&{username}: CustomCommand "&{trigger}" created]',
        ccEnabled: '[&{username}: CustomCommand "&{trigger}" enabled]',
        ccDisabled: '[&{username}: CustomCommand "&{trigger}" disabled]',
        senderinfoEnabled: '[&{username}: Enabled senderinfo for CustomCommand "&{trigger}"]',
        senderinfoDisabled: '[&{username}: Enabled senderinfo for CustomCommand "&{trigger}"]'
    },
    chatlevel: {
        default: '/me [&{username}: Chatlevel]'
    },
    uptime: {
        default: '[&{username}: Uptime] Started &{time}'
    },
    songinfo: {
        default: '[&{username}: SongInfo] &{title} - ID: &{sid} - blacklisted: &{bl} - history: &{his}',
        blReason: '[&{reason}]'
    },
    catfact: {
        default: '[&{username}: CatFact] &{fact}'
    },
    next: {
        default: '[&{username}: Next] Next Media on List: &{title}'
    },
    shuffle: {
        default: '[&{username}: Shuffled playlist]'
    },
    lottery: {
        default: '[&{username}: Lottery] Lottery in &{time} minutes. Join the waitlist and be active in chat to have a chance to be moved to #1. @djs',
        oneMinute: '[&{username}: Lottery] Lottery in one minute! @djs',
        winner: '[&{mod}: Lottery] Our lucky winner is @&{username}.',
        noWinner: '[&{username}: Lottery] No winner could be selected. Get active you little shits @djs'
    },
    roulette: {
        default: '[&{username}: Roulette] A roulette was was started with &{moves} moves. Type !join to join. @djs',
        join: '[&{username}: Join] Type !leave if you regret it.',
        alreadyJoined: '[&{username}: Join] You can\'t join twice.',
        leave: '[&{username}: Leave]',
        notJoined: '[&{username}: Leave] You haven\'t joined any roulette.',
        noRoulette: '[&{username}: Join] There is nothing to join.',
        reloadCommands: '[&{username}: Roulette] Nobody wants to play roulette? Okay...',
        started: '[&{username}: Roulette] Starting roulette with &{users} users...',
        luckyWinners: 'And our lucky winners are....',
        winner: '&{username}'
    },
    everyone: {
        default: '[&{username}: @everyone ] &{msg}'
    },
    titleguard: {
        enabled: '[&{username}: TitleGuard enabled]',
        disabled: '[&{username}: TitleGuard disabled]',
        skip: '[TitleGuard]',
        contained: '@&{username}, your song "&{song}" was automatically added to the blacklist because it\'s title contained a blacklisted phrase.',
        blReason: 'Title contains blacklisted phrase.'
    },
    addQueue: {
        default: '[Adding &{username} to waitlist since he is in the AddQueue]'
    },
    commands: {
        reloadCommands: '[&{username}: Reloaded Commands]'
    },
    joinmode: {
        addQueue: '[&{username}: Play] You are now in the queue and will be added when a spot is free.',
        wlban: '[&{username}: Play] You are not allowed to join the waitlist.',
        enabled: '[&{username}: Joinmode enabled]',
        disabled: '[&{username}: Joinmode disabled]'
    },
    tskip: {
        default: '[TSKIP] This song will be skipped after &{time} seconds.',
        skip: '[TSKIP]'
    },
    swap: {
        default: '[&{username}: Swaping &{u1} with &{u2}]',
        noWl: '[&{username}: Swap] None of the specified users are in the waitlist.',
        usage: '[&{username}: Swap] !swap @user1 @user2'
    },
    clearghosts: {
        default: '[&{username}: ClearGhosts] We will now be kicking all possible ghost-users out of the room to increase performance for the others. Be sure to have at least used the chat within the 50 hours @everyone'
    },
    userfilter: {
        enabled: '[&{username}: UserFilter enabled]',
        disabled: '[&{username}: UserFilter disabled]',
        username: {
            warn: '@&{username}, you name doesn\'t fit the room rules. Please change it or you will be banned within 60 seconds.',
            ban: '@&{username} was banned for using a name against the room rules.'
        }
    },
    staff:{
        default:'[&{username}: @staff ]'
    }
};