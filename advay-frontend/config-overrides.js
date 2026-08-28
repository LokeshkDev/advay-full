const webpack = require('webpack');

module.exports = function override(config) {
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
  ];
  return config;
};
