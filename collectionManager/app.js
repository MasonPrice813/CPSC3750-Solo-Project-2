const API = "/.netlify/functions/books";
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

document.getElementById("openAddBtn").addEventListener("click", () => openFormForAdd());
document.getElementById("cancelBtn").addEventListener("click", () => closeForm());
prevBtn.addEventListener("click", () => prevPage());
nextBtn.addEventListener("click", () => nextPage());

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
  const res = await fetch(`${API}?page=${page}`);
  const data = await res.json();

  currentPage = data.page;
  totalRecords = data.total;
  pageSize = data.pageSize;

  renderList(data.items);
  updatePagingUI();
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

  // Button handlers
  listView.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-edit"));
      // To edit, we need the item data. Easiest: reload current page and find it.
      const res = await fetch(`${API}?page=${currentPage}`);
      const data = await res.json();
      const book = data.items.find(b => b.id === id);
      if (book) openFormForEdit(book);
    });
  });

  listView.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-del"));
      await deleteBook(id);
    });
  });
}

function nextPage() {
  loadPage(currentPage + 1);
}
function prevPage() {
  loadPage(currentPage - 1);
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
    const method = id ? "PUT" : "POST";
    const body = id ? JSON.stringify({ id, ...payload }) : JSON.stringify(payload);

    const res = await fetch(API, { method, body });
    const resultText = await res.text();
    const result = resultText ? JSON.parse(resultText) : {};

    if (!res.ok) {
      serverErr.textContent = result.error || "Server error.";
      return;
    }

    closeForm();

    // After add/delete, make sure paging stays valid
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    await loadPage(currentPage);
  } catch (err) {
    serverErr.textContent = "Request failed. Try again.";
  }
});

async function deleteBook(id) {
  if (!confirm("Are you sure you want to delete this book?")) return;

  const res = await fetch(`${API}?id=${id}`, { method: "DELETE" });
  const resultText = await res.text();
  const result = resultText ? JSON.parse(resultText) : {};

  if (!res.ok) {
    alert(result.error || "Delete failed.");
    return;
  }

  // If we deleted the last item on the last page, move back a page
  const afterTotal = Math.max(0, totalRecords - 1);
  const totalPagesAfter = Math.max(1, Math.ceil(afterTotal / pageSize));
  if (currentPage > totalPagesAfter) currentPage = totalPagesAfter;

  await loadPage(currentPage);
}

window.onload = () => loadPage(1);
