
import { useState, useEffect } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000/api/books'

const initialBooks = [
  {
    id: 1,
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    category: 'Fiction',
    isbn: '9780062315007',
    description: 'A young shepherd travels in search of his personal legend, discovering the importance of dreams, courage and following his heart.',
    type: 'sale',
    price: '₹180',
    owner: 'PuthagamCircle Library',
    location: 'Coimbatore'
  },
  {
    id: 2,
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self Help',
    isbn: '9780735211292',
    description: 'A practical guide to building better habits through small, consistent improvements.',
    type: 'sale',
    price: '₹250',
    owner: 'PuthagamCircle Library',
    location: 'Coimbatore'
  },
  {
    id: 3,
    title: 'Ikigai',
    author: 'Hector Garcia',
    category: 'Lifestyle',
    isbn: '9780143130727',
    description: 'An exploration of the Japanese concept of finding purpose and meaning in everyday life.',
    type: 'sale',
    price: '₹150',
    owner: 'PuthagamCircle Library',
    location: 'Coimbatore'
  },
  {
    id: 4,
    title: 'Wings of Fire',
    author: 'A.P.J. Abdul Kalam',
    category: 'Biography',
    isbn: '9788173711466',
    description: 'The inspiring autobiography of Dr. A.P.J. Abdul Kalam and his journey as a scientist and leader.',
    type: 'lend',
    price: 'Free lending',
    owner: 'PuthagamCircle Library',
    location: 'Coimbatore'
  },
  {
    id: 5,
    title: 'Ponniyin Selvan',
    author: 'Kalki Krishnamurthy',
    category: 'Fiction',
    isbn: '',
    description: 'A celebrated historical novel featuring royal intrigue and the fascinating world of the Chola dynasty.',
    type: 'lend',
    price: 'Free lending',
    owner: 'PuthagamCircle Library',
    location: 'Coimbatore'
  },
  {
    id: 6,
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'Finance',
    isbn: '9780857197689',
    description: 'Stories and lessons about how people think about money and make financial decisions.',
    type: 'lend',
    price: 'Free lending',
    owner: 'PuthagamCircle Library',
    location: 'Coimbatore'
  }
]

// Convert an uploaded image into a format SQLite can save
function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('')
      return
    }

    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the image'))

    reader.readAsDataURL(file)
  })
}

