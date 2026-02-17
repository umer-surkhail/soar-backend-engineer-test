# Deploy the School Management API (Public Hosting)

This guide walks you through hosting the API on **Railway** with **MongoDB Atlas** and **Upstash Redis** (all have free tiers). The same env vars work on **Render**, **Heroku**, or other Node hosts.

---

## What you need

1. **GitHub** (or GitLab) – repo with your code pushed.
2. **MongoDB Atlas** – free cluster for the database.
3. **Upstash Redis** – free tier for Redis (or Redis Cloud / any Redis URL).
4. **Railway** – free tier for the Node app (or Render / Heroku).

---

## Step 1: MongoDB Atlas (database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Create a **free M0 cluster** (e.g. AWS, region near you).
3. **Database Access** → Add Database User:
   - Authentication: Password (create a strong password and **save it**).
4. **Network Access** → Add IP Address:
   - For “allow from anywhere” (needed for cloud hosts): `0.0.0.0/0`.
5. **Database** → Connect → **Drivers** → copy the connection string. It looks like:
   ```text
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your DB user password (URL-encode special chars).
7. Add a database name to the path (e.g. `axion`):
   ```text
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/axion?retryWrites=true&w=majority
   ```
8. Save this as your **MONGO_URI** (you’ll use it in Step 4).

---

## Step 2: Upstash Redis (cache)

1. Go to [upstash.com](https://upstash.com) and sign up / log in.
2. Create a **Redis database** (free tier), same region as your app if possible.
3. Open the database → **REST API** or **Details** → copy the **Redis URL** (e.g. `rediss://default:xxx@xxx.upstash.io:6379`).
4. Save this as your **REDIS_URI** (and use it for **CACHE_REDIS**, **CORTEX_REDIS**, **OYSTER_REDIS** on the host if you don’t set them separately).

---

## Step 3: Railway account and project

