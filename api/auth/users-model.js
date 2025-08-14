// api/auth/users-model.js
const db = require('../../data/dbConfig') // knex instance from data/dbConfig.js

function find() {
  return db('users')
}

function findBy(filter) {
  return db('users').where(filter)
}

async function add(user) {
  const [id] = await db('users').insert(user)
  return findById(id)
}

function findById(id) {
  return db('users').where({ id }).first()
}

module.exports = {
  find,
  findBy,
  findById,
  add,
}
