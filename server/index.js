#!/usr/bin/env node
// Environment variables.
const PORT = process.env.PORT ? +process.env.PORT : 8080;
const HOST = process.env.HOST || 'localhost';


const express = require('express');
const knex = require('knex')(require('./dbconf'));

const validators = require('./validators');
const aggregateFilters = require('./filters').aggregate;
const logRequestMiddleware = require('./middleware').logRequest;


async function getContext(req) {
  const key = req.query.ctx;
  if (key) {
    const matches = await (
      knex
      .select('*')
      .from('context')
      .where('api_key', '=', key));

    if (matches.length === 1) {
      return matches[0];
    }
  }
  return null;
}


function without(obj) {
  const copy = Object.assign({}, obj);
  for (let i = 0, len = arguments.length; i < len; ++i) {
    delete copy[arguments[i]];
  }
  return copy;
};


/** Allowed filters, broken down by table. */
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


const app = express();
app.use(express.json());
app.use(logRequestMiddleware);


app.get('/scores', async function app_GET_scores(req, res) {
  // Check for a valid context.
	const context = await getContext(req);
  if (!context) {
    return res.status(400).send('No key');
  }
  // Check valid limit.
  let limit = -1;
  if (req.query.hasOwnProperty('limit')) {
    const checked = validators.positiveInteger(req.query.limit);
    if (!checked.valid) {
      return res.status(400).send('Invalid limit');
    }
    limit = checked.value;
  }

  const filterObj = aggregateFilters(
    without(req.query, 'limit', 'ctx'), allowedFilters);

  if (filterObj.error) {
    return res.status(400).send(filterObj.error);
  }
  let query = filterObj.filter(knex.select(['player', 'score']).from('score'));

  // Apply limit.
  if (limit > 0) {
    query = query.limit(limit);
  }

  res.json({scores: await query});
});


app.post('/scores', async function app_POST_scores(req, res) {
  const body = req.body;
  if (typeof body !== 'object') {
    return res.status(400).send('Invalid body');
  }
  const player = validators.player(body.player);
  if (!player.valid) {
    return res.status(400).send('Invalid player name');
  }
  const score = validators.numeric(body.score);
  if (!score.valid) {
    return res.status(400).send('Invalid score');
  }
	const context = await getContext(req);
  if (!context) {
    return res.status(400).send('No key');
  }
  const values = {
    context: context.id,
    player: player.value,
    score: score.value,
  };
  if (body.hasOwnProperty('proof')) {
    values.proof = JSON.stringify(body.proof);
  }
  await knex('score').insert(values);
  res.sendStatus(204);
});


app.listen(PORT, HOST, err => {
  if (err) console.error('Error:', err);
  else console.log('Listening on %s:%s', HOST, PORT);
});
