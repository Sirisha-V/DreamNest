# Netlify Free Deployment

This repo can run fully on a free Netlify site.

## What gets deployed

- Frontend: Vite app from `frontend/`
- Backend: FastAPI app exposed as a Python serverless function at `/.netlify/functions/api`

## One-time setup in Netlify

1. Sign in to Netlify.
2. Import this GitHub repo.
3. Leave the base directory blank.
4. Netlify will use the root `netlify.toml` file automatically.
5. Add environment variables:
   - `SECRET_KEY` = any long random string
   - `CORS_ORIGINS` = your final Netlify site URL, e.g. `https://your-site.netlify.app`
6. Deploy.

## API routing

When deployed, the frontend automatically calls the local Netlify function base:
- `/.netlify/functions/api`

No external backend host is required.

## Important notes

- SQLite on Netlify Functions is temporary. Data can reset because functions are stateless.
- This is suitable for demos and short-lived sharing, not long-term persistent production data.
- If you later want persistence, move the DB to a hosted free database.
