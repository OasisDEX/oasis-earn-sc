const path = require('path')
module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'lib'),
    library: {
      type: 'module',
    },
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
    extensions: ['.ts', '.js'],
    alias: {
      '@dma-deployments/constants': path.resolve(
        __dirname,
        '../dma-deployments/constants/index.ts',
      ),
    },
  },
  experiments: {
    outputModule: true,
  },
}
