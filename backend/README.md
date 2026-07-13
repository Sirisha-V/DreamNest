# DreamNest API

This backend is used locally and is also packaged for Netlify Python Functions.

## Netlify serverless notes

- The deployed API runs through `netlify/functions/api.py`
- Requests are served by the existing FastAPI app in `backend/app/main.py`
- `DATABASE_PATH` defaults to `/tmp/app.db` when running on Netlify
- `CORS_ORIGINS` should be set to your Netlify site URL

## Local run

```bash
uvicorn app.main:app --reload
```
