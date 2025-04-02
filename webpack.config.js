module.exports = { 
  entry: "./index.js", 
  output: { 
    filename: "bundle.js", 
  }, 
  module: { 
    rules: [ 
      { 
        test: /\.jsx?$/, 
        exclude: /node_modules/, 
        use: { 
          loader: "babel-loader", 
          options: { 
            presets: ["@babel/preset-react"],
            sourceType: "module" // This is critical for handling ES modules
          } 
        } 
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ] 
  }, 
  resolve: { 
    extensions: [".js", ".jsx"] 
  },
  mode: "development"
};