function BookCover({ book }) {
  const [imageFailed, setImageFailed] = useState(false)

  const imageSource = book.imageUrl ||
    (book.isbn
      ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false`
      : '')

  return (
    <div className="book-cover">
      {!imageFailed && imageSource && (
        <img
          src={imageSource}
          alt={`Cover of ${book.title}`}
          onError={() => setImageFailed(true)}
        />
      )}

      {(!imageSource || imageFailed) && (
        <div className="cover-fallback">
          <span>PUTHAGAM CIRCLE</span>
          <strong>{book.title}</strong>
          <small>{book.author}</small>
        </div>
      )}
    </div>
  )
}

function App() {
  const [screen, setScreenState] = useState('profile')

  const setScreen = (nextScreen) => {
    window.history.pushState(
      { puthagamCircle: true, screen: nextScreen },
      '',
      window.location.href
    )

    setScreenState(nextScreen)
  }

  const [user, setUser] = useState({
    name: '',
    contact: '',
    location: ''
  })

  const [books, setBooks] = useState(initialBooks)
  const [activeMode, setActiveMode] = useState('sale')
  const [selectedBook, setSelectedBook] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const [form, setForm] = useState({
    title: '',
    author: '',
    category: 'Fiction',
    description: '',
    price: '',
    duration: '',
    imageUrl: ''
  })

  const [imageFile, setImageFile] = useState(null)
  const [notice, setNotice] = useState('')

  // Load previously saved books from SQLite
  useEffect(() => {
    const loadSavedBooks = async () => {
      try {
        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error('Could not load saved books')
        }

        const savedBooks = await response.json()

        const formattedBooks = savedBooks.map((book) => ({
          ...book,
          id: `saved-${book.id}`
        }))

        setBooks([...formattedBooks, ...initialBooks])
      } catch (error) {
        console.error('Database loading error:', error)
        setNotice('Could not connect to the database.')
      }
    }

    loadSavedBooks()
  }, [])

  useEffect(() => {
    window.history.replaceState(
      { puthagamCircle: true, screen: 'profile' },
      '',
      window.location.href
    )

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedBook(null)
      }
    }

    const handleBack = (event) => {
      if (event.state?.puthagamCircle) {
        setScreenState(event.state.screen)
        setSelectedBook(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('popstate', handleBack)

    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('popstate', handleBack)
    }
  }, [])

  const categories = [
    'All', 'Fiction', 'Self Help', 'Lifestyle',
    'Biography', 'Classics', 'Fantasy', 'Finance'
  ]

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const openBrowse = (mode) => {
    setActiveMode(mode)
    setSearch('')
    setCategory('All')
    setNotice('')
    setScreen('browse')
  }

  const openForm = (mode) => {
    setActiveMode(mode)

    setForm({
      title: '',
      author: '',
      category: 'Fiction',
      description: '',
      price: '',
      duration: '',
      imageUrl: ''
    })

    setImageFile(null)
    setNotice('')
    setScreen('form')
  }

  // Save the new listing in SQLite
  const handleSubmitListing = async (event) => {
    event.preventDefault()

    try {
      const savedImage = await readImageAsDataURL(imageFile)

      const newBook = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        description: form.description.trim(),
        type: activeMode === 'sell' ? 'sale' : 'lend',
        price: form.price.trim(),
        duration: activeMode === 'rent' ? form.duration.trim() : '',
        owner: user.name,
        location: user.location,
        imageUrl: savedImage || form.imageUrl.trim(),
        isbn: ''
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBook)
      })

      if (!response.ok) {
        throw new Error('The book could not be saved')
      }

      const savedBook = await response.json()

      const bookForDisplay = {
        ...savedBook,
        id: `saved-${savedBook.id}`
      }

      setBooks((current) => [bookForDisplay, ...current])

      setNotice('Your book has been saved successfully!')
      setScreen('success')
    } catch (error) {
      console.error('Saving error:', error)
      alert('Could not save the book. Please check whether the backend server is running.')
    }
  }

  const visibleBooks = books.filter((book) => {
    const correctType = book.type === activeMode

    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      category === 'All' || book.category === category

    return correctType && matchesSearch && matchesCategory
  })

  const goBack = () => {
    setNotice('')
    setSelectedBook(null)
    setScreen('actions')
  }

  return (
    <div className="app">
      <header className="header">
        <button
          className="brand"
          onClick={() => setScreen('profile')}
        >
          PuthagamCircle<span>.</span>
        </button>

        <p>Every book has a story. Every reader belongs.</p>
      </header>

      <main className="main-content">

        {screen === 'profile' && (
          <section className="welcome-screen">
            <p className="eyebrow">A COMMUNITY OF READERS</p>

            <h2>
              Every story begins
              <br />
              with a reader.
            </h2>

            <p className="welcome-copy">
              Find books, share stories and connect with fellow readers.
            </p>

            <form
              className="profile-form"
              onSubmit={(event) => {
                event.preventDefault()
                setScreen('actions')
              }}
            >
              <label>
                Your name
                <input
                  required
                  value={user.name}
                  onChange={(e) =>
                    setUser({ ...user, name: e.target.value })
                  }
                  placeholder="Enter your name"
                />
              </label>

              <label>
                Contact number
                <input
                  required
                  type="tel"
                  value={user.contact}
                  onChange={(e) =>
                    setUser({ ...user, contact: e.target.value })
                  }
                  placeholder="Enter your contact number"
                />
                <small className="field-note">
                  Kept private in this prototype.
                </small>
              </label>

              <label>
                Your city or area
                <input
                  required
                  value={user.location}
                  onChange={(e) =>
                    setUser({ ...user, location: e.target.value })
                  }
                  placeholder="Example: Coimbatore"
                />
              </label>

              <button className="primary-button" type="submit">
                Continue <span>→</span>
              </button>
            </form>
          </section>
        )}

        {screen === 'actions' && (
          <section className="action-screen">
            <button
              className="back-link"
              onClick={() => setScreen('profile')}
            >
              ← Edit your details
            </button>

            <p className="eyebrow">
              WELCOME, {user.name.toUpperCase()}
            </p>

            <h2>What brings you here today?</h2>

            <p className="welcome-copy">
              However you choose to share a book, there's a place for you here.
            </p>

            <div className="action-grid">
              <button
                className="action-card"
                onClick={() => openBrowse('sale')}
              >
                <span className="action-number">01</span>
                <strong>Buy a book</strong>
                <small>Find your next favourite read</small>
                <span className="action-arrow">↗</span>
              </button>

              <button
                className="action-card"
                onClick={() => openForm('rent')}
              >
                <span className="action-number">02</span>
                <strong>Rent out</strong>
                <small>Make your books available for rent</small>
                <span className="action-arrow">↗</span>
              </button>

              <button
                className="action-card"
                onClick={() => openForm('sell')}
              >
                <span className="action-number">03</span>
                <strong>Sell a book</strong>
                <small>Give your books a new home</small>
                <span className="action-arrow">↗</span>
              </button>

              <button
                className="action-card"
                onClick={() => openBrowse('lend')}
              >
                <span className="action-number">04</span>
                <strong>Borrow a book</strong>
                <small>Explore books shared by readers</small>
                <span className="action-arrow">↗</span>
              </button>
            </div>
          </section>
        )}

        {screen === 'browse' && (
          <section className="library-screen">
            <button className="back-link" onClick={goBack}>
              ← Back to options
            </button>

            <p className="eyebrow">
              {activeMode === 'sale'
                ? 'FIND YOUR NEXT READ'
                : 'SHARED BY READERS'}
            </p>

            <h2>
              {activeMode === 'sale'
                ? 'Books for sale'
                : 'Books to borrow'}
            </h2>

            <p className="welcome-copy">
              {activeMode === 'sale'
                ? 'Explore books listed by our reading community.'
                : 'Discover books that readers are happy to lend.'}
            </p>

            <input
              className="library-search"
              type="text"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="category-list">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? 'active' : ''}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="section-heading">
              <h3>Explore the collection</h3>
              <span>{visibleBooks.length} books</span>
            </div>

            <div className="book-grid">
              {visibleBooks.length ? (
                visibleBooks.map((book) => (
                  <button
                    className="book-card"
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                  >
                    <BookCover book={book} />
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <span>{book.price}</span>
                  </button>
                ))
              ) : (
                <p className="empty-message">
                  No books found here yet. Try another search or category.
                </p>
              )}
            </div>
          </section>
        )}

        {screen === 'form' && (
          <section className="listing-screen">
            <button className="back-link" onClick={goBack}>
              ← Back to options
            </button>

            <p className="eyebrow">
              {activeMode === 'sell'
                ? 'PASS A STORY FORWARD'
                : 'SHARE YOUR BOOKS'}
            </p>

            <h2>
              {activeMode === 'sell'
                ? 'List a book for sale'
                : 'List a book for rent'}
            </h2>

            <p className="welcome-copy">
              Add a few details so other readers can discover your book.
            </p>

            <form
              className="listing-form"
              onSubmit={handleSubmitListing}
            >
              <label>
                Book title
                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    updateForm('title', e.target.value)
                  }
                  placeholder="Enter book name"
                />
              </label>

              <label>
                Author
                <input
                  required
                  value={form.author}
                  onChange={(e) =>
                    updateForm('author', e.target.value)
                  }
                  placeholder="Enter author's name"
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) =>
                    updateForm('category', e.target.value)
                  }
                >
                  {categories
                    .filter((item) => item !== 'All')
                    .map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                {activeMode === 'sell'
                  ? 'Selling price'
                  : 'Rental price'}
                <input
                  required
                  value={form.price}
                  onChange={(e) =>
                    updateForm('price', e.target.value)
                  }
                  placeholder="Example: ₹150"
                />
              </label>

              {activeMode === 'rent' && (
                <label>
                  Rental duration
                  <input
                    required
                    value={form.duration}
                    onChange={(e) =>
                      updateForm('duration', e.target.value)
                    }
                    placeholder="Example: 2 weeks"
                  />
                </label>
              )}

              <label>
                About the book
                <textarea
                  required
                  rows="4"
                  value={form.description}
                  onChange={(e) =>
                    updateForm('description', e.target.value)
                  }
                  placeholder="Condition, edition or other details..."
                />
              </label>

              <label>
                Book picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setImageFile(e.target.files?.[0] || null)
                  }
                />
                <small className="field-note">
                  Optional. Choose a picture from your device.
                </small>
              </label>

              <button className="primary-button" type="submit">
                Add my listing <span>→</span>
              </button>
            </form>
          </section>
        )}

        {screen === 'success' && (
          <section className="success-screen">
            <p className="success-mark">✓</p>

            <p className="eyebrow">
              A NEW STORY JOINED THE CIRCLE
            </p>

            <h2>Your book has been listed.</h2>

            <p className="welcome-copy">
              Your listing has been saved to the PuthagamCircle database.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                openBrowse(activeMode === 'sell' ? 'sale' : 'lend')
              }
            >
              View listing <span>→</span>
            </button>

            <button
              className="back-link centered-link"
              onClick={goBack}
            >
              Back to options
            </button>
          </section>
        )}

      </main>

      {selectedBook && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedBook(null)}
        >
          <div
            className="book-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedBook(null)}
              aria-label="Close details"
            >
              ×
            </button>

            <div className="details-panel">
              <BookCover book={selectedBook} />

              <div className="details-info">
                <span className="details-category">
                  {selectedBook.category}
                </span>

                <h2>{selectedBook.title}</h2>

                <p className="details-author">
                  By {selectedBook.author}
                </p>

                <div className="details-divider" />

                <h3>About the book</h3>

                <p className="details-description">
                  {selectedBook.description}
                </p>

                <div className="details-divider" />

                <p><strong>{selectedBook.price}</strong></p>

                {selectedBook.duration && (
                  <p>Duration: {selectedBook.duration}</p>
                )}

                <p>Listed by: {selectedBook.owner}</p>
                <p>Area: {selectedBook.location}</p>

                <small className="field-note">
                  Contact details are not displayed publicly in this prototype.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>PuthagamCircle © 2026</p>
        <span>Made for the love of books.</span>
      </footer>
    </div>
  )
}

export default App
