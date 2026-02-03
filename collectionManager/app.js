const API = "/.netlify/functions/books";
let books = [];
let currentPage = 1;
const pageSize = 10;

// Load books from backend
async function loadBooks() {
  const res = await fetch(API);
  books = await res.json();
  renderList();
}

// Render paged list
function renderList() {
  const container = document.getElementById("listView");
  container.innerHTML = "";

  const start = (currentPage - 1) * pageSize;
  const pageBooks = books.slice(start, start + pageSize);

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

  pageBooks.forEach((book, i) => {
    table.innerHTML += `
      <tr>
        <td>${start + i + 1}</td>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.year}</td>
        <td>
          <button onclick="editBook(${book.id})">Edit</button>
          <button onclick="deleteBook(${book.id})">Delete</button>
        </td>
      </tr>
    `;
  });

  container.appendChild(table);
  document.getElementById("pageIndicator").textContent =
    `Page ${currentPage} of ${Math.ceil(books.length / pageSize)}`;
}

function nextPage() {
  if (currentPage * pageSize < books.length) {
    currentPage++;
    renderList();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderList();
  }
}

// CRUD
async function addBook() {
  const title = prompt("Book Title:");
  const author = prompt("Author:");
  const year = parseInt(prompt("Publication Year:"));

  if (!title || !author || isNaN(year)) {
    alert("Invalid input");
    return;
  }

  await fetch(API, {
    method: "POST",
    body: JSON.stringify({ title, author, year })
  });

  loadBooks();
}

async function editBook(id) {
  const book = books.find(b => b.id === id);
  const title = prompt("Edit Title:", book.title);
  const author = prompt("Edit Author:", book.author);
  const year = parseInt(prompt("Edit Year:", book.year));

  if (!title || !author || isNaN(year)) {
    alert("Invalid input");
    return;
  }

  await fetch(API, {
    method: "PUT",
    body: JSON.stringify({ id, title, author, year })
  });

  loadBooks();
}

async function deleteBook(id) {
  if (!confirm("Are you sure you want to delete this book?")) return;
  await fetch(`${API}?id=${id}`, { method: "DELETE" });
  loadBooks();
}

window.onload = loadBooks;