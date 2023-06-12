import { User } from '../../user/entity/user.entity';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthResponseDto {
  constructor(user: User, token: string) {
    this.user = user;
    this.token = token;
  }

  @Field(() => User)
  public user: User;

  @Field()
  public token: string;
}
