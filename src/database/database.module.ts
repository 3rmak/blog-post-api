import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';

@Module({})
export class DatabaseModule {
  static registerAsync(nodeEnv: string): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            ({
              type: configService.get<string>('DB_TYPE'),
              host: configService.get<string>('DB_HOST'),
              port: Number(configService.get('DB_PORT')),
              username: configService.get<string>('DB_USERNAME'),
              password: configService.get<string>('DB_PASSWORD'),
              database: configService.get<string>('DB_NAME'),
              entities: ['dist/modules/**/*.entity.js'],
              // migrations: this.getMigrationsPath(nodeEnv),
              // migrationsRun: true,
              autoLoadEntities: true,
              synchronize: true,
            } as TypeOrmModuleOptions),
        }),
      ],
    };
  }

  private static getMigrationsPath(nodeEnv: string): string[] {
    const allMigrations = [resolve(process.cwd(), 'src', 'database', 'migrations/*.ts')];
    console.log('allMigrations', allMigrations);
    return nodeEnv === 'test' ? [] : allMigrations;
  }
}
