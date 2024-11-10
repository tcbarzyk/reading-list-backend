const booksRouter = require('express').Router()
const Book = require('../models/book')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

booksRouter.get('/', async (request, response) => {
  const books = await Book.find({}).populate('user', { username: 1, email: 1 })

  response.json(books)
})

booksRouter.get('/:id', async (request, response) => {
  const book = await Book.findById(request.params.id)

  if (book) {
    response.status(200).json(book);
  }
  else {
    response.status(404).end();
  }
})

booksRouter.post('/', async (request, response) => {
  const { body } = request;
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })  
  }

  const user = await User.findById(decodedToken.id)

  if (!body.key) {
    return response.status(400).end()
  }

  if (!body.userInfo) {
    body.userInfo = {}
  }

  if (!body.userInfo.status) {
    body.userInfo.status = 'reading'
  }
  if (!body.userInfo.notes) {
    body.userInfo.notes = ''
  }

  const book = new Book({
    key: body.key,
    userInfo: {
      notes: body.userInfo.notes,
      status: body.userInfo.status
    },
    user: user.id
  })

  const result = await book.save()

  user.books = user.books.concat(result._id)
  await user.save()

  response.status(201).json(result)
})

booksRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })  
  }

  await Book.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

booksRouter.put('/:id', async (request, response) => {
  const oldBook = await Book.findById(request.params.id)
  const body = request.body

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  const user = await User.findById(decodedToken.id)
  
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })  
  }

  if (!body.key) {
    body.key = oldBook.key
  }

  if (!body.userInfo || !body.userInfo.status || !body.userInfo.notes) {
    response.status(400).end()
  }
  else {
    const newBook = {
      key: body.key,
      userInfo: {
        notes: body.userInfo.notes,
        status: body.userInfo.status
      },
      user: user
    }
    await Book.findByIdAndUpdate(request.params.id, newBook, { new: true })
    response.status(200).json(newBook)
  }
})

module.exports = booksRouter