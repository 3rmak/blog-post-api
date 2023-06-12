import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), 'configs', `.${process.env.NODE_ENV}.env`) });

const configService = new ConfigService();

export default new DataSource({
  type: configService.get<string>('DB_TYPE') as DataSourceOptions['type'],
  host: configService.get<string>('DB_HOST'),
  port: Number(configService.get('DB_PORT')),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: ['dist/**/*.entity{.js}'],
  migrations: [resolve(__dirname, 'migrations/*.{ts,js}')],
  migrationsRun: true,
} as DataSourceOptions);
