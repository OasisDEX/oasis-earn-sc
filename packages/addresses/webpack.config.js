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
    rules: [{ test: /\.ts$/, loader: 'ts-loader' }],
  },
  resolve: {
    alias: {
      '@dma-deployments/utils/*': path.resolve(__dirname, '../dma-deployments/utils/*'),
      '@dma-deployments/types/*': path.resolve(__dirname, '../dma-deployments/types/*'),
      '@dma-deployments/constants/*': path.resolve(__dirname, '../dma-deployments/constants/*'),
      '@dma-deployments/constants/contract-names': path.resolve(
        __dirname,
        '../dma-deployments/constants/contract-names.ts',
      ),
    },
  },
}
