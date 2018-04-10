# Highscore server
A RESTful high score server with API keys. Implemented in JS with Express.


## Usage
To get and set scores, create a context in the database with a `name` and
`api_key`, say `"My compo"` and `my-compo-2018`. Then scores can be retrieved
by sending a GET request to `/scores?ctx=my-compo-2018`, and set by sending a
POST request to the same URL, with JSON data resembling the following object.

    {
        "player": "playername",
        "score": 99,
        "proof": "optional string providing proof of the score"
    }


## Filtering
This API supports a limited form of Django-style filtering. The suffixes
`lt`, `lte`, `gt`, `gte`, `eq`, `neq` (corresponding to relations `<`, `<=`,
`>`, `>=`, `==` and `!=`) are supported; all can be used for filtering score
values, and `eq`/`neq` can be used to compare player names.

    GET /scores?ctx=my-api-key&score__gte=100
    GET /scores?ctx=my-api-key&player__eq=sonic

Filters can also be combined:

    GET /scores?ctx=my-api-key&player__eq=sonic&score__gte=100&score__lt=200


## Getting started
Install dependencies:

    npm install  # Or `yarn install`.

Create a `server/dbconf.js` or `server/dbconf.json` file configuring your
database (see [the knex documentation](http://knexjs.org/#Installation-client)
for more info). For example, if using postgres (the default) you might have:

    // server/dbconf.json
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
