const API_BASE = "https://cpsc3750-solo-project-2.onrender.com/api";
const BOOKS_API = `${API_BASE}/books`;

let currentPage = 1;
let totalRecords = 0;
let pageSize = 10;

const listView = document.getElementById("listView");
const pageIndicator = document.getElementById("pageIndicator");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const formSection = document.getElementById("formSection");
const formTitle = document.getElementById("formTitle");
const bookForm = document.getElementById("bookForm");
const bookId = document.getElementById("bookId");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const yearInput = document.getElementById("year");

const titleErr = document.getElementById("titleErr");
const authorErr = document.getElementById("authorErr");
const yearErr = document.getElementById("yearErr");
const serverErr = document.getElementById("serverErr");

document.getElementById("openAddBtn").addEventListener("click", openFormForAdd);
document.getElementById("cancelBtn").addEventListener("click", closeForm);
prevBtn.addEventListener("click", () => loadPage(currentPage - 1));
nextBtn.addEventListener("click", () => loadPage(currentPage + 1));

function clearErrors() {
  titleErr.textContent = "";
  authorErr.textContent = "";
  yearErr.textContent = "";
  serverErr.textContent = "";
}

function clientValidate({ title, author, year }) {
  clearErrors();
  let ok = true;

  if (!title.trim()) { titleErr.textContent = "Title is required."; ok = false; }
  if (!author.trim()) { authorErr.textContent = "Author is required."; ok = false; }

  const y = Number(year);
  if (!Number.isInteger(y)) { yearErr.textContent = "Year must be a number."; ok = false; }
  else if (y < 0 || y > 2100) { yearErr.textContent = "Year must be 0–2100."; ok = false; }

  return ok;
}

function openFormForAdd() {
  clearErrors();
  formTitle.textContent = "Add Book";
  bookId.value = "";
  titleInput.value = "";
  authorInput.value = "";
  yearInput.value = "";
  formSection.classList.remove("hidden");
  titleInput.focus();
}

function openFormForEdit(book) {
  clearErrors();
  formTitle.textContent = "Edit Book";
  bookId.value = book.id;
  titleInput.value = book.title;
  authorInput.value = book.author;
  yearInput.value = book.year;
  formSection.classList.remove("hidden");
  titleInput.focus();
}

function closeForm() {
  formSection.classList.add("hidden");
}

async function loadPage(page) {
  if (page < 1) page = 1;

  try {
    const res = await fetch(`${BOOKS_API}?page=${page}`);
    if (!res.ok) throw new Error(`Books API error: ${res.status}`);

    const data = await res.json();

    currentPage = data.page;
    totalRecords = data.total;
    pageSize = data.pageSize;

    renderList(data.items);
    updatePagingUI();
  } catch (e) {
    listView.innerHTML = `
      <div>
        <h2>Could not load books</h2>
        <p>Make sure the backend is running:</p>
        <p><code>${BOOKS_API}?page=1</code></p>
      </div>
    `;
    console.error(e);
  }
}

function updatePagingUI() {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function renderList(items) {
  listView.innerHTML = "";

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

  const startIndex = (currentPage - 1) * pageSize;

  items.forEach((book, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${startIndex + i + 1}</td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.year}</td>
      <td>
        <button type="button" class="secondary" data-edit="${book.id}">Edit</button>
        <button type="button" class="danger" data-del="${book.id}">Delete</button>
      </td>
    `;
    table.appendChild(tr);
  });

  listView.appendChild(table);

  // Edit buttons
  listView.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-edit"));
      const res = await fetch(`${BOOKS_API}?page=${currentPage}`);
      const data = await res.json();
      const book = data.items.find(b => b.id === id);
      if (book) openFormForEdit(book);
    });
  });

  // Delete buttons
  listView.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-del"));
      await deleteBook(id);
    });
  });
}

bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    title: titleInput.value,
    author: authorInput.value,
    year: yearInput.value
  };

  if (!clientValidate(payload)) return;

  try {
    clearErrors();

    const id = bookId.value ? Number(bookId.value) : null;
    const url = id ? `${BOOKS_API}/${id}` : BOOKS_API;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      serverErr.textContent = result.error || "Server error.";
      return;
    }

    closeForm();
    await loadPage(currentPage);
  } catch (err) {
    serverErr.textContent = "Request failed. Try again.";
    console.error(err);
  }
});

async function deleteBook(id) {
  if (!confirm("Are you sure you want to delete this book?")) return;

  try {
    const res = await fetch(`${BOOKS_API}/${id}`, { method: "DELETE" });
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(result.error || "Delete failed.");
      return;
    }

    // reload page (and handle edge case if last item removed)
    await loadPage(currentPage);
  } catch (err) {
    alert("Delete request failed.");
    console.error(err);
  }
}

window.onload = () => loadPage(1);
