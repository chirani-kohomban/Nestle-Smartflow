# Nestlé SmartFlow - Supply Chain Management MVP

Nestlé SmartFlow is a simplified, highly deployable full-stack application designed to manage the supply chain lifecycle from Area Manager orders to Warehouse dispatch and Distributor delivery.

## 🚀 Key Features
* **Sprint 1 (Control & Dispatch):** Order creation, smart recommendations (average of last 3 orders), stock allocation, dispatch tracking.
* **Sprint 2 (Delivery Optimization):** Map location integration, delivery list, simplistic nearest-neighbor route optimization, status logging.

## 📂 Project Structure
* `/backend` - Node.js + Express + MySQL API.
* `/frontend` - React + Vite + Tailwind CSS Application.

## 💻 Local Development

### 1. Database Setup
1. Create a MySQL database (e.g. using XAMPP).
2. Set your environment variables in `backend/.env`.
3. In `/backend`, run `node setup_db.js` to create the schema.
4. Run `node seed.js` to populate dummy data.

### 2. Run Backend
```bash
cd backend
npm install
npm run dev (or: node server.js)
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🌍 Deployment Guide

This app is designed to be hosted entirely for free on **Render** (Backend) and **Vercel** (Frontend).

### Phase 1: Database Setup
1. Use an online MySQL provider (e.g., Aiven, PlanetScale, Railway, or AWS RDS).
2. Take note of the `Host`, `User`, `Password`, `Database Name`, and `Port` provided by your cloud database.
3. Import `schema.sql` into your cloud database and run `seed.js` against it to set up tables.

### Phase 2: Deploy Backend to Render
1. Push this entire repository to GitHub.
2. Go to [Render](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Set the Root Directory to `backend`.
5. Configuration:
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
6. Add Environment Variables:
   * `DB_HOST` = (Your Cloud DB Host)
   * `DB_USER` = (Your Cloud DB User)
   * `DB_PASSWORD` = (Your Cloud DB Password)
   * `DB_NAME` = (Your Cloud DB Name)
   * `JWT_SECRET` = (Any random secret string)
7. Click **Deploy**. Once finished, copy the provided `onrender.com` URL.

### Phase 3: Deploy Frontend to Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Connect your GitHub repository.
3. Select the `frontend` folder as the Root Directory.
4. Framework Preset will auto-detect as **Vite**.
5. Add an Environment Variable:
   * `VITE_API_URL` = `https://your-backend-url.onrender.com/api` (Replace with your Render URL + `/api`)
6. Click **Deploy**.

## 🏁 Final URLs
* **Frontend:** `https://your-frontend-app.vercel.app`
* **Backend API:** `https://your-backend-app.onrender.com/api`
