process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testBook;

beforeEach(async function () {

    const result = await db.query(
        `INSERT INTO books (
            isbn, amazon_url, author, language, pages, publisher, title, year) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`,
        [
            "0691161518",
            "http://a.co/eobPtX2",
            "Matthew Lane",
            "english",
            264,
            "Princeton University Press",
            "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            2017
        ]
    );

    testBook = result.rows[0];
});


/* GET /books - returns `{books: [{book}, ...]}` */
describe("GET /books", function () {
    test("Gets a list of the books in DB", async function () {
        const response = await request(app).get(`/books`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            books: [{
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "language": "english",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                "year": 2017
            }]});
    });
});


/* POST /books - create book from data; return `{book: book}` */
describe("POST /books", function () {
    test("Creates a new book", async function () {
        const response = await request(app)
            .post(`/books`)
            .send({
                "isbn": "0735211299",
                "amazon_url": "https://www.amazon.com/gp/product/0735211299/ref=ewc_pr_img_1?smid=ATVPDKIKX0DER&psc=1",
                "author": "James Clear",
                "language": "english",
                "pages": 320,
                "publisher": "Avery",
                "title": "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
                "year": 2018
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            book: {
                "isbn": "0735211299",
                "amazon_url": "https://www.amazon.com/gp/product/0735211299/ref=ewc_pr_img_1?smid=ATVPDKIKX0DER&psc=1",
                "author": "James Clear",
                "language": "english",
                "pages": 320,
                "publisher": "Avery",
                "title": "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
                "year": 2018
            }
        });
    });

    test("Can't create new book. Data isn't valid.", async function () {
        const response = await request(app).post(`/books`)
            .send({
                "isbn": "0735211299",
                "amazon_url": "https://www.amazon.com/gp/product/0735211299/ref=ewc_pr_img_1?smid=ATVPDKIKX0DER&psc=1",
                "author": "James Clear",
                "language": "english",
                "pages": "320",
                "publisher": "Avery",
                "title": "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
                "year": 2018
            });
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            error: {
                message: ["instance.pages is not of a type(s) integer"],
                status: 400
            }
        });
    });
});


/* GET /books/:isbn - return data about one book: `{book: book}` */
describe("GET /books/:isbn", function () {
    test("Gets a single book", async function () {
        const response = await request(app).get(`/books/${testBook.isbn}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ book: testBook });
    });

    test("Responds with 404 if can't find book", async function () {
        const response = await request(app).get(`/books/0000000000`);
        expect(response.statusCode).toEqual(404);
    });
});


/* PUT /books/:isbn - update book; return `{book: book}` */
describe("PUT /books/:isbn", function () {
    test("Updates a single book", async function () {
        const response = await request(app)
            .put(`/books/${testBook.isbn}`)
            .send({
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "language": "english",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "POWER-UP: Unlocking the Hidden Mathematics in Video Games",
                "year": 2017
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            book: {
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "language": "english",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "POWER-UP: Unlocking the Hidden Mathematics in Video Games",
                "year": 2017
            }
        });
    });

    test("Invalid Input Data.", async function () {
        const response = await request(app)
            .put(`/books/${testBook.isbn}`)
            .send({
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "language": "english",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                "year": "2017"
            });
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            error: {
                message: ["instance.year is not of a type(s) integer"],
                status: 400
            }
        });
    });

    test("Responds with 404 if can't find book", async function () {
        const response = await request(app)
            .put(`/books/0000000000`)
            .send({
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "language": "english",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                "year": 2017
            });
        expect(response.statusCode).toEqual(404);
    });
});


/* DELETE /books/:isbn - delete book, return `{error: {message, status}}` */
describe("DELETE /books/:isbn", function () {
    test("Deletes a single book", async function () {
        const response = await request(app)
            .delete(`/books/${testBook.isbn}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            message: "Book deleted"
        });
    });

    test("Book doesn't exist", async function () {
        const response = await request(app)
            .delete(`/books/0000000000`);
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: "There is no book with an isbn '0000000000'",
                status: 404
            }
        });
    });
});


afterEach(async function () {
    await db.query("DELETE FROM books");
});


afterAll(async function () {
    await db.end();
});
