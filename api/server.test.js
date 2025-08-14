// api/server.test.js
const request = require('supertest')
const server = require('./server')

// support either data/dbConfig.js or data/db-config.js (repo variance)
let db
try {
  db = require('../data/dbConfig')
} catch {
  db = require('../data/db-config')
}

beforeAll(async () => {
  try {
    await db.migrate.latest()
  } catch (_) {}
})

beforeEach(async () => {
  await db('users').truncate()
})

afterAll(async () => {
  try {
    await db.destroy()
  } catch (_) {
    
  }
})

describe('[POST] /api/auth/register', () => {
  test('201 creates a new user and returns id, username, password (hashed)', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({ username: 'cap', password: 'marvel' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toMatchObject({ username: 'cap' })
    expect(res.body.password).not.toBe('marvel')
    expect(typeof res.body.password).toBe('string')
    expect(res.body.password.startsWith('$2')).toBe(true) // bcrypt hash
  }, 10000)

  test('400 when username or password missing', async () => {
    const res = await request(server).post('/api/auth/register').send({ username: 'onlyname' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ message: 'username and password required' })
  })

  test('400 when username is taken', async () => {
    await request(server).post('/api/auth/register').send({ username: 'dupe', password: 'pw' })
    const res = await request(server).post('/api/auth/register').send({ username: 'dupe', password: 'pw' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ message: 'username taken' })
  })
})

describe('[POST] /api/auth/login', () => {
  test('200 returns a token and welcome message on valid credentials', async () => {
    await request(server).post('/api/auth/register').send({ username: 'u1', password: 'pw' })
    const res = await request(server).post('/api/auth/login').send({ username: 'u1', password: 'pw' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.message).toBe('welcome, u1')
  })

  test('400 when username or password missing', async () => {
    const res = await request(server).post('/api/auth/login').send({ username: 'u1' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ message: 'username and password required' })
  })

  test('401 on invalid credentials', async () => {
    // not registering the user means invalid username
    const res = await request(server).post('/api/auth/login').send({ username: 'ghost', password: 'pw' })
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ message: 'invalid credentials' })
  })
})

describe('[GET] /api/jokes', () => {
  test('401 without a token', async () => {
    const res = await request(server).get('/api/jokes')
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ message: 'token required' })
  })

  test('200 with a token returns jokes array', async () => {
    await request(server).post('/api/auth/register').send({ username: 'u2', password: 'pw' })
    const login = await request(server).post('/api/auth/login').send({ username: 'u2', password: 'pw' })
    const token = login.body.token

    const res = await request(server).get('/api/jokes').set('Authorization', token)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
