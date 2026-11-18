
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to SQLite database
const db = new Database(path.join(__dirname, 'books.db'));

// Create books table
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    book_data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('SQLite database connected successfully!');

// Backend status
app.get('/', (req, res) => {
  res.send('PuthagamCircle backend is running!');
});

// Get all saved books
app.get('/api/books', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT id, book_data FROM books ORDER BY id DESC'
    ).all();

    const books = rows.map(row => ({
      ...JSON.parse(row.book_data),
      id: row.id
    }));

    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not retrieve books' });
  }
});

// Save a new book
app.post('/api/books', (req, res) => {
  try {
    const book = req.body;

    if (!book.title || !book.type) {
      return res.status(400).json({
        error: 'Book title and type are required'
      });
    }

    if (!['sale', 'lend'].includes(book.type)) {
      return res.status(400).json({
        error: 'Invalid book type'
      });
    }

    const result = db.prepare(
      'INSERT INTO books (type, title, book_data) VALUES (?, ?, ?)'
    ).run(
      book.type,
      book.title,
      JSON.stringify(book)
    );

    res.status(201).json({
      ...book,
      id: Number(result.lastInsertRowid)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not save book' });
  }
});

// Delete a book
app.delete('/api/books/:id', (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM books WHERE id = ?'
    ).run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete book' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`PuthagamCircle server running at http://localhost:${PORT}`);
});
