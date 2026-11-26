# University Management System — Backend API

A modular, type-safe RESTful API for a **University Management System** built with **Node.js, TypeScript, Express.js, PostgreSQL (Neon), Prisma, Redis, Multer + Cloudinary, and SSLCommerz**.

## Key Features
- **3 Fixed Primary Roles (RBAC)**: `STUDENT`, `INSTRUCTOR`, and `ADMIN` with strict route-level authorization.
- **Authentication**: Email/Password (bcrypt + JWT access/refresh rotation) & Google (GCP) Social Login.
- **Transaction-Safe Course Registration**: Atomic capacity checks, prerequisite validation, duplicate-course prevention, and semester credit limits inside Prisma `$transaction`.
- **Academic Lifecycle**: Departments, Programs, Courses (+ Prerequisites & PDF Syllabi), Semesters, Sections, Bulk Attendance, Exam Results, and Credit-Weighted **GPA / CGPA Transcripts**.
- **Payment Gateway**: Real sandbox/live integration for **SSLCommerz** (Session + IPN/Validation).
- **Modern Backend Practices**: Standardized JSON responses, Zod validation, Soft Deletes (`deletedAt`), Audit Logs, Redis caching (with in-memory fallback), Helmet, CORS, and Rate Limiting.
- **Interactive API Docs**: Swagger UI at `/api/docs` and Postman collection at `docs/postman_collection.json`.

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, JWT secrets, Cloudinary, Google OAuth, and SSLCommerz keys
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

## Demo Credentials (from `prisma/seed.ts`)
- **Admin**: `admin@university.edu` / `Password@123`
- **Instructor**: `instructor@university.edu` / `Password@123`
- **Student**: `student@university.edu` / `Password@123`

## Scripts
- `npm run dev` — Start development server with hot reload
- `npm run build` — Compile TypeScript to `dist/`
- `npm run typecheck` — Run `tsc --noEmit`
- `npm run lint` — Run ESLint
- `npm test` — Run Vitest + Supertest test suite
