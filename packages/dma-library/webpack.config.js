const path = require('path')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'lib', 'esm'),
    filename: 'index.min.js',
    libraryTarget: 'module',
  },
  externals: {
    undici: 'commonjs undici',
  },
  plugins: [new NodePolyfillPlugin() /*new BundleAnalyzerPlugin()*/],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, './tsconfig.esm.json'),
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
    plugins: [
      new TsconfigPathsPlugin({
        configFile: 'tsconfig.esm.json',
      }),
    ],
    fallback: {
      path: require.resolve('path-browserify'),
      vm: require.resolve('vm-browserify'),
      os: require.resolve('os-browserify/browser'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      assert: false,
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
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  experiments: {
    outputModule: true,
  },
}
