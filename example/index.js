#!/usr/bin/env node
// Environment variables.
const PORT = process.env.PORT ? +process.env.PORT : 8080;
const HOST = process.env.HOST || 'localhost';


const express = require('express');

const validators = require('../lib/validators');
const middleware = require('../lib/middleware');
const ScoreServer = require('../lib/Server').Server;


const dbConfig = require('./knexfile').development;
const db = require('knex')(dbConfig);


/** Filters allowed on each table. */
const filters = {
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
 * Score evaluation function.
 *
 * Calculates a score and optionally dictates how trustworthy it is.
 */
const evaluate = body => {
  const value = body.score;
  if (typeof value !== 'number') {
    return {value: 0, error: 'Expected a numeric score'};
  }

  let trust = 0.0;
  if (value > 100) {
    trust = 0.0;
  }
  else if (value > 50) {
    trust = 0.5;
  }
  else {
    trust = 1.0;
  }
  return {value, trust, error: ''};
};


const scores = new ScoreServer({
  db,
  filters,
  evaluate,
});


const app = express();
app.use(express.json());
app.use(middleware.logRequest);
app.use(middleware.handleErrors);


app.get('/scores', (req, res) => scores.retrieve(req, res));
app.post('/scores', (req, res) => scores.insert(req, res));


app.listen(PORT, HOST, () => {
  console.log('Listening on %s:%s', HOST, PORT);
});
