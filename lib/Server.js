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
    const body = req.body;
    if (typeof body !== 'object') {
      res.status(400).send('Invalid body');
      return;
    }
    const player = validators.player(body.player);
    if (!player.valid) {
      res.status(400).send('Invalid player name');
      return;
    }
    const score = this.evaluate(body.proof);
    if (score.error) {
      res.status(400).send(score.error);
      return;
    }
    const context = await this.getContext(req.query.ctx);
    if (context.error) {
      res.status(400).send(context.error);
      return;
    }
    const values = {
      context: context.value.id,
      player: player.value,
      value: score.value,
    };
    if (body.hasOwnProperty('proof')) {
      values.proof = JSON.stringify(body.proof);
    }

    try {
      await this.db.insert(values).into('score');
    }
    catch (err) {
      console.error('Failed to insert score', values);
      console.error(err.stack);
      return res.status(500).send('Failed to create score');
    }
    res.sendStatus(204);
    console.log('Inserted score', values);
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
