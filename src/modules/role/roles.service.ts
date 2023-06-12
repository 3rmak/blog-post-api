import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './entity/role.entity';

import { RolesEnum } from './entity/roles.enum';

@Injectable()
export class RolesService {
  constructor(@InjectRepository(Role) private rolesRepository: Repository<Role>) {
    this.initRoles().then();
  }

  private async initRoles() {
    const rolesArrayValues = Object.values(RolesEnum).map((role) => ({ value: role }));
    await this.rolesRepository
      .createQueryBuilder()
      .insert()
      .values(rolesArrayValues)
      .orIgnore()
      .execute();
  }
}
