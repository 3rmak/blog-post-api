import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesService } from './roles.service';

import { Role } from './entity/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  exports: [RolesService],
  providers: [RolesService],
})
export class RolesModule {}
