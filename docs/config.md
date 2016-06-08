# Configuration


|Key|Type|Description|
|---|---|---|
|login|object|Credentianls to login to plug.dj|
|login.email|string|E-Mail-Address to login|
|login.password|string|Password to login|
|options|object|Some general settings for the bot|
|options.room|string|The room to join|
|options.bouncer_plus|boolean|Default setting for Bouncer+|
|options.loglevel|string|Sets the bot's loglevel. Defaults to INFO, use DEBUG to for extended output|
|options.dcmoveback|boolean|Default setting for DCMoveBack|
|options.command_prefix|string|Sets the commandprefix, defaults to !|
|options.disable_emote|boolean|Sets if the bot should automatically delete all /me-messages from non-staff|
|options.welcome|object|welcome settings|
|options.welcome.new|boolean|Sets if the bot should welcome new users|
|options.welcome.old|Sets if the bot should welcome old users|
|options.plugged|object|Some settings for plugged, the underlying module to connect to plug.dj|
|options.plugged.verbosity|number|Sets plugged verbosity, defaults to 1, set it higher to get more messages|
|redis|various|Settings to connect to redis, pass a redis-url, or an object containing at least a host-value. To set port/db/password, just add these properties to the object|
|sequelize|object|Settings to connect to an SQL-database, refer to http://docs.sequelizejs.com/en/latest/docs/getting-started/#setting-up-a-connection for the properties|
|histoy|object|History settings|
|history.skipenabled|boolean|Sets default value for historyskip|
|histoy.time|number|Sets the time in minutes a song stays on the history|
|lockskip.move_pos|number|Sets the default position for lockskip|
|voteskip|object|Settings for voteskip|
|voteskip.enabled|boolean|Sets the default value for VoteSkip|
|voteskip.condition|various|Number for a fixed number of mehs, function to decide based on a custom function or object with min/max/ratio properties to decide when to skip a song based on votes|
|apiKeys|object|Contains some keys to access various apis|
|apiKeys.youtube|string|Contains an apiKey for the youTube data api|
|apiKeys.soundcloud|string|Contains an apiKey for soundcloud|
|apiKeys.wordnik|string|Contains an apiKey for wordnik|
|state|object|Contains some state-settings for the bot|
|state.eventmode|boolean|Sets the default value for eventmode|
|state.lockdown|boolean|Sets the default value for lockdown|
|cleverbot.enabled|boolean|Sets the default value for cleverbot|
|timeguard|object|Contains some settings for timeguard|
|timeguard.enabled|boolean|Sets the default value for timeguard|
|timeguard.time|number|Sets the maximum songlength before the timeguard skips|
|chatfilter|object|Settings for the chatfilter|
|chatfilter.enabled|boolean|The default value for chatfilter|
|chatfilter.spam|object|Settings for the aggresivity of the chatfilter, ONLY EDIT IF YOU KNOW WHAT YOU ARE DOING|
|chatfilter.links|object|Settings for blocking links|
|chatfilter.links.plugdj|boolean|Sets the blocker for plugdj-links|
|chatfilter.words.blacklist|array[string]|Sets blacklisted words|
|youtubeGuard|object|Settings for youtubeGuard|
|youtubeGuard.enabled|boolean|The default value for youtubeGuard|
|youtubeguard.countryblocks.countries|array[string]|Countries all songs have to be available in|
|soundcloudGuard.enabled|boolean|Sets the default value for soundcloudGuard|
|titleguard|object|settings for titleguard|
|titleguard.enabled|boolean|Sets the default value for titleguard|
|titleguard.not_contain|array[string]|Words titles are forbidden to contain|
|playlists.play|number|A playlist-id for the bot to play when in the waitlist|
|playlists.none|number|A playlist-id for the bot to activate when not in waitlist to avoid being acidentially added|
|afk|object|Settings for the afk-function|
|afk.enabled|boolean|Sets the default value for afk|
|afk.time|number|Sets the maximum afk time in seconds|
|afk.warn|number|Sets the time between warnings in seconds|
|afk.remove|number|Sets the tme after a warning before the user is removed from the waitlist|
|afk.kick|number|Sets the amount of removes before the user is kicked|
|pm2.pid|string|Sets the pm2-processid to rstart the bot|
|rdjskip|object|Settings for rdjskip|
|rdjskip.enabled|boolean|Sets the default value for rdjskip|
|rdjskip.max_staff_active|number|Sets the amount of active staff (bouncer and higher) before rdjskip is disabled|
|rdjskip.votes|number|Sets the mumber of required votes before a song is skipped|
|customcommands|object|Settings for customcommands|
|customcommands.enabled|boolean|Sets the default value for customcommands|
|customcommands.trigger|string|Sets the trigger (prefix) for customcommands. should be diffrent to the commandtrigger|
|web|object|Settings for the json-api|
|web.enabled|boolean|Sets the default value for web|
|web.port|number|Sets the port to listen on. Set it to null if you want to use the exported express app as middleware|
|web.cors|string|Sets the value for the 'access-control-allow-origin'-header|
|web.websocket|boolean|Enables a simple websocket-server to broadcast realtime-updates|
|web.useUWS|boolean|Enable this to use a more performant websocket-library which requires a c++-compiler on you machine. Disable it, if your bot throws an error at startup concerning uWebsocket|
|web.path|string|the path the api runs under|
|defaultCC|object|Contains multiple objects with default customcommands, see config.example.js for their properties|

