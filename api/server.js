const express = require('express')
const authRouter = require('./auth/auth-router')
const restricted = require('./middleware/restricted')
const jokesRouter = require('./jokes/jokes-router')

const server = express()
server.use(express.json())

server.use('/api/auth', authRouter)
server.use('/api/jokes', restricted, jokesRouter)

server.use((err, req, res, next) => { // eslint-disable-line
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack,
  })
})

module.exports = server
