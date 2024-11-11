const Book = require('../models/book')
const User = require('../models/user')

const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const userToken = async () => {
  const userAuth = await api.post('/login').send( {username: 'testuser', password: 'password'} )
  return userAuth.body.token
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

const initialBooks = [
  {
    key: "abc123",
    userInfo: {
      notes: "This is a not real book",
      status: "to read"
    },
    bookInfo: {
      title: "A Book",
      description: "A book about something",
      author: {
        key: "49238",
        name: "John Doe",
        bio: "He wrote the book"
      }
    }
  },
  {
    key: "def456",
    userInfo: {
      notes: "This is still not a real book",
      status: "reading"
    },
    bookInfo: {
      title: "A Second Book",
      description: "A second book about something",
      author: {
        key: "5234234",
        name: "Jane Doe",
        bio: "She wrote the book"
      }
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
  initialBooks,
  nonExistingId,
  booksInDb,
  usersInDb,
  userToken
}