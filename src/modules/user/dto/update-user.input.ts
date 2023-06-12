import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, Length, Matches } from 'class-validator';

import { UserPasswordRegex } from '../entity/user.entity';

@InputType()
export class UpdateUserInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  fullName?: string;

  @IsOptional()
  @Length(8, 64, { message: 'password must be in range 8 to 64' })
  @Matches(UserPasswordRegex)
  @Field(() => String, { nullable: true })
  password?: string;
}
