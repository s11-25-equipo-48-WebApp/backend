import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

interface TYPE_NODE_ENV {
    development: string;
    production: string;
    test: string;
}

export class ConfigEnvs {
    static PORT: number = Number(process.env.PORT) || 3000;
    static NODE_ENV: string = process.env.NODE_ENV || 'development';
    static DATABASE_URL: string = process.env.DATABASE_URL as string;
    static JWT_SECRET: string = process.env.JWT_SECRET as string;
    static SENTRY_DSN: string = process.env.SENTRY_DSN as string;
    static JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1h';
    static JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET as string;
}

if (ConfigEnvs.NODE_ENV === 'development') {
  Logger.log('Environment variables loaded successfully');
}

export default ConfigEnvs;
