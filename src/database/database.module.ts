import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import * as process from 'process';

import { Blog } from '../modules/blog/entity/blog.entity';
import { BlogPost } from '../modules/blog-post/entity/blog-post.entity';
import { Role } from '../modules/role/entity/role.entity';
import { User } from '../modules/user/entity/user.entity';

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
              type: 'sqlite',
              host: configService.get<string>('DB_HOST'),
              port: Number(configService.get('DB_PORT')),
              username: configService.get<string>('DB_USERNAME'),
              password: configService.get<string>('DB_PASSWORD'),
              database: configService.get<string>('DB_NAME'),
              entities: [Blog, BlogPost, Role, User],
              migrations: this.getMigrationsPath(nodeEnv),
              migrationsRun: true,
              autoLoadEntities: true,
              synchronize: true,
            } as TypeOrmModuleOptions),
        }),
      ],
    };
  }

  private static getMigrationsPath(nodeEnv: string): string[] {
    const allMigrations = [resolve(process.cwd(), 'dist', 'database', 'migrations/*.js')];
    return nodeEnv === 'test' ? [] : allMigrations;
  }
}
