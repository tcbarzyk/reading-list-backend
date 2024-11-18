const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
  key: String,
  userInfo: {
    notes: String,
    status: String
  },
  bookInfo: {
    title: String,
    description: String,
    coverKey: String,
    author: {
      key: String,
      name: String,
      bio: String
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

bookSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Book', bookSchema)