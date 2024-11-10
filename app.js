const config = require('./utils/config')
const express = require('express')
const app = express()
require('express-async-errors')
const booksRouter = require('./controllers/books')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')

mongoose.set('strictQuery', false)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB: ', error.message)
  })

app.use(cors())
app.use(express.json())
app.use(morgan('tiny'))

app.use('/api/books', booksRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app