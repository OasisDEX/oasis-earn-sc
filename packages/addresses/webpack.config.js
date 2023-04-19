const path = require('path')
module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'lib'),
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: {
      '@dma-deployments/constants/contract-names': path.resolve(
        __dirname,
        '../dma-deployments/constants/contract-names.ts',
      ),
    },
  },
}
