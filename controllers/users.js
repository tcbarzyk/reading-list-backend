const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response) => {
  const { username, email, password } = request.body
  
  if (password.length < 5) {
    return response.status(400).json( {error: 'password should be more than 5 characters'} )
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    email,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('books', { key: 1, userInfo: 1 })
  
  response.json(users)
})

module.exports = usersRouter