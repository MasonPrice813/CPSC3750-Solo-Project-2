// ---- Default Book Collection ----
const defaultBooks = [
  { id: 1, title: "The Hobbit", author: "J.R.R. Tolkien", year: 1937 },
  { id: 2, title: "1984", author: "George Orwell", year: 1949 },
  { id: 3, title: "Fahrenheit 451", author: "Ray Bradbury", year: 1953 },
  { id: 4, title: "Dune", author: "Frank Herbert", year: 1965 },
  { id: 5, title: "The Catcher in the Rye", author: "J.D. Salinger", year: 1951 },
  { id: 6, title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960 },
  { id: 7, title: "Moby-Dick", author: "Herman Melville", year: 1851 },
  { id: 8, title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925 },
  { id: 9, title: "Brave New World", author: "Aldous Huxley", year: 1932 },
  { id: 10, title: "The Road", author: "Cormac McCarthy", year: 2006 },
  { id: 11, title: "The Martian", author: "Andy Weir", year: 2011 },
  { id: 12, title: "Harry Potter 1", author: "J.K. Rowling", year: 1997 },
  { id: 13, title: "Harry Potter 2", author: "J.K. Rowling", year: 1998 },
  { id: 14, title: "Harry Potter 3", author: "J.K. Rowling", year: 1999 },
  { id: 15, title: "Harry Potter 4", author: "J.K. Rowling", year: 2000 },
  { id: 16, title: "Harry Potter 5", author: "J.K. Rowling", year: 2003 },
  { id: 17, title: "The Name of the Wind", author: "Patrick Rothfuss", year: 2007 },
  { id: 18, title: "Mistborn", author: "Brandon Sanderson", year: 2006 },
  { id: 19, title: "The Way of Kings", author: "Brandon Sanderson", year: 2010 },
  { id: 20, title: "Ender's Game", author: "Orson Scott Card", year: 1985 },
  { id: 21, title: "Neuromancer", author: "William Gibson", year: 1984 },
  { id: 22, title: "Snow Crash", author: "Neal Stephenson", year: 1992 },
  { id: 23, title: "The Shining", author: "Stephen King", year: 1977 },
  { id: 24, title: "It", author: "Stephen King", year: 1986 },
  { id: 25, title: "Carrie", author: "Stephen King", year: 1974 },
  { id: 26, title: "The Giver", author: "Lois Lowry", year: 1993 },
  { id: 27, title: "Animal Farm", author: "George Orwell", year: 1945 },
  { id: 28, title: "The Alchemist", author: "Paulo Coelho", year: 1988 },
  { id: 29, title: "Ready Player One", author: "Ernest Cline", year: 2011 },
  { id: 30, title: "American Gods", author: "Neil Gaiman", year: 2001 }
];

// ---- Load or Initialize Local Storage ----
let books = JSON.parse(localStorage.getItem("books")) || defaultBooks;
saveBooks();

// ---- Persist to localStorage ----
function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
}

// ---- Rendering: List View with Number Column ----
function renderList() {
  const container = document.getElementById("listView");
  if (!container) return;

  container.innerHTML = "";

  if (books.length === 0) {
    container.innerHTML = "<p>No books found.</p>";
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <tr>
      <th>#</th>
      <th>Title</th>
      <th>Author</th>
      <th>Year</th>
      <th>Actions</th>
    </tr>
  `;

  books.forEach((book, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.year}</td>
      <td>
        <button onclick="editBook(${book.id})">Edit</button>
        <button onclick="deleteBook(${book.id})">Delete</button>
      </td>
    `;
    table.appendChild(row);
  });

  container.appendChild(table);
}

// ---- Add Book with Number Validation ----
function addBook() {
  const title = prompt("Book Title:");
  const author = prompt("Author:");

  if (!title || !author) {
    alert("All fields required.");
    return;
  }

  let year = prompt("Publication Year:");

  while (!year || isNaN(year)) {
    alert("Year must be a number!");
    year = prompt("Publication Year (numbers only):");
  }

  const book = {
    id: Date.now(),
    title,
    author,
    year: parseInt(year)
  };

  books.push(book);
  saveBooks();
  renderList();
}

// ---- Edit Book with Number Validation ----
function editBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  const title = prompt("Edit Title:", book.title);
  const author = prompt("Edit Author:", book.author);

  if (!title || !author) {
    alert("Title and Author are required.");
    return;
  }

  let year = prompt("Edit Year:", book.year);

  while (!year || isNaN(year)) {
    alert("Year must be a number!");
    year = prompt("Edit Year (numbers only):", book.year);
  }

  book.title = title;
  book.author = author;
  book.year = parseInt(year);

  saveBooks();
  renderList();
}

// ---- Delete Book ----
function deleteBook(id) {
  if (!confirm("Are you sure you want to delete this book?")) return;
  books = books.filter(b => b.id !== id);
  saveBooks();
  renderList();
}

// ---- Stats (for stats.html) ----
function getStats() {
  return {
    total: books.length,
    avgYear: Math.round(books.reduce((sum, b) => sum + b.year, 0) / books.length)
  };
}

// ---- Auto-render list on page load ----
window.onload = () => {
  renderList();
};
