const Book = require('../models/book')
const User = require('../models/user')

const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const userToken = async () => {
  /*
  const newUser = {
    username: 'tokenuser',
    email: 'token@gmail.com',
    password: 'password'
  }

  await api.post('/api/users').send(newUser)

  const userAuth = await api.post('/login').send( {username: newUser.username, password: newUser.password} )*/
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
  initialBooks,
  nonExistingId,
  booksInDb,
  usersInDb,
  userToken
}