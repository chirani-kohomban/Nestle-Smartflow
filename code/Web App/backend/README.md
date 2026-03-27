# Nestle SmartFlow Backend

TypeScript + Express + MySQL API server for the Nestle SmartFlow platform.

## Features

- JWT authentication with access and refresh cookies
- MySQL persistence through Sequelize
- Role-aware API areas for manager, warehouse, delivery, retailer, and admin users
- Zod request validation middleware
- Winston logging with Morgan request logging
- Seeded development dataset for dashboards and workflows

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── validations/
│   └── server.ts
├── .env
├── .env.example
├── .gitignore
├── nodemon.json
├── package.json
└── tsconfig.json
```

## Quick Start

```bash
cd backend
npm install
npm run dev
```

The server starts on `http://localhost:5000` and exposes all API routes under `/api`.

Before the first run, make sure MySQL is available locally and the credentials in `.env` are correct. The backend will create the configured database automatically if it does not already exist.

## Default Seed Users

- Admin: `admin@nestlesmartflow.com` / `Admin@123`
- Manager: `manager@nestlesmartflow.com` / `Manager@123`
- Warehouse: `warehouse@nestlesmartflow.com` / `Warehouse@123`
- Delivery: `delivery@nestlesmartflow.com` / `Delivery@123`
- Retailer: `retailer@nestlesmartflow.com` / `Retailer@123`

## Environment Variables

Copy `.env.example` to `.env` and update secrets before production deployment.

## Available Scripts

- `npm run dev` starts the development server with nodemon.
- `npm run build` compiles TypeScript to `dist/`.
- `npm run seed` initializes and seeds the MySQL database.
- `npm start` runs the compiled server.
- `npm test` runs Jest.