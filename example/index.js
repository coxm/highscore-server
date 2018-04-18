#!/usr/bin/env node
// Environment variables.
const PORT = process.env.PORT ? +process.env.PORT : 8080;
const HOST = process.env.HOST || 'localhost';


const express = require('express');

const validators = require('../lib/validators');
const middleware = require('../lib/middleware');
const ScoreServer = require('../lib/Server').Server;


const dbConfig = require('./knexfile').development;
const knex = require('knex')(dbConfig);


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


const scores = new ScoreServer({
  db: knex,
  filters: allowedFilters,
  evaluate: evaluateScore,
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
