const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Book = require('../models/book')
const User = require('../models/user')

beforeEach(async () => {
  await Book.deleteMany({})
  const bookObjects = helper.initialBooks.map(book => new Book(book))
  const promiseArr = await bookObjects.map(book => book.save())
  await Promise.all(promiseArr)
})

describe('viewing all books', () => {
  test('all books are returned as json', async () => {
    const response = await api
      .get('/api/books')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  
    assert.strictEqual(response.body.length, helper.initialBooks.length)
  })
  
  test('books have unique ID value', async () => {
    const response = await api.get('/api/books')
    books = response.body
  
    books.forEach(book => {
      assert.ok(book.id)
      assert.ok(mongoose.Types.ObjectId.isValid(book.id))
    })
  
    const ids = books.map(book => book.id)
    const uniqueIds = new Set(ids)
    assert.strictEqual(uniqueIds.size, ids.length)
  })
})

describe('viewing a specific book', () => {
  test('succeeds with a valid id', async () => {
    const booksAtStart = await helper.booksInDb()

    const bookToView = booksAtStart[0]

    const resultBook = await api
      .get(`/api/books/${bookToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.deepStrictEqual(resultBook.body, bookToView)
  })

  test('fails with statuscode 404 if note does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId()

    await api
      .get(`/api/books/${validNonexistingId}`)
      .expect(404)
  })

  test('fails with statuscode 400 id is invalid', async () => {
    const invalidId = '12345'

    await api
      .get(`/api/books/${invalidId}`)
      .expect(400)
  })
})

describe.only('creating a new book', () => {
  test.only('can create new book', async () => {
    const newBook = {
      key: '/works/OL27448W',
      userInfo: {
        notes: 'This is a weird book',
        status: 'has read'
      }
    }

    const token = await helper.userToken()
  
    await api
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send(newBook)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    
    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, helper.initialBooks.length+1)
    const keys = booksAtEnd.map(b => b.key)
    assert(keys.includes('/works/OL27448W'))
    const titles = booksAtEnd.map(b => b.bookInfo.title)
    assert(titles.includes('The Lord of the Rings'))
  })

  test.only('can create new book with description found in description.value', async () => {
    const newBook = {
      key: '/works/OL52114W',
      userInfo: {
        notes: 'This is a sci fi book',
        status: 'has read'
      }
    }

    const token = await helper.userToken()
  
    await api
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send(newBook)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    
    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, helper.initialBooks.length+1)
    const keys = booksAtEnd.map(b => b.key)
    assert(keys.includes('/works/OL52114W'))
    const titles = booksAtEnd.map(b => b.bookInfo.description)
    assert(titles.includes("The ultimate science fiction classic: for more than one hundred years, this compelling tale of the Martian invasion of Earth has enthralled readers with a combination of imagination and incisive commentary on the imbalance of power that continues to be relevant today. The style is revolutionary for its era, employing a sophisticated first and third person account of the events which is both personal and focused on the holistic downfall of Earth's society. The Martians, as evil, mechanical and unknown a threat they are, remain daunting in today's society, where, despite technology's mammoth advances, humanity's hegemony over Earth is yet to be called into question. In Well's introduction to the book, where the character discusses with the later deceased Ogilvy about astronomy and the possibility of alien life defeating the 'savage' (to them) nineteenth-century Britain, is he insinuating that this is the truth and fate of humanity? It's up to you to decide…"))
  })
  
  test('books without status default to reading', async () => {
    const newBook = {
      key: "/works/OL27448W",
      userInfo: {
        notes: 'This book has no status'
      }
    }

    const token = await helper.userToken()
  
    const addedBook = await api
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send(newBook)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    
    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, helper.initialBooks.length+1)
    const filteredBook = booksAtEnd.find(b => b.id === addedBook.body.id)
    assert(filteredBook.userInfo.status === 'reading')
  })
  
  test('books without userInfo default to empty notes and reading status', async () => {
    const newBook = {
      key: "/works/OL27448W"
    }

    const token = await helper.userToken()
  
    const addedBook = await api
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send(newBook)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    
    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, helper.initialBooks.length+1)
    const filteredBook = booksAtEnd.find(b => b.id === addedBook.body.id)
    assert(filteredBook.userInfo.status === 'reading')
    assert(filteredBook.userInfo.notes === '')
  })
  
  test('cannot create book without key property', async () => {
    const newBook = {
      userInfo: {
        notes: 'This book has no key property',
        status: 'reading'
      }
    }

    const token = await helper.userToken()
  
    await api
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send(newBook)
      .expect(400)
    
    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, helper.initialBooks.length)
  })
})

describe('deleting a book', () => {
  test('can delete book', async () => {
    const booksAtStart = await helper.booksInDb()
    const bookToDelete = booksAtStart[0]

    const token = await helper.userToken()

    await api
      .delete(`/api/books/${booksAtStart[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)
    
    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, booksAtStart.length-1)

    const keys = booksAtEnd.map(b => b.key)
    assert(!keys.includes(bookToDelete.key))
  })
})

describe.only('updating a book', () => {
  test.only('can update book using just userinfo', async () => {
    const booksAtStart = await helper.booksInDb()
    const bookToUpdate = booksAtStart[0]

    const updatedBookInfo = {
      userInfo: {
        notes: 'updated notes on book',
        status: 'to read'
      }
    }

    const token = await helper.userToken()

    await api
      .put(`/api/books/${booksAtStart[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBookInfo)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, booksAtStart.length)
    
    const filteredBook = booksAtEnd.find(b => b.id === bookToUpdate.id)
    assert(filteredBook.userInfo.status === updatedBookInfo.userInfo.status)
    assert(filteredBook.userInfo.notes === updatedBookInfo.userInfo.notes)
    assert(filteredBook.key === booksAtStart[0].key)
  })

  test('cannot update book without userinfo', async () => {
    const booksAtStart = await helper.booksInDb()
    const bookToUpdate = booksAtStart[0]

    const updatedBookInfo = {
      key: '1234567890'
    }

    const token = await helper.userToken()

    await api
      .put(`/api/books/${booksAtStart[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBookInfo)
      .expect(400)

    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, booksAtStart.length)
    
    const filteredBook = booksAtEnd.find(b => b.id === bookToUpdate.id)
    assert(filteredBook.key !== updatedBookInfo.key)
  })

  test.only('can update book using just userinfo', async () => {
    const booksAtStart = await helper.booksInDb()
    const bookToUpdate = booksAtStart[0]

    const updatedBookInfo = {
      userInfo: {
        notes: 'updated notes on book',
        status: 'to read'
      }
    }

    const token = await helper.userToken()

    await api
      .put(`/api/books/${booksAtStart[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBookInfo)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, booksAtStart.length)
    
    const filteredBook = booksAtEnd.find(b => b.id === bookToUpdate.id)
    assert(filteredBook.userInfo.status === updatedBookInfo.userInfo.status)
    assert(filteredBook.userInfo.notes === updatedBookInfo.userInfo.notes)
    assert(filteredBook.key === booksAtStart[0].key)
  })

  test('cannot update book with mismatching keys', async () => {
    const booksAtStart = await helper.booksInDb()
    const bookToUpdate = booksAtStart[0]

    const updatedBookInfo = {
      key: '1234567890',
      userInfo: {
        notes: 'updated notes on book',
        status: 'to read'
      }
    }

    const token = await helper.userToken()

    await api
      .put(`/api/books/${booksAtStart[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBookInfo)
      .expect(400)

    const booksAtEnd = await helper.booksInDb()
    assert.strictEqual(booksAtEnd.length, booksAtStart.length)
    
    const filteredBook = booksAtEnd.find(b => b.id === bookToUpdate.id)
    assert(filteredBook.key !== updatedBookInfo.key)
  })
})

after(async () => {
  await mongoose.connection.close()
  console.log("connection closed");
})