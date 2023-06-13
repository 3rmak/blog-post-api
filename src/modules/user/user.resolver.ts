import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphQLVoid } from 'graphql-scalars';

import { UserService } from './user.service';
import { GqlRolesGuard } from '../auth/gql-roles-guard';
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

  @Mutation(() => User)
  public async createUser(@Args('createUserInput') body: CreateUserInput): Promise<User> {
    return await this.usersService.createWriterUser(body);
  }

  @Mutation(() => User)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.MODERATOR)
  public async createModeratorUser(@Args('createUserInput') body: CreateUserInput): Promise<User> {
    return await this.usersService.createModeratorUser(body);
  }

  @Mutation(() => User)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER, RolesEnum.MODERATOR)
  public async updateUserProfile(
    @Args('updateUserInput') dto: UpdateUserInput,
    @RequestUser() user: PayloadUser,
  ): Promise<User> {
    return await this.usersService.updateUserProfile('53231f78-13d6-11ed-861d-0242ac120002', dto);
  }

  @Mutation(() => GraphQLVoid)
  @UseGuards(GqlRolesGuard)
  @GqlRoles(RolesEnum.WRITER, RolesEnum.MODERATOR)
  public async deleteUserProfile(@RequestUser() user: PayloadUser): Promise<void> {
    return this.usersService.deleteProfile(user.id);
  }
}
