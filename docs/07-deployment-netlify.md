# Deployment Guide (Netlify)

## Deployment Model

DreamNest is deployed as:
- Frontend static build from frontend/dist
- Netlify function API from netlify/functions/api.mjs
- Persistent data in Netlify Blobs

Main config:
- [netlify.toml](../netlify.toml)

## One Command Production Deploy

From repository root:

```bash
npx --yes netlify-cli deploy --prod --build --skip-functions-cache
```

## What Happens During Deploy

1. Root dependencies install
2. Frontend dependencies install
3. Frontend build runs
4. Functions bundle
5. Assets + function deploy to Netlify
6. Production URL is updated

## Build Config

Current build command in netlify.toml:

```toml
command = "npm install && cd frontend && npm install && npm run build"
```

Publish directory:

```toml
publish = "frontend/dist"
```

Function directory:

```toml
[functions]
directory = "netlify/functions"
```

## API Redirects

Configured redirects:
- /api/* -> /.netlify/functions/api/:splat
- /* -> /index.html

This supports SPA routing and function API proxying under one domain.

## Post-Deploy Validation Checklist

1. Open production URL
2. Login with a known account
3. Verify dreams list loads
4. Add a transaction and refresh
5. Confirm data persists after refresh
6. Confirm mobile navigation and key pages load

## Rollback Strategy

If a release has issues:
- Use Netlify deploy history
- Restore previous successful deploy
- Re-run verification checklist
