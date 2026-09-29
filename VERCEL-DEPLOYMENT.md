# Deploy CampusOne AI with Vercel and GitHub

This repository contains a Vite frontend and an Express/Prisma API, so create two Vercel projects from the same GitHub repository. Vercel's monorepo flow supports a separate root directory for each project.

## 1. Create a hosted PostgreSQL database

The local PostgreSQL instance on your computer cannot be reached by Vercel. Create a managed PostgreSQL database and keep its connection string private. Do not put production credentials in GitHub.

## 2. Deploy the API

In Vercel, import `bramhaji345/CampusOne-AI` as a new project and set **Root Directory** to `backend`.

- Framework: Express (detected from `src/app.js`)
- Build command: `npm run vercel-build`
- Environment variables for Production and Preview as appropriate:
  - `DATABASE_URL`: hosted PostgreSQL connection string, including SSL settings required by the database provider
  - `JWT_SECRET`: a long, unique random secret
  - `FRONTEND_URL`: the deployed frontend's `https://...vercel.app` URL
- Deploy. Verify `<API URL>/api/health` reports a healthy database.

The `vercel-build` command generates the Prisma client. Apply schema migrations to the hosted database once, from a trusted local terminal with its connection string configured, by running `npx prisma migrate deploy` in `backend/`. Rerun it when new migrations are added.

## 3. Prepare campus data

Vercel does not connect to the local database automatically. To populate the hosted database with the workbook and generated demonstration activity, set `DATABASE_URL` locally to the hosted connection string, then run from `backend/`:

```bash
npx prisma migrate deploy
npm run import:workbook -- "path/to/CampusOne-AI_Big_Student_Faculty_Dataset_Updated_IDs_Mails.xlsx" --allow-synthetic --confirm-structures
npm run seed:campus-data
```

The importer and simulation generator create synthetic demonstration records. Only load records you intend to host in the cloud.

## 4. Deploy the frontend

Create a second Vercel project from the same repository and set **Root Directory** to `frontend`.

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_URL`: `https://<your-api-project>.vercel.app/api`

Set the API project's `FRONTEND_URL` to this frontend's deployed URL, then redeploy the API if needed. The included `frontend/vercel.json` enables React Router deep links such as `/login` and `/student`.

## Hosting limitation

Vercel's serverless filesystem is not persistent. Excel import uses in-memory uploads, but regular campus attachments saved under `backend/uploads/` will not persist across function instances. Move those attachments to persistent object storage before relying on them in production.
