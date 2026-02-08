import json
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), "books.json")

def load_books():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def handler(event, context):
    books = load_books()
    total = len(books)
    avg_year = 0
    if total > 0:
        avg_year = round(sum(b.get("year", 0) for b in books) / total)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "total": total,
            "averagePublicationYear": avg_year
        })
    }
