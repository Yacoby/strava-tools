const path = require('path');
module.exports = {
  context: path.resolve(__dirname, 'app'),
  entry: './app.jsx',
  output: {
    path: path.resolve('dist'),
    filename: 'bundle.js'
  },
  resolve: {
              extensions: [".jsx", ".js"]
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'app'),
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.css$/, loader: "style-loader!css-loader" },
      {test: /\.(png|jpg)$/, loader: "file-loader?name=images/[name].[ext]"}
    ]
  }
}
