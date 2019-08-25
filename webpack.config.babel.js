
import { resolve } from 'path'
import { DefinePlugin, EnvironmentPlugin, optimize } from 'webpack'
import WXAppWebpackPlugin from 'wxapp-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import CleanWebpackPlugin from 'clean-webpack-plugin'
import { DEV_ENV } from './config/dev.env'
import { TEST_ENV } from './config/test.env'
import { PROD_ENV } from './config/prod.env'

const { NODE_ENV } = process.env
const isDev = NODE_ENV === 'development'
const isTest = NODE_ENV === 'test'
const isProd = NODE_ENV === 'production'

const relativeFileLoader = (ext = '[ext]') => [
  {
    loader: 'file-loader',
    options: {
      publicPath: '',
      useRelativePath: true,
      name: `[name].${ext}`,
      emitFile: false,
    },
  },
  {
    loader: 'file-loader',
    options: {
      publicPath: '',
      context: resolve('src'),
      name: `[path][name].${ext}`,
    },
  },
]

export default () => {
  return {
    entry: {
      app: './src/app.js',
    },
    output: {
      filename: '[name].js',
      publicPath: '/',
      path: isProd ? resolve('build') : isTest ? resolve('test') : resolve('dist'),
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: /src/,
          use: [
            'babel-loader',
            //'eslint-loader',
          ],
        },
        {
          test: /\.wxs$/,
          include: /src/,
          use: [
            ...relativeFileLoader(),
            'babel-loader',
            //'eslint-loader',
          ],
        },
        {
          test: /\.(scss|sass|wxss)$/,
          include: /src/,
          use: [
            ...relativeFileLoader('wxss'),
            'extract-loader',
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/,
          include: /src/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            fallback: 'file-loader',
            name: './images/[name].[ext]',
          },
        },
        {
          test: /\.json$/,
          include: /src/,
          use: relativeFileLoader(),
        },
        {
          test: /\.wxml$/,
          include: resolve('src'),
          use: [
            ...relativeFileLoader(),
            {
              loader: 'wxml-loader',
              options: {
                root: resolve('src'),
                minimize: false,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new EnvironmentPlugin({
        NODE_ENV: 'development',
      }),
      new DefinePlugin({
        __DEV__: isDev,
        __TEST__: isTest,
        'process.env': isProd ? JSON.stringify(PROD_ENV) : isTest ? JSON.stringify(TEST_ENV) : JSON.stringify(DEV_ENV),
      }),
      new CleanWebpackPlugin([isProd ? './build/*' : isTest ? './test/*' : './dist/*']),
      new WXAppWebpackPlugin({
        clear: false,
      }),
      new optimize.ModuleConcatenationPlugin(),
      new CopyWebpackPlugin([
        'src/project.config.json',
        'src/ext.json',
      ]),
    ].filter(Boolean),
    // devtool: isDev ? 'source-map' : false,
    resolve: {
      extensions: ['.js', '.wxml', '.sass', '.scss'],
      modules: [resolve(__dirname, 'src'), 'node_modules'],
      alias: {
        '@': resolve('src'),
      },
    },
    watchOptions: {
      ignored: /dist|build/,
      aggregateTimeout: 300,
    },
  }
}
