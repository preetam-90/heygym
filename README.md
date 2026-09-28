# GymPlatform

A modern gym discovery and management platform built with a **Next.js 14** frontend and **Fastify** backend. Find gyms, compare membership plans, and manage your fitness business — all in one place.

---

## 🏗️ Architecture

```
gym-platform/
├── frontend/          # Next.js 14 App Router + React 18 + Tailwind CSS
├── backend/           # Fastify + TypeScript + Prisma ORM + PostgreSQL
├── supabase/          # Alternative Supabase schema with RLS policies
└── docs/              # Design specs and implementation plans
```

---

## ✨ Features

### For Athletes (Users)
- **Discover Gyms** — Browse verified gyms with photos, amenities, and real reviews
- **Compare Plans** — Side-by-side pricing, durations, and features with no hidden fees
- **Track Progress** — Set goals and monitor your fitness journey
- **Join Community** — Connect with athletes and find training partners

### For Gym Owners
- **List Your Gym** — Showcase facility with photos, hours, and contact info
- **Manage Plans** — Create and update membership tiers with flexible pricing
- **Receive Inquiries** — Direct leads from interested athletes
- **Analytics Dashboard** — Track performance, inquiries, and conversions

### For Admins
- **User Management** — View and manage all platform users
- **Gym Approval** — Review and approve/reject gym submissions
- **Platform Statistics** — Overview of gyms, users, and plans

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.1.0 | App Router, SSR, API routes |
| React | 18.2.0 | UI components |
| Tailwind CSS | 3.4.1 | Utility-first styling |
| TypeScript | 5.3.0 | Type safety |
| Zod | 3.22.4 | Schema validation |
| React Hook Form | 7.50.1 | Form handling |
| Lucide React | 0.330.0 | Icon system |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Fastify | 4.26.0 | High-performance HTTP server |
| TypeScript | 5.3.0 | Type safety |
| Prisma ORM | 5.10.0 | Database ORM |
| PostgreSQL | 15 | Primary database |
| Argon2 | 0.31.2 | Password hashing |
| JWT (@fastify/jwt) | 8.0.0 | Authentication tokens |
| Zod | 3.22.4 | Request validation |

