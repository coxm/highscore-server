# Highscore server
## Quick start
Install dependencies:

    npm install  # Or `yarn install`.

Create a `dbconf.js` or `dbconf.json` file configuring your database (see [the
knex documentation](http://knexjs.org/#Installation-client) for more info). For
example, if using postgres (the default) you might have:

    // dbconf.json
    {
        "client": "pg",
        "connection": {
            "user": "highscore",
            "password": "sethighscores",
            "database": "highscores"
        },
        "pool": {
            "min": 2,
            "max": 10
        },
        "migrations": {
            "tableName": "knex_migrations"
        }
    }

Depending on your database client, you may also need to create a database and
database user; configure permissions; download additional node modules; etc.

Then migrate your database:

    knex migrate:latest --env=production

Finally, start the server:

    // Listen on localhost:8080; perfect for development.
    node index.js

    // Listen on a custom port.
    PORT=8081 node index.js

    // Set a custom hostname too.
    PORT=8081 HOST=awesome-highscore-server.com node index.js
