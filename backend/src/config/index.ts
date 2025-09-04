import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('localhost'),
  DATA_DIR: z.string().default('./data'),
  BACKUP_RETENTION_DAYS: z.coerce.number().default(30),
  MAX_BACKUP_FILES: z.coerce.number().default(10),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

const env = configSchema.parse(process.env);

export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  host: env.HOST,
  dataDir: env.DATA_DIR,
  backupRetentionDays: env.BACKUP_RETENTION_DAYS,
  maxBackupFiles: env.MAX_BACKUP_FILES,
  allowedOrigins: env.CORS_ORIGINS.split(','),
  
  // Derived paths
  csvPath: `${env.DATA_DIR}/questions.csv`,
  backupDir: `${env.DATA_DIR}/backup`,
} as const;
