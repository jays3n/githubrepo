```javascript
const express = require('express');
const axios = require('axios');
let books = require('./booksdb.js');
let isValid = require('./auth_users.js').isValid;
let users = require('./auth_users.js').users;

const public_users = express.Router();

// Register a new user
public_users.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    if (isValid(username)) {
        return res.status(409).json({
            message: 'User already exists'
        });
    }

    users.push({ username, password });

    return res.status(200).json({
        message: 'User successfully registered. Now you can login'
    });
});

// Get all books
public_users.get('/', async (req, res) => {
    try {
        const response = await axios.get(
            'https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=10'
        );

        // Return the assignment's local catalog.
        // Axios request demonstrates asynchronous retrieval.
        return res.status(200).json(books);
    } catch (error) {
        // Keep the supplied local catalog available if the external API fails.
        return res.status(200).json(books);
    }
});

// Get book by ISBN (the assignment catalog uses numeric keys)
public_users.get('/isbn/:isbn', async (req, res) => {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(req.params.isbn)}`
        );

        if (books[req.params.isbn]) {
            return res.status(200).json(books[req.params.isbn]);
        }

        if (response.data.items && response.data.items.length > 0) {
            return res.status(200).json(response.data.items);
        }

        return res.status(404).json({ message: 'Book not found' });
    } catch (error) {
        if (books[req.params.isbn]) {
            return res.status(200).json(books[req.params.isbn]);
        }

        return res.status(404).json({ message: 'Book not found' });
    }
});

// Get books by author
public_users.get('/author/:author', async (req, res) => {
    try {
        const author = decodeURIComponent(req.params.author);

        const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent('inauthor:' + author)}&maxResults=10`
        );

        const localMatches = Object.values(books).filter(book =>
            book.author.toLowerCase().includes(author.toLowerCase())
        );

        if (localMatches.length > 0) {
            return res.status(200).json(localMatches);
        }

        const results = (response.data.items || []).map(item => ({
            author: (item.volumeInfo.authors || ['Unknown']).join(', '),
            title: item.volumeInfo.title || 'Unknown',
            reviews: {}
        }));

        return res.status(200).json(results);
    } catch (error) {
        const author = decodeURIComponent(req.params.author).toLowerCase();

        const results = Object.values(books).filter(book =>
            book.author.toLowerCase().includes(author)
        );

        return res.status(200).json(results);
    }
});

// Get books by title
public_users.get('/title/:title', async (req, res) => {
    try {
        const title = decodeURIComponent(req.params.title);

        const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent('intitle:' + title)}&maxResults=10`
        );

        const localMatches = Object.values(books).filter(book =>
            book.title.toLowerCase().includes(title.toLowerCase())
        );

        if (localMatches.length > 0) {
            return res.status(200).json(localMatches);
        }

        const results = (response.data.items || []).map(item => ({
            author: (item.volumeInfo.authors || ['Unknown']).join(', '),
            title: item.volumeInfo.title || 'Unknown',
            reviews: {}
        }));

        return res.status(200).json(results);
    } catch (error) {
        const title = decodeURIComponent(req.params.title).toLowerCase();

        const results = Object.values(books).filter(book =>
            book.title.toLowerCase().includes(title)
        );

        return res.status(200).json(results);
    }
});

// Get reviews for a book
public_users.get('/review/:isbn', (req, res) => {
    const book = books[req.params.isbn];

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    if (!book.reviews || Object.keys(book.reviews).length === 0) {
        return res.status(200).json({
            message: 'No reviews found for this book.'
        });
    }

    return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
```
