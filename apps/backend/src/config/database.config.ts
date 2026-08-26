import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://civicops:civicops@localhost:5432/civicops?schema=public',
}));
