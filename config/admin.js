module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'obdexpress_jwt_secret_for_admin'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'obdexpress_api_token_salt'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'obdexpress_transfer_token_salt'),
    },
  },
});
