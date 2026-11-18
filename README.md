\# PuthagamCircle 📚



\*\*PuthagamCircle\*\* is a book-sharing platform designed to connect readers and make books more accessible through buying, selling, renting, and lending.



\## Features



\- \*\*Browse Books:\*\* Explore the available books on the platform.

\- \*\*Buy Books:\*\* Find books you would like to purchase.

\- \*\*Rent Books:\*\* Access books for a temporary period.

\- \*\*Sell Books:\*\* Make your books available to other readers.

\- \*\*Lend Books:\*\* Share books with other members.

\- \*\*Book Management:\*\* Add and manage book details.

\- \*\*Data Persistence:\*\* Store book information using an SQLite database.



\## Technologies Used



\### Frontend

\- React.js

\- Vite

\- CSS



\### Backend

\- Node.js

\- Express.js

\- SQLite

\- Better-SQLite3



\## Project Structure



```text

PuthagamCircle/

├── client/

│   ├── src/

│   └── package.json

├── server/

│   ├── server.js

│   └── package.json

├── server.js

├── package.json

└── README.md

```



\## Installation and Setup



\### 1. Clone the repository



```bash

git clone YOUR\_GITHUB\_REPOSITORY\_URL

```



\### 2. Navigate to the project folder



```bash

cd PuthagamCircle

```



\### 3. Install dependencies



```bash

npm install

```



Install backend dependencies:



```bash

cd server

npm install

```



\### 4. Start the backend



```bash

node server.js

```



\### 5. Start the frontend



Open another terminal:



```bash

cd client

npm install

npm run dev

```



Open the local URL displayed by Vite in your browser.



\## Database



PuthagamCircle uses SQLite to store book information locally, allowing entered book details to persist between sessions.



\## Project Objective



The objective of PuthagamCircle is to encourage book circulation, connect readers, and provide a convenient platform for buying, selling, renting, and lending books.



\---



\*\*PuthagamCircle – Read, Share, and Connect.\*\*