### Design System
- **Theme**: Dark energetic with Volt Lime (#D4FF4F) accent
- **Typography**: Barlow Condensed (display) + Inter (body) via `next/font`
- **Components**: Custom UI library (Button, Card, Input, Textarea, Label)
- **Accessibility**: WCAG AA compliant (4.5:1 contrast), keyboard navigation, reduced-motion support

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- pnpm / npm / yarn

### 1. Clone & Install

```bash
# Frontend
cd gym-platform/frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gym_platform?schema=public
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 3. Start Database

```bash
# Using Docker
docker run --name gym-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=gym_platform \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Initialize Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 5. Run Development Servers

```bash
# Terminal 1 - Backend (port 4000)
cd backend && npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the frontend and [http://localhost:4000](http://localhost:4000) for the API.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new user | ❌ |
| POST | `/api/v1/auth/login` | Login | ❌ |
| POST | `/api/v1/auth/logout` | Logout | ✅ |
| GET | `/api/v1/auth/me` | Get current user | ✅ |
| POST | `/api/v1/auth/refresh` | Refresh access token | ✅ |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/users/me` | Get profile | ✅ |
| PATCH | `/api/v1/users/me` | Update profile | ✅ |

### Gyms
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/gyms` | List approved gyms | ❌ |
| GET | `/api/v1/gyms/my` | List my gyms | ✅ (GYM_OWNER) |
| GET | `/api/v1/gyms/:id` | Get gym details | ❌ |
| POST | `/api/v1/gyms` | Create gym | ✅ (GYM_OWNER) |
| PATCH | `/api/v1/gyms/:id` | Update gym | ✅ (GYM_OWNER) |
| GET | `/api/v1/gyms/:id/membership-plans` | Get gym plans | ❌ |
| POST | `/api/v1/gyms/:id/membership-plans` | Create plan | ✅ (GYM_OWNER) |
| PATCH | `/api/v1/gyms/:id/membership-plans/:planId` | Update plan | ✅ (GYM_OWNER) |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/admin/users` | List all users | ✅ (ADMIN) |
| GET | `/api/v1/admin/gyms` | List all gyms | ✅ (ADMIN) |
| GET | `/api/v1/admin/stats` | Platform statistics | ✅ (ADMIN) |
| PATCH | `/api/v1/admin/gyms/:id/status` | Approve/reject gym | ✅ (ADMIN) |

### Response Format

**Success:**
```json
{
  "success": true,
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **USER** | Browse gyms, view plans, manage own profile |
| **GYM_OWNER** | All USER permissions + create/manage gyms & plans |
| **ADMIN** | Full access to all resources, user/gym management |

---

## 🎨 Design System

### Colors
```css
/* Base */
--bg-base: #09090B;           /* zinc-950 */
--bg-surface: #131316;        /* elevated surfaces */
--bg-card: #151518;           /* cards */
--border: #26262B;            /* white/10 */

/* Text */
--fg-primary: #FAFAFA;        /* white */
--fg-muted: #A1A1AA;          /* zinc-400 */
--fg-muted-2: #71717A;        /* zinc-500 large text only */

/* Accent */
--accent-volt: #D4FF4F;       /* primary CTA */
--accent-on: #0A0F00;         /* text on volt */
--accent-dim: rgba(212,255,79,0.15); /* borders/glows */

/* Status */
--success: #22C55E;           /* APPROVED */
--destructive: #EF4444;       /* REJECTED/errors */
--warning: #FACC15;           /* PENDING */
```

### Typography
- **Display**: Barlow Condensed 600/700, uppercase, tracking-tight
- **Body**: Inter 400/500/600, 16-20px
- **Loaded via** `next/font/google` with `display: swap`

### Spacing & Effects
- Sections: `py-20/32`, gaps `48px+`, container `max-w-7xl`
- Radius: cards `16-20px`, pills `full`, buttons `10-12px`
- Shadows: card `0 8px 30px rgba(0,0,0,0.45)`, volt CTA glow
- Animations: 200-300ms transitions, respects `prefers-reduced-motion`

---

## 📁 Project Structure

### Frontend (`frontend/`)
```
app/
├── layout.tsx              # Root layout, fonts, metadata
├── page.tsx                # Home page (hero, features, stats, CTA)
├── globals.css             # CSS variables, base styles
├── gyms/
│   ├── page.tsx            # Gym directory with search/filter
│   └── [id]/page.tsx       # Gym detail with plans
├── login/page.tsx          # User login
├── register/page.tsx       # User registration
├── gym-owner/
│   ├── register/page.tsx   # Gym owner registration
│   └── dashboard/page.tsx  # Owner dashboard
└── admin/
    └── dashboard/page.tsx  # Admin dashboard

components/
├── ui/                     # Base UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   └── textarea.tsx
├── navbar.tsx              # Sticky glass navigation
├── footer.tsx              # Site footer
└── gym-card.tsx            # Gym display card

lib/
├── api.ts                  # API client with auth
└── utils.ts                # cn() helper, formatters
```

### Backend (`backend/`)
```
src/
├── config/
│   └── env.ts              # Environment validation (Zod)
├── plugins/
│   ├── cors.ts             # CORS configuration
│   └── auth.ts             # JWT authentication plugin
├── modules/
│   ├── auth/               # Register, login, logout, refresh, me
│   ├── users/              # Profile management
│   ├── gyms/               # Gym CRUD, membership plans
│   └── admin/              # Admin operations, stats
├── lib/
│   └── prisma.ts           # Prisma client singleton
├── app.ts                  # Fastify app setup, routes
└── server.ts               # Entry point
```

### Database Schema (Prisma)
```prisma
enum Role { USER, GYM_OWNER, ADMIN }
enum GymStatus { PENDING, APPROVED, REJECTED }

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          Role     @default(USER)
  gyms          Gym[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Gym {
  id              String             @id @default(cuid())
  ownerId         String
  owner           User               @relation(fields: [ownerId], references: [id])
  name            String
  description     String?
  address         String
  city            String
  phone           String?
  email           String?
  imageUrl        String?
  status          GymStatus          @default(PENDING)
  membershipPlans MembershipPlan[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

model MembershipPlan {
  id          String   @id @default(cuid())
  gymId       String
  gym         Gym      @relation(fields: [gymId], references: [id])
  name        String
  description String?
  price       Float
  duration    Int      // in days
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 🔐 Authentication Flow

1. **Register** → Returns access + refresh tokens (HTTP-only cookies)
2. **Login** → Returns access + refresh tokens (HTTP-only cookies)
3. **Access Token** → Short-lived (15min), sent in Authorization header
4. **Refresh Token** → Long-lived (7d), HTTP-only cookie, rotates on use
5. **Protected Routes** → Validate access token, extract user ID
6. **Logout** → Clears cookies, invalidates refresh token

---

## 🧪 Testing & Quality

```bash
# Frontend
cd frontend
npm run build       # Production build check
npm run lint        # ESLint

# Backend
cd backend
npm run build       # TypeScript compilation
# npm test          # Add tests as needed
```

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel deploy
```

### Backend (Railway, Render, Fly.io, etc.)
```bash
cd backend
npm run build
npm start
```

### Database
- **Managed**: Neon, Supabase, Railway PostgreSQL, AWS RDS
- **Self-hosted**: Docker, Kubernetes

### Environment Variables (Production)
- Generate strong JWT secrets: `openssl rand -base64 32`
- Use connection pooling for PostgreSQL (PgBouncer)
- Set `NODE_ENV=production`

---

## 📄 License

MIT License — feel free to use for personal or commercial projects.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/preetam-90/heygym/issues)
- **Discussions**: [GitHub Discussions](https://github.com/preetam-90/heygym/discussions)

---

**Built with ❤️ for the fitness community**