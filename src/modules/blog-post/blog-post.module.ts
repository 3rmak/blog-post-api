import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BlogModule } from '../blog/blog.module';
import { UserModule } from '../user/user.module';
import { S3Module } from '../../s3/s3.module';

import { BlogPostResolver } from './blog-post.resolver';

import { BlogPostService } from './blog-post.service';

import { BlogPost } from './entity/blog-post.entity';
import { Blog } from '../blog/entity/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, Blog]), BlogModule, UserModule, S3Module],
  providers: [BlogPostService, BlogPostResolver],
})
export class BlogPostModule {}
