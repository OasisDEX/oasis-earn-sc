const path = require('path')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

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
  externals: {
    undici: 'commonjs undici',
  },
  plugins: [new NodePolyfillPlugin()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, './tsconfig.json'),
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
      '@typechain': path.resolve(__dirname, '../dma-contracts/typechain'),
      '@dma-library': path.resolve(__dirname, './src'),
      '@dma-common/constants': path.resolve(__dirname, '../dma-common/constants'),
      '@dma-common/utils': path.resolve(__dirname, '../dma-common/utils'),
      '@dma-common/types': path.resolve(__dirname, '../dma-common/types'),
      '@dma-common/test-utils': path.resolve(__dirname, '../dma-common/test-utils'),
      '@dma-deployments/utils': path.resolve(__dirname, '../dma-deployments/utils'),
      '@dma-deployments/types': path.resolve(__dirname, '../dma-deployments/types'),
      '@dma-deployments/constants': path.resolve(__dirname, '../dma-deployments/constants'),
    },
    fallback: {
      path: require.resolve('path-browserify'),
      vm: require.resolve('vm-browserify'),
      os: require.resolve('os-browserify/browser'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      assert: require.resolve('assert/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      util: require.resolve('util/'),
      buffer: require.resolve('buffer/'),
      'stream/web': require.resolve('web-streams-polyfill/dist/ponyfill.es2018.js'),
      'util/types': false,
      console: require.resolve('console-browserify'),
      worker_threads: false,
      perf_hooks: false,
      fs: false,
      module: false,
      diagnostics_channel: false,
    },
  },
  experiments: {
    outputModule: true,
  },
}
