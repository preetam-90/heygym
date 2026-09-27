import { createApp } from './app';
import { env } from './config/env';

async function start() {
  try {
    const app = await createApp();
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();