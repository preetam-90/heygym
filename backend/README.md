# Gym Platform Backend

Backend API for the Gym Platform built with Fastify, TypeScript, Prisma, and PostgreSQL.

## Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **Password Hashing**: Argon2
- **Validation**: Zod

## Project Structure

```
src/
├── config/
│   └── env.ts          # Environment configuration
├── plugins/
│   ├── cors.ts         # CORS configuration
│   └── auth.ts         # JWT authentication plugin
├── modules/
│   ├── auth/           # Authentication module
│   ├── users/          # User management
│   ├── gyms/           # Gym & membership plans
│   └── admin/          # Admin operations
├── lib/
│   └── prisma.ts       # Prisma client
├── app.ts              # Fastify app setup
└── server.ts           # Entry point
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Start PostgreSQL (using Docker):
```bash
docker run --name gym-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=gym_platform \
  -p 5432:5432 \
  -d postgres:15
```

4. Run Prisma migrations:
```bash
npm run prisma:migrate
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Start development server:
```bash
npm run dev
```

Server runs on `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users/me` - Get profile
- `PATCH /api/v1/users/me` - Update profile

### Gyms
- `GET /api/v1/gyms` - List approved gyms
- `GET /api/v1/gyms/my` - List my gyms (gym owner)
- `GET /api/v1/gyms/:id` - Get gym details
- `POST /api/v1/gyms` - Create gym (gym owner)
- `PATCH /api/v1/gyms/:id` - Update gym (gym owner)
- `GET /api/v1/gyms/:id/membership-plans` - Get gym plans
- `POST /api/v1/gyms/:id/membership-plans` - Create plan (gym owner)
- `PATCH /api/v1/gyms/:id/membership-plans/:planId` - Update plan (gym owner)

### Admin
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/gyms` - List all gyms
- `GET /api/v1/admin/stats` - Platform statistics
- `PATCH /api/v1/admin/gyms/:id/status` - Approve/reject gym

## Environment Variables

| Variable | Description |
|----------|-------------|
| NODE_ENV | Environment (development/production) |
| PORT | Server port (default: 4000) |
| DATABASE_URL | PostgreSQL connection string |
| JWT_ACCESS_SECRET | Access token secret |
| JWT_REFRESH_SECRET | Refresh token secret |
| FRONTEND_URL | Frontend URL for CORS |

## Response Format

Success:
```json
{
  "success": true,
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Roles

- **USER**: Regular user, can view gyms and plans
- **GYM_OWNER**: Can create/manage their gym and plans
- **ADMIN**: Full access to all resources