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

// Optional status element (recommended)
const statusEl = document.getElementById("status");

document.getElementById("openAddBtn").addEventListener("click", openFormForAdd);
document.getElementById("cancelBtn").addEventListener("click", closeForm);
prevBtn.addEventListener("click", () => loadPage(currentPage - 1));
nextBtn.addEventListener("click", () => loadPage(currentPage + 1));

function setStatus(message) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.remove("hidden");
}

function clearStatus() {
  if (!statusEl) return;
  statusEl.textContent = "";
  statusEl.classList.add("hidden");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retries help with Render cold starts / temporary 502/503 while waking
async function fetchWithBackendWait(url, options = {}, attempts = 6) {
  let lastError = null;

  for (let i = 1; i <= attempts; i++) {
    try {
      setStatus("Waiting on backend server to start…");

      // Per-attempt timeout so we don't hang forever
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      // Treat non-OK as retryable during startup
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      clearStatus();
      return res;
    } catch (err) {
      lastError = err;

      // Backoff timing (keeps it simple)
      // ~5s per attempt is fine for a ~30-60s cold start
      await sleep(5000);
    }
  }

  clearStatus();
  throw lastError;
}

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
    const res = await fetchWithBackendWait(`${BOOKS_API}?page=${page}`);
    const data = await res.json();

    // Clamp client-side too (helps after delete shrink)
    const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
    currentPage = Math.min(Math.max(1, data.page), totalPages);

    totalRecords = data.total;
    pageSize = data.pageSize;

    renderList(data.items);
    updatePagingUI();
  } catch (e) {
    listView.innerHTML = `
      <div>
        <h2>Could not load books</h2>
        <p>The backend may be starting up. If it still doesn’t load, try refreshing.</p>
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
      try {
        const res = await fetchWithBackendWait(`${BOOKS_API}?page=${currentPage}`);
        const data = await res.json();
        const book = data.items.find(b => b.id === id);
        if (book) openFormForEdit(book);
      } catch (err) {
        console.error(err);
        alert("Backend is still starting. Please try again in a moment.");
      }
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

    const res = await fetchWithBackendWait(url, {
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
    const res = await fetchWithBackendWait(`${BOOKS_API}/${id}`, { method: "DELETE" });
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(result.error || "Delete failed.");
      return;
    }

    // If we deleted the last item on the last page, step back a page if needed
    const afterDeleteTotal = Math.max(0, totalRecords - 1);
    const totalPagesAfter = Math.max(1, Math.ceil(afterDeleteTotal / pageSize));
    if (currentPage > totalPagesAfter) currentPage = totalPagesAfter;

    await loadPage(currentPage);
  } catch (err) {
    alert("Delete request failed (backend may still be starting).");
    console.error(err);
  }
}

window.onload = () => loadPage(1);
