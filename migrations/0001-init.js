module.exports.up = knex => Promise.all([
  knex.schema.hasTable('context').then(async function(exists) {
    if (!exists) {
      await knex.schema.createTable('context', table => {
        table.increments('id').primary();
        table.string('name', 32).notNullable().index().unique();
        table.string('api_key', 64).notNullable().index().unique();
        table.timestamps(false, true);
      });
    }
  }),

  knex.schema.hasTable('score').then(async function(exists) {
    if (!exists) {
      await knex.schema.createTable('score', table => {
        table.increments('id').primary();
        table.string('player', 32).notNullable().index();
        table.integer('context').unsigned().references('context.id');
        table.float('score').notNullable();
        table.jsonb('proof');
        table.timestamps(false, true);
      });
    }
  }),
]);


module.exports.down = knex => Promise.all([
  knex.schema.dropTableIfExists('context'),
  knex.schema.dropTableIfExists('score'),
]);
