const router = require('express').Router()

// added:
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Users = require('./users-model') // api/auth/users-model.js
const JWT_SECRET = process.env.JWT_SECRET || 'shh'

function buildToken(user) {
  const payload = {
    subject: user.id,
    username: user.username,
  }
  const options = { expiresIn: '1d' }
  return jwt.sign(payload, JWT_SECRET, options)
}

router.post('/register', async (req, res, next) => {
  // res.end('implement register, please!');  // kept for reference, now disabled
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' })
    }

    const existing = await Users.findBy({ username })
    if (existing && existing.length) {
      return res.status(400).json({ message: 'username taken' })
    }

    const hash = bcrypt.hashSync(password, 8) // <= 2^8 rounds
    const newUser = await Users.add({ username, password: hash })

    return res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      password: newUser.password,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  // res.end('implement login, please!');  // kept for reference, now disabled
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' })
    }

    const [user] = await Users.findBy({ username })
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'invalid credentials' })
    }

    const token = buildToken(user)
    return res.json({
      message: `welcome, ${user.username}`,
      token,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
