# ðŸš€ LumaWear + ChurnIQ â€” Deployment Guide
(Vercel frontend + Render backends + MongoDB Atlas)

You have **3 services** that must all be live:

| # | Service | Code | Host |
|---|---------|------|------|
| 1 | Frontend (React/Vite) | `LumaWear-Ecommerce/frontend` | **Vercel** |
| 2 | Store backend (Node/Express) | `LumaWear-Ecommerce/backend` | **Render** |
| 3 | ML API (FastAPI/ChurnIQ) | `ChurnProject` | **Render** |
| DB | MongoDB | Atlas (cloud) | **MongoDB Atlas** |

Order: **Atlas â†’ Render backends â†’ Vercel frontend**.

## STEP 0 â€” Push code to GitHub

```powershell
git add render.yaml DEPLOY.md LumaWear-Ecommerce/backend/src/server.js
git commit -m "Add deployment config"
git push origin main
```

## STEP 1 â€” MongoDB Atlas (free, 5 min)

1. https://cloud.mongodb.com â†’ Create Cluster â†’ **M0 Free**, name `lumawear`.
2. **Database Access** â†’ add user `lumawear_app` (strong password), role **Read and write to any database**.
3. **Network Access** â†’ **Add IP** â†’ **Allow Access from Anywhere** (`0.0.0.0/0`).
4. **Database â†’ Connect â†’ Drivers â†’ Node.js** â†’ copy URI:
   `mongodb+srv://lumawear_app:<password>@<cluster>.mongodb.net/lumawear?retryWrites=true&w=majority`
   This is your `MONGODB_URI`. Keep it safe.

## STEP 2 â€” Render backends (free, 10 min)

1. https://render.com â†’ sign up with GitHub â†’ **New + â†’ Blueprint** â†’ select repo `Ecommerce_lumawear_ChurnAnalysis` â†’ **Apply**. You get `lumawear-backend` + `churniq-api`.
2. Open **`lumawear-backend` â†’ Environment** and set:
   `MONGODB_URI` = Atlas URI from Step 1,
   `MONGODB_DB` = `lumawear`,
   `ADMIN_EMAIL` = your email,
   `ADMIN_PASSWORD` = strong password,
   `CLIENT_ORIGIN` = `http://localhost:5173` (temp, update in Step 3),
   `FRONTEND_URL` = same temp value,
   `NODE_ENV` = `production`.
   (`JWT_*` secrets auto-generate. Leave `CHURN_SERVICE_URL` blank for now.) Save.
3. Wait till both are **Live**, then check:
   `https://churniq-api.onrender.com/health` and `https://lumawear-backend.onrender.com/api/health`.
4. Wire them: copy real churn URL â†’ in `lumawear-backend` set `CHURN_SERVICE_URL=https://churniq-api.onrender.com` â†’ Save.
## STEP 3 â€” Vercel frontend (free, 5 min)

1. https://vercel.com â†’ sign up with GitHub â†’ **Add New â†’ Project** â†’ Import repo.
2. Set **Root Directory = `LumaWear-Ecommerce/frontend`** (critical!), Framework = Vite.
3. Add env vars: `VITE_API_BASE_URL=https://lumawear-backend.onrender.com/api` (your real backend + `/api`), `VITE_APP_NAME=LumaWear`. **Deploy**.
4. Fix CORS: in Render `lumawear-backend` set `CLIENT_ORIGIN` and `FRONTEND_URL` to your real `https://<app>.vercel.app` â†’ Save.

## STEP 4 â€” Verify

- Storefront loads, login/cart work.
- `/api/health` on backend returns ok:true.
- `/health` on churn API returns ok.
- Admin ChurnIQ dashboard shows FastAPI HEALTHY.
- Backend auto-creates admin from ADMIN_EMAIL/ADMIN_PASSWORD on first boot.

## Troubleshooting

- CORS error â†’ CLIENT_ORIGIN/FRONTEND_URL must exactly match Vercel URL, no trailing slash.
- Login 401 loop â†’ VITE_API_BASE_URL must end in /api with https; redeploy Vercel after changing it (baked at build time).
- Churn OFFLINE â†’ check CHURN_SERVICE_URL, wake free service via /health.
- Mongo fail â†’ Atlas must allow 0.0.0.0/0; encode @ in password as %40.
- .env never deploys (gitignored) â€” all prod config comes from dashboards. real-accounts.txt is also ignored. Safe.

## Files added

- `render.yaml` â€” Render blueprint (both backends, health checks).
- `LumaWear-Ecommerce/frontend/vercel.json` â€” SPA rewrite so refresh works.
