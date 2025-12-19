const path = require('path');

const root = path.resolve(__dirname, '.');

module.exports = {
  mode: 'development',
  entry: './index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'index.js',
    path: root
  },
  devServer: {
    static: root,
  },
}