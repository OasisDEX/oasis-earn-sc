const path = require('path')
module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'lib', 'esm'),
    library: {
      type: 'module',
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json',
              transpileOnly: true, // Add this line
            },
          },
        ],
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
