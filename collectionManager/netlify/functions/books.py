import json
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), "books.json")

def load_books():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_books(books):
    with open(DATA_FILE, "w") as f:
        json.dump(books, f, indent=2)

def handler(event, context):
    method = event["httpMethod"]
    books = load_books()

    if method == "GET":
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(books)
        }

    if method == "POST":
        data = json.loads(event["body"])
        data["id"] = max(b["id"] for b in books) + 1
        books.append(data)
        save_books(books)
        return {"statusCode": 201}

    if method == "PUT":
        data = json.loads(event["body"])
        for book in books:
            if book["id"] == data["id"]:
                book.update(data)
        save_books(books)
        return {"statusCode": 200}

    if method == "DELETE":
        id = int(event["queryStringParameters"]["id"])
        books = [b for b in books if b["id"] != id]
        save_books(books)
        return {"statusCode": 200}

    return {"statusCode": 405}
