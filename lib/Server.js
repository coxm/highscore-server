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
  }

  async retrieve(req, res) {
    // Check for a valid context.
    const context = await this.getContext(req.query.ctx);
    if (context.error) {
      return res.status(400).send(context.error);
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

    const filterObj = aggregate(
      without(req.query, 'limit', 'ctx'),
      this.filters);
    if (filterObj.error) {
      return res.status(400).send(filterObj.error);
    }

    let query = filterObj.filter(
      this.db('score').select('*').where('context', context.value.id));

    // Apply limit.
    if (limit > 0) {
      query = query.limit(limit);
    }

    try {
      res.json({scores: await query});
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
    const score = this.evaluate(body);
    if (score.error) {
      return {error: score.error, value: null};
    }
    const context = await this.getContext(req.query.ctx);
    if (context.error) {
      return {error: context.error, value: null};
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

  async getContext(key) {
    if (!key) {
      return {error: 'Invalid key', value: undefined};
    }
    const value = await (
      this.db.first('*').from('context').where('api_key', key));
    return {error: value ? '':  'No such context', value};
  }
}
module.exports.Server = Server;
