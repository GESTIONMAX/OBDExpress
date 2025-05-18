module.exports = ({ env }) => ({
  connection: {
    client: env('DATABASE_CLIENT', 'postgres'),
    connection: {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'obdexpress_db'),
      user: env('DATABASE_USERNAME', 'obd_user'),
      password: env('DATABASE_PASSWORD', 'Joagvxcu9z'),
      schema: env('DATABASE_SCHEMA', 'public'),
      ssl: env.bool('DATABASE_SSL', false),
    },
    debug: false,
  },
});
