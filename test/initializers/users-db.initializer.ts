import { NotImplementedException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { AuthService } from '../../src/modules/auth/auth.service';
import { UserService } from '../../src/modules/user/user.service';

import { User } from '../../src/modules/user/entity/user.entity';

import { CreateUserInput } from '../../src/modules/user/dto/create-user.input';
import { RolesEnum } from '../../src/modules/role/entity/roles.enum';

export class UsersDbInitializer {
  constructor(private usersService: UserService, private authService: AuthService) {}

  private static performDto(): CreateUserInput {
    const uuid = randomUUID();
    return {
      email: `user${uuid}@email.com`,
      password: 'password',
    };
  }

  public async initUsers(userCount: number, role: RolesEnum): Promise<User[]> {
    const users: User[] = [];
    const createUserFn = this.getUserCreatingStrategyAccordingToRole(role);

    for (let i = 0; i < userCount; i++) {
      const user = await createUserFn(UsersDbInitializer.performDto());
      user.password = await this.authService.generateToken(user);
      users.push(user);
    }

    return users;
  }

  private getUserCreatingStrategyAccordingToRole(role: RolesEnum) {
    if (role == RolesEnum.WRITER) {
      return this.usersService.createWriterUser.bind(this.usersService);
    }

    if (role == RolesEnum.MODERATOR) {
      return this.usersService.createModeratorUser.bind(this.usersService);
    }

    throw new NotImplementedException(`Can't init user with role: ${role}`);
  }
}
