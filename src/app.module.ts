import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { resolve } from 'path';

import { AuthModule } from './modules/auth/auth.module';
import { BlogPostModule } from './modules/blog-post/blog-post.module';
import { BlogModule } from './modules/blog/blog.module';
import { UserModule } from './modules/user/user.module';
import { RolesModule } from './modules/role/roles.module';
import { DatabaseModule } from './database/database.module';
import { S3Module } from './s3/s3.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve(process.cwd(), 'configs', `.${process.env.NODE_ENV}.env`),
      isGlobal: true,
    }),
    DatabaseModule.registerAsync(process.env.NODE_ENV),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: true,
    }),
    S3Module.registerAsync(),
    AuthModule,
    RolesModule,
    BlogPostModule,
    BlogModule,
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
