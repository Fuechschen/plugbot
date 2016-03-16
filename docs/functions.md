# Functions

## Chatfilter

Automatic filter to remove spam and unwanted links from the chat.

## Blacklisting

Ability to ban certain songs from playing in your community. Since the list is stored in Redis, it's pretty fast.

## Historyskip

Automatic skip of previous played songs.

## Voteskip

Automatic skip depending on room votes.

## Timeguard

Automatic skip ov songs over a certain length.

## DCMoveback

Disconnected users get moved back to their waitlist spot when they rejoin.

## YouTubeGuard

Automatic check of youtube videos for their avability.

## SoundCloudGuard

Like YouTubeGuard, but for SoundCloud

## Eventmode

Special mode to toggle historyskip, voteskip, timeguard and dcmoveback at once.

## Persistent settings

All settings are stored in redis, which makes them persistent even after restarts.