#!/usr/bin/env node
// Environment variables.
const PORT = process.env.PORT ? +process.env.PORT : 8080;
const HOST = process.env.HOST || 'localhost';


const express = require('express');
const lib = require('./lib');


const knex = require('knex')({
  "client": "pg",
  "connection": {
    "user": "highscore",
    "password": "password",
    "database": "highscores"
  },
  "pool": {
    "min": 2,
    "max": 10
  },
  "migrations": {
    "tableName": "knex_migrations"
  }
});


/** Filters allowed on each table. */
const allowedFilters = {
  score: {
    relations: ['lt', 'lte', 'gt', 'gte', 'eq', 'neq'],
    valid: validators.numeric,
  },
  player: {
    relations: ['eq', 'neq'],
    valid: validators.player,
  },
};


/**
 * Simple score evaluation function.
 *
 * Trusts a submitted score unless it's unbelievably big.
 */
const evaluateScore = body => ({
  value: body.score,
  error: body.score > 100 ? "Nobody's that good" : ''
});


const scores = new lib.Server({
  db: require('knex')(require('./dbconf')),
  filters: allowedFilters,
  evaluate: evaluateScore,
});


const app = express();
app.use(express.json());
app.use(middleware.logRequest);
app.use(middleware.handleErrors);


app.get('/scores', (req, res) => scores.retrieve(req, res));
app.post('/scores', (req, res) => scores.insert(req, res));
