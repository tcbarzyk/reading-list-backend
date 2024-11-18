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

const getBookData = async (key) => {
  const url = `https://openlibrary.org${key}.json`

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    //console.log(json);
    return json
  } catch (error) {
    console.error(error.message);
    return
  }
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
  //handle authentication token
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })  
  }
  const user = await User.findById(decodedToken.id)

  //ensure key is present
  const { body } = request
  if (!body.key) {
    return response.status(400).end()
  }

  //get book info from key, the get author info
  const bookInfo = await getBookData(body.key)
  const authorInfo = await getBookData(bookInfo.authors[0].author.key)
  
  //ensure book and author info is present
  if (!bookInfo || !authorInfo) {
    return response.status(400).json({ error: "book or author info not present" })
  }

  const description = 
    bookInfo.description?.value ||
    bookInfo.description ||
    'No description available'

  const authorBio = 
    authorInfo.bio?.value ||
    bookInfo.bio ||
    'No bio available'


  //ensure user info is present
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
    bookInfo: {
      title: bookInfo.title,
      description: description,
      coverKey: body.coverKey,
      author: {
        key: authorInfo.key,
        name: authorInfo.name,
        bio: authorBio
      }
    },
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
  const { body } = request

  //ensure valid user
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })  
  }
  const user = await User.findById(decodedToken.id)

  if (!body.key) {
    body.key = oldBook.key
  }
  else if (body.key !== oldBook.key) {
    return response.status(400).json({ error: "mismatched keys!" })
  }

  if (!body.userInfo) {
    return response.status(400).json( {error: "cannot update without userinfo"} )
  }

  if (!body.userInfo.status) {
    body.userInfo.status = oldBook.userInfo.status
  }

  if (!body.userInfo.notes) {
    body.userInfo.notes = oldBook.userInfo.notes
  }

  const newBook = {
    key: oldBook.key,
    bookInfo: {
      ...oldBook.bookInfo
    },
    userInfo: {
      notes: body.userInfo.notes,
      status: body.userInfo.status
    },
    user: user
  }

  await Book.findByIdAndUpdate(request.params.id, newBook, { new: true })
  response.status(200).json(newBook)
})

module.exports = booksRouter