const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
  key: String,
  userInfo: {
    notes: String,
    status: String
  }
})

module.exports = mongoose.model('Book', bookSchema)