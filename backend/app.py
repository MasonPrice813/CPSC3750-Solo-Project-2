from flask import Flask, request, jsonify
import json, os

app = Flask(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), "books.json")
PAGE_SIZE = 10

def load_books():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_books(books):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(books, f, indent=2)

def validate_book(data):
    title = str(data.get("title", "")).strip()
    author = str(data.get("author", "")).strip()
    year = data.get("year", None)

    if not title: return "Title is required."
    if not author: return "Author is required."
    if year is None: return "Year is required."

    try:
        year = int(year)
    except:
        return "Year must be a number."
    if year < 0 or year > 2100:
        return "Year must be between 0 and 2100."

    data["title"] = title
    data["author"] = author
    data["year"] = year
    return None

# Simple CORS so Netlify can call Render
@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return resp

@app.route("/api/books", methods=["GET"])
def get_books():
    books = load_books()
    page = int(request.args.get("page", 1))
    if page < 1: page = 1

    total = len(books)
    start = (page - 1) * PAGE_SIZE
    end = start + PAGE_SIZE

    return jsonify({
        "items": books[start:end],
        "total": total,
        "page": page,
        "pageSize": PAGE_SIZE
    })

@app.route("/api/books", methods=["POST"])
def create_book():
    books = load_books()
    data = request.get_json(silent=True) or {}
    err = validate_book(data)
    if err:
        return jsonify({"error": err}), 400

    next_id = (max([b["id"] for b in books]) + 1) if books else 1
    new_book = {"id": next_id, "title": data["title"], "author": data["author"], "year": data["year"]}
    books.append(new_book)
    save_books(books)
    return jsonify(new_book), 201

@app.route("/api/books/<int:book_id>", methods=["PUT"])
def update_book(book_id):
    books = load_books()
    data = request.get_json(silent=True) or {}
    data["id"] = book_id

    err = validate_book(data)
    if err:
        return jsonify({"error": err}), 400

    for b in books:
        if b["id"] == book_id:
            b["title"] = data["title"]
            b["author"] = data["author"]
            b["year"] = data["year"]
            save_books(books)
            return jsonify(b)

    return jsonify({"error": "Book not found."}), 404

@app.route("/api/books/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    books = load_books()
    new_books = [b for b in books if b["id"] != book_id]
    if len(new_books) == len(books):
        return jsonify({"error": "Book not found."}), 404

    save_books(new_books)
    return jsonify({"ok": True})

@app.route("/api/stats", methods=["GET"])
def stats():
    books = load_books()
    total = len(books)
    avg_year = round(sum(b.get("year", 0) for b in books) / total) if total else 0
    return jsonify({"total": total, "averagePublicationYear": avg_year})
