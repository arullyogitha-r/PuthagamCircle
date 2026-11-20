import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000/api/books'

const initialBooks = [
  { id: 'd1', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', isbn: '9780062315007', description: 'A young shepherd travels in search of his personal legend, discovering the importance of dreams, courage and listening to your heart.', type: 'sale', price: 180, owner: 'Book Community', location: 'Pollachi' },
  { id: 'd2', title: 'Atomic Habits', author: 'James Clear', category: 'Self Help', isbn: '9780735211292', description: 'A practical guide to building good habits and breaking bad ones through small, consistent changes.', type: 'sale', price: 250, owner: 'Book Community', location: 'Pollachi' },
  { id: 'd3', title: 'Ikigai', author: 'Hector Garcia', category: 'Self Help', isbn: '9780143127832', description: 'Discover the Japanese concept of finding purpose, happiness and meaning in everyday life.', type: 'sale', price: 200, owner: 'Book Community', location: 'Pollachi' },
  { id: 'd4', title: 'Wings of Fire', author: 'A. P. J. Abdul Kalam', category: 'Biography', isbn: '9788173711466', description: 'The inspiring autobiography of Dr. APJ Abdul Kalam and his journey from a humble childhood to becoming a scientist.', type: 'lend', price: 0, owner: 'Book Community', location: 'Pollachi' },
  { id: 'd5', title: 'Ponniyin Selvan', author: 'Kalki Krishnamurthy', category: 'Historical', isbn: '9789354402459', description: 'A legendary historical novel filled with adventure, intrigue and the fascinating world of the Chola dynasty.', type: 'lend', price: 0, owner: 'Book Community', location: 'Pollachi' },
  { id: 'd6', title: 'The Psychology of Money', author: 'Morgan Housel', category: 'Finance', isbn: '9780857197689', description: 'Timeless lessons about wealth, money, behaviour and making better financial decisions.', type: 'lend', price: 0, owner: 'Book Community', location: 'Pollachi' },
]

function getCover(book) {
  if (book.imageUrl) return book.imageUrl
  if (book.isbn) return `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`
  return ''
}

function BookCover({ book, large = false }) {
  const [failed, setFailed] = useState(false)
  const cover = getCover(book)

  return (
    <div className={`book-cover ${large ? 'book-cover-large' : ''}`}>
      {cover && !failed ? (
        <img
          src={cover}
          alt={book.title}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="cover-placeholder">
          <span>📖</span>
          <strong>{book.title}</strong>
          <small>{book.author}</small>
        </div>
      )}
    </div>
  )
}

function App() {
  const [page, setPage] = useState('welcome')
  const [user, setUser] = useState({
    name: '',
    contact: '',
    location: ''
  })
  const [books, setBooks] = useState(initialBooks)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [mode, setMode] = useState('all')
  const [selectedBook, setSelectedBook] = useState(null)
  const [notice, setNotice] = useState('')
  const [requests, setRequests] = useState([])
  const [requestLoading, setRequestLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    author: '',
    category: 'Fiction',
    description: '',
    type: 'sale',
    price: '',
    duration: '',
    isbn: '',
    imageUrl: ''
  })

  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error('API unavailable')
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setBooks([...data, ...initialBooks])
        }
      })
      .catch(() => {
        setBooks(initialBooks)
      })
  }, [])

  const categories = [
    'All',
    ...new Set(books.map(book => book.category).filter(Boolean))
  ]

  const filteredBooks = books.filter(book => {
    const text = `${book.title} ${book.author} ${book.category}`.toLowerCase()
    const matchesSearch = text.includes(search.toLowerCase())
    const matchesCategory = category === 'All' || book.category === category
    const matchesMode = mode === 'all' || book.type === mode

    return matchesSearch && matchesCategory && matchesMode
  })

  const saleBooks = books.filter(book => book.type === 'sale')
  const lendBooks = books.filter(book => book.type === 'lend')

  function startApp() {
    if (!user.name.trim()) {
      setNotice('Please enter your name to continue.')
      return
    }

    setNotice('')
    setPage('dashboard')
  }

  function openBrowse(selectedMode = 'all') {
    setMode(selectedMode)
    setCategory('All')
    setSearch('')
    setPage('browse')
  }

  function openListing(type) {
    setForm({
      title: '',
      author: '',
      category: 'Fiction',
      description: '',
      type,
      price: '',
      duration: '',
      isbn: '',
      imageUrl: ''
    })

    setPage('listing')
  }

  async function submitInterest(book) {
    if (!book) return

    setRequestLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          book_id: book.id,
          book_title: book.title,
          interested_name: user.name || 'Guest',
          interested_location: user.location || '',
          request_type: book.type === 'sale' ? 'buy' : 'borrow'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setNotice(`Interest registered! Request ID: ${data.request_id}`)
      setSelectedBook(null)
    } catch (error) {
      setNotice('Could not register interest. Please try again.')
    } finally {
      setRequestLoading(false)
    }
  }

  async function loadRequests() {
    try {
      const response = await fetch('http://localhost:5000/api/interests')

      if (!response.ok) {
        throw new Error('Failed')
      }

      const data = await response.json()
      setRequests(data)
      setNotice('')
      setPage('requests')
    } catch {
      setNotice('Unable to load requests. Check the backend.')
    }
  }

  async function submitListing(e) {
    e.preventDefault()

    const newBook = {
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category,
      description: form.description.trim(),
      type: form.type,
      price: Number(form.price) || 0,
      duration: form.duration,
      isbn: form.isbn.trim(),
      imageUrl: form.imageUrl.trim(),
      owner: user.name || 'Community Member',
      location: user.location || 'Not specified'
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBook)
      })

      if (!response.ok) {
        throw new Error('Could not save listing')
      }

      const saved = await response.json()

      setBooks(prev => [{ ...newBook, ...saved }, ...prev])
      setNotice('')
      setPage('success')
    } catch (error) {
      setNotice('Unable to connect to the server. Please make sure the backend is running.')
    }
  }

  async function deleteBook(book) {
    if (String(book.id).startsWith('d')) {
      setBooks(prev => prev.filter(item => item.id !== book.id))
      setSelectedBook(null)
      return
    }

    try {
      const response = await fetch(`${API_URL}/${book.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      setBooks(prev => prev.filter(item => item.id !== book.id))
      setSelectedBook(null)
    } catch {
      setNotice('Could not remove this listing.')
    }
  }

  function goBack() {
    setNotice('')

    if (
      page === 'browse' ||
      page === 'listing' ||
      page === 'success' ||
      page === 'requests'
    ) {
      setPage('dashboard')
    } else {
      setPage('welcome')
    }
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <button
          className="brand"
          onClick={() => setPage(user.name ? 'dashboard' : 'welcome')}
        >
          <span className="brand-icon">P</span>
          <span className="brand-name">
            Puthagam<span>Circle</span>
          </span>
        </button>

        <nav className="nav-links">
          {user.name && (
            <>
              <button onClick={() => setPage('dashboard')}>Home</button>
              <button onClick={() => openBrowse('all')}>Explore Books</button>
              <button onClick={() => openListing('sale')}>List a Book</button>
              <button onClick={loadRequests}>Requests</button>
            </>
          )}
        </nav>

        {user.name && (
          <button
            className="profile-pill"
            onClick={() => setPage('welcome')}
          >
            <span className="avatar">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span>{user.name.split(' ')[0]}</span>
          </button>
        )}
      </header>

      {notice && (
        <div className="notice">
          {notice}
          <button onClick={() => setNotice('')}>×</button>
        </div>
      )}

      {/* WELCOME PAGE */}
      {page === 'welcome' && (
        <main className="welcome-page">
          <section className="welcome-hero">
            <div className="hero-content">
              <div className="eyebrow">
                <span>✦</span> A COMMUNITY FOR EVERY BOOK LOVER
              </div>

              <h1>
                Stories are better<br />
                when they're <em>shared.</em>
              </h1>

              <p>
                Discover your next favourite read, give books a new home,
                and connect with people who love stories as much as you do.
              </p>

              <div className="hero-buttons">
                <button
                  className="btn-primary"
                  onClick={() =>
                    document.getElementById('profile-form')?.scrollIntoView({
                      behavior: 'smooth'
                    })
                  }
                >
                  Join the Circle <span>→</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    setUser({
                      name: 'Guest',
                      contact: '',
                      location: ''
                    })
                    setPage('dashboard')
                  }}
                >
                  Explore as Guest
                </button>
              </div>

              <div className="hero-trust">
                <span>📚</span> Buy · Sell · Borrow · Share
              </div>
            </div>

            <div className="hero-art">
              <div className="art-circle"></div>

              <div className="art-book art-book-one">
                <div className="book-art-title">
                  The<br />Art of<br />Reading
                </div>
                <div className="book-art-sub">
                  A little more magic<br />in every page
                </div>
              </div>

              <div className="art-book art-book-two">
                <div className="book-art-title">
                  Stories<br />That Stay
                </div>
                <div className="book-art-sub">
                  Find your next<br />chapter
                </div>
              </div>

              <div className="art-book art-book-three">
                <div className="book-art-title">
                  One<br />More<br />Chapter
                </div>
              </div>

              <div className="art-spark spark-one">✦</div>
              <div className="art-spark spark-two">✧</div>

              <div className="art-note">
                A book shared<br />is a story continued.
              </div>
            </div>
          </section>

          <section className="welcome-stats">
            <div>
              <strong>Discover</strong>
              <span>Books you'll love</span>
            </div>
            <div>
              <strong>Exchange</strong>
              <span>Stories & knowledge</span>
            </div>
            <div>
              <strong>Connect</strong>
              <span>Readers like you</span>
            </div>
          </section>

          <section className="profile-section" id="profile-form">
            <div className="profile-copy">
              <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>
              <h2>
                Come on in.<br />
                <em>There's a book for you.</em>
              </h2>
              <p>Just a few details to get you started in our reading community.</p>
            </div>

            <form
              className="profile-form"
              onSubmit={e => {
                e.preventDefault()
                startApp()
              }}
            >
              <h3>Create your reader profile</h3>

              <label>
                Your name
                <input
                  value={user.name}
                  onChange={e => setUser({ ...user, name: e.target.value })}
                  placeholder="What should we call you?"
                  required
                />
              </label>

              <label>
                Contact number
                <input
                  value={user.contact}
                  onChange={e => setUser({ ...user, contact: e.target.value })}
                  placeholder="Your phone number"
                />
              </label>

              <label>
                Your location
                <input
                  value={user.location}
                  onChange={e => setUser({ ...user, location: e.target.value })}
                  placeholder="City / town"
                />
              </label>

              <button className="btn-primary btn-full" type="submit">
                Enter PuthagamCircle <span>→</span>
              </button>

              <small>Your information is used only to personalize your experience.</small>
            </form>
          </section>

          <footer className="footer">
            <span>📚 PuthagamCircle</span>
            <span>Every book deserves another reader.</span>
          </footer>
        </main>
      )}

      {/* DASHBOARD */}
      {page === 'dashboard' && (
        <main className="dashboard-page">
          <section className="dashboard-hero">
            <div>
              <span className="eyebrow">YOUR BOOK COMMUNITY</span>

              <h1>
                Hello, {user.name.split(' ')[0]} <span>✦</span>
              </h1>

              <p>What story are you looking for today?</p>

              <div className="dashboard-search">
                <span>⌕</span>
                <input
                  placeholder="Search books, authors, genres..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && openBrowse('all')}
                />
                <button onClick={() => openBrowse('all')}>Search</button>
              </div>
            </div>

            <div className="dashboard-illustration">
              <div className="dash-book dash-book-a">READ<br />MORE</div>
              <div className="dash-book dash-book-b">SHARE<br />STORIES</div>
              <div className="dash-book dash-book-c">FIND<br />YOUR<br />NEXT</div>
              <span>✦</span>
            </div>
          </section>

          <section className="quick-actions">
            <button
              className="quick-card quick-buy"
              onClick={() => openBrowse('sale')}
            >
              <span className="quick-icon">🛍️</span>
              <span>
                <strong>Find Books</strong>
                <small>Discover books for sale</small>
              </span>
              <b>→</b>
            </button>

            <button
              className="quick-card quick-borrow"
              onClick={() => openBrowse('lend')}
            >
              <span className="quick-icon">🤝</span>
              <span>
                <strong>Borrow Books</strong>
                <small>Read without buying</small>
              </span>
              <b>→</b>
            </button>

            <button
              className="quick-card quick-list"
              onClick={() => openListing('sale')}
            >
              <span className="quick-icon">＋</span>
              <span>
                <strong>List Your Book</strong>
                <small>Sell or lend a book</small>
              </span>
              <b>→</b>
            </button>
          </section>

          <section className="shelf-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">HANDPICKED FOR YOU</span>
                <h2>Explore the shelves</h2>
              </div>

              <button className="text-link" onClick={() => openBrowse('all')}>
                View all books →
              </button>
            </div>

            <div className="book-grid">
              {books.slice(0, 4).map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => setSelectedBook(book)}
                />
              ))}
            </div>
          </section>

          <section className="community-banner">
            <div>
              <span className="eyebrow">PASS IT ON</span>
              <h2>
                Finished reading?<br />
                Let someone else fall in love.
              </h2>
              <p>Give your books another chapter in someone else's life.</p>
            </div>

            <button className="btn-light" onClick={() => openListing('lend')}>
              Share a book <span>→</span>
            </button>
          </section>

          <footer className="footer">
            <span>📚 PuthagamCircle</span>
            <span>Every book deserves another reader.</span>
          </footer>
        </main>
      )}

      {/* BROWSE PAGE */}
      {page === 'browse' && (
        <main className="browse-page">
          <button className="back-link" onClick={goBack}>
            ← Back to home
          </button>

          <div className="browse-heading">
            <span className="eyebrow">THE COMMUNITY LIBRARY</span>
            <h1>
              Find your next <em>read.</em>
            </h1>
            <p>Explore books shared by our reading community.</p>
          </div>

          <div className="browse-controls">
            <div className="search-box">
              <span>⌕</span>
              <input
                placeholder="Search title, author or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="all">All books</option>
              <option value="sale">For sale</option>
              <option value="lend">For borrowing</option>
            </select>
          </div>

          <div className="category-list">
            {categories.map(cat => (
              <button
                key={cat}
                className={category === cat ? 'category-active' : ''}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="browse-result-count">
            {filteredBooks.length} books found
          </div>

          {filteredBooks.length ? (
            <div className="book-grid browse-grid">
              {filteredBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => setSelectedBook(book)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>📚</span>
              <h3>No books found</h3>
              <p>Try another search or category.</p>
              <button
                className="btn-primary"
                onClick={() => {
                  setSearch('')
                  setCategory('All')
                  setMode('all')
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          <footer className="footer">
            <span>📚 PuthagamCircle</span>
            <span>Every book deserves another reader.</span>
          </footer>
        </main>
      )}

      {/* LISTING PAGE */}
      {page === 'listing' && (
        <main className="listing-page">
          <button className="back-link" onClick={goBack}>
            ← Back to home
          </button>

          <div className="listing-layout">
            <div className="listing-copy">
              <span className="eyebrow">GIVE YOUR BOOK A NEW CHAPTER</span>

              <h1>
                Share a story.<br />
                <em>Make someone's day.</em>
              </h1>

              <p>Your books can find new readers, new homes, and new adventures.</p>

              <div className="listing-tip">
                📚 <span>Books are meant to be read. Let's keep them moving!</span>
              </div>
            </div>

            <form className="listing-form" onSubmit={submitListing}>
              <h2>Book details</h2>

              <div className="form-row">
                <label>
                  Book title
                  <input
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter book title"
                  />
                </label>

                <label>
                  Author
                  <input
                    value={form.author}
                    onChange={e => setForm({ ...form, author: e.target.value })}
                    placeholder="Author name"
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {[
                      'Fiction',
                      'Self Help',
                      'Biography',
                      'Science',
                      'Technology',
                      'Finance',
                      'Historical',
                      'Romance',
                      'Fantasy',
                      'Other'
                    ].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Listing type
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="sale">Sell</option>
                    <option value="lend">Lend</option>
                  </select>
                </label>
              </div>

              {form.type === 'sale' ? (
                <label>
                  Price (₹)
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="Enter price"
                  />
                </label>
              ) : (
                <label>
                  Borrowing duration
                  <input
                    value={form.duration}
                    onChange={e => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 2 weeks"
                  />
                </label>
              )}

              <label>
                Description
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell readers a little about this book..."
                />
              </label>

              <div className="form-row">
                <label>
                  ISBN (optional)
                  <input
                    value={form.isbn}
                    onChange={e => setForm({ ...form, isbn: e.target.value })}
                    placeholder="ISBN number"
                  />
                </label>

                <label>
                  Cover image URL (optional)
                  <input
                    value={form.imageUrl}
                    onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </label>
              </div>

              <button className="btn-primary btn-full" type="submit">
                Publish my listing <span>→</span>
              </button>
            </form>
          </div>

          <footer className="footer">
            <span>📚 PuthagamCircle</span>
            <span>Every book deserves another reader.</span>
          </footer>
        </main>
      )}

      {/* SUCCESS PAGE */}
      {page === 'success' && (
        <main className="success-page">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <span className="eyebrow">THAT'S A WRAP!</span>

            <h1>
              Your book is now<br />
              <em>in the circle.</em>
            </h1>

            <p>
              Your listing has been added to the community library.
              Thanks for sharing!
            </p>

            <button className="btn-primary" onClick={() => openBrowse('all')}>
              Explore the library →
            </button>

            <button className="text-link" onClick={() => openListing('sale')}>
              List another book
            </button>
          </div>
        </main>
      )}

      {/* REQUESTS PAGE */}
      {page === 'requests' && (
        <main className="browse-page">
          <button
            className="back-link"
            onClick={() => setPage('dashboard')}
          >
            ← Back to dashboard
          </button>

          <div className="browse-heading">
            <span className="eyebrow">COMMUNITY ACTIVITY</span>
            <h1>
              Book <em>requests.</em>
            </h1>
            <p>Interest registered by readers in our community.</p>
          </div>

          <div className="browse-result-count">
            {requests.length} request(s) registered
          </div>

          {requests.length === 0 ? (
            <div className="empty-state">
              <span>📚</span>
              <h3>No requests yet</h3>
              <p>Interest in buying or borrowing books will appear here.</p>

              <button
                className="btn-primary"
                onClick={() => openBrowse('all')}
              >
                Explore books
              </button>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map(request => (
                <div className="request-card" key={request.id}>
                  <div className="request-icon">
                    {request.request_type === 'buy' ? '🛍️' : '🤝'}
                  </div>

                  <div className="request-info">
                    <h3>{request.book_title}</h3>

                    <p>
                      {request.interested_name}
                      {request.interested_location
                        ? ` · ${request.interested_location}`
                        : ''}
                    </p>

                    <small>
                      {request.created_at
                        ? new Date(request.created_at + 'Z').toLocaleString()
                        : 'Recently submitted'}
                    </small>
                  </div>

                  <span
                    className={`book-tag ${
                      request.request_type === 'buy'
                        ? 'tag-sale'
                        : 'tag-lend'
                    }`}
                  >
                    {request.request_type === 'buy'
                      ? 'BUY REQUEST'
                      : 'BORROW REQUEST'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <footer className="footer">
            <span>📚 PuthagamCircle</span>
            <span>Every book deserves another reader.</span>
          </footer>
        </main>
      )}

      {/* BOOK DETAILS MODAL */}
      {selectedBook && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedBook(null)}
        >
          <div
            className="book-modal"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedBook(null)}
            >
              ×
            </button>

            <BookCover book={selectedBook} large />

            <div className="modal-content">
              <span
                className={`book-tag ${
                  selectedBook.type === 'sale'
                    ? 'tag-sale'
                    : 'tag-lend'
                }`}
              >
                {selectedBook.type === 'sale'
                  ? 'FOR SALE'
                  : 'AVAILABLE TO BORROW'}
              </span>

              <h2>{selectedBook.title}</h2>

              <p className="modal-author">
                by {selectedBook.author || 'Unknown author'}
              </p>

              <p className="modal-description">
                {selectedBook.description ||
                  'A book waiting to find its next reader.'}
              </p>

              <div className="modal-details">
                <div>
                  <small>Category</small>
                  <strong>{selectedBook.category || 'General'}</strong>
                </div>

                <div>
                  <small>Owner</small>
                  <strong>{selectedBook.owner || 'Community Member'}</strong>
                </div>

                <div>
                  <small>Location</small>
                  <strong>{selectedBook.location || 'Not specified'}</strong>
                </div>
              </div>

              {selectedBook.type === 'sale' && (
                <div className="modal-price">
                  ₹{selectedBook.price}
                </div>
              )}

              {selectedBook.type === 'lend' && selectedBook.duration && (
                <div className="modal-price duration-price">
                  {selectedBook.duration}
                </div>
              )}

              <button
                className="btn-primary btn-full"
                disabled={requestLoading}
                onClick={() => submitInterest(selectedBook)}
              >
                {requestLoading
                  ? 'Submitting...'
                  : selectedBook.type === 'sale'
                    ? 'Confirm buying interest'
                    : 'Request to borrow'}

                {!requestLoading && <span>→</span>}
              </button>

              {selectedBook.owner === user.name && (
                <button
                  className="delete-link"
                  onClick={() => deleteBook(selectedBook)}
                >
                  Remove my listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookCard({ book, onClick }) {
  return (
    <button className="book-card" onClick={onClick}>
      <BookCover book={book} />

      <div className="book-card-info">
        <span
          className={`book-tag ${
            book.type === 'sale' ? 'tag-sale' : 'tag-lend'
          }`}
        >
          {book.type === 'sale' ? 'FOR SALE' : 'BORROW'}
        </span>

        <h3>{book.title}</h3>
        <p>{book.author || 'Unknown author'}</p>

        <div className="book-card-bottom">
          <strong>
            {book.type === 'sale'
              ? `₹${book.price || 0}`
              : 'Free to borrow'}
          </strong>
          <span>→</span>
        </div>
      </div>
    </button>
  )
}

export default App