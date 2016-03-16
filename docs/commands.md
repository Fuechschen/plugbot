# Commands

## User Commands

|Command|Alias|Arguments|Description|
|---|---|---|---|
|!link| | |Gives a link to the current song|
|!define| |(word)|Defines the given word|
|!songinfo|!sinfo|[format:cid]|Gives information about the song|

## RDj Commands

|Command|Alias|Arguments|Description|
|---|---|---|---|
|!demote| | |Removes you as staff|
|!promote| | |Adds you back as staff|
|!ping| | |Pong!|
|!skip|!fs| |Votes for skip|
|!uptime| | |Displays uptime|

## Bouncer Commands

|Command|Alias|Arguments|Description|
|---|---|---|---|
|!skip|!fs|[reason]|Skips the current song and sends an optional reason.|
|!lockskip|!ls|[reason]|Skips the current songs, moves the dj back and sends an optional reason|
|!blacklist|!bl|[reason]|Skips the curent song, adds it to the blacklist and sends an optional reason|
|!idblacklist|!idbl|(format:cid)[reason]|Adds the given media to the blacklist with the given, optional reason|
|!cycleskip|!cs|[reason]|Disables the DJ-Cycle, skips the current song and sends an optional reason|
|!remove|!rm/!rem/!rmwl|(@user)|Removes the given user from the waitlist|
|!delchat| |[@user]|Deletes every chat message or removes messages from the given user|
|!kick| |(@user)|Kicks the given user|
|!mute| |(@user)|Mutes the given user|
|!joinwl| | |Let's the bot join the waitlist|
|!leavewl| | |Let's the bot leave the waitlist|
|!state| | |Gives the current settings|
|!wlban| |(@user)|Bans the given user from the waitlist|

## Bouncer+ Commands

These commands are only available for bouncers when bouncer+ is enabled.

|Command|Alias|Arguments|Description|
|---|---|---|---|
|!add|!addwl|(@user)|Adds the given user to the waitlist|
|!move|!mv|(@user)(position)|Moves the given user to the given position|
|!unblacklist|!unbl/!rmbl|(format:cid)|Removes the given song from the blacklist|
|!unmute| |(@user)|Unmutes the given user|
|!wlunban| |(@user)|Unbans the given user from the waitlist|
|!cleanwl| | |Clears and rebuilds the waitlist to remove ghost users|
|!lock| | |Locks the waitlist|
|!unlock| | |Unlocks the waitlist|
|!cycle| | |Toggles the DJ cycle|
|!clear|!clearwl| |Locks and clears the waitlist|
|!historyskip| | |Toggles historyskip|
|!voteskip| | |Toggles voteskip|
|!timeguard| | |Toggles timeguard|
|!cleverbot| | |Toggles cleverbot|
|!eventmode| | |Toggles eventmode|
|!lockdown| | |Toggles lockdown|
|!dcmoveback| | |Toggles DCMoveback|
|!chatfilter| | |Toggles chatfilter|
|!filterreset| |(@user)|Resets all chatfilterscores for the given user|
|!clearhistory| | |Clears the songhistory|
|!reloadblacklist|!reloadbl| |Reloads the blacklist from the database|
|!reloadroles| | |Reloads all roles from the database|
|!reloadcustomcommands|!reloadcc| |Reloads all CustomCommands from the database|
|!lockskippos|!lspos|(position)|Sets the position for lockskip|
|!chatlevel|!chatlvl/!clvl|(level)|Sets the room chat level to the given level|
|!youtubeguard|!ytguard| |Toggles YouTubeGuard|
|!soundcloudguard|!scguard| |Toggles SoundCloudGuard|
|!togglecustomcommands|!togglecc| |Toggles CustomCommands|
|!customcommands|!cc|WIP|WIP|
|!woot|!w| |Let's the bot woot|
|!meh|!m| |Let's the bot meh|

## Manager Commands

|Command|Alias|Arguments|Description|
|---|---|---|---|
|!setstaff| |(role)(@user)|Sets the given user tot he given role|
|!bouncer+| | |Toggles bouncer+|
|!welcomemsg| | |Sets the room welcome message|
|!roomname| | |Sets the roomname|
|!superuser|!su|(@user)|Sets the given user as superuser|
|!restart| | |Restarts the bot|


() = required argument
[] = optional argument