import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BlogModule } from '../blog/blog.module';

import { UserResolver } from './user.resolver';

import { UserService } from './user.service';

import { User } from './entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), BlogModule],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
