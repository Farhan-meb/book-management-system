# Book Management System

A simple RESTful API for managing books and authors, built with [NestJS](https://nestjs.com/) and Prisma ORM.

## Features

- Manage authors and books with full CRUD operations
- Pagination and search for listing endpoints
- Data validation with class-validator
- Error handling with meaningful HTTP status codes
- Relational database (MySQL, but can be adapted to SQLite/Postgres)
- Unit and end-to-end (e2e) tests

## Tech Stack

- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma
- **Database:** MySQL (default, can be changed)
- **Validation:** class-validator, class-transformer
- **Testing:** Jest, Supertest

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/book-management-system.git
cd book-management-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=4000
DATABASE_URL="mysql://user:password@localhost:3306/dbname"
```

- Replace the `DATABASE_URL` with your actual database connection string.

### 4. Set up the database

Run Prisma migrations to set up the schema:

```bash
npx prisma migrate deploy
```

Or, for development:

```bash
npx prisma migrate dev
```

### 5. Start the server

```bash
npm run start:dev
```

The API will be available at [http://localhost:4000](http://localhost:4000)

## Running Tests

### Unit tests

```bash
npm test
```

### End-to-end (e2e) tests

```bash
npm run test:e2e
```

## API Endpoints

### Authors

- **POST** `/authors` — Create a new author
- **GET** `/authors` — List authors (`?page=1&limit=10&search=John`)
- **GET** `/authors/:id` — Get author by ID
- **PATCH** `/authors/:id` — Update author
- **DELETE** `/authors/:id` — Delete author

### Books

- **POST** `/books` — Create a new book
- **GET** `/books` — List books (`?page=1&limit=10&search=Novel&authorId=...`)
- **GET** `/books/:id` — Get book by ID
- **PATCH** `/books/:id` — Update book
- **DELETE** `/books/:id` — Delete book

### Example Requests

**Create Author**

```http
POST http://localhost:4000/authors
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "A great author",
  "birthDate": "1980-01-01"
}
```

**Create Book**

```http
POST http://localhost:4000/books
Content-Type: application/json

{
  "title": "The Great Novel",
  "isbn": "978-3-16-148410-0",
  "publishedDate": "2023-01-01",
  "genre": "Fiction",
  "authorId": "author-id-here"
}
```

## License

MIT
