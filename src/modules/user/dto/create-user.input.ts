import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

import { UserPasswordRegex } from '../entity/user.entity';

@InputType()
export class CreateUserInput {
  @IsNotEmpty()
  @IsEmail({}, { message: 'email address is not valid' })
  @Field(() => String)
  public email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 64, { message: 'password must be in range 8 to 64' })
  @Matches(UserPasswordRegex)
  @Field(() => String)
  public password: string;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  public fullName?: string;
}
