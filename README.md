# AI Resume Builder & Job Matching Platform

## Overview

AI Resume Builder & Job Matching Platform is a beginner-friendly internship MVP for creating resumes, improving summaries with AI, discovering jobs, matching resumes to jobs, and tracking applications.

## Features

- User authentication
- Resume Builder
- AI Resume Improvement
- Job Listings
- Job Search
- AI Job Matching
- Job Applications
- Application Tracker
- Admin Job Management
- Resume Preview and Print

## Technology Stack

Frontend: React + Vite

Backend: Node.js + Express

Database: MongoDB Atlas

Authentication: JWT + bcrypt

AI: OpenAI API

## Project Structure

- `client/` contains the React + Vite frontend.
- `server/` contains the Express API, Mongoose models, middleware, routes, and development scripts.

## Installation

Install dependencies in both folders:

```bash
cd server
npm install

cd ../client
npm install
```

## Environment Variables

Create `server/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:5174
PORT=5000
```

Create `client/.env` only when a custom API URL is needed:

```env
VITE_API_URL=http://localhost:5000/api
```

Keep real environment files out of Git. The `.env.example` files contain placeholders only.

## Running the Project

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (authentication required)

### Resumes

- `POST /api/resumes` (authentication required)
- `GET /api/resumes` (authentication required)
- `GET /api/resumes/:id` (authentication required)
- `PUT /api/resumes/:id` (authentication required)
- `DELETE /api/resumes/:id` (authentication required)

### Jobs

- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs` (admin authentication required)
- `PUT /api/jobs/:id` (admin authentication required)
- `DELETE /api/jobs/:id` (admin authentication required)

### Applications

- `GET /api/applications` (authentication required)
- `GET /api/applications/:id` (authentication required)
- `POST /api/applications` (authentication required)
- `PUT /api/applications/:id` (authentication required)
- `DELETE /api/applications/:id` (authentication required)

### AI

- `POST /api/ai/improve-summary` (authentication required)
- `POST /api/ai/match-jobs` (authentication required)

AI endpoints return a safe unavailable response when `OPENAI_API_KEY` is not configured. No fake AI responses are generated.

## Admin Setup

The development-only script promotes one existing user by email:

```bash
cd server
npm run make-admin -- user@example.com
```

Do not make every user an administrator.

## AI Configuration

Live AI features require a valid `OPENAI_API_KEY` in the server environment. The key is never sent to the frontend or included in API responses.

## Security

- Passwords are hashed with bcrypt.
- JWT authentication protects private APIs.
- Resume and application queries are scoped to the authenticated user.
- Job mutations require the backend admin authorization middleware.
- MongoDB, JWT, and OpenAI secrets are read from environment variables.
- Secrets are not stored in source code or frontend code.
