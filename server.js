const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 8080

express()
  .use(express.static(path.join(__dirname, 'dist')))
  .set('port', process.env.PORT || 8080)
  .listen(PORT, () => console.log(`listening on port ${PORT}`));
