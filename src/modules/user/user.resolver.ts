import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { VoidTypeDefinition } from 'graphql-scalars';

import { UserService } from './user.service';
import { GqlRolesGuard } from '../auth/gql-roles-guard.service';
import { GqlRoles } from '../auth/role-auth.decorator';
import { RequestUser } from '../../shared/decorators/user.decorator';

import { User } from './entity/user.entity';

import { CreateUserInput } from './dto/create-user.input';
import { PayloadUser } from '../../shared/payload-user.interface';
import { RolesEnum } from '../role/entity/roles.enum';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver('users')
export class UserResolver {
  constructor(private readonly usersService: UserService) {}

  @Mutation(() => User, { name: 'createUser' })
  public async createUser(@Args('createUserInput') body: CreateUserInput): Promise<User> {
    return await this.usersService.createUser(body);
  }

  @Mutation(() => User, { name: 'updateUserProfile' })
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER, RolesEnum.MODERATOR)
  public async updateUserProfile(
    @Args('updateUserInput') dto: UpdateUserInput,
    @RequestUser() user: PayloadUser,
  ): Promise<User> {
    return await this.usersService.updateUserProfile(user.id, dto);
  }

  @Mutation(() => VoidTypeDefinition, { name: 'deleteUserProfile' })
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER, RolesEnum.MODERATOR)
  public async deleteUserProfile(@RequestUser() user: PayloadUser): Promise<void> {
    return this.usersService.deleteProfile(user.id);
  }
}
