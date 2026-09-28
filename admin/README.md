# heygym-admin

Internal admin web app for HeyGym (lives in this repo at `admin/`). Next.js 14 App Router + TypeScript + Tailwind.

## Quickstart

```bash
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3001
```

## Env

| Var | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_ADMIN_URL` | `http://localhost:3001` |

## Notes

- Dark theme tokens copied by value from `frontend/` (`bg #09090B`, accent `#D4FF4F`). No cross-package imports.
- Consumes the same backend endpoints only; no new backend endpoints in v1.
