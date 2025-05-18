const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'StripePaymentForm': './public/js/components/payment/StripePaymentForm.jsx',
  },
  output: {
    path: path.resolve(__dirname, 'public/js/components/payment'),
    filename: '[name].bundle.js',
    library: '[name]',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    '@stripe/react-stripe-js': 'ReactStripe',
    '@stripe/stripe-js': 'Stripe'
  }
};
