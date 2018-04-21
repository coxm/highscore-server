const validators = require('./validators');
const aggregate = require('./filters').aggregate;


function without(obj) {
  const copy = Object.assign({}, obj);
  for (let i = 0, len = arguments.length; i < len; ++i) {
    delete copy[arguments[i]];
  }
  return copy;
};
module.exports.without = without;


class Server {
  constructor(options) {
    this.db = options.db;
    this.filters = options.filters;
    this.evaluate = options.evaluate;
    this.maxConcurrentContexts = options.maxConcurrentContexts || 5;
  }

  async retrieve(req, res) {
    // Check valid limit.
    const limit = this.parseLimit(req);
    if (!limit.valid) {
      return res.status(400).send('Invalid limit');
    }

    const contexts = await this.parseMultipleContexts(req.query.ctx);
    if (contexts.error) {
      return res.status(400).send(contexts.error);
    }
    if (contexts.value.length > this.maxConcurrentContexts) {
      return res.status(400).send('Too many keys');
    }

    const filterObj = aggregate(
      without(req.query, 'limit', 'ctx'),
      this.filters);
    if (filterObj.error) {
      return res.status(400).send(filterObj.error);
    }

    const columns = {player: 'player', value: 'value', created: 'created_at'};
    let queries = contexts.value.map(
      ctx => filterObj.filter(
        this.db('score').select(columns).where('context', ctx.id)));

    // Apply limit.
    if (limit.value > 0) {
      queries = queries.map(q => q.limit(limit.value));
    }

    queries = queries.map((query, i) => (
      query.then(scores => this.postProcess(scores, contexts.value[i]))));

    try {
      res.json({
        scores: [].concat(...(await Promise.all(queries))),
      });
    }
    catch (err) {
      console.error('Scores fetch failed:', err.stack);
      res.status(500).send('Unable to fetch scores');
    }
  }

  async insert(req, res) {
    const score = await this.constructScore(req, res);
    if (score.error) {
      res.status(400).send(score.error);
      return;
    }

    try {
      await this.db.insert(score.value).into('score');
      res.sendStatus(204);
    }
    catch (err) {
      console.error('Failed to insert score', score.value);
      console.error(err.stack);
      res.status(500).send('Failed to create score');
    }
  }

  async constructScore(req, res) {
    const body = req.body;
    if (typeof body !== 'object') {
      return {error: 'Invalid body', value: null};
    }
    const player = validators.player(body.player);
    if (!player.valid) {
      return {error: 'Invalid player name', value: null};
    }
    const context = await this.getContext(req.query.ctx);
    if (context.error) {
      return {error: context.error, value: null};
    }
    const score = this.evaluate(body);
    if (score.error) {
      return {error: score.error, value: null};
    }
    return {
      error: '',
      value: {
        context: context.value.id,
        player: player.value,
        value: score.value,
        trust: +score.trust,
        proof: body.hasOwnProperty('proof')
          ? JSON.stringify(body.proof)
          : null,
      },
    };
  }

  saveScore(scoreObj) {
    return this.db.insert(score.value).into('score');
  }

  postProcess(scores, context) {
    return scores.map(score => Object.assign(score, {
      context: context.api_key,
    }));
  }

  async getContext(key) {
    if (!key) {
      return {error: 'Invalid key', value: undefined};
    }
    const value = await (
      this.db.first('*').from('context').where('api_key', key));
    return {error: value ? '':  'Invalid key', value};
  }

  async parseMultipleContexts(param) {
    if (typeof param !== 'string') {
      return {error: 'Invalid key', value: undefined};
    }
    const ids = param.split(',');
    const contexts = await this.db.select('*').from('context').where(
      'api_key', 'in', ids);

    if (contexts.length === ids.length) {
      return {error: '', value: contexts};
    }

    const dict = contexts.reduce((dict, ctx) => {
      dict[ctx.api_key] = ctx;
    }, {});
    const missing = ids.filter(id => !dict[id]);
    return {error: `Invalid keys: ${missing}`, value: undefined};
  }

  parseLimit(req) {
    if (!req.query.hasOwnProperty('limit')) {
      return {valid: true, limit: -1};
    }
    return validators.positiveInteger(req.query.limit);
  }
}
module.exports.Server = Server;
