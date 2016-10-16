# Plugbot

## Functions
see all functions here: [functions.md](/docs/functions.md)

## Installation
0. Be sure to have node 6.x.x or higher installed.
1. Run ```npm install```.
2. Copy config.example.js to config.js and insert your data (Redis, [SQL-Database](/docs/database.md), Roomname, [apiKeys](/docs/apikeys.md) and Login-Credentials are required.)
3. Start the bot ```npm start```

## PM2
To use features like ```!restart``` or autorestart, you have to use pm2.

1. Follow the install instructions to step 2.
2. Install pm2 with ```npm install -g pm2```
3. Start the with ```pm2 start bot.js --name bot```

If you want to use another processname, remember to specify it in your config.


License: [MIT](LICENSE.md)