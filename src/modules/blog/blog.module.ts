import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BlogResolver } from './blog.resolver';

import { BlogService } from './blog.service';

import { Blog } from './entity/blog.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Blog])],
  providers: [BlogService, BlogResolver],
  exports: [BlogService],
})
export class BlogModule {}
