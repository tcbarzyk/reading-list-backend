const Book = require('../models/book')

const initialBooks = [
  {
    key: "abc123",
    userInfo: {
      notes: "This is a good book",
      status: "has read"
    }
  },
  {
    key: "def456",
    userInfo: {
      notes: "This is not a good book",
      status: "reading"
    }
  }
]

const nonExistingId = async () => {
  const book = new Book({ key: 'willremovethissoon' })
  await book.save()
  await book.deleteOne()

  return book._id.toString()
}

const booksInDb = async () => {
  const books = await Book.find({})
  return books.map(book => book.toJSON())
}

module.exports = {
  initialBooks, nonExistingId, booksInDb
}