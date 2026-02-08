import json
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), "books.json")
PAGE_SIZE = 10

def load_books():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_books(books):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(books, f, indent=2)

def json_response(status, body=None):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": "" if body is None else json.dumps(body)
    }

def validate_book(data):
    title = str(data.get("title", "")).strip()
    author = str(data.get("author", "")).strip()
    year = data.get("year", None)

    if not title:
        return "Title is required."
    if not author:
        return "Author is required."
    if year is None:
        return "Year is required."
    try:
        year_int = int(year)
    except:
        return "Year must be a number."
    if year_int < 0 or year_int > 2100:
        return "Year must be between 0 and 2100."

    # normalize
    data["title"] = title
    data["author"] = author
    data["year"] = year_int
    return None

def handler(event, context):
    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    books = load_books()

    # GET /books?page=1 -> returns 10 items + total
    if method == "GET":
        try:
            page = int(qs.get("page", "1"))
        except:
            page = 1
        if page < 1:
            page = 1

        total = len(books)
        start = (page - 1) * PAGE_SIZE
        end = start + PAGE_SIZE
        items = books[start:end]

        return json_response(200, {
            "items": items,
            "total": total,
            "page": page,
            "pageSize": PAGE_SIZE
        })

    # POST /books (create)
    if method == "POST":
        try:
            data = json.loads(event.get("body") or "{}")
        except:
            return json_response(400, {"error": "Invalid JSON."})

        err = validate_book(data)
        if err:
            return json_response(400, {"error": err})

        next_id = (max([b["id"] for b in books]) + 1) if books else 1
        new_book = {"id": next_id, "title": data["title"], "author": data["author"], "year": data["year"]}
        books.append(new_book)
        save_books(books)

        return json_response(201, new_book)

    # PUT /books (update)
    if method == "PUT":
        try:
            data = json.loads(event.get("body") or "{}")
        except:
            return json_response(400, {"error": "Invalid JSON."})

        if "id" not in data:
            return json_response(400, {"error": "Missing id."})

        err = validate_book(data)
        if err:
            return json_response(400, {"error": err})

        updated = None
        for b in books:
            if b["id"] == int(data["id"]):
                b["title"] = data["title"]
                b["author"] = data["author"]
                b["year"] = data["year"]
                updated = b
                break

        if updated is None:
            return json_response(404, {"error": "Book not found."})

        save_books(books)
        return json_response(200, updated)

    # DELETE /books?id=#
    if method == "DELETE":
        if "id" not in qs:
            return json_response(400, {"error": "Missing id."})
        try:
            delete_id = int(qs["id"])
        except:
            return json_response(400, {"error": "Invalid id."})

        new_books = [b for b in books if b["id"] != delete_id]
        if len(new_books) == len(books):
            return json_response(404, {"error": "Book not found."})

        save_books(new_books)
        return json_response(200, {"ok": True})

    return json_response(405, {"error": "Method not allowed."})
