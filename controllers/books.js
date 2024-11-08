const booksRouter = require('express').Router()
const Book = require('../models/book')

booksRouter.get('/', (request, response) => {
  Book
    .find({})
    .then(books => (
      response.json(books)
    ))
})

booksRouter.post('/', (request, response) => {
  const book = new Book(request.body)
  book
    .save()
    .then(result => {
      response.status(201).json(result)
    })
})

module.exports = booksRouter