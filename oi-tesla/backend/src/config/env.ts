import dotenv from 'dotenv';
import path from 'path';

// Load .env from current directory or parent directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.BACKEND_PORT || process.env.PORT || '4000', 10),
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://foivonyxbsiopawzicqg.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'oi-tesla-super-secret-jwt-key',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
