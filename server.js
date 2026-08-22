const express = require('express')
const path = require('path')
const { Pool } = require('pg')

// A bound database service injects DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD
// and DB_NAME. Without a binding the app still serves, and the API says why
// it can't store anything.
const configured = Boolean(process.env.DB_HOST)

const pool = configured
  ? new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
  : null

let ready = false

async function prepare() {
  for (;;) {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT false
      )`)
      ready = true
      return
    } catch (err) {
      console.log('waiting for the database:', err.message)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
}

const app = express()
app.use(express.json())

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.use('/api', (req, res, next) => {
  if (!configured) return res.status(503).json({ error: 'No database bound yet.' })
  if (!ready) return res.status(503).json({ error: 'Waiting for the database.' })
  next()
})

app.get('/api/todos', async (req, res) => {
  const { rows } = await pool.query('SELECT id, title, done FROM todos ORDER BY id')
  res.json(rows)
})

app.post('/api/todos', async (req, res) => {
  const title = (req.body.title || '').trim()
  if (!title) return res.status(400).json({ error: 'A todo needs a title.' })
  const { rows } = await pool.query(
    'INSERT INTO todos (title) VALUES ($1) RETURNING id, title, done',
    [title],
  )
  res.status(201).json(rows[0])
})

app.patch('/api/todos/:id', async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE todos SET done = $2 WHERE id = $1 RETURNING id, title, done',
    [req.params.id, req.body.done === true],
  )
  if (rows.length === 0) return res.status(404).json({ error: 'No such todo.' })
  res.json(rows[0])
})

app.delete('/api/todos/:id', async (req, res) => {
  await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id])
  res.status(204).end()
})

const port = process.env.PORT || 80
app.listen(port, () => console.log(`listening on ${port}`))
if (configured) prepare()
