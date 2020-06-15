const path = require('path');
module.exports = {
  context: path.resolve(__dirname, 'app'),
  entry: './app.jsx',
  output: {
    path: path.resolve('dist'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.jsx', '.js']
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'app'),
  },
  module: {
    rules: [
      {test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/},
      {test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/},
      {test: /\.css$/, loader: "style-loader!css-loader"},
      {test: /\.(html)$/, loader: "file-loader?name=[name].[ext]"},
      {test: /\.(png|jpg)$/, loader: "file-loader?name=images/[name].[ext]"}
    ]
  }
}
