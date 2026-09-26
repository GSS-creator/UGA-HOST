# UGA HOST — Test Server

Simple Flask app with a SQLite database to test `ugahost` deployments.

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Server starts on **http://localhost:3000**

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/api/status` | Health check + DB ping |
| GET | `/api/items` | List all items |
| POST | `/api/items` | Create item `{ "name": "x", "value": "y" }` |
| GET | `/api/items/:id` | Get one item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |

## Quick test (curl)

```bash
# create
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "value": "hello"}'

# list
curl http://localhost:3000/api/items

# update
curl -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"value": "updated"}'

# delete
curl -X DELETE http://localhost:3000/api/items/1
```

## Deploy with ugahost

```bash
ugahost deploy
```
