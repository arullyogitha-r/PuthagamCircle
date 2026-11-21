
const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const dbPath = process.env.DB_PATH || './books.db'

if (process.env.DB_PATH) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    book_data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    book_title TEXT NOT NULL,
    interested_name TEXT NOT NULL,
    interested_location TEXT,
    request_type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

console.log('SQLite database connected successfully!')

// Home
app.get('/', (req, res) => {
  res.send('PuthagamCircle backend running!')
})

// Get all books
app.get('/api/books', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM books ORDER BY id DESC').all()
    const books = rows.map(row => ({
      ...JSON.parse(row.book_data),
      id: row.id
    }))
    res.json(books)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch books' })
  }
})

// Add book
app.post('/api/books', (req, res) => {
  try {
    const book = req.body

    if (!book.title || !book.type) {
      return res.status(400).json({
        error: 'Book title and type are required'
      })
    }

    const statement = db.prepare(`
      INSERT INTO books (type, title, book_data)
      VALUES (?, ?, ?)
    `)

    const result = statement.run(
      book.type,
      book.title,
      JSON.stringify(book)
    )

    res.status(201).json({
      ...book,
      id: result.lastInsertRowid
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to add book' })
  }
})

// Delete book
app.delete('/api/books/:id', (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM books WHERE id = ?'
    ).run(req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json({ message: 'Book deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete book' })
  }
})

// Submit interest
app.post('/api/interests', (req, res) => {
  try {
    const {
      book_id,
      book_title,
      interested_name,
      interested_location,
      request_type
    } = req.body

    if (!book_title || !interested_name || !request_type) {
      return res.status(400).json({
        error: 'Book title, name and request type are required'
      })
    }

    if (!['buy', 'borrow'].includes(request_type)) {
      return res.status(400).json({
        error: 'Request type must be buy or borrow'
      })
    }

    const statement = db.prepare(`
      INSERT INTO interests (
        book_id,
        book_title,
        interested_name,
        interested_location,
        request_type
      )
      VALUES (?, ?, ?, ?, ?)
    `)

    const result = statement.run(
      book_id || null,
      book_title,
      interested_name,
      interested_location || '',
      request_type
    )

    res.status(201).json({
      message: 'Interest registered successfully',
      request_id: result.lastInsertRowid
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Failed to register interest'
    })
  }
})

// View interest requests
app.get('/api/interests', (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT * FROM interests
      ORDER BY id DESC
    `).all()

    res.json(requests)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Failed to fetch interest requests'
    })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PuthagamCircle server running on port ${PORT}`)
})
