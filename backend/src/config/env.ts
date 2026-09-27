export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? '',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
} as const;

export type Env = typeof env;