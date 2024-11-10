const booksRouter = require('express').Router()
const Book = require('../models/book')

booksRouter.get('/', async (request, response) => {
  const books = await Book.find({})

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
  const book = new Book(request.body)

  if (!book.key) {
    return response.status(400).send({ error: 'name or number not present' })
  }

  if (!book.userInfo) {
    book.userInfo = {}
  }

  if (!book.userInfo.status) {
    book.userInfo.status = 'reading'
  }
  if (!book.userInfo.notes) {
    book.userInfo.notes = ''
  }

  const result = await book.save()
  response.status(201).json(result)
})

booksRouter.delete('/:id', async (request, response) => {
  await Book.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

booksRouter.put('/:id', async (request, response) => {
  const oldBook = await Book.findById(request.params.id)
  const body = request.body

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
      }
    }
    await Book.findByIdAndUpdate(request.params.id, newBook, { new: true })
    response.status(200).json(newBook)
  }
})

module.exports = booksRouter