1. Go to [railway.app](https://railway.app) and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo**.
3. Select your **axion** repo and the branch (e.g. `main`).
4. Railway will detect Node.js and use `npm install` and `npm start` (from `package.json`). No extra config needed if `start` is `node index.js`.

---

## Step 4: Environment variables on Railway

In your Railway project, open your **service** → **Variables** and add:

| Variable | Value | Notes |
|----------|--------|--------|
| `MONGO_URI` | Your Atlas connection string from Step 1 | Required |
| `REDIS_URI` | Your Upstash Redis URL from Step 2 | Required |
| `CACHE_REDIS` | Same as `REDIS_URI` | Or leave unset to use REDIS_URI |
| `CORTEX_REDIS` | Same as `REDIS_URI` | Or leave unset |
| `OYSTER_REDIS` | Same as `REDIS_URI` | Or leave unset |
| `LONG_TOKEN_SECRET` | A long random string (e.g. 32+ chars) | Required, keep secret |
| `SHORT_TOKEN_SECRET` | Another long random string | Required, keep secret |
| `NACL_SECRET` | Another long random string | Required by template |
| `INITIAL_SUPERADMIN_EMAIL` | e.g. `admin@yourdomain.com` | For first superadmin |
| `INITIAL_SUPERADMIN_PASSWORD` | Strong password | For first superadmin |

- **PORT** is set by Railway automatically; the app uses it (see config).
- You can paste the same names/values from your local `.env`; only **MONGO_URI** and **REDIS_URI** must point to Atlas and Upstash.

Click **Deploy** (or push to GitHub) so the app restarts with the new variables.

---

## Step 5: Public URL (domain) on Railway

1. In the same service, open **Settings** → **Networking**.
2. Click **Generate Domain**. Railway will assign a URL like `https://axion-production-xxxx.up.railway.app`.
3. Copy this URL — this is your **public API base URL** (e.g. for Postman: `https://axion-production-xxxx.up.railway.app`).

---

## Step 6: Create the first superadmin (one-time)

The app does not run the seed script on deploy. Create the first superadmin in one of these ways:

**Option A – Railway shell (recommended)**  
1. In Railway, open your service → **Settings** or **Deployments** → open a **Shell** / **Run command** (or use “One-off command” if available).  
2. Run (replace email/password with your chosen values):

```bash
INITIAL_SUPERADMIN_EMAIL=admin@example.com INITIAL_SUPERADMIN_PASSWORD=YourSecurePassword node scripts/seed-superadmin.js
```

**Option B – From your machine**  
1. Install Railway CLI: `npm i -g @railway/cli` (or `npx @railway/cli`).  
2. Log in: `railway login`.  
3. Link project: `railway link`.  
4. Run the seed with the **production** MONGO_URI (so it connects to Atlas). Easiest is to set env in Railway (Step 4) and run the one-off command via Railway CLI/Dashboard so the process uses the same MONGO_URI.

**Option C – Manual user in Atlas**  
If you know how to use MongoDB Compass or Atlas UI, you can insert one user document into the `users` collection with `email`, `passwordHash` (bcrypt hash of your password), `role: 'superadmin'`, `schoolId: null`. Prefer Option A or B so you don’t have to hash the password manually.

After this, you can log in via **POST** `https://your-railway-url.up.railway.app/api/auth/login` with that email and password.

---

## Step 7: Verify deployment

1. **Health / root** (if you add a simple route later): open `https://your-railway-url.up.railway.app` in the browser (may 404 if you have no root route; that’s OK).
2. **Login**  
   - In Postman: **POST** `https://your-railway-url.up.railway.app/api/auth/login`  
   - Body (raw JSON): `{"email":"admin@example.com","password":"YourSecurePassword"}`  
   - You should get **200** and a `longToken` in the response.
3. **Schools list**  
   - **GET** `https://your-railway-url.up.railway.app/api/school/list`  
   - Header: `token: <longToken>`  
   - You should get **200** and `data.schools` (empty array at first).

If any of these fail, check Railway **Deployments** and **Logs** for errors (e.g. wrong MONGO_URI, REDIS_URI, or missing env vars).

---

## Summary checklist

- [ ] MongoDB Atlas cluster created, user and network access set, **MONGO_URI** copied (with DB name in path).
- [ ] Upstash Redis created, **REDIS_URI** copied.
- [ ] Railway project created from GitHub repo.
- [ ] All env vars set on Railway (MONGO_URI, REDIS_URI, CACHE/CORTEX/OYSTER if needed, LONG_TOKEN_SECRET, SHORT_TOKEN_SECRET, NACL_SECRET, INITIAL_SUPERADMIN_EMAIL, INITIAL_SUPERADMIN_PASSWORD).
- [ ] Railway domain generated and public URL copied.
- [ ] First superadmin created (seed or manual).
- [ ] Login and school list tested in Postman with the public URL.

---

## Using Render instead of Railway

1. [render.com](https://render.com) → New → **Web Service**.
2. Connect your repo, branch, set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
3. Add the same **Environment Variables** as in Step 4 (Render sets **PORT** automatically).
4. Create the first superadmin via **Shell** in the Render dashboard (same command as Option A above) or by running the seed script locally with MONGO_URI pointing to your Atlas cluster.

---

## Troubleshooting

- **App crashes on start** – Check logs for “missing .env variables” or connection errors. Ensure MONGO_URI, REDIS_URI, and the three secrets are set and valid.
- **401 on login** – Either the seed wasn’t run or email/password don’t match. Run the seed again (it skips if a user already exists) or use the same email/password you set in INITIAL_SUPERADMIN_*.
- **Can’t connect to MongoDB/Redis** – For Atlas, ensure IP `0.0.0.0/0` is allowed. For Redis, use the exact URL from Upstash (including `rediss://` if that’s what they give).

Your **deployed application URL** for the submission form is the Railway (or Render) public URL, e.g. `https://axion-production-xxxx.up.railway.app`.
